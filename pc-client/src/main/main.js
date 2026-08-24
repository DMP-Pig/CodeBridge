/**
 * PhoneToPCCopyCode · PC 端主进程
 * 职责：局域网 HTTP 服务（接收手机推送的验证码）、设置持久化、
 *       WinIsland 上岛推送、剪贴板、窗口/托盘管理。
 */
const { app, BrowserWindow, ipcMain, clipboard, Menu, Tray, nativeImage, shell, Notification } = require('electron');
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
    autoInput: false,       // 收到验证码自动输入到当前焦点输入框
  },
  island: {
    baseUrl: 'http://127.0.0.1:9840',
    token: '',              // WinIsland 设置的 X-WinIsland-Token
    durationSeconds: 30,
    icon: '\\uE8D6',        // 钥匙图标（Segoe MDL2）
  },
  ui: {
    accent: '#6ea8ff',
    keepHistory: 50,        // 保留历史条数
    autoCleanDays: 7,       // 自动清理天数（0=关闭）
    theme: 'dark',          // 'dark' | 'light' 深浅色主题
    language: 'zh',         // 'zh' | 'en' 界面语言
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
let server = null;
let mainWindow = null;
let tray = null;
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
function addHistory(entry) {
  autoCleanHistory();
  codeHistory.unshift(entry);
  const max = Math.max(10, settings.ui.keepHistory || 50);
  if (codeHistory.length > max) codeHistory.length = max;
  saveHistory();
  // 系统通知
  if (settings.behavior.systemNotify && Notification.isSupported()) {
    try {
      new Notification({
        title: APP_NAME,
        body: `${entry.app || mainT('短信', 'SMS')}: ${entry.code}`,
      }).show();
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

// ---------------------------------------------------------------- 剪贴板
function copyText(text) {
  clipboard.writeText(text || '');
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
    copyText(code);
    return;
  }
  // 首次复制前保存当前剪贴板（后续验证码不覆盖原值）
  if (clipboardRestoreTimer == null) {
    clipboardRestoreValue = clipboard.readText();
  }
  copyText(code);
  if (clipboardRestoreTimer) clearTimeout(clipboardRestoreTimer);
  if (secs > 0) {
    clipboardRestoreTimer = setTimeout(() => {
      clipboardRestoreTimer = null;
      const prev = clipboardRestoreValue;
      clipboardRestoreValue = null;
      if (prev != null) {
        copyText(prev);
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
function buildIslandPayload(entry) {
  const bodyParts = ['验证码'];
  if (entry.app) bodyParts.push(`来自 ${entry.app}`);
  if (entry.source) bodyParts.push(entry.source);
  return {
    title: `${entry.code}`,           // 紧凑标题只放验证码，保证固定宽度内完整显示
    body: bodyParts.join(' · '),      // 展开态正文：验证码 · 来自 X · Y（单行）
    icon: decodeIconEscape(settings.island.icon) || '\uE8D6',
    duration_seconds: Number(settings.island.durationSeconds) || 30,
    id: `phonetopc-${entry.id}`,
    buttons: [
      { label: '复制', action: 'launch', value: `${process.execPath} --copy-last` },
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
  const expected = settings.server.token || '';
  if (!expected) return true;
  const header = req.headers['x-p2p-token'];
  const bodyToken = body && body.token;
  return header === expected || bodyToken === expected;
}

function sendJson(res, status, obj) {
  const text = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

async function handleRequest(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, { ok: true, name: APP_NAME, version: APP_VERSION, id: deviceId, hostname: os.hostname(), time: new Date().toISOString() });
  }

  if (req.method === 'POST' && pathname === '/api/code') {
    let body;
    try { body = await readJsonBody(req); } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
    if (!checkToken(req, body)) {
      return sendJson(res, 401, { ok: false, error: 'token 无效' });
    }
    const code = String(body.code || '').trim();
    if (!code) return sendJson(res, 400, { ok: false, error: '缺少 code 字段' });

    const entry = {
      id: crypto.randomUUID(),
      code,
      app: String(body.app || '短信').slice(0, 40),
      source: String(body.source || '').slice(0, 40),
      from: req.socket.remoteAddress || '',
      time: new Date().toISOString(),
    };
    addHistory(entry);
    emitToRenderer('code:new', entry);
    handleAutoActions(entry);
    return sendJson(res, 200, { ok: true, id: entry.id });
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
}

/**
 * 模拟键盘输入验证码到当前聚焦的输入框（跨平台）
 * Windows: PowerShell WScript.Shell SendKeys（临时脚本，UTF-16LE）
 * macOS:   osascript System Events keystroke（需辅助功能权限）
 * Linux:   xdotool type（需已安装 xdotool）
 */
function escapeSendKeys(s) {
  const special = ['+', '^', '%', '~', '(', ')', '[', ']', '<', '>'];
  let out = '';
  for (const ch of String(s)) {
    if (ch === '{') out += '{{}';
    else if (ch === '}') out += '{}}';
    else if (special.includes(ch)) out += `{${ch}}`;
    else out += ch;
  }
  return out;
}

function simulateTyping(text) {
  const t = String(text || '');
  if (!t) return;
  if (process.platform === 'win32') {
    const psFile = path.join(os.tmpdir(), `cb_type_${Date.now()}_${Math.floor(Math.random() * 1e6)}.ps1`);
    const keys = escapeSendKeys(t).replace(/'/g, "''");
    const script = `$w = New-Object -ComObject WScript.Shell\n$w.SendKeys('${keys}')\n`;
    try {
      fs.writeFileSync(psFile, '\ufeff' + script, 'utf16le');
      execFile('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', psFile], () => {
        try { fs.unlinkSync(psFile); } catch (e) { /* ignore */ }
      });
    } catch (err) {
      console.error('自动输入失败:', err);
      try { fs.unlinkSync(psFile); } catch (e) { /* ignore */ }
    }
  } else if (process.platform === 'darwin') {
    const script = `tell application "System Events" to keystroke ${JSON.stringify(t)}`;
    execFile('osascript', ['-e', script], (err) => {
      if (err) console.error('自动输入失败(macOS):', err.message);
    });
  } else if (process.platform === 'linux') {
    execFile('xdotool', ['type', '--delay', '40', t], (err) => {
      if (err) console.error('自动输入失败(Linux):', err.message);
    });
  }
}

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
  // 自动输入到当前焦点输入框（延迟片刻，避免打断用户当前操作）
  if (settings.behavior.autoInput) {
    setTimeout(() => {
      simulateTyping(entry.code);
      emitToRenderer('action:notice', { kind: 'input', text: mainT('已自动输入验证码', 'Code typed automatically') });
    }, 600);
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    stopServer();
    if (!settings.server.enabled) {
      emitToRenderer('server:status', { running: false, port: settings.server.port, ips: [], error: '服务器已停用' });
      return resolve(false);
    }
    server = http.createServer(handleRequest);
    server.on('error', (err) => {
      emitToRenderer('server:status', { running: false, port: settings.server.port, ips: [], error: err.message });
      reject(err);
    });
    server.listen(settings.server.port, '0.0.0.0', () => {
      const ips = getLanIps();
      emitToRenderer('server:status', { running: true, port: settings.server.port, ips });
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
      { label: '退出', click: () => { isQuitting = true; app.quit(); } },
    ]));
    tray.on('click', showMain);
  } catch (err) {
    console.error('创建托盘失败:', err);
  }
}

// ---------------------------------------------------------------- IPC
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

  ipcMain.handle('code:clear', () => { codeHistory = []; saveHistory(); return true; });

  ipcMain.handle('clipboard:write', (_e, text) => { copyText(String(text || '')); return true; });

  ipcMain.handle('code:copy', (_e, id) => {
    const entry = codeHistory.find((c) => c.id === id);
    if (entry) { copyText(entry.code); return true; }
    return false;
  });

  ipcMain.handle('code:remove', (_e, id) => {
    codeHistory = codeHistory.filter((c) => c.id !== id);
    saveHistory();
    return true;
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

  ipcMain.handle('window:minimize', () => mainWindow && mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow && mainWindow.close());
  ipcMain.handle('shell:open-external', (_e, url) => shell.openExternal(url));
  ipcMain.handle('update:check', () => { checkForUpdates(); return true; });

  // 扫码配对：生成包含本机地址 / 端口 / Token 的二维码
  ipcMain.handle('pairing:qr', async () => {
    const ips = getLanIps();
    const host = ips[0] || '127.0.0.1';
    const payload = {
      app: 'CodeBridge',
      name: APP_NAME,
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
// 单实例：再次运行 exe 时恢复主窗口（--copy-last 副本模式除外）
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
    if (codeHistory[0]) copyText(codeHistory[0].code);
    app.exit(0);
  });
} else {
app.whenReady().then(() => {
  loadHistory();
  autoCleanHistory();
  registerIpc();
  createWindow();
  createTray();
  startServer().catch(() => {});
  if (!VERIFY && !VERIFY_SHOT) setTimeout(checkForUpdates, 4000);
  if (VERIFY || VERIFY_SHOT) runVerify();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

} // end else (--copy-last)

// 关闭主界面后继续后台运行：所有平台都不因窗口关闭而退出（由托盘“退出”真正结束）
app.on('window-all-closed', () => { });
app.on('before-quit', () => { isQuitting = true; });


// ---------------------------------------------------------------- 验证模式（--verify / --screenshot）
async function runVerify() {
  try {
    await new Promise((r) => setTimeout(r, 1500));
    // 推送两条测试验证码
    const payload = JSON.stringify({ code: '820346', app: '测试短信', source: '13800000000' });
    await fetch(`http://127.0.0.1:${settings.server.port}/api/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {});
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
    result.islandPush = islandRes;
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





