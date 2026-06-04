'use strict';

const Wealth = {
  wealthTab: 'data', // data | rank | circle

  async init() {
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const [t, m, r] = await Promise.all([
        API.get('/api/gmv/today'),
        API.get('/api/gmv/monthly'),
        API.get('/api/gmv/rankings'),
      ]);
      State.gmv = t;
      State.monthly = m;
      State.rankings = r.products;
    } catch(e) { console.error(e); }
  },

  render() {
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
      <!-- 阶段标识 -->
      <div class="wealth-stage-bar">
        <span class="wealth-stage-label">当前阶段：养活团队</span>
        <span class="wealth-stage-switch">切换阶段 ›</span>
      </div>

      <!-- 月GMV主数据 -->
      <div class="wealth-main">
        <div class="wealth-month-target">月GMV目标</div>
        <div class="wealth-month-gmv">¥${gmv.toLocaleString('zh-CN')}</div>
        <div class="wealth-progress-wrap">
          <div class="wealth-progress-bg">
            <div class="wealth-progress-fill" style="width:${Math.min(pct,100)}%"></div>
          </div>
          <span class="wealth-progress-pct">${pct}%</span>
        </div>
        <div class="wealth-progress-label">月目标 ¥${(target/10000).toFixed(0)}w</div>
      </div>

      <!-- 今日 / 本月 / 完成率 三格 -->
      <div class="data-section-title">今日数据</div>
      <div class="data-grid-3">
        <div class="data-cell">
          <div class="data-cell-val green">¥${todayGmv.toLocaleString('zh-CN')}</div>
          <div class="data-cell-label">今日实际GMV</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">¥${todayTarget.toLocaleString('zh-CN')}</div>
          <div class="data-cell-label">今日目标</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val ${todayPct>=100?'green':todayPct>=60?'orange':'red'}">${todayPct}%</div>
          <div class="data-cell-label">今日完成率</div>
        </div>
      </div>

      <!-- 本月 / 完成率 / 预计月底 三格 -->
      <div class="data-section-title" style="margin-top:8px">本月数据</div>
      <div class="data-grid-3">
        <div class="data-cell">
          <div class="data-cell-val">¥${(gmv/10000).toFixed(1)}w</div>
          <div class="data-cell-label">本月累计GMV</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val ${pct>=100?'green':pct>=60?'orange':'red'}">${pct}%</div>
          <div class="data-cell-label">本月完成率</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">¥${(projEom/10000).toFixed(1)}w</div>
          <div class="data-cell-label">预计月底GMV</div>
        </div>
      </div>

      <!-- 预计利润 -->
      <div class="data-wide" style="margin-top:8px">
        <div>
          <div class="data-wide-label">预计月底利润</div>
          <div class="data-wide-sub">利润 = GMV × 20%</div>
        </div>
        <div class="data-wide-val text-green">¥${projProfit.toLocaleString('zh-CN')}</div>
      </div>

      ${report.order_count ? `
      <!-- 店铺详情数据 — 来自上传的Excel -->
      <div class="data-section-title" style="margin-top:8px">今日店铺详情</div>
      <div class="data-grid-3">
        <div class="data-cell">
          <div class="data-cell-val">${report.order_count || 0}</div>
          <div class="data-cell-label">订单数</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">${report.conversion_count || 0}</div>
          <div class="data-cell-label">成交件数</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">${report.visitor_count || 0}</div>
          <div class="data-cell-label">访客数</div>
        </div>
      </div>
      <div class="data-grid-3">
        <div class="data-cell">
          <div class="data-cell-val">${((report.conversion_rate||0)*100).toFixed(2)}%</div>
          <div class="data-cell-label">转化率</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">${report.gpm ? '¥'+report.gpm.toFixed(1) : '–'}</div>
          <div class="data-cell-label">GPM</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val">${report.roi ? report.roi.toFixed(2) : '–'}</div>
          <div class="data-cell-label">ROI</div>
        </div>
      </div>
      <div class="data-grid-2">
        <div class="data-cell">
          <div class="data-cell-val">${report.ad_spend ? '¥'+report.ad_spend.toLocaleString('zh-CN') : '–'}</div>
          <div class="data-cell-label">投流消耗</div>
        </div>
        <div class="data-cell">
          <div class="data-cell-val red">${((report.refund_rate||0)*100).toFixed(2)}%</div>
          <div class="data-cell-label">退货率</div>
        </div>
      </div>
      ` : ''}

      <!-- 上传入口 -->
      <div class="upload-strip" style="margin-top:8px">
        <span class="upload-label">上传今日店铺数据</span>
        <label style="cursor:pointer">
          <span class="btn btn-sm btn-primary">上传 Excel</span>
          <input id="excel-picker" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Wealth.uploadExcel(this)">
        </label>
      </div>

      <!-- 商品排行 -->
      <div class="data-section-title" style="margin-top:8px">商品 GMV 排行榜</div>
      <div id="rank-list"></div>
    `;
    this.renderRankings();
  },

  renderRankings() {
    const el = document.getElementById('rank-list');
    if (!el) return;
    const products = State.rankings || [];
    if (!products.length) {
      el.innerHTML = '<div class="empty" style="padding:24px"><div class="empty-icon">📊</div><div class="empty-text">暂无排行数据</div><div class="empty-sub">添加商品并录入GMV后显示</div></div>';
      return;
    }
    el.innerHTML = products.slice(0, 10).map((p, i) => `
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
      toast(`✅ 导入 ${d.imported} 条数据`);
      await this.loadData();
      this.render();
    } catch(e) { toast('上传失败: ' + e.message); }
  },
};

