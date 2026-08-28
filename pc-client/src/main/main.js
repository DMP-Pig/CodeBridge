/**
 * PhoneToPCCopyCode · PC 端主进程
 * 职责：局域网 HTTPS 服务（TLS 加密接收手机推送的验证码）、设置持久化、
 *       WinIsland 上岛推送、剪贴板、窗口/托盘管理。
 */
const { app, BrowserWindow, ipcMain, clipboard, Menu, Tray, nativeImage, shell, Notification, screen, dialog } = require('electron');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const QRCode = require('qrcode');

const APP_NAME = 'CodeBridge';
const APP_VERSION = app.getVersion();
const VERIFY = process.argv.includes('--verify');
const VERIFY_SHOT = process.argv.includes('--screenshot');

// ---- TLS 自签证书：与手机端内置证书一致，实现验证码/Token 加密传输 ----
let tlsCredentials = null;
function loadTlsCredentials() {
  try {
    tlsCredentials = {
      key: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'tls', 'server.key'), 'utf8'),
      cert: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'tls', 'server.crt'), 'utf8'),
    };
  } catch (err) {
    console.error('加载 TLS 证书失败，回退为明文 HTTP:', err.message);
    tlsCredentials = null;
  }
}
loadTlsCredentials();


const DEFAULT_SETTINGS = {
  server: {
    enabled: true,
    port: 9841,
    token: '',              // 留空则不校验
  },
  behavior: {
    autoDisplay: true,      // 收到验证码自动展示（悬浮提示 + 列表）
    autoCopy: false,
    autoCopyRestoreEnabled: true,   // 是否自动恢复原剪贴板
    autoCopyRestoreSeconds: 60,  // 自动复制后 N 秒恢复原剪贴板（0=不恢复）        // 收到验证码自动复制到剪贴板
    autoIsland: false,      // 收到验证码自动推送到 WinIsland
    playSound: true,        // 收到验证码播放提示音
    systemNotify: true,     // 收到验证码发送系统通知
    systemNotifyActions: true, // 系统通知带「复制 / 上岛 / 忽略」按钮
    webhookEnabled: false,  // 验证码到达时调用 Webhook
    webhookUrl: '',         // Webhook URL（POST JSON）
    commandPath: '',        // 自定义命令/脚本路径
    commandArgs: '{code}',  // 命令参数模板，支持 {code} {app} {source}
    autoLaunch: false,      // 开机自启
    clipboardHistoryEnabled: true,   // PC 剪贴板历史记录
    speakCode: false,       // 收到验证码语音播报
    filterMode: 'off',      // 来源过滤器：关闭 | 白名单 | 黑名单
    filterNumbers: '',      // 过滤列表：号码前缀/应用名，每行一个
    codeExpiryEnabled: true,    // 识别有效期：历史/悬浮窗显示倒计时，过期自动灰显
    codeDefaultExpirySeconds: 600, // 未识别到有效期时使用的默认秒数（0=不自动过期）
    dedupeEnabled: true,        // 重复验证码防刷屏：同一验证码短时间内重复收到时合并提示
    dedupeSeconds: 30,          // 防刷屏时间窗口（秒）
    relay: {                    // 公网加密中继（跨局域网时使用）
      enabled: false,           // 是否启用中继
      url: '',                  // 中继地址，如 https://relay.example.com 或 http://1.2.3.4:9842
      room: '',                 // 房间名（两端一致，建议随机字符串）
      token: '',                // 中继密钥（两端一致；只发送其 SHA-256 给中继）
    },
    e2eKey: '',                   // 端到端加密密钥（可选）：两端填写相同后，局域网消息 AES-256-GCM 端到端加密
    platformTemplates: [          // 平台模板库：按来源匹配后应用上岛样式与验证码类型
      { id: 'tb',     name: '\u6DD8\u5B9D/\u5929\u732B', match: '\u6DD8\u5B9D,\u5929\u732B', icon: '\\uE8C7', titleStyle: '', codeType: 'payment', enabled: true },
      { id: 'alipay', name: '\u652F\u4ED8\u5B9D',    match: '\u652F\u4ED8\u5B9D',       icon: '\\uE8C7', titleStyle: '', codeType: 'payment', enabled: true },
      { id: 'wechat', name: '\u5FAE\u4FE1',       match: '\u5FAE\u4FE1',           icon: '\\uE8BD', titleStyle: '', codeType: 'login',   enabled: true },
      { id: 'bank',   name: '\u94F6\u884C',       match: '\u94F6\u884C,\u62DB\u5546,\u5EFA\u8BBE,\u5DE5\u5546,\u519C\u4E1A,\u4EA4\u901A,\u4E2D\u884C', icon: '\\uE8C7', titleStyle: '', codeType: 'payment', enabled: true },
      { id: 'steam',  name: 'Steam',      match: 'steam',           icon: '\\uE7FC', titleStyle: '', codeType: 'login',   enabled: true },
      { id: 'weibo',  name: '\u5FAE\u535A',       match: '\u5FAE\u535A',           icon: '\\uE8D6', titleStyle: '', codeType: 'login',   enabled: true },
    ],
  },
  island: {
    baseUrl: 'http://127.0.0.1:9840',
    token: '',              // WinIsland 设置的 X-WinIsland-Token
    durationSeconds: 30,
    icon: '\\uE8D6',        // 钥匙图标（Segoe MDL2）
    titleStyle: 'code',     // 紧凑标题样式：'code' | 'cn' | 'en'
    typeBadge: true,        // 上岛标题/正文显示验证码类型徽标
    showAppInBody: true,    // 展开正文是否包含来源应用
    animation: 'slide',     // 上岛动画：default | fade | slide | scale
    displayIndex: -1,       // 目标显示器索引（-1=自动/主屏）
  },
  ui: {
    accent: '#6ea8ff',
    keepHistory: 50,        // 保留历史条数
    autoCleanDays: 7,       // 自动清理天数（0=关闭）
    clipboardHistoryMax: 100,   // 剪贴板历史保留条数
    theme: 'dark',          // 'dark' | 'light' | 'system' 深浅色主题（跟随系统）
    language: 'zh',         // 'zh' | 'en' 界面语言
    floatWindow: true,      // 收到验证码时显示置顶悬浮窗
    floatWindowPosition: 'top-right',  // 悬浮窗位置: top-right | top-left | bottom-right | bottom-left
    floatWindowSeconds: 10, // 悬浮窗自动隐藏秒数（0=不自动隐藏）
  },
};

// 保持用户数据目录稳定（沿用旧路径，避免升级丢设置）
app.setPath('userData', path.join(app.getPath('appData'), 'PhoneToPCCopyCode'));

let settings = loadSettings();

// 设备唯一 ID：用于手机端自动搜索时识别同一台 PC（避免 USB 与局域网双通道显示重复）
let deviceId = '';
function loadDeviceId() {
  try {
    const f = path.join(app.getPath('userData'), 'device.json');
    if (fs.existsSync(f)) {
      const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (parsed && parsed.id) { deviceId = parsed.id; return; }
    }
    deviceId = crypto.randomUUID();
    fs.writeFileSync(f, JSON.stringify({ id: deviceId }), 'utf8');
  } catch {
    try { deviceId = crypto.randomUUID(); } catch { deviceId = 'pc-' + Date.now(); }
  }
}
loadDeviceId();

let codeHistory = [];       // 最新在前
// 临时授权码配对（功能 17）：PC 生成 6 位授权码，30 秒有效；手机端输入后经 /health 读取 token/port 自动配对
let pairingTicket = null;   // { code, expireAt, token, port }
const devices = new Map();   // 设备在线状态：deviceId -> 最近心跳信息
let server = null;
let mainWindow = null;
let tray = null;
let floatingWindow = null;    // 最新验证码置顶悬浮窗
let floatingHideTimer = null; // 悬浮窗自动隐藏定时器
let clipboardRestoreTimer = null;   // 剪贴板恢复计时器
let clipboardRestoreValue = null; // 复制验证码前的剪贴板内容
let isQuitting = false;           // 用户从托盘主动退出时为 true，允许真正关闭窗口

// ---------------------------------------------------------------- 设置
function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULT_SETTINGS), parsed);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.error('保存设置失败:', err);
  }
}

