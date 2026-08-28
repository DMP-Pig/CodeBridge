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
  heroType: $('#heroType'),
  heroCode: $('#heroCode'),
  btnCopyHero: $('#btnCopyHero'),
  btnIslandHero: $('#btnIslandHero'),
  btnClearHero: $('#btnClearHero'),
  historyList: $('#historyList'),
  statToday: $('#statToday'),
  statTotal: $('#statTotal'),
  statsApps: $('#statsApps'),
  statsTrend: $('#statsTrend'),
  historySearch: $('#historySearch'),
  devicesRow: $('#devicesRow'),
  devicesHint: $('#devicesHint'),
  healthWrap: $('#healthWrap'),
  healthGrid: $('#healthGrid'),
  healthHint: $('#healthHint'),
  btnClearHistory: $('#btnClearHistory'),
  btnExportCsv: $('#btnExportCsv'),
  btnExportJson: $('#btnExportJson'),
  btnImportHistory: $('#btnImportHistory'),
  btnShareSummary: $('#btnShareSummary'),
  btnReportWeek: $('#btnReportWeek'),
  btnReportMonth: $('#btnReportMonth'),
  btnCopyReport: $('#btnCopyReport'),
  btnExportReport: $('#btnExportReport'),
  reportOutput: $('#reportOutput'),
  clipboardHistoryList: $('#clipboardHistoryList'),
  btnClearClipboardHistory: $('#btnClearClipboardHistory'),
  setClipboardHistory: $('#setClipboardHistory'),
  setClipboardHistoryMax: $('#setClipboardHistoryMax'),
  drawer: $('#drawer'),
  drawerScrim: $('#drawerScrim'),
  drawerClose: $('#drawerClose'),
  btnSettings: $('#btnSettings'),
  btnSaveSettings: $('#btnSaveSettings'),
  platformTemplatesList: $('#platformTemplatesList'),
  btnAddPlatformTemplate: $('#btnAddPlatformTemplate'),
  btnTestIsland: $('#btnTestIsland'),
  setIslandTitleStyle: $('#setIslandTitleStyle'),
  setIslandShowApp: $('#setIslandShowApp'),
  setIslandTypeBadge: $('#setIslandTypeBadge'),
  setIslandAnimation: $('#setIslandAnimation'),
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
  heroExpiry: $('#heroExpiry'),
  setCodeExpiry: $('#setCodeExpiry'),
  setCodeDefaultExpiry: $('#setCodeDefaultExpiry'),
  codeExpiryExtra: $('#codeExpiryExtra'),
  setDedupe: $('#setDedupe'),
  setDedupeSeconds: $('#setDedupeSeconds'),
  dedupeExtra: $('#dedupeExtra'),
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
  btnGetPairCode: $('#btnGetPairCode'),
  pairCodeWrap: $('#pairCodeWrap'),
  pairCodeValue: $('#pairCodeValue'),
  pairCodeCountdown: $('#pairCodeCountdown'),
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

