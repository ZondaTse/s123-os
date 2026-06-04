'use strict';

const Exec = {
  tab: 'tasks', // tasks | plans | content

  async init() {
    await this.loadAll();
    this.bindFab();
  },

  async loadAll() {
    await Promise.all([this.loadTasks(), this.loadPlans()]);
    this.render();
  },

  async loadTasks() {
    try {
      const d = await API.get('/api/tasks?date=today');
      State.tasks = d.tasks;
    } catch {}
  },

  async loadPlans() {
    try {
      const d = await API.get('/api/plans?date=today');
      State.plans = d.plans;
    } catch {}
  },

  render() {
    this.renderHeader();
    if (this.tab === 'tasks') this.renderTasks();
    else if (this.tab === 'plans') this.renderPlans();
    else this.renderContents();
  },

  renderHeader() {
    // update segment
    document.querySelectorAll('#exec-seg .seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === this.tab);
    });
    // show/hide FAB
    const fab = document.getElementById('exec-fab');
    if (fab) fab.style.display = 'flex';
  },

  renderTasks() {
    const el = document.getElementById('exec-content');
    if (!el) return;
    const todo = State.tasks.filter(t => t.status !== 'done');
    const done = State.tasks.filter(t => t.status === 'done');
    const gmvTarget = State.gmv?.target_daily || 8333;
    const gmvActual = State.gmv?.gmv || 0;
    const pct = Math.round(gmvActual / gmvTarget * 100);

    let html = `
      <div style="background:var(--bg2);padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px">
        <div style="flex-shrink:0">${donutSVG(pct, 60, 6)}</div>
        <div style="flex:1">
          <div style="font-size:26px;font-weight:700;color:var(--green)">${pct}%</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">今日GMV目标完成率</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text3)">目标</div>
          <div style="font-size:17px;font-weight:600;color:var(--text)">${fmtMoney(gmvTarget)}</div>
          <div style="font-size:14px;color:var(--green);font-weight:600">${fmtMoney(gmvActual)}</div>
        </div>
      </div>
    `;

    if (!State.tasks.length) {
      html += `<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">今天没有任务</div><div class="empty-sub">点 + 创建第一个</div></div>`;
    } else {
      html += `<div class="list-header">待完成 (${todo.length})</div>`;
      html += todo.map(t => this.taskItem(t)).join('') || '<div class="loading" style="padding:8px 16px;font-size:13px;color:var(--text3)">全部完成了 🎉</div>';
      if (done.length) {
        html += `<div class="list-header" style="margin-top:8px">已完成 (${done.length})</div>`;
        html += done.map(t => this.taskItem(t)).join('');
      }
    }
    el.innerHTML = html;
  },

  taskItem(t) {
    const isDone = t.status === 'done';
    const sourceClass = t.source === 'message' ? 'msg' : '';
    const sourceLabel = t.source === 'message' ? '来自消息' : '手动创建';
    return `<div class="task-item" onclick="Exec.openTask(${t.id})">
      <div class="task-check ${isDone ? 'done' : ''}" onclick="event.stopPropagation();Exec.toggleTask(${t.id})">
        ${isDone ? '✓' : ''}
      </div>
      <div class="task-body">
        <div class="task-title ${isDone ? 'done' : ''}">${escHtml(t.title)}</div>
        <div class="task-meta">
          <span>${t.assignee_name || '未指派'}</span>
          ${t.due_date ? '<span>截止 ' + t.due_date + '</span>' : ''}
          <span class="task-source ${sourceClass}">${sourceLabel}</span>
        </div>
      </div>
      <span class="status-badge status-${t.status}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
    </div>`;
  },

  renderPlans() {
    const el = document.getElementById('exec-content');
    if (!el) return;
    const types = [
      { key: 'shooting', label: '拍摄计划', icon: '📸' },
      { key: 'live',     label: '直播计划', icon: '🎬' },
      { key: 'product',  label: '商品计划', icon: '🛍' },
    ];
    let html = '';
    for (const { key, label, icon } of types) {
      const items = State.plans.filter(p => p.type === key);
      html += `<div class="list-header">${icon} ${label} (${items.length})</div>`;
      if (!items.length) {
        html += `<div style="padding:10px 16px;font-size:13px;color:var(--text3)">暂无计划，点 + 添加</div>`;
      } else {
        html += items.map(p => `<div class="list-item" onclick="Exec.openPlan(${p.id})">
          <div class="list-item-body">
            <div class="list-item-title">${escHtml(p.title)}</div>
            <div class="list-item-sub">${p.product_name ? p.product_name : ''}${p.description ? ' · ' + p.description.slice(0,30) : ''}</div>
          </div>
          <span class="status-badge status-${p.status}">${p.status==='pending'?'待执行':p.status==='doing'?'进行中':'完成'}</span>
        </div>`).join('');
      }
    }
    el.innerHTML = html;
  },

  async renderContents() {
    const el = document.getElementById('exec-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
    try {
      const d = await API.get('/api/contents');
      State.contents = d.contents;
      if (!State.contents.length) {
        el.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">还没有素材研究</div><div class="empty-sub">点 + 添加第一条</div></div>`;
        return;
      }
      el.innerHTML = State.contents.map(c => `<div class="content-card" onclick="Exec.openContent(${c.id})">
        <div class="content-thumb">
          ${c.screenshot_url ? `<img src="${c.screenshot_url}" alt="">` : '🎬'}
        </div>
        <div class="content-info">
          <div class="content-title">${escHtml(c.title || '未命名')}</div>
          <div class="content-meta">
            <span>${c.owner_name}</span>
            <span class="status-badge status-${c.status==='researching'?'todo':c.status==='executing'?'doing':'done'}" style="font-size:11px;padding:1px 6px">
              ${c.status==='researching'?'研究中':c.status==='executing'?'执行中':'已完成'}
            </span>
            ${c.products?.length ? `<span>关联 ${c.products.length} 个商品</span>` : ''}
          </div>
        </div>
      </div>`).join('');
    } catch {}
  },

  bindFab() {
    document.getElementById('exec-fab')?.addEventListener('click', () => {
      if (this.tab === 'tasks') this.showAddTask();
      else if (this.tab === 'plans') this.showAddPlan();
      else this.showAddContent();
    });
    document.querySelectorAll('#exec-seg .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        this.tab = b.dataset.tab;
        this.render();
      });
    });
  },

  async toggleTask(id) {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const d = await API.put('/api/tasks/' + id, { status: newStatus });
      Object.assign(task, d.task);
      this.renderTasks();
      if (newStatus === 'done') toast('✅ 任务完成 +10 EXP');
    } catch(e) { toast(e.message); }
  },

  showAddTask() {
    document.getElementById('task-sheet-title').textContent = '新建任务';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-assignee').value = State.user.id;
    document.getElementById('task-due').value = '';
    showSheet('task-overlay');
    // load users for assignee
    API.get('/api/users').then(d => {
      const sel = document.getElementById('task-assignee');
      sel.innerHTML = d.users.map(u => `<option value="${u.id}" ${u.id===State.user.id?'selected':''}>${u.name}</option>`).join('');
    });
    // load products
    API.get('/api/products').then(d => {
      const sel = document.getElementById('task-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
  },

  async saveTask() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const assignee_id = document.getElementById('task-assignee').value;
    const product_id = document.getElementById('task-product').value;
    const due_date = document.getElementById('task-due').value;
    if (!title) { toast('请填写任务标题'); return; }
    try {
      if (id) {
        const d = await API.put('/api/tasks/' + id, { title, assignee_id, product_id: product_id||undefined, due_date: due_date||undefined });
        const idx = State.tasks.findIndex(t => t.id === Number(id));
        if (idx >= 0) State.tasks[idx] = d.task;
      } else {
        const d = await API.post('/api/tasks', { title, assignee_id, product_id: product_id||undefined, due_date: due_date||undefined });
        State.tasks.unshift(d.task);
      }
      hideSheet('task-overlay');
      this.renderTasks();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  openTask(id) {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('task-sheet-title').textContent = '编辑任务';
    document.getElementById('task-id').value = id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-due').value = task.due_date || '';
    showSheet('task-overlay');
    API.get('/api/users').then(d => {
      const sel = document.getElementById('task-assignee');
      sel.innerHTML = d.users.map(u => `<option value="${u.id}" ${u.id===task.assignee_id?'selected':''}>${u.name}</option>`).join('');
    });
    API.get('/api/products').then(d => {
      const sel = document.getElementById('task-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p => `<option value="${p.id}" ${p.id===task.product_id?'selected':''}>${p.sku} ${p.name}</option>`).join('');
    });
  },

  showAddPlan() {
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-title-input').value = '';
    document.getElementById('plan-type').value = 'shooting';
    document.getElementById('plan-desc').value = '';
    document.getElementById('plan-date').value = new Date().toISOString().slice(0,10);
    showSheet('plan-overlay');
    API.get('/api/products').then(d => {
      const sel = document.getElementById('plan-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p => `<option value="${p.id}">${p.sku} ${p.name}</option>`).join('');
    });
  },

  async savePlan() {
    const id = document.getElementById('plan-id').value;
    const title = document.getElementById('plan-title-input').value.trim();
    const type = document.getElementById('plan-type').value;
    const description = document.getElementById('plan-desc').value.trim();
    const product_id = document.getElementById('plan-product').value;
    const plan_date = document.getElementById('plan-date').value;
    if (!title) { toast('请填写标题'); return; }
    try {
      if (id) {
        await API.put('/api/plans/' + id, { title, description, product_id, plan_date });
      } else {
        const d = await API.post('/api/plans', { type, title, description, product_id, plan_date });
        State.plans.unshift(d.plan);
      }
      hideSheet('plan-overlay');
      await this.loadPlans();
      this.renderPlans();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  openPlan(id) {
    const plan = State.plans.find(p => p.id === id);
    if (!plan) return;
    document.getElementById('plan-id').value = id;
    document.getElementById('plan-title-input').value = plan.title;
    document.getElementById('plan-type').value = plan.type;
    document.getElementById('plan-desc').value = plan.description || '';
    document.getElementById('plan-date').value = plan.plan_date || '';
    showSheet('plan-overlay');
    API.get('/api/products').then(d => {
      const sel = document.getElementById('plan-product');
      sel.innerHTML = '<option value="">不关联商品</option>' + d.products.map(p => `<option value="${p.id}" ${p.id===plan.product_id?'selected':''}>${p.sku} ${p.name}</option>`).join('');
    });
  },

  showAddContent() {
    document.getElementById('content-id').value = '';
    document.getElementById('content-title-input').value = '';
    document.getElementById('content-url').value = '';
    document.getElementById('content-boom').value = '';
    document.getElementById('content-why').value = '';
    document.getElementById('content-plan').value = '';
    document.getElementById('content-result').value = '';
    document.getElementById('content-summary').value = '';
    showSheet('content-overlay');
    this.loadContentProducts('');
  },

  async openContent(id) {
    try {
      const d = await API.get('/api/contents/' + id);
      const c = d.content;
      document.getElementById('content-id').value = id;
      document.getElementById('content-title-input').value = c.title || '';
      document.getElementById('content-url').value = c.douyin_url || '';
      document.getElementById('content-boom').value = c.boom_analysis || '';
      document.getElementById('content-why').value = c.why_research || '';
      document.getElementById('content-plan').value = c.exec_plan || '';
      document.getElementById('content-result').value = c.exec_result || '';
      document.getElementById('content-summary').value = c.summary || '';
      showSheet('content-overlay');
      this.loadContentProducts(id, c.products);
    } catch(e) { toast(e.message); }
  },

  async loadContentProducts(contentId, linked = []) {
    try {
      const d = await API.get('/api/products');
      const linkedIds = linked.map(p => p.id);
      const el = document.getElementById('content-products');
      el.innerHTML = d.products.map(p => `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
        <input type="checkbox" value="${p.id}" ${linkedIds.includes(p.id)?'checked':''}>
        <span style="font-size:14px">${p.sku} ${p.name}</span>
      </label>`).join('');
    } catch {}
  },

  async saveContent() {
    const id = document.getElementById('content-id').value;
    const body = {
      title: document.getElementById('content-title-input').value.trim(),
      douyin_url: document.getElementById('content-url').value.trim(),
      boom_analysis: document.getElementById('content-boom').value.trim(),
      why_research: document.getElementById('content-why').value.trim(),
      exec_plan: document.getElementById('content-plan').value.trim(),
      exec_result: document.getElementById('content-result').value.trim(),
      summary: document.getElementById('content-summary').value.trim(),
    };
    const screenshotFile = document.getElementById('content-screenshot').files[0];

    try {
      let contentId = id;
      if (screenshotFile) {
        const fd = new FormData();
        Object.entries(body).forEach(([k,v]) => v && fd.append(k, v));
        screenshotFile && fd.append('screenshot', screenshotFile);
        const d = id
          ? await API.upload('/api/contents/' + id, fd)
          : await API.upload('/api/contents', fd);
        contentId = d.content.id;
      } else {
        if (id) {
          await API.put('/api/contents/' + id, body);
          contentId = id;
        } else {
          const d = await API.post('/api/contents', body);
          contentId = d.content.id;
        }
      }
      // sync product links
      const checked = [...document.querySelectorAll('#content-products input:checked')].map(i => i.value);
      for (const pid of checked) {
        await API.post('/api/contents/' + contentId + '/products', { product_id: pid }).catch(() => {});
      }
      hideSheet('content-overlay');
      await this.renderContents();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },
};

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
