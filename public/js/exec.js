'use strict';

const Exec = {
  async init() {
    await this.loadAll();
    this.render();
  },

  async loadAll() {
    try {
      const [mine, all, contents] = await Promise.all([
        API.get('/api/tasks?mine=1'),
        API.get('/api/tasks'),
        API.get('/api/contents'),
      ]);
      State.myTasks = mine.tasks;
      State.allTasks = all.tasks;
      State.contents = contents.contents;
    } catch {}
  },

  render() {
    const el = document.getElementById('battlefield');
    if (!el) return;

    // 团队任务按商品分组
    const teamTasks = (State.allTasks || []).filter(t => t.status !== 'done');
    const byProduct = {};
    const noProduct = [];
    for (const t of teamTasks) {
      if (t.product_id) {
        const key = t.product_id;
        if (!byProduct[key]) byProduct[key] = { name: t.product_name, sku: t.product_sku, tasks: [] };
        byProduct[key].tasks.push(t);
      } else {
        noProduct.push(t);
      }
    }

    const myTodo = (State.myTasks || []).filter(t => t.status !== 'done');
    const myDone = (State.myTasks || []).filter(t => t.status === 'done');

    el.innerHTML = `
      ${this.section('我的任务', 'my-task',
        myTodo.map(t => this.taskCard(t, true)).join('') +
        (myDone.length ? `<div style="padding:8px 16px;font-size:var(--font-xs);color:var(--text3)">已完成 ${myDone.length} 项</div>` +
          myDone.map(t => this.taskCard(t, true)).join('') : '') +
        (!myTodo.length && !myDone.length ? this.emptyRow('还没有任务') : '')
      )}

      ${this.section('参考视频', 'content',
        (State.contents || []).map(c => this.contentCard(c)).join('') ||
        this.emptyRow('还没有参考视频')
      )}

      ${this.section('团队任务', 'team-task',
        Object.values(byProduct).map(g => this.productGroup(g)).join('') +
        noProduct.map(t => this.taskCard(t, false)).join('') +
        (!teamTasks.length ? this.emptyRow('暂无团队任务') : '')
      )}

      <div style="height:24px"></div>
    `;
  },

  section(label, type, body) {
    return `<div class="battle-section">
      <div class="battle-header">
        <span class="battle-label">${label}</span>
        <button class="battle-add-btn" onclick="Exec.showAdd('${type}')">＋ 新建</button>
      </div>
      ${body}
    </div>`;
  },

  emptyRow(text) {
    return `<div style="background:var(--card);padding:16px;border-bottom:0.5px solid var(--border);font-size:var(--font-sm);color:var(--text3);text-align:center">${text}</div>`;
  },

  taskCard(t, showToggle) {
    const isDone = t.status === 'done';
    return `<div class="task-item" onclick="Exec.openTask(${t.id})">
      ${showToggle ? `<div class="task-check ${isDone?'done':''}" onclick="event.stopPropagation();Exec.toggleTask(${t.id})">
        ${isDone ? '<svg viewBox="0 0 12 10" width="12" height="10"><polyline points="1,5 4,8 11,1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : ''}
      </div>` : `<div style="width:8px;height:8px;border-radius:50%;background:${isDone?'var(--green)':'var(--border2)'};flex-shrink:0;margin-top:6px"></div>`}
      <div class="task-body">
        <div class="task-title ${isDone?'done':''}">${escHtml(t.title)}</div>
        <div class="task-meta">
          <span>${t.assignee_name || '未指派'}</span>
          ${t.product_name && !showToggle ? '' : (t.product_name ? `<span>${escHtml(t.product_name)}</span>` : '')}
        </div>
      </div>
      <span class="status-badge status-${t.status==='todo'?'todo':t.status==='doing'?'doing':'done'}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
    </div>`;
  },

  productGroup(g) {
    const doing = g.tasks.filter(t => t.status === 'doing').length;
    return `<div style="background:var(--card);border-bottom:0.5px solid var(--border)">
      <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid var(--border)">
        <div>
          <div style="font-size:var(--font-base);font-weight:600;color:var(--text)">${escHtml(g.name)}</div>
          <div style="font-size:var(--font-xs);color:var(--text3);margin-top:2px">${g.sku} · 共${g.tasks.length}个任务${doing?'，'+doing+'个进行中':''}</div>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text3)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      ${g.tasks.map(t => this.taskCard(t, false)).join('')}
    </div>`;
  },

  contentCard(c) {
    return `<div class="content-card" onclick="Exec.openContent(${c.id})">
      <div class="content-thumb">${c.screenshot_url?`<img src="${c.screenshot_url}">`:'🎬'}</div>
      <div class="content-info">
        <div class="content-title">${escHtml(c.title||'未命名')}</div>
        <div class="content-meta">
          <span>${c.owner_name}</span>
          ${c.douyin_url ? `<a href="${c.douyin_url}" target="_blank" onclick="event.stopPropagation()" style="color:var(--green);font-size:var(--font-xs)">查看视频</a>` : ''}
        </div>
      </div>
    </div>`;
  },

  showAdd(type) {
    if (type === 'my-task') {
      // Wo任务
      Chat.showWoTask();
    } else if (type === 'team-task') {
      Chat.showTaTask();
    } else if (type === 'content') {
      this.showAddContent();
    }
  },

  showAddContent() {
    document.getElementById('content-id').value = '';
    document.getElementById('content-title-input').value = '';
    document.getElementById('content-url').value = '';
    document.getElementById('content-note').value = '';
    showSheet('content-overlay');
  },

  async openContent(id) {
    try {
      const d = await API.get('/api/contents/' + id);
      const c = d.content;
      document.getElementById('content-id').value = id;
      document.getElementById('content-title-input').value = c.title || '';
      document.getElementById('content-url').value = c.douyin_url || '';
      document.getElementById('content-note').value = c.boom_analysis || c.why_research || c.exec_plan || '';
      showSheet('content-overlay');
    } catch(e) { toast(e.message); }
  },

  async saveContent() {
    const id = document.getElementById('content-id').value;
    const title = document.getElementById('content-title-input').value.trim();
    const douyin_url = document.getElementById('content-url').value.trim();
    const note = document.getElementById('content-note').value.trim();
    if (!title && !douyin_url) { toast('请填写标题或链接'); return; }
    const body = { title: title || '参考视频', douyin_url, boom_analysis: note };
    try {
      if (id) { await API.put('/api/contents/' + id, body); }
      else { await API.post('/api/contents', body); }
      hideSheet('content-overlay');
      const d = await API.get('/api/contents');
      State.contents = d.contents;
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  async openTask(id) {
    const task = [...(State.myTasks||[]), ...(State.allTasks||[])].find(t => t.id === id);
    if (!task) return;
    document.getElementById('task-edit-id').value = id;
    document.getElementById('task-edit-title').value = task.title;
    document.getElementById('task-edit-status').value = task.status;
    showSheet('task-edit-overlay');
    API.get('/api/users').then(d => {
      document.getElementById('task-edit-assignee').innerHTML =
        d.users.map(u => `<option value="${u.id}" ${u.id===task.assignee_id?'selected':''}>${u.name}</option>`).join('');
    });
  },

  async saveTaskEdit() {
    const id = document.getElementById('task-edit-id').value;
    const title = document.getElementById('task-edit-title').value.trim();
    const status = document.getElementById('task-edit-status').value;
    const assignee_id = document.getElementById('task-edit-assignee').value;
    if (!title) { toast('请填写标题'); return; }
    try {
      await API.put('/api/tasks/' + id, { title, status, assignee_id });
      hideSheet('task-edit-overlay');
      // 任务完成 → 弹复盘
      if (status === 'done') {
        setTimeout(() => {
          document.getElementById('review-task-id').value = id;
          document.getElementById('review-did').value = '';
          document.getElementById('review-result').value = '';
          document.getElementById('review-next').value = '';
          showSheet('review-overlay');
        }, 400);
      }
      await this.loadAll();
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  async toggleTask(id) {
    const task = (State.myTasks || []).find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await API.put('/api/tasks/' + id, { status: newStatus });
      await this.loadAll();
      this.render();
      if (newStatus === 'done') {
        toast('✅ 完成 +10 EXP');
        setTimeout(() => {
          document.getElementById('review-task-id').value = id;
          document.getElementById('review-did').value = '';
          document.getElementById('review-result').value = '';
          document.getElementById('review-next').value = '';
          showSheet('review-overlay');
        }, 600);
      }
    } catch(e) { toast(e.message); }
  },

  async saveReview() {
    const taskId = document.getElementById('review-task-id').value;
    const did = document.getElementById('review-did').value.trim();
    const result = document.getElementById('review-result').value.trim();
    const next = document.getElementById('review-next').value.trim();
    if (!did) { toast('请填写做了什么'); return; }
    const content = `做了：${did}\n结果：${result}\n下次：${next}`;
    try {
      const d = await API.post('/api/experiences', {
        title: new Date().toLocaleDateString('zh-CN') + ' 复盘',
        content,
        product_id: taskId ? (State.allTasks||[]).find(t=>t.id==taskId)?.product_id : undefined,
      });
      hideSheet('review-overlay');
      toast('✅ 复盘完成 +30 EXP');
      // 提示加入经验库
      setTimeout(() => {
        if (window.confirm('已保存到经验库，查看吗？')) {
          switchTab('my');
        }
      }, 500);
    } catch(e) { toast(e.message); }
  },
};

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
