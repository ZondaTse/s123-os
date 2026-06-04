'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, 'p_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET /api/products?status=sleeping
router.get('/', auth, (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.status) { conditions.push('lifecycle_status=?'); params.push(req.query.status); }
  if (req.query.q) { conditions.push('(name LIKE ? OR sku LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY updated_at DESC`).all(...params);
  res.json({ products: rows });
});

// GET /api/products/:id  (with linked contents)
router.get('/:id', auth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  const contents = db.prepare(`
    SELECT c.*, u.name as owner_name FROM contents c
    JOIN content_products cp ON cp.content_id = c.id
    JOIN users u ON c.owner_id = u.id
    WHERE cp.product_id=? ORDER BY c.created_at DESC
  `).all(req.params.id);
  res.json({ product, contents });
});

// POST /api/products
router.post('/', auth, upload.single('image'), (req, res) => {
  const { sku, name, stock, cost, price, lifecycle_status } = req.body;
  if (!sku || !name) return res.status(400).json({ error: '款号和名称必填' });
  const image_url = req.file ? '/uploads/' + req.file.filename : null;
  const result = db.prepare(`
    INSERT INTO products (sku,name,image_url,stock,cost,price,lifecycle_status)
    VALUES (?,?,?,?,?,?,?)
  `).run(sku, name, image_url, stock||0, cost||0, price||0, lifecycle_status||'new');
  res.json({ product: db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid) });
});

// PUT /api/products/:id
router.put('/:id', auth, upload.single('image'), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  const { name, stock, cost, price, lifecycle_status } = req.body;
  const image_url = req.file ? '/uploads/' + req.file.filename : product.image_url;
  db.prepare(`
    UPDATE products SET
      name = COALESCE(?,name),
      image_url = ?,
      stock = COALESCE(?,stock),
      cost = COALESCE(?,cost),
      price = COALESCE(?,price),
      lifecycle_status = COALESCE(?,lifecycle_status),
      updated_at = datetime('now','localtime')
    WHERE id=?
  `).run(name||null, image_url, stock!=null?Number(stock):null, cost!=null?Number(cost):null,
         price!=null?Number(price):null, lifecycle_status||null, req.params.id);
  res.json({ product: db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id) });
});

module.exports = router;
