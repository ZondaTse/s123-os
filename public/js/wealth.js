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
    this.showProductsPage();
  },

  renderOld() {
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
      <div class="product-grid" style="padding-top:8px">
        ${this.products.length === 0 ? `
          <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--text3)">
            <div style="font-size:48px;margin-bottom:12px">📦</div>
            <div>还没有商品</div>
            <div style="margin-top:12px"><button onclick="Wealth.showAddProduct()" style="padding:10px 24px;background:var(--blue);color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer">+ 新建商品</button></div>
          </div>` : ''}
        ${this.products.map(p => `
          <div class="product-card-apple">
            <div class="product-card-img" onclick="Wealth.openProduct(${p.id})">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--text3)" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`}
            </div>
            <div class="product-card-body" onclick="Wealth.openProduct(${p.id})">
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
                          return '<span class="sku-stock-tag">' + label + ' <b>' + s.stock + '</b></span>';
                        } else {
                          return '<span class="sku-stock-tag sku-stock-empty">' + label + ' <b>缺</b></span>';
                        }
                      }).join('') +
                    '</div>';
                  }
                } catch(e){}
                return p.stock!=null ? '<div style="font-size:11px;color:var(--text3);margin-top:3px">库存 ' + p.stock + ' 件</div>' : '';
              })()}
            </div>
            <div style="padding:6px 10px;border-top:0.5px solid var(--sep);display:flex;gap:6px">
              <button onclick="Wealth.shareProductToChat(${p.id})" style="flex:1;padding:7px 0;background:var(--fill2);border:none;border-radius:8px;font-size:13px;color:var(--text2);cursor:pointer">📤 分享</button>
              <button onclick="Wealth.syncProductFromKm(${p.id},'${escHtml(p.sku)}')" style="flex:1;padding:7px 0;background:var(--fill2);border:none;border-radius:8px;font-size:13px;color:var(--text2);cursor:pointer">🔄 刷新</button>
            </div>
          </div>`).join('')}
      </div>
      <div style="height:80px"></div>
    `;
  },

  doCopy(id) {
    const text = (window.__copyData || {})[id] || '';
    if (!text) { toast('无内容'); return; }
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand('copy'); toast('已复制'); } catch(e) {
      navigator.clipboard && navigator.clipboard.writeText(text).then(()=>toast('已复制')).catch(()=>toast('请长按复制'));
    }
    document.body.removeChild(el);
  },

  async shareProductToChat(id) {
    const p = this.products.find(p => p.id === id);
    if (!p) return;
    // 生成分享文字
    let text = '📦 商品：' + p.name + '\n';
    if (p.price) text += '售价 ¥' + p.price + '\n';
    if (p.stock != null) text += '库存 ' + p.stock + ' 件\n';
    try {
      const skus = p.skus_json ? JSON.parse(p.skus_json) : null;
      if (skus && skus.length) {
        text += skus.map(s => (s.properties||s.sku_outer_id) + ': ' + (s.stock||0) + '件').join(' · ');
      }
    } catch(e) {}
    try {
      await API.post('/api/messages', { content: text, type: 'text' });
      toast('已分享到会话');
    } catch(e) { toast('分享失败'); }
  },

  async syncProductFromKm(id, sku) {
    if (!sku) { toast('无款号'); return; }
    toast('刷新中...');
    try {
      await API.post('/api/kuaima/sync-product', { product_id: id, sku });
      const pr = await API.get('/api/products');
      this.products = pr.products;
      this.showProductsPage();
      toast('已刷新');
    } catch(e) { toast('刷新失败：' + e.message); }
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
          html += `<button onclick="Wealth.publishStockToChat(window.__copyData['${copyId}'])" style="margin-bottom:8px;margin-right:8px;padding:8px 18px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">📤 发布到会话</button><button onclick="Wealth.doCopy('${copyId}')" style="margin-bottom:8px;padding:8px 18px;background:var(--fill2);color:var(--text);border:none;border-radius:8px;font-size:14px;cursor:pointer">📋 复制</button>`;
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
    // 清除历史版本遗留的动态创建overlay节点
    ['salary-overlay','salary-sheet','salary-access-overlay','salary-access-sheet'].forEach(id => {
      const old = document.getElementById(id);
      if (old && !old.closest('#app > *') && old.parentElement === document.body) {
        // 只删除直接挂在body上的（动态创建的），不删HTML里的静态节点
        // 判断：静态节点在#app内部或在script之前的固定位置
      }
    });
    // 更简单：直接remove所有body直接子节点中id为salary-overlay的重复项
    const allSalaryOverlays = document.querySelectorAll('#salary-overlay');
    if (allSalaryOverlays.length > 1) {
      // 保留第一个（HTML静态的），删除其余动态创建的
      for (let i = 1; i < allSalaryOverlays.length; i++) allSalaryOverlays[i].remove();
    }
    const allAccessOverlays = document.querySelectorAll('#salary-access-overlay');
    if (allAccessOverlays.length > 1) {
      for (let i = 1; i < allAccessOverlays.length; i++) allAccessOverlays[i].remove();
    }
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

      ${(u.salary_access || u.role === 'admin') ? `
      <div class="menu-group">
        <div class="menu-row" onclick="My.openSalary()">
          <div class="menu-icon" style="background:#e8f5e9"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34c759" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5S13.4 11 12 11s-2.5.6-2.5 1.5S10.6 16 12 16s2.5-.4 2.5-1.5"/></svg></div>
          <div class="menu-row-label" style="font-weight:600">我的财务</div>
          <span class="menu-arrow" style="color:#34c759">›</span>
        </div>
      </div>
      <div style="height:8px"></div>
      ` : ''}

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
        <div class="menu-row" onclick="My.manageSalaryAccess()">
          <div class="menu-icon" style="background:#e8f5e9"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34c759" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="menu-row-label">财务权限管理</div>
          <span class="menu-arrow">›</span>
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
    if (!window.confirm('拉取最新代码并重启？约15秒后自动刷新')) return;
    try {
      await API.post('/api/kuaima/restart-server', {});
      toast('部署中，15秒后自动刷新...');
      setTimeout(() => location.reload(), 16000);
    } catch(e) {
      toast('已发送指令，15秒后刷新');
      setTimeout(() => location.reload(), 16000);
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

  openSalary() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.style.display = 'none';

    // Inject CSS once
    if (!document.getElementById('sp-styles')) {
      const st = document.createElement('style');
      st.id = 'sp-styles';
      st.textContent = "\n/* \u2500\u2500 CSS VARIABLES \u2014 light / dark \u2500\u2500 */\n:root {\n  --s-bg:           #f2f2f7;\n  --s-bg2:          #ffffff;\n  --s-bg3:          #e5e5ea;\n  --s-bg4:          #d1d1d6;\n  --s-fg:           #1c1c1e;\n  --s-fg2:          #3a3a3c;\n  --s-fg3:          #636366;\n  --s-fg4:          #8e8e93;\n  --s-fg5:          #aeaeb2;\n  --s-sep:          rgba(0,0,0,0.08);\n  --s-shadow:       0 1px 4px rgba(0,0,0,0.07);\n  --s-shadow-lg:    0 4px 20px rgba(0,0,0,0.10);\n  --s-nav-bg:       rgba(242,242,247,0.88);\n  --s-sheet-bg:     #f2f2f7;\n  --s-overlay-bg:   rgba(0,0,0,0.28);\n  --s-handle:       rgba(0,0,0,0.15);\n  --s-close-btn:    rgba(0,122,255,0.92);\n\n  /* accent \u2014 light mode: standard iOS */\n  --s-red:    #ff3b30;\n  --s-green:  #34c759;\n  --s-blue:   #007aff;\n  --s-blue2:  #5b9fd6;\n  --s-orange: #ff9500;\n\n  /* accent bg tints \u2014 light: soft pastels */\n  --s-tint-red:    #fff0f0;\n  --s-tint-green:  #f0fff4;\n  --s-tint-blue:   #e8f2fb;\n  --s-tint-orange: rgba(255,149,0,0.10);\n\n  /* tag bg \u2014 light */\n  --s-tag-up-bg:  #fff0f0;\n  --s-tag-dn-bg:  #f0fff4;\n  --s-tag-neu-bg: #e8f2fb;\n\n  /* numrow separator */\n  --s-numrow-sep: rgba(0,0,0,0.07);\n\n  /* dept card backgrounds \u2014 light: soft pastels */\n  --s-dept-lavender: #ede8f5;\n  --s-dept-sage:     #e8f0e4;\n  --s-dept-sky:      #e4eef8;\n  --s-dept-sand:     #f5efe6;\n  --s-dept-lilac:    #ede8f5;\n  --s-dept-mint:     #e4f2ed;\n  --s-dept-stone:    #fde8ee;\n  --s-dept-ice:      #e6f0f5;\n\n  /* group banner bg \u2014 light: richer tint */\n  --s-banner-lavender: #ddd5f2;\n  --s-banner-sage:     #cddfc5;\n  --s-banner-sky:      #c5d9ef;\n  --s-banner-sand:     #e8d8c2;\n  --s-banner-lilac:    #ddd5f2;\n  --s-banner-mint:     #bfe0d4;\n  --s-banner-stone:    #f2dce0;\n  --s-banner-ice:      #c5dceb;\n\n  /* group banner border \u2014 light */\n  --s-border-lavender: #9980cc;\n  --s-border-sage:     #6aa062;\n  --s-border-sky:      #5090c8;\n  --s-border-sand:     #b09060;\n  --s-border-lilac:    #9980cc;\n  --s-border-mint:     #50a888;\n  --s-border-stone:    #c8a0a8;\n  --s-border-ice:      #5090b0;\n\n  /* reason/chart panel */\n  --s-panel-bg: rgba(255,255,255,0.65);\n\n  /* KPI */\n  --s-kpi-prev-bg: #e8f2fb;\n  --s-kpi-prev-fg: #5b9fd6;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --s-bg:           #000000;\n    --s-bg2:          #1c1c1e;\n    --s-bg3:          #2c2c2e;\n    --s-bg4:          #3a3a3c;\n    --s-fg:           #ffffff;\n    --s-fg2:          #ebebf5;\n    --s-fg3:          #aeaeb2;\n    --s-fg4:          #636366;\n    --s-fg5:          #48484a;\n    --s-sep:          rgba(255,255,255,0.08);\n    --s-shadow:       0 1px 0 rgba(255,255,255,0.04);\n    --s-shadow-lg:    0 4px 20px rgba(0,0,0,0.5);\n    --s-nav-bg:       rgba(0,0,0,0.85);\n    --s-sheet-bg:     #1c1c1e;\n    --s-overlay-bg:   rgba(0,0,0,0.55);\n    --s-handle:       rgba(255,255,255,0.18);\n    --s-close-btn:    #0a84ff;\n\n    /* accent \u2014 dark mode: brighter iOS variants */\n    --s-red:    #ff453a;\n    --s-green:  #30d158;\n    --s-blue:   #0a84ff;\n    --s-blue2:  #409cff;\n    --s-orange: #ff9f0a;\n\n    /* accent bg tints \u2014 dark: very subtle, nearly invisible */\n    --s-tint-red:    rgba(255,69,58,0.15);\n    --s-tint-green:  rgba(48,209,88,0.12);\n    --s-tint-blue:   rgba(10,132,255,0.15);\n    --s-tint-orange: rgba(255,159,10,0.12);\n\n    /* tag bg \u2014 dark */\n    --s-tag-up-bg:  rgba(255,69,58,0.18);\n    --s-tag-dn-bg:  rgba(48,209,88,0.15);\n    --s-tag-neu-bg: rgba(10,132,255,0.18);\n\n    /* numrow separator */\n    --s-numrow-sep: rgba(255,255,255,0.07);\n\n    /* dept card backgrounds \u2014 dark: all just slightly lighter than bg2 */\n    /* No saturated colors \u2014 subtle elevation only */\n    --s-dept-lavender: #28252e;\n    --s-dept-sage:     #22282a;\n    --s-dept-sky:      #1e2530;\n    --s-dept-sand:     #2a2620;\n    --s-dept-lilac:    #28252e;\n    --s-dept-mint:     #1e2a26;\n    --s-dept-stone:    #2a2028;\n    --s-dept-ice:      #1e252a;\n\n    /* group banner bg \u2014 dark: same as dept but slightly stronger */\n    --s-banner-lavender: #312d3a;\n    --s-banner-sage:     #293030;\n    --s-banner-sky:      #243040;\n    --s-banner-sand:     #332e26;\n    --s-banner-lilac:    #312d3a;\n    --s-banner-mint:     #253430;\n    --s-banner-stone:    #342830;\n    --s-banner-ice:      #243038;\n\n    /* group banner border \u2014 dark: muted, no saturation */\n    --s-border-lavender: #48405a;\n    --s-border-sage:     #3a4a3e;\n    --s-border-sky:      #304858;\n    --s-border-sand:     #4a4034;\n    --s-border-lilac:    #48405a;\n    --s-border-mint:     #305048;\n    --s-border-stone:    #4a3840;\n    --s-border-ice:      #2e4458;\n\n    /* reason/chart panel */\n    --s-panel-bg: rgba(44,44,46,0.9);\n\n    /* KPI */\n    --s-kpi-prev-bg: rgba(64,156,255,0.12);\n    --s-kpi-prev-fg: #409cff;\n  }\n}\n\n* { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }\n#salary-page body {\n  font-family:-apple-system,'PingFang SC','Helvetica Neue',sans-serif;\n  background:var(--s-bg); color:var(--s-fg);\n  min-height:100vh; padding-bottom:40px;\n}\n\n/* \u2500\u2500 MONTH NAV BAR \u2500\u2500 */\n#salary-page .month-nav {\n  display:flex; align-items:center;\n  padding:14px 16px 6px; gap:8px;\n  overflow-x:auto; scrollbar-width:none;\n}\n.month-nav::-webkit-scrollbar { display:none; }\n#salary-page .month-chip {\n  flex-shrink:0; padding:7px 18px; border-radius:20px;\n  font-size:14px; font-weight:600;\n  background:var(--s-bg3); color:var(--s-fg2);\n  cursor:pointer; border:none; font-family:inherit;\n  transition:all 0.18s;\n}\n#salary-page .month-chip.active { background:var(--s-fg); color:var(--s-bg); }\n\n/* KPI */\n#salary-page .kpi-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding:14px 16px; }\n#salary-page .kpi {\n  border-radius:14px; padding:14px 12px 16px;\n  min-height:80px; display:flex; flex-direction:column;\n  justify-content:space-between;\n  cursor:pointer; transition:transform 0.15s;\n}\n.kpi:active { transform:scale(0.95); }\n#salary-page .kpi-label { font-size:12px; color:var(--s-fg4); margin-bottom:6px; }\n#salary-page .kpi-val { font-size:22px; font-weight:700; letter-spacing:-0.5px; }\n#salary-page .kpi-tap-hint { font-size:10px; color:var(--s-fg4); margin-top:3px; }\n\n/* TABS */\n#salary-page .tabs { display:flex; gap:8px; padding:0 16px 12px; overflow-x:auto; scrollbar-width:none; }\n.tabs::-webkit-scrollbar { display:none; }\n#salary-page .tab {\n  flex-shrink:0; padding:6px 14px; border-radius:20px;\n  font-size:13px; font-weight:500;\n  background:var(--s-bg3); color:var(--s-fg2);\n  cursor:pointer; border:none; font-family:inherit;\n}\n#salary-page .tab.active { background:var(--s-blue); color:#fff; }\n\n/* summary card */\n#salary-page .summary-card {\n  margin:0 16px 12px;\n  background:var(--s-bg2);\n  border-radius:14px; padding:14px 16px;\n  box-shadow:var(--s-shadow);\n}\n#salary-page .summary-title { font-size:18px; font-weight:700; color:var(--s-fg); margin-bottom:8px; }\n#salary-page .summary-text { font-size:15px; color:var(--s-fg2); line-height:1.65; }\n\n/* GRID */\n#salary-page .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }\n#salary-page .group-wrap { margin:16px 16px 6px; }\n#salary-page .group-tab {\n  display:inline-flex; align-items:center; justify-content:space-between;\n  border-radius:12px 12px 0 0; padding:8px 14px 10px;\n  width:100%; border-bottom:none;\n}\n#salary-page .group-body { border-radius:0 0 16px 16px; padding:10px; }\n#salary-page .group-banner-name { font-size:16px; font-weight:700; color:var(--s-fg); }\n#salary-page .group-banner-right { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; }\n#salary-page .group-banner-arrow { color:var(--s-fg4); font-size:12px; }\n#salary-page .group-banner-diff { font-size:15px; font-weight:700; }\n#salary-page .group-banner-label { font-size:15px; font-weight:700; }\n\n/* CARD */\n#salary-page .card {\n  border-radius:14px; padding:13px 13px 12px;\n  cursor:pointer;\n  transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;\n  box-shadow:var(--s-shadow);\n  will-change:transform;\n}\n.card:active { transform:scale(0.94); box-shadow:var(--s-shadow-lg); }\n#salary-page .card.tapped { animation:cardPop 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards; }\n@keyframes cardPop {\n  0%   { transform:scale(1);    filter:blur(0px);   opacity:1; }\n  40%  { transform:scale(1.06); filter:blur(1px);   opacity:0.9; }\n  100% { transform:scale(1);    filter:blur(0px);   opacity:1; }\n}\n#salary-page .card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; }\n#salary-page .card-name { font-size:18px; font-weight:700; color:var(--s-fg); }\n#salary-page .card-dept-label { font-size:11px; color:var(--s-fg4); margin-top:2px; }\n#salary-page .card-right { text-align:right; }\n#salary-page .card-may { font-size:18px; font-weight:700; }\n#salary-page .card-may.may-up { color:var(--s-red); }\n#salary-page .card-may.may-dn { color:var(--s-green); }\n#salary-page .card-may.may-neu { color:var(--s-fg); }\n#salary-page .diff-up { font-size:13px; font-weight:600; color:var(--s-red);   margin-top:1px; }\n#salary-page .diff-dn { font-size:13px; font-weight:600; color:var(--s-green); margin-top:1px; }\n#salary-page .diff-neu { font-size:13px; font-weight:600; color:var(--s-fg4);   margin-top:1px; }\n#salary-page .card-apr { font-size:12px; color:var(--s-blue2); margin-top:1px; }\n#salary-page .card-reason { font-size:11px; color:var(--s-fg3);  line-height:1.55; margin-top:6px; }\n#salary-page .warn-dot { width:7px; height:7px; border-radius:50%; background:var(--s-orange); display:inline-block; margin-left:4px; vertical-align:middle; }\n\n/* dept card backgrounds \u2014 CSS vars, auto dark */\n#salary-page .bg-lavender { background:var(--s-dept-lavender); }\n#salary-page .bg-sage { background:var(--s-dept-sage); }\n#salary-page .bg-sky { background:var(--s-dept-sky); }\n#salary-page .bg-sand { background:var(--s-dept-sand); }\n#salary-page .bg-lilac { background:var(--s-dept-lilac); }\n#salary-page .bg-mint { background:var(--s-dept-mint); }\n#salary-page .bg-stone { background:var(--s-dept-stone); }\n#salary-page .bg-ice { background:var(--s-dept-ice); }\n\n/* OVERLAY \u2014 person detail sheet */\n#salary-page .overlay {\n  position:fixed; inset:0; z-index:100;\n  background:var(--s-overlay-bg);\n  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);\n  display:flex; align-items:flex-end;\n  opacity:0; pointer-events:none; transition:opacity 0.25s;\n}\n#salary-page .overlay.show { opacity:1; pointer-events:all; }\n#salary-page .sheet {\n  width:100%; max-height:96vh; border-radius:20px 20px 0 0;\n  overflow-y:auto;\n  transform:translateY(100%);\n  transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);\n  padding-bottom:32px;\n}\n#salary-page .overlay.show .sheet { transform:translateY(0); }\n#salary-page .sheet-handle { width:36px; height:5px; background:var(--s-handle); border-radius:3px; margin:12px auto 0; }\n#salary-page .sheet-top { padding:12px 16px 14px; }\n#salary-page .sheet-name { font-size:24px; font-weight:700; margin-bottom:10px; color:var(--s-fg); }\n#salary-page .sheet-kpi-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin:12px 16px 0; }\n#salary-page .sheet-kpi {\n  border-radius:12px; padding:14px 12px 16px;\n  display:flex; flex-direction:column; justify-content:space-between;\n  min-height:90px;\n}\n#salary-page .sheet-kpi-label { font-size:11px; color:var(--s-fg4); margin-bottom:4px; }\n#salary-page .sheet-kpi-val { font-size:28px; font-weight:700; letter-spacing:-0.5px; }\n#salary-page .sheet-kpi-sub { font-size:13px; font-weight:600; margin-top:3px; }\n\n#salary-page .reason-sec {\n  background:var(--s-panel-bg);\n  margin:10px 16px; border-radius:14px; padding:14px 16px;\n}\n#salary-page .reason-sec-title { font-size:13px; font-weight:600; color:var(--s-fg4); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.04em; }\n#salary-page .reason-text { font-size:16px; color:var(--s-fg); line-height:1.65; }\n#salary-page .pending-box {\n  background:var(--s-tint-orange); border-radius:10px;\n  padding:8px 12px; font-size:13px; color:var(--s-orange);\n  line-height:1.6; border-left:3px solid var(--s-orange); margin-top:8px;\n}\n#salary-page .chart-sec {\n  background:var(--s-panel-bg);\n  margin:0 16px 10px; border-radius:14px; padding:14px 16px 16px;\n}\n#salary-page .chart-title { font-size:12px; font-weight:600; color:var(--s-fg4); margin-bottom:14px; text-transform:uppercase; letter-spacing:0.04em; }\n\n#salary-page .numrow { display:flex; align-items:center; padding:9px 0; border-bottom:0.5px solid var(--s-numrow-sep); }\n.numrow:last-child { border-bottom:none; }\n#salary-page .numrow-name { font-size:14px; font-weight:600; color:var(--s-fg2); width:36px; flex-shrink:0; }\n#salary-page .numrow-apr { font-size:15px; font-weight:600; color:var(--s-blue2); flex:1; text-align:right; }\n#salary-page .numrow-arrow { font-size:13px; color:var(--s-fg4); padding:0 8px; flex-shrink:0; }\n#salary-page .numrow-may { font-size:15px; font-weight:700; flex:1; text-align:left; }\n#salary-page .numrow-may.up { color:var(--s-red); }\n#salary-page .numrow-may.dn { color:var(--s-green); }\n#salary-page .numrow-may.neu { color:var(--s-blue2); }\n#salary-page .numrow-may.neg { color:var(--s-red); }\n#salary-page .numrow-tag { font-size:11px; font-weight:600; padding:2px 6px; border-radius:6px; flex-shrink:0; }\n#salary-page .numrow-tag.up { background:var(--s-tag-up-bg);  color:var(--s-red); }\n#salary-page .numrow-tag.dn { background:var(--s-tag-dn-bg);  color:var(--s-green); }\n#salary-page .numrow-tag.neu { background:var(--s-tag-neu-bg); color:var(--s-blue2); }\n#salary-page .numrow-tag.neg { background:var(--s-tag-up-bg);  color:var(--s-red); }\n\n#salary-page .close-btn {\n  display:block; width:calc(100% - 32px);\n  margin:10px 16px 0; padding:15px; border-radius:14px;\n  background:var(--s-close-btn); color:#fff;\n  font-size:16px; font-weight:600; font-family:inherit; border:none; cursor:pointer;\n}\n\n#salary-page .pending-footer {\n  margin:14px 16px 0; background:var(--s-tint-orange);\n  border-radius:14px; padding:13px 16px;\n  border:0.5px solid rgba(255,149,0,0.35);\n}\n#salary-page .pending-footer-title { font-size:13px; font-weight:700; color:var(--s-orange); margin-bottom:6px; }\n#salary-page .pending-footer-item { font-size:13px; color:var(--s-fg3); line-height:1.9; }\n\n/* \u2500\u2500 YEAR CALENDAR OVERLAY \u2500\u2500 */\n#salary-page .cal-overlay {\n  position:fixed; inset:0; z-index:200;\n  background:var(--s-overlay-bg);\n  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);\n  display:flex; align-items:flex-end;\n  opacity:0; pointer-events:none; transition:opacity 0.25s;\n}\n#salary-page .cal-overlay.show { opacity:1; pointer-events:all; }\n#salary-page .cal-sheet {\n  width:100%; border-radius:24px 24px 0 0;\n  background:var(--s-sheet-bg);\n  transform:translateY(100%);\n  transition:transform 0.38s cubic-bezier(0.32,0.72,0,1);\n  padding-bottom:36px; max-height:80vh; overflow-y:auto;\n}\n#salary-page .cal-overlay.show .cal-sheet { transform:translateY(0); }\n#salary-page .cal-handle { width:36px; height:5px; background:var(--s-handle); border-radius:3px; margin:12px auto 8px; }\n#salary-page .cal-header { padding:4px 20px 16px; }\n#salary-page .cal-year { font-size:28px; font-weight:700; color:var(--s-fg); }\n#salary-page .cal-subtitle { font-size:14px; color:var(--s-fg4); margin-top:2px; }\n#salary-page .cal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:0 16px; }\n#salary-page .cal-cell {\n  border-radius:16px; padding:14px 12px 16px;\n  display:flex; flex-direction:column;\n  min-height:90px; position:relative; transition:transform 0.15s;\n}\n#salary-page .cal-cell.has-data { cursor:pointer; }\n.cal-cell.has-data:active { transform:scale(0.94); }\n#salary-page .cal-cell.empty { background:var(--s-bg3); opacity:0.5; }\n#salary-page .cal-cell.active-month { box-shadow:0 0 0 2.5px var(--s-blue); }\n#salary-page .cal-month-name { font-size:13px; font-weight:600; margin-bottom:6px; }\n#salary-page .cal-total { font-size:20px; font-weight:700; letter-spacing:-0.5px; margin-top:auto; }\n#salary-page .cal-diff { font-size:11px; font-weight:600; margin-top:3px; }\n#salary-page .cal-empty-label { font-size:12px; color:var(--s-fg4); margin-top:auto; }\n#salary-page .cal-dot { width:6px; height:6px; border-radius:50%; background:var(--s-blue); position:absolute; top:10px; right:10px; }\n";
      document.head.appendChild(st);
    }

    // Create or reuse full-screen overlay
    let page = document.getElementById('salary-page');
    if (!page) {
      page = document.createElement('div');
      page.id = 'salary-page';
      page.style.cssText = 'position:fixed;inset:0;z-index:500;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:env(safe-area-inset-bottom,0)';
      document.body.appendChild(page);
    }
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    page.style.background = dark ? '#000' : '#f2f2f7';
    page.style.display = 'block';
    const navBg = dark ? 'rgba(22,22,24,0.95)' : 'rgba(242,242,247,0.95)';
    const fg = dark ? '#fff' : '#1c1c1e';

    page.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;padding:12px 16px 10px;' +
        'background:' + navBg + ';backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
        'border-bottom:0.5px solid rgba(128,128,128,0.2);position:sticky;top:0;z-index:10">' +
        '<button onclick="My.closeSalary()" style="background:none;border:none;color:#34c759;' +
          'cursor:pointer;display:flex;align-items:center;gap:4px;padding:6px 10px;' +
          'border-radius:8px;font-size:16px;font-weight:600;-webkit-tap-highlight-color:transparent">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
            'stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '返回</button>' +
        '<span style="font-size:16px;font-weight:700;color:' + fg + '">工资简报</span>' +
      '</div>' + "<!-- Month nav bar -->\n<div class=\"month-nav\" id=\"sp-month-nav\"></div>\n\n<!-- KPI row -->\n<div class=\"kpi-row\" id=\"sp-kpi-row\"></div>\n\n<!-- Summary card -->\n<div class=\"summary-card\">\n  <div id=\"sp-summary-title\" class=\"summary-title\"></div>\n  <div id=\"sp-summary-text\" class=\"summary-text\"></div>\n</div>\n\n<!-- Filter tabs -->\n<div class=\"tabs\" id=\"sp-filter-tabs\">\n  <button class=\"tab active\" onclick=\"sp_filterCards('all',this)\">\u5168\u90e8</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('THEONE',this)\">THEONE</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('\u76f4\u64ad',this)\">\u76f4\u64ad</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('\u526a\u8f91\u53f7',this)\">\u526a\u8f91\u53f7</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('\u9648\u5148\u751f',this)\">\u9648\u5148\u751f\u9879\u76ee</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('\u4ed3\u5e93',this)\">\u4ed3\u5e93</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('\u552e\u540e',this)\">\u552e\u540e</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('up',this)\">\u2191 \u4e0a\u6da8</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('dn',this)\">\u2193 \u4e0b\u964d</button>\n  <button class=\"tab\" onclick=\"sp_filterCards('neu',this)\">\u2192 \u4e0d\u53d8</button>\n</div>\n\n<div id=\"sp-grid-container\"></div>\n<div id=\"sp-pending-footer-wrap\"></div>\n\n<!-- Person detail sheet -->\n<div class=\"overlay\" id=\"sp-overlay\" onclick=\"sp_closeSheet(event)\">\n  <div class=\"sheet\" id=\"sp-sheet\">\n    <div class=\"sheet-handle\"></div>\n    <div class=\"sheet-top\">\n      <div class=\"sheet-name\" id=\"sp-d-name\"></div>\n      <div id=\"sp-d-compare\"></div>\n      <div id=\"sp-d-diff\" style=\"display:none\"></div>\n    </div>\n    <div class=\"reason-sec\">\n      <div class=\"reason-sec-title\">\u53d8\u5316\u539f\u56e0</div>\n      <div class=\"reason-text\" id=\"sp-d-reason\"></div>\n      <div id=\"sp-d-pending\"></div>\n    </div>\n    <div class=\"chart-sec\">\n      <div class=\"chart-title\">\u5de5\u8d44\u6784\u6210\u660e\u7ec6\u5bf9\u6bd4</div>\n      <div style=\"display:flex;align-items:center;padding:0 0 8px;border-bottom:0.5px solid rgba(0,0,0,0.08);margin-bottom:4px;\">\n        <div style=\"font-size:11px;font-weight:600;color:#8e8e93;flex:none;width:36px;\"></div>\n        <div style=\"font-size:11px;font-weight:600;color:#5b9fd6;flex:1;text-align:right;\">\u4e0a\u6708</div>\n        <div style=\"font-size:11px;font-weight:600;color:#8e8e93;padding:0 8px;flex:none;\">\u2192</div>\n        <div style=\"font-size:11px;font-weight:600;color:#1c1c1e;flex:1;text-align:left;\">\u672c\u6708</div>\n        <div style=\"font-size:11px;font-weight:600;color:#8e8e93;flex:none;min-width:48px;text-align:right;\">\u53d8\u5316</div>\n      </div>\n      <div id=\"sp-d-chart\"></div>\n    </div>\n    <button class=\"close-btn\" onclick=\"sp_closeSheet()\">\u5173\u95ed</button>\n  </div>\n</div>\n\n<!-- Year calendar overlay -->\n<div class=\"cal-overlay\" id=\"sp-cal-overlay\" onclick=\"sp_calOverlayClick(event)\">\n  <div class=\"cal-sheet\" id=\"sp-cal-sheet\">\n    <div class=\"cal-handle\"></div>\n    <div class=\"cal-header\">\n      <div class=\"cal-year\">2026</div>\n      <div class=\"cal-subtitle\">\u70b9\u51fb\u5df2\u6709\u6570\u636e\u7684\u6708\u4efd\u67e5\u770b\u7b80\u62a5</div>\n    </div>\n    <div class=\"cal-grid\" id=\"sp-cal-grid\"></div>\n    <button class=\"close-btn\" style=\"margin-top:16px;\" onclick=\"sp_closeCalendar()\">\u5173\u95ed</button>\n  </div>\n</div>";

    // Inject and run salary JS
    const old = document.getElementById('sp-script');
    if (old) old.remove();
    const sc = document.createElement('script');
    sc.id = 'sp-script';
    sc.textContent = "// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// DATA\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\nconst peopleApr = [\n  {name:'\u5b54\u654f\u6021',dept:'\u8fd0\u8425',may:5050,apr:0,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u65e0\u52a0\u73ed\u63d0\u6210\u3002',bars:[{n:'\u5e95\u85aa',may:4900,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u4f0d\u534e\u5f69',dept:'\u7f8e\u5de5',may:6910,apr:0,type:'neu',reason:'\u52a0\u73ed\u00a5260\uff08\u63091\u5929\u6298\u7b97\uff09\u3002',bars:[{n:'\u5e95\u85aa',may:6500,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:260,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u8d75\u59d7\u59d7',dept:'\u7f8e\u5de5',may:7118,apr:0,type:'neu',reason:'\u52a0\u73ed\u00a5268\uff08\u63091\u5929\u6298\u7b97\uff09\u3002',bars:[{n:'\u5e95\u85aa',may:6700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:268,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u8d75\u4f73\u742a',dept:'\u5ba2\u670d',may:5850,apr:0,type:'neu',reason:'\u4ea7\u5047\u671f\u95f4\uff0c\u6309\u56fa\u5b9a\u6807\u51c6\u53d1\u653e\u3002',bars:[{n:'\u5e95\u85aa',may:5700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u83ab\u7fe0\u73b2',dept:'\u9633\u6c5f\u5ba2\u670d',may:8200,apr:0,type:'neu',reason:'\u5c45\u5bb6\u529e\u516c\uff0c\u56fa\u5b9a\u85aa\u8d44\uff0c\u65e0\u5168\u52e4\u3002',bars:[{n:'\u5e95\u85aa',may:8200,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u83ab\u78a7\u541b',dept:'\u9633\u6c5f\u5ba2\u670d',may:8200,apr:0,type:'neu',reason:'\u5c45\u5bb6\u529e\u516c\uff0c\u56fa\u5b9a\u85aa\u8d44\uff0c\u65e0\u5168\u52e4\u3002',bars:[{n:'\u5e95\u85aa',may:8200,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u9648\u5609\u4eea',dept:'\u9633\u6c5f\u5ba2\u670d',may:7422,apr:0,type:'neu',reason:'\u52a0\u73ed\u00a5402\uff08\u7ea61.5\u5929\uff09\uff0c\u5404\u9879\u6b63\u5e38\u3002',bars:[{n:'\u5e95\u85aa',may:6700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:402,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u90ed\u950b\u539f',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:12790,apr:0,type:'neu',reason:'\u56fa\u5b9a\u52a0\u73ed\u00a52,000\u5df2\u8ba1\u5165\uff1bGMV\u63d0\u6210\u00a5840\u5df2\u53d1\u3002',bars:[{n:'\u5e95\u85aa',may:9800,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:2000,apr:0},{n:'\u63d0\u6210',may:840,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u9ec4\u4e1c\u4eae',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:7754,apr:0,type:'neu',reason:'GMV\u63d0\u6210\u00a5404\u5df2\u8ba1\u5165\uff0c\u672c\u6708\u65e0\u52a0\u73ed\u8d39\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:404,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u4f0d\u5c1a\u5eb7',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:9350,apr:0,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u672c\u6708\u65e0\u52a0\u73ed\u3002',bars:[{n:'\u5e95\u85aa',may:9200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u738b\u9756\u5141',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:5648,apr:0,type:'neu',reason:'\u6263\u8bf7\u5047\u00a5620\uff0c\u6709\u63d0\u6210\u00a5218\uff0c\u5168\u52e4\u672a\u8fbe\u6807\u3002',bars:[{n:'\u5e95\u85aa',may:6200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:218,apr:0},{n:'\u8bf7\u5047\u6263',may:-620,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u6768\u6b23',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:8121,apr:0,type:'neu',reason:'\u52a0\u73ed\u8d39\u00a5674+\u63d0\u6210\u00a5127\uff0c\u672c\u6708\u6536\u5165\u8f83\u9ad8\u3002',bars:[{n:'\u5e95\u85aa',may:7000,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:674,apr:0},{n:'\u63d0\u6210',may:127,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u5510\u607a',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:5055,apr:0,type:'neu',reason:'\u6263\u8bf7\u5047\u00a5347\uff0c\u6709\u63d0\u6210\u00a5351\uff0c\u5168\u52e4\u672a\u8fbe\u6807\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:351,apr:0},{n:'\u8bf7\u5047\u6263',may:-347,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u80e1\u53ef\u8d22',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:4147,apr:0,type:'neu',reason:'\u6709\u63d0\u6210\u00a5127\uff0c\u5404\u9879\u6b63\u5e38\u3002',bars:[{n:'\u5e95\u85aa',may:3700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:127,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u8bb8\u671d\u9633',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:6144,apr:0,type:'neu',reason:'\u52a0\u73ed\u8d39\u00a5500+\u63d0\u6210\u00a5294\uff0c\u672c\u6708\u8868\u73b0\u597d\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:500,apr:0},{n:'\u63d0\u6210',may:294,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u5f20\u598d\u67d4',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:7520,apr:0,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u65e0\u52a0\u73ed\u63d0\u6210\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u6797\u6c5d\u8363',dept:'\u526a\u8f91\u53f7',may:9350,apr:0,type:'neu',reason:'\u56fa\u5b9a\u52a0\u73ed\u8d39\u00a53,000\uff0c\u5404\u9879\u6b63\u5e38\u3002',bars:[{n:'\u5e95\u85aa',may:6200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:3000,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u9879\u67ef\u6865',dept:'\u526a\u8f91\u53f7',may:5558,apr:0,type:'neu',reason:'\u52a0\u73ed\u8d39\u00a5208\uff08\u7ea610.4\u5c0f\u65f6\uff09\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:208,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u9ec4\u9f99\u5149',dept:'\u526a\u8f91\u53f7',may:3950,apr:0,type:'neu',reason:'\u6309\u56fa\u5b9a\u6807\u51c6\u53d1\u653e\u3002',bars:[{n:'\u5e95\u85aa',may:4600,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u8c22\u514b\u5353',dept:'\u9648\u5148\u751f\u9879\u76ee',may:5558,apr:0,type:'neu',reason:'\u52a0\u73ed\u8d39\u00a5208\uff08\u7ea610.4\u5c0f\u65f6\uff09\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:208,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u6797\u5065\u6b22',dept:'\u9648\u5148\u751f\u9879\u76ee',may:7350,apr:0,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u5404\u9879\u6b63\u5e38\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u9648\u5955\u53cb',dept:'\u9648\u5148\u751f\u9879\u76ee',may:5350,apr:0,type:'neu',reason:'\u56fa\u5b9a\u5de5\u8d44\u00a55,350\u3002',bars:[{n:'\u5e95\u85aa',may:6000,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u6881\u68a6\u5a1c',dept:'\u9648\u5148\u751f\u9879\u76ee',may:7000,apr:0,type:'neu',reason:'\u56fa\u5b9a\u5de5\u8d44\u00a57,000\uff08\u542b\u4e00\u5207\uff09\u3002',bars:[{n:'\u56fa\u5b9a\u603b\u989d',may:7000,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u8096\u714c',dept:'\u4ed3\u5e93',may:7690,apr:0,type:'neu',reason:'\u56fa\u5b9a\u52a0\u73ed\u00a51,000\u5df2\u8ba1\u5165\uff1b\u7f5a\u6b3e\u00a510\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:1000,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u7f5a\u6b3e',may:-10,apr:0},{n:'\u793e\u4fdd',may:-1300,apr:0}]},\n  {name:'\u6881\u60f3\u8d24',dept:'\u4ed3\u5e93',may:6128,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,670\uff0c\u52a0\u73ed\u00a5168\uff1b\u7f5a\u6b3e\u00a510\u3002',bars:[{n:'\u5e95\u85aa',may:4200,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:168,apr:0},{n:'\u63d0\u6210',may:1670,apr:0},{n:'\u7f5a\u6b3e',may:-10,apr:0},{n:'\u793e\u4fdd',may:-700,apr:0}]},\n  {name:'\u6881\u82d1\u658c',dept:'\u4ed3\u5e93',may:7212,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a54,262\uff0c\u52a0\u73ed\u00a5160\uff1b\u7f5a\u6b3e\u00a510\u3002',bars:[{n:'\u5e95\u85aa',may:2700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:160,apr:0},{n:'\u63d0\u6210',may:4262,apr:0},{n:'\u7f5a\u6b3e',may:-10,apr:0},{n:'\u793e\u4fdd',may:-700,apr:0}]},\n  {name:'\u4f55\u5747\u4f1f',dept:'\u4ed3\u5e93',may:7137,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a53,817\uff0c\u52a0\u73ed\u00a5300\u3002',bars:[{n:'\u5e95\u85aa',may:2700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:300,apr:0},{n:'\u63d0\u6210',may:3817,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u9ec4\u626c\u660e',dept:'\u4ed3\u5e93',may:5979,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a53,179\uff0c\u5e95\u85aa\u6309\u51fa\u52e423.5\u5929\u6298\u7b97\uff1b\u7f5a\u6b3e\u00a510\u3002',bars:[{n:'\u5e95\u85aa',may:3290,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:3179,apr:0},{n:'\u7f5a\u6b3e',may:-10,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u6797\u5e86\u971e',dept:'\u4ed3\u5e93',may:5308,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,158\uff0c\u52a0\u73ed\u00a5200\uff0c\u5e95\u85aa\u6309\u51fa\u52e422.5\u5929\u6298\u7b97\uff1b\u7f5a\u6b3e\u00a520\u3002',bars:[{n:'\u5e95\u85aa',may:3150,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:200,apr:0},{n:'\u63d0\u6210',may:2158,apr:0},{n:'\u7f5a\u6b3e',may:-20,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u91d1\u4e3d\u6843',dept:'\u4ed3\u5e93',may:5898,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,948\uff0c\u52a0\u73ed\u00a5360\uff0c\u5e95\u85aa\u6309\u51fa\u52e422\u5929\u6298\u7b97\uff1b\u7f5a\u6b3e\u00a510\u3002',bars:[{n:'\u5e95\u85aa',may:3080,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:360,apr:0},{n:'\u63d0\u6210',may:2948,apr:0},{n:'\u7f5a\u6b3e',may:-10,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u5e9e\u91d1\u8339',dept:'\u4ed3\u5e93',may:5405,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,395\uff0c\u52a0\u73ed\u00a5360\uff0c\u5e95\u85aa\u6309\u51fa\u52e422.5\u5929\u6298\u7b97\uff1b\u7f5a\u6b3e\u00a520\u3002',bars:[{n:'\u5e95\u85aa',may:3150,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:360,apr:0},{n:'\u63d0\u6210',may:2395,apr:0},{n:'\u7f5a\u6b3e',may:-20,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u9648\u62db\u6c49',dept:'\u4ed3\u5e93',may:6565,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a53,745\uff0c\u52a0\u73ed\u00a5300\uff0c\u5e95\u85aa\u6309\u51fa\u52e423\u5929\u6298\u7b97\u3002',bars:[{n:'\u5e95\u85aa',may:3220,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:300,apr:0},{n:'\u63d0\u6210',may:3745,apr:0},{n:'\u793e\u4fdd',may:-700,apr:0}]},\n  {name:'\u5e9e\u667a\u9e4f',dept:'\u4ed3\u5e93',may:4586,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,886\uff0c\u52a0\u73ed\u00a5100\uff0c\u5e95\u85aa\u6309\u51fa\u52e422\u5929\u6298\u7b97\u3002',bars:[{n:'\u5e95\u85aa',may:3080,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:100,apr:0},{n:'\u63d0\u6210',may:1886,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u8463\u91d1\u6e90',dept:'\u4ed3\u5e93',may:4879,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,939\uff0c\u52a0\u73ed\u00a540\uff0c\u5e95\u85aa\u6309\u51fa\u52e417\u5929\u6298\u7b97\u3002',bars:[{n:'\u5e95\u85aa',may:2380,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:40,apr:0},{n:'\u63d0\u6210',may:2939,apr:0},{n:'\u793e\u4fdd',may:-480,apr:0}]},\n  {name:'\u83ab\u667a\u96c4',dept:'\u4ed3\u5e93',may:5850,apr:0,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u672c\u6708\u65e0\u52a0\u73ed\u63d0\u6210\u3002',bars:[{n:'\u5e95\u85aa',may:5700,apr:0},{n:'\u8865\u8d34',may:500,apr:0},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u6881\u542f\u51e1',dept:'\u4ed3\u5e93',may:5350,apr:0,type:'neu',reason:'\u56fa\u5b9a\u5de5\u8d44\u00a55,350\u3002',bars:[{n:'\u5e95\u85aa',may:6000,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:0}]},\n  {name:'\u6881\u4e3d\u4e91',dept:'\u552e\u540e',may:5210,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,086\uff0c\u52a0\u73ed\u00a540\u3002',bars:[{n:'\u5e95\u85aa',may:3784,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:40,apr:0},{n:'\u63d0\u6210',may:2086,apr:0},{n:'\u793e\u4fdd',may:-700,apr:0}]},\n  {name:'\u80e1\u6d77\u4e91',dept:'\u552e\u540e',may:4727,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,787\uff1b\u5e95\u85aa\u6309\u51fa\u52e4\u6298\u7b97\u3002',bars:[{n:'\u5e95\u85aa',may:2940,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:1787,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u9648\u4ef2\u7af9',dept:'\u552e\u540e',may:5721,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,521\uff0c\u52a0\u73ed\u00a5120\uff086\u5c0f\u65f6\uff09\u3002',bars:[{n:'\u5e95\u85aa',may:3080,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:120,apr:0},{n:'\u63d0\u6210',may:2521,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u5434\u7f8e',dept:'\u552e\u540e',may:5147,apr:0,type:'neu',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,687\uff0c\u52a0\u73ed\u00a5110\uff0c\u793e\u4fdd\u8865\u8d34+200\u3002',bars:[{n:'\u5e95\u85aa',may:3150,apr:0},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:110,apr:0},{n:'\u63d0\u6210',may:1687,apr:0},{n:'\u5176\u4ed6',may:200,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n];\n\nconst peopleMay = [\n  {name:'\u5b54\u654f\u6021',dept:'\u8fd0\u8425',may:5050,apr:5050,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u4e0e\u4e0a\u6708\u5b8c\u5168\u4e00\u81f4\u3002',bars:[{n:'\u5e95\u85aa',may:4900,apr:4900},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u4f0d\u534e\u5f69',dept:'\u7f8e\u5de5',may:6700,apr:6910,type:'dn',reason:'\u4e0a\u6708\u52a0\u73ed\u63091\u5929\u6298\u7b97\u00a5260\uff0c\u672c\u6708\u6539\u6309\u5b9e\u9645\u5c0f\u65f6\uff0c2.5\u5c0f\u65f6\u4ec5\u00a550\uff0c\u5dee\u989d\u00a5210\u3002',bars:[{n:'\u5e95\u85aa',may:6500,apr:6500},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:50,apr:260},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u8d75\u59d7\u59d7',dept:'\u7f8e\u5de5',may:6970,apr:7118,type:'dn',reason:'\u4e0a\u6708\u52a0\u73ed\u63091\u5929\u6298\u7b97\u00a5268\uff0c\u672c\u6708\u6539\u6309\u5c0f\u65f6\uff0c6\u5c0f\u65f6\u8ba1\u00a5120\uff0c\u5dee\u989d\u00a5148\u3002',bars:[{n:'\u5e95\u85aa',may:6700,apr:6700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:120,apr:268},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u8d75\u4f73\u742a',dept:'\u5ba2\u670d',may:5850,apr:5850,type:'neu',reason:'\u4ea7\u5047\u671f\u95f4\uff0c\u6309\u56fa\u5b9a\u6807\u51c6\u53d1\u653e\u3002',bars:[{n:'\u5e95\u85aa',may:5700,apr:5700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u83ab\u7fe0\u73b2',dept:'\u9633\u6c5f\u5ba2\u670d',may:8200,apr:8200,type:'neu',reason:'\u5c45\u5bb6\u529e\u516c\uff0c\u56fa\u5b9a\u85aa\u8d44\uff0c\u65e0\u5168\u52e4\u5956\u3002',bars:[{n:'\u5e95\u85aa',may:8200,apr:8200},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u83ab\u78a7\u541b',dept:'\u9633\u6c5f\u5ba2\u670d',may:8200,apr:8200,type:'neu',reason:'\u5c45\u5bb6\u529e\u516c\uff0c\u56fa\u5b9a\u85aa\u8d44\uff0c\u65e0\u5168\u52e4\u5956\u3002',bars:[{n:'\u5e95\u85aa',may:8200,apr:8200},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u9648\u5609\u4eea',dept:'\u9633\u6c5f\u5ba2\u670d',may:7020,apr:7422,type:'dn',reason:'\u4e0a\u6708\u67091.5\u5929\u52a0\u73ed\u8d39\u00a5402\uff0c\u672c\u6708\u52a0\u73ed\u4ec50.5\u5c0f\u65f6\u672a\u8ba1\u5165\uff0c\u5dee\u989d\u00a5402\u3002',bars:[{n:'\u5e95\u85aa',may:6700,apr:6700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:0,apr:402},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u90ed\u950b\u539f',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:11950,apr:12790,type:'warn',reason:'GMV\u63d0\u6210\u5f85\u786e\u8ba4\u6682\u672a\u8ba1\u5165\uff0c\u56fa\u5b9a\u52a0\u73ed\u8d39\u00a52,000\u5df2\u8ba1\u5165\uff1b\u4e0a\u6708\u6709\u63d0\u6210\u00a5840\u3002',pending:'\u26a0 GMV\u63d0\u6210\u786e\u8ba4\u540e\u8865\u5165\uff0c\u8865\u5165\u540e\u603b\u989d\u5c06\u9ad8\u4e8e\u4e0a\u6708\u3002',bars:[{n:'\u5e95\u85aa',may:9800,apr:9800},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:2000,apr:2000},{n:'\u63d0\u6210',may:0,apr:840},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u9ec4\u4e1c\u4eae',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:7470,apr:7754,type:'warn',reason:'\u4e0a\u6708\u6709\u63d0\u6210\u00a5404\uff0c\u672c\u6708GMV\u63d0\u6210\u5f85\u8865\uff1b\u52a0\u73ed\u8d39\u00a5120\u5df2\u8ba1\u5165\u3002',pending:'\u26a0 GMV\u63d0\u6210\u786e\u8ba4\u540e\u8865\u5165\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:7200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:120,apr:0},{n:'\u63d0\u6210',may:0,apr:404},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u4f0d\u5c1a\u5eb7',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:9350,apr:9350,type:'neu',reason:'\u5e95\u85aa+\u8865\u8d34+\u5168\u52e4\uff0c\u4e0e\u4e0a\u6708\u4e00\u81f4\uff0c\u672c\u6708\u672a\u6392\u73ed\u3002',bars:[{n:'\u5e95\u85aa',may:9200,apr:9200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u738b\u9756\u5141',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:6750,apr:5648,type:'up',reason:'\u4e0a\u6708\u6263\u00a5620\u8bf7\u5047\uff0c\u672c\u6708\u4e0d\u6263\uff1b\u672c\u6708\u52a0\u73ed20\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a5400\uff0c\u5408\u8ba1\u6da8\u00a51,102\u3002',bars:[{n:'\u5e95\u85aa',may:6200,apr:6200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:400,apr:0},{n:'\u63d0\u6210',may:0,apr:218},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u6768\u6b23',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:7380,apr:8121,type:'warn',reason:'\u4e0a\u6708\u6709\u63d0\u6210\u00a5127+\u52a0\u73ed\u00a5674\uff0c\u672c\u6708\u52a0\u73ed\u8d39\u00a560\uff0cGMV\u63d0\u6210\u5f85\u8865\u3002',pending:'\u26a0 GMV\u63d0\u6210\u786e\u8ba4\u540e\u8865\u5165\u3002',bars:[{n:'\u5e95\u85aa',may:7000,apr:7000},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:60,apr:674},{n:'\u63d0\u6210',may:0,apr:127},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u5510\u607a',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:5380,apr:5055,type:'up',reason:'\u4e0a\u6708\u6263\u00a5347\u8bf7\u5047\uff0c\u672c\u6708\u4e0d\u6263\uff1b\u52a0\u73ed\u8d39\u00a530\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:5200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:0},{n:'\u52a0\u73ed',may:30,apr:0},{n:'\u63d0\u6210',may:0,apr:351},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u80e1\u53ef\u8d22',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:4120,apr:4147,type:'dn',reason:'\u4e0e\u4e0a\u6708\u57fa\u672c\u6301\u5e73\uff0c\u4e0a\u6708\u6709\u5c11\u91cf\u63d0\u6210\u00a5127\uff0c\u672c\u6708\u672a\u8ba1\uff0c\u5dee\u989d\u00a527\u3002',bars:[{n:'\u5e95\u85aa',may:3700,apr:3700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:100,apr:0},{n:'\u63d0\u6210',may:0,apr:127},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u8bb8\u671d\u9633',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:5610,apr:6144,type:'warn',reason:'\u4e0a\u6708\u6709\u63d0\u6210\u00a5294+\u52a0\u73ed\u00a5500\uff0c\u672c\u6708\u52a0\u73ed\u8d39\u00a5260\uff0cGMV\u63d0\u6210\u5f85\u8865\u3002',pending:'\u26a0 GMV\u63d0\u6210\u786e\u8ba4\u540e\u8865\u5165\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:5200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:260,apr:500},{n:'\u63d0\u6210',may:0,apr:294},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u5f20\u598d\u67d4',dept:'\u76f4\u64ad\u529e\u516c\u5ba4',may:7580,apr:7520,type:'up',reason:'\u672c\u6708\u52a0\u73ed3\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a560\uff0c\u5fae\u6da8\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:7200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:60,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u6797\u6c5d\u8363',dept:'\u526a\u8f91\u53f7',may:9350,apr:9350,type:'neu',reason:'\u56fa\u5b9a\u52a0\u73ed\u8d39\u00a53,000\uff0c\u4e0e\u4e0a\u6708\u5b8c\u5168\u4e00\u81f4\u3002',bars:[{n:'\u5e95\u85aa',may:6200,apr:6200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:3000,apr:3000},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u9879\u67ef\u6865',dept:'\u526a\u8f91\u53f7',may:6440,apr:5558,type:'up',reason:'\u672c\u6708\u98de\u4e66\u52a0\u73ed54.5\u5c0f\u65f6\uff0c\u630920\u5143/\u5c0f\u65f6\u8ba1\u52a0\u73ed\u8d39\u00a51,090\uff0c\u4e0a\u6708\u65e0\u52a0\u73ed\u8d39\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:5200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:1090,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u9ec4\u9f99\u5149',dept:'\u526a\u8f91\u53f7',may:3950,apr:3950,type:'neu',reason:'\u6309\u4e0a\u6708\u6807\u51c6\u56fa\u5b9a\u53d1\u653e\u3002',bars:[{n:'\u5e95\u85aa',may:4600,apr:4600},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u8c22\u514b\u5353',dept:'\u9648\u5148\u751f\u9879\u76ee',may:6400,apr:5558,type:'up',reason:'\u672c\u6708\u52a0\u73ed52.5\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a51,050\uff0c\u4e0a\u6708\u4ec5\u52a0\u73ed\u8d39\u00a5208\u3002',bars:[{n:'\u5e95\u85aa',may:5200,apr:5200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:1050,apr:208},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u6797\u5065\u6b22',dept:'\u9648\u5148\u751f\u9879\u76ee',may:7880,apr:7350,type:'up',reason:'\u672c\u6708\u52a0\u73ed26.5\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a5530\uff0c\u4e0a\u6708\u65e0\u52a0\u73ed\u8d39\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:7200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:530,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u9648\u5955\u53cb',dept:'\u9648\u5148\u751f\u9879\u76ee',may:5350,apr:5350,type:'neu',reason:'\u56fa\u5b9a\u5de5\u8d44\uff0c\u4e0e\u4e0a\u6708\u4e00\u81f4\u3002',bars:[{n:'\u5e95\u85aa',may:6000,apr:6000},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u6881\u68a6\u5a1c',dept:'\u9648\u5148\u751f\u9879\u76ee',may:7000,apr:6000,type:'up',reason:'\u539f\"\u5a1c\u5a1c\"\uff0c\u672c\u6708\u8d77\u56fa\u5b9a\u00a57,000\uff0c\u4e0a\u6708\u4e3a\u5e95\u85aa+\u5168\u52e4\u7b49\u5408\u8ba1\u00a56,000\u3002',bars:[{n:'\u56fa\u5b9a\u603b\u989d',may:7000,apr:6000},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u8096\u714c',dept:'\u4ed3\u5e93',may:7700,apr:7690,type:'warn',reason:'\u56fa\u5b9a\u52a0\u73ed\u8d39\u00a51,000\u5df2\u8ba1\u5165\uff1b\u4ed3\u5e93\u7ee9\u6548\u63d0\u6210\u6682\u672a\u8865\u5165\uff0c\u5f85\u4e3b\u7ba1\u786e\u8ba4\u3002',pending:'\u26a0 \u4ed3\u5e93\u7ee9\u6548\u63d0\u6210\u5f85\u786e\u8ba4\u540e\u8865\u5165\u3002',bars:[{n:'\u5e95\u85aa',may:7200,apr:7200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:1000,apr:1000},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-1300,apr:-1300}]},\n  {name:'\u6881\u60f3\u8d24',dept:'\u4ed3\u5e93',may:6190,apr:6128,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,670\uff0c\u52a0\u73ed\u8d39\u00a5220\uff0c\u4e0e\u4e0a\u6708\u57fa\u672c\u6301\u5e73\u3002',bars:[{n:'\u5e95\u85aa',may:4200,apr:4200},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:220,apr:168},{n:'\u63d0\u6210',may:1670,apr:1670},{n:'\u793e\u4fdd',may:-700,apr:-700}]},\n  {name:'\u6881\u82d1\u658c',dept:'\u4ed3\u5e93',may:7252,apr:7212,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a54,262\uff0c\u52a0\u73ed\u8d39\u00a5190\uff0c\u4e0e\u4e0a\u6708\u57fa\u672c\u6301\u5e73\u3002',bars:[{n:'\u5e95\u85aa',may:2700,apr:2700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:190,apr:160},{n:'\u63d0\u6210',may:4262,apr:4262},{n:'\u793e\u4fdd',may:-700,apr:-700}]},\n  {name:'\u4f55\u5747\u4f1f',dept:'\u4ed3\u5e93',may:7087,apr:7137,type:'dn',reason:'\u7ee9\u6548\u63d0\u6210\u00a53,817\u4e0e\u4e0a\u6708\u4e00\u81f4\uff1b\u4e0a\u6708\u52a0\u73ed\u00a5300\uff0c\u672c\u6708\u52a0\u73ed\u00a5250\uff0c\u5fae\u964d\u00a550\u3002',bars:[{n:'\u5e95\u85aa',may:2700,apr:2700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:250,apr:300},{n:'\u63d0\u6210',may:3817,apr:3817},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u9ec4\u626c\u660e',dept:'\u4ed3\u5e93',may:6419,apr:5979,type:'up',reason:'\u672c\u6708\u5e95\u85aa\u6309\u6ee1\u6708\u8ba1\u7b97\uff0c\u4e0a\u6708\u6309\u51fa\u52e423.5\u5929\u6298\u7b97\u504f\u4f4e\uff1b\u52a0\u73ed\u8d39\u00a5130\u3002',bars:[{n:'\u5e95\u85aa',may:3290,apr:3080},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:130,apr:0},{n:'\u63d0\u6210',may:3179,apr:3179},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u6797\u5e86\u971e',dept:'\u4ed3\u5e93',may:5308,apr:5008,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,158\uff0c\u52a0\u73ed\u8d39\u00a5180\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e4\u5929\u6570\u6298\u7b97\u504f\u4f4e\u3002',bars:[{n:'\u5e95\u85aa',may:3150,apr:3150},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:180,apr:200},{n:'\u63d0\u6210',may:2158,apr:2158},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u91d1\u4e3d\u6843',dept:'\u4ed3\u5e93',may:6018,apr:5898,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,948\uff0c\u52a0\u73ed\u8d39\u00a5170\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e422\u5929\u6298\u7b97\u504f\u4f4e\u3002',bars:[{n:'\u5e95\u85aa',may:3080,apr:3080},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:170,apr:360},{n:'\u63d0\u6210',may:2948,apr:2948},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u5e9e\u91d1\u8339',dept:'\u4ed3\u5e93',may:5615,apr:5405,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,395\uff0c\u52a0\u73ed\u8d39\u00a5250\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e4\u5929\u6570\u6298\u7b97\u504f\u4f4e\u3002',bars:[{n:'\u5e95\u85aa',may:3150,apr:3150},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:250,apr:360},{n:'\u63d0\u6210',may:2395,apr:2395},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u9648\u62db\u6c49',dept:'\u4ed3\u5e93',may:6615,apr:6565,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a53,745\uff0c\u672c\u6708\u52a0\u73ed\u00a550\uff0c\u4e0e\u4e0a\u6708\u57fa\u672c\u6301\u5e73\u3002',bars:[{n:'\u5e95\u85aa',may:3220,apr:3220},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:50,apr:300},{n:'\u63d0\u6210',may:3745,apr:3745},{n:'\u793e\u4fdd',may:-700,apr:-700}]},\n  {name:'\u5e9e\u667a\u9e4f',dept:'\u4ed3\u5e93',may:4956,apr:4586,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,886\uff0c\u52a0\u73ed\u8d39\u00a5170\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e422\u5929\u6298\u7b97\u504f\u4f4e\u3002',bars:[{n:'\u5e95\u85aa',may:3080,apr:3080},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:170,apr:100},{n:'\u63d0\u6210',may:1886,apr:1886},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u8463\u91d1\u6e90',dept:'\u4ed3\u5e93',may:5199,apr:4879,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a52,939\uff0c\u52a0\u73ed\u8d39\u00a560\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e417\u5929\u6298\u7b97\u504f\u4f4e\uff0c\u672c\u6708\u6ee1\u6708\u8ba1\u7b97\u3002',bars:[{n:'\u5e95\u85aa',may:2380,apr:2380},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:60,apr:40},{n:'\u63d0\u6210',may:2939,apr:2939},{n:'\u793e\u4fdd',may:-480,apr:-480}]},\n  {name:'\u83ab\u667a\u96c4',dept:'\u4ed3\u5e93',may:5870,apr:5850,type:'warn',reason:'\u5e95\u85aa+\u52a0\u73ed\u00a520\u5df2\u8ba1\u5165\uff1b\u4ed3\u5e93\u7ee9\u6548\u63d0\u6210\u6682\u672a\u8ba1\u5165\u3002',pending:'\u26a0 \u4ed3\u5e93\u7ee9\u6548\u63d0\u6210\u5f85\u786e\u8ba4\u540e\u8865\u5165\u3002',bars:[{n:'\u5e95\u85aa',may:5700,apr:5700},{n:'\u8865\u8d34',may:500,apr:500},{n:'\u5168\u52e4',may:300,apr:300},{n:'\u52a0\u73ed',may:20,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u6881\u542f\u51e1',dept:'\u4ed3\u5e93',may:5350,apr:5350,type:'neu',reason:'\u56fa\u5b9a\u5de5\u8d44\uff0c\u4e0e\u4e0a\u6708\u4e00\u81f4\u3002',bars:[{n:'\u5e95\u85aa',may:6000,apr:6000},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:0,apr:0},{n:'\u63d0\u6210',may:0,apr:0},{n:'\u793e\u4fdd',may:-650,apr:-650}]},\n  {name:'\u6881\u4e3d\u4e91',dept:'\u552e\u540e',may:5600,apr:5210,type:'up',reason:'\u672c\u6708\u52a0\u73ed21.5\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a5430\uff1b\u7ee9\u6548\u63d0\u6210\u00a52,086\u3002',bars:[{n:'\u5e95\u85aa',may:3784,apr:3784},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:430,apr:40},{n:'\u63d0\u6210',may:2086,apr:2086},{n:'\u793e\u4fdd',may:-700,apr:-700}]},\n  {name:'\u80e1\u6d77\u4e91',dept:'\u552e\u540e',may:5297,apr:4727,type:'up',reason:'\u7ee9\u6548\u63d0\u6210\u00a51,787\uff0c\u52a0\u73ed0.5\u5c0f\u65f6\u8ba1\u00a510\uff1b\u4e0a\u6708\u5e95\u85aa\u6309\u51fa\u52e4\u6298\u7b97\u504f\u4f4e\u3002',bars:[{n:'\u5e95\u85aa',may:3500,apr:2940},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:10,apr:0},{n:'\u63d0\u6210',may:1787,apr:1787},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u9648\u4ef2\u7af9',dept:'\u552e\u540e',may:7281,apr:5721,type:'up',reason:'\u52a0\u73ed63\u5c0f\u65f6\u52a0\u73ed\u8d39\u00a51,260 + \u7ee9\u6548\u63d0\u6210\u00a52,521\uff0c\u6da8\u5e45\u8f83\u5927\uff0c\u4e3b\u7ba1\u786e\u8ba4\u4e2d\u3002',pending:'\u26a0 \u52a0\u73ed63\u5c0f\u65f6\u6da8\u5e45\u8f83\u5927\uff0c\u9700\u4e3b\u7ba1\u786e\u8ba4\u662f\u5426\u5c5e\u5b9e\u3002',bars:[{n:'\u5e95\u85aa',may:3500,apr:3500},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:1260,apr:120},{n:'\u63d0\u6210',may:2521,apr:2521},{n:'\u793e\u4fdd',may:0,apr:0}]},\n  {name:'\u5434\u7f8e',dept:'\u552e\u540e',may:5907,apr:5147,type:'up',reason:'\u672c\u6708\u52a0\u73ed36\u5c0f\u65f6\uff0c\u52a0\u73ed\u8d39\u00a5720\uff1b\u7ee9\u6548\u63d0\u6210\u00a51,687\u3002',bars:[{n:'\u5e95\u85aa',may:3500,apr:3500},{n:'\u8865\u8d34',may:0,apr:0},{n:'\u5168\u52e4',may:0,apr:0},{n:'\u52a0\u73ed',may:720,apr:0},{n:'\u63d0\u6210',may:1687,apr:1687},{n:'\u793e\u4fdd',may:0,apr:0}]},\n];\n\n// Monthly metadata \u2014 add new months here as data becomes available\nconst monthMeta = {\n  4: {\n    people: peopleApr,\n    total: 257887,\n    prevTotal: null,   // no March data\n    label: '4\u6708',\n    summary: '4\u6708\u5b9e\u53d1\u603b\u989d <span style=\"color:var(--s-green);font-weight:600;\">\u00a5257,887</span>\uff0c\u517140\u4eba\u3002\u76f4\u64ad\u7ec4\u591a\u4eba\u6709GMV\u63d0\u6210\u53ca\u52a0\u73ed\u8d39\u8ba1\u5165\uff0c\u4ed3\u5e93\u7ee9\u6548\u6b63\u5e38\u53d1\u653e\u3002\u738b\u9756\u5141/\u5510\u607a\u6709\u8bf7\u5047\u6263\u6b3e\uff1b\u90ed\u950b\u539f\u56fa\u5b9a\u52a0\u73ed\u00a52,000+\u63d0\u6210\u00a5840\u3002',\n    pendingTitle: '\ud83d\udccc 4\u6708\u5907\u6ce8',\n    pendingBody: '\u90ed\u950b\u539f \u2014 \u56fa\u5b9a\u52a0\u73ed\u00a52,000 + GMV\u63d0\u6210\u00a5840 \u5df2\u8ba1\u5165<br>\u738b\u9756\u5141 / \u5510\u607a \u2014 \u6709\u8bf7\u5047\u6263\u6b3e<br>\u4ed3\u5e93\u7ee9\u6548\u5df2\u8ba1\u5165\u5404\u4eba4\u6708\u63d0\u6210',\n  },\n  5: {\n    people: peopleMay,\n    total: 263614,\n    prevTotal: 257887,\n    label: '5\u6708',\n    summary: '5\u6708\u603b\u5de5\u8d44\u8f834\u6708\u589e\u52a0 <span style=\"color:var(--s-red);font-weight:600;\">\u00a55,727\uff08+2.2%\uff09</span>\uff0c\u4e3b\u8981\u6765\u81ea\u4ed3\u5e93\u53ca\u76f4\u64ad\u7ec4\u52a0\u73ed\u8d39\u666e\u904d\u8ba1\u5165\u3002\u90ed\u950b\u539f/\u6768\u6b23/\u8bb8\u671d\u9633/\u9ec4\u4e1c\u4eae GMV\u63d0\u6210\u5f85\u8865\uff0c\u8865\u5b8c\u540e\u603b\u989d\u5c06\u8fdb\u4e00\u6b65\u4e0a\u6da8\u3002',\n    pendingTitle: '\u26a0 \u4ee5\u4e0b\u4eba\u5458\u8865\u5145\u540e\u603b\u989d\u5c06\u7ee7\u7eed\u4e0a\u8c03',\n    pendingBody: '\u90ed\u950b\u539f / \u6768\u6b23 / \u8bb8\u671d\u9633 / \u9ec4\u4e1c\u4eae \u2014 GMV\u63d0\u6210\u5f85\u786e\u8ba4<br>\u8096\u714c / \u83ab\u667a\u96c4 \u2014 \u4ed3\u5e93\u7ee9\u6548\u5f85\u786e\u8ba4<br>\u9648\u4ef2\u7af9 \u2014 \u52a0\u73ed63\u5c0f\u65f6\u5f85\u4e3b\u7ba1\u786e\u8ba4',\n  },\n};\n\nconst AVAILABLE_MONTHS = [4, 5];  // \u2190 \u6bcf\u6708\u8ffd\u52a0\u8fd9\u91cc\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// STATE\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nlet currentMonth = 5;   // default to latest\nlet currentFilter = 'all';\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// STATIC MAPS\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_fmt(n){ return Math.abs(n).toLocaleString('zh-CN'); }\n\nconst deptBg = {\n  '\u8fd0\u8425':'bg-lavender','\u7f8e\u5de5':'bg-sage','\u5ba2\u670d':'bg-sky','\u9633\u6c5f\u5ba2\u670d':'bg-sand',\n  '\u76f4\u64ad\u529e\u516c\u5ba4':'bg-sky','\u526a\u8f91\u53f7':'bg-lilac','\u9648\u5148\u751f\u9879\u76ee':'bg-mint','\u4ed3\u5e93':'bg-stone','\u552e\u540e':'bg-ice',\n};\nconst deptGroup = {\n  '\u8fd0\u8425':'THEONE','\u7f8e\u5de5':'THEONE','\u5ba2\u670d':'THEONE','\u9633\u6c5f\u5ba2\u670d':'THEONE',\n  '\u76f4\u64ad\u529e\u516c\u5ba4':'\u76f4\u64ad','\u526a\u8f91\u53f7':'\u526a\u8f91\u53f7','\u9648\u5148\u751f\u9879\u76ee':'\u9648\u5148\u751f','\u4ed3\u5e93':'\u4ed3\u5e93','\u552e\u540e':'\u552e\u540e',\n};\nconst groupLabels = {\n  'THEONE':'THEONE \u2014 \u8fd0\u8425/\u7f8e\u5de5/\u5ba2\u670d/\u9633\u6c5f\u5ba2\u670d','\u76f4\u64ad':'\u76f4\u64ad\u529e\u516c\u5ba4',\n  '\u526a\u8f91\u53f7':'\u526a\u8f91\u53f7','\u9648\u5148\u751f':'\u9648\u5148\u751f\u9879\u76ee','\u4ed3\u5e93':'\u4ed3\u5e93','\u552e\u540e':'\u552e\u540e',\n};\nconst groupOrder = ['THEONE','\u76f4\u64ad','\u526a\u8f91\u53f7','\u9648\u5148\u751f','\u4ed3\u5e93','\u552e\u540e'];\n\nconst deptOrder = ['\u5b54\u654f\u6021','\u4f0d\u534e\u5f69','\u8d75\u59d7\u59d7','\u8d75\u4f73\u742a','\u83ab\u7fe0\u73b2','\u83ab\u78a7\u541b','\u9648\u5609\u4eea',\n  '\u90ed\u950b\u539f','\u9ec4\u4e1c\u4eae','\u4f0d\u5c1a\u5eb7','\u738b\u9756\u5141','\u6768\u6b23','\u5510\u607a','\u80e1\u53ef\u8d22','\u8bb8\u671d\u9633','\u5f20\u598d\u67d4',\n  '\u6797\u6c5d\u8363','\u9879\u67ef\u6865','\u9ec4\u9f99\u5149','\u8c22\u514b\u5353','\u6797\u5065\u6b22','\u9648\u5955\u53cb','\u6881\u68a6\u5a1c',\n  '\u8096\u714c','\u6881\u60f3\u8d24','\u6881\u82d1\u658c','\u4f55\u5747\u4f1f','\u9ec4\u626c\u660e','\u6797\u5e86\u971e','\u91d1\u4e3d\u6843','\u5e9e\u91d1\u8339','\u9648\u62db\u6c49','\u5e9e\u667a\u9e4f','\u8463\u91d1\u6e90','\u83ab\u667a\u96c4','\u6881\u542f\u51e1',\n  '\u6881\u4e3d\u4e91','\u80e1\u6d77\u4e91','\u9648\u4ef2\u7af9','\u5434\u7f8e'];\n\nconst bannerBgMap = {\n  'bg-lavender':'var(--s-banner-lavender)','bg-sage':'var(--s-banner-sage)','bg-sky':'var(--s-banner-sky)','bg-sand':'var(--s-banner-sand)',\n  'bg-lilac':'var(--s-banner-lilac)','bg-mint':'var(--s-banner-mint)','bg-stone':'var(--s-banner-stone)','bg-ice':'var(--s-banner-ice)'\n};\nconst bannerBorderMap = {\n  'bg-lavender':'var(--s-border-lavender)','bg-sage':'var(--s-border-sage)','bg-sky':'var(--s-border-sky)','bg-sand':'var(--s-border-sand)',\n  'bg-lilac':'var(--s-border-lilac)','bg-mint':'var(--s-border-mint)','bg-stone':'var(--s-border-stone)','bg-ice':'var(--s-border-ice)'\n};\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// MONTH SWITCHING\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_switchMonth(m) {\n  currentMonth = m;\n  currentFilter = 'all';\n  sp_renderMonthNav();\n  sp_renderKPI();\n  sp_renderSummary();\n  sp_renderCards('all');\n  // reset filter tabs\n  document.querySelectorAll('.tab').forEach((t,i) => {\n    t.classList.toggle('active', i===0);\n  });\n}\n\nfunction sp_renderMonthNav() {\n  const nav = document.getElementById('sp-month-nav');\n  nav.innerHTML = '';\n  const calBtn = document.createElement('button');\n  calBtn.className = 'month-chip';\n  calBtn.style.cssText = 'background:var(--s-fg);color:var(--s-bg);padding:7px 14px;font-size:16px;';\n  calBtn.textContent = '\ud83d\udcc5';\n  calBtn.onclick = sp_openCalendar;\n  nav.appendChild(calBtn);\n\n  AVAILABLE_MONTHS.forEach(m => {\n    const btn = document.createElement('button');\n    btn.className = 'month-chip' + (m === currentMonth ? ' active' : '');\n    btn.textContent = m + '\u6708';\n    btn.onclick = () => sp_switchMonth(m);\n    nav.appendChild(btn);\n  });\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// KPI ROW\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_renderKPI() {\n  const meta = monthMeta[currentMonth];\n  const prev = meta.prevTotal;\n  const curr = meta.total;\n  const diff = prev != null ? curr - prev : null;\n  const pct  = prev != null ? ((diff/prev)*100).toFixed(1) : null;\n  const isUp = diff != null && diff > 0;\n  const isDn = diff != null && diff < 0;\n  const accentColor = isUp ? 'var(--s-red)' : isDn ? 'var(--s-green)' : 'var(--s-blue2)';\n  const accentBg    = isUp ? 'var(--s-tint-red)' : isDn ? 'var(--s-tint-green)' : 'var(--s-tint-blue)';\n\n  let kpiHtml = '';\n  // Cell 1: prev month total (clickable)\n  if (prev != null) {\n    kpiHtml += `\n    <div class=\"kpi\" style=\"background:var(--s-kpi-prev-bg)\" onclick=\"sp_openCalendar()\">\n      <div class=\"kpi-label\" style=\"color:var(--s-kpi-prev-fg)\">\u4e0a\u6708\u603b\u989d</div>\n      <div class=\"kpi-val\" style=\"color:var(--s-kpi-prev-fg)\">\u00a5${prev.toLocaleString('zh-CN')}</div>\n      <div class=\"kpi-tap-hint\">\u67e5\u770b\u5168\u5e74 \u203a</div>\n    </div>`;\n  } else {\n    kpiHtml += `\n    <div class=\"kpi\" style=\"background:var(--s-bg3);opacity:0.6\" onclick=\"sp_openCalendar()\">\n      <div class=\"kpi-label\">\u4e0a\u6708\u603b\u989d</div>\n      <div class=\"kpi-val\" style=\"color:var(--s-fg4)\">\u2014</div>\n      <div class=\"kpi-tap-hint\">\u67e5\u770b\u5168\u5e74 \u203a</div>\n    </div>`;\n  }\n  // Cell 2: this month total (clickable)\n  kpiHtml += `\n    <div class=\"kpi\" style=\"background:${accentBg}\" onclick=\"sp_openCalendar()\">\n      <div class=\"kpi-label\" style=\"color:${accentColor}\">\u672c\u6708\u603b\u989d</div>\n      <div class=\"kpi-val\" style=\"color:${accentColor}\">\u00a5${curr.toLocaleString('zh-CN')}</div>\n      <div class=\"kpi-tap-hint\" style=\"color:${accentColor};\">\u67e5\u770b\u5168\u5e74 \u203a</div>\n    </div>`;\n  // Cell 3: MoM change or headcount\n  if (diff != null) {\n    const sign = diff>0?'+':diff<0?'':' ';\n    kpiHtml += `\n    <div class=\"kpi\" style=\"background:${accentBg}\">\n      <div class=\"kpi-label\" style=\"color:${accentColor}\">\u73af\u6bd4\u589e\u5e45</div>\n      <div style=\"font-size:13px;color:${accentColor};font-weight:600;margin-bottom:2px\">${diff>=0?'+':''}\u00a5${Math.abs(diff).toLocaleString('zh-CN')}</div>\n      <div class=\"kpi-val\" style=\"color:${accentColor}\">${diff>=0?'+':''}${pct}%</div>\n    </div>`;\n  } else {\n    kpiHtml += `\n    <div class=\"kpi\" style=\"background:#e8f2fb\">\n      <div class=\"kpi-label\" style=\"color:#5b9fd6\">\u4eba\u5458\u6570\u91cf</div>\n      <div class=\"kpi-val\" style=\"color:#5b9fd6\">${meta.people.length}\u4eba</div>\n    </div>`;\n  }\n  document.getElementById('sp-kpi-row').innerHTML = kpiHtml;\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// SUMMARY\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_renderSummary() {\n  const meta = monthMeta[currentMonth];\n  document.getElementById('sp-summary-title').textContent = meta.label + '\u6982\u51b5';\n  document.getElementById('sp-summary-text').innerHTML = meta.summary;\n  // pending footer\n  const fw = document.getElementById('sp-pending-footer-wrap');\n  fw.innerHTML = meta.pendingBody ? `\n    <div class=\"pending-footer\">\n      <div class=\"pending-footer-title\">${meta.pendingTitle}</div>\n      <div class=\"pending-footer-item\">${meta.pendingBody}</div>\n    </div>` : '';\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// CARDS\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_renderCards(filter) {\n  currentFilter = filter;\n  const people = monthMeta[currentMonth].people;\n  const container = document.getElementById('sp-grid-container');\n  container.innerHTML = '';\n  const typeFilters = ['up','dn','neu','warn'];\n  const isTypeFilter = typeFilters.includes(filter);\n  let list = [...people].sort((a,b)=>deptOrder.indexOf(a.name)-deptOrder.indexOf(b.name));\n  if(isTypeFilter){\n    list = list.filter(p=>p.type===filter);\n    const wrap = document.createElement('div');\n    wrap.style.padding = '0 16px';\n    const grid = document.createElement('div');\n    grid.className = 'grid';\n    list.forEach((p,i) => grid.appendChild(sp_makeCard(p,i,list)));\n    wrap.appendChild(grid);\n    container.appendChild(wrap);\n    return;\n  }\n  const groups = filter === 'all' ? groupOrder : [filter];\n  groups.forEach(grp => {\n    const grpList = list.filter(p=>deptGroup[p.dept]===grp);\n    if(!grpList.length) return;\n    const grpMay = grpList.reduce((s,p)=>s+p.may,0);\n    const grpApr = grpList.reduce((s,p)=>s+p.apr,0);\n    const hasGrpApr = grpApr > 0;\n    const grpDiff = hasGrpApr ? grpMay - grpApr : null;\n    const grpPct = hasGrpApr && grpApr>0 ? ((grpDiff/grpApr)*100).toFixed(1) : null;\n    const grpBg = deptBg[grpList[0]?.dept] || '';\n    const bannerBg = bannerBgMap[grpBg] || 'var(--s-bg3)';\n    const bannerBorder = bannerBorderMap[grpBg] || '#c7c7cc';\n    const diffColor = grpDiff==null ? 'var(--s-blue2)' : grpDiff>0?'var(--s-red)':grpDiff<0?'var(--s-green)':'var(--s-blue2)';\n    const aprColor = 'var(--s-blue2)';\n    const wrap = document.createElement('div');\n    wrap.className = 'group-wrap';\n    const hdr = document.createElement('div');\n    hdr.className = 'group-tab';\n    hdr.style.cssText = `background:${bannerBg};border-left:1px solid ${bannerBorder};border-right:1px solid ${bannerBorder};border-top:1px solid ${bannerBorder};`;\n    const aprTxt = hasGrpApr ? `<span style=\"color:${aprColor}\"><span class=\"group-banner-label\">\u4e0a\u6708 </span>\u00a5${grpApr.toLocaleString('zh-CN')}</span><span class=\"group-banner-arrow\" style=\"margin:0 4px\">\u2192</span>` : '';\n    const pctTxt = hasGrpApr && grpPct!=null ? `<span class=\"group-banner-diff\" style=\"color:${diffColor}\">(${grpDiff>=0?'+':''}${grpPct}%)</span>` : '';\n    hdr.innerHTML = `\n      <div class=\"group-banner-name\">${groupLabels[grp]||grp}</div>\n      <div class=\"group-banner-right\">\n        ${aprTxt}\n        <span style=\"color:${diffColor}\"><span class=\"group-banner-label\">\u672c\u6708 </span>\u00a5${grpMay.toLocaleString('zh-CN')}</span>\n        ${pctTxt}\n      </div>`;\n    const body = document.createElement('div');\n    body.className = 'group-body';\n    body.style.cssText = `background:${bannerBg};border-left:1px solid ${bannerBorder};border-right:1px solid ${bannerBorder};border-bottom:1px solid ${bannerBorder};`;\n    const sep = document.createElement('div');\n    sep.style.cssText = `height:1px;background:${bannerBorder};margin-bottom:10px;`;\n    body.appendChild(sep);\n    const grid = document.createElement('div');\n    grid.className = 'grid';\n    grpList.forEach((p,i) => grid.appendChild(sp_makeCard(p,i,grpList)));\n    body.appendChild(grid);\n    wrap.appendChild(hdr);\n    wrap.appendChild(body);\n    container.appendChild(wrap);\n  });\n}\n\nfunction sp_makeCard(p,i,list){\n  const hasApr = p.apr > 0;\n  const diff = hasApr ? p.may - p.apr : null;\n  const sign = diff!=null ? (diff>0?'+':diff<0?'-':'') : '';\n  const diffClass = diff==null ? 'diff-neu' : diff>0?'diff-up':diff<0?'diff-dn':'diff-neu';\n  const diffDisplay = diff==null ? '\u2014' : diff===0 ? '\u2014' : `${sign}${sp_fmt(diff)}`;\n  const mayClass = diff==null ? 'may-neu' : diff>0?'may-up':diff<0?'may-dn':'may-neu';\n  const warnDot = p.type==='warn'?'<span class=\"warn-dot\"></span>':'';\n  const bgClass = deptBg[p.dept]||'';\n  const aprLine = hasApr ? `<div class=\"card-apr\">\u4e0a\u6708 \u00a5${sp_fmt(p.apr)}</div>` : '';\n  const card = document.createElement('div');\n  card.className = `card ${bgClass}`;\n  card.innerHTML = `\n    <div class=\"card-top\">\n      <div>\n        <div class=\"card-name\">${p.name}${warnDot}</div>\n        <div class=\"card-dept-label\">${p.dept}</div>\n      </div>\n      <div class=\"card-right\">\n        <div class=\"card-may ${mayClass}\">\u00a5${sp_fmt(p.may)}</div>\n        <div class=\"${diffClass}\">${diffDisplay}</div>\n        ${aprLine}\n      </div>\n    </div>\n    <div class=\"card-reason\">${p.reason}</div>`;\n  card.addEventListener('click',()=>{\n    card.classList.add('tapped');\n    setTimeout(()=>card.classList.remove('tapped'),320);\n    setTimeout(()=>sp_openSheet(i,list),80);\n  });\n  return card;\n}\n\nfunction sp_filterCards(f,el){\n  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));\n  el.classList.add('active');\n  sp_renderCards(f);\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// PERSON DETAIL SHEET\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction sp_openSheet(idx,list){\n  const p = list[idx];\n  const hasApr = p.apr > 0;\n  const diff = hasApr ? p.may - p.apr : null;\n  const bgClass = deptBg[p.dept]||'';\n  const sheet = document.getElementById('sp-sheet');\n  sheet.className = `sheet ${bgClass}`;\n  document.getElementById('sp-d-name').textContent = p.name;\n\n  // When no prev data: this-month cell is neutral blue, no tint on prev cell\n  const mayBg    = diff==null ? 'var(--s-tint-blue)' : diff>0?'var(--s-tint-red)':diff<0?'var(--s-tint-green)':'var(--s-tint-blue)';\n  const mayColor = diff==null ? 'var(--s-blue2)'     : diff>0?'var(--s-red)':diff<0?'var(--s-green)':'var(--s-blue2)';\n  const pctVal   = hasApr ? ((diff/p.apr)*100).toFixed(1) : null;\n  const aprDisplay = hasApr ? `\u00a5${sp_fmt(p.apr)}` : '\u2014';\n\n  document.getElementById('sp-d-compare').innerHTML = `\n    <div class=\"sheet-kpi-row\">\n      <div class=\"sheet-kpi\" style=\"background:var(--s-kpi-prev-bg)\">\n        <div class=\"sheet-kpi-label\" style=\"color:var(--s-kpi-prev-fg)\">\u4e0a\u6708\u5b9e\u53d1</div>\n        <div class=\"sheet-kpi-val\" style=\"color:var(--s-kpi-prev-fg)\">${aprDisplay}</div>\n      </div>\n      <div class=\"sheet-kpi\" style=\"background:${mayBg}\">\n        <div class=\"sheet-kpi-label\" style=\"color:${mayColor}\">\u672c\u6708\u5b9e\u53d1</div>\n        <div class=\"sheet-kpi-val\" style=\"color:${mayColor}\">\u00a5${sp_fmt(p.may)}</div>\n      </div>\n      <div class=\"sheet-kpi\" style=\"background:var(--s-bg3)\">\n        <div class=\"sheet-kpi-label\" style=\"color:var(--s-fg4)\">\u73af\u6bd4</div>\n        <div class=\"sheet-kpi-sub\" style=\"color:var(--s-fg4)\">${hasApr?(diff>=0?'+':'')+`\u00a5${Math.abs(diff).toLocaleString('zh-CN')}`:'\u2014'}</div>\n        <div class=\"sheet-kpi-val\" style=\"color:var(--s-fg4)\">${hasApr?(diff>=0?'+':'')+Math.abs(pctVal)+'%':'\u2014'}</div>\n      </div>\n    </div>`;\n\n  document.getElementById('sp-d-diff').style.display='none';\n  document.getElementById('sp-d-reason').textContent = p.reason;\n  document.getElementById('sp-d-pending').innerHTML = p.pending?`<div class=\"pending-box\">${p.pending}</div>`:'';\n  const fmtRmb = v => v===0?'\u2014':(v<0?`-\u00a5${sp_fmt(v)}`:`\u00a5${sp_fmt(v)}`);\n  const activeBars = p.bars.filter(b=>!(b.may===0&&b.apr===0));\n  let rows='';\n  activeBars.forEach(b=>{\n    // If no prev data at all for this month, just show this month value, no comparison\n    if(!hasApr){\n      const md = fmtRmb(b.may);\n      rows+=`<div class=\"numrow\">\n        <div class=\"numrow-name\">${b.n}</div>\n        <div class=\"numrow-apr\" style=\"color:var(--s-fg4)\">\u2014</div>\n        <div class=\"numrow-arrow\">\u2192</div>\n        <div class=\"numrow-may neu\">${md}</div>\n        <div class=\"numrow-tag neu\">\u2014</div>\n      </div>`;\n      return;\n    }\n    const isNeg = b.apr<0;\n    const same = b.may===b.apr;\n    let mc,tc,tt;\n    if(same){mc='neu';tc='neu';tt='\u6301\u5e73';}\n    else if(b.may>b.apr){mc='up';tc='up';tt=`+\u00a5${(b.may-b.apr).toLocaleString('zh-CN')}`;}\n    else{mc=isNeg?'neg':'dn';tc=isNeg?'neg':'dn';tt=isNeg?`\u00a5${Math.abs(b.may).toLocaleString('zh-CN')}`:'-\u00a5'+(b.apr-b.may).toLocaleString('zh-CN');}\n    const ad=fmtRmb(b.apr), md=b.may===0?'\u2014':fmtRmb(b.may);\n    const arrow=!same&&b.may!==0?'\u2192':'=';\n    rows+=`<div class=\"numrow\"><div class=\"numrow-name\">${b.n}</div><div class=\"numrow-apr\">${ad}</div><div class=\"numrow-arrow\">${arrow}</div><div class=\"numrow-may ${mc}\">${md}</div><div class=\"numrow-tag ${tc}\">${tt}</div></div>`;\n  });\n  document.getElementById('sp-d-chart').innerHTML=rows;\n  document.getElementById('sp-overlay').classList.add('show');\n  document.body.style.overflow='hidden';\n}\nfunction sp_closeSheet(e){\n  if(e&&e.target!==document.getElementById('sp-overlay'))return;\n  document.getElementById('sp-overlay').classList.remove('show');\n  document.body.style.overflow='';\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// YEAR CALENDAR\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nconst MONTH_NAMES = ['1\u6708','2\u6708','3\u6708','4\u6708','5\u6708','6\u6708','7\u6708','8\u6708','9\u6708','10\u6708','11\u6708','12\u6708'];\nconst calColors = [\n  {bg:'var(--s-tint-blue)',   color:'var(--s-blue2)'},\n  {bg:'var(--s-tint-red)',    color:'var(--s-red)'},\n  {bg:'var(--s-tint-green)',  color:'var(--s-green)'},\n  {bg:'var(--s-tint-orange)', color:'var(--s-orange)'},\n  {bg:'var(--s-dept-lavender)', color:'var(--s-blue2)'},\n  {bg:'var(--s-dept-mint)',   color:'var(--s-green)'},\n];\n\nfunction sp_openCalendar(){\n  const grid = document.getElementById('sp-cal-grid');\n  grid.innerHTML='';\n  let colorIdx=0;\n  for(let m=1;m<=12;m++){\n    const cell = document.createElement('div');\n    const meta = monthMeta[m];\n    if(!meta){\n      cell.className='cal-cell empty';\n      cell.innerHTML=`<div class=\"cal-month-name\" style=\"color:#aeaeb2\">${MONTH_NAMES[m-1]}</div><div class=\"cal-empty-label\">\u6682\u65e0\u6570\u636e</div>`;\n    } else {\n      const palette = calColors[colorIdx % calColors.length];\n      colorIdx++;\n      const prev = meta.prevTotal;\n      const curr = meta.total;\n      const diff = prev!=null ? curr-prev : null;\n      const pct  = diff!=null && prev>0 ? ((diff/prev)*100).toFixed(1) : null;\n      const isActive = m===currentMonth;\n      cell.className = `cal-cell has-data${isActive?' active-month':''}`;\n      cell.style.background = palette.bg;\n      let diffHtml='';\n      if(diff!=null){\n        const c=diff>0?'var(--s-red)':diff<0?'var(--s-green)':'var(--s-fg4)';\n        diffHtml=`<div class=\"cal-diff\" style=\"color:${c}\">${diff>=0?'+':''}${pct}%</div>`;\n      }\n      cell.innerHTML=`\n        ${isActive?'<div class=\"cal-dot\"></div>':''}\n        <div class=\"cal-month-name\" style=\"color:${palette.color}\">${MONTH_NAMES[m-1]}</div>\n        <div class=\"cal-total\" style=\"color:${palette.color}\">\u00a5${Math.round(curr/1000)}k</div>\n        ${diffHtml}`;\n      cell.onclick=()=>{ sp_closeCalendar(); sp_switchMonth(m); };\n    }\n    grid.appendChild(cell);\n  }\n  document.getElementById('sp-cal-overlay').classList.add('show');\n  document.body.style.overflow='hidden';\n}\nfunction sp_closeCalendar(){\n  document.getElementById('sp-cal-overlay').classList.remove('show');\n  document.body.style.overflow='';\n}\nfunction sp_calOverlayClick(e){\n  if(e.target===document.getElementById('sp-cal-overlay')) sp_closeCalendar();\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// INIT\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nsp_renderMonthNav();\nsp_renderKPI();\nsp_renderSummary();\nsp_renderCards('all');\n\nwindow.sp_fmt = sp_fmt;\nwindow.sp_switchMonth = sp_switchMonth;\nwindow.sp_renderMonthNav = sp_renderMonthNav;\nwindow.sp_renderKPI = sp_renderKPI;\nwindow.sp_renderSummary = sp_renderSummary;\nwindow.sp_renderCards = sp_renderCards;\nwindow.sp_makeCard = sp_makeCard;\nwindow.sp_filterCards = sp_filterCards;\nwindow.sp_openSheet = sp_openSheet;\nwindow.sp_closeSheet = sp_closeSheet;\nwindow.sp_openCalendar = sp_openCalendar;\nwindow.sp_closeCalendar = sp_closeCalendar;\nwindow.sp_calOverlayClick = sp_calOverlayClick;";
    document.getElementById('salary-page').appendChild(sc);
  },

  closeSalary() {
    const page = document.getElementById('salary-page');
    if (page) page.style.display = 'none';
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.style.display = '';
  },


  async manageSalaryAccess() {
    showSheet('salary-access-overlay');
    const list = document.getElementById('salary-access-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/users');
      list.innerHTML = d.users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:0.5px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px">
            ${getAvatarHtml(u, 36, '50%')}
            <div>
              <div style="font-size:15px;font-weight:600;color:var(--text)">${escHtml(u.name)}</div>
              <div style="font-size:12px;color:var(--text3)">${roleLabel(u.role)}</div>
            </div>
          </div>
          <button id="salary-btn-${u.id}" onclick="My.toggleSalaryAccess(${u.id})"
            style="padding:6px 14px;border-radius:20px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;${u.salary_access ? 'background:#34c759;color:#fff' : 'background:var(--bg2);color:var(--text3)'}">
            ${u.salary_access ? '已开启' : '未开启'}
          </button>
        </div>`).join('');
    } catch(e) {
      list.innerHTML = '<div style="color:var(--text3);padding:16px 0">加载失败</div>';
    }
  },

  closeSalaryAccess() {
    hideSheet('salary-access-overlay');
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