// ── My (我的) ──────────────────────────────────────
const My = {
  async init() {
    // Load monthly data for 我要发财 progress
    if (!State.monthly) {
      API.get('/api/gmv/monthly').then(d => { State.monthly = d; }).catch(() => {});
    }
    this.renderProfile();
  },

  renderProfile() {
    const el = document.getElementById('my-content');
    if (!el || !State.user) return;
    const u = State.user;
    const color = avatarColor(u.name);
    const lvName = levelName(u.level);
    const thresholds = [0, 100, 300, 600, 1000, 1500, 99999];
    const nextT = thresholds[Math.min(u.level, 6)];
    const curT = thresholds[Math.max(u.level - 1, 0)];
    const expPct = nextT > curT ? Math.round((u.exp - curT) / (nextT - curT) * 100) : 100;

    el.innerHTML = `
      <div class="my-profile">
        <div class="my-avatar" style="background:${color}">
          ${u.avatar_url ? `<img src="${u.avatar_url}" alt="${u.name}">` : escHtml(avatarLetter(u.name))}
        </div>
        <div class="my-info">
          <div class="my-name">${escHtml(u.name)}</div>
          <div class="my-role-row">
            <span class="my-role">${roleLabel(u.role)}</span>
            <span class="level-chip">🏆 ${lvName}</span>
          </div>
          <div class="my-gmv-row">成交GMV <span class="my-gmv-val">${fmtMoney(u.gmv_total)}</span></div>
        </div>
        <div class="my-arrow">›</div>
      </div>

      <div class="exp-bar-section">
        <div class="exp-bar-top">
          <span>${lvName}</span>
          <span>${u.exp} / ${nextT} EXP${u.level < 6 ? ' → ' + levelName(u.level + 1) : ' 满级'}</span>
        </div>
        <div class="exp-bar-bg"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-section">
        <div class="menu-item" onclick="My.menuAction('menu-exp')">
          <div class="menu-icon-wrap" style="background:#fffde7">💡</div>
          <div class="menu-label">我的经验</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" onclick="My.menuAction('menu-tasks')">
          <div class="menu-icon-wrap" style="background:#e8f5e9">✅</div>
          <div class="menu-label">我的任务</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" onclick="My.menuAction('menu-bookmarks')">
          <div class="menu-icon-wrap" style="background:#fff8e1">⭐</div>
          <div class="menu-label">我的收藏</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-section">
        <div class="menu-item" onclick="My.menuAction('menu-products')">
          <div class="menu-icon-wrap" style="background:#fce4ec">🛍</div>
          <div class="menu-label">我的商品</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" onclick="My.menuAction('menu-goal')">
          <div class="menu-icon-wrap" style="background:#e8f5e9">💰</div>
          <div class="menu-label">我要发财</div>
          <div class="menu-right">${State.monthly ? (State.monthly.completion_rate || 0) + '%' : ''}</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-section">
        <div class="menu-item" onclick="showSheet('settings-overlay')">
          <div class="menu-icon-wrap" style="background:#f5f5f5">⚙️</div>
          <div class="menu-label">设置</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div style="height:24px"></div>
    `;
  },

  menuAction(id) {
    if (id === 'menu-exp') { this.showExperiences(); return; }
    if (id === 'menu-tasks') { this.showMyTasks(); return; }
    if (id === 'menu-products') { this.showMyProducts(); return; }
    if (id === 'menu-bookmarks') { toast('收藏功能开发中'); return; }
    if (id === 'menu-goal') { toast('目标功能开发中'); return; }
  },

  async showExperiences() {
    showSheet('exp-overlay');
    const el = document.getElementById('exp-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/experiences?mine=1');
      State.experiences = d.experiences;
      if (!d.experiences.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">💡</div><div class="empty-text">还没有经验</div></div>';
        return;
      }
      el.innerHTML = d.experiences.map(e => `<div class="list-item" onclick="My.openExp(${e.id})">
        <div class="list-item-body">
          <div class="list-item-title">${escHtml(e.title)}</div>
          <div class="list-item-sub">${e.product_name ? e.product_name + ' · ' : ''}${fmtTime(e.created_at)}</div>
        </div>
        <span class="status-tag ${e.status==='pending'?'status-todo':e.status==='verified'?'status-done':'status-doing'}">
          ${e.status==='pending'?'待验证':e.status==='verified'?'已验证':'失败'}
        </span>
      </div>`).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  async openExp(id) {
    const exp = (State.experiences || []).find(e => e.id === id);
    if (!exp) return;
    document.getElementById('exp-edit-id').value = id;
    document.getElementById('exp-edit-title').value = exp.title;
    document.getElementById('exp-edit-content').value = exp.content;
    showSheet('exp-edit-overlay');
    API.get('/api/products').then(d => {
      const sel = document.getElementById('exp-edit-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p =>
        `<option value="${p.id}" ${p.id===exp.product_id?'selected':''}>${p.sku} ${p.name}</option>`).join('');
    });
  },

  showAddExp() {
    document.getElementById('exp-edit-id').value = '';
    document.getElementById('exp-edit-title').value = '';
    document.getElementById('exp-edit-content').value = '';
    showSheet('exp-edit-overlay');
    API.get('/api/products').then(d => {
      const sel = document.getElementById('exp-edit-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p =>
        `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
  },

  async saveExp() {
    const id = document.getElementById('exp-edit-id').value;
    const title = document.getElementById('exp-edit-title').value.trim();
    const content = document.getElementById('exp-edit-content').value.trim();
    const product_id = document.getElementById('exp-edit-product').value;
    if (!title) { toast('请填写标题'); return; }
    try {
      if (id) {
        await API.put('/api/experiences/' + id, { title, content, product_id });
      } else {
        await API.post('/api/experiences', { title, content, product_id });
      }
      hideSheet('exp-edit-overlay');
      toast('已保存 +20 EXP');
    } catch(e) { toast(e.message); }
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
        <div class="task-check ${t.status==='done'?'done':''}">${t.status==='done'?'✓':''}</div>
        <div class="task-body">
          <div class="task-title ${t.status==='done'?'done':''}">${escHtml(t.title)}</div>
          <div class="task-meta"><span>${fmtTime(t.created_at)}</span>${t.due_date?'<span>截止 '+t.due_date+'</span>':''}</div>
        </div>
        <span class="status-tag status-${t.status==='todo'?'todo':t.status==='doing'?'doing':'done'}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
      </div>`).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  async showMyProducts() {
    showSheet('myproducts-overlay');
    const el = document.getElementById('myproducts-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/products');
      State.products = d.products;
      if (!d.products.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">🛍</div><div class="empty-text">还没有商品</div></div>';
        return;
      }
      el.innerHTML = d.products.map(p => `<div class="product-card" onclick="My.openProduct(${p.id})">
        <div class="product-thumb">
          ${p.image_url ? `<img src="${p.image_url}">` : '🛍'}
        </div>
        <div class="product-info">
          <div class="product-name">${escHtml(p.name)}</div>
          <div class="product-sku">${p.sku}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
            <span class="product-price">¥${p.price}</span>
            <span style="font-size:12px;color:var(--text3)">库存 ${p.stock}</span>
            <span class="lc-badge lc-${p.lifecycle_status}">${lcLabel(p.lifecycle_status)}</span>
          </div>
        </div>
      </div>`).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  openProduct(id) {
    const p = (State.products || []).find(p => p.id === id);
    if (!p) return;
    document.getElementById('product-edit-id').value = id;
    document.getElementById('product-edit-sku').value = p.sku;
    document.getElementById('product-edit-name').value = p.name;
    document.getElementById('product-edit-stock').value = p.stock;
    document.getElementById('product-edit-cost').value = p.cost;
    document.getElementById('product-edit-price').value = p.price;
    document.getElementById('product-edit-status').value = p.lifecycle_status;
    showSheet('product-edit-overlay');
  },

  showAddProduct() {
    ['product-edit-id','product-edit-sku','product-edit-name','product-edit-stock',
     'product-edit-cost','product-edit-price'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('product-edit-status').value = 'new';
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
    fd.append('stock', document.getElementById('product-edit-stock').value);
    fd.append('cost', document.getElementById('product-edit-cost').value);
    fd.append('price', document.getElementById('product-edit-price').value);
    fd.append('lifecycle_status', document.getElementById('product-edit-status').value);
    const img = document.getElementById('product-edit-image').files[0];
    if (img) fd.append('image', img);
    try {
      if (id) await API.upload('/api/products/' + id, fd);
      else await API.upload('/api/products', fd);
      hideSheet('product-edit-overlay');
      toast('已保存');
      this.showMyProducts();
    } catch(e) { toast(e.message); }
  },
};
