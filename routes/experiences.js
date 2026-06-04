'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { awardExp } = require('../middleware/exp');
const { db } = require('../db');

const expWithUser = `
  SELECT e.*, u.name as creator_name, u.avatar_url as creator_avatar,
    p.name as product_name, p.sku as product_sku
  FROM experiences e
  JOIN users u ON e.creator_id = u.id
  LEFT JOIN products p ON e.product_id = p.id
`;

// GET /api/experiences?mine=1&status=pending
router.get('/', auth, (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.mine === '1') { conditions.push('e.creator_id=?'); params.push(req.user.id); }
  if (req.query.status) { conditions.push('e.status=?'); params.push(req.query.status); }
  if (req.query.q) { conditions.push('(e.title LIKE ? OR e.content LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`${expWithUser} ${where} ORDER BY e.id DESC`).all(...params);
  res.json({ experiences: rows });
});

// POST /api/experiences
router.post('/', auth, (req, res) => {
  const { title, content, product_id, exp_date } = req.body;
  if (!title) return res.status(400).json({ error: '标题必填' });
  const result = db.prepare(
    'INSERT INTO experiences (creator_id,title,content,product_id,exp_date) VALUES (?,?,?,?,?)'
  ).run(req.user.id, title, content||'', product_id||null, exp_date||null);
  awardExp(req.user.id, 'add_experience');
  const exp = db.prepare(`${expWithUser} WHERE e.id=?`).get(result.lastInsertRowid);
  res.json({ experience: exp });
});

// PUT /api/experiences/:id
router.put('/:id', auth, (req, res) => {
  const { title, content, product_id, status, exp_date } = req.body;
  db.prepare(`
    UPDATE experiences SET
      title = COALESCE(?,title), content = COALESCE(?,content),
      product_id = COALESCE(?,product_id), status = COALESCE(?,status),
      exp_date = COALESCE(?,exp_date)
    WHERE id=?
  `).run(title||null, content||null, product_id||null, status||null, exp_date||null, req.params.id);
  const updated = db.prepare(`${expWithUser} WHERE e.id=?`).get(req.params.id);
  res.json({ experience: updated });
});

module.exports = router;
