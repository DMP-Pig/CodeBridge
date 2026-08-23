/* PhoneToPCCopyCode · 渲染进程 UI 逻辑 */
const api = window.p2p;

const $ = (sel) => document.querySelector(sel);
const els = {
  versionLabel: $('#versionLabel'),
  statusCard: $('#statusCard'),
  statusDot: $('#statusDot'),
  statusTitle: $('#statusTitle'),
  statusSub: $('#statusSub'),
  ipsRow: $('#ipsRow'),
  heroEmpty: $('#heroEmpty'),
  heroContent: $('#heroContent'),
  heroApp: $('#heroApp'),
  heroSource: $('#heroSource'),
  heroTime: $('#heroTime'),
  heroCode: $('#heroCode'),
  btnCopyHero: $('#btnCopyHero'),
  btnIslandHero: $('#btnIslandHero'),
  btnClearHero: $('#btnClearHero'),
  historyList: $('#historyList'),
  btnClearHistory: $('#btnClearHistory'),
  drawer: $('#drawer'),
  drawerScrim: $('#drawerScrim'),
  drawerClose: $('#drawerClose'),
  btnSettings: $('#btnSettings'),
  btnSaveSettings: $('#btnSaveSettings'),
  btnTestIsland: $('#btnTestIsland'),
  toasts: $('#toasts'),
  btnMin: $('#btnMin'),
  btnMax: $('#btnMax'),
  btnClose: $('#btnClose'),
};

let settings = {};
let codes = [];
let currentId = null;
let activeHeroId = null;

/* ---------------- 时间格式化 ---------------- */
function fmtTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtFull(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------------- 提示 Toast ---------------- */
const TOAST_ICONS = {
  ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  island: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  err: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>',
};

function toast(kind, text, ms = 3200) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="t-icon">${TOAST_ICONS[kind] || ''}</span><span>${escapeHtml(text)}</span>`;
  els.toasts.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, ms);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------------- 状态卡片 ---------------- */
function renderStatus(status) {
  if (!status) return;
  if (status.running) {
    els.statusCard.classList.add('running');
    els.statusCard.classList.remove('error');
    els.statusTitle.textContent = `局域网服务运行中 · 端口 ${status.port}`;
    els.statusSub.textContent = '手机端可向以下地址发送验证码';
  } else if (status.error) {
    els.statusCard.classList.add('error');
    els.statusCard.classList.remove('running');
    els.statusTitle.textContent = '服务异常';
    els.statusSub.textContent = status.error;
  } else {
    els.statusCard.classList.remove('running', 'error');
    els.statusTitle.textContent = '服务已停用';
    els.statusSub.textContent = '请在设置中启用';
  }
  els.ipsRow.innerHTML = '';
  const ips = status.ips || [];
  if (ips.length === 0) {
    els.ipsRow.innerHTML = '<span class="ip-chip">未检测到局域网 IP</span>';
    return;
  }
  for (const ip of ips) {
    const chip = document.createElement('span');
    chip.className = 'ip-chip';
    chip.title = '点击复制';
    chip.textContent = `${ip.name}: ${ip.address}:${status.port || settings.server?.port || 9841}`;
    chip.addEventListener('click', async () => {
      const text = `http://${ip.address}:${status.port || settings.server?.port || 9841}`;
      api.writeClipboard(text).then(() => {
        chip.innerHTML = `<span class="copied">✓ 已复制 ${escapeHtml(text)}</span>`;
        setTimeout(() => { chip.textContent = `${ip.name}: ${ip.address}:${status.port || settings.server?.port || 9841}`; }, 1600);
      });
    });
    els.ipsRow.appendChild(chip);
  }
}

