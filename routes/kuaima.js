'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');
const https = require('https');
const crypto = require('crypto');

const KM_APPKEY  = process.env.KM_APPKEY  || '25795669';
const KM_SECRET  = process.env.KM_SECRET  || 'c8a3cfaef38b4efd814eae9d2f2260b9';
const KM_SESSION = process.env.KM_SESSION || 'e7af4f59706d452fa44f85c8cdf4d767';
const KM_GATEWAY = 'gw.superboss.cc';

function nowStamp() {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
}

function kuaimaiSign(params, method = 'hmac') {
  const keys = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== null && params[k] !== undefined && params[k] !== '')
    .sort();
  let base = '';
  for (const k of keys) base += k + params[k];
  if (method === 'hmac-sha256') {
    return crypto.createHmac('sha256', KM_SECRET).update(base).digest('hex').toUpperCase();
  }
  // 默认 hmac (hmac-md5)
  return crypto.createHmac('md5', KM_SECRET).update(base).digest('hex').toUpperCase();
}

function kuaimaiRequest(method, extraParams, signMethod = 'hmac') {
  return new Promise((resolve, reject) => {
    const params = {
      method,
      appKey: KM_APPKEY,
      session: KM_SESSION,
      timestamp: nowStamp(),
      format: 'json',
      version: '1.0',
      sign_method: signMethod,
      ...extraParams,
    };
    params.sign = kuaimaiSign(params, signMethod);

    const body = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');

    const req = https.request({
      hostname: KM_GATEWAY,
      path: '/router',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('快麦返回非JSON: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('快麦请求超时')); });
    req.write(body);
    req.end();
  });
}

// ── 快麦商品索引缓存 ──────────────────────────────────────────
// 把所有商品的 outerId/title 拉到本地 km_item_index 表，供模糊搜索用
let _indexSyncing = false;

async function syncKmIndex() {
  if (_indexSyncing) return;
  _indexSyncing = true;
  try {
    const upsert = db.prepare(
      'INSERT OR REPLACE INTO km_item_index (outer_id, sys_item_id, title, synced_at) VALUES (?,?,?,datetime(\'now\',\'localtime\'))'
    );
    let pageNo = 1;
    const pageSize = 100;
    let total = null;
    let fetched = 0;
    do {
      const data = await kuaimaiRequest('item.list.query', { pageNo, pageSize }, 'hmac');
      if (!data.success) {
        console.error('km sync page', pageNo, 'failed:', data.code, data.msg);
        break;
      }
      const items = data.items || [];
      if (total === null) total = data.total || 0;
      console.log(`km sync page ${pageNo}/${Math.ceil(total/pageSize)}: ${items.length} items, total=${total}`);
      const ins = db.transaction(list => {
        for (const i of list) {
          if (i.outerId) upsert.run(i.outerId, String(i.sysItemId || ''), i.title || null);
        }
      });
      ins(items);
      fetched += items.length;
      pageNo++;
      if (items.length < pageSize) break;
    } while (fetched < total);
    console.log(`✅ km_item_index synced: ${fetched} items`);
  } catch(e) {
    console.error('km_item_index sync error:', e.message);
  } finally {
    _indexSyncing = false;
  }
}

// 启动5秒后立即同步一次
setTimeout(syncKmIndex, 5000);
// 每天 00:00 定时同步
function scheduleDailySync() {
  const now = new Date(Date.now() + 8 * 3600000); // CST
  const msUntilMidnight =
    ((24 - now.getUTCHours()) * 3600 - now.getUTCMinutes() * 60 - now.getUTCSeconds()) * 1000;
  setTimeout(() => {
    syncKmIndex();
    setInterval(syncKmIndex, 24 * 3600 * 1000);
  }, msUntilMidnight);
  console.log(`⏰ 快麦索引将在 ${Math.round(msUntilMidnight/60000)} 分钟后每日定时同步`);
}
scheduleDailySync();

// GET /api/kuaima/sync-index (手动触发重新同步)
router.post('/sync-index', auth, (req, res) => {
  syncKmIndex();
  res.json({ ok: true, message: '索引同步已启动，约需1-2分钟' });
});

// GET /api/kuaima/index-status (查看索引状态)
router.get('/index-status', auth, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM km_item_index').get();
  const sample = db.prepare('SELECT outer_id, title FROM km_item_index LIMIT 5').all();
  res.json({ count: count.n, syncing: _indexSyncing, sample });
});

// GET /api/kuaima/goods?sku=xxx
// 查询商品信息
// 流程：
//   1. item.list.query (sysOuterId模糊匹配) → 商品名/价格/图片/SKU列表
//   2. erp.item.warehouse.list.get (outerId精确) → 各SKU库存
router.get('/goods', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供款号' });

  try {
    // Step 1: 本地索引查找 outerId（包含输入款号的）
    const skuUpper = sku.toUpperCase();
    const idxRows = db.prepare(
      "SELECT outer_id, title FROM km_item_index WHERE UPPER(outer_id) LIKE ? LIMIT 10"
    ).all('%' + skuUpper + '%');

    let outerId = '';
    if (idxRows.length) {
      // 优先精确包含，取第一条
      outerId = idxRows[0].outer_id;
    }

    // Step 1b: 查商品详情
    let g = null;
    const queryOuterId = outerId || sku; // 本地找到用outerId，否则直接用输入值试试

    // 先用 outerId 精确查（支持完整编码如 S123-2603SK4228）
    const directData = await kuaimaiRequest('item.list.query', {
      outerId: queryOuterId,
      pageNo: 1,
      pageSize: 10,
    }, 'hmac');
    if (directData.success && (directData.items || []).length) {
      const all = (directData.items || []).filter(i => i.isSkuItem === 1);
      // 优先精确匹配
      g = all.find(i => (i.outerId || '').toUpperCase() === queryOuterId.toUpperCase())
        || all.find(i => (i.outerId || '').toUpperCase().includes(skuUpper))
        || all[0] || null;
      if (g) outerId = g.outerId || '';
    }

    // 还没找到，用 sysOuterId 再试
    if (!g) {
      const itemData = await kuaimaiRequest('item.list.query', {
        sysOuterId: sku,
        pageNo: 1,
        pageSize: 20,
      }, 'hmac');
      if (itemData.success) {
        const allActive = (itemData.items || []).filter(i => i.isSkuItem === 1 && i.activeStatus === 1);
        const matched = allActive.filter(i => (i.outerId || '').toUpperCase().includes(skuUpper));
        g = matched[0] || null;
        if (g) outerId = g.outerId || '';
      }
    }

    if (!g) return res.json({ found: false, message: '快麦未找到含"' + sku + '"的款号，请等待索引同步完成（约2分钟）' });

    // Step 2: warehouse接口拿库存（用精确 outerId）
    let stockMap = {}; // skuOuterId -> stock
    let totalStock = 0;
    try {
      const warehouseData = await kuaimaiRequest('erp.item.warehouse.list.get', {
        outerId: outerId,
        pageNo: 1,
        pageSize: 50,
      }, 'hmac');
      if (warehouseData.success && (warehouseData.skus || []).length) {
        for (const s of warehouseData.skus) {
          const mainW = (s.mainWareHousesStock || []).find(w => w.code === 'A') || s.mainWareHousesStock[0] || {};
          const stock = mainW.totalAvailableStock || 0;
          stockMap[s.skuOuterId] = stock;
          totalStock += stock;
        }
      }
    } catch(e) {
      // 库存查询失败不影响主流程
    }

    // 组装SKU列表
    const skus = (g.skus || []).map(s => ({
      sku_id: String(s.sysSkuId || ''),
      sku_outer_id: s.skuOuterId || '',
      properties: s.propertiesName || '',
      color: s.propColor || '',
      size: s.propOther || '',
      price: parseFloat(s.priceOutput || g.priceOutput || 0),
      cost: parseFloat(s.purchasePrice || g.purchasePrice || 0),
      image_url: s.skuPicPath || g.picPath || null,
      stock: stockMap[s.skuOuterId] !== undefined ? stockMap[s.skuOuterId] : null,
    }));

    // 如果没有SKU（isSkuItem但skus为空），用stockMap总量
    if (!skus.length) totalStock = Object.values(stockMap).reduce((a, b) => a + b, 0);

    res.json({
      found: true,
      outer_id: outerId,
      sys_item_id: String(g.sysItemId || ''),
      name: g.title || sku,
      short_title: g.shortTitle || null,
      price: parseFloat(g.priceOutput || 0),
      cost: parseFloat(g.purchasePrice || 0),
      image_url: g.picPath && !g.picPath.includes('no_pic') ? g.picPath : null,
      stock: totalStock,
      skus,
      _matched_total: 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/kuaima/sync-product
// 同步快麦商品数据到本地products表
router.post('/sync-product', auth, async (req, res) => {
  const { product_id, sku } = req.body;
  if (!product_id || !sku) return res.status(400).json({ error: '缺少参数' });

  try {
    // 先查本地索引找精确outerId
    const skuU = sku.toUpperCase();
    const idxRow = db.prepare("SELECT outer_id FROM km_item_index WHERE UPPER(outer_id) LIKE ? LIMIT 1").get('%' + skuU + '%');
    const queryOuterId = idxRow ? idxRow.outer_id : sku;

    const itemData = await kuaimaiRequest('item.list.query', {
      outerId: queryOuterId,
      pageNo: 1,
      pageSize: 10,
    }, 'hmac');

    if (!itemData.success) return res.status(400).json({ error: itemData.msg || '快麦查询失败' });

    const allA = (itemData.items || []).filter(i => i.isSkuItem === 1 && i.activeStatus === 1);
    let items = allA.filter(i => (i.outerId || '').toUpperCase().includes(skuU));
    if (!items.length) items = allA;
    if (!items.length) return res.json({ found: false, message: '快麦未找到该款号' });

    const g = items[0];

    // 拿库存
    let totalStock = 0;
    let stockBySkuId = {};
    try {
      const wd = await kuaimaiRequest('erp.item.warehouse.list.get', { outerId: g.outerId, pageNo: 1, pageSize: 50 }, 'hmac');
      if (wd.success) {
        for (const s of (wd.skus || [])) {
          const mw = (s.mainWareHousesStock || []).find(w => w.code === 'A') || s.mainWareHousesStock[0] || {};
          const stock = mw.totalAvailableStock || 0;
          stockBySkuId[s.skuOuterId] = stock;
          totalStock += stock;
        }
      }
    } catch(e) {}

    const name = g.title || sku;
    const price = parseFloat(g.priceOutput || 0);
    const cost = parseFloat(g.purchasePrice || 0);
    const image_url = g.picPath && !g.picPath.includes('no_pic') ? g.picPath : null;

    // 组装skus_json
    const skusJson = JSON.stringify((g.skus||[]).map(s=>({
      sku_outer_id: s.skuOuterId||s.skuOuterId||'',
      properties: s.propertiesName||s.properties||'',
      stock: stockBySkuId[s.skuOuterId]||0,
      price: parseFloat(s.priceOutput||g.priceOutput||0),
    })));
    const updates = ['name=?', 'price=?', 'cost=?', 'stock=?', 'skus_json=?', 'updated_at=datetime(\'now\',\'localtime\')'];
    const params = [name, price, cost, totalStock, skusJson];
    if (image_url) { updates.push('image_url=?'); params.push(image_url); }
    params.push(product_id);

    db.prepare(`UPDATE products SET ${updates.join(',')} WHERE id=?`).run(...params);
    const updated = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
    res.json({ found: true, product: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/kuaima/restart-server (管理员重启服务)
router.post('/restart-server', auth, (req, res) => {
  res.json({ ok: true, message: '服务重启中…' });
  setTimeout(() => {
    const { execSync } = require('child_process');
    try { execSync('pm2 restart s123', { stdio: 'inherit' }); } catch(e) {}
  }, 300);
});

module.exports = router;

// 临时调试：GET /api/kuaima/debug?sku=xxx 返回所有尝试的原始结果

router.get('/debug', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供sku参数' });
  const results = [];
  for (const method of ['erp.item.list.query', 'erp.item.single.get']) {
    for (const [key, val] of [['sysOuterId', sku], ['outerId', sku]]) {
      try {
        const data = await kuaimaiRequest(method, { [key]: val, pageNo: 1, pageSize: 3 }, 'hmac');
        const list = data.items || data.goodsList || data.list || [];
        results.push({ method, key, val, success: data.success, code: data.code, msg: data.msg, count: list.length, sample: list[0] || null });
      } catch(e) {
        results.push({ method, key, val, error: e.message });
      }
    }
  }
  res.json({ results });
});
