/**
 * PhoneToPCCopyCode · PC 端主进程
 * 职责：局域网 HTTP 服务（接收手机推送的验证码）、设置持久化、
 *       WinIsland 上岛推送、剪贴板、窗口/托盘管理。
 */
const { app, BrowserWindow, ipcMain, clipboard, Menu, Tray, nativeImage, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const APP_NAME = 'PhoneToPCCopyCode';
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
    autoCopy: false,        // 收到验证码自动复制到剪贴板
    autoIsland: false,      // 收到验证码自动推送到 WinIsland
    playSound: true,        // 收到验证码播放提示音
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
  },
};

let settings = loadSettings();
let codeHistory = [];       // 最新在前
let server = null;
let mainWindow = null;
let tray = null;

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
  codeHistory.unshift(entry);
  const max = Math.max(10, settings.ui.keepHistory || 50);
  if (codeHistory.length > max) codeHistory.length = max;
  saveHistory();
}

// ---------------------------------------------------------------- 剪贴板
function copyText(text) {
  clipboard.writeText(text || '');
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
function pushToIsland(entry) {
  return new Promise((resolve, reject) => {
    const base = (settings.island.baseUrl || 'http://127.0.0.1:9840').replace(/\/+$/, '');
    const payload = {
      title: '短信验证码',
      body: `验证码：${entry.code}${entry.app ? `\n来源：${entry.app}` : ''}${entry.source ? `\n号码：${entry.source}` : ''}`,
      icon: decodeIconEscape(settings.island.icon) || '\uE8D6',
      duration_seconds: Number(settings.island.durationSeconds) || 30,
      id: `phonetopc-${entry.id}`,
      buttons: [
        { label: '复制验证码', action: 'launch', value: `${process.execPath} --copy-last` },
      ],
    };
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
    return sendJson(res, 200, { ok: true, name: APP_NAME, version: APP_VERSION, time: new Date().toISOString() });
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

function handleAutoActions(entry) {
  // 自动复制
  if (settings.behavior.autoCopy) {
    copyText(entry.code);
    emitToRenderer('action:notice', { kind: 'copy', text: '已自动复制到剪贴板' });
  }
  // 自动上岛
  if (settings.behavior.autoIsland) {
    pushToIsland(entry)
      .then(() => emitToRenderer('action:notice', { kind: 'island', text: '已自动上岛' }))
      .catch((err) => emitToRenderer('action:notice', { kind: 'error', text: err.message }));
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
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '打开主界面', click: () => { if (mainWindow) mainWindow.show(); } },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ]));
    tray.on('click', () => { if (mainWindow) mainWindow.show(); });
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
}

// ---------------------------------------------------------------- 生命周期
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
  registerIpc();
  createWindow();
  createTray();
  startServer().catch(() => {});
  if (VERIFY || VERIFY_SHOT) runVerify();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

} // end else (--copy-last)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


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





