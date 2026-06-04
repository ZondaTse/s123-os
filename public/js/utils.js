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
  tasks: [],
  plans: [],
  contents: [],
  experiences: [],
  products: [],
  gmv: null,
  monthly: null,
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
  if (diff < 86400000) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
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
  const colors = ['#07c160','#1a7be0','#fa5151','#ff8f1f','#a855f7','#14b8a6','#f43f5e'];
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
}

function roleLabel(role) {
  const map = { admin:'管理员', anchor:'主播', operator:'运营', photo:'摄影', control:'中控', assistant:'助理', member:'成员' };
  return map[role] || role;
}

function lcLabel(s) {
  const m = { new:'新品', hot:'爆款', stable:'稳定款', sleeping:'睡眠款', zombie:'僵尸款' };
  return m[s] || s;
}

function lcClass(s) {
  return 'lifecycle-badge lc-' + (s||'new');
}

function levelName(level) {
  const names = ['', 'Lv1 民工', 'Lv2 全村希望', 'Lv3 中产小资', 'Lv4 广东首富', 'Lv5 超级富豪', 'Lv6 福布斯排行榜'];
  return names[level] || 'Lv1 民工';
}

// show/hide overlay
function showSheet(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}
function hideSheet(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}

// confirm dialog
function confirm(msg) {
  return window.confirm(msg);
}

// Theme
function initTheme() {
  const saved = localStorage.getItem('s123_theme');
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (preferDark ? 'dark' : 'light');
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

// Donut SVG
function donutSVG(pct, size = 56, stroke = 6, color = '#07c160') {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return `<svg width="${size}" height="${size}" class="donut">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ/4}" stroke-linecap="round"
      transform="rotate(-90 ${size/2} ${size/2})"/>
  </svg>`;
}