/* ---------------- 验证码大卡 ---------------- */
function showHero(entry) {
  activeHeroId = entry.id;
  els.heroEmpty.classList.add('hidden');
  els.heroContent.classList.remove('hidden');
  els.heroApp.textContent = entry.app || '短信';
  els.heroSource.textContent = entry.source || '';
  els.heroTime.textContent = fmtTime(entry.time);
  // 逐位动画
  const code = entry.code;
  els.heroCode.innerHTML = '';
  [...code].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'digit';
    span.textContent = ch;
    span.style.animationDelay = `${i * 55}ms`;
    els.heroCode.appendChild(span);
  });
}

function showEmpty() {
  activeHeroId = null;
  els.heroEmpty.classList.remove('hidden');
  els.heroContent.classList.add('hidden');
}

/* ---------------- 历史列表 ---------------- */
function renderHistory() {
  if (codes.length === 0) {
    els.historyList.innerHTML = '<div class="empty-hint">暂无历史记录</div>';
    return;
  }
  els.historyList.innerHTML = '';
  for (const entry of codes) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.style.animationDelay = `${Math.min(codes.indexOf(entry) * 40, 300)}ms`;
    card.innerHTML = `
      <div class="history-code">${escapeHtml(entry.code)}</div>
      <div class="history-info">
        <div class="history-app">${escapeHtml(entry.app || '短信')}</div>
        <div class="history-meta">${escapeHtml(entry.source || '')} · ${fmtFull(entry.time)}${entry.from ? ' · ' + escapeHtml(entry.from) : ''}</div>
      </div>
      <div class="history-actions">
        <button class="mini-btn" data-act="copy" data-id="${entry.id}" title="复制到剪贴板">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        </button>
        <button class="mini-btn" data-act="island" data-id="${entry.id}" title="推送到 WinIsland 灵动岛">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>
        </button>
        <button class="mini-btn danger" data-act="remove" data-id="${entry.id}" title="移除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
        </button>
      </div>
    `;
    card.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => handleAction(btn.dataset.act, btn.dataset.id));
    });
    els.historyList.appendChild(card);
  }
}

async function handleAction(act, id) {
  if (act === 'copy') {
    const ok = await api.copyCode(id);
    if (ok) toast('copy', '已复制到剪贴板');
  } else if (act === 'island') {
    const res = await api.pushIsland(id);
    if (res && res.ok) toast('island', '已推送到 WinIsland 灵动岛');
    else toast('err', (res && res.error) || '上岛失败');
  } else if (act === 'remove') {
    await api.removeCode(id);
    codes = codes.filter((c) => c.id !== id);
    if (activeHeroId === id) showEmpty();
    renderHistory();
  }
}

/* ---------------- 设置抽屉 ---------------- */
function openDrawer() {
  els.drawer.classList.add('open');
  els.drawerScrim.classList.add('open');
  fillSettingsForm();
}
function closeDrawer() {
  els.drawer.classList.remove('open');
  els.drawerScrim.classList.remove('open');
}

function fillSettingsForm() {
  const s = settings;
  $('#setServerEnabled').checked = !!s.server?.enabled;
  $('#setPort').value = s.server?.port ?? 9841;
  $('#setToken').value = s.server?.token || '';
  $('#setAutoDisplay').checked = !!s.behavior?.autoDisplay;
  $('#setAutoCopy').checked = !!s.behavior?.autoCopy;
  $('#setAutoIsland').checked = !!s.behavior?.autoIsland;
  $('#setSound').checked = !!s.behavior?.playSound;
  $('#setIslandUrl').value = s.island?.baseUrl || 'http://127.0.0.1:9840';
  $('#setIslandToken').value = s.island?.token || '';
  $('#setIslandDuration').value = s.island?.durationSeconds ?? 30;
  $('#setAccent').value = s.ui?.accent || '#6ea8ff';
  $('#setKeep').value = s.ui?.keepHistory ?? 50;
}

