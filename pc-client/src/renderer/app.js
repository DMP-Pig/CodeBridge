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
  statToday: $('#statToday'),
  statTotal: $('#statTotal'),
  statsApps: $('#statsApps'),
  historySearch: $('#historySearch'),
  devicesRow: $('#devicesRow'),
  devicesHint: $('#devicesHint'),
  btnClearHistory: $('#btnClearHistory'),
  drawer: $('#drawer'),
  drawerScrim: $('#drawerScrim'),
  drawerClose: $('#drawerClose'),
  btnSettings: $('#btnSettings'),
  btnSaveSettings: $('#btnSaveSettings'),
  btnTestIsland: $('#btnTestIsland'),
  setIslandTitleStyle: $('#setIslandTitleStyle'),
  setIslandShowApp: $('#setIslandShowApp'),
  setIslandAnimation: $('#setIslandAnimation'),
  setIslandClickAction: $('#setIslandClickAction'),
  setIslandDisplay: $('#setIslandDisplay'),
  islandIconPresets: $('#islandIconPresets'),
  islandPreview: $('#islandPreview'),
  ipIcon: $('#ipIcon'),
  ipTitle: $('#ipTitle'),
  ipBody: $('#ipBody'),
  btnPlayPreview: $('#btnPlayPreview'),

  toasts: $('#toasts'),
  btnMin: $('#btnMin'),
  btnMax: $('#btnMax'),
  btnClose: $('#btnClose'),
  updateBanner: $('#updateBanner'),
  updateTitle: $('#updateTitle'),
  updateNotes: $('#updateNotes'),
  btnUpdateDownload: $('#btnUpdateDownload'),
  btnUpdateDismiss: $('#btnUpdateDismiss'),
  btnCheckUpdate: $('#btnCheckUpdate'),
  setSystemNotify: $('#setSystemNotify'),
  setWebhookEnabled: $('#setWebhookEnabled'),
  setAutoLaunch: $('#setAutoLaunch'),
  setClipboardSync: $('#setClipboardSync'),
  setFilterMode: $('#setFilterMode'),
  setFilterNumbers: $('#setFilterNumbers'),
  setWebhookUrl: $('#setWebhookUrl'),
  setCommandPath: $('#setCommandPath'),
  setCommandArgs: $('#setCommandArgs'),
  webhookExtra: $('#webhookExtra'),
  btnTestWebhook: $('#btnTestWebhook'),
  setAutoClean: $('#setAutoClean'),
  pairQr: $('#pairQr'),
  pairQrHint: $('#pairQrHint'),
  btnRefreshQr: $('#btnRefreshQr'),
};

let settings = {};
let codes = [];
let currentId = null;
let activeHeroId = null;
let updateInfo = null;
let searchQuery = '';
let devicesCache = [];

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

