'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './db/s123.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'member',
      avatar_url    TEXT,
      level         INTEGER NOT NULL DEFAULT 1,
      exp           INTEGER NOT NULL DEFAULT 0,
      gmv_total     REAL NOT NULL DEFAULT 0,
      bookmarks     TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id  INTEGER NOT NULL REFERENCES users(id),
      type       TEXT NOT NULL DEFAULT 'text',
      content    TEXT NOT NULL DEFAULT '',
      ref_id     INTEGER,
      ref_type   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      sku              TEXT NOT NULL UNIQUE,
      name             TEXT NOT NULL,
      image_url        TEXT,
      stock            INTEGER NOT NULL DEFAULT 0,
      cost             REAL NOT NULL DEFAULT 0,
      price            REAL NOT NULL DEFAULT 0,
      lifecycle_status TEXT NOT NULL DEFAULT 'new',
      kuaima_id        INTEGER,
      skus_json        TEXT,
      updated_at       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'todo',
      assignee_id INTEGER REFERENCES users(id),
      creator_id  INTEGER NOT NULL REFERENCES users(id),
      source      TEXT NOT NULL DEFAULT 'manual',
      product_id  INTEGER REFERENCES products(id),
      due_date    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS contents (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id       INTEGER NOT NULL REFERENCES users(id),
      title          TEXT NOT NULL DEFAULT '',
      douyin_url     TEXT,
      screenshot_url TEXT,
      boom_analysis  TEXT,
      why_research   TEXT,
      exec_plan      TEXT,
      exec_result    TEXT,
      summary        TEXT,
      status         TEXT NOT NULL DEFAULT 'researching',
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS content_products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(content_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL REFERENCES users(id),
      title      TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'pending',
      product_id INTEGER REFERENCES products(id),
      exp_date   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      creator_id  INTEGER NOT NULL REFERENCES users(id),
      product_id  INTEGER REFERENCES products(id),
      plan_date   TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS gmv_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      product_id  INTEGER REFERENCES products(id),
      amount      REAL NOT NULL DEFAULT 0,
      record_date TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      uploader_id      INTEGER NOT NULL REFERENCES users(id),
      report_date      TEXT NOT NULL UNIQUE,
      gmv              REAL NOT NULL DEFAULT 0,
      order_count      INTEGER DEFAULT 0,
      visitor_count    INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      conversion_rate  REAL DEFAULT 0,
      roi              REAL DEFAULT 0,
      gpm              REAL DEFAULT 0,
      refund_rate      REAL DEFAULT 0,
      ad_spend         REAL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS exp_config (
      action TEXT PRIMARY KEY,
      points INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      content    TEXT NOT NULL DEFAULT '',
      image_url  TEXT,
      product_id INTEGER REFERENCES products(id),
      likes      TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS moment_comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id  INTEGER NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS km_item_index (
      outer_id    TEXT PRIMARY KEY,
      sys_item_id TEXT NOT NULL,
      title       TEXT,
      synced_at   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);

  // 兼容旧数据库：补充新增列
  try { db.prepare('ALTER TABLE products ADD COLUMN skus_json TEXT').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN salary_target INTEGER DEFAULT 0').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN salary_access INTEGER DEFAULT 0').run(); } catch(e) {}

  const upsert = db.prepare('INSERT OR IGNORE INTO exp_config VALUES (?,?)');
  const actions = [
    ['send_message', 1], ['complete_task', 10], ['add_experience', 20],
    ['add_content', 15],  ['daily_review', 30],
  ];
  for (const [a, p] of actions) upsert.run(a, p);

  console.log('✅ Database initialized:', DB_PATH);
}

module.exports = { db, init };
