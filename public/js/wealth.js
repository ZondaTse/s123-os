'use strict';

const Wealth = {
  wTab: 'moments',
  moments: [],
  products: [],

  async init() {
    await this.loadData();
    this.renderTab();
  },

  async loadData() {
    try {
      const [t, m, r, mo, pr] = await Promise.all([
        API.get('/api/gmv/today'),
        API.get('/api/gmv/monthly'),
        API.get('/api/gmv/rankings'),
        API.get('/api/moments'),
        API.get('/api/products'),
      ]);
      State.gmv = t;
      State.monthly = m;
      State.rankings = r.products;
      this.moments = mo.moments;
      this.products = pr.products;
    } catch(e) { console.error(e); }
  },

  switchTab(t) {
    this.wTab = t;
    document.querySelectorAll('.wealth-subtab').forEach(b => b.classList.toggle('active', b.dataset.wtab === t));
    // update publish btn visibility
    const pb = document.getElementById('publish-btn');
    if (pb) pb.style.display = t === 'moments' ? '' : 'none';
    this.renderTab();
  },

  renderTab() {
    if (this.wTab === 'moments') this.renderMoments();
    else if (this.wTab === 'products') this.renderProducts();
    else this.renderGMV();
  },

  // ── 发财圈 ──
  renderMoments() {
    const el = document.getElementById('wealth-content');
    if (!el) return;
    if (!this.moments.length) {
      el.innerHTML = `<div class="empty">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">发财圈还没有内容</div>
        <div class="empty-sub">点右上角发布第一条高光时刻</div>
      </div>`;
      return;
    }
    el.innerHTML = this.moments.map(m => this.momentCard(m)).join('');
  },

  momentCard(m) {
    const color = avatarColor(m.user_name);
    const avatarHtml = m.user_avatar
      ? `<img src="${m.user_avatar}" alt="${m.user_name}">`
      : `<span style="color:white;font-size:15px;font-weight:700">${avatarLetter(m.user_name)}</span>`;
    const likes = m.likes || [];
    const myId = State.user?.id;
    const iLiked = likes.includes(myId);
    const comments = m.comments || [];

    return `<div class="moment-item" data-id="${m.id}">
      <div class="moment-header">
        <div class="moment-avatar" style="background:${color}">${avatarHtml}</div>
        <div>
          <div class="moment-name">${escHtml(m.user_name)}</div>
          <div class="moment-role">${roleLabel(m.user_role)}</div>
        </div>
        <div class="moment-time-top">${fmtTime(m.created_at)}</div>
      </div>
      <div class="moment-content">${escHtml(m.content)}</div>
      ${m.product_name ? `<div class="moment-product-tag">🛍 ${escHtml(m.product_name)}</div>` : ''}
      ${m.image_url ? `<img class="moment-img" src="${m.image_url}" onclick="window.open('${m.image_url}')">` : ''}
      ${comments.length ? `<div class="moment-comments">${comments.map(c =>
        `<div class="moment-comment"><span class="moment-comment-name">${escHtml(c.user_name)}：</span>${escHtml(c.content)}</div>`
      ).join('')}</div>` : ''}
      <div class="moment-actions">
        <button class="moment-action-btn ${iLiked?'liked':''}" onclick="Wealth.toggleLike(${m.id})">
          <svg viewBox="0 0 24 24" fill="${iLiked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${likes.length > 0 ? likes.length : '点赞'}
        </button>
        <button class="moment-action-btn" onclick="Wealth.showComment(${m.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${comments.length > 0 ? comments.length : '评论'}
        </button>
        ${m.user_id === myId ? `<button class="moment-action-btn" style="margin-left:auto;color:var(--text3)" onclick="Wealth.deleteMoment(${m.id})">删除</button>` : ''}
      </div>
    </div>`;
  },

  async toggleLike(id) {
    try {
      const d = await API.post('/api/moments/'+id+'/like', {});
      const m = this.moments.find(m => m.id === id);
      if (m) { m.likes = d.likes; this.renderMoments(); }
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
    if (!content) { toast('请填写评论内容'); return; }
    try {
      const d = await API.post('/api/moments/'+id+'/comments', { content });
      const m = this.moments.find(m => m.id == id);
      if (m) { m.comments = [...(m.comments||[]), d.comment]; }
      hideSheet('comment-overlay');
      this.renderMoments();
    } catch(e) { toast(e.message); }
  },

  async deleteMoment(id) {
    if (!window.confirm('确认删除？')) return;
    try {
      await API.del('/api/moments/'+id);
      this.moments = this.moments.filter(m => m.id !== id);
      this.renderMoments();
      toast('已删除');
    } catch(e) { toast(e.message); }
  },

  showPublish() {
    document.getElementById('moment-content').value = '';
    document.getElementById('moment-image').value = '';
    const sel = document.getElementById('moment-product');
    sel.innerHTML = '<option value="">不关联商品</option>' +
      (this.products||[]).map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
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
      this.renderMoments();
      toast('🎉 发布成功');
    } catch(e) { toast(e.message); }
  },

  // ── 商品中心 ──
  renderProducts() {
    const el = document.getElementById('wealth-content');
    if (!el) return;
    if (!this.products.length) {
      el.innerHTML = `<div class="empty">
        <div class="empty-icon">🛍</div>
        <div class="empty-text">还没有商品</div>
        <div class="empty-sub">点右上角添加第一个商品</div>
      </div>`;
      return;
    }
    const statusLabel = { new:'新品', hot:'爆款', stable:'普通', sleeping:'待清货', zombie:'停售' };
    const statusColor = { new:'#1677ff', hot:'#ff8f1f', stable:'#07c160', sleeping:'#999', zombie:'#fa5151' };
    el.innerHTML = `
      <div style="padding:12px 16px 4px;display:flex;justify-content:flex-end">
        <button class="btn btn-primary btn-sm" onclick="Wealth.showAddProduct()">＋ 新建商品</button>
      </div>
      <div class="product-grid">
        ${this.products.map(p => `
          <div class="product-card-apple" onclick="Wealth.openProduct(${p.id})">
            <div class="product-card-img">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : '🛍'}
            </div>
            <div class="product-card-body">
              <div class="product-card-status" style="color:${statusColor[p.lifecycle_status]||'#999'}">
                ${statusLabel[p.lifecycle_status]||p.lifecycle_status}
              </div>
              <div class="product-card-name">${escHtml(p.name)}</div>
              <div class="product-card-price">¥${p.price}</div>
              <div class="product-card-sales">库存 ${p.stock}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:24px"></div>
    `;
  },

  showAddProduct() {
    document.getElementById('product-sheet-title').textContent = '新建商品';
    ['product-edit-id','product-edit-sku','product-edit-name',
     'product-edit-stock','product-edit-cost','product-edit-price'].forEach(id => {
      document.getElementById(id).value = '';
    });
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
    fd.append('sku', sku);
    fd.append('name', name);
    fd.append('stock', document.getElementById('product-edit-stock').value || 0);
    fd.append('cost', document.getElementById('product-edit-cost').value || 0);
    fd.append('price', document.getElementById('product-edit-price').value || 0);
    fd.append('lifecycle_status', document.getElementById('product-edit-status').value);
    const img = document.getElementById('product-edit-image').files[0];
    if (img) fd.append('image', img);
    try {
      if (id) await API.upload('/api/products/'+id, fd);
      else await API.upload('/api/products', fd);
      hideSheet('product-edit-overlay');
      const pr = await API.get('/api/products');
      this.products = pr.products;
      this.renderProducts();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  // ── GMV ──
  renderGMV() {
    const el = document.getElementById('wealth-content');
    if (!el) return;
    const t = State.gmv || {};
    const m = State.monthly || {};
    const pct = m.completion_rate || 0;
    const gmv = m.gmv || 0;
    const target = m.target || 250000;
    const todayGmv = t.gmv || 0;
    const todayTarget = t.target_daily || 8333;
    const todayPct = t.completion_rate || 0;
    const projEom = m.projected_eom || 0;
    const projProfit = m.projected_profit || 0;
    const report = t.report || {};

    el.innerHTML = `
      <div class="gmv-hero">
        <div class="gmv-hero-label">本月GMV</div>
        <div class="gmv-hero-val">¥${gmv.toLocaleString('zh-CN')}</div>
        <div class="gmv-progress-bg"><div class="gmv-progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
        <div class="gmv-progress-row"><span>${pct}% 完成</span><span>目标 ¥${(target/10000).toFixed(0)}w</span></div>
      </div>

      <div class="data-cards">
        <div class="data-card">
          <div class="data-card-val green">¥${todayGmv.toLocaleString('zh-CN')}</div>
          <div class="data-card-label">今日GMV</div>
        </div>
        <div class="data-card">
          <div class="data-card-val ${todayPct>=100?'green':todayPct>=60?'orange':'red'}">${todayPct}%</div>
          <div class="data-card-label">今日完成率</div>
        </div>
        <div class="data-card">
          <div class="data-card-val">¥${(projEom/10000).toFixed(1)}w</div>
          <div class="data-card-label">预计月底</div>
        </div>
        <div class="data-card">
          <div class="data-card-val green">¥${projProfit.toLocaleString('zh-CN')}</div>
          <div class="data-card-label">预计利润</div>
        </div>
      </div>

      ${report.order_count ? `
      <div class="data-section-title">今日店铺详情</div>
      <div class="data-cards">
        <div class="data-card"><div class="data-card-val">${report.order_count}</div><div class="data-card-label">订单数</div></div>
        <div class="data-card"><div class="data-card-val">${report.visitor_count||0}</div><div class="data-card-label">访客数</div></div>
        <div class="data-card"><div class="data-card-val">${((report.conversion_rate||0)*100).toFixed(2)}%</div><div class="data-card-label">转化率</div></div>
        <div class="data-card"><div class="data-card-val red">${((report.refund_rate||0)*100).toFixed(2)}%</div><div class="data-card-label">退货率</div></div>
      </div>` : ''}

      <div class="upload-strip" style="margin:12px 0 0">
        <span class="upload-label">上传今日店铺数据</span>
        <label style="cursor:pointer">
          <span class="btn btn-sm btn-primary">上传 Excel</span>
          <input id="excel-picker" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Wealth.uploadExcel(this)">
        </label>
      </div>

      <div class="data-section-title" style="margin-top:4px">商品 GMV 排行</div>
      <div id="rank-list"></div>
      <div style="height:24px"></div>
    `;
    this.renderRankings();
  },

  renderRankings() {
    const el = document.getElementById('rank-list');
    if (!el) return;
    const products = State.rankings || [];
    if (!products.length) {
      el.innerHTML = '<div class="empty" style="padding:24px"><div class="empty-icon">📊</div><div class="empty-text">暂无排行数据</div></div>';
      return;
    }
    el.innerHTML = products.slice(0,10).map((p,i) => `
      <div class="rank-item">
        <div class="rank-num ${i===0?'n1':i===1?'n2':i===2?'n3':''}">${i+1}</div>
        <div class="rank-body">
          <div class="rank-name">${escHtml(p.name)}</div>
          <div class="rank-sub">${p.sku} · 库存${p.stock}</div>
        </div>
        <div class="rank-val">${fmtMoney(p.gmv)}</div>
      </div>
    `).join('');
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
      this.renderGMV();
    } catch(e) { toast('上传失败: '+e.message); }
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
          <div class="my-stat">
            <div class="my-stat-val" style="color:var(--green)">${fmtMoney(u.gmv_total)}</div>
            <div class="my-stat-label">累计GMV</div>
          </div>
          <div class="my-stat">
            <div class="my-stat-val">${u.exp}</div>
            <div class="my-stat-label">EXP经验</div>
          </div>
          <div class="my-stat">
            <div class="my-stat-val">Lv${u.level}</div>
            <div class="my-stat-label">${lvName.replace(/Lv\d+ /,'')}</div>
          </div>
        </div>
      </div>

      <div class="exp-bar-wrap">
        <div class="exp-bar-top">
          <span>${lvName}</span>
          <span style="color:var(--text3)">${u.exp} / ${nextT} EXP${u.level<6?' → '+levelName(u.level+1):' 满级'}</span>
        </div>
        <div class="exp-bar-bg"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
      </div>

      <div class="menu-group">
        <div class="menu-row" onclick="showSheet('pwd-overlay')">
          <div class="menu-icon" style="background:#e3f2fd">🔑</div>
          <div class="menu-row-label">修改密码</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="My.showBookmarks()">
          <div class="menu-icon" style="background:#fff8e1">⭐</div>
          <div class="menu-row-label">收藏</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-row danger-text" onclick="My.logout()" style="color:var(--red)">
          <div class="menu-icon" style="background:#fce4ec">🚪</div>
          <div class="menu-row-label" style="color:var(--red)">退出登录</div>
        </div>
      </div>
      <div style="height:32px"></div>
    `;
  },

  pickAvatar(type) {
    hideSheet('avatar-overlay');
    setTimeout(() => {
      if (type === 'camera') {
        document.getElementById('avatar-camera').click();
      } else {
        document.getElementById('avatar-file').click();
      }
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
    } catch(e) { toast('上传失败'); }
  },

  async deleteAvatar() {
    hideSheet('avatar-overlay');
    try {
      await API.put('/api/users/me', { avatar_url: '' });
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

  showBookmarks() { toast('收藏功能开发中'); },

  logout() {
    if (!window.confirm('确认退出登录？')) return;
    localStorage.removeItem('s123_token');
    location.reload();
  },
};

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