/* ---------------- 多语言 & 主题 ---------------- */
const I18N = {
  zh: {
    'btn.minimize': '最小化', 'btn.maximize': '最大化', 'btn.close': '关闭',
    'update.download': '下载更新', 'update.dismiss': '忽略',
    'update.available': '发现新版本 v{version}', 'update.clickDownload': '点击下载安装最新版本',
    'update.latest': '已是最新版本', 'update.failed': '检查更新失败（可能是网络问题）',
    'update.checking': '正在检查更新…',
    'init.status': '正在初始化…', 'status.service': '局域网服务',
    'status.running': '局域网服务运行中 · 端口 {port}',
    'status.sub.running': '手机端可向以下地址发送验证码', 'status.secure': 'HTTPS 加密传输（TLS）',
    'status.error': '服务异常', 'status.stopped': '服务已停用',
    'status.sub.stopped': '请在设置中启用', 'status.noip': '未检测到局域网 IP', 'status.unsecure': 'HTTP（未加密）',
    'ip.copy': '点击复制', 'ip.copied': '已复制 {url}',
    'hero.wait': '等待验证码', 'hero.waitSub': '手机发送验证码后，将在此处实时展示',
    'hero.copy': '复制', 'hero.island': '上岛', 'hero.clear': '清空',
    'history.msg.defaultApp': '短信', 'history.title': '历史记录', 'history.clearAll': '清空全部',
    'stats.title': '验证码统计', 'stats.today': '今日', 'stats.total': '累计', 'stats.dist': '今日来源分布', 'stats.empty': '今日暂无数据',
    'history.empty': '暂无历史记录',
    'history.searchPh': '搜索验证码 / 应用 / 来源…', 'history.searchEmpty': '无匹配结果',
    'history.actions.copy': '复制到剪贴板', 'history.actions.island': '推送到 WinIsland 灵动岛', 'history.actions.remove': '移除',
    'drawer.title': '设置',
    'group.lan': '局域网服务', 'group.after': '收到验证码后', 'group.island': 'WinIsland 上岛', 'group.ui': '界面',
    'set.serverEnabled': '启用服务', 'set.serverEnabledDesc': '开启后手机可通过局域网发送验证码',
    'set.port': '监听端口', 'set.portDesc': '修改后服务自动重启',
    'set.token': '访问令牌 Token', 'set.tokenDesc': '手机端需携带相同 Token，防止局域网误连', 'set.tokenPh': '留空则不校验',
    'set.pair': '扫码配对', 'set.pairDesc': '手机打开 CodeBridge 点「扫码配对」扫一扫，自动填入地址与令牌', 'set.pairRefresh': '刷新二维码',
    'set.autoDisplay': '自动展示', 'set.autoDisplayDesc': '收到后弹出悬浮提示并置顶展示',
    'set.autoCopy': '自动复制', 'set.autoCopyDesc': '收到后立即复制到剪贴板',
    'set.copyRestore': '复制后恢复原剪贴板', 'set.copyRestoreDesc': '复制验证码后，过一段时间自动恢复为之前的剪贴板内容',
    'set.copyRestoreSecs': '恢复时间（秒）', 'set.copyRestoreSecsDesc': '复制验证码 N 秒后恢复原剪贴板',
    'set.autoIsland': '自动上岛', 'set.autoIslandDesc': '收到后自动推送到 WinIsland 灵动岛',
    'set.autoInput': '自动输入', 'set.autoInputDesc': '收到后自动输入到当前焦点所在的输入框',
    'set.sound': '提示音', 'set.soundDesc': '收到验证码时播放系统提示音',
    'set.systemNotify': '系统通知', 'set.systemNotifyDesc': '收到验证码时发送 Windows/macOS 系统通知',
        'set.autoLaunch': '开机自启', 'set.autoLaunchDesc': '系统登录时自动启动 CodeBridge 并后台运行',
        'set.clipboardSync': '同步剪贴板到手机', 'set.clipboardSyncDesc': 'PC 剪贴板变化时自动同步到手机端',
        'set.filterMode': '来源过滤器', 'set.filterModeDesc': '按发件号码或来源应用允许/拦截验证码',
        'filter.off': '关闭', 'filter.whitelist': '仅允许列表中的来源', 'filter.blacklist': '拦截列表中的来源',
        'set.filterNumbers': '来源列表', 'set.filterNumbersDesc': '每行一个：号码前缀或应用名（如 10086、淘宝）',
        'set.webhook': 'Webhook / 脚本触发', 'set.webhookDesc': '收到验证码时调用 Webhook（POST JSON）或执行自定义命令/脚本',
        'set.webhookUrl': 'Webhook 地址', 'set.webhookUrlDesc': 'POST JSON，包含 code / app / source / time / from / id',
        'set.scriptPath': '命令 / 脚本路径', 'set.scriptPathDesc': '收到验证码时执行的程序路径（留空则不执行）',
        'set.scriptArgs': '命令参数模板', 'set.scriptArgsDesc': '支持 {code} {app} {source} {time} {id} 占位符',
        'btn.testWebhook': '测试触发',
        'toast.webhookTestOk': 'Webhook / 脚本已触发测试',
    'set.islandUrl': '上岛 API 地址', 'set.islandUrlDesc': 'WinIsland 设置 → 上岛 API 中的地址',
    'set.islandToken': 'WinIsland Token', 'set.islandTokenDesc': 'WinIsland 中设置的 Token（留空则不传）',
    'set.islandIcon': '上岛图标', 'set.islandIconDesc': '支持 emoji（🔑）、文本或 \\uXXXX 转义（如 \\uE8D6）', 'set.islandIconPh': '\\uE8D6 或 🔑',
    'set.islandDuration': '显示时长（秒）', 'set.islandDurationDesc': '灵动岛卡片展示时长',
    'set.islandTitleStyle': '紧凑标题样式', 'set.islandTitleStyleDesc': '紧凑态标题格式（保持单行、不影响岛宽）',
    'set.islandTitleStyleCode': '仅验证码', 'set.islandTitleStyleCn': '验证码 123456', 'set.islandTitleStyleEn': 'Code 123456',
    'set.islandShowApp': '正文显示来源', 'set.islandShowAppDesc': '展开态正文显示来源应用等信息',
    'set.islandIconPreset': '图标快捷选择', 'set.islandIconPresetDesc': '点击填入上方图标输入框',
    'set.islandPreview': '上岛动画预览', 'set.islandPreviewDesc': '模拟灵动岛展示效果；实际动画以 WinIsland 设置为准',
    'set.islandPreviewBody': '验证码 · 来自 短信',
    'btn.playPreview': '播放动画',
    'set.islandAnimation': '上岛动画', 'set.islandAnimationDesc': '选择上岛进入动画：默认 / 淡入 / 滑动 / 缩放',
    'anim.default': '默认（弹性缩放）', 'anim.fade': '淡入',     'set.islandClickAction': '上岛点击行为', 'set.islandClickActionDesc': '点击灵动岛按钮后：复制验证码到剪贴板，或自动输入到当前输入框',
    'click.copy': '复制到剪贴板', 'click.type': '输入到当前输入框',
    'set.islandDisplay': '窗口显示屏幕', 'set.islandDisplayDesc': '主窗口打开的屏幕（跟随鼠标或指定显示器）；灵动岛实际屏幕由 WinIsland 窗口位置决定',
    'display.auto': '自动（跟随鼠标所在屏幕）',
'anim.slide': '底部滑入', 'anim.scale': '轻微缩放',
    'set.checkUpdate': '检查更新', 'set.checkUpdateDesc': '检查 GitHub 上是否有新版本',
    'set.theme': '主题', 'set.themeDesc': '深色/浅色显示模式', 'theme.dark': '深色', 'theme.light': '浅色',
    'set.language': '语言', 'set.languageDesc': '界面语言', 'lang.zh': '中文', 'lang.en': 'English',
    'set.accent': '强调色', 'set.accentDesc': '按钮与高亮使用的主题色',
    'set.keep': '保留历史条数', 'set.keepDesc': '最多保留的验证码历史数量',
    'set.autoClean': '自动清理（天）', 'set.autoCleanDesc': '自动删除超过 N 天的历史记录（0=关闭）',
    'btn.settings': '设置', 'btn.testIsland': '测试上岛连接', 'btn.testingIsland': '测试中…',
    'btn.checkUpdate': '检查更新', 'btn.save': '保存设置',
    'toast.saved': '设置已保存，服务已生效', 'toast.copied': '已复制到剪贴板',
    'toast.islandOk': '已推送到 WinIsland 灵动岛', 'toast.islandFail': '上岛失败', 'toast.islandConnFail': '上岛连接失败',
    'toast.islandTestOk': '上岛连接成功 ✓', 'toast.historyCleared': '历史记录已清空',
    'toast.codeReceived': '收到验证码：{code}', 'toast.copiedSync': '已自动复制到剪贴板',
    'toast.clipboardRestored': '剪贴板已恢复为原内容', 'toast.autoIslandOk': '已自动上岛',
    'error.noCode': '无可用验证码，请先接收一条',
    'status.devices': '已连接设备',
    'status.devicesEmpty': '暂无设备在线',
    'status.deviceOnline': '在线',
    'status.deviceOffline': '离线',
  },
  en: {
    'btn.minimize': 'Minimize', 'btn.maximize': 'Maximize', 'btn.close': 'Close',
    'update.download': 'Download Update', 'update.dismiss': 'Ignore',
    'update.available': 'New version v{version} available', 'update.clickDownload': 'Click to download and install the latest version',
    'update.latest': 'You are up to date', 'update.failed': 'Update check failed (network issue?)',
    'update.checking': 'Checking for updates…',
    'init.status': 'Initializing…', 'status.service': 'LAN Service',
    'status.running': 'LAN service running · port {port}',
    'status.sub.running': 'Your phone can send codes to these addresses', 'status.secure': 'Secure HTTPS (TLS)',
    'status.error': 'Service error', 'status.stopped': 'Service disabled',
    'status.sub.stopped': 'Enable it in Settings', 'status.noip': 'No LAN IP detected', 'status.unsecure': 'HTTP (not encrypted)',
    'ip.copy': 'Click to copy', 'ip.copied': 'Copied {url}',
    'hero.wait': 'Waiting for code', 'hero.waitSub': 'Codes sent from your phone will appear here',
    'hero.copy': 'Copy', 'hero.island': 'Island', 'hero.clear': 'Clear',
    'history.msg.defaultApp': 'SMS', 'history.title': 'History', 'history.clearAll': 'Clear All',
    'stats.title': 'Statistics', 'stats.today': 'Today', 'stats.total': 'Total', 'stats.dist': "Today's sources", 'stats.empty': 'No data today',
    'history.empty': 'No history yet',
    'history.searchPh': 'Search code / app / source…', 'history.searchEmpty': 'No matches',
    'history.actions.copy': 'Copy to clipboard', 'history.actions.island': 'Push to WinIsland', 'history.actions.remove': 'Remove',
    'drawer.title': 'Settings',
    'group.lan': 'LAN Service', 'group.after': 'After receiving a code', 'group.island': 'WinIsland Island', 'group.ui': 'UI',
    'set.serverEnabled': 'Enable Service', 'set.serverEnabledDesc': 'Phone can send codes over LAN when enabled',
    'set.port': 'Port', 'set.portDesc': 'Service restarts automatically',
    'set.token': 'Access Token', 'set.tokenDesc': 'Phone must use the same token to prevent wrong connections', 'set.tokenPh': 'Empty = no token check',
    'set.pair': 'QR Pairing', 'set.pairDesc': 'Open CodeBridge on your phone, tap "Scan QR" and scan to auto-fill address & token', 'set.pairRefresh': 'Refresh QR',
    'set.autoDisplay': 'Auto Display', 'set.autoDisplayDesc': 'Show a floating alert on arrival',
    'set.autoCopy': 'Auto Copy', 'set.autoCopyDesc': 'Copy to clipboard immediately',
    'set.copyRestore': 'Restore Original Clipboard', 'set.copyRestoreDesc': 'Restore previous clipboard content after a delay',
    'set.copyRestoreSecs': 'Restore After (s)', 'set.copyRestoreSecsDesc': 'Seconds before restoring original clipboard',
    'set.autoIsland': 'Auto Island', 'set.autoIslandDesc': 'Push to WinIsland automatically',
    'set.autoInput': 'Auto Type', 'set.autoInputDesc': 'Type the code into the currently focused input',
    'set.sound': 'Sound', 'set.soundDesc': 'Play system beep on arrival',
    'set.systemNotify': 'System Notification', 'set.systemNotifyDesc': 'Send a system notification on arrival',
        'set.autoLaunch': 'Launch at Login', 'set.autoLaunchDesc': 'Start CodeBridge in the background at system login',
        'set.clipboardSync': 'Sync Clipboard to Phone', 'set.clipboardSyncDesc': 'Auto-sync PC clipboard changes to the phone',
        'set.filterMode': 'Source Filter', 'set.filterModeDesc': 'Allow or block codes by sender number or source app',
        'filter.off': 'Off', 'filter.whitelist': 'Allow only listed sources', 'filter.blacklist': 'Block listed sources',
        'set.filterNumbers': 'Source List', 'set.filterNumbersDesc': 'One per line: number prefix or app name (e.g. 10086, Taobao)',
        'set.webhook': 'Webhook / Script', 'set.webhookDesc': 'Call a webhook (POST JSON) or run a custom command when a code arrives',
        'set.webhookUrl': 'Webhook URL', 'set.webhookUrlDesc': 'POST JSON with code / app / source / time / from / id',
        'set.scriptPath': 'Command / Script Path', 'set.scriptPathDesc': 'Program to run on arrival (empty = disabled)',
        'set.scriptArgs': 'Command Args Template', 'set.scriptArgsDesc': 'Supports {code} {app} {source} {time} {id} placeholders',
        'btn.testWebhook': 'Test Trigger',
        'toast.webhookTestOk': 'Test webhook / script triggered',
    'set.islandUrl': 'Island API URL', 'set.islandUrlDesc': 'Address in WinIsland Settings → Island API',
    'set.islandToken': 'WinIsland Token', 'set.islandTokenDesc': 'Token set in WinIsland (empty = not sent)',
    'set.islandIcon': 'Island Icon', 'set.islandIconDesc': 'emoji (🔑), text, or \\uXXXX escapes (e.g. \\uE8D6)', 'set.islandIconPh': '\\uE8D6 or 🔑',
    'set.islandDuration': 'Duration (s)', 'set.islandDurationDesc': 'How long the island card shows',
    'set.islandTitleStyle': 'Compact title style', 'set.islandTitleStyleDesc': 'Compact title format (single-line, island width unaffected)',
    'set.islandTitleStyleCode': 'Code only', 'set.islandTitleStyleCn': 'Code 123456', 'set.islandTitleStyleEn': 'Code 123456',
    'set.islandShowApp': 'Show source in body', 'set.islandShowAppDesc': 'Show source app in expanded body',
    'set.islandIconPreset': 'Icon presets', 'set.islandIconPresetDesc': 'Click to fill the icon input',
    'set.islandPreview': 'Island animation preview', 'set.islandPreviewDesc': 'Simulates the island; actual animation follows WinIsland settings',
    'set.islandPreviewBody': 'Code · from SMS',
    'btn.playPreview': 'Play animation',
    'set.islandAnimation': 'Island Animation', 'set.islandAnimationDesc': 'Choose island enter animation: default / fade / slide / scale',
    'anim.default': 'Default (spring)', 'anim.fade': 'Fade', 'anim.slide': 'Slide up', 'anim.scale': 'Scale',
    'set.islandClickAction': 'Island Click Action', 'set.islandClickActionDesc': 'When the island button is clicked: copy the code, or type it into the focused input',
    'click.copy': 'Copy to clipboard', 'click.type': 'Type into focused input',
    'set.islandDisplay': 'Window Display', 'set.islandDisplayDesc': 'Display for the main window (follow mouse or pick one); island display follows the WinIsland window position',
    'display.auto': 'Auto (follow mouse display)',
    'set.checkUpdate': 'Check Update', 'set.checkUpdateDesc': 'Check GitHub for a newer version',
    'set.theme': 'Theme', 'set.themeDesc': 'Dark or light appearance', 'theme.dark': 'Dark', 'theme.light': 'Light',
    'set.language': 'Language', 'set.languageDesc': 'Interface language', 'lang.zh': 'Chinese', 'lang.en': 'English',
    'set.accent': 'Accent Color', 'set.accentDesc': 'Color used for buttons & highlights',
    'set.keep': 'History Limit', 'set.keepDesc': 'Max codes kept in history',
    'set.autoClean': 'Auto Clean (days)', 'set.autoCleanDesc': 'Delete history older than N days (0=off)',
    'btn.settings': 'Settings', 'btn.testIsland': 'Test Island', 'btn.testingIsland': 'Testing…',
    'btn.checkUpdate': 'Check Update', 'btn.save': 'Save Settings',
    'toast.saved': 'Settings saved', 'toast.copied': 'Copied to clipboard',
    'toast.islandOk': 'Pushed to WinIsland', 'toast.islandFail': 'Island failed', 'toast.islandConnFail': 'Island connection failed',
    'toast.islandTestOk': 'Island OK ✓', 'toast.historyCleared': 'History cleared',
    'toast.codeReceived': 'Code received: {code}', 'toast.copiedSync': 'Auto-copied to clipboard',
    'toast.clipboardRestored': 'Clipboard restored', 'toast.autoIslandOk': 'Auto-pushed to island',
    'error.noCode': 'No code yet, receive one first',
    'status.devices': 'Connected devices',
    'status.devicesEmpty': 'No devices online',
    'status.deviceOnline': 'online',
    'status.deviceOffline': 'offline',
  },
};
let lang = 'zh';