/* ---------------- 验证码有效期 ---------------- */
function entryRemainMs(entry) {
  if (!entry || !entry.expiresAt) return null;
  return entry.expiresAt - Date.now();
}
function isEntryExpired(entry) {
  const ms = entryRemainMs(entry);
  return ms !== null && ms <= 0;
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil((ms || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function expiryBadgeText(entry) {
  const ms = entryRemainMs(entry);
  if (ms === null) return '';
  return ms <= 0 ? t('code.expired') : `⏱ ${fmtCountdown(ms)}`;
}
function updateHeroExpiry(entry) {
  if (!entry) return;
  const ms = entryRemainMs(entry);
  if (ms === null) {
    els.heroExpiry.classList.add('hidden');
    els.heroExpiry.textContent = '';
    els.heroContent.classList.remove('expired');
    els.btnCopyHero.disabled = false;
    els.btnIslandHero.disabled = false;
    return;
  }
  els.heroExpiry.classList.remove('hidden');
  els.heroExpiry.textContent = expiryBadgeText(entry);
  const expired = ms <= 0;
  els.heroContent.classList.toggle('expired', expired);
  els.btnCopyHero.disabled = expired;
  els.btnIslandHero.disabled = expired;
}
function tickExpiry() {
  if (activeHeroId) {
    const cur = codes.find((c) => c.id === activeHeroId);
    if (cur) updateHeroExpiry(cur);
  }
  document.querySelectorAll('.history-card').forEach((card) => {
    const e = codes.find((c) => c.id === card.dataset.id);
    if (!e) return;
    const badge = card.querySelector('.history-expiry');
    const ms = entryRemainMs(e);
    if (badge) {
      badge.textContent = expiryBadgeText(e);
      badge.classList.toggle('hidden', ms === null);
      badge.classList.toggle('expiring', ms !== null && ms <= 60000);
    }
    card.classList.toggle('expired', isEntryExpired(e));
  });
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
    'history.exportCsv': '导出 CSV', 'history.exportJson': '导出 JSON', 'history.import': '导入',
    'toast.exportOk': '已导出历史记录', 'toast.exportErr': '导出失败或已取消',
    'toast.importOk': '导入完成：新增 {a} 条 / 跳过 {s} 条', 'toast.importErr': '导入失败',
    'stats.title': '验证码统计', 'stats.trend': '近 7 天趋势', 'stats.today': '今日', 'stats.total': '累计', 'stats.dist': '今日来源分布', 'stats.empty': '今日暂无数据',
    'history.empty': '暂无历史记录',
    'history.searchPh': '搜索验证码 / 应用 / 来源…', 'history.searchEmpty': '无匹配结果', 'history.cached': '补发',
    'history.actions.copy': '复制到剪贴板', 'history.actions.island': '推送到 WinIsland 灵动岛', 'history.actions.remove': '移除',
    'history.today': '今天', 'history.yesterday': '昨天', 'history.earlier': '更早', 'history.shareSummary': '复制摘要',
    'stats.reportTitle': '统计报告', 'stats.reportWeek': '周报', 'stats.reportMonth': '月报', 'stats.copyReport': '复制报告', 'stats.reportExportCsv': '导出报告 CSV', 'stats.reportExported': '报告已导出', 'stats.reportEmpty': '选择周期生成来源 / 类型汇总', 'stats.reportApps': '来源 TOP', 'stats.reportTypes': '类型分布', 'stats.reportDaily': '每日数量', 'stats.reportNone': '暂无数据', 'stats.reportCopied': '报告已复制',
    'toast.shareSummary': '历史摘要已复制',
    'toast.qrFail': '二维码生成失败，请重试',
    'drawer.title': '设置',
    'group.lan': '局域网服务', 'group.after': '收到验证码后', 'group.island': 'WinIsland 上岛', 'group.ui': '界面',
    'group.platformTemplates': '平台模板库', 'group.platformTemplatesDesc': '为常见平台预设验证码类型与上岛样式：收到的验证码按来源自动匹配模板',
    'btn.addPlatformTemplate': '添加模板',
    'pt.name': '模板名称', 'pt.namePh': '如 淘宝', 'pt.match': '匹配关键词', 'pt.matchPh': '逗号分隔，如 淘宝,天猫', 'pt.icon': '图标', 'pt.titleStyle': '标题样式', 'pt.styleDefault': '跟随全局', 'pt.codeType': '验证码类型', 'pt.typeNone': '自动识别', 'pt.enabled': '启用', 'pt.delete': '删除模板',
    'set.serverEnabled': '启用服务', 'set.serverEnabledDesc': '开启后手机可通过局域网发送验证码',
    'set.port': '监听端口', 'set.portDesc': '修改后服务自动重启',
    'set.token': '访问令牌 Token', 'set.tokenDesc': '手机端需携带相同 Token，防止局域网误连', 'set.tokenPh': '留空则不校验',
    'set.pair': '扫码配对', 'set.pairDesc': '手机打开 CodeBridge 点「扫码配对」扫一扫，自动填入地址与令牌', 'set.pairRefresh': '刷新二维码', 'set.pairCode': '临时授权码', 'set.pairCodeDesc': '生成 6 位授权码（30 秒有效），手机端输入后自动配对', 'btn.getPairCode': '生成授权码', 'pair.codeGenerated': '已生成授权码', 'pair.codeExpire': '有效期：',
    'set.relayEnabled': '公网加密中继', 'set.relayEnabledDesc': '手机与 PC 不在同一局域网时，通过加密中继转发验证码',
    'set.relayUrl': '中继地址', 'set.relayUrlDesc': '需部署 relay-server；如 https://relay.example.com',
    'set.relayRoom': '房间名', 'set.relayRoomDesc': '两端填写相同，建议随机字符串',
    'set.relayToken': '中继密钥', 'set.relayTokenDesc': '两端填写相同；只发送哈希给中继，消息端到端加密',
    'set.e2eKey': '端到端加密密钥', 'set.e2eKeyDesc': '选填；手机端填写相同密钥后，局域网消息使用 AES-256-GCM 端到端加密（中继通道本身已加密）',
    'set.autoDisplay': '自动展示', 'set.autoDisplayDesc': '收到后弹出悬浮提示并置顶展示',
    'set.autoCopy': '自动复制', 'set.autoCopyDesc': '收到后立即复制到剪贴板',
    'set.copyRestore': '复制后恢复原剪贴板', 'set.copyRestoreDesc': '复制验证码后，过一段时间自动恢复为之前的剪贴板内容',
    'set.copyRestoreSecs': '恢复时间（秒）', 'set.copyRestoreSecsDesc': '复制验证码 N 秒后恢复原剪贴板',
    'set.autoIsland': '自动上岛', 'set.autoIslandDesc': '收到后自动推送到 WinIsland 灵动岛',
    'set.sound': '提示音', 'set.soundDesc': '收到验证码时播放系统提示音',
    'set.systemNotify': '系统通知', 'set.systemNotifyDesc': '收到验证码时发送 Windows/macOS 系统通知',
    'set.notifyActions': '通知操作按钮', 'set.notifyActionsDesc': '系统通知直接带「复制 / 上岛 / 忽略」按钮',
    'set.floatWindow': '验证码悬浮窗', 'set.floatWindowDesc': '收到验证码时在屏幕角落置顶显示悬浮窗',
    'set.floatWindowPos': '悬浮窗位置', 'set.floatWindowPosDesc': '悬浮窗在屏幕中的位置',
    'pos.topRight': '右上角', 'pos.topLeft': '左上角', 'pos.bottomRight': '右下角', 'pos.bottomLeft': '左下角',
    'set.floatWindowSeconds': '自动隐藏（秒）', 'set.floatWindowSecondsDesc': '显示 N 秒后自动隐藏（0=不自动隐藏）',
        'set.autoLaunch': '开机自启', 'set.autoLaunchDesc': '系统登录时自动启动 CodeBridge 并后台运行',
        'set.clipboardHistory': '剪贴板历史', 'set.clipboardHistoryDesc': '记录本机剪贴板变化，可一键回拷', 'set.clipboardHistoryMax': '保留条数', 'set.clipboardHistoryMaxDesc': '剪贴板历史最多保留的条数', 'clipboardHistory.title': '剪贴板历史', 'clipboardHistory.empty': '暂无剪贴板记录', 'clipboardHistory.auto': '自动复制', 'clipboardHistory.copied': '已复制到剪贴板', 'clipboardHistory.clear': '清空', 'clipboardHistory.del': '删除', 'clipboardHistory.open': '点击回拷',
        'set.filterMode': '来源过滤器', 'set.filterModeDesc': '按发件号码或来源应用允许/拦截验证码',
        'filter.off': '关闭', 'filter.whitelist': '仅允许列表中的来源', 'filter.blacklist': '拦截列表中的来源',
        'set.filterNumbers': '来源列表', 'set.filterNumbersDesc': '每行一个：号码前缀或应用名（如 10086、淘宝）',
        'set.codeExpiry': '有效期识别', 'set.codeExpiryDesc': '识别短信中的有效期，历史与悬浮窗显示倒计时，过期自动灰显',
        'set.codeDefaultExpiry': '默认有效期（秒）', 'set.codeDefaultExpiryDesc': '未识别到有效期时使用的默认秒数（0=不自动过期）',
        'set.dedupe': '重复防刷屏', 'set.dedupeDesc': '同一验证码短时间内重复收到时合并提示，不重复上岛/复制',
        'set.dedupeSeconds': '防刷屏窗口（秒）', 'set.dedupeSecondsDesc': '窗口内相同验证码视为重复（0=关闭）',
        'code.expired': '已过期',
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
    'set.islandTypeBadge': '上岛标注验证码类型', 'set.islandTypeBadgeDesc': '登录/注册/支付等验证码在上岛卡片标题与正文中标明类型',
    'set.islandIconPreset': '图标快捷选择', 'set.islandIconPresetDesc': '点击填入上方图标输入框',
    'set.islandPreview': '上岛动画预览', 'set.islandPreviewDesc': '模拟灵动岛展示效果；实际动画以 WinIsland 设置为准',
    'set.islandPreviewBody': '验证码 · 来自 短信',
    'btn.playPreview': '播放动画',
    'set.islandAnimation': '上岛动画', 'set.islandAnimationDesc': '选择上岛进入动画：默认 / 淡入 / 滑动 / 缩放',
    'anim.default': '默认（弹性缩放）', 'anim.fade': '淡入',
    'set.islandDisplay': '窗口显示屏幕', 'set.islandDisplayDesc': '主窗口打开的屏幕（跟随鼠标或指定显示器）；灵动岛实际屏幕由 WinIsland 窗口位置决定',
    'display.auto': '自动（跟随鼠标所在屏幕）',
'anim.slide': '底部滑入', 'anim.scale': '轻微缩放',
    'set.checkUpdate': '检查更新', 'set.checkUpdateDesc': '检查 GitHub 上是否有新版本',
    'set.theme': '主题', 'set.themeDesc': '深色/浅色/跟随系统显示模式', 'theme.dark': '深色', 'theme.light': '浅色', 'theme.system': '跟随系统',
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
    'health.title': '连接健康',
    'health.hint': '服务运行状态一览',
    'health.uptime': '运行时长',
    'health.received': '收到验证码',
    'health.blocked': '已拦截',
    'health.relayMsg': '中继消息',
    'health.relayOn': '中继已启用',
    'health.relayOff': '中继未启用',
    'health.relayOk': '最近成功',
    'health.relayErr': '最近错误',
    'health.never': '暂无记录',
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
    'history.exportCsv': 'Export CSV', 'history.exportJson': 'Export JSON', 'history.import': 'Import',
    'toast.exportOk': 'History exported', 'toast.exportErr': 'Export failed or canceled',
    'toast.importOk': 'Import done: {a} added / {s} skipped', 'toast.importErr': 'Import failed',
    'stats.title': 'Statistics', 'stats.trend': '7-day trend', 'stats.today': 'Today', 'stats.total': 'Total', 'stats.dist': "Today's sources", 'stats.empty': 'No data today',
    'history.empty': 'No history yet',
    'history.searchPh': 'Search code / app / source…', 'history.searchEmpty': 'No matches', 'history.cached': 'Resent',
    'history.actions.copy': 'Copy to clipboard', 'history.actions.island': 'Push to WinIsland', 'history.actions.remove': 'Remove',
    'history.today': 'Today', 'history.yesterday': 'Yesterday', 'history.earlier': 'Earlier', 'history.shareSummary': 'Copy Summary',
    'stats.reportTitle': 'Statistics Report', 'stats.reportWeek': 'Weekly', 'stats.reportMonth': 'Monthly', 'stats.copyReport': 'Copy Report', 'stats.reportExportCsv': 'Export report CSV', 'stats.reportExported': 'Report exported', 'stats.reportEmpty': 'Pick a period to summarize sources / types', 'stats.reportApps': 'Top sources', 'stats.reportTypes': 'Type distribution', 'stats.reportDaily': 'Per day', 'stats.reportNone': 'No data', 'stats.reportCopied': 'Report copied',
    'toast.shareSummary': 'History summary copied',
    'toast.qrFail': 'Failed to generate QR code, please retry',
    'drawer.title': 'Settings',
    'group.lan': 'LAN Service', 'group.after': 'After receiving a code', 'group.island': 'WinIsland Island', 'group.ui': 'UI',
    'group.platformTemplates': 'Platform Templates', 'group.platformTemplatesDesc': 'Preset code type & island style per source: incoming codes auto-match templates by app/sender',
    'btn.addPlatformTemplate': 'Add Template',
    'pt.name': 'Template name', 'pt.namePh': 'e.g. Taobao', 'pt.match': 'Match keywords', 'pt.matchPh': 'Comma separated, e.g. taobao,tmall', 'pt.icon': 'Icon', 'pt.titleStyle': 'Title style', 'pt.styleDefault': 'Follow global', 'pt.codeType': 'Code type', 'pt.typeNone': 'Auto detect', 'pt.enabled': 'Enabled', 'pt.delete': 'Delete template',
    'set.serverEnabled': 'Enable Service', 'set.serverEnabledDesc': 'Phone can send codes over LAN when enabled',
    'set.port': 'Port', 'set.portDesc': 'Service restarts automatically',
    'set.token': 'Access Token', 'set.tokenDesc': 'Phone must use the same token to prevent wrong connections', 'set.tokenPh': 'Empty = no token check',
    'set.pair': 'QR Pairing', 'set.pairDesc': 'Open CodeBridge on your phone, tap "Scan QR" and scan to auto-fill address & token', 'set.pairRefresh': 'Refresh QR', 'set.pairCode': 'Pairing Code', 'set.pairCodeDesc': 'Generate a 6-digit code (valid 30s); enter it on your phone to pair automatically', 'btn.getPairCode': 'Get Pairing Code', 'pair.codeGenerated': 'Pairing code generated', 'pair.codeExpire': 'Valid for: ',
    'set.relayEnabled': 'Public encrypted relay', 'set.relayEnabledDesc': 'Forward codes via encrypted relay when phone & PC are not on the same LAN',
    'set.relayUrl': 'Relay URL', 'set.relayUrlDesc': 'Deploy relay-server; e.g. https://relay.example.com',
    'set.relayRoom': 'Room name', 'set.relayRoomDesc': 'Same on both ends; use a random string',
    'set.relayToken': 'Relay key', 'set.relayTokenDesc': 'Same on both ends; only its hash is sent, messages are end-to-end encrypted',
    'set.e2eKey': 'E2E encryption key', 'set.e2eKeyDesc': 'Optional; when the same key is set on the phone, LAN messages are AES-256-GCM encrypted end-to-end (relay channel is already E2E)',
    'set.autoDisplay': 'Auto Display', 'set.autoDisplayDesc': 'Show a floating alert on arrival',
    'set.autoCopy': 'Auto Copy', 'set.autoCopyDesc': 'Copy to clipboard immediately',
    'set.copyRestore': 'Restore Original Clipboard', 'set.copyRestoreDesc': 'Restore previous clipboard content after a delay',
    'set.copyRestoreSecs': 'Restore After (s)', 'set.copyRestoreSecsDesc': 'Seconds before restoring original clipboard',
    'set.autoIsland': 'Auto Island', 'set.autoIslandDesc': 'Push to WinIsland automatically',
    'set.sound': 'Sound', 'set.soundDesc': 'Play system beep on arrival',
    'set.systemNotify': 'System Notification', 'set.systemNotifyDesc': 'Send a system notification on arrival',
    'set.notifyActions': 'Notification Action Buttons', 'set.notifyActionsDesc': 'Show Copy / Island / Ignore buttons right in the notification',
    'set.floatWindow': 'Code Floating Window', 'set.floatWindowDesc': 'Show an always-on-top mini window with the latest code',
    'set.floatWindowPos': 'Window Position', 'set.floatWindowPosDesc': 'Corner of the screen where the mini window appears',
    'pos.topRight': 'Top-right', 'pos.topLeft': 'Top-left', 'pos.bottomRight': 'Bottom-right', 'pos.bottomLeft': 'Bottom-left',
    'set.floatWindowSeconds': 'Auto-hide after (s)', 'set.floatWindowSecondsDesc': 'Hide after N seconds (0 = keep visible)',
        'set.autoLaunch': 'Launch at Login', 'set.autoLaunchDesc': 'Start CodeBridge in the background at system login',
        'set.clipboardHistory': 'Clipboard History', 'set.clipboardHistoryDesc': 'Record PC clipboard changes for one-click re-copy', 'set.clipboardHistoryMax': 'Max Entries', 'set.clipboardHistoryMaxDesc': 'Maximum clipboard history entries to keep', 'clipboardHistory.title': 'Clipboard History', 'clipboardHistory.empty': 'No clipboard entries', 'clipboardHistory.auto': 'Auto', 'clipboardHistory.copied': 'Copied to clipboard', 'clipboardHistory.clear': 'Clear', 'clipboardHistory.del': 'Delete', 'clipboardHistory.open': 'Click to re-copy',
        'set.filterMode': 'Source Filter', 'set.filterModeDesc': 'Allow or block codes by sender number or source app',
        'filter.off': 'Off', 'filter.whitelist': 'Allow only listed sources', 'filter.blacklist': 'Block listed sources',
        'set.filterNumbers': 'Source List', 'set.filterNumbersDesc': 'One per line: number prefix or app name (e.g. 10086, Taobao)',
        'set.codeExpiry': 'Code Expiry', 'set.codeExpiryDesc': 'Detect expiry from SMS; history & floating window show countdown, expired items gray out',
        'set.codeDefaultExpiry': 'Default expiry (s)', 'set.codeDefaultExpiryDesc': 'Fallback seconds when no expiry is detected (0 = no auto-expiry)',
        'set.dedupe': 'Deduplicate Codes', 'set.dedupeDesc': 'Merge notices when the same code arrives twice in a short time; no repeated island/copy',
        'set.dedupeSeconds': 'Dedupe Window (s)', 'set.dedupeSecondsDesc': 'Same code within this window is treated as duplicate (0=off)',
        'code.expired': 'Expired',
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
    'set.islandTypeBadge': 'Show code type on island', 'set.islandTypeBadgeDesc': 'Mark login/register/payment etc. type on the island title and body',
    'set.islandIconPreset': 'Icon presets', 'set.islandIconPresetDesc': 'Click to fill the icon input',
    'set.islandPreview': 'Island animation preview', 'set.islandPreviewDesc': 'Simulates the island; actual animation follows WinIsland settings',
    'set.islandPreviewBody': 'Code · from SMS',
    'btn.playPreview': 'Play animation',
    'set.islandAnimation': 'Island Animation', 'set.islandAnimationDesc': 'Choose island enter animation: default / fade / slide / scale',
    'anim.default': 'Default (spring)', 'anim.fade': 'Fade', 'anim.slide': 'Slide up', 'anim.scale': 'Scale',
    'set.islandDisplay': 'Window Display', 'set.islandDisplayDesc': 'Display for the main window (follow mouse or pick one); island display follows the WinIsland window position',
    'display.auto': 'Auto (follow mouse display)',
    'set.checkUpdate': 'Check Update', 'set.checkUpdateDesc': 'Check GitHub for a newer version',
    'set.theme': 'Theme', 'set.themeDesc': 'Dark, light or follow system', 'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.system': 'Follow system',
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
    'health.title': 'Connection Health',
    'health.hint': 'Live service status',
    'health.uptime': 'Uptime',
    'health.received': 'Codes received',
    'health.blocked': 'Blocked',
    'health.relayMsg': 'Relay msgs',
    'health.relayOn': 'Relay enabled',
    'health.relayOff': 'Relay off',
    'health.relayOk': 'Last OK',
    'health.relayErr': 'Last error',
    'health.never': 'No record',
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

function systemPrefersDark() {
  return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function resolveTheme() {
  const th = (settings.ui && settings.ui.theme) || 'dark';
  if (th === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return th;
}
function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme();
}
if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onScheme = () => { if ((settings.ui && settings.ui.theme) === 'system') applyTheme(); };
  if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
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
/* ---------------- 验证码类型 ---------------- */
const CODE_TYPES = {
  login:    { zh: '登录', en: 'Login',    cls: 'type-login' },
  register: { zh: '注册', en: 'Register', cls: 'type-register' },
  payment:  { zh: '支付', en: 'Payment',  cls: 'type-payment' },
  unlock:   { zh: '解锁', en: 'Unlock',   cls: 'type-unlock' },
  other:    { zh: '验证', en: 'Code',     cls: 'type-other' },
};
function codeTypeInfo(ct) {
  const k = String(ct || '').toLowerCase();
  return CODE_TYPES[k] || null;
}
function codeTypeBadgeHtml(entry) {
  const m = codeTypeInfo(entry && entry.codeType);
  if (!m) return '';
  const label = lang === 'en' ? m.en : m.zh;
  return '<span class="history-type ' + m.cls + '">' + escapeHtml(label) + '</span>';
}

function showHero(entry) {
  activeHeroId = entry.id;
  els.heroEmpty.classList.add('hidden');
  els.heroContent.classList.remove('hidden');
  els.heroApp.textContent = entry.app || t('history.msg.defaultApp');
  els.heroSource.textContent = entry.source || '';
  els.heroTime.textContent = fmtTime(entry.time);
  const tm = codeTypeInfo(entry.codeType);
  if (tm) {
    els.heroType.textContent = lang === 'en' ? tm.en : tm.zh;
    els.heroType.className = 'hero-type ' + tm.cls;
  } else {
    els.heroType.textContent = '';
    els.heroType.className = 'hero-type hidden';
  }
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
  updateHeroExpiry(entry);
}

function showEmpty() {
  activeHeroId = null;
  els.heroEmpty.classList.remove('hidden');
  els.heroContent.classList.add('hidden');
  els.btnCopyHero.disabled = false;
  els.btnIslandHero.disabled = false;
  els.heroType.className = 'hero-type hidden';
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
  // 近 7 天趋势（柱状图）
  const nowDt = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowDt.getFullYear(), nowDt.getMonth(), nowDt.getDate() - i);
    days.push({ date: d, key: d.toDateString(), count: 0 });
  }
  const dayMap = new Map(days.map((x) => [x.key, x]));
  for (const c of codes) {
    const dd = new Date(c.time);
    if (!Number.isNaN(dd.getTime()) && dayMap.has(dd.toDateString())) dayMap.get(dd.toDateString()).count++;
  }
  const maxDay = Math.max(1, ...days.map((x) => x.count));
  els.statsTrend.innerHTML = '';
  const todayKeyStr = nowDt.toDateString();
  for (const day of days) {
    const col = document.createElement('div');
    col.className = 'trend-col' + (day.key === todayKeyStr ? ' today' : '');
    const pct = day.count ? Math.max(6, Math.round((day.count / maxDay) * 100)) : 2;
    const md = (day.date.getMonth() + 1) + '/' + day.date.getDate();
    col.title = md + ' · ' + day.count;
    col.innerHTML = '<div class="trend-count">' + (day.count || '') + '</div>' +
      '<div class="trend-bar-wrap"><div class="trend-bar" style="height:' + pct + '%"></div></div>' +
      '<div class="trend-label">' + md + '</div>';
    els.statsTrend.appendChild(col);
  }

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
  let lastGroup = '';
  for (const entry of shown) {
    const g = dayGroupKey(entry.time);
    if (g !== lastGroup) {
      const head = document.createElement('div');
      head.className = 'history-group';
      head.textContent = t('history.' + g);
      els.historyList.appendChild(head);
      lastGroup = g;
    }
    const card = document.createElement('div');
    card.className = 'history-card' + (isEntryExpired(entry) ? ' expired' : '');
    card.dataset.id = entry.id;
    card.style.animationDelay = `${Math.min(shown.indexOf(entry) * 40, 300)}ms`;
    card.innerHTML = `
      <div class="history-code">${escapeHtml(entry.code)}</div>
      <div class="history-info">
        <div class="history-app">${escapeHtml(entry.app || t('history.msg.defaultApp'))}${codeTypeBadgeHtml(entry)}${entry.cacheSent ? '<span class="history-badge">' + t('history.cached') + '</span>' : ''}</div>
        <div class="history-meta">${escapeHtml(entry.source || '')}${entry.deviceName ? ' · ' + escapeHtml(entry.deviceName) : ''} · ${fmtFull(entry.time)}${entry.from ? ' · ' + escapeHtml(entry.from) : ''}</div>
        ${entryRemainMs(entry) === null ? '' : `<span class="history-expiry">${expiryBadgeText(entry)}</span>`}
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
  if (!entry) return;
  if ((act === 'copy' || act === 'island') && isEntryExpired(entry)) {
    toast('err', t('code.expired'));
    return;
  }
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

/* ---------------- 历史分组 ---------------- */
function dayGroupKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'earlier';
  const now = new Date();
  const st = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === st) return 'today';
  if (t === st - 86400000) return 'yesterday';
  return 'earlier';
}

/* ---------------- 统计报告（周报 / 月报） ---------------- */
let currentReportMeta = null;
function generateReport(days, labelKey) {
  currentReportMeta = { days, labelKey };
  renderReportArea();
}
function renderReportArea() {
  if (!els.reportOutput) return;
  if (!currentReportMeta) {
    els.reportOutput.textContent = t('stats.reportEmpty');
    return;
  }
  const meta = currentReportMeta;
  const since = Date.now() - meta.days * 86400000;
  const fmtD = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };
  const list = codes.filter((c) => {
    const ts = new Date(c.time).getTime();
    return !Number.isNaN(ts) && ts >= since;
  });
  const perApp = new Map();
  const perType = new Map();
  const perDay = new Map();
  for (const c of list) {
    const app = (c.app || t('history.msg.defaultApp') || '?').trim();
    perApp.set(app, (perApp.get(app) || 0) + 1);
    const tm = codeTypeInfo(c.codeType);
    const tk = tm ? (lang === 'en' ? tm.en : tm.zh) : t('pt.typeNone');
    perType.set(tk, (perType.get(tk) || 0) + 1);
    const d = new Date(c.time);
    const dk = (d.getMonth() + 1) + '/' + d.getDate();
    perDay.set(dk, (perDay.get(dk) || 0) + 1);
  }
  const frag = document.createDocumentFragment();
  const add = (cls, text) => {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    frag.appendChild(el);
  };
  add('report-line report-headline', t(meta.labelKey) + ' · ' + fmtD(since) + ' - ' + fmtD(Date.now()) + ' · ' + list.length);
  const topApps = [...perApp.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  if (topApps.length) {
    add('report-sub', t('stats.reportApps') + ':');
    for (const [app, n] of topApps) add('report-line', '  ' + app + ' × ' + n);
  } else {
    add('report-line', t('stats.reportNone'));
  }
  const types = [...perType.entries()].sort((x, y) => y[1] - x[1]);
  if (types.length) {
    add('report-sub', t('stats.reportTypes') + ':');
    for (const [k, n] of types) add('report-line', '  ' + k + ' × ' + n);
  }
  const daysArr = [...perDay.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1));
  if (daysArr.length) {
    add('report-sub', t('stats.reportDaily') + ':');
    for (const [k, n] of daysArr) add('report-line', '  ' + k + ' · ' + n);
  }
  els.reportOutput.innerHTML = '';
  els.reportOutput.appendChild(frag);
}
function reportSummaryText() {
  if (!currentReportMeta) return '';
  const meta = currentReportMeta;
  const since = Date.now() - meta.days * 86400000;
  const fmtD = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };
  const list = codes.filter((c) => {
    const ts = new Date(c.time).getTime();
    return !Number.isNaN(ts) && ts >= since;
  });
  const lines = [];
  lines.push(t(meta.labelKey) + ' · ' + fmtD(since) + ' - ' + fmtD(Date.now()) + ' · ' + list.length);
  const perApp = new Map();
  for (const c of list) {
    const app = (c.app || t('history.msg.defaultApp') || '?').trim();
    perApp.set(app, (perApp.get(app) || 0) + 1);
  }
  const topApps = [...perApp.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  lines.push(t('stats.reportApps') + ':');
  for (const [app, n] of topApps) lines.push('  ' + app + ' × ' + n);
  return lines.join('\n');
}
async function copyReport() {
  const text = reportSummaryText();
  if (!text) { toast('err', t('stats.reportEmpty')); return; }
  await api.writeClipboard(text);
  toast('ok', t('stats.reportCopied'));
}
async function exportReportCsv() {
  if (!currentReportMeta) { toast('err', t('stats.reportEmpty')); return; }
  const res = await api.exportReport(currentReportMeta.days).catch(() => null);
  if (!res) { toast('err', t('toast.exportErr')); return; }
  if (res.ok) toast('ok', t('stats.reportExported') + ' (' + res.count + ')');
  else if (!res.canceled) toast('err', t('toast.exportErr'));
}

/* ---------------- 历史摘要分享 ---------------- */
async function shareSummary() {
  const shown = codes.slice(0, 20);
  if (!shown.length) { toast('err', t('history.empty')); return; }
  const lines = [];
  lines.push(t('history.title') + ' · ' + codes.length);
  for (const c of shown) {
    const tm = codeTypeInfo(c.codeType);
    const tag = tm ? (lang === 'en' ? tm.en : tm.zh) : '';
    lines.push((c.code || '') + (tag ? ' [' + tag + ']' : '') + ' · ' + (c.app || t('history.msg.defaultApp')) + (c.source ? ' · ' + c.source : '') + ' · ' + fmtFull(c.time));
  }
  await api.writeClipboard(lines.join('\n'));
  toast('ok', t('toast.shareSummary'));
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
    if (!qr || !qr.dataUrl) { toast('err', t('toast.qrFail')); return; }
    els.pairQr.src = qr.dataUrl;
    const parts = [];
    if (qr.ips && qr.ips.length > 1) parts.push(qr.ips.map((i) => (i && i.address) || i).join(' / '));
    parts.push('Token: ' + (qr.payload.token || t('set.tokenPh')));
    els.pairQrHint.textContent = parts.join(' · ');
  } catch (e) { toast('err', t('toast.qrFail')); }
}

/* ---------------- 临时授权码（功能 17） ---------------- */
let pairCodeTimer = null;
async function getPairCode() {
  const res = await api.getPairingCode().catch(() => null);
  if (!res || !res.code) { toast('err', t('toast.qrFail')); return; }
  els.pairCodeValue.textContent = res.code;
  els.pairCodeWrap.style.display = '';
  startPairCodeCountdown();
  toast('ok', t('pair.codeGenerated'));
}
function startPairCodeCountdown() {
  if (pairCodeTimer) clearInterval(pairCodeTimer);
  const deadline = Date.now() + 30000;
  const tick = () => {
    const remain = Math.max(0, deadline - Date.now());
    const sec = Math.ceil(remain / 1000);
    if (els.pairCodeCountdown) els.pairCodeCountdown.textContent = sec + 's';
    if (sec <= 0) {
      clearInterval(pairCodeTimer);
      pairCodeTimer = null;
      if (els.pairCodeWrap) els.pairCodeWrap.style.display = 'none';
    }
  };
  tick();
  pairCodeTimer = setInterval(tick, 1000);
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
  $('#setSound').checked = !!s.behavior?.playSound;
  $('#setSystemNotify').checked = !!s.behavior?.systemNotify;
  $('#setNotifyActions').checked = s.behavior?.systemNotifyActions !== false;
  $('#setFloatWindow').checked = s.ui?.floatWindow !== false;
  $('#setFloatWindowPos').value = s.ui?.floatWindowPosition || 'top-right';
  $('#setFloatWindowSeconds').value = s.ui?.floatWindowSeconds ?? 10;
  syncFloatWindowEnabled();
  $('#setAutoLaunch').checked = !!s.behavior?.autoLaunch;
  $('#setClipboardHistory').checked = s.behavior?.clipboardHistoryEnabled !== false;
  $('#setClipboardHistoryMax').value = s.ui?.clipboardHistoryMax ?? 100;
  $('#setFilterMode').value = s.behavior?.filterMode || 'off';
  $('#setFilterNumbers').value = s.behavior?.filterNumbers || '';
  $('#setCodeExpiry').checked = s.behavior?.codeExpiryEnabled !== false;
  $('#setCodeDefaultExpiry').value = s.behavior?.codeDefaultExpirySeconds ?? 600;
  syncCodeExpiryEnabled();
  $('#setDedupe').checked = s.behavior?.dedupeEnabled !== false;
  $('#setDedupeSeconds').value = s.behavior?.dedupeSeconds ?? 30;
  syncDedupeEnabled();
  $('#setWebhookEnabled').checked = !!s.behavior?.webhookEnabled;
  $('#setWebhookUrl').value = s.behavior?.webhookUrl || '';
  $('#setCommandPath').value = s.behavior?.commandPath || '';
  $('#setCommandArgs').value = s.behavior?.commandArgs || '{code}';
  syncWebhookEnabled();
  $('#setRelayEnabled').checked = !!(s.behavior?.relay?.enabled);
  $('#setRelayUrl').value = s.behavior?.relay?.url || '';
  $('#setRelayRoom').value = s.behavior?.relay?.room || '';
  $('#setRelayToken').value = s.behavior?.relay?.token || '';
  syncRelayEnabled();
  $('#setE2eKey').value = s.behavior?.e2eKey || '';
  $('#setIslandUrl').value = s.island?.baseUrl || 'http://127.0.0.1:9840';
  $('#setIslandToken').value = s.island?.token || '';
  $('#setIslandDuration').value = s.island?.durationSeconds ?? 30;
  $('#setIslandIcon').value = s.island?.icon || '\\uE8D6';
  $('#setIslandTitleStyle').value = s.island?.titleStyle || 'code';
  $('#setIslandShowApp').checked = s.island?.showAppInBody !== false;
  $('#setIslandTypeBadge').checked = s.island?.typeBadge !== false;
  $('#setIslandAnimation').value = s.island?.animation || 'default';
  $('#setIslandDisplay').value = String(s.island?.displayIndex ?? -1);
  renderPlatformTemplates();

  $('#setAccent').value = s.ui?.accent || '#6ea8ff';
  $('#setKeep').value = s.ui?.keepHistory ?? 50;
  $('#setAutoClean').value = s.ui?.autoCleanDays ?? 7;
  $('#setTheme').value = s.ui?.theme || 'dark';
  $('#setLanguage').value = s.ui?.language || 'zh';
  updateIslandPreview();
}

/* ---------------- 平台模板库 ---------------- */
function renderPlatformTemplates() {
  const list = els.platformTemplatesList;
  if (!list) return;
  const tpls = (settings.behavior && Array.isArray(settings.behavior.platformTemplates)) ? settings.behavior.platformTemplates : [];
  list.innerHTML = '';
  tpls.forEach((tp, idx) => {
    const row = document.createElement('div');
    row.className = 'platform-template-row' + (tp.enabled === false ? ' disabled' : '');
    row.dataset.id = tp.id || '';
    row.dataset.idx = String(idx);
    const ctOpts = ['', 'login', 'register', 'payment', 'unlock', 'other'].map((k) => {
      const m = k ? codeTypeInfo(k) : null;
      const label = !m ? t('pt.typeNone') : (lang === 'en' ? m.en : m.zh);
      return '<option value="' + k + '">' + escapeHtml(label) + '</option>';
    }).join('');
    row.innerHTML = `
      <div class="pt-head">
        <input class="field" data-f="name" value="${escapeHtml(tp.name || '')}" placeholder="${escapeHtml(t('pt.namePh'))}">
        <label class="pt-toggle"><input type="checkbox" data-f="enabled" ${tp.enabled === false ? '' : 'checked'}><span data-i18n="pt.enabled">启用</span></label>
        <button class="mini-btn danger" data-act="del" title="${escapeHtml(t('pt.delete'))}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
        </button>
      </div>
      <div class="pt-body">
        <div class="pt-cell">
          <span class="pt-label" data-i18n="pt.match">匹配关键词</span>
          <input class="field" data-f="match" value="${escapeHtml(tp.match || '')}" placeholder="${escapeHtml(t('pt.matchPh'))}">
        </div>
        <div class="pt-cell">
          <span class="pt-label" data-i18n="pt.icon">图标</span>
          <input class="field" data-f="icon" value="${escapeHtml(tp.icon || '')}" placeholder="\\uE8C7 / 🔑">
        </div>
        <div class="pt-cell">
          <span class="pt-label" data-i18n="pt.titleStyle">标题样式</span>
          <select class="field select" data-f="titleStyle">
            <option value="">${escapeHtml(t('pt.styleDefault'))}</option>
            <option value="code">${escapeHtml(t('set.islandTitleStyleCode'))}</option>
            <option value="cn">${escapeHtml(t('set.islandTitleStyleCn'))}</option>
            <option value="en">${escapeHtml(t('set.islandTitleStyleEn'))}</option>
          </select>
        </div>
        <div class="pt-cell">
          <span class="pt-label" data-i18n="pt.codeType">验证码类型</span>
          <select class="field select" data-f="codeType">${ctOpts}</select>
        </div>
      </div>
    `;
    row.querySelector('[data-f="titleStyle"]').value = tp.titleStyle || '';
    row.querySelector('[data-f="codeType"]').value = tp.codeType || '';
    row.querySelector('[data-act="del"]').addEventListener('click', () => {
      const cur = collectPlatformTemplates();
      cur.splice(Number(row.dataset.idx), 1);
      settings.behavior = settings.behavior || {};
      settings.behavior.platformTemplates = cur;
      renderPlatformTemplates();
    });
    list.appendChild(row);
  });
  applyI18n();
}
function collectPlatformTemplates() {
  const out = [];
  const list = els.platformTemplatesList;
  if (!list) return Array.isArray(settings.behavior && settings.behavior.platformTemplates) ? settings.behavior.platformTemplates.slice() : [];
  list.querySelectorAll('.platform-template-row').forEach((row) => {
    const nameEl = row.querySelector('[data-f="name"]');
    if (!nameEl) return;
    const name = nameEl.value.trim();
    if (!name) return;
    const val = (f) => { const el = row.querySelector('[data-f="' + f + '"]'); return el ? el.value : ''; };
    const chk = row.querySelector('[data-f="enabled"]');
    out.push({
      id: row.dataset.id || '',
      name: name,
      match: val('match').trim(),
      icon: val('icon').trim(),
      titleStyle: val('titleStyle'),
      codeType: val('codeType'),
      enabled: chk ? chk.checked : true,
    });
  });
  return out;
}
function addPlatformTemplate() {
  settings.behavior = settings.behavior || {};
  if (!Array.isArray(settings.behavior.platformTemplates)) settings.behavior.platformTemplates = [];
  settings.behavior.platformTemplates.push({
    id: 'tpl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: '', match: '', icon: '', titleStyle: '', codeType: '', enabled: true,
  });
  renderPlatformTemplates();
  const row = els.platformTemplatesList.lastElementChild;
  if (row) { const inp = row.querySelector('[data-f="name"]'); if (inp) inp.focus(); }
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
function syncRelayEnabled() {
  const on = $('#setRelayEnabled').checked;
  for (const id of ['relayExtraRow', 'relayExtraRow2', 'relayExtraRow3']) {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? '' : 'none';
  }
}
$('#setRelayEnabled').addEventListener('change', syncRelayEnabled);
function syncCodeExpiryEnabled() {
  const on = $('#setCodeExpiry').checked;
  const box = $('#codeExpiryExtra');
  if (box) box.style.display = on ? '' : 'none';
}
$('#setCodeExpiry').addEventListener('change', syncCodeExpiryEnabled);
function syncDedupeEnabled() {
  const on = $('#setDedupe').checked;
  const box = $('#dedupeExtra');
  if (box) box.style.display = on ? '' : 'none';
}
$('#setDedupe').addEventListener('change', syncDedupeEnabled);
function syncFloatWindowEnabled() {
  const on = $('#setFloatWindow').checked;
  const box = $('#floatWindowExtra');
  if (box) box.style.display = on ? '' : 'none';
}
$('#setFloatWindow').addEventListener('change', syncFloatWindowEnabled);
$('#setTheme').addEventListener('change', () => {
  settings.ui = settings.ui || {};
  const v = $('#setTheme').value;
  settings.ui.theme = (v === 'dark' || v === 'light' || v === 'system') ? v : 'dark';
  applyTheme();
});
$('#setLanguage').addEventListener('change', () => {
  settings.ui = settings.ui || {};
  settings.ui.language = $('#setLanguage').value === 'en' ? 'en' : 'zh';
  lang = settings.ui.language;
  applyI18n();
  if (activeHeroId) { const cur = codes.find((c) => c.id === activeHeroId); if (cur) showHero(cur); }
  renderHistory();
  renderReportArea();
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
      playSound: $('#setSound').checked,
      systemNotify: $('#setSystemNotify').checked,
      systemNotifyActions: $('#setNotifyActions').checked,
      autoLaunch: $('#setAutoLaunch').checked,
      clipboardHistoryEnabled: $('#setClipboardHistory').checked,
      filterMode: $('#setFilterMode').value || 'off',
      filterNumbers: $('#setFilterNumbers').value,
      webhookEnabled: $('#setWebhookEnabled').checked,
      webhookUrl: $('#setWebhookUrl').value.trim(),
      commandPath: $('#setCommandPath').value.trim(),
      commandArgs: $('#setCommandArgs').value.trim() || '{code}',
      codeExpiryEnabled: $('#setCodeExpiry').checked,
      codeDefaultExpirySeconds: clamp(parseInt($('#setCodeDefaultExpiry').value, 10), 0, 86400),
      dedupeEnabled: $('#setDedupe').checked,
      dedupeSeconds: clamp(parseInt($('#setDedupeSeconds').value, 10), 0, 3600),
      relay: {
        enabled: $('#setRelayEnabled').checked,
        url: $('#setRelayUrl').value.trim(),
        room: $('#setRelayRoom').value.trim(),
        token: $('#setRelayToken').value.trim(),
      },
      e2eKey: $('#setE2eKey').value.trim(),
      platformTemplates: collectPlatformTemplates(),
    },
    island: {
      baseUrl: $('#setIslandUrl').value.trim(),
      token: $('#setIslandToken').value.trim(),
      durationSeconds: clamp(parseInt($('#setIslandDuration').value, 10), 3, 600),
      icon: $('#setIslandIcon').value.trim(),
      titleStyle: $('#setIslandTitleStyle').value || 'code',
      showAppInBody: $('#setIslandShowApp').checked,
      typeBadge: $('#setIslandTypeBadge').checked,
      animation: $('#setIslandAnimation').value || 'default',
      displayIndex: parseInt(els.setIslandDisplay.value, 10) || -1,
    },
    ui: {
      accent: $('#setAccent').value,
      keepHistory: clamp(parseInt($('#setKeep').value, 10), 10, 500),
      autoCleanDays: clamp(parseInt($('#setAutoClean').value, 10), 0, 365),
      clipboardHistoryMax: clamp(parseInt($('#setClipboardHistoryMax').value, 10), 10, 500),
      theme: (v => (v === 'dark' || v === 'light' || v === 'system') ? v : 'dark')($('#setTheme').value),
      language: $('#setLanguage').value === 'en' ? 'en' : 'zh',
      floatWindow: $('#setFloatWindow').checked,
      floatWindowPosition: $('#setFloatWindowPos').value || 'top-right',
      floatWindowSeconds: clamp(parseInt($('#setFloatWindowSeconds').value, 10), 0, 3600),
    },
  };
  settings = await api.setSettings(patch);
  lang = (settings.ui && settings.ui.language) || 'zh';
  document.documentElement.style.setProperty('--accent', settings.ui.accent);
  applyTheme();
  applyI18n();
  if (activeHeroId) { const cur = codes.find((c) => c.id === activeHeroId); if (cur) showHero(cur); }
  renderHistory();
  renderClipboardHistory();
  const status = await api.getServerStatus();
  renderStatus(status);
  renderHealth();
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
els.btnAddPlatformTemplate.addEventListener('click', addPlatformTemplate);
els.btnReportWeek.addEventListener('click', () => generateReport(7, 'stats.reportWeek'));
els.btnReportMonth.addEventListener('click', () => generateReport(30, 'stats.reportMonth'));
els.btnCopyReport.addEventListener('click', copyReport);
els.btnExportReport.addEventListener('click', exportReportCsv);
els.btnShareSummary.addEventListener('click', shareSummary);
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
els.btnGetPairCode.addEventListener('click', getPairCode);
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

els.btnExportCsv.addEventListener('click', async () => {
  const res = await api.exportHistory('csv').catch(() => null);
  if (res && res.ok) toast('ok', t('toast.exportOk'));
  else toast('err', t('toast.exportErr'));
});
els.btnExportJson.addEventListener('click', async () => {
  const res = await api.exportHistory('json').catch(() => null);
  if (res && res.ok) toast('ok', t('toast.exportOk'));
  else toast('err', t('toast.exportErr'));
});
els.btnImportHistory.addEventListener('click', async () => {
  const res = await api.importHistory().catch(() => null);
  if (res && res.ok) {
    codes = await api.listCodes();
    if (codes.length > 0) showHero(codes[0]); else showEmpty();
    renderHistory();
    toast('ok', t('toast.importOk').replace('{a}', res.added).replace('{s}', res.skipped));
  } else {
    toast('err', t('toast.importErr'));
  }
});
/* ---------------- 剪贴板历史 ---------------- */
let clipboardHistoryCache = [];
async function renderClipboardHistory() {
  const data = await api.listClipboardHistory().catch(() => null);
  if (data) clipboardHistoryCache = data.items || [];
  const list = els.clipboardHistoryList;
  list.innerHTML = '';
  if (!clipboardHistoryCache.length) {
    list.innerHTML = '<div class="stats-empty">' + t('clipboardHistory.empty') + '</div>';
    return;
  }
  clipboardHistoryCache.slice(0, 12).forEach((it) => {
    const row = document.createElement('div');
    row.className = 'clip-row' + (it.source === 'auto' ? ' is-auto' : '');
    row.title = t('clipboardHistory.open');
    const badge = it.source === 'auto'
      ? '<span class="clip-badge">' + t('clipboardHistory.auto') + '</span>'
      : '';
    row.innerHTML = '<span class="clip-text">' + escapeHtml(it.text) + '</span>' + badge +
      '<span class="clip-time">' + fmtTime(it.time) + '</span>' +
      '<button class="clip-x" title="' + t('clipboardHistory.del') + '">×</button>';
    row.addEventListener('click', async () => {
      await api.copyClipboardHistory(it.id);
      toast('copy', t('clipboardHistory.copied'));
    });
    row.querySelector('.clip-x').addEventListener('click', async (e) => {
      e.stopPropagation();
      await api.removeClipboardHistory(it.id);
      renderClipboardHistory();
    });
    list.appendChild(row);
  });
}
els.btnClearClipboardHistory.addEventListener('click', async () => {
  await api.clearClipboardHistory();
  renderClipboardHistory();
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

api.on('clipboard-history:changed', () => renderClipboardHistory());

api.on('action:notice', (notice) => {
  const kindMap = { copy: 'copy', island: 'island', error: 'err', input: 'ok' };
  toast(kindMap[notice.kind] || 'ok', notice.text);
});

/* ---------------- 初始化 ---------------- */
/* ---------------- 连接健康面板 ---------------- */
async function renderHealth() {
  if (!els.healthGrid) return;
  let h = null;
  try { h = await api.getHealth(); } catch { h = null; }
  if (!h) return;
  const fmtDur = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const d = Math.floor(sec / 86400), hr = Math.floor((sec % 86400) / 3600), mi = Math.floor((sec % 3600) / 60), ss = sec % 60;
    if (d > 0) return d + '天 ' + hr + '时';
    if (hr > 0) return hr + '时 ' + mi + '分';
    if (mi > 0) return mi + '分 ' + ss + '秒';
    return ss + '秒';
  };
  const fmtAgo = (ts) => {
    if (!ts) return t('health.never');
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return diff + '秒前';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    return new Date(ts).toLocaleDateString();
  };
  const cards = [
    { key: 'uptime', val: fmtDur(h.uptimeSec), cls: '' },
    { key: 'received', val: String(h.received || 0), cls: 'ok' },
    { key: 'blocked', val: String(h.blocked || 0), cls: h.blocked ? 'warn' : '' },
    { key: 'relayMsg', val: String(h.relayMsg || 0), cls: h.relayMsg ? 'relay' : '' },
  ];
  els.healthGrid.innerHTML = '';
  for (const c of cards) {
    const item = document.createElement('div');
    item.className = 'health-item ' + c.cls;
    item.innerHTML = '<span class="health-label">' + escapeHtml(t('health.' + c.key)) + '</span><span class="health-value">' + escapeHtml(c.val) + '</span>';
    els.healthGrid.appendChild(item);
  }
  const r = h.relay || {};
  if (els.healthHint) {
    if (r.enabled) {
      let txt = t('health.relayOn') + ' · ' + (r.room || '?');
      if (r.lastErr && r.lastErrAt) txt += ' · ' + t('health.relayErr') + ': ' + fmtAgo(r.lastErrAt);
      else if (r.lastOk) txt += ' · ' + t('health.relayOk') + ': ' + fmtAgo(r.lastOk);
      else txt += ' · ' + t('health.never');
      els.healthHint.textContent = txt;
      els.healthHint.title = r.lastErr ? (t('health.relayErr') + ': ' + r.lastErr) : '';
    } else {
      els.healthHint.textContent = t('health.relayOff');
      els.healthHint.title = '';
    }
  }
}

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
  renderReportArea();
  codes = await api.listCodes();
  if (codes.length > 0) showHero(codes[0]);
  renderHistory();
  const status = await api.getServerStatus();
  renderStatus(status);
  const devices = await api.listDevices().catch(() => []);
  renderDevices(devices);
  renderHealth();
  setInterval(renderHealth, 3000);
  setInterval(tickExpiry, 1000);
})();

