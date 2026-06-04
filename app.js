'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { db, init } = require('./db');
init();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/tasks',       require('./routes/tasks'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/contents',    require('./routes/contents'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/plans',       require('./routes/plans'));
app.use('/api/gmv',         require('./routes/gmv'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/moments',     require('./routes/moments'));
app.use('/api/kuaima',      require('./routes/kuaima'));

const { router: sseRouter, broadcast } = require('./routes/sse');
app.use('/api/sse', sseRouter);

// Broadcast new messages via 1s polling loop
let lastMsgId = (db.prepare('SELECT COALESCE(MAX(id),0) as m FROM messages').get() || {}).m || 0;
setInterval(() => {
  try {
    const rows = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id > ?
      ORDER BY m.id ASC LIMIT 20
    `).all(lastMsgId);
    for (const msg of rows) {
      broadcast({ type: 'message', data: msg });
      lastMsgId = msg.id;
    }
  } catch {}
}, 1000);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ S123 OS running on http://localhost:${PORT}`);
  console.log(`   邀请码: ${process.env.INVITE_CODE}`);
});
