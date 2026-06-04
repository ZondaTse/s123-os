'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { awardExp } = require('../middleware/exp');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/messages?before=<id>&limit=30
router.get('/', auth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const before = parseInt(req.query.before) || 999999999;
  const rows = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id < ?
    ORDER BY m.id DESC LIMIT ?
  `).all(before, limit);
  res.json({ messages: rows.reverse() });
});

// POST /api/messages  (text)
router.post('/', auth, (req, res) => {
  const { type = 'text', content = '', ref_id, ref_type } = req.body;
  const result = db.prepare(
    'INSERT INTO messages (sender_id,type,content,ref_id,ref_type) VALUES (?,?,?,?,?)'
  ).run(req.user.id, type, content, ref_id || null, ref_type || null);
  awardExp(req.user.id, 'send_message');
  const msg = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
    FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?
  `).get(result.lastInsertRowid);
  res.json({ message: msg });
});

// POST /api/messages/upload  (image / voice / file)
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '文件为空' });
  const type = req.body.type || 'image';
  const content = '/uploads/' + req.file.filename;
  const result = db.prepare(
    'INSERT INTO messages (sender_id,type,content) VALUES (?,?,?)'
  ).run(req.user.id, type, content);
  awardExp(req.user.id, 'send_message');
  const msg = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
    FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?
  `).get(result.lastInsertRowid);
  res.json({ message: msg });
});

// POST /api/messages/:id/to-task
router.post('/:id/to-task', auth, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  const result = db.prepare(
    'INSERT INTO tasks (title,creator_id,source,assignee_id) VALUES (?,?,?,?)'
  ).run(msg.content.slice(0, 100), req.user.id, 'message', req.body.assignee_id || req.user.id);
  res.json({ task_id: result.lastInsertRowid });
});

// POST /api/messages/:id/to-experience
router.post('/:id/to-experience', auth, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  const result = db.prepare(
    'INSERT INTO experiences (creator_id,title,content) VALUES (?,?,?)'
  ).run(req.user.id, req.body.title || msg.content.slice(0, 50), msg.content);
  awardExp(req.user.id, 'add_experience');
  res.json({ experience_id: result.lastInsertRowid });
});

// DELETE /api/messages/:id  (own messages only, admin can delete all)
router.delete('/:id', auth, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  if (msg.sender_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: '无权限' });
  db.prepare('DELETE FROM messages WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/messages/users  (member list for @)
router.get('/users', auth, (req, res) => {
  const users = db.prepare('SELECT id,name,role,avatar_url FROM users ORDER BY name').all();
  res.json({ users });
});

module.exports = router;
