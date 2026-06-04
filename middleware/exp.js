'use strict';
const { db } = require('../db');

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 99999];
const LEVEL_NAMES = ['', 'Lv1 民工', 'Lv2 全村希望', 'Lv3 中产小资', 'Lv4 广东首富', 'Lv5 超级富豪', 'Lv6 福布斯排行榜'];

function awardExp(userId, action) {
  const cfg = db.prepare('SELECT points FROM exp_config WHERE action=?').get(action);
  if (!cfg) return;
  const user = db.prepare('SELECT exp, level FROM users WHERE id=?').get(userId);
  if (!user) return;
  const newExp = user.exp + cfg.points;
  let newLevel = user.level;
  for (let lv = 6; lv >= 1; lv--) {
    if (newExp >= LEVEL_THRESHOLDS[lv]) { newLevel = lv; break; }
  }
  db.prepare('UPDATE users SET exp=?, level=? WHERE id=?').run(newExp, newLevel, userId);
  return { leveled_up: newLevel > user.level, new_level: newLevel, level_name: LEVEL_NAMES[newLevel] };
}

function getLevelInfo(exp) {
  let level = 1;
  for (let lv = 6; lv >= 1; lv--) {
    if (exp >= LEVEL_THRESHOLDS[lv]) { level = lv; break; }
  }
  const next = LEVEL_THRESHOLDS[Math.min(level + 1, 6)];
  return { level, level_name: LEVEL_NAMES[level], exp, next_threshold: next };
}

module.exports = { awardExp, getLevelInfo, LEVEL_NAMES };
