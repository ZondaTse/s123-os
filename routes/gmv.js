'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');

const upload = multer({ dest: path.join(__dirname, '../public/uploads') });
const GMV_TARGET = parseFloat(process.env.GMV_TARGET_1 || 250000);
const PROFIT_RATE = parseFloat(process.env.GMV_PROFIT_RATE || 0.20);

// GET /api/gmv/today
router.get('/today', auth, (req, res) => {
  const today = new Date().toLocaleDateString('sv');
  const report = db.prepare('SELECT * FROM daily_reports WHERE report_date=?').get(today);
  const gmv = report ? report.gmv : 0;
  const target = GMV_TARGET / 30;
  res.json({
    date: today,
    gmv,
    target_daily: Math.round(target),
    completion_rate: target > 0 ? Math.round(gmv / target * 100) : 0,
    report: report || null
  });
});

// GET /api/gmv/monthly
router.get('/monthly', auth, (req, res) => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const rows = db.prepare(
    "SELECT * FROM daily_reports WHERE report_date LIKE ? ORDER BY report_date"
  ).all(ym + '%');
  const gmv = rows.reduce((s, r) => s + r.gmv, 0);
  const days_in_month = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const day = now.getDate();
  const projected = day > 0 ? gmv / day * days_in_month : 0;
  res.json({
    month: ym,
    gmv: Math.round(gmv),
    target: GMV_TARGET,
    completion_rate: Math.round(gmv / GMV_TARGET * 100),
    projected_eom: Math.round(projected),
    projected_profit: Math.round(projected * PROFIT_RATE),
    profit_rate: PROFIT_RATE,
    daily: rows
  });
});

// GET /api/gmv/rankings
router.get('/rankings', auth, (req, res) => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const products = db.prepare(`
    SELECT p.id, p.sku, p.name, p.image_url, p.price, p.stock, p.lifecycle_status,
      COALESCE(SUM(g.amount),0) as gmv,
      COUNT(g.id) as records
    FROM products p
    LEFT JOIN gmv_records g ON g.product_id=p.id AND g.record_date LIKE ?
    GROUP BY p.id ORDER BY gmv DESC LIMIT 20
  `).all(ym + '%');
  res.json({ products });
});

// POST /api/gmv/records  (manual entry)
router.post('/records', auth, (req, res) => {
  const { product_id, amount, record_date } = req.body;
  if (!amount) return res.status(400).json({ error: '金额必填' });
  const date = record_date || new Date().toLocaleDateString('sv');
  const result = db.prepare(
    'INSERT INTO gmv_records (user_id,product_id,amount,record_date) VALUES (?,?,?,?)'
  ).run(req.user.id, product_id||null, Number(amount), date);
  res.json({ id: result.lastInsertRowid });
});

// POST /api/gmv/upload-excel  (upload daily report xlsx)
router.post('/upload-excel', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传文件' });
  try {
    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: 0 });
    if (!rows.length) return res.status(400).json({ error: '文件为空' });

    // Flexible column mapping - try common Chinese column names
    const colMap = {
      gmv:              ['GMV','成交金额','营业额','gmv'],
      order_count:      ['订单数','订单量','order_count'],
      visitor_count:    ['访客数','UV','访客','visitor_count'],
      conversion_count: ['成交件数','成交数量','conversion_count'],
      conversion_rate:  ['转化率','conversion_rate'],
      roi:              ['ROI','roi'],
      gpm:              ['GPM','千次成交额','gpm'],
      refund_rate:      ['退货率','refund_rate'],
      ad_spend:         ['投流消耗','广告费','ad_spend'],
      report_date:      ['日期','date','report_date'],
    };
    const pick = (row, keys) => {
      for (const k of keys) if (row[k] !== undefined) return row[k];
      return 0;
    };

    const stmt = db.prepare(`
      INSERT INTO daily_reports
        (uploader_id,report_date,gmv,order_count,visitor_count,conversion_count,
         conversion_rate,roi,gpm,refund_rate,ad_spend)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(report_date) DO UPDATE SET
        gmv=excluded.gmv, order_count=excluded.order_count,
        visitor_count=excluded.visitor_count, conversion_count=excluded.conversion_count,
        conversion_rate=excluded.conversion_rate, roi=excluded.roi, gpm=excluded.gpm,
        refund_rate=excluded.refund_rate, ad_spend=excluded.ad_spend,
        uploader_id=excluded.uploader_id
    `);

    let count = 0;
    for (const row of rows) {
      const dateRaw = pick(row, colMap.report_date);
      if (!dateRaw) continue;
      // normalize date to YYYY-MM-DD
      let date;
      if (typeof dateRaw === 'number') {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(dateRaw);
        date = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
      } else {
        date = String(dateRaw).slice(0,10);
      }
      const gmv = parseFloat(pick(row, colMap.gmv)) || 0;
      if (!gmv) continue;
      stmt.run(req.user.id, date, gmv,
        parseInt(pick(row, colMap.order_count))||0,
        parseInt(pick(row, colMap.visitor_count))||0,
        parseInt(pick(row, colMap.conversion_count))||0,
        parseFloat(pick(row, colMap.conversion_rate))||0,
        parseFloat(pick(row, colMap.roi))||0,
        parseFloat(pick(row, colMap.gpm))||0,
        parseFloat(pick(row, colMap.refund_rate))||0,
        parseFloat(pick(row, colMap.ad_spend))||0
      );
      count++;
    }
    // push system message to group
    const today = new Date().toLocaleDateString('sv');
    const todayReport = db.prepare('SELECT * FROM daily_reports WHERE report_date=?').get(today);
    if (todayReport) {
      db.prepare('INSERT INTO messages (sender_id,type,content,ref_type,ref_id) VALUES (?,?,?,?,?)')
        .run(req.user.id, 'system',
          JSON.stringify({ type: 'daily_report', date: today, gmv: todayReport.gmv, order_count: todayReport.order_count, visitor_count: todayReport.visitor_count, conversion_rate: todayReport.conversion_rate }),
          'report', todayReport.id
        );
    }
    res.json({ ok: true, imported: count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '解析失败: ' + e.message });
  }
});

module.exports = router;
