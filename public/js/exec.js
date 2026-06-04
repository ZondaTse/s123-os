'use strict';

const Exec = {
  async init() {
    await this.loadAll();
    this.render();
  },

  async loadAll() {
    try {
      const [mine, all, contents, gmvToday, gmvMonth] = await Promise.all([
        API.get('/api/tasks?mine=1'),
        API.get('/api/tasks'),
        API.get('/api/contents'),
        API.get('/api/gmv/today'),
        API.get('/api/gmv/monthly'),
      ]);
      State.myTasks = mine.tasks;
      State.allTasks = all.tasks;
      State.contents = contents.contents;
      State.gmv = gmvToday;
      State.monthly = gmvMonth;
    } catch {}
  },

  render() {
    const el = document.getElementById('battlefield');
    if (!el) return;

    const myTodo = (State.myTasks||[]).filter(t => t.status !== 'done');
    const myDone = (State.myTasks||[]).filter(t => t.status === 'done');
    const teamTasks = (State.allTasks||[]).filter(t => t.status !== 'done');

    // 按商品分组
    const byProduct = {};
    const noProduct = [];
    for (const t of teamTasks) {
      if (t.product_id) {
        if (!byProduct[t.product_id]) byProduct[t.product_id] = { name:t.product_name, sku:t.product_sku, tasks:[] };
        byProduct[t.product_id].tasks.push(t);
      } else { noProduct.push(t); }
    }

    // 数据卡片
    const m = State.monthly || {};
    const t = State.gmv || {};
    const monthPct = m.completion_rate || 0;
    const monthGmv = m.gmv || 0;
    const monthTarget = m.target || 250000;
    const todayGmv = t.gmv || 0;
    const todayTarget = t.target_daily || 8333;
    const todayPct = t.completion_rate || 0;
    const totalTasks = (State.myTasks||[]).length;
    const doneTasks = (State.myTasks||[]).filter(t=>t.status==='done').length;
    const taskPct = totalTasks ? Math.round(doneTasks/totalTasks*100) : 0;

    el.innerHTML = `
      <!-- 数据卡片 -->
      <div class="exec-stats-card">
        <div class="exec-stat-item">
          <div class="exec-stat-label">本月GMV目标</div>
          <div class="exec-stat-bar-wrap">
            <div class="exec-stat-bar-bg"><div class="exec-stat-bar-fill" style="width:${Math.min(monthPct,100)}%;background:var(--green)"></div></div>
            <span class="exec-stat-pct" style="color:var(--green)">${monthPct}%</span>
          </div>
          <div class="exec-stat-nums">
            <span>¥${(monthGmv/10000).toFixed(1)}w</span>
            <span style="color:var(--text3)">/ ¥${(monthTarget/10000).toFixed(0)}w</span>
          </div>
        </div>
        <div class="exec-stat-divider"></div>
        <div class="exec-stat-item">
          <div class="exec-stat-label">昨日GMV</div>
          <div class="exec-stat-bar-wrap">
            <div class="exec-stat-bar-bg"><div class="exec-stat-bar-fill" style="width:${Math.min(todayPct,100)}%;background:var(--orange)"></div></div>
            <span class="exec-stat-pct" style="color:var(--orange)">${todayPct}%</span>
          </div>
          <div class="exec-stat-nums">
            <span>¥${todayGmv.toLocaleString('zh-CN')}</span>
            <span style="color:var(--text3)">/ ¥${todayTarget.toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <div class="exec-stat-divider"></div>
        <div class="exec-stat-item">
          <div class="exec-stat-label">今日任务</div>
          <div class="exec-stat-bar-wrap">
            <div class="exec-stat-bar-bg"><div class="exec-stat-bar-fill" style="width:${taskPct}%;background:var(--blue)"></div></div>
            <span class="exec-stat-pct" style="color:var(--blue)">${taskPct}%</span>
          </div>
          <div class="exec-stat-nums">
            <span>${doneTasks} 完成</span>
            <span style="color:var(--text3)">/ ${totalTasks} 项</span>
          </div>
        </div>
      </div>

      <!-- 我的任务 -->
      ${this.section('我的任务', 'my-task',
        myTodo.map(t => this.taskCard(t, true)).join('') +
        (myDone.length ? `<div style="padding:8px 16px 4px;font-size:var(--font-xs);color:var(--text3)">已完成 ${myDone.length} 项</div>` +
          myDone.map(t => this.taskCard(t, true)).join('') : '') +
        (!State.myTasks.length ? this.emptyRow('还没有任务') : '')
      )}

      <!-- 参考视频 -->
      ${this.section('参考视频', 'content',
        (State.contents||[]).map(c => this.contentCard(c)).join('') ||
        this.emptyRow('还没有参考视频')
      )}

      <!-- 团队任务 -->
      ${this.section('团队任务', 'team-task',
        Object.values(byProduct).map(g => this.productGroup(g)).join('') +
        noProduct.map(t => this.taskCard(t, false)).join('') +
        (!teamTasks.length ? this.emptyRow('暂无进行中的团队任务') : '')
      )}

      <div style="height:24px"></div>
    `;
  },

  section(label, type, body) {
    return `<div class="battle-section">
      <div class="battle-header">
        <span class="battle-label">${label}</span>
        <button class="battle-add-btn" onclick="Exec.showAdd('${type}')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          新建
        </button>
      </div>
      ${body}
    </div>`;
  },

  emptyRow(text) {
    return `<div style="background:var(--card);padding:18px 16px;border-bottom:0.5px solid var(--border);font-size:var(--font-sm);color:var(--text3);text-align:center">${text}</div>`;
  },

  taskCard(t, showToggle) {
    const isDone = t.status === 'done';
    return `<div class="task-item" onclick="Exec.openTask(${t.id})">
      ${showToggle
        ? `<div class="task-check ${isDone?'done':''}" onclick="event.stopPropagation();Exec.toggleTask(${t.id})">
            ${isDone ? '<svg viewBox="0 0 12 10" width="12" height="10"><polyline points="1,5 4,8 11,1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : ''}
           </div>`
        : `<div style="width:8px;height:8px;border-radius:50%;background:${isDone?'var(--green)':'var(--orange)'};flex-shrink:0;margin-top:7px"></div>`
      }
      <div class="task-body">
        <div class="task-title ${isDone?'done':''}">${escHtml(t.title)}</div>
        <div class="task-meta">
          <span>${t.assignee_name||'未指派'}</span>
          ${t.product_name ? `<span>${escHtml(t.product_name)}</span>` : ''}
          ${t.due_date ? `<span style="color:var(--orange)">截止 ${t.due_date}</span>` : ''}
        </div>
      </div>
      <span class="status-badge status-${t.status==='todo'?'todo':t.status==='doing'?'doing':'done'}">${t.status==='todo'?'待做':t.status==='doing'?'进行中':'完成'}</span>
    </div>`;
  },

  productGroup(g) {
    const doing = g.tasks.filter(t=>t.status==='doing').length;
    return `<div style="background:var(--card);border-bottom:0.5px solid var(--border)">
      <div style="padding:13px 16px;display:flex;align-items:center;gap:10px;border-bottom:0.5px solid var(--border)">
        <div style="flex:1">
          <div style="font-size:var(--font-base);font-weight:600;color:var(--text)">${escHtml(g.name)}</div>
          <div style="font-size:var(--font-xs);color:var(--text3);margin-top:2px">${g.sku||''} · ${g.tasks.length}个任务${doing?'，'+doing+'个进行中':''}</div>
        </div>
      </div>
      ${g.tasks.map(t => this.taskCard(t, false)).join('')}
    </div>`;
  },

  contentCard(c) {
    return `<div class="content-card" onclick="Exec.openContent(${c.id})">
      <div class="content-thumb" style="background:var(--bg2);border-radius:8px;overflow:hidden;width:56px;height:56px;display:flex;align-items:center;justify-content:center">
        ${c.screenshot_url ? `<img src="${c.screenshot_url}" style="width:100%;height:100%;object-fit:cover">` :
          `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--text3)" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`}
      </div>
      <div class="content-info" style="flex:1;min-width:0">
        <div style="font-size:var(--font-base);color:var(--text);font-weight:500">${c.douyin_url ? '🔗 ' : ''}${escHtml(c.title||c.douyin_url||'参考视频')}</div>
        <div style="font-size:var(--font-xs);color:var(--text3);margin-top:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escHtml(c.boom_analysis||c.why_research||'暂无备注')}</div>
      </div>
    </div>`;
  },

  showAdd(type) {
    if (type === 'my-task') Chat.showWoTask();
    else if (type === 'team-task') Chat.showTaTask();
    else if (type === 'content') this.showAddContent();
  },

  showAddContent() {
    document.getElementById('content-id').value = '';
    document.getElementById('content-url').value = '';
    document.getElementById('content-note').value = '';
    showSheet('content-overlay');
  },

  async openContent(id) {
    try {
      const d = await API.get('/api/contents/'+id);
      const c = d.content;
      document.getElementById('content-id').value = id;
      document.getElementById('content-url').value = c.douyin_url || '';
      document.getElementById('content-note').value = c.boom_analysis || c.why_research || '';
      showSheet('content-overlay');
    } catch(e) { toast(e.message); }
  },

  async saveContent() {
    const id = document.getElementById('content-id').value;
    const douyin_url = document.getElementById('content-url').value.trim();
    const note = document.getElementById('content-note').value.trim();
    if (!douyin_url && !note) { toast('请填写链接或备注'); return; }
    const body = { title: douyin_url || '参考视频', douyin_url, boom_analysis: note };
    try {
      if (id) await API.put('/api/contents/'+id, body);
      else await API.post('/api/contents', body);
      hideSheet('content-overlay');
      const d = await API.get('/api/contents');
      State.contents = d.contents;
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  async openTask(id) {
    const task = [...(State.myTasks||[]), ...(State.allTasks||[])].find(t=>t.id===id);
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
      await API.put('/api/tasks/'+id, { title, status, assignee_id });
      hideSheet('task-edit-overlay');
      if (status === 'done') {
        setTimeout(() => {
          document.getElementById('review-task-id').value = id;
          ['review-did','review-result','review-next'].forEach(i=>document.getElementById(i).value='');
          showSheet('review-overlay');
        }, 400);
      }
      await this.loadAll();
      this.render();
      toast('已保存');
    } catch(e) { toast(e.message); }
  },

  async toggleTask(id) {
    const task = (State.myTasks||[]).find(t=>t.id===id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await API.put('/api/tasks/'+id, { status:newStatus });
      await this.loadAll();
      this.render();
      if (newStatus === 'done') {
        toast('✅ 完成 +10 EXP');
        setTimeout(() => {
          document.getElementById('review-task-id').value = id;
          ['review-did','review-result','review-next'].forEach(i=>document.getElementById(i).value='');
          showSheet('review-overlay');
        }, 600);
      }
    } catch(e) { toast(e.message); }
  },

  async saveReview() {
    const did = document.getElementById('review-did').value.trim();
    const result = document.getElementById('review-result').value.trim();
    const next = document.getElementById('review-next').value.trim();
    if (!did) { toast('请填写做了什么'); return; }
    try {
      await API.post('/api/experiences', {
        title: new Date().toLocaleDateString('zh-CN') + ' 复盘',
        content: `做了：${did}\n结果：${result}\n下次：${next}`,
      });
      hideSheet('review-overlay');
      toast('✅ 复盘完成 +30 EXP');
    } catch(e) { toast(e.message); }
  },
};