function deepMerge(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function historyFile() {
  return path.join(app.getPath('userData'), 'history.json');
}

function loadHistory() {
  try {
    const raw = fs.readFileSync(historyFile(), 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) codeHistory = arr;
  } catch { codeHistory = []; }
}

function saveHistory() {
  try {
    fs.mkdirSync(path.dirname(historyFile()), { recursive: true });
    fs.writeFileSync(historyFile(), JSON.stringify(codeHistory.slice(0, 200)), 'utf8');
  } catch (err) {
    console.error('保存历史失败:', err);
  }
}
// ---------------------------------------------------------------- 局域网 IP
function getLanIps() {
  const list = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        list.push({ name, address: net.address });
      }
    }
  }
  return list;
}

// ---------------------------------------------------------------- 历史记录
function addHistory(entry, quiet) {
  autoCleanHistory();
  codeHistory.unshift(entry);
  const max = Math.max(10, settings.ui.keepHistory || 50);
  if (codeHistory.length > max) codeHistory.length = max;
  if (!quiet) saveHistory();
  // 系统通知（缓存补发条目不打扰）
  if (!quiet && !entry.cacheSent && settings.behavior.systemNotify && Notification.isSupported()) {
    try {
      const notifOpts = {
        title: APP_NAME,
        body: `${entry.app || mainT('短信', 'SMS')}: ${entry.code}`,
      };
      // 可操作系统通知：直接带「复制 / 上岛 / 忽略」按钮（Windows/macOS 支持）
      if (settings.behavior.systemNotifyActions) {
        notifOpts.actions = [
          { type: 'button', text: mainT('复制', 'Copy') },
          { type: 'button', text: mainT('上岛', 'Island') },
          { type: 'button', text: mainT('忽略', 'Ignore') },
        ];
        notifOpts.closeButtonText = mainT('关闭', 'Close');
      }
      const notif = new Notification(notifOpts);
      notif.on('action', (_e, index) => {
        if (index === 0) {
          copyText(entry.code, 'notify');
        } else if (index === 1) {
          pushToIsland(entry).catch(() => {});
        }
        try { notif.close(); } catch (_) {}
      });
      notif.on('click', () => {
        try {
          if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
          notif.close();
        } catch (_) {}
      });
      notif.show();
    } catch (err) { console.error('系统通知失败:', err); }
  }
}

/**
 * 自动清理：删除超过 N 天的历史记录（autoCleanDays=0 时关闭）
 */
function autoCleanHistory() {
  const days = Math.max(0, Number(settings.ui.autoCleanDays) || 0);
  if (days <= 0) return;
  const cutoff = Date.now() - days * 86400000;
  const before = codeHistory.length;
  codeHistory = codeHistory.filter((e) => {
    const t = e && e.time ? new Date(e.time).getTime() : NaN;
    return Number.isNaN(t) || t >= cutoff;
  });
  if (codeHistory.length !== before) saveHistory();
}

let clipboardWatchTimer = null;
const clipboardHistoryMaxDefault = 100;
let clipboardHistory = [];
function clipboardHistoryFile() {
  return path.join(app.getPath('userData'), 'clipboardHistory.json');
}
function loadClipboardHistory() {
  try {
    const arr = JSON.parse(fs.readFileSync(clipboardHistoryFile(), 'utf8'));
    clipboardHistory = Array.isArray(arr) ? arr : [];
  } catch { clipboardHistory = []; }
}
function saveClipboardHistory() {
  if (VERIFY) return;
  try { fs.writeFileSync(clipboardHistoryFile(), JSON.stringify(clipboardHistory)); } catch { /* 忽略 */ }
}
function recordClipboardEntry(text, source) {
  if (VERIFY) return;
  if (settings.behavior.clipboardHistoryEnabled === false) return;
  const t = String(text || '');
  if (!t.trim()) return;
  const last = clipboardHistory[0];
  if (last && last.text === t && Date.now() - new Date(last.time).getTime() < 5000) return;
  clipboardHistory.unshift({ id: crypto.randomUUID(), text: t, time: new Date().toISOString(), source: source || 'manual' });
  const max = Math.max(1, Number(settings.ui.clipboardHistoryMax) || clipboardHistoryMaxDefault);
  if (clipboardHistory.length > max) clipboardHistory.length = max;
  saveClipboardHistory();
  emitToRenderer('clipboard-history:changed', { items: clipboardHistory });
}
function startClipboardWatch() {
  if (clipboardWatchTimer) { clearInterval(clipboardWatchTimer); clipboardWatchTimer = null; }
  const historyOn = settings.behavior.clipboardHistoryEnabled !== false;
  if (!historyOn) return;
  let lastText = '';
  try { lastText = clipboard.readText(); } catch { lastText = ''; }
  clipboardWatchTimer = setInterval(() => {
    try {
      const t = clipboard.readText();
      if (t !== lastText) {
        lastText = t;
        recordClipboardEntry(t, 'manual');
      }
    } catch { /* 忽略剪贴板读取失败 */ }
  }, 1000);
}

// ---------------------------------------------------------------- 剪贴板
function copyText(text, source) {
  clipboard.writeText(text || '');
  recordClipboardEntry(text, source || 'manual');
}

/**
 * 自动复制并在 N 秒后恢复原剪贴板。
 * 多条验证码连续到达时：保留第一次的原剪贴板，并重置计时器。
 */
function autoCopyWithRestore(code) {
  const enabled = !!settings.behavior.autoCopyRestoreEnabled;
  const secs = Math.max(0, Number(settings.behavior.autoCopyRestoreSeconds) || 60);
  // 关闭恢复：取消正在计时的恢复任务
  if (!enabled) {
    if (clipboardRestoreTimer) { clearTimeout(clipboardRestoreTimer); clipboardRestoreTimer = null; }
    clipboardRestoreValue = null;
    copyText(code, 'auto');
    return;
  }
  // 首次复制前保存当前剪贴板（后续验证码不覆盖原值）
  if (clipboardRestoreTimer == null) {
    clipboardRestoreValue = clipboard.readText();
  }
  copyText(code, 'auto');
  if (clipboardRestoreTimer) clearTimeout(clipboardRestoreTimer);
  if (secs > 0) {
    clipboardRestoreTimer = setTimeout(() => {
      clipboardRestoreTimer = null;
      const prev = clipboardRestoreValue;
      clipboardRestoreValue = null;
      if (prev != null) {
        copyText(prev, 'restore');
        emitToRenderer('action:notice', { kind: 'copy', text: mainT('剪贴板已恢复为原内容', 'Clipboard restored') });
      }
    }, secs * 1000);
  }
}
// ---------------------------------------------------------------- WinIsland 上岛
function islandHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (settings.island.token) h['X-WinIsland-Token'] = settings.island.token;
  return h;
}

/**
 * 把设置中的 "\uXXXX" 转义（如 "\uE8D6"）解码为真正的 Unicode 字形字符；
 * 连续两个转义可组成代理对（emoji，如 "\uD83D\uDD11" → 🔑）。
 */
