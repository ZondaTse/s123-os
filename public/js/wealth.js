'use strict';

const Wealth = {
  moments: [],
  products: [],

  async init() {
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const [t, m, mo, pr] = await Promise.all([
        API.get('/api/gmv/today'),
        API.get('/api/gmv/monthly'),
        API.get('/api/moments'),
        API.get('/api/products'),
      ]);
      State.gmv = t;
      State.monthly = m;
      this.moments = mo.moments;
      this.products = pr.products;
    } catch(e) { console.error(e); }
  },

  render() {
    const el = document.getElementById('wealth-content');
    if (!el) return;

    const t = State.gmv || {};
    const m = State.monthly || {};
    const latestMoment = this.moments[0];
    const todayGmv = t.gmv || 0;
    const monthGmv = m.gmv || 0;
    const pct = m.completion_rate || 0;
    const projProfit = m.projected_profit || 0;

    el.innerHTML = `
      <!-- 发财圈大卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showMomentsPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          发财圈
        </div>
        ${latestMoment ? `
          <div style="display:flex;gap:12px;align-items:flex-start;margin-top:10px">
            <div class="moment-avatar" style="background:${avatarColor(latestMoment.user_name)};width:36px;height:36px;border-radius:6px;flex-shrink:0">
              ${latestMoment.user_avatar ? `<img src="${latestMoment.user_avatar}" style="width:100%;height:100%;object-fit:cover">` : `<span style="color:white;font-size:13px;font-weight:700">${avatarLetter(latestMoment.user_name)}</span>`}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--font-sm);font-weight:600;color:var(--green)">${escHtml(latestMoment.user_name)}</div>
              <div style="font-size:var(--font-sm);color:var(--text);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escHtml(latestMoment.content)}</div>
              <div style="font-size:var(--font-xs);color:var(--text3);margin-top:4px">${fmtTime(latestMoment.created_at)}</div>
            </div>
            ${latestMoment.image_url ? `<img src="${latestMoment.image_url}" style="width:56px;height:56px;border-radius:6px;object-fit:cover;flex-shrink:0">` : ''}
          </div>
        ` : `<div style="padding:20px 0;text-align:center;color:var(--text3);font-size:var(--font-sm)">还没有内容，发布第一条高光时刻</div>`}
        <div class="wbc-arrow">查看全部 ›</div>
      </div>

      <!-- GMV大卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showGMVPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          GMV
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div>
            <div style="font-size:var(--font-xs);color:var(--text3)">今日GMV</div>
            <div style="font-size:var(--font-xl);font-weight:700;color:var(--green)">¥${todayGmv.toLocaleString('zh-CN')}</div>
          </div>
          <div>
            <div style="font-size:var(--font-xs);color:var(--text3)">本月GMV</div>
            <div style="font-size:var(--font-xl);font-weight:700;color:var(--text)">¥${(monthGmv/10000).toFixed(1)}w</div>
          </div>
          <div>
            <div style="font-size:var(--font-xs);color:var(--text3)">目标完成率</div>
            <div style="font-size:var(--font-lg);font-weight:700;color:${pct>=100?'var(--green)':pct>=60?'var(--orange)':'var(--red)'}">${pct}%</div>
          </div>
          <div>
            <div style="font-size:var(--font-xs);color:var(--text3)">预计利润</div>
            <div style="font-size:var(--font-lg);font-weight:700;color:var(--green)">¥${projProfit.toLocaleString('zh-CN')}</div>
          </div>
        </div>
        <div class="wbc-arrow">查看详情 ›</div>
      </div>

      <!-- 商品中心大卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showProductsPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          商品中心
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;overflow-x:auto;padding-bottom:4px">
          ${this.products.slice(0,4).map(p => `
            <div style="flex-shrink:0;width:80px;text-align:center">
              <div style="width:80px;height:80px;background:var(--bg2);border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px">
                ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover">` : '🛍'}
              </div>
              <div style="font-size:11px;color:var(--text);margin-top:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escHtml(p.name)}</div>
              <div style="font-size:11px;color:var(--text3)">¥${p.price}</div>
            </div>
          `).join('')}
          ${!this.products.length ? `<div style="color:var(--text3);font-size:var(--font-sm);padding:20px 0">还没有商品</div>` : ''}
        </div>
        <div class="wbc-arrow">管理商品 ›</div>
      </div>

      <div style="height:24px"></div>
    `;
  },

  // ── 发财圈完整页 ──
  showMomentsPage() {
    const el = document.getElementById('wealth-content');
    el.innerHTML = `
      <div style="padding:12px 16px;display:flex;align-items:center;gap:12px">
        <button onclick="Wealth.render()" style="background:none;border:none;color:var(--green);font-size:var(--font-sm);cursor:pointer;padding:0">‹ 返回</button>
        <span style="font-size:var(--font-base);font-weight:600;flex:1">发财圈</span>
        <button onclick="Wealth.showPublish()" style="background:none;border:none;color:var(--green);font-size:var(--font-sm);cursor:pointer;font-weight:600">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
      </div>
      <div id="moments-list">
        ${this.moments.length ? this.moments.map(m => this.momentCard(m)).join('') :
          '<div class="empty"><div class="empty-icon">🎉</div><div class="empty-text">发布第一条高光时刻</div></div>'}
      </div>
    `;
    // 更新header
    document.getElementById('header-title').textContent = '发财圈';
  },

  momentCard(m) {
    const color = avatarColor(m.user_name);
    const likes = m.likes || [];
    const iLiked = likes.includes(State.user?.id);
    const comments = m.comments || [];
    const avatarHtml = m.user_avatar
      ? `<img src="${m.user_avatar}" style="width:100%;height:100%;object-fit:cover">`
      : `<span style="color:white;font-size:15px;font-weight:700">${avatarLetter(m.user_name)}</span>`;

    return `<div class="moment-item" data-id="${m.id}">
      <div class="moment-header">
        <div class="moment-avatar" style="background:${color}">${avatarHtml}</div>
        <div style="flex:1">
          <div class="moment-name">${escHtml(m.user_name)}</div>
          <div class="moment-role">${roleLabel(m.user_role)}</div>
        </div>
        <div class="moment-time-top">${fmtTime(m.created_at)}</div>
      </div>
      <div class="moment-content">${escHtml(m.content)}</div>
      ${m.product_name ? `<div class="moment-product-tag"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> ${escHtml(m.product_name)}</div>` : ''}
      ${m.image_url ? `<img class="moment-img" src="${m.image_url}" onclick="window.open('${m.image_url}')">` : ''}
      ${comments.length ? `<div class="moment-comments">${comments.map(c =>
        `<div class="moment-comment"><span class="moment-comment-name">${escHtml(c.user_name)}：</span>${escHtml(c.content)}</div>`
      ).join('')}</div>` : ''}
      <div class="moment-actions">
        <button class="moment-action-btn ${iLiked?'liked':''}" onclick="Wealth.toggleLike(${m.id})">
          <svg viewBox="0 0 24 24" fill="${iLiked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${likes.length || '点赞'}
        </button>
        <button class="moment-action-btn" onclick="Wealth.showComment(${m.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${comments.length || '评论'}
        </button>
        ${m.user_id === State.user?.id ? `<button class="moment-action-btn" style="margin-left:auto;color:var(--text3)" onclick="Wealth.deleteMoment(${m.id})">删除</button>` : ''}
      </div>
    </div>`;
  },

  async toggleLike(id) {
    try {
      const d = await API.post('/api/moments/' + id + '/like', {});
      const m = this.moments.find(m => m.id === id);
      if (m) { m.likes = d.likes; this.showMomentsPage(); }
    } catch(e) { toast(e.message); }
  },

  showComment(id) {
    document.getElementById('comment-moment-id').value = id;
    document.getElementById('comment-content').value = '';
    showSheet('comment-overlay');
  },

  async submitComment() {
    const id = document.getElementById('comment-moment-id').value;
    const content = document.getElementById('comment-content').value.trim();
    if (!content) { toast('请填写内容'); return; }
    try {
      const d = await API.post('/api/moments/' + id + '/comments', { content });
      const m = this.moments.find(m => m.id == id);
      if (m) m.comments = [...(m.comments||[]), d.comment];
      hideSheet('comment-overlay');
      this.showMomentsPage();
    } catch(e) { toast(e.message); }
  },

  async deleteMoment(id) {
    if (!window.confirm('确认删除？')) return;
    try {
      await API.del('/api/moments/' + id);
      this.moments = this.moments.filter(m => m.id !== id);
      this.showMomentsPage();
      toast('已删除');
    } catch(e) { toast(e.message); }
  },

  showPublish() {
    document.getElementById('moment-content').value = '';
    document.getElementById('moment-image').value = '';
    const sel = document.getElementById('moment-product');
    sel.innerHTML = '<option value="">不关联商品</option>' +
      this.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    showSheet('moment-overlay');
  },

  async publishMoment() {
    const content = document.getElementById('moment-content').value.trim();
    const product_id = document.getElementById('moment-product').value;
    const imageFile = document.getElementById('moment-image').files[0];
    if (!content) { toast('请填写内容'); return; }
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (product_id) fd.append('product_id', product_id);
      if (imageFile) fd.append('image', imageFile);
      const d = await API.upload('/api/moments', fd);
      this.moments.unshift(d.moment);
      hideSheet('moment-overlay');
      this.showMomentsPage();
      toast('🎉 发布成功');
    } catch(e) { toast(e.message); }
  },

  // ── GMV详情页 ──
  showGMVPage() {
    const el = document.getElementById('wealth-content');
    const t = State.gmv || {};
    const m = State.monthly || {};
    const report = t.report || {};
    el.innerHTML = `
      <div style="padding:12px 16px;display:flex;align-items:center;gap:12px">
        <button onclick="Wealth.render()" style="background:none;border:none;color:var(--green);font-size:var(--font-sm);cursor:pointer;padding:0">‹ 返回</button>
        <span style="font-size:var(--font-base);font-weight:600">GMV详情</span>
      </div>
      <div class="gmv-hero">
        <div class="gmv-hero-label">本月GMV</div>
        <div class="gmv-hero-val">¥${(m.gmv||0).toLocaleString('zh-CN')}</div>
        <div class="gmv-progress-bg"><div class="gmv-progress-fill" style="width:${Math.min(m.completion_rate||0,100)}%"></div></div>
        <div class="gmv-progress-row"><span>${m.completion_rate||0}% 完成</span><span>目标 ¥${((m.target||250000)/10000).toFixed(0)}w</span></div>
      </div>
      <div class="data-cards">
        <div class="data-card"><div class="data-card-val green">¥${(t.gmv||0).toLocaleString('zh-CN')}</div><div class="data-card-label">今日GMV</div></div>
        <div class="data-card"><div class="data-card-val">${t.completion_rate||0}%</div><div class="data-card-label">今日完成率</div></div>
        <div class="data-card"><div class="data-card-val">¥${((m.projected_eom||0)/10000).toFixed(1)}w</div><div class="data-card-label">预计月底</div></div>
        <div class="data-card"><div class="data-card-val green">¥${(m.projected_profit||0).toLocaleString('zh-CN')}</div><div class="data-card-label">预计利润</div></div>
      </div>
      ${report.order_count ? `
      <div class="data-section-title">今日店铺</div>
      <div class="data-cards">
        <div class="data-card"><div class="data-card-val">${report.order_count}</div><div class="data-card-label">订单数</div></div>
        <div class="data-card"><div class="data-card-val">${report.visitor_count||0}</div><div class="data-card-label">访客数</div></div>
        <div class="data-card"><div class="data-card-val">${((report.conversion_rate||0)*100).toFixed(2)}%</div><div class="data-card-label">转化率</div></div>
        <div class="data-card"><div class="data-card-val red">${((report.refund_rate||0)*100).toFixed(2)}%</div><div class="data-card-label">退货率</div></div>
      </div>` : ''}
      <div class="upload-strip" style="margin-top:8px">
        <span class="upload-label">上传今日店铺数据</span>
        <label style="cursor:pointer"><span class="btn btn-sm btn-primary">上传 Excel</span>
        <input id="excel-picker" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Wealth.uploadExcel(this)"></label>
      </div>
      <div id="rank-list" style="margin-top:8px"></div>
      <div style="height:24px"></div>
    `;
    // rankings
    const products = State.rankings || [];
    const rl = document.getElementById('rank-list');
    if (rl && products.length) {
      rl.innerHTML = '<div class="data-section-title">商品GMV排行</div>' +
        products.slice(0,10).map((p,i) => `<div class="rank-item">
          <div class="rank-num ${i===0?'n1':i===1?'n2':i===2?'n3':''}">${i+1}</div>
          <div class="rank-body"><div class="rank-name">${escHtml(p.name)}</div><div class="rank-sub">${p.sku}</div></div>
          <div class="rank-val">${fmtMoney(p.gmv)}</div>
        </div>`).join('');
    }
    document.getElementById('header-title').textContent = 'GMV详情';
  },

  async uploadExcel(input) {
    const file = input.files[0];
    if (!file) return;
    toast('上传中...');
    const fd = new FormData();
    fd.append('file', file);
    input.value = '';
    try {
      const d = await API.upload('/api/gmv/upload-excel', fd);
      toast(`✅ 导入 ${d.imported} 条`);
      await this.loadData();
      this.showGMVPage();
    } catch(e) { toast('上传失败: ' + e.message); }
  },

  // ── 商品中心完整页 ──
  showProductsPage() {
    const el = document.getElementById('wealth-content');
    const statusLabel = { new:'新品', hot:'爆款', stable:'普通', sleeping:'待清货', zombie:'停售' };
    const statusColor = { new:'#1677ff', hot:'#ff8f1f', stable:'#07c160', sleeping:'#999', zombie:'#fa5151' };
    el.innerHTML = `
      <div style="padding:12px 16px;display:flex;align-items:center;gap:12px">
        <button onclick="Wealth.render()" style="background:none;border:none;color:var(--green);font-size:var(--font-sm);cursor:pointer;padding:0">‹ 返回</button>
        <span style="font-size:var(--font-base);font-weight:600;flex:1">商品中心</span>
      </div>
      <div class="product-grid">
        <!-- 新建商品 -->
        <div class="product-card-apple" onclick="Wealth.showAddProduct()" style="display:flex;align-items:center;justify-content:center;min-height:180px;border:2px dashed var(--border)">
          <div style="text-align:center;color:var(--text3)">
            <div style="font-size:32px;margin-bottom:8px">＋</div>
            <div style="font-size:var(--font-sm)">新建商品</div>
          </div>
        </div>
        ${this.products.map(p => `
          <div class="product-card-apple" onclick="Wealth.openProduct(${p.id})">
            <div class="product-card-img">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : '🛍'}
            </div>
            <div class="product-card-body">
              <div class="product-card-status" style="color:${statusColor[p.lifecycle_status]||'#999'}">${statusLabel[p.lifecycle_status]||p.lifecycle_status}</div>
              <div class="product-card-name">${escHtml(p.name)}</div>
              <div class="product-card-price">¥${p.price}</div>
              <div class="product-card-sales">库存 ${p.stock}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:24px"></div>
    `;
    document.getElementById('header-title').textContent = '商品中心';
  },

  showAddProduct() {
    document.getElementById('product-sheet-title').textContent = '新建商品';
    ['product-edit-id','product-edit-sku','product-edit-name',
     'product-edit-stock','product-edit-cost','product-edit-price'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('product-edit-status').value = 'new';
    showSheet('product-edit-overlay');
  },

  openProduct(id) {
    const p = this.products.find(p => p.id === id);
    if (!p) return;
    document.getElementById('product-sheet-title').textContent = '编辑商品';
    document.getElementById('product-edit-id').value = id;
    document.getElementById('product-edit-sku').value = p.sku;
    document.getElementById('product-edit-name').value = p.name;
    document.getElementById('product-edit-price').value = p.price;
    document.getElementById('product-edit-cost').value = p.cost;
    document.getElementById('product-edit-stock').value = p.stock;
    document.getElementById('product-edit-status').value = p.lifecycle_status;
    showSheet('product-edit-overlay');
  },

  async saveProduct() {
    const id = document.getElementById('product-edit-id').value;
    const sku = document.getElementById('product-edit-sku').value.trim();
    const name = document.getElementById('product-edit-name').value.trim();
    if (!sku || !name) { toast('款号和名称必填'); return; }
    const fd = new FormData();
    ['sku','name'].forEach(k => fd.append(k, document.getElementById('product-edit-'+k).value.trim()));
    ['stock','cost','price'].forEach(k => fd.append(k, document.getElementById('product-edit-'+k).value || 0));
    fd.append('lifecycle_status', document.getElementById('product-edit-status').value);
    const img = document.getElementById('product-edit-image').files[0];
    if (img) fd.append('image', img);
    try {
      if (id) await API.upload('/api/products/' + id, fd);
      else await API.upload('/api/products', fd);
      hideSheet('product-edit-overlay');
      const pr = await API.get('/api/products');
      this.products = pr.products;
      this.showProductsPage();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },
};

// ── My 我的 ──
const My = {
  async init() {
    if (!State.monthly) {
      API.get('/api/gmv/monthly').then(d => { State.monthly = d; }).catch(()=>{});
    }
    this.render();
  },

  render() {
    const el = document.getElementById('my-content');
    if (!el || !State.user) return;
    const u = State.user;
    const color = avatarColor(u.name);
    const lvName = levelName(u.level);
    const thresholds = [0,100,300,600,1000,1500,99999];
    const nextT = thresholds[Math.min(u.level,6)];
    const curT = thresholds[Math.max(u.level-1,0)];
    const expPct = nextT > curT ? Math.round((u.exp-curT)/(nextT-curT)*100) : 100;

    el.innerHTML = `
      <div class="my-profile-card">
        <div class="my-info-row">
          <div class="my-avatar-wrap" onclick="showSheet('avatar-overlay')">
            <div class="my-avatar" style="background:${color}">
              ${u.avatar_url ? `<img src="${u.avatar_url}" alt="${u.name}">` : escHtml(avatarLetter(u.name))}
            </div>
            <div class="my-avatar-edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
          </div>
          <div style="flex:1">
            <div class="my-name">${escHtml(u.name)}</div>
            <div class="my-phone">${u.phone||''}</div>
            <div class="my-role-badge">${roleLabel(u.role)}</div>
          </div>
        </div>
        <div class="my-stats">
          <div class="my-stat"><div class="my-stat-val" style="color:var(--green)">${fmtMoney(u.gmv_total)}</div><div class="my-stat-label">累计GMV</div></div>
          <div class="my-stat"><div class="my-stat-val">${u.exp}</div><div class="my-stat-label">EXP</div></div>
          <div class="my-stat"><div class="my-stat-val">Lv${u.level}</div><div class="my-stat-label">${lvName.replace(/Lv\d+ /,'')}</div></div>
        </div>
      </div>

      <div class="exp-bar-wrap">
        <div class="exp-bar-top"><span>${lvName}</span><span style="color:var(--text3)">${u.exp} / ${nextT} EXP</span></div>
        <div class="exp-bar-bg"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
      </div>

      <div class="menu-group">
        <div class="menu-row" onclick="My.showMyTasks()">
          <div class="menu-icon" style="background:#e8f5e9"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#07c160" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          <div class="menu-row-label">我的任务</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="My.showBookmarks()">
          <div class="menu-icon" style="background:#fff8e1"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ffd21e" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div class="menu-row-label">收藏</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="switchTab('wealth');Wealth.showMomentsPage()">
          <div class="menu-icon" style="background:#fce4ec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fa5151" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <div class="menu-row-label">发财圈</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="switchTab('wealth');Wealth.showProductsPage()">
          <div class="menu-icon" style="background:#e3f2fd"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1677ff" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
          <div class="menu-row-label">商品中心</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-row" onclick="showSheet('pwd-overlay')">
          <div class="menu-icon" style="background:#f3e5f5"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#a855f7" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <div class="menu-row-label">修改密码</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="My.logout()">
          <div class="menu-icon" style="background:#fce4ec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fa5151" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
          <div class="menu-row-label" style="color:var(--red)">退出登录</div>
        </div>
      </div>

      <div style="height:32px"></div>
    `;
  },

  pickAvatar(type) {
    hideSheet('avatar-overlay');
    setTimeout(() => {
      document.getElementById(type === 'camera' ? 'avatar-camera' : 'avatar-file').click();
    }, 300);
  },

  async uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    toast('上传中...');
    const fd = new FormData();
    fd.append('avatar', file);
    input.value = '';
    try {
      const d = await API.upload('/api/users/me', fd);
      State.user = { ...State.user, avatar_url: d.user.avatar_url };
      this.render();
      toast('✅ 头像已更新');
    } catch { toast('上传失败'); }
  },

  async deleteAvatar() {
    hideSheet('avatar-overlay');
    try {
      await API.put('/api/users/me', { remove_avatar: '1' });
      State.user = { ...State.user, avatar_url: null };
      this.render();
      toast('头像已删除');
    } catch(e) { toast(e.message); }
  },

  async savePwd() {
    const p1 = document.getElementById('new-pwd').value;
    const p2 = document.getElementById('new-pwd2').value;
    if (!p1) { toast('请填写新密码'); return; }
    if (p1 !== p2) { toast('两次密码不一致'); return; }
    try {
      await API.put('/api/users/me', { password: p1 });
      hideSheet('pwd-overlay');
      document.getElementById('new-pwd').value = '';
      document.getElementById('new-pwd2').value = '';
      toast('✅ 密码已修改');
    } catch(e) { toast(e.message); }
  },

  async showBookmarks() {
    showSheet('bookmarks-overlay');
    const el = document.getElementById('bookmarks-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/users/me/bookmarks');
      const bms = d.bookmarks || [];
      if (!bms.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="empty-text">暂无收藏</div><div class="empty-sub">长按消息可以收藏</div></div>';
        return;
      }
      el.innerHTML = bms.map((b, i) => `
        <div class="list-item">
          <div class="list-item-body">
            <div class="list-item-title">${escHtml(b.title||'收藏内容')}</div>
            <div class="list-item-sub">${b.ref_type||'消息'} · ${fmtTime(b.saved_at)}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="Chat.sendBookmarkToChat(${JSON.stringify(b).replace(/"/g,'&quot;')});hideSheet('bookmarks-overlay')">发到会话</button>
        </div>
      `).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  async showMyTasks() {
    showSheet('mytasks-overlay');
    const el = document.getElementById('mytasks-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/tasks?mine=1');
      if (!d.tasks.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">暂无任务</div></div>';
        return;
      }
      el.innerHTML = d.tasks.map(t => `<div class="task-item">
        <div class="task-check ${t.status==='done'?'done':''}">${t.status==='done'?'<svg viewBox="0 0 12 10" width="12" height="10"><polyline points="1,5 4,8 11,1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>':''}</div>
        <div class="task-body">
          <div class="task-title ${t.status==='done'?'done':''}">${escHtml(t.title)}</div>
          <div class="task-meta"><span>${fmtTime(t.created_at)}</span>${t.product_name?`<span>${escHtml(t.product_name)}</span>`:''}</div>
        </div>
        <span class="status-badge status-${t.status==='todo'?'todo':t.status==='doing'?'doing':'done'}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
      </div>`).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  logout() {
    if (!window.confirm('确认退出登录？')) return;
    localStorage.removeItem('s123_token');
    location.reload();
  },
};

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
