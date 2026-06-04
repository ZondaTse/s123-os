'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, phone, password, invite_code } = req.body;
  if (!name || !phone || !password || !invite_code)
    return res.status(400).json({ error: '请填写所有字段' });
  if (invite_code !== process.env.INVITE_CODE)
    return res.status(403).json({ error: '邀请码错误' });
  if (db.prepare('SELECT id FROM users WHERE phone=?').get(phone))
    return res.status(409).json({ error: '手机号已注册' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name,phone,password_hash) VALUES (?,?,?)'
  ).run(name, phone, hash);
  const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: result.lastInsertRowid, name, phone, role: 'member', level: 1, exp: 0 } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请输入手机号和密码' });
  const user = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: '手机号或密码错误' });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const { password_hash, ...safe } = user;
  res.json({ token, user: safe });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
