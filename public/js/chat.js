'use strict';

// ── Chat Module ──────────────────────────────────────
const Chat = {
  lastId: 0,
  sse: null,
  ctxMsgId: null,
  recording: false,
  mediaRecorder: null,
  audioChunks: [],

  async init() {
    this.bindInputBar();
    this.bindContextMenu();
    await this.loadMessages();
    this.startSSE();
  },

  async loadMessages() {
    try {
      const data = await API.get('/api/messages?limit=40');
      State.messages = data.messages;
      this.renderAll();
      if (data.messages.length) this.lastId = data.messages[data.messages.length - 1].id;
      this.scrollBottom(false);
    } catch(e) { console.error(e); }
  },

  renderAll() {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    if (!State.messages.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">💬</div><div class="empty-text">还没有消息</div><div class="empty-sub">发第一条消息吧</div></div>';
      return;
    }
    el.innerHTML = State.messages.map((m, i) => {
      const prev = State.messages[i-1];
      const showTime = !prev || (new Date(m.created_at) - new Date(prev.created_at)) > 300000;
      return (showTime ? `<div class="msg-time">${fmtTime(m.created_at)}</div>` : '') + this.renderMsg(m);
    }).join('');
  },

  renderMsg(m) {
    const isMe = m.sender_id === State.user.id;
    const name = m.sender_name || '未知';
    const color = avatarColor(name);
    const avatarHtml = m.sender_avatar
      ? `<img src="${m.sender_avatar}" alt="${name}">`
      : `<span style="color:white">${avatarLetter(name)}</span>`;

    // system message (daily report card)
    if (m.type === 'system') {
      try {
        const d = JSON.parse(m.content);
        if (d.type === 'daily_report') {
          return `<div class="msg-system">
            <div class="msg-system-title">📊 今日数据 · ${d.date}</div>
            <div class="msg-system-row"><span>今日GMV</span><span class="msg-system-val">${fmtMoney(d.gmv)}</span></div>
            <div class="msg-system-row"><span>订单数</span><span>${d.order_count || 0}</span></div>
            <div class="msg-system-row"><span>访客数</span><span>${d.visitor_count || 0}</span></div>
            <div class="msg-system-row"><span>转化率</span><span>${((d.conversion_rate||0)*100).toFixed(2)}%</span></div>
          </div>`;
        }
      } catch {}
    }

    let bubbleContent = '';
    if (m.type === 'image') {
      bubbleContent = `<img src="${m.content}" class="msg-img" onclick="window.open('${m.content}')">`;
    } else if (m.type === 'voice') {
      bubbleContent = `<div class="msg-voice" onclick="Chat.playVoice('${m.content}')">
        <span class="msg-voice-icon">🎤</span>
        <span class="msg-voice-dur">${m.ref_id || 0}"</span>
      </div>`;
    } else if (m.ref_type === 'task' && m.ref_id) {
      bubbleContent = `<div class="msg-card"><div class="msg-card-type">📋 已转为任务</div><div class="msg-card-title">${this.esc(m.content.slice(0,60))}</div></div>`;
    } else if (m.ref_type === 'experience' && m.ref_id) {
      bubbleContent = `<div class="msg-card"><div class="msg-card-type">💡 已转为经验</div><div class="msg-card-title">${this.esc(m.content.slice(0,60))}</div></div>`;
    } else {
      bubbleContent = `<span>${this.esc(m.content)}</span>`;
    }

    return `<div class="msg-row ${isMe ? 'me' : ''}" data-id="${m.id}">
      <div class="msg-avatar" style="background:${color}">${avatarHtml}</div>
      <div class="msg-body">
        ${!isMe ? `<div class="msg-name">${this.esc(name)} <span style="font-size:11px;color:var(--text3)">${roleLabel(m.sender_role)}</span></div>` : ''}
        <div class="msg-bubble" oncontextmenu="Chat.showCtx(event,${m.id})" ontouchstart="Chat.touchStart(event,${m.id})">${bubbleContent}</div>
      </div>
    </div>`;
  },

  appendMsg(m) {
    State.messages.push(m);
    const el = document.getElementById('chat-messages');
    if (!el) return;
    // remove empty state
    if (el.querySelector('.empty')) el.innerHTML = '';
    const div = document.createElement('div');
    div.innerHTML = this.renderMsg(m);
    el.appendChild(div.firstElementChild);
    this.scrollBottom(true);
  },

  scrollBottom(smooth) {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  },

  esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  },

  bindInputBar() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const voiceBtn = document.getElementById('chat-voice-btn');
    const moreBtn = document.getElementById('chat-more-btn');
    const extraBar = document.getElementById('chat-extra');

    if (sendBtn) sendBtn.onclick = () => this.sendText();
    if (input) {
      input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendText(); } };
      input.oninput = () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      };
    }
    if (moreBtn) moreBtn.onclick = () => extraBar?.classList.toggle('show');
    if (voiceBtn) voiceBtn.onclick = () => this.toggleVoice();

    // extra bar actions
    document.getElementById('extra-image')?.addEventListener('click', () => {
      document.getElementById('img-picker').click();
    });
    document.getElementById('img-picker')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.sendFile(file, 'image');
      e.target.value = '';
    });
    document.getElementById('extra-voice')?.addEventListener('click', () => this.toggleVoice());
  },

  async sendText() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('chat-extra')?.classList.remove('show');
    try {
      const data = await API.post('/api/messages', { type: 'text', content: text });
      // SSE will pick it up; optimistically append
      this.appendMsg({ ...data.message, sender_name: State.user.name, sender_role: State.user.role, sender_avatar: State.user.avatar_url });
    } catch(e) { toast('发送失败'); }
  },

  async sendFile(file, type) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      const data = await API.upload('/api/messages/upload', fd);
      this.appendMsg({ ...data.message, sender_name: State.user.name, sender_role: State.user.role, sender_avatar: State.user.avatar_url });
    } catch(e) { toast('上传失败'); }
  },

  // Long press
  touchTimer: null,
  touchStart(e, msgId) {
    this.touchTimer = setTimeout(() => this.showCtx(e, msgId), 600);
  },
  touchEnd() { clearTimeout(this.touchTimer); },

  showCtx(e, msgId) {
    e.preventDefault();
    this.ctxMsgId = msgId;
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;
    menu.classList.add('show');
    const x = Math.min(e.clientX || e.touches?.[0]?.clientX || 100, window.innerWidth - 160);
    const y = Math.min(e.clientY || e.touches?.[0]?.clientY || 100, window.innerHeight - 200);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  },

  bindContextMenu() {
    document.addEventListener('click', e => {
      const menu = document.getElementById('ctx-menu');
      if (menu && !menu.contains(e.target)) menu.classList.remove('show');
    });
    document.getElementById('ctx-to-task')?.addEventListener('click', () => this.ctxToTask());
    document.getElementById('ctx-to-exp')?.addEventListener('click', () => this.ctxToExp());
    document.getElementById('ctx-copy')?.addEventListener('click', () => this.ctxCopy());
    document.getElementById('ctx-del')?.addEventListener('click', () => this.ctxDel());
  },

  async ctxToTask() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    if (!this.ctxMsgId) return;
    try {
      await API.post('/api/messages/' + this.ctxMsgId + '/to-task', {});
      toast('✅ 已转为任务');
    } catch(e) { toast(e.message); }
  },

  async ctxToExp() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    if (!this.ctxMsgId) return;
    try {
      await API.post('/api/messages/' + this.ctxMsgId + '/to-experience', {});
      toast('✅ 已转为经验');
    } catch(e) { toast(e.message); }
  },

  ctxCopy() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    const msg = State.messages.find(m => m.id === this.ctxMsgId);
    if (msg?.content) { navigator.clipboard?.writeText(msg.content); toast('已复制'); }
  },

  async ctxDel() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    if (!this.ctxMsgId) return;
    try {
      await API.del('/api/messages/' + this.ctxMsgId);
      State.messages = State.messages.filter(m => m.id !== this.ctxMsgId);
      this.renderAll();
      toast('已删除');
    } catch(e) { toast(e.message); }
  },

  startSSE() {
    if (this.sse) this.sse.close();
    const token = API.token();
    if (!token) return;
    this.sse = new EventSource('/api/sse?token=' + encodeURIComponent(token));
    this.sse.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'message') {
          const msg = d.data;
          if (msg.id > this.lastId && !State.messages.find(m => m.id === msg.id)) {
            this.lastId = msg.id;
            if (msg.sender_id !== State.user.id) this.appendMsg(msg);
          }
        }
      } catch {}
    };
    this.sse.onerror = () => { setTimeout(() => this.startSSE(), 5000); };
  },

  playVoice(url) {
    const audio = new Audio(url);
    audio.play().catch(() => toast('播放失败'));
  },

  async toggleVoice() {
    if (this.recording) {
      this.mediaRecorder?.stop();
      this.recording = false;
      document.getElementById('chat-voice-btn').textContent = '🎤';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice_' + Date.now() + '.webm', { type: 'audio/webm' });
        await this.sendFile(file, 'voice');
        stream.getTracks().forEach(t => t.stop());
      };
      this.mediaRecorder.start();
      this.recording = true;
      document.getElementById('chat-voice-btn').textContent = '⏹';
      toast('录音中…按再次停止');
    } catch { toast('麦克风权限被拒绝'); }
  }
};
