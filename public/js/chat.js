'use strict';

const Chat = {
  lastId: 0,
  sse: null,
  ctxMsgId: null,
  plusOpen: false,

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
    const senderUser = { name, avatar_url: m.sender_avatar };
    const avatarHtml = getAvatarHtml(senderUser, 40, '6px');

    // system message
    if (m.type === 'system') {
      try {
        const d = JSON.parse(m.content);
        if (d.type === 'daily_report') {
          return `<div class="msg-system">
            <div class="msg-system-title">📊 今日数据 · ${d.date}</div>
            <div class="msg-system-row"><span>今日GMV</span><span class="msg-system-val">${fmtMoney(d.gmv)}</span></div>
            <div class="msg-system-row"><span>订单数</span><span>${d.order_count||0}</span></div>
            <div class="msg-system-row"><span>转化率</span><span>${((d.conversion_rate||0)*100).toFixed(2)}%</span></div>
          </div>`;
        }
      } catch {}
    }

    // task card
    if (m.type === 'task_card') {
      try {
        const d = JSON.parse(m.content);
        return `<div class="msg-system" style="cursor:pointer" onclick="switchTab('exec')">
          <div class="msg-system-title" style="display:flex;align-items:center;gap:6px;color:var(--green)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            新任务
          </div>
          <div style="font-size:var(--font-base);color:var(--text);margin-top:4px;font-weight:500">${escHtml(d.title)}</div>
          ${d.assignee_name ? `<div style="font-size:var(--font-sm);color:var(--text3);margin-top:4px">负责人：${escHtml(d.assignee_name)}</div>` : ''}
          ${d.product_name ? `<div style="font-size:var(--font-sm);color:var(--text3)">商品：${escHtml(d.product_name)}</div>` : ''}
          ${d.due_date ? `<div style="font-size:var(--font-sm);color:var(--orange)">截止：${d.due_date}</div>` : ''}
        </div>`;
      } catch {}
    }

    let bubbleContent = '';
    if (m.type === 'image') {
      bubbleContent = `<img src="${m.content}" class="msg-img" onclick="window.open('${m.content}')">`;
    } else if (m.ref_type === 'task' && m.ref_id) {
      bubbleContent = `<div class="msg-card"><div style="font-size:12px;color:var(--green);margin-bottom:4px">✅ 已转为任务</div><div>${this.esc(m.content.slice(0,60))}</div></div>`;
    } else {
      bubbleContent = `<span>${this.esc(m.content)}</span>`;
    }

    return `<div class="msg-row ${isMe?'me':''}" data-id="${m.id}">
      <div class="msg-avatar-wrap">${avatarHtml}</div>
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
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  },

  // ── 输入栏绑定 ──
  bindInputBar() {
    const input = document.getElementById('chat-input');
    if (input) {
      input.onkeydown = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); this.sendText(); } };
      input.oninput = () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      };
    }
    // + 按钮 — 直接绑定，不依赖inline onclick
    const plusBtn = document.getElementById('chat-plus-btn');
    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlusMenu();
      });
    }
    // 点击外部关闭
    document.addEventListener('click', () => this.closePlusMenu());
    document.getElementById('img-picker')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.sendImageFile(file);
      e.target.value = '';
    });
  },

  togglePlusMenu() {
    const menu = document.getElementById('chat-plus-menu');
    if (!menu) return;
    const isOpen = menu.classList.contains('show');
    if (isOpen) {
      menu.classList.remove('show');
    } else {
      menu.classList.add('show');
    }
  },

  closePlusMenu() {
    document.getElementById('chat-plus-menu')?.classList.remove('show');
  },

  async sendText() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    this.closePlusMenu();
    try {
      const data = await API.post('/api/messages', { type:'text', content:text });
      this.appendMsg({ ...data.message, sender_name:State.user.name, sender_role:State.user.role, sender_avatar:State.user.avatar_url });
    } catch { toast('发送失败'); }
  },

  // 图片压缩上传
  async sendImageFile(file) {
    try {
      const compressed = await this.compressImage(file, 1080, 0.82);
      const fd = new FormData();
      fd.append('file', compressed, 'image.jpg');
      fd.append('type', 'image');
      const data = await API.upload('/api/messages/upload', fd);
      this.appendMsg({ ...data.message, sender_name:State.user.name, sender_role:State.user.role, sender_avatar:State.user.avatar_url });
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
          resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  // 发任务卡片到会话
  async sendTaskCard(task) {
    try {
      await API.post('/api/messages', {
        type: 'task_card',
        content: JSON.stringify({ task_id:task.id, title:task.title, assignee_name:task.assignee_name, product_name:task.product_name, due_date:task.due_date })
      });
    } catch {}
  },

  // 从收藏发到会话
  async sendBookmarkToChat(bookmark) {
    try {
      await API.post('/api/messages', { type:'text', content:bookmark.title||'收藏内容' });
      toast('已发送到会话');
      hideSheet('bookmark-picker-overlay');
      switchTab('chat');
    } catch { toast('发送失败'); }
  },

  // ── 加号菜单各项 ──
  openPhoto() {
    this.closePlusMenu();
    document.getElementById('img-picker').click();
  },

  showWoTask() {
    this.closePlusMenu();
    // 默认明天
    const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
    const tStr = tmr.toISOString().slice(0,10);
    document.getElementById('wo-task-title').value = '';
    document.getElementById('wo-task-due').value = tStr;
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
    const due_date = document.getElementById('wo-task-due').value;
    try {
      const d = await API.post('/api/tasks', { title, assignee_id:State.user.id, product_id:product_id||undefined, due_date:due_date||undefined });
      hideSheet('wo-task-overlay');
      await this.sendTaskCard(d.task);
      if (typeof Exec !== 'undefined') { Exec.loadAll().then(()=>Exec.render()); }
      toast('✅ 任务已创建');
    } catch(e) { toast(e.message); }
  },

  showTaTask() {
    this.closePlusMenu();
    const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
    document.getElementById('ta-task-title').value = '';
    document.getElementById('ta-task-due').value = tmr.toISOString().slice(0,10);
    document.getElementById('ta-task-product').innerHTML = '<option value="">不关联商品</option>';
    // 加载成员标签
    Promise.all([API.get('/api/users'), API.get('/api/products')]).then(([ud, pd]) => {
      // 成员标签全选
      const members = ud.users;
      const wrap = document.getElementById('ta-task-members');
      wrap.innerHTML = members.map(u => `
        <div class="member-tag selected" data-uid="${u.id}" onclick="Chat.toggleMemberTag(this)">
          ${escHtml(u.name)}
        </div>`).join('');
      document.getElementById('ta-task-product').innerHTML =
        '<option value="">不关联商品</option>' +
        pd.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
    showSheet('ta-task-overlay');
  },

  toggleMemberTag(el) {
    el.classList.toggle('selected');
  },

  async saveTaTask() {
    const title = document.getElementById('ta-task-title').value.trim();
    if (!title) { toast('请填写任务标题'); return; }
    const selected = [...document.querySelectorAll('#ta-task-members .member-tag.selected')];
    if (!selected.length) { toast('请至少选择一位成员'); return; }
    const product_id = document.getElementById('ta-task-product').value;
    const due_date = document.getElementById('ta-task-due').value;
    try {
      // 每人创建一条任务
      const tasks = [];
      for (const tag of selected) {
        const d = await API.post('/api/tasks', { title, assignee_id:tag.dataset.uid, product_id:product_id||undefined, due_date:due_date||undefined });
        tasks.push(d.task);
      }
      hideSheet('ta-task-overlay');
      // 推送一条合并卡片
      const names = tasks.map(t=>t.assignee_name).filter(Boolean).join('、');
      await API.post('/api/messages', {
        type:'task_card',
        content: JSON.stringify({ task_id:tasks[0].id, title, assignee_name:names, product_name:tasks[0].product_name, due_date })
      });
      if (typeof Exec !== 'undefined') { Exec.loadAll().then(()=>Exec.render()); }
      toast(`✅ 已指派给 ${names}`);
    } catch(e) { toast(e.message); }
  },

  showProductPicker() {
    this.closePlusMenu();
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');
    });
  },

  async sendProductCard(productId) {
    hideSheet('product-picker-overlay');
    try {
      const d = await API.get('/api/products');
      const p = d.products.find(p => p.id === productId);
      if (!p) return;
      await API.post('/api/messages', { type:'text', content:`📦 商品：${p.name}（${p.sku}）售价 ¥${p.price}` });
      toast('已发送商品');
    } catch {}
  },

  showBookmarkPicker() {
    this.closePlusMenu();
    showSheet('bookmark-picker-overlay');
    const el = document.getElementById('bookmark-picker-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    API.get('/api/users/me/bookmarks').then(d => {
      const bms = d.bookmarks || [];
      if (!bms.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏</div></div>'; return; }
      el.innerHTML = bms.map(b => `
        <div class="list-item">
          <div class="list-item-body">
            <div class="list-item-title">${escHtml(b.title||'收藏内容')}</div>
            <div class="list-item-sub">${b.ref_type||'消息'} · ${fmtTime(b.saved_at)}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick='Chat.sendBookmarkToChat(${JSON.stringify(b).replace(/'/g,"&#39;")})'>发送</button>
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

  closeCtx() {
    document.getElementById('ctx-menu')?.classList.remove('show');
    document.getElementById('ctx-overlay')?.classList.remove('show');
  },

  async ctxToTask() {
    this.closeCtx();
    if (!this.ctxMsgId) return;
    try { await API.post('/api/messages/'+this.ctxMsgId+'/to-task', {}); toast('✅ 已转为任务'); }
    catch(e) { toast(e.message); }
  },

  async ctxBookmark() {
    this.closeCtx();
    const msg = State.messages.find(m => m.id === this.ctxMsgId);
    if (!msg) return;
    try {
      await API.post('/api/users/me/bookmarks', { ref_id:msg.id, ref_type:'message', title:msg.content.slice(0,50) });
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
      await API.del('/api/messages/'+this.ctxMsgId);
      State.messages = State.messages.filter(m => m.id !== this.ctxMsgId);
      this.renderAll();
      toast('已删除');
    } catch(e) { toast(e.message); }
  },

  startSSE() {
    if (this.sse) this.sse.close();
    const token = API.token();
    if (!token) return;
    this.sse = new EventSource('/api/sse?token='+encodeURIComponent(token));
    this.sse.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        if (d.type==='message') {
          const msg = d.data;
          if (msg.id > this.lastId && !State.messages.find(m => m.id===msg.id)) {
            this.lastId = msg.id;
            if (msg.sender_id !== State.user.id) this.appendMsg(msg);
          }
        }
      } catch {}
    };
    this.sse.onerror = () => { setTimeout(()=>this.startSSE(), 5000); };
  },
};
