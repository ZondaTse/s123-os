'use strict';

// ── API ──────────────────────────────────────────────
const API = {
  base: '',
  token() { return localStorage.getItem('s123_token'); },
  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },
  async req(method, path, body) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(this.base + path, opts);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || '请求失败');
    return data;
  },
  get(path)        { return this.req('GET', path); },
  post(path, body) { return this.req('POST', path, body); },
  put(path, body)  { return this.req('PUT', path, body); },
  del(path)        { return this.req('DELETE', path); },
  async upload(path, formData) {
    const t = this.token();
    const h = {};
    if (t) h['Authorization'] = 'Bearer ' + t;
    const r = await fetch(this.base + path, { method: 'POST', headers: h, body: formData });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || '上传失败');
    return data;
  }
};

// ── State ────────────────────────────────────────────
const State = {
  user: null,
  messages: [],
  myTasks: [],
  allTasks: [],
  contents: [],
  products: [],
  gmv: null,
  monthly: null,
  rankings: [],
};

// ── Utils ────────────────────────────────────────────
function toast(msg, dur = 1800) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function fmtMoney(n) {
  n = Number(n) || 0;
  if (n >= 10000) return '¥' + (n/10000).toFixed(1) + 'w';
  return '¥' + n.toLocaleString('zh-CN');
}

function fmtTime(str) {
  if (!str) return '';
  const d = new Date(str.replace(' ', 'T'));
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
  if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
  if (y === now.getFullYear()) return m + '月' + day + '日';
  return y + '年' + m + '月' + day + '日';
}

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str.replace(' ', 'T'));
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function avatarLetter(name) {
  return name ? name.slice(-2, -1) || name[0] : '?';
}

function avatarColor(name) {
  const colors = ['#007AFF','#34C759','#5AC8FA','#FF9500','#AF52DE','#32ADE6','#FF6B35'];
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
}

function roleLabel(role) {
  const map = { admin:'管理员', anchor:'主播', operator:'运营', photo:'摄影', control:'中控', assistant:'助理', member:'成员' };
  return map[role] || role;
}

function lcLabel(s) {
  const m = { new:'新品', hot:'爆款', stable:'普通', sleeping:'待清货', zombie:'停售' };
  return m[s] || s;
}

function levelName(level) {
  const names = ['', 'Lv1 民工', 'Lv2 全村希望', 'Lv3 中产小资', 'Lv4 广东首富', 'Lv5 超级富豪', 'Lv6 福布斯排行榜'];
  return names[level] || 'Lv1 民工';
}

function showSheet(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function hideSheet(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  // 给内部 sheet 加收起动画
  const sheet = overlay.querySelector('.sheet, .ios-sheet');
  if (sheet) {
    sheet.style.animation = 'iosSlideDown 0.18s cubic-bezier(.4,0,1,1) both';
    setTimeout(() => {
      overlay.classList.remove('show');
      sheet.style.animation = '';
      document.body.style.overflow = '';
    }, 170);
  } else {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
}

function initTheme() {
  const theme = localStorage.getItem('s123_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('s123_theme', next);
  toast(next === 'dark' ? '已切换夜间模式' : '已切换日间模式');
}

function donutSVG(pct, size = 56, stroke = 6, color = '#07c160') {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circ}" stroke-dashoffset="0"
      stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
  </svg>`;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 30个预设头像配置（Apple风格彩色）
const PRESET_AVATARS = [
  // 动物系列
  { id:'a1', emoji:'🐼', bg:'#1a1a2e', label:'熊猫' },
  { id:'a2', emoji:'🦁', bg:'#c9a227', label:'狮子' },
  { id:'a3', emoji:'🐯', bg:'#e85d04', label:'老虎' },
  { id:'a4', emoji:'🐻', bg:'#6d4c41', label:'棕熊' },
  { id:'a5', emoji:'🦊', bg:'#f4511e', label:'狐狸' },
  { id:'a6', emoji:'🐺', bg:'#546e7a', label:'狼' },
  { id:'a7', emoji:'🐸', bg:'#2e7d32', label:'青蛙' },
  { id:'a8', emoji:'🦋', bg:'#7b1fa2', label:'蝴蝶' },
  { id:'a9', emoji:'🦅', bg:'#0277bd', label:'雄鹰' },
  { id:'a10', emoji:'🦈', bg:'#01579b', label:'鲨鱼' },
  // 人物系列
  { id:'b1', emoji:'🧑‍💼', bg:'#1565c0', label:'商务' },
  { id:'b2', emoji:'👨‍🎨', bg:'#6a1b9a', label:'创意' },
  { id:'b3', emoji:'🧑‍💻', bg:'#00695c', label:'技术' },
  { id:'b4', emoji:'👩‍🎤', bg:'#ad1457', label:'明星' },
  { id:'b5', emoji:'🧑‍🚀', bg:'#283593', label:'宇航' },
  { id:'b6', emoji:'🥷', bg:'#212121', label:'忍者' },
  { id:'b7', emoji:'🧙', bg:'#4527a0', label:'法师' },
  { id:'b8', emoji:'🦸', bg:'#1976d2', label:'英雄' },
  // 自然系列
  { id:'c1', emoji:'🌊', bg:'#0097a7', label:'海浪' },
  { id:'c2', emoji:'🔥', bg:'#bf360c', label:'火焰' },
  { id:'c3', emoji:'⚡', bg:'#f57f17', label:'闪电' },
  { id:'c4', emoji:'🌙', bg:'#1a237e', label:'月亮' },
  { id:'c5', emoji:'🌸', bg:'#e91e63', label:'樱花' },
  { id:'c6', emoji:'🍀', bg:'#1b5e20', label:'幸运' },
  { id:'c7', emoji:'🌺', bg:'#b71c1c', label:'花朵' },
  { id:'c8', emoji:'❄️', bg:'#0288d1', label:'冰雪' },
  // 符号系列
  { id:'d1', emoji:'💎', bg:'#00acc1', label:'钻石' },
  { id:'d2', emoji:'🏆', bg:'#f9a825', label:'冠军' },
  { id:'d3', emoji:'🎯', bg:'#c62828', label:'目标' },
  { id:'d4', emoji:'⚔️', bg:'#37474f', label:'战士' },
];

function getAvatarHtml(user, size = 42, radius = '6px') {
  if (user.avatar_url && user.avatar_url.startsWith('/preset/')) {
    const av = PRESET_AVATARS.find(a => '/preset/'+a.id === user.avatar_url);
    if (av) {
      return `<div style="width:${size}px;height:${size}px;border-radius:${radius};background:${av.bg};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px;overflow:hidden">${av.emoji}</div>`;
    }
  }
  if (user.avatar_url && !user.avatar_url.startsWith('/preset/')) {
    return `<div style="width:${size}px;height:${size}px;border-radius:${radius};overflow:hidden"><img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover"></div>`;
  }
  // 文字头像
  const color = avatarColor(user.name || '');
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius};background:linear-gradient(135deg,${color}dd,${color}99);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;font-weight:700;color:white;letter-spacing:0">${avatarLetter(user.name||'?')}</div>`;
}
