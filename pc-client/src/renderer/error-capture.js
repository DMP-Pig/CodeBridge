// 页面错误捕获：供 --verify 模式检测渲染进程异常
window.__p2pErrors = [];
window.addEventListener('error', (e) => {
  try { window.__p2pErrors.push(String((e && e.message) || (e && e.error) || 'unknown error')); } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try { window.__p2pErrors.push('rejection: ' + String(((e && e.reason && e.reason.message) || (e && e.reason) || 'unknown'))); } catch (_) {}
});
