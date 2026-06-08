'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const { db, init } = require('./db');
init();

const app = express();

// ── GitHub Webhook — 推送后立即 git pull + pm2 restart ──
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 's123webhook';
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-hub-signature-256'] || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex');
  if (sig !== expected) return res.status(403).send('Forbidden');

  res.status(200).send('OK');
  // 异步执行，不阻塞响应
  setTimeout(() => {
    try {
      console.log('🔄 Webhook received, deploying via curl...');
      const base = 'https://raw.githubusercontent.com/ZondaTse/s123-os/main';
      const files = [
        'app.js',
        'db/index.js',
        'routes/auth.js',
        'routes/messages.js',
        'routes/tasks.js',
        'routes/products.js',
        'routes/contents.js',
        'routes/experiences.js',
        'routes/plans.js',
        'routes/gmv.js',
        'routes/users.js',
        'routes/moments.js',
        'routes/kuaima.js',
        'routes/sse.js',
        'public/index.html',
        'public/css/app.css',
        'public/js/utils.js',
        'public/js/chat.js',
        'public/js/exec.js',
        'public/js/wealth.js',
      ];
      let updated = 0;
      for (const f of files) {
        try {
          execSync(`curl -sf --max-time 15 --retry 2 "${base}/${f}" -o "/root/s123/${f}"`, { timeout: 20000 });
          updated++;
        } catch(e) { console.error('curl failed for', f, e.message); }
      }
      console.log(`✅ ${updated}/${files.length} files updated, restarting...`);
      setTimeout(() => execSync('pm2 restart s123', { stdio: 'inherit' }), 500);
    } catch (e) {
      console.error('❌ Webhook deploy failed:', e.message);
    }
  }, 100);
});

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
