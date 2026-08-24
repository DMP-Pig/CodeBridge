/**
 * 预加载脚本：通过 contextBridge 向渲染进程暴露安全 API。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('p2p', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  restartServer: () => ipcRenderer.invoke('server:restart'),
  getServerStatus: () => ipcRenderer.invoke('server:status'),
  listCodes: () => ipcRenderer.invoke('code:list'),
  listDevices: () => ipcRenderer.invoke('devices:list'),
  clearCodes: () => ipcRenderer.invoke('code:clear'),
  copyCode: (id) => ipcRenderer.invoke('code:copy', id),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  removeCode: (id) => ipcRenderer.invoke('code:remove', id),
  pushIsland: (id) => ipcRenderer.invoke('island:push', id),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  getPairingQr: () => ipcRenderer.invoke('pairing:qr'),
  on: (channel, cb) => {
    const allowed = ['code:new', 'server:status', 'action:notice', 'update:result', 'device:status'];
    if (allowed.includes(channel)) {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return () => {};
  },
});

