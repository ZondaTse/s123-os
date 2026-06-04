'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { awardExp } = require('../middleware/exp');
const { db } = require('../db');

const taskWithUser = `
  SELECT t.*, 
    a.name as assignee_name, a.avatar_url as assignee_avatar,
    c.name as creator_name,
    p.name as product_name, p.sku as product_sku
  FROM tasks t
  LEFT JOIN users a ON t.assignee_id = a.id
  LEFT JOIN users c ON t.creator_id = c.id
  LEFT JOIN products p ON t.product_id = p.id
`;

// GET /api/tasks?mine=1&date=today&status=todo
router.get('/', auth, (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.mine === '1') { conditions.push('t.assignee_id = ?'); params.push(req.user.id); }
  if (req.query.date === 'today') {
    conditions.push("date(t.created_at) = date('now','localtime')");
  }
  if (req.query.status) { conditions.push('t.status = ?'); params.push(req.query.status); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`${taskWithUser} ${where} ORDER BY t.id DESC`).all(...params);
  res.json({ tasks: rows });
});

// POST /api/tasks
router.post('/', auth, (req, res) => {
  const { title, assignee_id, product_id, due_date, source = 'manual' } = req.body;
  if (!title) return res.status(400).json({ error: '请填写任务标题' });
  const result = db.prepare(
    'INSERT INTO tasks (title,creator_id,assignee_id,product_id,due_date,source) VALUES (?,?,?,?,?,?)'
  ).run(title, req.user.id, assignee_id || req.user.id, product_id || null, due_date || null, source);
  const task = db.prepare(`${taskWithUser} WHERE t.id=?`).get(result.lastInsertRowid);
  res.json({ task });
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const { title, status, assignee_id, product_id, due_date } = req.body;
  const wasNotDone = task.status !== 'done';
  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?,title),
      status = COALESCE(?,status),
      assignee_id = COALESCE(?,assignee_id),
      product_id = COALESCE(?,product_id),
      due_date = COALESCE(?,due_date)
    WHERE id=?
  `).run(title||null, status||null, assignee_id||null, product_id||null, due_date||null, req.params.id);
  if (status === 'done' && wasNotDone) awardExp(req.user.id, 'complete_task');
  const updated = db.prepare(`${taskWithUser} WHERE t.id=?`).get(req.params.id);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.creator_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: '无权限' });
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
