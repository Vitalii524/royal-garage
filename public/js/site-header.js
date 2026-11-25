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
        const header = document.querySelector('.site-header') || document.querySelector('[data-site-navigation]');
        if (!header || document.querySelector('.rg-sticky-header')) return;
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = '/css/site-navigation.css?v=1';
        document.head.append(style);
        let row = header.querySelector('.top-line');
        if (!row) {
            row = document.createElement('div');
            row.className = 'top-line';
            if (header.hasAttribute('data-site-navigation')) {
                const brand = document.createElement('a');
                brand.className = 'brand';
                brand.href = '/';
                const logo = document.createElement('img');
                logo.src = '/images/royal-garage-logo.png';
                logo.alt = 'Royal Garage';
                brand.append(logo);
                row.append(brand);
            }
            row.append(...header.children);
            header.append(row);
        }

        const existing = row.querySelector('.burger-menu');
        const auth = document.getElementById('authArea') || document.createElement('div');
        auth.id = 'authArea';
        auth.classList.add('rg-header-auth');
        let desktop = row.querySelector('.nav, :scope > nav');
        if (!desktop) desktop = document.createElement('nav');
        desktop.className = 'nav rg-header-navigation';
        const bellHost = document.createElement('div');
        bellHost.className = 'rg-header-bell';
        bellHost.dataset.rgBellHost = '';
        const burger = document.createElement('details');
        burger.className = 'burger-menu';
        const button = document.createElement('summary');
        button.className = 'burger-button';
        button.textContent = '☰';
        const menu = document.createElement('nav');
        menu.className = 'burger-dropdown';
        const accountActions = document.createElement('div');
        accountActions.className = 'rg-header-account-actions';
        accountActions.dataset.rgAccountActions = '';
        function fill(target) {
            return links.filter(([href]) => href !== 'profile.html').map(([href, uk, en]) => {
                const link = document.createElement('a');
                link.href = '/' + href;
                target.append(link);
                return { link, uk, en };
            });
        }
        desktop.replaceChildren();
        const items = [...fill(desktop), ...fill(menu)];
        menu.append(accountActions);
        function translate() {
            const english = document.documentElement.lang.toLowerCase().startsWith('en');
            items.forEach(({ link, uk, en }) => { link.textContent = english ? en : uk; });
            button.setAttribute('aria-label', english ? 'Open menu' : 'Відкрити меню');
            button.title = english ? 'Menu' : 'Меню';
            menu.setAttribute('aria-label', english ? 'Site navigation' : 'Навігація сайту');
            desktop.setAttribute('aria-label', english ? 'Site navigation' : 'Навігація сайту');
        }
        translate();
        document.addEventListener('royalGarageLanguageChange', translate);
        menu.addEventListener('click', event => {
            if (event.target.closest('a, button')) burger.open = false;
        });
        burger.append(button, menu);
        existing?.remove();
        const language = row.querySelector('.language-switcher') || document.createElement('div');
        language.classList.add('language-switcher');
        const brand = row.querySelector('.brand, .logo, :scope > a[href="index.html"]');
        const home = document.createElement('a');
        home.className = 'brand';
        home.href = '/';
        const logo = document.createElement('img');
        logo.src = '/images/royal-garage-logo.png';
        logo.alt = 'Royal Garage';
        home.append(logo);
        if (brand) brand.replaceWith(home);
        else row.prepend(home);
        row.append(language, desktop, auth, bellHost, burger);

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

// Dismiss open navigation and publication menus when tapping outside.
 document.addEventListener('pointerdown', event => {
  document.querySelectorAll('details.burger-menu[open], details.post-menu[open]').forEach(menu => {
   if (!menu.contains(event.target)) menu.open = false;
  });
 }, true);
 document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('details.burger-menu[open], details.post-menu[open]').forEach(menu => { menu.open = false; });
 });

;document.addEventListener("click",event=>{document.querySelectorAll(".burger-menu[open]").forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});},true);
