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
      const [t, m, r, mo, pr] = await Promise.all([
        API.get('/api/gmv/today'),
        API.get('/api/gmv/monthly'),
        API.get('/api/gmv/rankings'),
        API.get('/api/moments'),
        API.get('/api/products'),
      ]);
      State.gmv = t; State.monthly = m; State.rankings = r.products;
      this.moments = mo.moments; this.products = pr.products;
    } catch(e) { console.error(e); }
  },

  render() {
    const el = document.getElementById('wealth-content');
    if (!el) return;
    

    const t = State.gmv || {}, m = State.monthly || {};
    const latestMoment = this.moments[0];
    const todayGmv = t.gmv || 0, monthGmv = m.gmv || 0;
    const pct = m.completion_rate || 0, todayPct = t.completion_rate || 0;

    el.innerHTML = `
      <!-- 发财圈卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showMomentsPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          发财圈
        </div>
        ${latestMoment ? `
          <div style="display:flex;gap:12px;align-items:flex-start;margin-top:12px">
            ${getAvatarHtml({name:latestMoment.user_name, avatar_url:latestMoment.user_avatar}, 38, '6px')}
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--font-sm);font-weight:600;color:var(--green)">${escHtml(latestMoment.user_name)}</div>
              <div style="font-size:var(--font-sm);color:var(--text);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escHtml(latestMoment.content)}</div>
              <div style="font-size:var(--font-xs);color:var(--text3);margin-top:4px">${fmtTime(latestMoment.created_at)}</div>
            </div>
            ${latestMoment.image_url ? `<img src="${latestMoment.image_url}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0">` : ''}
          </div>` :
          `<div style="padding:20px 0;text-align:center;color:var(--text3);font-size:var(--font-sm)">还没有内容，发布第一条高光时刻 🎉</div>`}
        <div class="wbc-arrow">查看全部 ›</div>
      </div>

      <!-- GMV卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showGMVPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          GMV
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:14px">
          <div style="text-align:center;padding:0 4px">
            <div style="font-size:var(--font-xs);color:var(--text3);margin-bottom:5px">今日GMV</div>
            <div style="font-size:var(--font-xl);font-weight:700;color:var(--green)">¥${(todayGmv/10000>=1?(todayGmv/10000).toFixed(1)+'w':todayGmv.toLocaleString('zh-CN'))}</div>
            <div style="font-size:11px;color:${todayPct>=100?'var(--green)':todayPct>=60?'var(--orange)':'var(--red)'};margin-top:3px">${todayPct}% 完成</div>
          </div>
          <div style="text-align:center;padding:0 4px;border-left:0.5px solid var(--border);border-right:0.5px solid var(--border)">
            <div style="font-size:var(--font-xs);color:var(--text3);margin-bottom:5px">本月GMV</div>
            <div style="font-size:var(--font-xl);font-weight:700;color:var(--text)">¥${(monthGmv/10000).toFixed(1)}w</div>
            <div style="font-size:11px;color:${pct>=100?'var(--green)':pct>=60?'var(--orange)':'var(--red)'};margin-top:3px">${pct}% 完成</div>
          </div>
          <div style="text-align:center;padding:0 4px">
            <div style="font-size:var(--font-xs);color:var(--text3);margin-bottom:5px">预计利润</div>
            <div style="font-size:var(--font-xl);font-weight:700;color:var(--green)">¥${((m.projected_profit||0)/10000>=1?((m.projected_profit||0)/10000).toFixed(1)+'w':(m.projected_profit||0).toLocaleString('zh-CN'))}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px">月底预估</div>
          </div>
        </div>
        <div class="wbc-arrow">查看详情 ›</div>
      </div>

      <!-- 商品中心卡片 -->
      <div class="wealth-big-card" onclick="Wealth.showProductsPage()">
        <div class="wbc-label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          商品中心
        </div>
        <div style="display:flex;gap:10px;margin-top:12px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch">
          ${this.products.slice(0,5).map(p => `
            <div style="flex-shrink:0;width:72px;text-align:center">
              <div style="width:72px;height:72px;background:var(--bg2);border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center">
                ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--text3)" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`}
              </div>
              <div style="font-size:11px;color:var(--text);margin-top:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escHtml(p.name)}</div>
            </div>`).join('')}
          ${!this.products.length ? `<div style="color:var(--text3);font-size:var(--font-sm);padding:20px 0;width:100%;text-align:center">还没有商品</div>` : ''}
        </div>
        <div class="wbc-arrow">管理商品 ›</div>
      </div>
      <div style="height:24px"></div>
    `;
  },

  // ── 返回按钮（大） ──
  backBtn(label) {
    return `<div style="padding:14px 16px 10px;display:flex;align-items:center;gap:12px">
      <button onclick="Wealth.render()" style="background:none;border:none;color:var(--green);cursor:pointer;display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;font-size:var(--font-base);font-weight:600;-webkit-tap-highlight-color:transparent" ontouchstart="this.style.background='var(--bg2)'" ontouchend="this.style.background='none'">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回
      </button>
      <span style="font-size:var(--font-base);font-weight:600;color:var(--text)">${label}</span>
    </div>`;
  },

  // ── 发财圈 ──
  showMomentsPage() {
    const el = document.getElementById('wealth-content');
    
    el.innerHTML = `
      ${this.backBtn('发财圈')}
      <div style="display:flex;justify-content:flex-end;padding:0 16px 10px">
        <button onclick="Wealth.showPublish()" style="background:var(--green);color:white;border:none;border-radius:20px;padding:8px 18px;font-size:var(--font-sm);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          发布
        </button>
      </div>
      <div id="moments-list">
        ${this.moments.length ? this.moments.map(m => this.momentCard(m)).join('') :
          '<div class="empty"><div class="empty-icon">🎉</div><div class="empty-text">发布第一条高光时刻</div></div>'}
      </div>
    `;
  },

  momentCard(m) {
    const likes = m.likes || [], comments = m.comments || [];
    const iLiked = likes.includes(State.user?.id);
    return `<div class="moment-item" data-id="${m.id}">
      <div class="moment-header">
        ${getAvatarHtml({name:m.user_name, avatar_url:m.user_avatar}, 42, '6px')}
        <div style="flex:1;margin-left:10px">
          <div class="moment-name">${escHtml(m.user_name)}</div>
          <div class="moment-role">${roleLabel(m.user_role)}</div>
        </div>
        <div class="moment-time-top">${fmtTime(m.created_at)}</div>
      </div>
      <div class="moment-content">${escHtml(m.content)}</div>
      ${m.product_name ? `<div class="moment-product-tag"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> ${escHtml(m.product_name)}</div>` : ''}
      ${m.image_url ? `<img class="moment-img" src="${m.image_url}" onclick="window.open('${m.image_url}')">` : ''}
      ${comments.length ? `<div class="moment-comments">${comments.map(c=>`<div class="moment-comment"><span class="moment-comment-name">${escHtml(c.user_name)}：</span>${escHtml(c.content)}</div>`).join('')}</div>` : ''}
      <div class="moment-actions">
        <button class="moment-action-btn ${iLiked?'liked':''}" onclick="Wealth.toggleLike(${m.id})">
          <svg viewBox="0 0 24 24" fill="${iLiked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${likes.length || '点赞'}
        </button>
        <button class="moment-action-btn" onclick="Wealth.showComment(${m.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${comments.length || '评论'}
        </button>
        ${m.user_id===State.user?.id ? `<button class="moment-action-btn" style="margin-left:auto;color:var(--text3)" onclick="Wealth.deleteMoment(${m.id})">删除</button>` : ''}
      </div>
    </div>`;
  },

  async toggleLike(id) {
    try {
      const d = await API.post('/api/moments/'+id+'/like', {});
      const m = this.moments.find(m=>m.id===id);
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
      const d = await API.post('/api/moments/'+id+'/comments', { content });
      const m = this.moments.find(m=>m.id==id);
      if (m) m.comments = [...(m.comments||[]), d.comment];
      hideSheet('comment-overlay');
      this.showMomentsPage();
    } catch(e) { toast(e.message); }
  },

  async deleteMoment(id) {
    if (!window.confirm('确认删除？')) return;
    try {
      await API.del('/api/moments/'+id);
      this.moments = this.moments.filter(m=>m.id!==id);
      this.showMomentsPage(); toast('已删除');
    } catch(e) { toast(e.message); }
  },

  showPublish() {
    document.getElementById('moment-content').value = '';
    document.getElementById('moment-image').value = '';
    const sel = document.getElementById('moment-product');
    sel.innerHTML = '<option value="">不关联商品</option>' +
      this.products.map(p=>`<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
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
      this.showMomentsPage(); toast('🎉 发布成功');
    } catch(e) { toast(e.message); }
  },

  // ── GMV详情 ──
  showGMVPage() {
    const el = document.getElementById('wealth-content');
    
    const t = State.gmv||{}, m = State.monthly||{}, report = t.report||{};
    el.innerHTML = `
      ${this.backBtn('GMV详情')}
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
      ${report.order_count ? `<div class="data-section-title">今日店铺</div><div class="data-cards">
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
    const products = State.rankings||[];
    const rl = document.getElementById('rank-list');
    if (rl && products.length) {
      rl.innerHTML = '<div class="data-section-title">商品GMV排行</div>' +
        products.slice(0,10).map((p,i)=>`<div class="rank-item">
          <div class="rank-num ${i===0?'n1':i===1?'n2':i===2?'n3':''}">${i+1}</div>
          <div class="rank-body"><div class="rank-name">${escHtml(p.name)}</div><div class="rank-sub">${p.sku}</div></div>
          <div class="rank-val">${fmtMoney(p.gmv)}</div>
        </div>`).join('');
    }
  },

  async uploadExcel(input) {
    const file = input.files[0]; if (!file) return;
    toast('上传中...');
    const fd = new FormData(); fd.append('file', file); input.value = '';
    try { const d = await API.upload('/api/gmv/upload-excel', fd); toast(`✅ 导入 ${d.imported} 条`); await this.loadData(); this.showGMVPage(); }
    catch(e) { toast('上传失败: '+e.message); }
  },

  // ── 商品中心 ──
  showProductsPage() {
    const el = document.getElementById('wealth-content');
    
    const statusLabel = { new:'新品', hot:'爆款', stable:'普通', sleeping:'待清货', zombie:'停售' };
    const statusColor = { new:'#007AFF', hot:'#FF9500', stable:'#34C759', sleeping:'#8E8E93', zombie:'#FF3B30' };
    el.innerHTML = `
      <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between">
        <button onclick="Wealth.render()" style="background:none;border:none;color:var(--blue);cursor:pointer;display:flex;align-items:center;gap:4px;padding:6px 0;font-size:var(--font-base);font-weight:400;-webkit-tap-highlight-color:transparent">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          返回
        </button>
        <span style="font-size:var(--font-base);font-weight:600;color:var(--text)">商品中心</span>
        <button onclick="Wealth.showAddProduct()" style="background:none;border:none;color:var(--blue);cursor:pointer;display:flex;align-items:center;padding:6px 0;font-size:22px;font-weight:300;line-height:1;-webkit-tap-highlight-color:transparent">+</button>
      </div>
      <div class="product-grid">
        ${this.products.length === 0 ? `<div style="grid-column:1/-1;padding:40px 20px;text-align:center;color:var(--text3);font-size:var(--font-sm)">还没有商品，点右上角 + 新建</div>` : ''}
        ${this.products.map(p => `
          <div class="product-card-apple" onclick="Wealth.openProduct(${p.id})">
            <div class="product-card-img">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--text3)" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`}
            </div>
            <div class="product-card-body">
              <div class="product-card-status" style="color:${statusColor[p.lifecycle_status]||'#999'}">${statusLabel[p.lifecycle_status]||p.lifecycle_status}</div>
              <div class="product-card-name">${escHtml(p.name)}</div>
              <div class="product-card-price">¥${p.price||'–'}</div>
              ${(()=>{
                try {
                  const skus = p.skus_json ? JSON.parse(p.skus_json) : null;
                  if (skus && skus.length) {
                    return '<div class="product-sku-stocks">' +
                      skus.map(s => {
                        const label = escHtml(s.properties||s.sku_outer_id||'');
                        if (s.stock > 0) {
                          return `<span class="sku-stock-tag">${label} <b>${s.stock}</b></span>`;
                        } else {
                          return `<span class="sku-stock-tag sku-stock-empty">${label} <b>缺</b></span>`;
                        }
                      }).join('') +
                    '</div>';
                  }
                } catch(e){}
                return p.stock!=null ? `<div style="font-size:11px;color:var(--text3);margin-top:3px">库存 ${p.stock} 件</div>` : '';
              })()}
            </div>
          </div>`).join('')}
      </div>
      <div style="height:24px"></div>
    `;
  },

  async publishStockToChat(text) {
    try {
      await API.post('/api/messages', { content: text, type: 'text' });
      toast('已发布到会话');
      hideSheet('product-edit-overlay');
    } catch(e) { toast('发布失败：' + e.message); }
  },

  async syncFromKuaima() {
    const sku = document.getElementById('product-edit-sku').value.trim();
    if (!sku) { toast('请先填写款号'); return; }
    const btn = event.target;
    btn.textContent = '同步中...'; btn.disabled = true;
    const tip = document.getElementById('kuaima-sync-result');
    try {
      const d = await API.get('/api/kuaima/goods?sku=' + encodeURIComponent(sku));
      if (!d.found) {
        tip.textContent = '⚠️ 快麦未找到该款号，请手动填写';
        tip.style.color = 'var(--orange)';
      } else {
        document.getElementById('product-edit-name').value = d.name || '';
        document.getElementById('product-edit-price').value = d.price || '';
        document.getElementById('product-edit-stock').value = d.stock || '';
        if (d.skus) {
          let skusInput = document.getElementById('product-edit-skus-json');
          if (!skusInput) {
            skusInput = document.createElement('input');
            skusInput.type = 'hidden'; skusInput.id = 'product-edit-skus-json'; skusInput.name = 'skus_json';
            document.getElementById('product-edit-stock').parentNode.appendChild(skusInput);
          }
          skusInput.value = JSON.stringify(d.skus);
        }
        document.getElementById('product-name-group').style.display = 'none';
        document.getElementById('product-price-group').style.display = 'none';
        // SKU库存表格展示
        tip.style.color = 'var(--green)';
        const skus = d.skus || [];
        // 尺码标准排序
        const sizeOrder = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','均码'];
        function sizeRank(sz) {
          const i = sizeOrder.indexOf(sz.toUpperCase());
          return i >= 0 ? i : 99;
        }
        if (skus.length) {
          const colorMap = {};
          const sizeSet = new Set();
          skus.forEach(s => {
            const props = s.properties || '';
            // 支持 "颜色;尺码" 或 "颜色-尺码" 格式
            const sep = props.includes(';') ? ';' : '-';
            const idx = props.indexOf(sep);
            const color = idx > 0 ? props.slice(0, idx).trim() : (props || '默认');
            const size = idx > 0 ? props.slice(idx+1).trim() : '';
            if (size) sizeSet.add(size);
            if (!colorMap[color]) colorMap[color] = {};
            colorMap[color][size || '_'] = s.stock || 0;
          });
          // 尺码从小到大排序
          const sizes = [...sizeSet].sort((a,b) => sizeRank(a) - sizeRank(b));

          // 生成纯文本用于复制
          const header = ['颜色', ...sizes, '合计'].join('\t');
          const rows = Object.entries(colorMap).map(([color, stocks]) => {
            const total = sizes.reduce((a,sz)=>a+(stocks[sz]||0),0);
            return [color, ...sizes.map(sz=>stocks[sz]||0), total].join('\t');
          });
          const totalRow = ['合计', ...sizes.map(sz=>Object.values(colorMap).reduce((a,cm)=>a+(cm[sz]||0),0)), d.stock].join('\t');
          const copyText = d.name + '\n' + [header, ...rows, totalRow].join('\n');

          // 构建HTML表格
          let html = `<div style="color:var(--green);font-size:14px;font-weight:600;margin-bottom:8px">✅ ${d.name} · 共${d.stock}件</div>`;
          const copyId = 'copy_' + Date.now();
          window.__copyData = window.__copyData || {};
          window.__copyData[copyId] = copyText;
          html += `<button onclick="Wealth.publishStockToChat(window.__copyData['${copyId}'])" style="margin-bottom:8px;padding:6px 16px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">📤 发布到会话</button> <button onclick="navigator.clipboard.writeText(window.__copyData['${copyId}']).then(()=>toast('已复制'))" style="margin-bottom:8px;padding:6px 16px;background:var(--fill2);color:var(--text);border:none;border-radius:8px;font-size:14px;cursor:pointer">📋 复制</button>`;
          html += '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:inherit;width:100%">';
          // 表头
          html += '<tr>';
          ['颜色', ...sizes, '合计'].forEach((h,i) => {
            html += `<th style="padding:6px 12px;border:1px solid var(--sep);background:var(--fill2);text-align:${i===0?'left':'center'};white-space:nowrap">${h}</th>`;
          });
          html += '</tr>';
          // 数据行
          Object.entries(colorMap).forEach(([color, stocks]) => {
            const total = sizes.reduce((a,sz)=>a+(stocks[sz]||0),0);
            html += '<tr>';
            html += `<td style="padding:6px 12px;border:1px solid var(--sep);font-weight:500;white-space:nowrap">${color}</td>`;
            sizes.forEach(sz => {
              const n = stocks[sz] || 0;
              const st = n === 0 ? 'color:var(--red);font-weight:600' : 'font-weight:600';
              html += `<td style="padding:6px 12px;border:1px solid var(--sep);text-align:center;${st}">${n === 0 ? '缺' : n}</td>`;
            });
            html += `<td style="padding:6px 12px;border:1px solid var(--sep);text-align:center;font-weight:700">${total}</td>`;
            html += '</tr>';
          });
          // 合计行
          html += '<tr style="background:rgba(52,199,89,0.1)">';
          html += '<td style="padding:6px 12px;border:1px solid var(--sep);font-weight:700">合计</td>';
          sizes.forEach(sz => {
            const t = Object.values(colorMap).reduce((a,cm)=>a+(cm[sz]||0),0);
            html += `<td style="padding:6px 12px;border:1px solid var(--sep);text-align:center;font-weight:700">${t}</td>`;
          });
          html += `<td style="padding:6px 12px;border:1px solid var(--sep);text-align:center;font-weight:700;color:var(--green)">${d.stock}</td>`;
          html += '</tr></table></div>';
          tip.innerHTML = html;
        } else {
          tip.textContent = `✅ 同步成功：${d.name}，库存${d.stock}`;
        }
        if (d.image_url) toast('快麦有商品图，保存后自动导入');
      }
    } catch(e) {
      const msg = e.message || '';
      if (msg.includes('权限')) {
        tip.innerHTML = '❌ 需在快麦开放平台申请商品接口权限<br><small style="color:var(--text3)">开发者中心 → 您的APP → 申请 erp.goods.list.query</small>';
      } else {
        tip.textContent = '❌ 同步失败：' + msg;
      }
      tip.style.color = 'var(--red)';
    } finally {
      btn.textContent = '从快麦同步'; btn.disabled = false;
    }
  },

  showAddProduct() {
    document.getElementById('product-sheet-title').textContent = '新建商品';
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-edit-sku').value = '';
    document.getElementById('product-edit-image').value = '';
    document.getElementById('product-edit-name').value = '';
    document.getElementById('product-edit-price').value = '';
    document.getElementById('product-edit-stock').value = '';
    document.getElementById('product-edit-status').value = 'new';
    const tip = document.getElementById('kuaima-sync-result');
    tip.textContent = '输入款号后点「从快麦同步」自动填入名称、价格、库存';
    tip.style.color = 'var(--text3)';
    showSheet('product-edit-overlay');
  },

  openProduct(id) {
    const p = this.products.find(p=>p.id===id); if (!p) return;
    document.getElementById('product-sheet-title').textContent = '编辑商品';
    document.getElementById('product-edit-id').value = id;
    document.getElementById('product-edit-sku').value = p.sku;
    document.getElementById('product-edit-name').value = p.name || '';
    document.getElementById('product-edit-price').value = p.price || '';
    document.getElementById('product-edit-stock').value = p.stock || '';
    document.getElementById('product-edit-status').value = p.lifecycle_status;
    document.getElementById('product-edit-image').value = '';
    document.getElementById('product-name-group').style.display = '';
    document.getElementById('product-price-group').style.display = '';
    const tip = document.getElementById('kuaima-sync-result');
    tip.textContent = '可点「从快麦同步」更新最新库存和价格';
    tip.style.color = 'var(--text3)';
    showSheet('product-edit-overlay');
  },

  async saveProduct() {
    const id = document.getElementById('product-edit-id').value;
    const sku = document.getElementById('product-edit-sku').value.trim();
    if (!sku) { toast('请填写款号'); return; }
    const fd = new FormData();
    fd.append('sku', sku);
    const name = document.getElementById('product-edit-name').value.trim();
    fd.append('name', name || sku);
    const price = document.getElementById('product-edit-price').value;
    const stock = document.getElementById('product-edit-stock').value;
    if (price) fd.append('price', price);
    if (stock) fd.append('stock', stock);
    fd.append('lifecycle_status', document.getElementById('product-edit-status').value);
    const img = document.getElementById('product-edit-image').files[0];
    if (img) fd.append('image', img);
    try {
      if (id) await API.upload('/api/products/'+id, fd);
      else await API.upload('/api/products', fd);
      hideSheet('product-edit-overlay');
      const pr = await API.get('/api/products');
      this.products = pr.products;
      this.showProductsPage();
      toast('已保存');
      // 如果有product_id，尝试后台同步快麦图片等
      if (id && sku) {
        API.post('/api/kuaima/sync-product', { product_id: parseInt(id), sku }).catch(()=>{});
      }
    } catch(e) { toast(e.message); }
  },
};

// ── My 我的 ──
const My = {
  async init() {
    this.render();
  },

  render() {
    const el = document.getElementById('my-content');
    if (!el || !State.user) return;
    const u = State.user;
    const lvName = levelName(u.level);
    const thresholds = [0,100,300,600,1000,1500,99999];
    const nextT = thresholds[Math.min(u.level,6)];
    const curT = thresholds[Math.max(u.level-1,0)];
    const expPct = nextT > curT ? Math.round((u.exp-curT)/(nextT-curT)*100) : 100;

    el.innerHTML = `
      <!-- 顶部个人资料 -->
      <div style="background:var(--card);padding:28px 20px 20px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div style="position:relative;cursor:pointer" onclick="showSheet('avatar-overlay')">
            ${getAvatarHtml(u, 72, '14px')}
            <div style="position:absolute;bottom:-3px;right:-3px;width:22px;height:22px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
          </div>
          <div style="flex:1">
            <div style="font-size:22px;font-weight:700;color:var(--text);line-height:1.2">${escHtml(u.name)}</div>
            <div style="font-size:var(--font-sm);color:var(--text3);margin-top:4px">${roleLabel(u.role)}</div>
            <div style="margin-top:8px">
              <div style="font-size:var(--font-xs);color:var(--text3)">累计GMV</div>
              <div style="font-size:24px;font-weight:700;color:var(--green);line-height:1.2">${fmtMoney(u.gmv_total)}</div>
            </div>
          </div>
        </div>
        <!-- EXP进度 -->
        <div style="background:var(--bg2);border-radius:10px;padding:12px 14px">
          <div style="display:flex;justify-content:space-between;font-size:var(--font-sm);margin-bottom:8px">
            <span style="font-weight:600;color:var(--text)">${lvName}</span>
            <span style="color:var(--text3)">${u.exp} / ${nextT} EXP</span>
          </div>
          <div class="exp-bar-bg"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
        </div>
      </div>

      <div style="height:8px"></div>

      <!-- 菜单 -->
      <div class="menu-group">
        <div class="menu-row" onclick="My.showMyTasks()">
          <div class="menu-icon" style="background:#e8f5e9"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#07c160" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          <div class="menu-row-label">我的任务</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="My.showBookmarks()">
          <div class="menu-icon" style="background:#fff8e1"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f9a825" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div class="menu-row-label">收藏</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="switchTab('wealth');setTimeout(()=>Wealth.showMomentsPage(),50)">
          <div class="menu-icon" style="background:#fce4ec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e91e63" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <div class="menu-row-label">发财圈</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="switchTab('wealth');setTimeout(()=>Wealth.showProductsPage(),50)">
          <div class="menu-icon" style="background:#e3f2fd"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1677ff" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
          <div class="menu-row-label">商品中心</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div style="height:8px"></div>

      <div class="menu-group">
        <div class="menu-row" onclick="showSheet('pwd-overlay')">
          <div class="menu-icon" style="background:#f3e5f5"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9c27b0" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <div class="menu-row-label">修改密码</div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-row" onclick="My.logout()">
          <div class="menu-icon" style="background:#fce4ec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f44336" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
          <div class="menu-row-label" style="color:var(--red)">退出登录</div>
        </div>
      </div>

      ${u.role !== 'admin' ? `
      <div style="height:8px"></div>
      <div class="menu-group">
        <div class="menu-row" onclick="My.upgradeToAdmin()">
          <div class="menu-icon" style="background:#f3e5f5"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9c27b0" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
          <div class="menu-row-label">升级为管理员</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>` : ''}

      ${u.role === 'admin' ? `
      <div style="height:8px"></div>
      <div class="menu-group">
        <div class="menu-row" onclick="My.syncKmIndex()">
          <div class="menu-icon" style="background:#e3f2fd"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1976d2" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg></div>
          <div class="menu-row-label">同步快麦商品索引</div>
          <span class="menu-arrow" id="km-sync-status">›</span>
        </div>
        <div class="menu-row" onclick="My.restartServer()">
          <div class="menu-icon" style="background:#fff3e0"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f57c00" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
          <div class="menu-row-label">重启服务器</div>
          <span class="menu-arrow">›</span>
        </div>
      </div>` : ''}
      <div style="height:40px"></div>
    `;
  },

  pickAvatar(type) {
    hideSheet('avatar-overlay');
    setTimeout(() => document.getElementById(type==='camera'?'avatar-camera':'avatar-file').click(), 300);
  },

  showPresetAvatars() {
    hideSheet('avatar-overlay');
    showSheet('preset-avatar-overlay');
    const el = document.getElementById('preset-avatar-grid');
    el.innerHTML = PRESET_AVATARS.map(av => `
      <div onclick="My.selectPresetAvatar('${av.id}')"
        style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:8px;border-radius:12px;transition:background 0.1s"
        ontouchstart="this.style.background='var(--bg2)'" ontouchend="this.style.background='transparent'">
        <div style="width:54px;height:54px;border-radius:14px;background:${av.bg};display:flex;align-items:center;justify-content:center;font-size:26px">
          ${av.emoji}
        </div>
        <span style="font-size:11px;color:var(--text3)">${av.label}</span>
      </div>`).join('');
  },

  async selectPresetAvatar(id) {
    try {
      await API.put('/api/users/me', { avatar_url: '/preset/'+id });
      State.user = { ...State.user, avatar_url: '/preset/'+id };
      hideSheet('preset-avatar-overlay');
      this.render();
      toast('✅ 头像已更新');
    } catch(e) { toast(e.message); }
  },

  async uploadAvatar(input) {
    const file = input.files[0]; if (!file) return;
    toast('上传中...');
    const fd = new FormData(); fd.append('avatar', file); input.value = '';
    try {
      const d = await API.upload('/api/users/me', fd);
      State.user = { ...State.user, avatar_url: d.user.avatar_url };
      this.render(); toast('✅ 头像已更新');
    } catch { toast('上传失败'); }
  },

  async deleteAvatar() {
    hideSheet('avatar-overlay');
    try {
      await API.put('/api/users/me', { avatar_url: '' });
      State.user = { ...State.user, avatar_url: null };
      this.render(); toast('头像已删除');
    } catch(e) { toast(e.message); }
  },

  async savePwd() {
    const p1 = document.getElementById('new-pwd').value;
    const p2 = document.getElementById('new-pwd2').value;
    if (!p1) { toast('请填写新密码'); return; }
    if (p1!==p2) { toast('两次密码不一致'); return; }
    try {
      await API.put('/api/users/me', { password:p1 });
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
      const bms = d.bookmarks||[];
      if (!bms.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏</div><div class="empty-sub">长按消息可以收藏</div></div>'; return; }
      el.innerHTML = bms.map(b => `
        <div class="list-item">
          <div class="list-item-body">
            <div class="list-item-title">${escHtml(b.title||'收藏内容')}</div>
            <div class="list-item-sub">${b.ref_type||'消息'} · ${fmtTime(b.saved_at)}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick='Chat.sendBookmarkToChat(${JSON.stringify(b).replace(/'/g,"&#39;")});hideSheet("bookmarks-overlay")'>发到会话</button>
        </div>`).join('');
    } catch { el.innerHTML = '<div class="empty"><div class="empty-text">加载失败</div></div>'; }
  },

  async showMyTasks() {
    showSheet('mytasks-overlay');
    const el = document.getElementById('mytasks-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/tasks?mine=1');
      if (!d.tasks.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">暂无任务</div></div>'; return; }
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

  async upgradeToAdmin() {
    const pwd = window.prompt('输入管理员密码：');
    if (!pwd) return;
    try {
      const r = await API.post('/api/users/set-admin', { admin_password: pwd });
      toast(r.message || '已升级为管理员，请重新登录');
      setTimeout(() => location.reload(), 1500);
    } catch(e) { toast('失败：' + e.message); }
  },

  async restartServer() {
    if (!window.confirm('确认重启服务器？重启期间约5秒不可用')) return;
    try {
      await API.post('/api/kuaima/restart-server', {});
      toast('重启中，5秒后刷新页面');
      setTimeout(() => location.reload(), 6000);
    } catch(e) {
      toast('已发送重启指令');
      setTimeout(() => location.reload(), 6000);
    }
  },

  async syncKmIndex() {
    const status = document.getElementById('km-sync-status');
    if (status) status.textContent = '同步中…';
    try {
      const r = await API.post('/api/kuaima/sync-index', {});
      // 查一下当前索引数量
      const s = await API.get('/api/kuaima/index-status');
      toast(`已触发同步，当前索引 ${s.count} 条`);
      if (status) status.textContent = s.count + '条';
    } catch(e) {
      toast('同步失败：' + e.message);
      if (status) status.textContent = '›';
    }
  },

  logout() {
    if (!window.confirm('确认退出登录？')) return;
    localStorage.removeItem('s123_token');
    location.reload();
  },
};

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
