'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { awardExp } = require('../middleware/exp');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, 'c_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const contentWithOwner = `
  SELECT c.*, u.name as owner_name, u.avatar_url as owner_avatar
  FROM contents c JOIN users u ON c.owner_id = u.id
`;

// GET /api/contents?mine=1&status=researching
router.get('/', auth, (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.mine === '1') { conditions.push('c.owner_id=?'); params.push(req.user.id); }
  if (req.query.status) { conditions.push('c.status=?'); params.push(req.query.status); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`${contentWithOwner} ${where} ORDER BY c.id DESC`).all(...params);
  // attach linked products
  const linked = db.prepare(`
    SELECT cp.content_id, p.id, p.sku, p.name, p.image_url
    FROM content_products cp JOIN products p ON cp.product_id=p.id
  `).all();
  const map = {};
  for (const l of linked) {
    if (!map[l.content_id]) map[l.content_id] = [];
    map[l.content_id].push(l);
  }
  res.json({ contents: rows.map(r => ({ ...r, products: map[r.id] || [] })) });
});

// GET /api/contents/:id
router.get('/:id', auth, (req, res) => {
  const content = db.prepare(`${contentWithOwner} WHERE c.id=?`).get(req.params.id);
  if (!content) return res.status(404).json({ error: '不存在' });
  const products = db.prepare(`
    SELECT p.* FROM products p
    JOIN content_products cp ON cp.product_id=p.id
    WHERE cp.content_id=?
  `).all(req.params.id);
  res.json({ content: { ...content, products } });
});

// POST /api/contents
router.post('/', auth, upload.single('screenshot'), (req, res) => {
  const { title, douyin_url, boom_analysis, why_research, exec_plan } = req.body;
  const screenshot_url = req.file ? '/uploads/' + req.file.filename : req.body.screenshot_url || null;
  const result = db.prepare(`
    INSERT INTO contents (owner_id,title,douyin_url,screenshot_url,boom_analysis,why_research,exec_plan)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.user.id, title||'', douyin_url||null, screenshot_url, boom_analysis||null, why_research||null, exec_plan||null);
  awardExp(req.user.id, 'add_content');
  const content = db.prepare(`${contentWithOwner} WHERE c.id=?`).get(result.lastInsertRowid);
  res.json({ content });
});

// PUT /api/contents/:id
router.put('/:id', auth, upload.single('screenshot'), (req, res) => {
  const content = db.prepare('SELECT * FROM contents WHERE id=?').get(req.params.id);
  if (!content) return res.status(404).json({ error: '不存在' });
  const { title, douyin_url, boom_analysis, why_research, exec_plan, exec_result, summary, status } = req.body;
  const screenshot_url = req.file ? '/uploads/' + req.file.filename : content.screenshot_url;
  db.prepare(`
    UPDATE contents SET
      title = COALESCE(?,title), douyin_url = COALESCE(?,douyin_url),
      screenshot_url = ?, boom_analysis = COALESCE(?,boom_analysis),
      why_research = COALESCE(?,why_research), exec_plan = COALESCE(?,exec_plan),
      exec_result = COALESCE(?,exec_result), summary = COALESCE(?,summary),
      status = COALESCE(?,status)
    WHERE id=?
  `).run(title||null, douyin_url||null, screenshot_url, boom_analysis||null,
         why_research||null, exec_plan||null, exec_result||null, summary||null, status||null, req.params.id);
  // if summary written, award exp
  if (summary) awardExp(req.user.id, 'add_experience');
  const updated = db.prepare(`${contentWithOwner} WHERE c.id=?`).get(req.params.id);
  res.json({ content: updated });
});

// POST /api/contents/:id/products  (link product)
router.post('/:id/products', auth, (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: '缺少 product_id' });
  db.prepare('INSERT OR IGNORE INTO content_products (content_id,product_id) VALUES (?,?)').run(req.params.id, product_id);
  res.json({ ok: true });
});

// DELETE /api/contents/:id/products/:pid
router.delete('/:id/products/:pid', auth, (req, res) => {
  db.prepare('DELETE FROM content_products WHERE content_id=? AND product_id=?').run(req.params.id, req.params.pid);
  res.json({ ok: true });
});

// POST /api/contents/:id/to-experience
router.post('/:id/to-experience', auth, (req, res) => {
  const content = db.prepare('SELECT * FROM contents WHERE id=?').get(req.params.id);
  if (!content) return res.status(404).json({ error: '不存在' });
  const result = db.prepare(
    'INSERT INTO experiences (creator_id,title,content) VALUES (?,?,?)'
  ).run(req.user.id, req.body.title || content.title, content.summary || content.exec_result || '');
  awardExp(req.user.id, 'add_experience');
  res.json({ experience_id: result.lastInsertRowid });
});

module.exports = router;
