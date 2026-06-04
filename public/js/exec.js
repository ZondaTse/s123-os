'use strict';

const Exec = {
  async init() {
    await this.loadAll();
    this.render();
  },

  async loadAll() {
    try {
      const [t, p] = await Promise.all([
        API.get('/api/tasks?date=today'),
        API.get('/api/plans?date=today'),
      ]);
      State.tasks = t.tasks;
      State.plans = p.plans;
    } catch {}
  },

  render() {
    const el = document.getElementById('battlefield');
    if (!el) return;

    const todo = State.tasks.filter(t => t.status !== 'done');
    const done = State.tasks.filter(t => t.status === 'done');
    const shooting = State.plans.filter(p => p.type === 'shooting');
    const live = State.plans.filter(p => p.type === 'live');
    const product = State.plans.filter(p => p.type === 'product');

    el.innerHTML = `
      ${this.sectionHtml('今日任务', todo.length + done.length, 'task',
        (todo.map(t => this.taskCard(t)).join('') || '') +
        (done.length ? done.map(t => this.taskCard(t)).join('') : '') +
        (!State.tasks.length ? this.emptyCard('✅','今天没有任务') : '')
      )}
      ${this.sectionHtml('拍摄计划', shooting.length, 'plan-shooting',
        shooting.map(p => this.planCard(p)).join('') ||
        this.emptyCard('📸','暂无拍摄计划')
      )}
      ${this.sectionHtml('直播计划', live.length, 'plan-live',
        live.map(p => this.planCard(p)).join('') ||
        this.emptyCard('🎬','暂无直播计划')
      )}
      ${this.sectionHtml('商品计划', product.length, 'plan-product',
        product.map(p => this.planCard(p)).join('') ||
        this.emptyCard('🛍','暂无商品计划')
      )}
      ${this.sectionHtml('素材研究', '', 'content',
        `<div id="content-area"><div class="loading" style="padding:20px"><div class="spinner"></div>加载中...</div></div>`
      )}
      ${this.sectionHtml('今日复盘', '', 'review',
        `<div style="background:var(--card);padding:16px;border-bottom:0.5px solid var(--border)">
          <p style="font-size:var(--font-sm);color:var(--text3);line-height:1.6">复盘是团队进步最快的方式。每天5分钟，记录今天做了什么、结果怎样、下次怎么优化。</p>
        </div>`
      )}
      <div style="height:24px"></div>
    `;

    this.loadContents();
  },

  sectionHtml(label, count, type, body) {
    const countStr = count !== '' ? `<span class="battle-count">${count} 项</span>` : '';
    return `
      <div class="battle-section">
        <div class="battle-header">
          <span class="battle-label">${label}</span>
          ${countStr}
          <button class="battle-add-btn" onclick="Exec.showAdd('${type}')">＋ 新建</button>
        </div>
        ${body}
      </div>
    `;
  },

  emptyCard(icon, text) {
    return `<div style="background:var(--card);padding:20px 16px;border-bottom:0.5px solid var(--border);text-align:center;color:var(--text3);font-size:var(--font-sm)">${icon} ${text}</div>`;
  },

  taskCard(t) {
    const isDone = t.status === 'done';
    return `<div class="task-item" onclick="Exec.openTask(${t.id})">
      <div class="task-check ${isDone?'done':''}" onclick="event.stopPropagation();Exec.toggleTask(${t.id})">
        ${isDone ? '<svg viewBox="0 0 12 10" width="12" height="10"><polyline points="1,5 4,8 11,1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : ''}
      </div>
      <div class="task-body">
        <div class="task-title ${isDone?'done':''}">${escHtml(t.title)}</div>
        <div class="task-meta">
          <span>${t.assignee_name || '未指派'}</span>
          ${t.due_date ? '<span>截止 '+t.due_date+'</span>' : ''}
          ${t.product_name ? '<span>'+escHtml(t.product_name)+'</span>' : ''}
        </div>
      </div>
      <span class="status-badge status-${t.status==='todo'?'todo':t.status==='doing'?'doing':'done'}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
    </div>`;
  },

  planCard(p) {
    return `<div class="list-item" onclick="Exec.openPlan(${p.id})">
      <div class="list-item-body">
        <div class="list-item-title">${escHtml(p.title)}</div>
        <div class="list-item-sub">${p.product_name||''}${p.plan_date?' · '+p.plan_date:''}</div>
      </div>
      <span class="status-badge status-${p.status==='pending'?'todo':p.status==='doing'?'doing':'done'}">${p.status==='pending'?'待执行':p.status==='doing'?'进行中':'完成'}</span>
    </div>`;
  },

  async loadContents() {
    try {
      const d = await API.get('/api/contents');
      State.contents = d.contents;
      const el = document.getElementById('content-area');
      if (!el) return;
      if (!d.contents.length) {
        el.innerHTML = this.emptyCard('🔍','还没有素材研究');
        return;
      }
      el.innerHTML = d.contents.map(c => `<div class="content-card" onclick="Exec.openContent(${c.id})">
        <div class="content-thumb">${c.screenshot_url?`<img src="${c.screenshot_url}">`:'🎬'}</div>
        <div class="content-info">
          <div class="content-title">${escHtml(c.title||'未命名')}</div>
          <div class="content-meta">
            <span>${c.owner_name}</span>
            <span class="status-badge status-${c.status==='researching'?'todo':c.status==='executing'?'doing':'done'}" style="font-size:11px;padding:1px 6px">${c.status==='researching'?'研究中':c.status==='executing'?'执行中':'已完成'}</span>
          </div>
        </div>
      </div>`).join('');
    } catch {}
  },

  showAdd(type) {
    if (type === 'task') this.showAddTask();
    else if (type.startsWith('plan')) this.showAddPlan(type.replace('plan-',''));
    else if (type === 'content') this.showAddContent();
    else if (type === 'review') showSheet('review-overlay');
  },

  showAddTask() {
    document.getElementById('task-sheet-title').textContent = '新建任务';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title-input').value = '';
    showSheet('task-overlay');
    API.get('/api/users').then(d => {
      const sel = document.getElementById('task-assignee');
      sel.innerHTML = d.users.map(u => `<option value="${u.id}" ${u.id===State.user.id?'selected':''}>${u.name}</option>`).join('');
    });
  },

  async saveTask() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const assignee_id = document.getElementById('task-assignee').value;
    if (!title) { toast('请填写任务标题'); return; }
    try {
      if (id) {
        const d = await API.put('/api/tasks/'+id, { title, assignee_id });
        const idx = State.tasks.findIndex(t => t.id === Number(id));
        if (idx >= 0) State.tasks[idx] = { ...State.tasks[idx], ...d.task };
      } else {
        const d = await API.post('/api/tasks', { title, assignee_id });
        State.tasks.unshift(d.task);
      }
      hideSheet('task-overlay');
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  openTask(id) {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('task-sheet-title').textContent = '编辑任务';
    document.getElementById('task-id').value = id;
    document.getElementById('task-title-input').value = task.title;
    showSheet('task-overlay');
    API.get('/api/users').then(d => {
      const sel = document.getElementById('task-assignee');
      sel.innerHTML = d.users.map(u => `<option value="${u.id}" ${u.id===task.assignee_id?'selected':''}>${u.name}</option>`).join('');
    });
  },

  async toggleTask(id) {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const d = await API.put('/api/tasks/'+id, { status: newStatus });
      Object.assign(task, d.task);
      this.render();
      if (newStatus === 'done') toast('✅ 完成 +10 EXP');
    } catch(e) { toast(e.message); }
  },

  showAddPlan(type) {
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-title-input').value = '';
    document.getElementById('plan-type').value = type || 'shooting';
    showSheet('plan-overlay');
  },

  async savePlan() {
    const id = document.getElementById('plan-id').value;
    const title = document.getElementById('plan-title-input').value.trim();
    const type = document.getElementById('plan-type').value;
    if (!title) { toast('请填写标题'); return; }
    try {
      if (id) {
        await API.put('/api/plans/'+id, { title, type });
      } else {
        const d = await API.post('/api/plans', { type, title, plan_date: new Date().toISOString().slice(0,10) });
        State.plans.unshift(d.plan);
      }
      hideSheet('plan-overlay');
      await this.loadAll();
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  openPlan(id) {
    const plan = State.plans.find(p => p.id === id);
    if (!plan) return;
    document.getElementById('plan-id').value = id;
    document.getElementById('plan-title-input').value = plan.title;
    document.getElementById('plan-type').value = plan.type;
    showSheet('plan-overlay');
  },

  showAddContent() {
    document.getElementById('content-id').value = '';
    document.getElementById('content-title-input').value = '';
    document.getElementById('content-url').value = '';
    showSheet('content-overlay');
  },

  async openContent(id) {
    try {
      const d = await API.get('/api/contents/'+id);
      const c = d.content;
      document.getElementById('content-id').value = id;
      document.getElementById('content-title-input').value = c.title || '';
      document.getElementById('content-url').value = c.douyin_url || '';
      showSheet('content-overlay');
    } catch(e) { toast(e.message); }
  },

  async saveContent() {
    const id = document.getElementById('content-id').value;
    const title = document.getElementById('content-title-input').value.trim();
    const douyin_url = document.getElementById('content-url').value.trim();
    if (!title) { toast('请填写标题'); return; }
    try {
      if (id) {
        await API.put('/api/contents/'+id, { title, douyin_url });
      } else {
        await API.post('/api/contents', { title, douyin_url });
      }
      hideSheet('content-overlay');
      await this.loadContents();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  async saveReview() {
    const did = document.getElementById('review-did').value.trim();
    const result = document.getElementById('review-result').value.trim();
    const next = document.getElementById('review-next').value.trim();
    if (!did) { toast('请填写今天做了什么'); return; }
    const content = `今天做了：${did}\n结果：${result}\n下次优化：${next}`;
    try {
      await API.post('/api/experiences', {
        title: new Date().toLocaleDateString('zh-CN') + ' 复盘',
        content,
      });
      hideSheet('review-overlay');
      document.getElementById('review-did').value = '';
      document.getElementById('review-result').value = '';
      document.getElementById('review-next').value = '';
      toast('✅ 复盘提交 +30 EXP');
    } catch(e) { toast(e.message); }
  },
};

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
