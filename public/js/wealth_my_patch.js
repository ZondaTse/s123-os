// Patch My.renderProfile to WeChat style
My.renderProfile = function() {
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
    <div class="my-profile" onclick="showSheet('settings-overlay')" style="cursor:pointer">
      <div class="my-avatar" style="background:${color}">
        ${u.avatar_url ? `<img src="${u.avatar_url}" alt="${u.name}">` : avatarLetter(u.name)}
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
        <span>${u.exp} / ${nextT} EXP${u.level < 6 ? ' → ' + levelName(u.level + 1) : ' (满级)'}</span>
      </div>
      <div class="exp-bar-bg"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
    </div>

    <div class="menu-divider"></div>

    <div class="menu-section">
      <div class="menu-item" onclick="My.menuAction('menu-growth')">
        <div class="menu-icon-wrap" style="background:#e8f5e9">🌱</div>
        <div class="menu-label">个人成长</div>
        <span class="menu-arrow">›</span>
      </div>
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
        <div class="menu-right">目标进度 ${State.monthly ? (State.monthly.completion_rate || 0) + '%' : '–'}</div>
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

    <div style="height:20px"></div>
  `;
};
