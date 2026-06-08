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
    const prev = State.messages[State.messages.length - 1];
    State.messages.push(m);
    const el = document.getElementById('chat-messages');
    if (!el) return;
    if (el.querySelector('.empty')) el.innerHTML = '';
    // 超5分钟显示时间（微信逻辑）
    const showTime = !prev || (new Date(m.created_at) - new Date(prev.created_at)) > 300000;
    if (showTime) {
      const timeDiv = document.createElement('div');
      timeDiv.className = 'msg-time';
      timeDiv.textContent = fmtTime(m.created_at);
      el.appendChild(timeDiv);
    }
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
      input.onkeydown = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } };
      input.oninput = () => this.onInputChange(input);
    }
    // + 按钮 — 直接绑定，不依赖inline onclick
    const plusBtn = document.getElementById('chat-plus-btn');
    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlusMenu();
      });
    }
    // 点击外部关闭 plus 和 @ 菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#at-menu') && !e.target.closest('#chat-input')) {
        this.closeAtMenu();
      }
      this.closePlusMenu();
    });
    // @ 菜单 items
    document.querySelectorAll('.at-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectAt(item.dataset.type);
      });
    });
    document.getElementById('img-picker')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.sendImageFile(file);
      e.target.value = '';
    });
  },

  togglePlusMenu() {
    const menu = document.getElementById('chat-plus-menu');
    if (!menu) return;
    if (menu.classList.contains('show')) {
      this.closePlusMenu();
    } else {
      menu.classList.add('show');
    }
  },

  closePlusMenu() {
    const menu = document.getElementById('chat-plus-menu');
    if (!menu || !menu.classList.contains('show')) return;
    menu.style.animation = 'iosSlideDown 0.16s cubic-bezier(.4,0,1,1) both';
    setTimeout(() => {
      menu.classList.remove('show');
      menu.style.animation = '';
    }, 150);
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
      const compressed = await this.compressImage(file, 720, 0.82);
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
    // 保底轮询：每3秒检查一次新消息
    if (this._pollTimer) clearInterval(this._pollTimer);
    this._pollTimer = setInterval(() => this.pollNewMessages(), 3000);
  },

  async pollNewMessages() {
    if (!API.token()) return;
    try {
      const data = await API.get('/api/messages?limit=10');
      const msgs = data.messages || [];
      for (const msg of msgs) {
        if (msg.id > this.lastId && !State.messages.find(m => m.id === msg.id)) {
          this.lastId = msg.id;
          if (msg.sender_id !== State.user.id) this.appendMsg(msg);
        }
      }
      if (msgs.length) this.lastId = Math.max(this.lastId, ...msgs.map(m => m.id));
    } catch {}
  },

  // @ 模式状态
  atMode: null, // null | 'wo' | 'ta' | 'product' | 'bookmark'

  // 统一发送入口 — 判断是否 @ 模式
  async send() {
    if (this.atMode) {
      await this.handleAtSend();
      return;
    }
    // 检测「商品+款号」触发库存查询
    const input = document.getElementById('chat-input');
    const val = (input ? input.value : '').trim();
    const stockMatch = val.match(/^商品\s*([A-Za-z0-9\-]+)$/);
    if (stockMatch) {
      const sku = stockMatch[1];
      if (input) input.value = '';
      await this.showStockCard(sku);
      return;
    }
    await this.sendText();
  },

  // 查库存入口 — 弹出输入框
  showScanMenu() {
    const menu = document.getElementById('scan-menu');
    if (!menu) return;
    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      // 点外部关闭
      setTimeout(() => {
        document.addEventListener('click', function closeScan(e) {
          if (!e.target.closest('#scan-menu') && !e.target.closest('#scan-top-btn')) {
            menu.style.display = 'none';
          }
          document.removeEventListener('click', closeScan);
        });
      }, 50);
    }
  },

  showStockQuery() {
    this.closePlusMenu();
    const sku = window.prompt('输入款号查库存（如 4237）：');
    if (sku && sku.trim()) this.showStockCard(sku.trim());
  },

  // 扫一扫 — 调用相机扫二维码
  startScan() {
    this.closePlusMenu();
    const input = document.getElementById('qr-scanner');
    if (!input) return;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      input.value = '';
      // 用BarcodeDetector扫码（iOS 17+ / Android Chrome支持）
      if ('BarcodeDetector' in window) {
        try {
          const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
          const bitmap = await createImageBitmap(file);
          const codes = await detector.detect(bitmap);
          if (codes.length) {
            const raw = codes[0].rawValue;
            // 从二维码内容提取款号：S123-2604K4237-蓝色-XL → K4237 或完整编码
            const match = raw.match(/S123-[\dA-Z]+([A-Z]\d+)/i) || raw.match(/([A-Z]\d{4,})/i);
            const sku = match ? match[0].replace(/^S123-\w+-.*$/, raw.split('-').slice(0,2).join('-')) : raw;
            toast('扫到：' + raw);
            await this.showStockCard(raw);
          } else {
            toast('未识别到二维码，请手动输入款号');
            this.showStockQuery();
          }
        } catch(err) {
          toast('扫码失败，请手动输入');
          this.showStockQuery();
        }
      } else {
        toast('此设备不支持自动扫码，请手动输入款号');
        this.showStockQuery();
      }
    };
    input.click();
  },

  async showStockCard(sku) {
    try {
      toast('查询中...');
      const d = await API.get('/api/kuaima/goods?sku=' + encodeURIComponent(sku));
      if (!d.found) { toast('快麦未找到该款号'); return; }
      // 打开商品编辑面板，预填款号并自动同步
      // 先设置新建模式
      Wealth.openNewProduct && Wealth.openNewProduct();
      showSheet('product-edit-overlay');
      setTimeout(() => {
        const skuInput = document.getElementById('product-edit-sku');
        if (skuInput) {
          skuInput.value = d.outer_id || sku;
          Wealth.syncFromKuaima();
        }
      }, 300);
    } catch(e) { toast('查询失败：' + e.message); }
  },

  // oninput 钩子 — 检测 @ 触发
  onInputChange(input) {
    const val = input.value;
    // 空输入且有 @ 模式时不做处理
    if (this.atMode) return;
    // 用户输入 @ 符号（且是第一个字符或前面有空格）
    const lastChar = val.slice(-1);
    if (lastChar === '@' && (val.length === 1 || val.slice(-2, -1) === ' ' || val.slice(-2, -1) === '\n')) {
      this.showAtMenu();
    } else {
      this.closeAtMenu();
    }
    // 自动高度
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  },

  showAtMenu() {
    const menu = document.getElementById('at-menu');
    if (menu) {
      menu.style.animation = '';
      menu.classList.add('show');
    }
    document.getElementById('at-confirm').style.display = 'none';
  },

  closeAtMenu() {
    const menu = document.getElementById('at-menu');
    if (!menu || !menu.classList.contains('show')) return;
    menu.style.animation = 'iosSlideDown 0.16s cubic-bezier(.4,0,1,1) both';
    setTimeout(() => {
      menu.classList.remove('show');
      menu.style.animation = '';
    }, 150);
  },

  selectAt(type) {
    this.atMode = type;
    this.closeAtMenu();
    // 清除 @ 符号
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = input.value.replace(/@$/, '');
      input.focus();
    }
    // 显示确认条
    const labels = { wo:'📌 Wo任务 — 描述你要做的事', ta:'📋 Ta任务 — 说明谁做什么', product:'📦 @商品 — 输入商品名或款号', bookmark:'⭐ @收藏 — 选择收藏发送到会话' };
    const hints = { wo:'例：下午去基地拍4228，晚上直播前剪完', ta:'例：小伍今天把K4226显瘦视频重拍，8点前', product:'例：4228 或 Polo衫', bookmark:'' };
    document.getElementById('at-confirm-type-label').textContent = labels[type] || '';
    document.getElementById('at-confirm-hint').textContent = hints[type] || '';
    const confirmEl = document.getElementById('at-confirm');
    confirmEl.style.animation = '';
    confirmEl.style.display = 'block';
    // 触发 reflow 再加动画
    void confirmEl.offsetWidth;
    confirmEl.style.animation = 'iosSlideUp 0.22s cubic-bezier(.2,.8,.2,1) both';
    const placeholder = { wo:'描述任务，直接发送即可创建…', ta:'说明谁负责做什么…', product:'输入商品名或款号…', bookmark:'' };
    if (input) input.placeholder = placeholder[type] || '输入…';
    // bookmark 直接打开选择器
    if (type === 'bookmark') {
      this.cancelAt();
      this.showBookmarkPicker();
    }
  },

  cancelAt() {
    this.atMode = null;
    const confirmEl = document.getElementById('at-confirm');
    if (confirmEl && confirmEl.style.display !== 'none') {
      confirmEl.style.animation = 'iosSlideDown 0.15s cubic-bezier(.4,0,1,1) both';
      setTimeout(() => { confirmEl.style.display = 'none'; confirmEl.style.animation = ''; }, 140);
    }
    const input = document.getElementById('chat-input');
    if (input) { input.placeholder = '输入消息...'; input.focus(); }
  },

  async handleAtSend() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    const mode = this.atMode;
    this.cancelAt();

    if (mode === 'product') {
      await this.handleAtProduct(text);
      return;
    }
    if (mode === 'wo' || mode === 'ta') {
      await this.handleAtTask(mode, text);
      return;
    }
  },

  // ── 商品搜索 ──
  async handleAtProduct(keyword) {
    try {
      const d = await API.get('/api/products');
      const kw = keyword.toLowerCase();
      const match = d.products.filter(p =>
        (p.name||'').toLowerCase().includes(kw) ||
        (p.sku||'').toLowerCase().includes(kw)
      );
      if (match.length === 0) {
        // 没有 → 提示新建
        await API.post('/api/messages', {
          type: 'text',
          content: `🔍 未找到"${keyword}"相关商品，需要新建吗？`
        });
        toast('未找到商品，可去执行页新建');
      } else if (match.length === 1) {
        const p = match[0];
        await API.post('/api/messages', {
          type: 'text',
          content: `📦 ${p.name}（${p.sku}）\n售价 ¥${p.price||'–'} · 库存 ${p.stock||'–'}`
        });
        toast('已发送商品卡片');
      } else {
        // 多个结果，发一条汇总
        const list = match.slice(0,5).map(p=>`• ${p.name}（${p.sku}）`).join('\n');
        await API.post('/api/messages', { type:'text', content:`📦 找到 ${match.length} 个商品：\n${list}` });
        toast(`找到 ${match.length} 个商品`);
      }
    } catch { toast('搜索失败'); }
  },

  // ── AI 解析任务 ──
  async handleAtTask(mode, text) {
    // 先发一条 "解析中" 的本地提示
    toast('⚡ 正在解析...');

    // 用 Claude API 解析自然语言
    const parsed = await this.parseTaskWithAI(mode, text);

    if (mode === 'wo') {
      await this.createWoTaskFromParsed(parsed, text);
    } else {
      await this.createTaTaskFromParsed(parsed, text);
    }
  },

  async parseTaskWithAI(mode, text) {
    const today = new Date().toISOString().slice(0,10);
    const isWo = mode === 'wo';
    const assigneeLine = isWo ? '' : '\n- assignee_name: 负责人姓名（只提取人名，多人用逗号分隔，不确定则 null）';
    const exampleWo = '{"title":"拍4228 Polo衫","due_date":"'+today+'","product_sku":"4228"}';
    const exampleTa = '{"title":"重拍K4226显瘦视频","due_date":"'+today+'","product_sku":"K4226","assignee_name":"小伍"}';
    const prompt = '你是一个任务解析助手。从下面这句话里提取任务信息，返回 JSON。\n'
      + '今天日期：' + today + '\n\n'
      + '输入：' + text + '\n\n'
      + '要提取的字段（全部可为 null）：\n'
      + '- title: 任务标题（核心动作，简短，不超过20字）\n'
      + '- due_date: 截止日期（格式 YYYY-MM-DD，今晚明天等要换算，不确定则 null）\n'
      + '- product_sku: 商品款号或关键词（只要纯数字+字母，如 4228、K4226，没有则 null）'
      + assigneeLine + '\n\n'
      + '只返回 JSON，不要其他内容。示例：\n'
      + (isWo ? exampleWo : exampleTa);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const raw = (data.content||[]).map(c=>c.text||'').join('').trim();
      const clean = raw.replace(/```json|```/g,'').trim();
      return JSON.parse(clean);
    } catch {
      // 解析失败 → 用原文作标题
      return { title: text.slice(0,40), due_date: null, product_sku: null, assignee_name: null };
    }
  },

  async createWoTaskFromParsed(parsed, rawText) {
    const title = parsed.title || rawText.slice(0,40);
    let product_id = null;
    let product_name = null;
    if (parsed.product_sku) {
      try {
        const d = await API.get('/api/products');
        const kw = parsed.product_sku.toLowerCase();
        const p = d.products.find(p => (p.sku||'').toLowerCase().includes(kw) || (p.name||'').toLowerCase().includes(kw));
        if (p) { product_id = p.id; product_name = p.name; }
      } catch {}
    }
    try {
      const d = await API.post('/api/tasks', {
        title, assignee_id: State.user.id,
        product_id: product_id||undefined,
        due_date: parsed.due_date||undefined
      });
      const task = { ...d.task, product_name };
      // 发任务卡片到会话
      await API.post('/api/messages', {
        type: 'task_card',
        content: JSON.stringify({
          task_id: task.id, title,
          assignee_name: State.user.name,
          product_name, due_date: parsed.due_date
        })
      });
      if (typeof Exec !== 'undefined') Exec.loadAll().then(()=>Exec.render());
      toast('✅ Wo任务已创建');
    } catch(e) { toast('创建失败：'+e.message); }
  },

  async createTaTaskFromParsed(parsed, rawText) {
    const title = parsed.title || rawText.slice(0,40);
    let product_id = null;
    let product_name = null;
    if (parsed.product_sku) {
      try {
        const d = await API.get('/api/products');
        const kw = parsed.product_sku.toLowerCase();
        const p = d.products.find(p => (p.sku||'').toLowerCase().includes(kw) || (p.name||'').toLowerCase().includes(kw));
        if (p) { product_id = p.id; product_name = p.name; }
      } catch {}
    }

    // 尝试匹配团队成员
    let assignees = [];
    try {
      const ud = await API.get('/api/users');
      const members = ud.users;
      if (parsed.assignee_name) {
        const names = parsed.assignee_name.split(/[,，、]/);
        for (const n of names) {
          const m = members.find(u => u.name.includes(n.trim()) || n.trim().includes(u.name));
          if (m && !assignees.find(a=>a.id===m.id)) assignees.push(m);
        }
      }
      // 没匹配到 → 显示成员选择器
      if (!assignees.length) {
        assignees = members;
        this.showTaConfirmSheet(title, assignees, product_id, product_name, parsed.due_date);
        return;
      }
    } catch {}

    // 有匹配的人 → 直接创建
    await this.createTaTasks(title, assignees, product_id, product_name, parsed.due_date);
  },

  // 成员选择确认（当 AI 没识别出人时）
  showTaConfirmSheet(title, members, product_id, product_name, due_date) {
    document.getElementById('ta-task-title').value = title;
    document.getElementById('ta-task-due').value = due_date||'';
    // 加载成员标签
    const wrap = document.getElementById('ta-task-members');
    wrap.innerHTML = members.map(u =>
      `<div class="member-tag selected" data-uid="${u.id}" onclick="Chat.toggleMemberTag(this)">${escHtml(u.name)}</div>`
    ).join('');
    // 商品选择
    API.get('/api/products').then(d => {
      const opts = '<option value="">不关联商品</option>' +
        d.products.map(p=>`<option value="${p.id}" ${p.id===product_id?'selected':''}>${p.sku} ${p.name}</option>`).join('');
      document.getElementById('ta-task-product').innerHTML = opts;
    });
    showSheet('ta-task-overlay');
  },

  async createTaTasks(title, assignees, product_id, product_name, due_date) {
    try {
      const tasks = [];
      for (const u of assignees) {
        const d = await API.post('/api/tasks', {
          title, assignee_id: u.id,
          product_id: product_id||undefined,
          due_date: due_date||undefined
        });
        tasks.push({ ...d.task, product_name });
      }
      const names = assignees.map(u=>u.name).join('、');
      await API.post('/api/messages', {
        type: 'task_card',
        content: JSON.stringify({ task_id:tasks[0].id, title, assignee_name:names, product_name, due_date })
      });
      if (typeof Exec !== 'undefined') Exec.loadAll().then(()=>Exec.render());
      toast(`✅ 已指派给 ${names}`);
    } catch(e) { toast('创建失败：'+e.message); }
  },

};