async function saveSettings() {
  const patch = {
    server: {
      enabled: $('#setServerEnabled').checked,
      port: clamp(parseInt($('#setPort').value, 10), 1024, 65535),
      token: $('#setToken').value.trim(),
    },
    behavior: {
      autoDisplay: $('#setAutoDisplay').checked,
      autoCopy: $('#setAutoCopy').checked,
      autoIsland: $('#setAutoIsland').checked,
      playSound: $('#setSound').checked,
    },
    island: {
      baseUrl: $('#setIslandUrl').value.trim(),
      token: $('#setIslandToken').value.trim(),
      durationSeconds: clamp(parseInt($('#setIslandDuration').value, 10), 3, 600),
    },
    ui: {
      accent: $('#setAccent').value,
      keepHistory: clamp(parseInt($('#setKeep').value, 10), 10, 500),
    },
  };
  settings = await api.setSettings(patch);
  document.documentElement.style.setProperty('--accent', settings.ui.accent);
  const status = await api.getServerStatus();
  renderStatus(status);
  toast('ok', '设置已保存，服务已生效');
  closeDrawer();
}

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/* ---------------- 事件绑定 ---------------- */
els.btnMin.addEventListener('click', () => api.minimize());
els.btnMax.addEventListener('click', () => api.maximize());
els.btnClose.addEventListener('click', () => api.close());
els.btnSettings.addEventListener('click', openDrawer);
els.drawerClose.addEventListener('click', closeDrawer);
els.drawerScrim.addEventListener('click', closeDrawer);
els.btnSaveSettings.addEventListener('click', saveSettings);
els.btnTestIsland.addEventListener('click', async () => {
  els.btnTestIsland.textContent = '测试中…';
  els.btnTestIsland.disabled = true;
  // 用一个占位验证码测试上岛
  await api.setSettings({
    island: {
      baseUrl: $('#setIslandUrl').value.trim(),
      token: $('#setIslandToken').value.trim(),
      durationSeconds: clamp(parseInt($('#setIslandDuration').value, 10), 3, 600),
    },
  });
  const res = await api.pushIsland('last').catch(() => ({ ok: false, error: '无可用验证码，请先接收一条' }));
  els.btnTestIsland.textContent = '测试上岛连接';
  els.btnTestIsland.disabled = false;
  if (res && res.ok) toast('island', '上岛连接成功 ✓');
  else toast('err', (res && res.error) || '上岛连接失败');
});
els.btnClearHistory.addEventListener('click', async () => {
  await api.clearCodes();
  codes = [];
  showEmpty();
  renderHistory();
  toast('ok', '历史记录已清空');
});
els.btnCopyHero.addEventListener('click', () => handleAction('copy', activeHeroId));
els.btnIslandHero.addEventListener('click', () => handleAction('island', activeHeroId));
els.btnClearHero.addEventListener('click', () => handleAction('remove', activeHeroId));

/* 键盘：Esc 关闭抽屉 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

/* ---------------- 主进程事件 ---------------- */
api.on('code:new', (entry) => {
  codes.unshift(entry);
  if (settings.behavior?.autoDisplay !== false) {
    showHero(entry);
    toast('ok', `收到验证码：${entry.code}`);
  }
  renderHistory();
});

api.on('server:status', (status) => renderStatus(status));

api.on('action:notice', (notice) => {
  const kindMap = { copy: 'copy', island: 'island', error: 'err' };
  toast(kindMap[notice.kind] || 'ok', notice.text);
});

/* ---------------- 初始化 ---------------- */
(async function init() {
  const info = await api.getAppInfo();
  if (info) {
    els.versionLabel.textContent = `v${info.version}`;
    if (info.platform === 'darwin') document.body.classList.add('platform-darwin');
  }
  settings = await api.getSettings();
  document.documentElement.style.setProperty('--accent', settings.ui?.accent || '#6ea8ff');
  codes = await api.listCodes();
  if (codes.length > 0) showHero(codes[0]);
  renderHistory();
  const status = await api.getServerStatus();
  renderStatus(status);
})();


