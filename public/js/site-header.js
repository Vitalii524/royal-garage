// Separate navigation from the homepage hero so sticky positioning lasts the whole page.
// Load one shared install UI without changing navigation, account state or Push handling.
(() => {
    if (document.querySelector('script[data-rg-install]')) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '/css/pwa-install.css?v=20261121';
    document.head.append(css);
    const script = document.createElement('script');
    script.src = '/js/pwa-install.js?v=20261121'; script.dataset.rgInstall = 'true';
    document.head.append(script);
})();
(() => {
    function pinNavigation() {
        const header = document.querySelector('.site-header');
        const row = header?.querySelector('.top-line');
        if (!row || document.querySelector('.rg-sticky-header')) return;
        const pinned = document.createElement('header');
        pinned.className = 'rg-sticky-header';
        header.parentNode.insertBefore(pinned, header);
        pinned.append(row);
        if (!header.children.length) header.remove();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pinNavigation, { once: true });
    else pinNavigation();
})();

/* Shared, local-only theme preference; no account or service data changes. */
(() => {
 const key='royalGarageTheme';
 const root=document.documentElement;
 function apply(value) { root.dataset.rgTheme=value==='blue'?'blue':'graphite'; }
 try { apply(localStorage.getItem(key)); } catch { apply('graphite'); }
 function mount() {
  document.querySelectorAll('.burger-dropdown').forEach(menu=>{
   if(menu.querySelector('.rg-theme-picker')) return;
   const label=document.createElement('label'); label.className='rg-theme-picker';
   const title=document.createElement('span');
   const select=document.createElement('select');
   select.add(new Option('Графітова','graphite')); select.add(new Option('Синя із золотом','blue'));
   select.value=root.dataset.rgTheme;
   label.append(title,select); menu.append(label);
   function translate() {
    const en=root.lang.toLowerCase().startsWith('en');
    title.textContent=en?'Themes':'Теми';
    select.setAttribute('aria-label',en?'Site theme':'Тема сайту');
    select.options[0].textContent=en?'Graphite':'Графітова';
    select.options[1].textContent=en?'Blue and gold':'Синя із золотом';
   }
   translate(); new MutationObserver(translate).observe(root,{attributes:true,attributeFilter:['lang']});
   select.addEventListener('change',()=>{
    apply(select.value);
    try { localStorage.setItem(key,select.value); } catch {}
   });
  });
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
 window.addEventListener('storage',event=>{
  if(event.key===key) {
   apply(event.newValue);
   document.querySelectorAll('.rg-theme-picker select').forEach(s=>s.value=root.dataset.rgTheme);
  }
 });
})();
