'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');

// In-memory client registry
const clients = new Set();

function broadcast(data) {
  const payload = 'data: ' + JSON.stringify(data) + '\n\n';
  for (const res of clients) {
    try { res.write(payload); } catch {}
  }
}

// GET /api/sse  - SSE stream
router.get('/', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');

  clients.add(res);
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);

  req.on('close', () => {
    clearInterval(hb);
    clients.delete(res);
  });
});

module.exports = { router, broadcast };