function t(key, vars) {
  const dict = I18N[lang] || I18N.zh;
  let out = dict[key] !== undefined ? dict[key] : (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  if (vars) {
    for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(String(vars[k]));
  }
  return out;
}

function applyTheme() {
  document.documentElement.dataset.theme = (settings.ui && settings.ui.theme) || 'dark';
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  if (typeof updateIslandPreview === 'function') updateIslandPreview();
}


/* ---------------- ?????? ---------------- */
function renderDevices(list) {
  devicesCache = list || [];
  const row = els.devicesRow;
  const hint = els.devicesHint;
  if (!row || !hint) return;
  row.innerHTML = '';
  if (devicesCache.length === 0) {
    hint.textContent = t('status.devicesEmpty');
    row.innerHTML = '<span class="device-chip offline">' + t('status.devicesEmpty') + '</span>';
    return;
  }
  const online = devicesCache.filter((d) => d.online).length;
  hint.textContent = online + '/' + devicesCache.length + ' ' + t('status.deviceOnline');
  for (const d of devicesCache) {
    const chip = document.createElement('span');
    chip.className = 'device-chip ' + (d.online ? 'online' : 'offline');
    const extra = [d.platform, d.hostname, d.from].filter(Boolean).join(' · ');
    chip.title = (d.name || d.id) + (extra ? ' · ' + extra : '') + ' · ' + new Date(d.lastSeen).toLocaleTimeString();
    chip.innerHTML = '<span class="device-dot"></span><span>' + escapeHtml(d.name || d.id || '?') + '</span>';
    row.appendChild(chip);
  }
}

/* ---------------- 状态卡片 ---------------- */
function renderStatus(status) {
  if (!status) return;
  if (status.running) {
    els.statusCard.classList.add('running');
    els.statusCard.classList.remove('error');
    els.statusTitle.textContent = t('status.running', { port: status.port });
    els.statusSub.textContent = status.secure ? ('🔒 ' + t('status.secure')) : t('status.sub.running');
  } else if (status.error) {
    els.statusCard.classList.add('error');
    els.statusCard.classList.remove('running');
    els.statusTitle.textContent = t('status.error');
    els.statusSub.textContent = status.error;
  } else {
    els.statusCard.classList.remove('running', 'error');
    els.statusTitle.textContent = t('status.stopped');
    els.statusSub.textContent = t('status.sub.stopped');
  }
  els.ipsRow.innerHTML = '';
  const ips = status.ips || [];
  if (ips.length === 0) {
    els.ipsRow.innerHTML = '<span class="ip-chip">' + t('status.noip') + '</span>';
    return;
  }
  for (const ip of ips) {
    const chip = document.createElement('span');
    chip.className = 'ip-chip';
    chip.title = t('ip.copy');
    chip.textContent = `${ip.name}: ${ip.address}:${status.port || settings.server?.port || 9841}`;
    chip.addEventListener('click', async () => {
      const scheme = status.secure ? 'https' : 'http';
      const text = `${scheme}://${ip.address}:${status.port || settings.server?.port || 9841}`;
      api.writeClipboard(text).then(() => {
        chip.innerHTML = `<span class="copied">✓ ${escapeHtml(t('ip.copied', { url: text }))}</span>`;
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
  els.heroApp.textContent = entry.app || t('history.msg.defaultApp');
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
  els.btnCopyHero.disabled = false;
  els.btnIslandHero.disabled = false;
}

/* ---------------- 统计面板 ---------------- */
function renderStats() {
  const todayKey = new Date().toDateString();
  let today = 0;
  const appCount = new Map();
  for (const c of codes) {
    const d = new Date(c.time);
    const app = (c.app || t('history.msg.defaultApp') || '?').trim();
    if (!Number.isNaN(d.getTime()) && d.toDateString() === todayKey) {
      today++;
      appCount.set(app, (appCount.get(app) || 0) + 1);
    }
  }
  els.statToday.textContent = String(today);
  els.statTotal.textContent = String(codes.length);
  const top = [...appCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length === 0) {
    els.statsApps.innerHTML = '<div class="stats-empty">' + t('stats.empty') + '</div>';
    return;
  }
  const max = top[0][1];
  els.statsApps.innerHTML = '';
  for (const [app, count] of top) {
    const row = document.createElement('div');
    row.className = 'stats-row';
    const pct = Math.round((count / max) * 100);
    row.innerHTML = `
      <span class="stats-app" title="${escapeHtml(app)}">${escapeHtml(app)}</span>
      <div class="stats-bar"><div class="stats-bar-fill" style="width:${pct}%"></div></div>
      <span class="stats-count">${count}</span>
    `;
    els.statsApps.appendChild(row);
  }
}

/* ---------------- 历史列表 ---------------- */
function renderHistory() {
  renderStats();
  const query = searchQuery.trim().toLowerCase();
  const shown = query
    ? codes.filter((c) =>
        (c.code || '').toLowerCase().includes(query) ||
        (c.app || '').toLowerCase().includes(query) ||
        (c.source || '').toLowerCase().includes(query))
    : codes;
  if (codes.length === 0) {
    els.historyList.innerHTML = '<div class="empty-hint">' + t('history.empty') + '</div>';
    return;
  }
  if (shown.length === 0) {
    els.historyList.innerHTML = '<div class="empty-hint">' + t('history.searchEmpty') + '</div>';
    return;
  }
  els.historyList.innerHTML = '';
  for (const entry of shown) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.dataset.id = entry.id;
    card.style.animationDelay = `${Math.min(shown.indexOf(entry) * 40, 300)}ms`;
    card.innerHTML = `
      <div class="history-code">${escapeHtml(entry.code)}</div>
      <div class="history-info">
        <div class="history-app">${escapeHtml(entry.app || t('history.msg.defaultApp'))}</div>
        <div class="history-meta">${escapeHtml(entry.source || '')} · ${fmtFull(entry.time)}${entry.from ? ' · ' + escapeHtml(entry.from) : ''}</div>
      </div>
      <div class="history-actions">
        <button class="mini-btn" data-act="copy" data-id="${entry.id}" title="${t('history.actions.copy')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        </button>
        <button class="mini-btn" data-act="island" data-id="${entry.id}" title="${t('history.actions.island')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>
        </button>
        <button class="mini-btn danger" data-act="remove" data-id="${entry.id}" title="${t('history.actions.remove')}">
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
  const entry = codes.find((c) => c.id === id);
  if (act === 'copy') {
    const ok = await api.copyCode(id);
    if (ok) toast('copy', t('toast.copied'));
  } else if (act === 'island') {
    const res = await api.pushIsland(id);
    if (res && res.ok) toast('island', t('toast.islandOk'));
    else toast('err', (res && res.error) || t('toast.islandFail'));
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
  loadPairQr();
  refreshDisplayOptions();
}
function closeDrawer() {
  els.drawer.classList.remove('open');
  els.drawerScrim.classList.remove('open');
}

async function loadPairQr() {
  try {
    const qr = await api.getPairingQr();
    if (!qr || !qr.dataUrl) return;
    els.pairQr.src = qr.dataUrl;
    const parts = [];
    if (qr.ips && qr.ips.length > 1) parts.push(qr.ips.join(' / '));
    parts.push('Token: ' + (qr.payload.token || t('set.tokenPh')));
    els.pairQrHint.textContent = parts.join(' · ');
  } catch (e) { /* 忽略二维码加载失败 */ }
}

function fillSettingsForm() {
  const s = settings;
  $('#setServerEnabled').checked = !!s.server?.enabled;
  $('#setPort').value = s.server?.port ?? 9841;
  $('#setToken').value = s.server?.token || '';
  $('#setAutoDisplay').checked = !!s.behavior?.autoDisplay;
  $('#setAutoCopy').checked = !!s.behavior?.autoCopy;
  $('#setCopyRestore').value = s.behavior?.autoCopyRestoreSeconds ?? 60;
  $('#setCopyRestoreEnabled').checked = !!s.behavior?.autoCopyRestoreEnabled;
  syncRestoreSecsEnabled();
  $('#setAutoIsland').checked = !!s.behavior?.autoIsland;
  $('#setAutoInput').checked = !!s.behavior?.autoInput;
  $('#setSound').checked = !!s.behavior?.playSound;
  $('#setSystemNotify').checked = !!s.behavior?.systemNotify;
  $('#setAutoLaunch').checked = !!s.behavior?.autoLaunch;
  $('#setClipboardSync').checked = !!s.behavior?.clipboardSync;
  $('#setFilterMode').value = s.behavior?.filterMode || 'off';
  $('#setFilterNumbers').value = s.behavior?.filterNumbers || '';
  $('#setWebhookEnabled').checked = !!s.behavior?.webhookEnabled;
  $('#setWebhookUrl').value = s.behavior?.webhookUrl || '';
  $('#setCommandPath').value = s.behavior?.commandPath || '';
  $('#setCommandArgs').value = s.behavior?.commandArgs || '{code}';
  syncWebhookEnabled();
  $('#setIslandUrl').value = s.island?.baseUrl || 'http://127.0.0.1:9840';
  $('#setIslandToken').value = s.island?.token || '';
  $('#setIslandDuration').value = s.island?.durationSeconds ?? 30;
  $('#setIslandIcon').value = s.island?.icon || '\\uE8D6';
  $('#setIslandTitleStyle').value = s.island?.titleStyle || 'code';
  $('#setIslandShowApp').checked = s.island?.showAppInBody !== false;
  $('#setIslandAnimation').value = s.island?.animation || 'default';
  $('#setIslandClickAction').value = s.island?.clickAction || 'copy';
  $('#setIslandDisplay').value = String(s.island?.displayIndex ?? -1);

  $('#setAccent').value = s.ui?.accent || '#6ea8ff';
  $('#setKeep').value = s.ui?.keepHistory ?? 50;
  $('#setAutoClean').value = s.ui?.autoCleanDays ?? 7;
  $('#setTheme').value = s.ui?.theme || 'dark';
  $('#setLanguage').value = s.ui?.language || 'zh';
  updateIslandPreview();
}

function syncRestoreSecsEnabled() {
  const on = $('#setCopyRestoreEnabled').checked;
  $('#setCopyRestore').disabled = !on;
  if (!on) $('#setCopyRestore').value = $('#setCopyRestore').value || 60;
}
$('#setCopyRestoreEnabled').addEventListener('change', syncRestoreSecsEnabled);
function syncWebhookEnabled() {
  const on = $('#setWebhookEnabled').checked;
  const box = $('#webhookExtra');
  if (box) box.style.display = on ? '' : 'none';
}
$('#setWebhookEnabled').addEventListener('change', syncWebhookEnabled);
$('#setTheme').addEventListener('change', () => {
  settings.ui = settings.ui || {};
  settings.ui.theme = $('#setTheme').value === 'light' ? 'light' : 'dark';
  applyTheme();
});
$('#setLanguage').addEventListener('change', () => {
  settings.ui = settings.ui || {};
  settings.ui.language = $('#setLanguage').value === 'en' ? 'en' : 'zh';
  lang = settings.ui.language;
  applyI18n();
  if (activeHeroId) { const cur = codes.find((c) => c.id === activeHeroId); if (cur) showHero(cur); }
  renderHistory();
});

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
      autoCopyRestoreEnabled: $('#setCopyRestoreEnabled').checked,
      autoCopyRestoreSeconds: clamp(parseInt($('#setCopyRestore').value, 10), 0, 3600),
      autoIsland: $('#setAutoIsland').checked,
      autoInput: $('#setAutoInput').checked,
      playSound: $('#setSound').checked,
      systemNotify: $('#setSystemNotify').checked,
      autoLaunch: $('#setAutoLaunch').checked,
      clipboardSync: $('#setClipboardSync').checked,
      filterMode: $('#setFilterMode').value || 'off',
      filterNumbers: $('#setFilterNumbers').value,
      webhookEnabled: $('#setWebhookEnabled').checked,
      webhookUrl: $('#setWebhookUrl').value.trim(),
      commandPath: $('#setCommandPath').value.trim(),
      commandArgs: $('#setCommandArgs').value.trim() || '{code}',
    },
    island: {
      baseUrl: $('#setIslandUrl').value.trim(),
      token: $('#setIslandToken').value.trim(),
      durationSeconds: clamp(parseInt($('#setIslandDuration').value, 10), 3, 600),
      icon: $('#setIslandIcon').value.trim(),
      titleStyle: $('#setIslandTitleStyle').value || 'code',
      showAppInBody: $('#setIslandShowApp').checked,
      animation: $('#setIslandAnimation').value || 'default',
      clickAction: $('#setIslandClickAction').value === 'type' ? 'type' : 'copy',
      displayIndex: parseInt(els.setIslandDisplay.value, 10) || -1,
    },
    ui: {
      accent: $('#setAccent').value,
      keepHistory: clamp(parseInt($('#setKeep').value, 10), 10, 500),
      autoCleanDays: clamp(parseInt($('#setAutoClean').value, 10), 0, 365),
      theme: $('#setTheme').value === 'light' ? 'light' : 'dark',
      language: $('#setLanguage').value === 'en' ? 'en' : 'zh',
    },
  };
  settings = await api.setSettings(patch);
  lang = (settings.ui && settings.ui.language) || 'zh';
  document.documentElement.style.setProperty('--accent', settings.ui.accent);
  applyTheme();
  applyI18n();
  if (activeHeroId) { const cur = codes.find((c) => c.id === activeHeroId); if (cur) showHero(cur); }
  renderHistory();
  const status = await api.getServerStatus();
  renderStatus(status);
  toast('ok', t('toast.saved'));
  closeDrawer();
}

/* ---------------- 上岛样式 / 动画预览 ---------------- */
function decodeEscape(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function updateIslandPreview() {
  if (!els.ipIcon || !els.ipTitle || !els.ipBody) return;
  const iconRaw = ($('#setIslandIcon').value || '').trim();
  const icon = decodeEscape(iconRaw) || '\u{1F511}';
  const style = $('#setIslandTitleStyle').value || 'code';
  const code = '123456';
  let title = code;
  if (style === 'cn') title = `验证码 ${code}`;
  else if (style === 'en') title = `Code ${code}`;
  els.ipIcon.textContent = icon;
  els.ipTitle.textContent = title;
  els.ipBody.textContent = $('#setIslandShowApp').checked ? t('set.islandPreviewBody') : '验证码';
}
function playIslandPreview() {
  const type = ($('#setIslandAnimation').value || 'default').replace(/[^a-z-]/g, '') || 'default';
  els.islandPreview.classList.remove('anim', 'anim-default', 'anim-fade', 'anim-slide', 'anim-scale');
  void els.islandPreview.offsetWidth; // 强制 reflow 重启动画
  els.islandPreview.classList.add('anim', 'anim-' + type);
}

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

async function refreshDisplayOptions() {
  if (!els.setIslandDisplay) return;
  let list = [];
  try { list = (await api.listDisplays()) || []; } catch { list = []; }
  const current = els.setIslandDisplay.value;
  els.setIslandDisplay.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = '-1';
  auto.textContent = t('display.auto');
  els.setIslandDisplay.appendChild(auto);
  (list || []).forEach((d) => {
    const opt = document.createElement('option');
    opt.value = String(d.index);
    opt.textContent = d.label + (d.primary ? '（主屏）' : '') + ' · ' + d.workArea.width + '×' + d.workArea.height;
    els.setIslandDisplay.appendChild(opt);
  });
  if (current && els.setIslandDisplay.querySelector('option[value="' + current + '"]')) {
    els.setIslandDisplay.value = current;
  } else {
    els.setIslandDisplay.value = '-1';
  }
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
  els.btnTestIsland.textContent = t('btn.testingIsland');
  els.btnTestIsland.disabled = true;
  // 用一个占位验证码测试上岛
  await api.setSettings({
    island: {
      baseUrl: $('#setIslandUrl').value.trim(),
      token: $('#setIslandToken').value.trim(),
      durationSeconds: clamp(parseInt($('#setIslandDuration').value, 10), 3, 600),
    },
  });
  const res = await api.pushIsland('last').catch(() => ({ ok: false, error: t('error.noCode') }));
  els.btnTestIsland.textContent = t('btn.testIsland');
  els.btnTestIsland.disabled = false;
  if (res && res.ok) toast('island', t('toast.islandTestOk'));
  else toast('err', (res && res.error) || t('toast.islandConnFail'));
});
els.btnTestWebhook.addEventListener('click', async () => {
  await api.setSettings({
    behavior: {
      webhookUrl: $('#setWebhookUrl').value.trim(),
      commandPath: $('#setCommandPath').value.trim(),
      commandArgs: $('#setCommandArgs').value.trim() || '{code}',
    },
  });
  await api.testWebhook();
  toast('ok', t('toast.webhookTestOk'));
});
els.btnRefreshQr.addEventListener('click', loadPairQr);
$('#setIslandIcon').addEventListener('input', updateIslandPreview);
$('#setIslandTitleStyle').addEventListener('change', updateIslandPreview);
$('#setIslandShowApp').addEventListener('change', updateIslandPreview);
$('#setIslandAnimation').addEventListener('change', playIslandPreview);
els.islandIconPresets.addEventListener('click', (e) => {
  const btn = e.target.closest('.icon-preset');
  if (!btn) return;
  $('#setIslandIcon').value = btn.dataset.icon || '';
  updateIslandPreview();
});
els.btnPlayPreview.addEventListener('click', playIslandPreview);
els.historySearch.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderHistory();
});
els.btnClearHistory.addEventListener('click', async () => {
  await api.clearCodes();
  codes = [];
  showEmpty();
  renderHistory();
  toast('ok', t('toast.historyCleared'));
});
els.btnCopyHero.addEventListener('click', () => handleAction('copy', activeHeroId));
els.btnIslandHero.addEventListener('click', () => handleAction('island', activeHeroId));
els.btnClearHero.addEventListener('click', () => handleAction('remove', activeHeroId));

/* ---------------- 更新 ---------------- */
api.on('update:result', (r) => {
  if (!r) return;
  if (r.type === 'available' && r.info) {
    updateInfo = r.info;
    els.updateTitle.textContent = t('update.available', { version: r.info.version });
    els.updateNotes.textContent = r.info.notes || t('update.clickDownload');
    els.updateBanner.classList.remove('hidden');
  } else if (r.type === 'latest') {
    toast('ok', t('update.latest'));
  } else {
    toast('err', t('update.failed'));
  }
});
els.btnUpdateDownload.addEventListener('click', () => {
  if (updateInfo) { const u = updateInfo.downloadUrl || updateInfo.url; if (u) api.openExternal(u); }
});
els.btnUpdateDismiss.addEventListener('click', () => els.updateBanner.classList.add('hidden'));
els.btnCheckUpdate.addEventListener('click', () => {
  toast('ok', t('update.checking'));
  api.checkUpdate();
});

/* 键盘：Esc 关闭抽屉 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});


/* ---------------- 主进程事件 ---------------- */
api.on('code:new', (entry) => {
  codes.unshift(entry);
  if (settings.behavior?.autoDisplay !== false) {
    showHero(entry);
    toast('ok', t('toast.codeReceived', { code: entry.code }));
  }
  renderHistory();
});

api.on('server:status', (status) => renderStatus(status));

api.on('device:status', (list) => renderDevices(list));

api.on('action:notice', (notice) => {
  const kindMap = { copy: 'copy', island: 'island', error: 'err', input: 'ok' };
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
  lang = (settings.ui && settings.ui.language) || 'zh';
  document.documentElement.style.setProperty('--accent', settings.ui?.accent || '#6ea8ff');
  applyTheme();
  applyI18n();
  codes = await api.listCodes();
  if (codes.length > 0) showHero(codes[0]);
  renderHistory();
  const status = await api.getServerStatus();
  renderStatus(status);
  const devices = await api.listDevices().catch(() => []);
  renderDevices(devices);
})();


