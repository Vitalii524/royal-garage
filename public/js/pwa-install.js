/* Installation UI only. Never caches account data or asks for Push permission. */
(() => {
  'use strict';
  const key = 'rg-install-dismissed-until';
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const safari = ios && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
  let promptEvent = null;
  let panel = null;
  let installed = false;
  function dismissed() {
    try { return Number(localStorage.getItem(key)) > Date.now(); } catch { return false; }
  }
  function remove() { panel?.remove(); panel = null; }
  function dismiss() {
    try { localStorage.setItem(key, String(Date.now() + 30 * 86400000)); } catch {}
    remove();
  }
  function show() {
    if (!document.body || panel || installed || standalone() || !mobile || dismissed() || (!promptEvent && !ios)) return;
    const en = document.documentElement.lang.toLowerCase().startsWith('en');
    panel = document.createElement('aside');
    panel.className = 'rg-install';
    panel.setAttribute('aria-label', en ? 'Install Royal Garage' : 'Встановити Royal Garage');
    const title = document.createElement('strong');
    title.textContent = en ? 'Install Royal Garage' : 'Встановити Royal Garage';
    panel.append(title);
    if (ios) {
      const help = document.createElement('p');
      help.textContent = safari
        ? (en ? 'In Safari: Share → Add to Home Screen → Add.' : 'У Safari: «Поділитися» → «На початковий екран» → «Додати».')
        : (en ? 'Open this site in Safari, then Share → Add to Home Screen.' : 'Відкрийте сайт у Safari, потім «Поділитися» → «На початковий екран».');
      panel.append(help);
    } else {
      const install = document.createElement('button');
      install.type = 'button';
      install.textContent = en ? 'Install' : 'Встановити';
      install.addEventListener('click', async () => {
        const event = promptEvent;
        if (!event) return;
        install.disabled = true;
        try {
          await event.prompt();
          const choice = await event.userChoice;
          promptEvent = null;
          if (choice.outcome === 'accepted') remove(); else dismiss();
        } catch {
          // A consumed/expired browser event must not leave a broken install button.
          promptEvent = null;
          remove();
        }
      });
      panel.append(install);
    }
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'rg-install-later';
    later.textContent = en ? 'Not now' : 'Не зараз';
    later.addEventListener('click', dismiss);
    panel.append(later);
    document.body.append(panel);
  }
  window.addEventListener('beforeinstallprompt', event => {
    if (!mobile || standalone() || dismissed()) return;
    event.preventDefault();
    promptEvent = event;
    show();
  });
  window.addEventListener('appinstalled', () => { installed = true; promptEvent = null; remove(); });
  window.addEventListener('storage', event => { if (event.key === key && dismissed()) remove(); });
  function init() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link'); link.rel = 'manifest'; link.href = '/manifest.json'; document.head.append(link);
    }
    const tags = { 'apple-mobile-web-app-capable': 'yes', 'apple-mobile-web-app-title': 'Royal Garage', 'apple-mobile-web-app-status-bar-style': 'black-translucent' };
    for (const [name, content] of Object.entries(tags)) {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta'); meta.name = name; meta.content = content; document.head.append(meta);
      }
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const icon = document.createElement('link'); icon.rel = 'apple-touch-icon'; icon.href = '/images/icon-192.png'; document.head.append(icon);
    }
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
