'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { getLevelInfo } = require('../middleware/exp');
const { db } = require('../db');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, 'av_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET /api/users
router.get('/', auth, (req, res) => {
  const users = db.prepare('SELECT id,name,phone,role,avatar_url,level,exp,gmv_total,created_at FROM users ORDER BY gmv_total DESC').all();
  const withLevel = users.map(u => ({ ...u, ...getLevelInfo(u.exp) }));
  res.json({ users: withLevel });
});

// GET /api/users/:id
router.get('/:id', auth, (req, res) => {
  const uid = req.params.id === 'me' ? req.user.id : req.params.id;
  const user = db.prepare('SELECT id,name,phone,role,avatar_url,level,exp,gmv_total,created_at FROM users WHERE id=?').get(uid);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthly_gmv = (db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM gmv_records WHERE user_id=? AND record_date LIKE ?').get(uid, ym + '%') || {}).total || 0;
  // ranking by gmv_total
  const rank = db.prepare('SELECT COUNT(*)+1 as rank FROM users WHERE gmv_total > ?').get(user.gmv_total).rank;
  res.json({ user: { ...user, ...getLevelInfo(user.exp), monthly_gmv, rank } });
});

// PUT /api/users/me  (update own profile)
router.put('/me', auth, upload.single('avatar'), (req, res) => {
  const { name, password } = req.body;
  const avatar_url = req.file ? '/uploads/' + req.file.filename : undefined;
  const updates = [];
  const params = [];
  if (name) { updates.push('name=?'); params.push(name); }
  if (password) { updates.push('password_hash=?'); params.push(bcrypt.hashSync(password, 10)); }
  if (avatar_url) { updates.push('avatar_url=?'); params.push(avatar_url); }
  if (updates.length) {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params);
  }
  const user = db.prepare('SELECT id,name,role,avatar_url,level,exp,gmv_total FROM users WHERE id=?').get(req.user.id);
  res.json({ user: { ...user, ...getLevelInfo(user.exp) } });
});

// POST /api/users  (admin creates user)
router.post('/', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' });
  const bcrypt = require('bcryptjs');
  const { name, phone, password = '123456', role = 'member' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: '姓名和手机号必填' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name,phone,password_hash,role) VALUES (?,?,?,?)').run(name, phone, hash, role);
  res.json({ id: result.lastInsertRowid, name, phone, role });
});

// --- Bookmarks ---
// GET /api/users/me/bookmarks
router.get('/me/bookmarks', auth, (req, res) => {
  // inline bookmark storage in messages with type=bookmark, or use a simple json store
  // For V1 simplicity: store bookmarks as a JSON column in users
  const user = db.prepare('SELECT bookmarks FROM users WHERE id=?').get(req.user.id);
  let bookmarks = [];
  try { bookmarks = JSON.parse(user?.bookmarks || '[]'); } catch {}
  res.json({ bookmarks });
});

// POST /api/users/me/bookmarks
router.post('/me/bookmarks', auth, (req, res) => {
  const { ref_id, ref_type, title } = req.body;
  const user = db.prepare('SELECT bookmarks FROM users WHERE id=?').get(req.user.id);
  let bookmarks = [];
  try { bookmarks = JSON.parse(user?.bookmarks || '[]'); } catch {}
  bookmarks.unshift({ ref_id, ref_type, title, saved_at: new Date().toISOString() });
  // ensure bookmarks column exists
  try { db.exec('ALTER TABLE users ADD COLUMN bookmarks TEXT'); } catch {}
  db.prepare('UPDATE users SET bookmarks=? WHERE id=?').run(JSON.stringify(bookmarks.slice(0,200)), req.user.id);
  res.json({ ok: true });
});

module.exports = router;