function decodeIconEscape(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
/**
 * 构建上岛卡片载荷（单行、不拓宽灵动岛）。
 */
// 楠岃瘉鐮佺被鍨嬪厓淇℃伅锛氭爣棰樻爣绛撅紙鍗曡缁存寔鐭€佷笉鎷嗗姬宀涘锛?
const CODE_TYPES = {
  login:    { zh: '\u767b\u5f55', en: 'Login', icon: '\uE8D6' },
  register:    { zh: '\u6ce8\u518c', en: 'Register', icon: '\uE710' },
  payment:    { zh: '\u652f\u4ed8', en: 'Payment', icon: '\uE8C7' },
  unlock:    { zh: '\u89e3\u9501', en: 'Unlock', icon: '\uE785' },
  other:    { zh: '\u9a8c\u8bc1', en: 'Code', icon: '\uE8D6' },
};
function codeTypeMeta(ct) {
  const k = String(ct || '').toLowerCase();
  return CODE_TYPES[k] || null;
}

function buildIslandPayload(entry) {
  // 紧凑标题样式（保持单行、不撑宽灵动岛）
  const isEn = !!(settings.ui && settings.ui.language === 'en');
  const tpl = entry.platform || {};
  const tmeta = codeTypeMeta(entry.codeType);
  const typeOn = settings.island.typeBadge !== false && !!tmeta;
  const style = tpl.titleStyle || settings.island.titleStyle || 'code';
  const codeStr = `${entry.code}`;
  let title = codeStr;
  if (typeOn) {
    const lb = isEn ? tmeta.en : tmeta.zh;
    if (style === 'cn') title = lb + (isEn ? ' code' : '验证码') + ' ' + codeStr;
    else if (style === 'en') title = lb + ' code ' + codeStr;
    else title = lb + ' ' + codeStr;
  } else if (style === 'cn') title = (isEn ? 'Code' : '验证码') + ' ' + codeStr;
  else if (style === 'en') title = 'Code ' + codeStr;
  // 展开态正文：来源应用等信息（可关闭）
  const bodyParts = [];
  if (settings.island.showAppInBody !== false) {
    if (typeOn) bodyParts.push(isEn ? (tmeta.en + ' code') : (tmeta.zh + '验证码'));
    if (entry.app) bodyParts.push(`来自 ${entry.app}`);
    if (entry.source) bodyParts.push(entry.source);
  }
  const body = bodyParts.length ? bodyParts.join(' · ') : (isEn ? 'Code' : '验证码');
  return {
    title,                             // 紧凑标题（单行）
    body,                              // 展开态正文（单行）
    icon: (() => {
      const customIcon = decodeIconEscape(settings.island.icon) || '';
      if (tpl.icon) return (customIcon && customIcon !== '\uE8D6') ? customIcon : tpl.icon;
      if (customIcon && customIcon !== '\uE8D6') return customIcon;
      return typeOn ? (tmeta.icon || '\uE8D6') : (customIcon || '\uE8D6');
    })(),
    duration_seconds: Number(settings.island.durationSeconds) || 30,
    id: `phonetopc-${entry.id}`,
    buttons: [
      {
        label: '复制',
        action: 'launch',
        value: `${process.execPath} --copy-last`,
      },
    ],
  };
}

/** 按 WinIsland PushCompactWidth 公式估算内容所需宽度（px）。<=180 不触发灵动岛加宽。 */
function measureTextWidth(s, cjkPx, asciiPx) {
  let w = 0;
  for (const ch of s) w += ch > 0x2E7F ? cjkPx : asciiPx;
  return w;
}
function estimateIslandNeed(entry) {
  const payload = buildIslandPayload(entry);
  let need = measureTextWidth(payload.title, 15, 8);
  if (payload.body) need = Math.max(need, Math.min(measureTextWidth(payload.body, 13.5, 7), 460));
  if (payload.buttons && payload.buttons.length > 0) {
    let btnW = 0;
    for (const b of payload.buttons) btnW += measureTextWidth(b.label, 12, 6.5) + 26;
    btnW += (payload.buttons.length - 1) * 8;
    need = Math.max(need, btnW);
  }
  return need;
}
function pushToIsland(entry) {
  return new Promise((resolve, reject) => {
    const base = (settings.island.baseUrl || 'http://127.0.0.1:9840').replace(/\/+$/, '');
    // 单行 + 不影响灵动岛宽度：
    //   - 验证码放进短标题，紧凑单行直接可见；
    //   - 正文拼成单行（无换行）且足够短（宽度估算 < 180px，不触发灵动岛加宽）；
    //   - 按钮标签尽量短。
    const payload = buildIslandPayload(entry);
    const body = JSON.stringify(payload);
    const req = http.request(base + '/v1/island/push', {
      method: 'POST',
      headers: islandHeaders(),
      timeout: 4000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true, data });
        else reject(new Error(`上岛失败 HTTP ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('上岛超时（请确认 WinIsland 已启用上岛 API）')); });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------- HTTP 服务
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-P2P-Token');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function checkToken(req, body) {
  return checkTokenFor(body, req.headers['x-p2p-token']);
}
function checkTokenFor(body, headerToken) {
  const expected = settings.server.token || '';
  if (!expected) return true;
  const bodyToken = body && body.token;
  return headerToken === expected || bodyToken === expected;
}

function sendJson(res, status, obj) {
  const text = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

/**
 * 来源过滤器：按发件号码 / 来源应用允许或拦截（白名单 / 黑名单）
 * 列表每行一个，支持号码前缀或应用名；列表为空时不过滤。
 */
function sourceFilterPass(source) {
  const mode = settings.behavior.filterMode || 'off';
  if (mode === 'off') return { pass: true };
  const list = String(settings.behavior.filterNumbers || '')
    .split(/[\s,，;；、]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return { pass: true };
  const s = String(source || '').trim();
  const norm = (x) => x.replace(/\s/g, '').toLowerCase();
  const hit = list.some((item) => {
    const a = norm(item); const b = norm(s);
    return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));
  });
  if (mode === 'whitelist' && !hit) return { pass: false, reason: 'whitelist' };
  if (mode === 'blacklist' && hit) return { pass: false, reason: 'blacklist' };
  return { pass: true };
}
/**
 * 平台模板匹配：按来源 app/发件人模糊匹配模板库，自动应用图标、标题样式与验证码类型。 */
function applyPlatformTemplate(entry) {
  const tpls = Array.isArray(settings.behavior.platformTemplates) ? settings.behavior.platformTemplates : [];
  const hay = String((entry.app || '') + ' ' + (entry.source || '')).toLowerCase();
  for (const t of tpls) {
    if (!t || !t.enabled) continue;
    const kws = String(t.match || '').split(/[,，]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (kws.length === 0) continue;
    if (kws.some((kw) => hay.includes(kw))) {
      entry.platform = {
        name: String(t.name || entry.app || ''),
        icon: String(t.icon || ''),
        titleStyle: String(t.titleStyle || ''),
        codeType: String(t.codeType || ''),
      };
      if (entry.platform.codeType) entry.codeType = entry.platform.codeType;
      break;
    }
  }
  return entry;
}

/**
 * 处理一条验证码消息（来源：局域网 /api/code 或公网中继）。
 * 返回 { status, body }，由调用方统一应答。
 */
async function ingestCode(body, remoteAddr) {
  if (!checkTokenFor(body, '')) {
    return { status: 401, body: { ok: false, error: 'token 无效' } };
  }
  // 端到端加密（可选）：手机端用 e2eKey 加密 payload，PC 解密后再处理
  if (body && body.e2e === true && body.payload) {
    try {
      const dec = e2eDecryptPayload(body.payload);
      body = Object.assign({}, body, dec || {});
    } catch (err) {
      return { status: 400, body: { ok: false, error: '端到端解密失败: ' + (err && err.message || err) } };
    }
  }
  const code = String(body.code || '').trim();
  if (!code) return { status: 400, body: { ok: false, error: '缺少 code 字段' } };
  const filter = sourceFilterPass(String(body.source || ''));
  if (!filter.pass) {
    statBlocked++;
    const why = filter.reason === 'whitelist'
      ? mainT('不在白名单', 'not in whitelist')
      : mainT('在黑名单', 'in blacklist');
    emitToRenderer('action:notice', { kind: 'ok', text: mainT('已拦截验证码（' + why + '）', 'Blocked by source filter (' + why + ')') });
    return { status: 200, body: { ok: true, filtered: true } };
  }
  const quiet = !!(body && body.verify);   // verify mode: no disk write / notify / auto-actions
  const cacheSent = body.cacheSent === true || String(body.cacheSent) === 'true';
  // 去重：同一验证码在去重窗口内重复接收时合并，避免刷屏
  const dedupeMs = (settings.behavior.dedupeEnabled !== false) ? (Math.max(0, Number(settings.behavior.dedupeSeconds)) || 0) * 1000 : 0;
  if (dedupeMs > 0) {
    const dup = codeHistory.find((e) => {
      if (!e || String(e.code || '') !== code) return false;
      if ((e.source || '') !== String(body.source || '')) return false;
      const t = new Date(e.time || '').getTime();
      return !Number.isNaN(t) && (Date.now() - t) < dedupeMs;
    });
    if (dup) {
      emitToRenderer('action:notice', { kind: 'ok', text: mainT('重复验证码已合并（同一验证码在去重窗口内重新收到）', 'Duplicated code merged (same code received again within the dedupe window)') });
      return { status: 200, body: { ok: true, deduped: true, id: dup.id } };
    }
  }
  // 有效期识别：优先使用手机端识别结果，未识别时使用 PC 默认值
  const expireSeconds = Math.max(0, Number(body.expireSeconds) || 0);
  let expiresAt = 0;
  if (settings.behavior.codeExpiryEnabled !== false) {
    const secs = expireSeconds > 0 ? expireSeconds : Math.max(0, Number(settings.behavior.codeDefaultExpirySeconds) || 0);
    if (secs > 0) expiresAt = Date.now() + secs * 1000;
  }
  const entry = {
    id: crypto.randomUUID(),
    code,
    app: String(body.app || '短信').slice(0, 40),
    source: String(body.source || '').slice(0, 40),
    from: remoteAddr || '',
    deviceName: String(body.deviceName || body.name || '').slice(0, 40),
    deviceId: String(body.deviceId || body.id || '').slice(0, 64),
    time: (Number(body.originalTime) > 0 ? new Date(Number(body.originalTime)) : new Date()).toISOString(),
    cacheSent,
    expireSeconds,
    expiresAt,
    codeType: String(body.codeType || '').slice(0, 20),
  };
  recordDevice(body, { socket: { remoteAddress: remoteAddr || '' } });
  applyPlatformTemplate(entry);
  addHistory(entry, quiet);
  emitToRenderer('code:new', entry);
  if (!quiet && !cacheSent) showFloating(entry);
  if (!quiet) handleAutoActions(entry);
  statReceived++;
  if (body.relayed) statRelayMsg++;
  return { status: 200, body: { ok: true, id: entry.id } };
}

async function handleRequest(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && pathname === '/health') {
    const tkt = currentPairingTicket();
    return sendJson(res, 200, {
      ok: true, name: APP_NAME, version: APP_VERSION, id: deviceId, hostname: os.hostname(),
      time: new Date().toISOString(),
      pairCode: tkt ? tkt.code : '',
      pairToken: tkt ? tkt.token : '',
      pairPort: tkt ? tkt.port : 0,
    });
  }

  // 端口 Web 控制台（/ 或 /web）
  if (req.method === 'GET' && (pathname === '/' || pathname === '/web')) {
    return serveWebConsole(res);
  }

  // Web 控制台数据接口
  if (req.method === 'GET' && pathname === '/api/console') {
    if (!checkToken(req, {})) {
      return sendJson(res, 401, { ok: false, error: 'token 无效' });
    }
    return sendJson(res, 200, {
      ok: true,
      app: {
        name: APP_NAME,
        version: APP_VERSION,
        hostname: os.hostname(),
        deviceId,
        port: settings.server.port,
        secure: !!tlsCredentials,
        ips: getLanIps(),
        uptime: Math.round(process.uptime()),
        time: new Date().toISOString(),
      },
      devices: devicesToArray(),
      history: codeHistory.slice(0, 30),
      clipboardHistory: clipboardHistory.slice(0, 20),
    });
  }

  if (req.method === 'POST' && pathname === '/api/code') {
    let body;
    try { body = await readJsonBody(req); } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
    const result = await ingestCode(body, req.socket.remoteAddress || '');
    return sendJson(res, result.status, result.body);
  }

  // 心跳：手机端定期上报，用于 PC 显示在线状态 / 断线感知
  if (req.method === 'POST' && pathname === '/api/heartbeat') {
    let body;
    try { body = await readJsonBody(req); } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
    if (!checkToken(req, body)) {
      return sendJson(res, 401, { ok: false, error: 'token 无效' });
    }
    recordDevice(body, req);
    return sendJson(res, 200, { ok: true, now: Date.now() });
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
}
// ---------------------------------------------------------------- 公网加密中继客户端
let relayTimer = null;
let relayLastId = 0;
// ----- 连接健康统计 -----
let serverStartAt = 0;
let statReceived = 0;
let statBlocked = 0;
let statRelayMsg = 0;
let relayLastOk = 0;
let relayLastErr = '';
let relayLastErrAt = 0;

function relayConf() {
  const r = settings.behavior.relay || {};
  return {
    enabled: !!r.enabled,
    url: String(r.url || '').trim().replace(/\/+$/, ''),
    room: String(r.room || '').trim(),
    token: String(r.token || ''),
  };
}

/** AES-256-GCM 密钥：两端由「房间名 + 中继密钥」本地派生，中继无法解密 */
function relayKey(conf) {
  return crypto.createHash('sha256').update('codebridge:' + conf.room + ':' + conf.token).digest();
}

/** 发送给中继做认证的 token 哈希（中继不接触密钥明文） */
function relayTokenHash(conf) {
  return crypto.createHash('sha256').update(String(conf.token || '')).digest('hex');
}

function relayDecrypt(conf, msg) {
  const key = relayKey(conf);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(msg.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(msg.tag, 'base64'));
  let plain = decipher.update(Buffer.from(msg.ct, 'base64'), null, 'utf8');
  plain += decipher.final('utf8');
  return JSON.parse(plain);
}

function e2eDecryptPayload(payload) {
  const key = String(settings.behavior.e2eKey || '');
  if (!key) throw new Error('未配置端到端加密密钥');
  if (!payload || !payload.iv || !payload.ct || !payload.tag) throw new Error('payload 不完整');
  const k = crypto.createHash('sha256').update('codebridge:e2e:' + key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  let plain = decipher.update(Buffer.from(payload.ct, 'base64'), null, 'utf8');
  plain += decipher.final('utf8');
  return JSON.parse(plain);
}

async function relayPost(conf, path, body) {
  const res = await fetch(conf.url + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch (_) {}
    throw new Error('relay HTTP ' + res.status + ' ' + errText.slice(0, 120));
  }
  return res.json();
}

async function relayPullOnce() {
  const conf = relayConf();
  if (!conf.enabled || !conf.url || !conf.room || !conf.token) return;
  try {
    const data = await relayPost(conf, '/relay/pull', {
      room: conf.room,
      tokenHash: relayTokenHash(conf),
      lastId: relayLastId,
    });
    if (data && data.ok && Array.isArray(data.msgs)) {
      relayLastId = Math.max(relayLastId, Number(data.lastId) || 0);
      relayLastOk = Date.now();
      for (const msg of data.msgs) {
        try {
          const body = relayDecrypt(conf, msg);
          body.relayed = true;
          await ingestCode(body, 'relay');
        } catch (err) {
          console.error('中继消息解密/处理失败:', err.message);
        }
      }
    }
  } catch (err) {
    relayLastErr = (err && err.message) || String(err);
    relayLastErrAt = Date.now();
    // 中继不可达：静默，下轮重试
    if (VERIFY) console.error('relay pull error:', err.message);
  }
}

function startRelayClient() {
  stopRelayClient();
  const conf = relayConf();
  if (!conf.enabled || !conf.url || !conf.room || !conf.token) return;
  relayLastId = 0; // 重启后从头拉取（中继保留 24h）
  relayPullOnce().catch(() => {});
  relayTimer = setInterval(() => { relayPullOnce().catch(() => {}); }, 2500);
}

function stopRelayClient() {
  if (relayTimer) { clearInterval(relayTimer); relayTimer = null; }
}


/**
 * 模拟键盘输入验证码到当前聚焦的输入框（跨平台）
 * Windows: PowerShell WScript.Shell SendKeys（临时脚本，UTF-16LE）
 * macOS:   osascript System Events keystroke（需辅助功能权限）
 * Linux:   xdotool type（需已安装 xdotool）
 */
// ---------------------------------------------------------------- 设备在线状态（心跳）
function recordDevice(body, req) {
  try {
    const id = String(body.deviceId || body.id || '').slice(0, 64);
    if (!id) return;
    devices.set(id, {
      id,
      name: String(body.name || '').slice(0, 40),
      app: String(body.app || '').slice(0, 40),
      platform: String(body.platform || 'android').slice(0, 12),
      hostname: String(body.hostname || '').slice(0, 40),
      from: req.socket.remoteAddress || '',
      lastSeen: Date.now(),
    });
  } catch (e) { /* ignore */ }
}
function devicesToArray() {
  const now = Date.now();
  const arr = [];
  for (const d of devices.values()) {
    const online = now - d.lastSeen < 70000;
    arr.push({ ...d, online, lastSeen: d.lastSeen });
  }
  return arr;
}
function broadcastDevices() {
  emitToRenderer('device:status', devicesToArray());
}
// 定时清理离线设备并刷新在线状态
setInterval(() => {
  const now = Date.now();
  for (const [id, d] of devices) {
    if (now - d.lastSeen > 300000) devices.delete(id);
  }
  broadcastDevices();
}, 30000);

function handleAutoActions(entry) {
  // 自动复制
  if (settings.behavior.autoCopy) {
    autoCopyWithRestore(entry.code);
    emitToRenderer('action:notice', { kind: 'copy', text: mainT('已自动复制到剪贴板', 'Auto-copied to clipboard') });
  }
  // 自动上岛
  if (settings.behavior.autoIsland) {
    pushToIsland(entry)
      .then(() => emitToRenderer('action:notice', { kind: 'island', text: mainT('已自动上岛', 'Auto-pushed to island') }))
      .catch((err) => emitToRenderer('action:notice', { kind: 'error', text: err.message }));
  }
  // Webhook / 脚本触发
  if (settings.behavior.webhookEnabled) {
    triggerWebhookScript(entry);
  }
}

// ---------------------------------------------------------------- Webhook / 脚本触发
/** POST JSON 到 Webhook（http/https） */
function postWebhook(url, entry) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch (err) { return reject(new Error('URL 无效')); }
    const mod = u.protocol === 'https:' ? https : http;
    const body = JSON.stringify({ id: entry.id, code: entry.code, app: entry.app, source: entry.source, from: entry.from, time: entry.time });
    const req = mod.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': APP_NAME,
        'X-CodeBridge-Code': String(entry.code || ''),
      },
      timeout: 8000,
    }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** 执行自定义命令/脚本，参数模板支持 {code} {app} {source} {time} {id} */
function runScript(entry) {
  const cmdPath = String(settings.behavior.commandPath || '').trim();
  if (!cmdPath) return;
  const tmpl = String(settings.behavior.commandArgs || '{code}');
  const args = tmpl
    .replace(/\{code\}/g, entry.code || '')
    .replace(/\{app\}/g, entry.app || '')
    .replace(/\{source\}/g, entry.source || '')
    .replace(/\{time\}/g, entry.time || '')
    .replace(/\{id\}/g, entry.id || '')
    .trim()
    .split(/\s+/)
    .filter((x) => x.length > 0);
  execFile(cmdPath, args, { timeout: 15000, windowsHide: true }, (err) => {
    if (err) {
      console.error('脚本执行失败:', err);
      emitToRenderer('action:notice', { kind: 'error', text: mainT('脚本执行失败: ' + err.message, 'Script failed: ' + err.message) });
    }
  });
}

/** 验证码到达时触发 Webhook 与自定义脚本 */
function triggerWebhookScript(entry) {
  const url = String(settings.behavior.webhookUrl || '').trim();
  if (url) {
    postWebhook(url, entry)
      .then((status) => emitToRenderer('action:notice', { kind: 'webhook', text: mainT('Webhook 已触发（HTTP ' + status + '）', 'Webhook triggered (HTTP ' + status + ')') }))
      .catch((err) => emitToRenderer('action:notice', { kind: 'error', text: mainT('Webhook 调用失败: ' + err.message, 'Webhook failed: ' + err.message) }));
  }
  runScript(entry);
}

// 服务固定的 Web 控制台页面
const WEB_CONSOLE_PATH = path.join(__dirname, '..', 'renderer', 'web-console.html');
function serveWebConsole(res) {
  try {
    const html = fs.readFileSync(WEB_CONSOLE_PATH, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: 'web console 页面加载失败: ' + err.message });
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    stopServer();
    if (!settings.server.enabled) {
      emitToRenderer('server:status', { running: false, port: settings.server.port, ips: [], error: '服务器已停用', secure: !!tlsCredentials });
      return resolve(false);
    }
    server = tlsCredentials ? https.createServer(tlsCredentials, handleRequest) : http.createServer(handleRequest);
    server.on('error', (err) => {
      emitToRenderer('server:status', { running: false, port: settings.server.port, ips: [], error: err.message, secure: !!tlsCredentials });
      reject(err);
    });
    server.listen(settings.server.port, '0.0.0.0', () => {
      serverStartAt = Date.now();
      const ips = getLanIps();
      emitToRenderer('server:status', { running: true, port: settings.server.port, ips, secure: !!tlsCredentials });
      resolve(true);
    });
  });
}

function stopServer() {
  if (server) {
    try { server.close(); } catch {}
    server = null;
  }
}

// ---------------------------------------------------------------- 提示音
function playBeep() {
  if (!settings.behavior.playSound) return;
  try { shell.beep(); } catch {}
}


/** 语言敏感文案：根据设置中的语言返回中/英文 */
function mainT(zh, en) {
  return (settings.ui && settings.ui.language === 'en') ? en : zh;
}

// ---------------------------------------------------------------- 自动更新（GitHub Releases）
const UPDATE_RELEASE_URL = 'https://api.github.com/repos/DMP-Pig/CodeBridge/releases/latest';

function parseVersionNum(v) {
  return String(v || '').replace(/^v/i, '').split(/[.\-]/).map((x) => {
    const n = parseInt(x, 10);
    return Number.isNaN(n) ? 0 : n;
  });
}

/** 判断 a 是否比 b 新（1.0.2beta1 > 1.0.1） */
function isNewerVersion(a, b) {
  const pa = parseVersionNum(a);
  const pb = parseVersionNum(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na > nb;
  }
  return false;
}

/** 启动时检查 GitHub Releases 最新版，发现新版本通知渲染进程 */
function checkForUpdates() {
  const req = https.get(UPDATE_RELEASE_URL, {
    headers: { 'User-Agent': APP_NAME, Accept: 'application/vnd.github+json' },
    timeout: 8000,
  }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => {
      let info = null;
      try {
        const data = JSON.parse(body);
        const latest = String(data.tag_name || '').replace(/^v/i, '');
        if (isNewerVersion(latest, APP_VERSION)) {
          info = {
            version: latest,
            name: data.name || data.tag_name || '',
            notes: String((data.body || '').slice(0, 600)),
            url: data.html_url || 'https://github.com/DMP-Pig/CodeBridge/releases',
            downloadUrl: (Array.isArray(data.assets) && data.assets[0] && data.assets[0].browser_download_url) || data.html_url || 'https://github.com/DMP-Pig/CodeBridge/releases',
          };
        }
      } catch (err) {
        console.error('解析更新信息失败:', err);
      }
      emitToRenderer('update:result', info ? { type: 'available', info } : { type: 'latest', info: null });
    });
  });
  req.on('error', (err) => emitToRenderer('update:result', { type: 'error', info: null }));
  req.on('timeout', () => { req.destroy(); emitToRenderer('update:result', { type: 'error', info: null }); });
}

// ---------------------------------------------------------------- 渲染进程通信
function emitToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// ---------------------------------------------------------------- 多显示器
function getDisplaysBrief() {
  try {
    const all = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    return all.map((d, i) => ({
      index: i,
      id: d.id,
      primary: d.id === primary.id,
      label: '显示器 ' + (i + 1),
      bounds: d.bounds,
      workArea: d.workArea,
    }));
  } catch { return []; }
}
function pickTargetDisplay() {
  try {
    const list = screen.getAllDisplays();
    if (list.length === 0) return null;
    const idx = Number(settings.island.displayIndex) || -1;
    if (idx >= 0 && list[idx]) return list[idx];
    try { return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()); } catch { return screen.getPrimaryDisplay(); }
  } catch { return null; }
}

// ---------------------------------------------------------------- 窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    show: false,
    title: APP_NAME,
    backgroundColor: '#0b1020',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 多显示器：跟随鼠标所在屏幕或按设置的目标显示器定位主窗口
  try {
    const disp = pickTargetDisplay();
    if (disp && disp.workArea) {
      const wa = disp.workArea;
      const w = Math.min(1120, wa.width);
      const h = Math.min(760, wa.height);
      mainWindow.setBounds({
        x: wa.x + Math.round((wa.width - w) / 2),
        y: wa.y + Math.round((wa.height - h) / 2),
        width: w,
        height: h,
      });
    }
  } catch (err) { console.error('定位窗口失败:', err); }
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // 关闭主界面窗口 = 隐藏到系统托盘，局域网服务继续后台运行（满足“后台存活”）
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon-32.png');
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) return;
    tray = new Tray(icon);
    tray.setToolTip(APP_NAME);
    const showMain = () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    };
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '打开主界面', click: showMain },
      { type: 'separator' },
      { label: mainT('开机自启', 'Launch at Startup'), type: 'checkbox', checked: !!settings.behavior.autoLaunch, click: (item) => {
        settings.behavior.autoLaunch = !!item.checked;
        saveSettings();
        applyAutoLaunch();
      } },
      { type: 'separator' },
      { label: '退出', click: () => { isQuitting = true; app.quit(); } },
    ]));
    tray.on('click', showMain);
  } catch (err) {
    console.error('创建托盘失败:', err);
  }
}

// ---------------------------------------------------------------- 悬浮窗（置顶展示最新验证码）
function floatingEnabled() {
  return !!(settings.ui && settings.ui.floatWindow !== false);
}
function floatingPosition() {
  const p = settings.ui && settings.ui.floatWindowPosition;
  return ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(p) ? p : 'top-right';
}
function floatingSeconds() {
  const n = Number(settings.ui && settings.ui.floatWindowSeconds);
  return Number.isFinite(n) && n > 0 ? n : 0;   // 0 = 不自动隐藏
}
function floatingBounds() {
  const W = 360, H = 96, M = 16;
  let disp = null;
  try { disp = pickTargetDisplay(); } catch (err) { disp = null; }
  let wa = null;
  try { wa = (disp && disp.workArea) || screen.getPrimaryDisplay().workArea; } catch (err) { wa = null; }
  if (!wa) wa = { x: 0, y: 0, width: 1920, height: 1080 };
  const pos = floatingPosition();
  let x = wa.x + wa.width - W - M;
  let y = wa.y + M;
  if (pos.indexOf('left') >= 0) x = wa.x + M;
  if (pos.indexOf('bottom') >= 0) y = wa.y + wa.height - H - M;
  return { x: Math.round(x), y: Math.round(y), width: W, height: H };
}
function createFloatingWindow() {
  if (VERIFY || VERIFY_SHOT) return null;
  if (floatingWindow && !floatingWindow.isDestroyed()) return floatingWindow;
  const b = floatingBounds();
  floatingWindow = new BrowserWindow({
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  try { floatingWindow.setAlwaysOnTop(true, 'screen-saver'); } catch (err) { floatingWindow.setAlwaysOnTop(true); }
  floatingWindow.loadFile(path.join(__dirname, '..', 'renderer', 'floating.html'));
  floatingWindow.once('ready-to-show', () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.showInactive();
  });
  floatingWindow.on('closed', () => { floatingWindow = null; });
  return floatingWindow;
}
function updateFloating(entry) {
  const win = createFloatingWindow();
  if (!win) return;
  const payload = Object.assign({}, entry, {
    uiLang: settings.ui && settings.ui.language === 'en' ? 'en' : 'zh',
    theme: settings.ui && settings.ui.theme === 'light' ? 'light' : 'dark',
  });
  const send = () => {
    try { if (!win.isDestroyed()) win.webContents.send('floating:new', payload); } catch (err) { /* 忽略 */ }
  };
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send);
  else send();
}
function showFloating(entry) {
  if (!floatingEnabled()) return;
  if (floatingHideTimer) { clearTimeout(floatingHideTimer); floatingHideTimer = null; }
  updateFloating(entry);
  const win = floatingWindow;
  if (win && !win.isDestroyed()) {
    try {
      const b = floatingBounds();
      win.setPosition(b.x, b.y);
      if (!win.webContents.isLoading()) win.showInactive();
    } catch (err) { /* 忽略 */ }
  }
  const secs = floatingSeconds();
  if (secs > 0) floatingHideTimer = setTimeout(hideFloating, secs * 1000);
}
function hideFloating() {
  if (floatingHideTimer) { clearTimeout(floatingHideTimer); floatingHideTimer = null; }
  if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.hide();
}
function syncFloatingWindow() {
  if (!floatingEnabled()) { hideFloating(); return; }
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    try {
      const b = floatingBounds();
      floatingWindow.setPosition(b.x, b.y);
    } catch (err) { /* 忽略 */ }
  }
}

// ---------------------------------------------------------------- 开机自启
function applyAutoLaunch() {
  // 仅 Windows / macOS 支持登录项
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  try {
    const login = {
      openAtLogin: !!settings.behavior.autoLaunch,
      openAsHidden: true,
      path: process.execPath,
    };
    // 开发模式下需要传入应用路径，否则会只启动 electron 元程
    if (!app.isPackaged) login.args = [app.getAppPath()];
    app.setLoginItemSettings(login);
  } catch (err) {
    console.error('设置开机自启失败:', err.message);
  }
}

// ---------------------------------------------------------------- IPC
// ---------------------------------------------------------------- 导出 / 导入
function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function historyToCsv(list) {
  const head = ['id', 'code', 'app', 'source', 'from', 'device', 'time'];
  const rows = (list || []).map((e) => [e.id, e.code, e.app, e.source, e.from, e.deviceName || '', e.time].map(csvEscape).join(','));
  return '\uFEFF' + head.join(',') + '\n' + rows.join('\n');
}
function parseCsvHistory(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  const src = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      row.push(cur); cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur !== '' || row.length) {
    row.push(cur);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}
function normalizeImported(raw) {
  const out = [];
  const seen = new Set((codeHistory || []).map((e) => e && e.id));
  for (const it of (raw || [])) {
    if (!it || typeof it !== 'object') continue;
    const id = String(it.id || '').trim() || crypto.randomUUID();
    const code = String(it.code || '').trim();
    if (!code) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const timeRaw = new Date(it.time || '');
    out.push({
      id,
      code,
      app: String(it.app || mainT('\u77ed\u4fe1', 'SMS')).slice(0, 40),
      source: String(it.source || '').slice(0, 40),
      from: String(it.from || '').slice(0, 64),
      time: !Number.isNaN(timeRaw.getTime()) ? timeRaw.toISOString() : new Date().toISOString(),
    });
  }
  return out;
}

// ---------------------------------------------------------------- 临时授权码配对（功能 17）
function generatePairingCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  pairingTicket = {
    code,
    expireAt: Date.now() + 30000,
    token: settings.server.token || '',
    port: settings.server.port,
  };
  return pairingTicket;
}
function currentPairingTicket() {
  if (pairingTicket && pairingTicket.expireAt > Date.now()) {
    // 令牌 / 端口若在有效期内被修改，则以当前设置为准
    pairingTicket.token = settings.server.token || '';
    pairingTicket.port = settings.server.port;
    return pairingTicket;
  }
  pairingTicket = null;
  return null;
}

// ---------------------------------------------------------------- 周报 / 月报 CSV（功能 10）
function reportPeriodLabel(days) {
  return mainT(days >= 30 ? '\u6708\u62A5' : '\u5468\u62A5', days >= 30 ? 'Monthly report' : 'Weekly report');
}
function buildReportCsv(list, days) {
  const L = [];
  const push = (arr) => L.push(arr.map(csvEscape).join(','));
  const t0 = Date.now() - days * 86400000;
  const fmtD = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };
  push([APP_NAME + ' ' + reportPeriodLabel(days), days + 'd']);
  push([mainT('\u7EDF\u8BA1\u5468\u671F', 'Period'), fmtD(t0) + ' - ' + fmtD(Date.now())]);
  push([mainT('\u9A8C\u8BC1\u7801\u603B\u6570', 'Total codes'), String(list.length)]);
  push([mainT('\u6765\u6E90\u5E94\u7528', 'App'), mainT('\u6570\u91CF', 'Count')]);
  const perApp = new Map();
  const perDay = new Map();
  for (const e of list) {
    const app = String(e.app || mainT('\u77ED\u4FE1', 'SMS'));
    perApp.set(app, (perApp.get(app) || 0) + 1);
    const d = new Date(e.time);
    const dk = (d.getMonth() + 1) + '/' + d.getDate();
    perDay.set(dk, (perDay.get(dk) || 0) + 1);
  }
  for (const [app, n] of [...perApp.entries()].sort((a, b) => b[1] - a[1])) push([app, String(n)]);
  push([]);
  push([mainT('\u65E5\u671F', 'Date'), mainT('\u6570\u91CF', 'Count')]);
  for (const [dk, n] of [...perDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) push([dk, String(n)]);
  push([]);
  push([mainT('\u660E\u7EC6', 'Details')]);
  push(['id', 'code', 'app', 'source', 'from', 'device', 'time']);
  for (const e of list) push([e.id, e.code, e.app, e.source, e.from, e.deviceName || '', e.time]);
  return '\uFEFF' + L.join('\n');
}

function registerIpc() {
  ipcMain.handle('app:info', () => ({
    name: APP_NAME,
    version: APP_VERSION,
    platform: process.platform,
    server: { running: !!server, port: settings.server.port },
  }));

  ipcMain.handle('settings:get', () => settings);

  ipcMain.handle('settings:set', async (_e, patch) => {
    settings = deepMerge(settings, patch || {});
    saveSettings();
    await startServer();
    startRelayClient();
    applyAutoLaunch();
    startClipboardWatch();
    syncFloatingWindow();
    return settings;
  });

  ipcMain.handle('server:restart', async () => {
    await startServer();
    return { running: !!server, port: settings.server.port };
  });

  ipcMain.handle('server:status', () => ({
    running: !!server,
    port: settings.server.port,
    ips: getLanIps(),
    error: null,
  }));

  ipcMain.handle('code:list', () => codeHistory);

  ipcMain.handle('devices:list', () => devicesToArray());

  ipcMain.handle('health:snapshot', () => {
    const r = settings.behavior.relay || {};
    return {
      startedAt: serverStartAt,
      uptimeSec: serverStartAt ? Math.round((Date.now() - serverStartAt) / 1000) : 0,
      port: settings.server.port,
      received: statReceived,
      blocked: statBlocked,
      relayMsg: statRelayMsg,
      devices: devicesToArray(),
      relay: {
        enabled: !!(r.enabled),
        url: String(r.url || ''),
        room: String(r.room || ''),
        lastOk: relayLastOk || 0,
        lastErr: relayLastErr || '',
        lastErrAt: relayLastErrAt || 0,
      },
    };
  });
  ipcMain.handle('displays:list', () => getDisplaysBrief());

  ipcMain.handle('code:clear', () => { codeHistory = []; saveHistory(); return true; });

  ipcMain.handle('clipboard:write', (_e, text) => { copyText(String(text || '')); return true; });
  ipcMain.handle('clipboard-history:list', () => ({
    enabled: settings.behavior.clipboardHistoryEnabled !== false,
    max: Number(settings.ui.clipboardHistoryMax) || clipboardHistoryMaxDefault,
    items: clipboardHistory,
  }));
  ipcMain.handle('clipboard-history:clear', () => {
    clipboardHistory = [];
    saveClipboardHistory();
    emitToRenderer('clipboard-history:changed', { items: [] });
    return true;
  });
  ipcMain.handle('clipboard-history:copy', (_e, id) => {
    const entry = clipboardHistory.find((x) => x.id === id);
    if (entry) copyText(entry.text, 'history');
    return !!entry;
  });
  ipcMain.handle('clipboard-history:remove', (_e, id) => {
    clipboardHistory = clipboardHistory.filter((x) => x.id !== id);
    saveClipboardHistory();
    emitToRenderer('clipboard-history:changed', { items: clipboardHistory });
    return true;
  });
  ipcMain.handle('action:test-webhook', () => {
    triggerWebhookScript({
      id: 'test-' + Date.now(),
      code: '123456',
      app: mainT('测试', 'Test'),
      source: 'test',
      from: '127.0.0.1',
      time: new Date().toISOString(),
    });
    return true;
  });

  ipcMain.handle('code:copy', (_e, id) => {
    const entry = codeHistory.find((c) => c.id === id);
    if (entry) { copyText(entry.code, 'history'); return true; }
    return false;
  });

  ipcMain.handle('code:remove', (_e, id) => {
    codeHistory = codeHistory.filter((c) => c.id !== id);
    saveHistory();
    return true;
  });


  ipcMain.handle('history:export-dialog', async (_e, format) => {
    const fmt = format === 'json' ? 'json' : 'csv';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let defDir;
    try { defDir = app.getPath('downloads'); } catch { defDir = app.getPath('home'); }
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: mainT('\u5bfc\u51fa\u9a8c\u8bc1\u7801\u5386\u53f2', 'Export code history'),
      defaultPath: path.join(defDir, 'CodeBridge-history-' + stamp + '.' + fmt),
      filters: fmt === 'json'
        ? [{ name: 'JSON', extensions: ['json'] }]
        : [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    const content = fmt === 'json' ? JSON.stringify(codeHistory, null, 2) : historyToCsv(codeHistory);
    fs.writeFileSync(filePath, content, 'utf8');
    return { ok: true, path: filePath, count: codeHistory.length };
  });

  ipcMain.handle('history:import-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: mainT('\u5bfc\u5165\u9a8c\u8bc1\u7801\u5386\u53f2', 'Import code history'),
      properties: ['openFile'],
      filters: [{ name: 'CSV / JSON', extensions: ['csv', 'json'] }],
    });
    if (canceled || !filePaths || !filePaths[0]) return { ok: false, canceled: true };
    const fp = filePaths[0];
    let entries = [];
    try {
      const raw = fs.readFileSync(fp, 'utf8');
      const lower = fp.toLowerCase();
      if (lower.endsWith('.json')) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) entries = arr;
        else if (arr && Array.isArray(arr.records)) entries = arr.records;
        else return { ok: false, error: 'invalid' };
      } else {
        const rows = parseCsvHistory(raw);
        if (rows.length < 2) return { ok: false, error: 'empty' };
        const head = rows[0].map((h) => String(h || '').trim().toLowerCase());
        const gi = (name) => head.indexOf(name);
        entries = rows.slice(1).map((r) => ({
          id: gi('id') >= 0 ? r[gi('id')] : '',
          code: gi('code') >= 0 ? r[gi('code')] : '',
          app: gi('app') >= 0 ? r[gi('app')] : '',
          source: gi('source') >= 0 ? r[gi('source')] : '',
          from: gi('from') >= 0 ? r[gi('from')] : '',
          time: gi('time') >= 0 ? r[gi('time')] : '',
        })).filter((it) => String(it.code || '').trim());
      }
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
    const added = normalizeImported(entries);
    if (added.length) {
      codeHistory = added.concat(codeHistory);
      autoCleanHistory();
      const max = Math.max(10, settings.ui.keepHistory || 50);
      if (codeHistory.length > max) codeHistory.length = max;
      saveHistory();
    }
    return { ok: true, added: added.length, skipped: entries.length - added.length };
  });

  ipcMain.handle('island:push', async (_e, id) => {
    const entry = codeHistory.find((c) => c.id === id) || (id === 'last' ? codeHistory[0] : null);
    if (!entry) return { ok: false, error: '未找到该验证码' };
    try {
      await pushToIsland(entry);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('floating:hide', () => { hideFloating(); return true; });
  ipcMain.handle('window:minimize', () => mainWindow && mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow && mainWindow.close());
  ipcMain.handle('shell:open-external', (_e, url) => shell.openExternal(url));
  ipcMain.handle('update:check', () => { checkForUpdates(); return true; });

  // 临时授权码（功能 17）：生成 6 位授权码，30 秒有效；手机端输入后通过 /health 读取配对信息
  ipcMain.handle('pairing:code-generate', () => {
    const tkt = generatePairingCode();
    return { ok: true, code: tkt.code, expiresIn: 30, token: tkt.token, port: tkt.port };
  });
  ipcMain.handle('pairing:code-status', () => {
    const tkt = currentPairingTicket();
    return tkt ? { ok: true, code: tkt.code, expireAt: tkt.expireAt, token: tkt.token, port: tkt.port } : { ok: false, code: '' };
  });

  // 周报 / 月报导出 CSV（功能 10）
  ipcMain.handle('history:export-report', async (_e, days) => {
    const n = Math.max(1, Math.min(365, Math.floor(Number(days) || 7)));
    const since = Date.now() - n * 86400000;
    const list = (codeHistory || []).filter((e) => {
      const ts = new Date(e && e.time || '').getTime();
      return !Number.isNaN(ts) && ts >= since;
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let defDir;
    try { defDir = app.getPath('downloads'); } catch { defDir = app.getPath('home'); }
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: mainT('\u5bfc\u51fa' + (n >= 30 ? '\u6708\u62a5' : '\u5468\u62a5') + ' CSV', 'Export ' + (n >= 30 ? 'monthly' : 'weekly') + ' report CSV'),
      defaultPath: path.join(defDir, 'CodeBridge-report-' + n + 'd-' + stamp + '.csv'),
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    fs.writeFileSync(filePath, buildReportCsv(list, n), 'utf8');
    return { ok: true, path: filePath, count: list.length };
  });

  // 扫码配对：生成包含本机地址 / 端口 / Token 的二维码
  ipcMain.handle('pairing:qr', async () => {
    const ips = getLanIps();
    // getLanIps() 返回 {name,address} 对象数组，二维码里只需 address；
    // 优先选择局域网网段（10.x / 172.16-31.x / 192.168.x），避免取到虚拟网卡导致手机连不上
    const lan = ips.find((it) => {
      const a = String(it.address).split('.').map(Number);
      return a.length === 4 && (a[0] === 10 || (a[0] === 172 && a[1] >= 16 && a[1] <= 31) || (a[0] === 192 && a[1] === 168));
    });
    const host = (lan || ips[0] || {}).address || '127.0.0.1';
    const payload = {
      app: 'CodeBridge',
      name: APP_NAME,
      deviceName: os.hostname(),  // 功能 4：扫码后自动作为手机端该 PC 配置的名称
      version: APP_VERSION,
      host,
      port: settings.server.port,
      token: settings.server.token || '',
      id: deviceId,
    };
    let dataUrl = '';
    try {
      dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
        width: 360, margin: 1, errorCorrectionLevel: 'M',
        color: { dark: '#0b1220ff', light: '#ffffffff' },
      });
    } catch (err) {
      console.error('生成二维码失败:', err);
    }
    return { dataUrl, payload, ips };
  });
}

// ---------------------------------------------------------------- 生命周期
if (!process.argv.includes('--copy-last')) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    });
  }
}

// 被 WinIsland 灵动岛按钮启动：把最后一条验证码复制到剪贴板后退出
if (process.argv.includes('--copy-last')) {
  app.whenReady().then(() => {
    loadHistory();
    loadClipboardHistory();
    if (codeHistory[0]) copyText(codeHistory[0].code, 'history');
    app.exit(0);
  });
} else {
app.whenReady().then(() => {
  loadHistory();
  loadClipboardHistory();
  autoCleanHistory();
  registerIpc();
  applyAutoLaunch();
  startClipboardWatch();
  createWindow();
  createTray();
  startServer().catch(() => {});
  startRelayClient();
  if (!VERIFY && !VERIFY_SHOT) setTimeout(checkForUpdates, 4000);
  if (VERIFY || VERIFY_SHOT) runVerify();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

} // end else (--copy-last)

// 关闭主界面后继续后台运行：所有平台都不因窗口关闭而退出（由托盘“退出”真正结束）
app.on('window-all-closed', () => { });
app.on('before-quit', () => {
  isQuitting = true;
  if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.destroy();
});


// ---------------------------------------------------------------- 验证模式（--verify / --screenshot）
async function runVerify() {
  try {
    await new Promise((r) => setTimeout(r, 1500));
    // 推送两条测试验证码（第二条同码，用于验证「重复验证码防刷屏」）
    const pushCode = (payload) => new Promise((resolve) => {
      const req = https.request({
        host: '127.0.0.1',
        port: settings.server.port,
        path: '/api/code',
        method: 'POST',
        rejectUnauthorized: false,
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch (err) { resolve(null); } });
      });
      req.on('error', () => resolve(null));
      req.end(payload);
    });
    const basePayload = { code: '820346', app: '测试短信', source: '13800000000', codeType: 'login', verify: true };
    const firstRes = await pushCode(JSON.stringify(basePayload));
    const secondRes = await pushCode(JSON.stringify(basePayload));
    const thirdPayload = { code: '965214', app: '\u6dd8\u5b9d', source: '10658888999', verify: true };
    const thirdRes = await pushCode(JSON.stringify(thirdPayload));
    await new Promise((r) => setTimeout(r, 2500));
    const result = await mainWindow.webContents.executeJavaScript(`(() => {
      const q = (s) => document.querySelector(s);
      return {
        title: document.title,
        statusTitle: q('#statusTitle')?.textContent || '',
        statusClass: q('#statusCard')?.className || '',
        heroVisible: q('#heroContent') ? !q('#heroContent').classList.contains('hidden') : false,
        heroCode: q('#heroCode')?.textContent || '',
        historyCards: document.querySelectorAll('.history-card').length,
        ipChips: document.querySelectorAll('.ip-chip').length,
        errors: window.__p2pErrors || [],
        heroExpiryVisible: q('#heroExpiry') ? !q('#heroExpiry').classList.contains('hidden') : false,
        heroExpiryText: (q('#heroExpiry')?.textContent || '').trim(),
        heroTypeText: q('#heroType')?.textContent || '',
        heroTypeClass: q('#heroType')?.className || '',
        historyTypeBadges: document.querySelectorAll('.history-type').length,
        historyExpiryBadges: document.querySelectorAll('.history-expiry').length,
        expiredCards: document.querySelectorAll('.history-card.expired').length,
        healthItems: document.querySelectorAll('.health-item').length,
        healthValues: Array.from(document.querySelectorAll('.health-value')).map((e) => e.textContent),
        healthHint: q('#healthHint')?.textContent || '',
        reportBtns: document.querySelectorAll('.report-btns .text-btn').length,
        reportEmptyText: (q('#reportOutput')?.textContent || '').trim(),
        groupHeaders: document.querySelectorAll('.history-group').length,
        shareBtn: !!q('#btnShareSummary'),

      };
    })()`);
    // 走真实上岛流程（与点击「上岛」按钮完全一致）
    let islandRes = { ok: false, error: '未执行' };
    if (codeHistory[0]) {
      try { await pushToIsland(codeHistory[0]); islandRes = { ok: true }; }
      catch (err) { islandRes = { ok: false, error: err.message }; }
    }
    if (codeHistory[0]) {
      const pl = buildIslandPayload(codeHistory[0]);
      result.islandTitlePx = measureTextWidth(pl.title, 13, 7);   // 紧凑标题宽度（MaxWidth=150）
      result.islandBodyPx = pl.body ? measureTextWidth(pl.body, 13.5, 7) : 0;
      result.islandSingleLine = !pl.title.includes('\n') && !pl.body.includes('\n');
      result.islandPayload = { title: pl.title, body: pl.body, button: pl.buttons[0].label };
    }
    if (codeHistory[0]) {
      const tplPl = buildIslandPayload(codeHistory[0]);
      result.tpl = {
        matched: !!codeHistory[0].platform,
        codeType: codeHistory[0].codeType,
        name: codeHistory[0].platform && codeHistory[0].platform.name,
        title: tplPl.title,
        singleLine: !tplPl.title.includes('\n'),
        icon: tplPl.icon,
      };
    }
    result.islandPush = islandRes;
    result.dedupeTest = { firstOk: !!(firstRes && firstRes.ok), secondDeduped: !!(secondRes && secondRes.deduped) };
    console.log('VERIFY_RESULT ' + JSON.stringify(result));
    const img = await mainWindow.webContents.capturePage();
    const outPath = VERIFY_SHOT
      ? process.argv[process.argv.indexOf('--screenshot') + 1] || path.join(app.getPath('userData'), 'screenshot.png')
      : path.join(app.getPath('userData'), 'screenshot.png');
    fs.writeFileSync(outPath, img.toPNG());
    console.log('VERIFY_SCREENSHOT ' + outPath);
  } catch (err) {
    console.log('VERIFY_ERROR ' + (err && err.message));
  }
  app.quit();
}





