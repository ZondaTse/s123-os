'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, 'mt_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET /api/moments
router.get('/', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role,
           p.name as product_name, p.sku as product_sku
    FROM moments m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN products p ON m.product_id = p.id
    ORDER BY m.id DESC LIMIT 50
  `).all();

  const withComments = rows.map(m => {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM moment_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.moment_id = ?
      ORDER BY c.id ASC
    `).all(m.id);
    let likes = [];
    try { likes = JSON.parse(m.likes || '[]'); } catch {}
    return { ...m, likes, comments };
  });

  res.json({ moments: withComments });
});

// POST /api/moments
router.post('/', auth, upload.single('image'), (req, res) => {
  const { content, product_id } = req.body;
  if (!content && !req.file) return res.status(400).json({ error: '内容不能为空' });
  const image_url = req.file ? '/uploads/' + req.file.filename : null;
  const result = db.prepare(
    'INSERT INTO moments (user_id, content, image_url, product_id) VALUES (?,?,?,?)'
  ).run(req.user.id, content || '', image_url, product_id || null);
  const moment = db.prepare(`
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role,
           p.name as product_name, p.sku as product_sku
    FROM moments m JOIN users u ON m.user_id=u.id
    LEFT JOIN products p ON m.product_id=p.id
    WHERE m.id=?
  `).get(result.lastInsertRowid);
  res.json({ moment: { ...moment, likes: [], comments: [] } });
});

// POST /api/moments/:id/like
router.post('/:id/like', auth, (req, res) => {
  const m = db.prepare('SELECT likes FROM moments WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: '不存在' });
  let likes = [];
  try { likes = JSON.parse(m.likes || '[]'); } catch {}
  const uid = req.user.id;
  if (likes.includes(uid)) {
    likes = likes.filter(id => id !== uid);
  } else {
    likes.push(uid);
  }
  db.prepare('UPDATE moments SET likes=? WHERE id=?').run(JSON.stringify(likes), req.params.id);
  res.json({ likes });
});

// POST /api/moments/:id/comments
router.post('/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: '评论不能为空' });
  const result = db.prepare(
    'INSERT INTO moment_comments (moment_id, user_id, content) VALUES (?,?,?)'
  ).run(req.params.id, req.user.id, content);
  const comment = db.prepare(`
    SELECT c.*, u.name as user_name FROM moment_comments c
    JOIN users u ON c.user_id=u.id WHERE c.id=?
  `).get(result.lastInsertRowid);
  res.json({ comment });
});

// DELETE /api/moments/:id
router.delete('/:id', auth, (req, res) => {
  const m = db.prepare('SELECT user_id FROM moments WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: '不存在' });
  if (m.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: '无权限' });
  db.prepare('DELETE FROM moments WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
