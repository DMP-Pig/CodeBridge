/**
 * CodeBridge 悬浮窗渲染逻辑：展示最新验证码，点击复制，可拖拽，自动隐藏由主进程控制。
 */
document.addEventListener('DOMContentLoaded', () => {
  const els = {
    card: document.getElementById('floatCard'),
    code: document.getElementById('floatCode'),
    meta: document.getElementById('floatMeta'),
    expiry: document.getElementById('floatExpiry'),
    icon: document.getElementById('floatIcon'),
    copy: document.getElementById('floatCopy'),
    close: document.getElementById('floatClose'),
  };
  let last = null;
  let lang = 'zh';
  const T = {
    zh: { wait: '等待验证码…', copy: '复制到剪贴板', hide: '隐藏悬浮窗', copied: '✓', expired: '已过期' },
    en: { wait: 'Waiting for code…', copy: 'Copy to clipboard', hide: 'Hide window', copied: '✓', expired: 'Expired' },
  };
  function tr(k) { return (T[lang] || T.zh)[k]; }
  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }
  function render(entry) {
    if (!entry) {
      els.code.textContent = '------';
      els.meta.textContent = tr('wait');
      els.expiry.classList.add('hidden');
      els.card.classList.remove('expired');
      return;
    }
    last = entry;
    lang = entry.uiLang || lang;
    applyTheme(entry.theme);
    if (entry.uiLang || entry.theme || entry.title) { /* theme/lang refresh */ }
    document.title = 'CodeBridge';
    els.code.textContent = entry.code || '';
    const app = entry.app || (lang === 'en' ? 'SMS' : '短信');
    const parts = [app];
    if (entry.source) parts.push(entry.source);
    if (entry.time) {
      try { parts.push(new Date(entry.time).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })); } catch { /* ignore */ }
    }
    els.meta.textContent = parts.join(' · ');
    if (entry.expiresAt) {
      const remain = entry.expiresAt - Date.now();
      els.expiry.classList.remove('hidden');
      els.expiry.textContent = remain <= 0 ? tr('expired') : `⏱ ${fmt(remain)}`;
      els.expiry.classList.toggle('expired', remain <= 0);
      els.card.classList.toggle('expired', remain <= 0);
    } else {
      els.expiry.classList.add('hidden');
      els.card.classList.remove('expired');
    }
    els.copy.title = tr('copy');
    els.copy.setAttribute('aria-label', tr('copy'));
    els.close.title = tr('hide');
    els.close.setAttribute('aria-label', tr('hide'));
    els.copy.textContent = '⧉';
    els.card.classList.remove('pulse');
    void els.card.offsetWidth;
    els.card.classList.add('pulse');
  }
  applyTheme('dark');
  render(null);
  setInterval(() => {
    if (!last || !last.expiresAt) return;
    const remain = last.expiresAt - Date.now();
    els.expiry.classList.remove('hidden');
    els.expiry.textContent = remain <= 0 ? tr('expired') : `⏱ ${fmt(remain)}`;
    els.expiry.classList.toggle('expired', remain <= 0);
    els.expiry.classList.toggle('expiring', remain > 0 && remain <= 60000);
    els.card.classList.toggle('expired', remain <= 0);
  }, 1000);
  if (window.p2p) {
    window.p2p.on('floating:new', render);
    els.copy.addEventListener('click', () => {
      if (!last) return;
      if (last.expiresAt && Date.now() >= last.expiresAt) {
        els.copy.textContent = tr('expired');
        setTimeout(() => { els.copy.textContent = '⧉'; }, 900);
        return;
      }
      window.p2p.copyCode(last.id).then((ok) => {
        els.copy.textContent = ok ? tr('copied') : '⧉';
        setTimeout(() => { els.copy.textContent = '⧉'; }, 900);
      }).catch(() => { els.copy.textContent = '⧉'; });
    });
    els.close.addEventListener('click', () => window.p2p.hideFloating());
  }
});