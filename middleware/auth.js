'use strict';
const jwt = require('jsonwebtoken');
const { db } = require('../db');

function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id,name,role,level,exp,gmv_total,avatar_url FROM users WHERE id=?').get(payload.id);
    if (!user) return res.status(401).json({ error: '用户不存在' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效' });
  }
}

module.exports = auth;
