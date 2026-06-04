'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');

const planWithUser = `
  SELECT pl.*, u.name as creator_name, p.name as product_name, p.sku as product_sku
  FROM plans pl
  JOIN users u ON pl.creator_id = u.id
  LEFT JOIN products p ON pl.product_id = p.id
`;

// GET /api/plans?type=shooting&date=today
router.get('/', auth, (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.type) { conditions.push('pl.type=?'); params.push(req.query.type); }
  if (req.query.date === 'today') {
    conditions.push("pl.plan_date = date('now','localtime')");
  } else if (req.query.date) {
    conditions.push('pl.plan_date=?'); params.push(req.query.date);
  }
  if (req.query.status) { conditions.push('pl.status=?'); params.push(req.query.status); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`${planWithUser} ${where} ORDER BY pl.plan_date, pl.id DESC`).all(...params);
  res.json({ plans: rows });
});

// POST /api/plans
router.post('/', auth, (req, res) => {
  const { type, title, description, product_id, plan_date } = req.body;
  if (!type || !title) return res.status(400).json({ error: '类型和标题必填' });
  const result = db.prepare(
    'INSERT INTO plans (type,title,description,creator_id,product_id,plan_date) VALUES (?,?,?,?,?,?)'
  ).run(type, title, description||null, req.user.id, product_id||null, plan_date||null);
  const plan = db.prepare(`${planWithUser} WHERE pl.id=?`).get(result.lastInsertRowid);
  res.json({ plan });
});

// PUT /api/plans/:id
router.put('/:id', auth, (req, res) => {
  const { title, description, product_id, plan_date, status } = req.body;
  db.prepare(`
    UPDATE plans SET
      title = COALESCE(?,title), description = COALESCE(?,description),
      product_id = COALESCE(?,product_id), plan_date = COALESCE(?,plan_date),
      status = COALESCE(?,status)
    WHERE id=?
  `).run(title||null, description||null, product_id||null, plan_date||null, status||null, req.params.id);
  const plan = db.prepare(`${planWithUser} WHERE pl.id=?`).get(req.params.id);
  res.json({ plan });
});

// DELETE /api/plans/:id
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM plans WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
