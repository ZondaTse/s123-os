'use strict';

const Chat = {
  lastId: 0,
  sse: null,
  ctxMsgId: null,

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
      el.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="empty-text">还没有消息</div><div class="empty-sub">发第一条消息吧</div></div>';
      return;
    }
    el.innerHTML = State.messages.map((m, i) => {
      const prev = State.messages[i - 1];
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

    if (m.type === 'system') {
      try {
        const d = JSON.parse(m.content);
        if (d.type === 'daily_report') {
          return `<div class="msg-system">
            <div class="msg-system-title">📊 今日数据 · ${d.date}</div>
            <div class="msg-system-row"><span>今日GMV</span><span class="msg-system-val">${fmtMoney(d.gmv)}</span></div>
            <div class="msg-system-row"><span>订单数</span><span>${d.order_count || 0}</span></div>
            <div class="msg-system-row"><span>转化率</span><span>${((d.conversion_rate||0)*100).toFixed(2)}%</span></div>
          </div>`;
        }
      } catch {}
    }

    // task card
    if (m.type === 'task_card') {
      try {
        const d = JSON.parse(m.content);
        return `<div class="msg-system" style="cursor:pointer" onclick="Chat.openTaskCard(${d.task_id})">
          <div class="msg-system-title" style="display:flex;align-items:center;gap:6px">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            新任务
          </div>
          <div style="font-size:var(--font-base);color:var(--text);margin-top:4px">${escHtml(d.title)}</div>
          ${d.assignee_name ? `<div style="font-size:var(--font-sm);color:var(--text3);margin-top:4px">负责人：${escHtml(d.assignee_name)}</div>` : ''}
          ${d.product_name ? `<div style="font-size:var(--font-sm);color:var(--text3)">关联商品：${escHtml(d.product_name)}</div>` : ''}
        </div>`;
      } catch {}
    }

    let bubbleContent = '';
    if (m.type === 'image') {
      bubbleContent = `<img src="${m.content}" class="msg-img" onclick="window.open('${m.content}')">`;
    } else if (m.ref_type === 'task' && m.ref_id) {
      bubbleContent = `<div class="msg-card"><div style="font-size:12px;color:var(--green);margin-bottom:4px;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/></svg>已转为任务</div><div>${this.esc(m.content.slice(0,60))}</div></div>`;
    } else if (m.ref_type === 'bookmark') {
      try {
        const d = JSON.parse(m.content);
        bubbleContent = `<div class="msg-card"><div style="font-size:12px;color:var(--green);margin-bottom:4px">⭐ 来自收藏</div><div>${this.esc(d.title||'收藏内容')}</div></div>`;
      } catch { bubbleContent = `<span>${this.esc(m.content)}</span>`; }
    } else {
      bubbleContent = `<span>${this.esc(m.content)}</span>`;
    }

    return `<div class="msg-row ${isMe ? 'me' : ''}" data-id="${m.id}">
      <div class="msg-avatar" style="background:${color}">${avatarHtml}</div>
      <div class="msg-body">
        ${!isMe ? `<div class="msg-name">${this.esc(name)} <span style="font-size:11px;color:var(--text3)">${roleLabel(m.sender_role)}</span></div>` : ''}
        <div class="msg-bubble" oncontextmenu="Chat.showCtx(event,${m.id})" ontouchstart="Chat.touchStart(event,${m.id})" ontouchend="Chat.touchEnd()">${bubbleContent}</div>
      </div>
    </div>`;
  },

  appendMsg(m) {
    State.messages.push(m);
    const el = document.getElementById('chat-messages');
    if (!el) return;
    if (el.querySelector('.empty')) el.innerHTML = '';
    const div = document.createElement('div');
    div.innerHTML = this.renderMsg(m);
    if (div.firstElementChild) el.appendChild(div.firstElementChild);
    this.scrollBottom(true);
  },

  scrollBottom(smooth) {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  },

  esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  },

  bindInputBar() {
    const input = document.getElementById('chat-input');
    if (input) {
      input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendText(); } };
      input.oninput = () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      };
    }
  },

  async sendText() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('chat-plus-menu')?.classList.remove('show');
    try {
      const data = await API.post('/api/messages', { type: 'text', content: text });
      this.appendMsg({ ...data.message, sender_name: State.user.name, sender_role: State.user.role, sender_avatar: State.user.avatar_url });
    } catch { toast('发送失败'); }
  },

  // 图片压缩后上传
  async sendImageFile(file) {
    try {
      const compressed = await this.compressImage(file, 1080, 0.82);
      const fd = new FormData();
      fd.append('file', compressed, compressed.name || 'image.jpg');
      fd.append('type', 'image');
      const data = await API.upload('/api/messages/upload', fd);
      this.appendMsg({ ...data.message, sender_name: State.user.name, sender_role: State.user.role, sender_avatar: State.user.avatar_url });
    } catch { toast('上传失败'); }
  },

  compressImage(file, maxPx, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('压缩失败'));
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  // 发送任务卡片到会话
  async sendTaskCard(task) {
    try {
      await API.post('/api/messages', {
        type: 'task_card',
        content: JSON.stringify({
          task_id: task.id,
          title: task.title,
          assignee_name: task.assignee_name,
          product_name: task.product_name,
        })
      });
    } catch {}
  },

  // 从收藏发到讨论
  async sendBookmarkToChat(bookmark) {
    try {
      const data = await API.post('/api/messages', {
        type: 'text',
        content: bookmark.title || '收藏内容',
        ref_type: 'bookmark',
        ref_id: bookmark.ref_id,
      });
      this.appendMsg({ ...data.message, sender_name: State.user.name, sender_role: State.user.role, sender_avatar: State.user.avatar_url });
      toast('已发送到会话');
      // 切换到会话Tab
      switchTab('chat');
    } catch { toast('发送失败'); }
  },

  openTaskCard(taskId) {
    // 跳转到执行页查看任务
    switchTab('exec');
    toast('正在查找任务...');
  },

  // ── 加号菜单 ──
  togglePlusMenu() {
    const menu = document.getElementById('chat-plus-menu');
    menu?.classList.toggle('show');
  },

  showWoTask() {
    document.getElementById('chat-plus-menu')?.classList.remove('show');
    // Wo任务：创建给自己
    document.getElementById('wo-task-title').value = '';
    document.getElementById('wo-task-product').innerHTML = '<option value="">不关联商品</option>';
    API.get('/api/products').then(d => {
      document.getElementById('wo-task-product').innerHTML =
        '<option value="">不关联商品</option>' +
        d.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
    showSheet('wo-task-overlay');
  },

  async saveWoTask() {
    const title = document.getElementById('wo-task-title').value.trim();
    if (!title) { toast('请填写任务标题'); return; }
    const product_id = document.getElementById('wo-task-product').value;
    try {
      const d = await API.post('/api/tasks', { title, assignee_id: State.user.id, product_id: product_id || undefined });
      hideSheet('wo-task-overlay');
      await this.sendTaskCard(d.task);
      toast('✅ 任务已创建');
    } catch(e) { toast(e.message); }
  },

  showTaTask() {
    document.getElementById('chat-plus-menu')?.classList.remove('show');
    document.getElementById('ta-task-title').value = '';
    Promise.all([API.get('/api/users'), API.get('/api/products')]).then(([ud, pd]) => {
      document.getElementById('ta-task-assignee').innerHTML =
        ud.users.filter(u => u.id !== State.user.id)
               .map(u => `<option value="${u.id}">${u.name} · ${roleLabel(u.role)}</option>`).join('');
      document.getElementById('ta-task-product').innerHTML =
        '<option value="">不关联商品</option>' +
        pd.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
    showSheet('ta-task-overlay');
  },

  async saveTaTask() {
    const title = document.getElementById('ta-task-title').value.trim();
    const assignee_id = document.getElementById('ta-task-assignee').value;
    if (!title) { toast('请填写任务标题'); return; }
    if (!assignee_id) { toast('请选择负责人'); return; }
    const product_id = document.getElementById('ta-task-product').value;
    try {
      const d = await API.post('/api/tasks', { title, assignee_id, product_id: product_id || undefined });
      hideSheet('ta-task-overlay');
      await this.sendTaskCard(d.task);
      toast('✅ 已指派任务');
    } catch(e) { toast(e.message); }
  },

  showProductPicker() {
    document.getElementById('chat-plus-menu')?.classList.remove('show');
    showSheet('product-picker-overlay');
    const el = document.getElementById('product-picker-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    API.get('/api/products').then(d => {
      if (!d.products.length) { el.innerHTML = '<div class="empty"><div class="empty-text">还没有商品</div></div>'; return; }
      el.innerHTML = d.products.map(p => `
        <div class="list-item" onclick="Chat.sendProductCard(${p.id})">
          <div class="list-item-body">
            <div class="list-item-title">${escHtml(p.name)}</div>
            <div class="list-item-sub">${p.sku} · ¥${p.price}</div>
          </div>
        </div>`).join('');
    });
  },

  async sendProductCard(productId) {
    hideSheet('product-picker-overlay');
    try {
      const d = await API.get('/api/products');
      const p = d.products.find(p => p.id === productId);
      if (!p) return;
      await API.post('/api/messages', { type: 'text', content: `商品：${p.name}（${p.sku}）¥${p.price}` });
      toast('已发送商品');
    } catch {}
  },

  showBookmarkPicker() {
    document.getElementById('chat-plus-menu')?.classList.remove('show');
    showSheet('bookmark-picker-overlay');
    const el = document.getElementById('bookmark-picker-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    API.get('/api/users/me/bookmarks').then(d => {
      const bms = d.bookmarks || [];
      if (!bms.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏</div></div>'; return; }
      el.innerHTML = bms.map((b, i) => `
        <div class="list-item">
          <div class="list-item-body" onclick="Chat.sendBookmarkToChat(${JSON.stringify(b).replace(/"/g,'&quot;')})">
            <div class="list-item-title">${escHtml(b.title||'收藏内容')}</div>
            <div class="list-item-sub">${b.ref_type||''} · ${fmtTime(b.saved_at)}</div>
          </div>
          <button style="background:none;border:none;color:var(--green);font-size:var(--font-sm);padding:4px 8px;cursor:pointer" onclick="Chat.sendBookmarkToChat(${JSON.stringify(b).replace(/"/g,'&quot;')});hideSheet('bookmark-picker-overlay')">发送</button>
        </div>`).join('');
    });
  },

  // ── Context Menu ──
  touchTimer: null,
  touchStart(e, msgId) { this.touchTimer = setTimeout(() => this.showCtx(e, msgId), 600); },
  touchEnd() { clearTimeout(this.touchTimer); },

  showCtx(e, msgId) {
    e.preventDefault();
    this.ctxMsgId = msgId;
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;
    document.getElementById('ctx-overlay')?.classList.add('show');
    menu.classList.add('show');
    const x = Math.min(e.clientX || e.touches?.[0]?.clientX || 100, window.innerWidth - 160);
    const y = Math.min(e.clientY || e.touches?.[0]?.clientY || 100, window.innerHeight - 200);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  },

  bindContextMenu() {
    document.getElementById('ctx-to-task')?.addEventListener('click', () => this.ctxToTask());
    document.getElementById('ctx-bookmark')?.addEventListener('click', () => this.ctxBookmark());
    document.getElementById('ctx-copy')?.addEventListener('click', () => this.ctxCopy());
    document.getElementById('ctx-del')?.addEventListener('click', () => this.ctxDel());
  },

  async ctxToTask() {
    this.closeCtx();
    if (!this.ctxMsgId) return;
    try { await API.post('/api/messages/' + this.ctxMsgId + '/to-task', {}); toast('✅ 已转为任务'); }
    catch(e) { toast(e.message); }
  },

  async ctxBookmark() {
    this.closeCtx();
    const msg = State.messages.find(m => m.id === this.ctxMsgId);
    if (!msg) return;
    try {
      await API.post('/api/users/me/bookmarks', {
        ref_id: msg.id,
        ref_type: 'message',
        title: msg.content.slice(0, 50),
      });
      toast('⭐ 已收藏');
    } catch(e) { toast(e.message); }
  },

  ctxCopy() {
    this.closeCtx();
    const msg = State.messages.find(m => m.id === this.ctxMsgId);
    if (msg?.content) { navigator.clipboard?.writeText(msg.content); toast('已复制'); }
  },

  async ctxDel() {
    this.closeCtx();
    if (!this.ctxMsgId) return;
    try {
      await API.del('/api/messages/' + this.ctxMsgId);
      State.messages = State.messages.filter(m => m.id !== this.ctxMsgId);
      this.renderAll();
      toast('已删除');
    } catch(e) { toast(e.message); }
  },

  closeCtx() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    document.getElementById('ctx-overlay')?.classList.remove('show');
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
    new Audio(url).play().catch(() => toast('播放失败'));
  },
};

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
