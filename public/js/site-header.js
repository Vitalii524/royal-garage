// Keep the same navigation on every page that uses the site header.
(() => {
    const links = [
        ['forum.html#communityClubs', 'Клуби', 'Clubs'],
        ['index.html', 'Головна', 'Home'],
        ['forum.html', 'Клуб', 'Forum'],
        ['market.html', 'Авторинок', 'Marketplace'],
        ['products.html', 'Автотовари', 'Auto products'],
        ['businesses.html', 'Партнери', 'Partners'],
        ['profile.html', 'Мій профіль', 'My profile']
    ];

    function mountNavigation() {
        const header = document.querySelector('.site-header');
        if (!header || document.querySelector('.rg-sticky-header')) return;
        let row = header.querySelector('.top-line');
        if (!row) {
            row = document.createElement('div');
            row.className = 'top-line';
            row.append(...header.children);
            header.append(row);
        }

        const existing = row.querySelector('.burger-menu');
        const profileLink = existing?.querySelector('.burger-dropdown a:last-child');
        const burger = document.createElement('details');
        burger.className = 'burger-menu';
        const button = document.createElement('summary');
        button.className = 'burger-button';
        button.textContent = '☰';
        const menu = document.createElement('nav');
        menu.className = 'burger-dropdown';
        const items = links.map(([href]) => {
            const link = document.createElement('a');
            link.setAttribute('href', href === 'profile.html' && profileLink ? profileLink.getAttribute('href') : href);
            menu.append(link);
            return link;
        });
        function translate() {
            const english = document.documentElement.lang.toLowerCase().startsWith('en');
            items.forEach((link, index) => { link.textContent = links[index][english ? 2 : 1]; });
            button.setAttribute('aria-label', english ? 'Open menu' : 'Відкрити меню');
            button.title = english ? 'Menu' : 'Меню';
            menu.setAttribute('aria-label', english ? 'Site navigation' : 'Навігація сайту');
        }
        translate();
        document.addEventListener('royalGarageLanguageChange', translate);
        menu.addEventListener('click', event => {
            if (event.target.closest('a')) burger.open = false;
        });
        burger.append(button, menu);
        if (existing) existing.replaceWith(burger);
        else {
            const anchor = row.querySelector('.language-switcher, .brand, .logo');
            const languageSwitcher = row.querySelector('.language-switcher');
            if (languageSwitcher || anchor) (languageSwitcher || anchor).after(burger);
            else row.prepend(burger);
        }

        // Keep only the control row pinned, outside the homepage hero.
        const pinned = document.createElement('header');
        pinned.className = 'rg-sticky-header';
        header.parentNode.insertBefore(pinned, header);
        pinned.append(row);
        if (!header.children.length) header.remove();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountNavigation, { once: true });
    else mountNavigation();
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
