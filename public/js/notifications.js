(() => {
    'use strict';
    if (window.rgNotificationsLoaded) return;
    window.rgNotificationsLoaded = true;
    const token = () => localStorage.getItem('royalGarageToken');
    const english = () => document.documentElement.lang === 'en';
    const text = (uk,en) => english()?en:uk;
    const style = document.createElement('link'); style.rel='stylesheet'; style.href='/css/notifications.css?v=1'; document.head.append(style);
    let unread=0, page=0, lastBefore=null, busy=false, logoutReleased=false;
    const bell=document.createElement('a'); bell.className='rg-notification-bell'; bell.href='/notifications.html';
    function paintBell() { bell.textContent='🔔'+(unread?' '+(unread>99?'99+':unread):''); bell.setAttribute('aria-label',text('Сповіщення','Notifications')+(unread?' · '+unread:'')); }
    function mount() {
        const host=document.getElementById('authArea') || document.querySelector('header .top-line') || document.querySelector('header');
        if(host && token() && !bell.isConnected){host.append(bell);paintBell();}
        if(!token())bell.remove();
    }
    const observer=new MutationObserver(mount); observer.observe(document.body,{childList:true,subtree:true}); mount();
    async function api(url,options={}) {
        const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token(),...options.headers}});
        const data=await response.json();
        if(!response.ok)throw new Error(data.message||text('Не вдалося завантажити сповіщення.','Could not load notifications.'));
        return data;
    }
    const root=document.getElementById('notificationCenter');
    const status=root?.querySelector('[role="status"]');
    const list=root?.querySelector('#notificationList');
    const category=root?.querySelector('#notificationSource');
    const more=root?.querySelector('#notificationMore');
    function showStatus(message){if(status)status.textContent=message;}
    function node(tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
    function renderItem(item) {
        const article=node('article','',item.is_read?'rg-notice':'rg-notice rg-unread');
        const labels={forum:'Форум',market:'Авторинок',service:'Service Hub',clubs:'Клуби',profile:'Профілі'};
        article.append(node('small',(labels[item.source]||'Royal Garage')+' · '+new Date(item.created_at).toLocaleString(english()?'en-GB':'uk-UA')));
        const link=node('a',(item.actor_name?item.actor_name+': ':'')+item.message);
        const target=new URL(item.url||'/notifications.html',location.origin);
        link.href=target.origin===location.origin?target.href:'/notifications.html';
        link.addEventListener('click',async event=>{
            if(event.ctrlKey||event.metaKey||event.shiftKey||event.button)return;
            event.preventDefault();
            try {await api('/api/notifications/read',{method:'POST',body:JSON.stringify({ids:[item.id]})}); location.assign(link.href);}
            catch(error){showStatus(error.message);}
        });
        article.append(link);
        if(!item.is_read){const button=node('button',text('Прочитано','Mark read'));button.type='button';button.onclick=async()=>{
            button.disabled=true;try{await api('/api/notifications/read',{method:'POST',body:JSON.stringify({ids:[item.id]})});await load();}catch(e){showStatus(e.message);button.disabled=false;}
        };article.append(button);}
        return article;
    }
    async function load(append=false) {
        if(!token()){showStatus(text('Увійдіть у свій акаунт, щоб побачити сповіщення.','Sign in to view your notifications.'));if(list)list.replaceChildren();return;}
        if(busy)return;busy=true;
        try {
            const data=await api('/api/notifications?source='+encodeURIComponent(category?.value||'')+'&page='+(append?page:0));
            unread=data.unread;paintBell();
            if(list){if(!append){page=0;list.replaceChildren();lastBefore=data.notifications[0]?.created_at||new Date().toISOString();}
                for(const item of data.notifications)list.append(renderItem(item));
                showStatus(list.children.length?'':text('Сповіщень поки немає.','No notifications yet.'));
                more.hidden=!data.hasMore;
            }
        } catch(error){if(append)page=Math.max(0,page-1);showStatus(error.message);} finally{busy=false;}
    }
    category?.addEventListener('change',()=>load());
    more?.addEventListener('click',()=>{page++;load(true);});
    root?.querySelector('#notificationReadAll')?.addEventListener('click',async()=>{
        try{await api('/api/notifications/read-all',{method:'POST',body:JSON.stringify({before:lastBefore||new Date().toISOString()})});await load();}catch(e){showStatus(e.message);}
    });
    root?.querySelector('#notificationRefresh')?.addEventListener('click',()=>load());
    function bytes(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));}
    const pushStatus=root?.querySelector('#notificationPushStatus');
    const pushOn=root?.querySelector('#notificationPushOn');
    const pushOff=root?.querySelector('#notificationPushOff');
    const capable='serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    async function pushState(){
        if(!pushStatus)return;
        if(!capable){pushStatus.textContent=text('Браузер не підтримує Push. На iPhone відкрийте сайт із головного екрана; центр сповіщень доступний у браузері.','Push is unavailable in this browser. On iPhone open the installed home-screen app; the notification centre remains available.');pushOn.disabled=true;return;}
        const registration=await navigator.serviceWorker.getRegistration('/');
        if(registration)registration.update().catch(()=>{});
        const sub=await registration?.pushManager.getSubscription();
        pushStatus.textContent=Notification.permission==='denied'?text('Сповіщення заблоковано в налаштуваннях браузера.','Notifications are blocked in browser settings.'):
            sub?text('Push підключено на цьому пристрої.','Push is connected on this device.'):text('Push вимкнено. Увімкніть, щоб отримувати сповіщення поза сайтом.','Push is off. Enable it to receive notifications outside the site.');
    }
    pushOn?.addEventListener('click',async()=>{
        if(!token()){showStatus(text('Спочатку увійдіть в акаунт.','Sign in first.'));return;}
        pushOn.disabled=true;
        try {
            // Permission is requested only following this explicit button click.
            if(await Notification.requestPermission()!=='granted')throw new Error(text('Дозвіл не надано.','Permission was not granted.'));
            const config=await (await fetch('/api/forum/push/public-key')).json();
            if(!config.enabled)throw new Error(text('Push тимчасово недоступний на сервері.','Server push is temporarily unavailable.'));
            await navigator.serviceWorker.register('/sw.js',{scope:'/'});
            const registration=await navigator.serviceWorker.ready;
            const sub=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(config.publicKey)});
            await api('/api/forum/push/subscribe',{method:'POST',body:JSON.stringify({subscription:sub.toJSON()})});
            await api('/api/notifications/preferences',{method:'PUT',body:JSON.stringify({pushEnabled:true})});
            await pushState();
        }catch(error){showStatus(error.message);}finally{pushOn.disabled=false;}
    });
    async function disconnect(){
        if(!capable)return;
        const sub=await (await navigator.serviceWorker.getRegistration('/'))?.pushManager.getSubscription();
        if(sub){await api('/api/forum/push/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:sub.endpoint})});await sub.unsubscribe();}
    }
    pushOff?.addEventListener('click',async()=>{try{await disconnect();await pushState();}catch(e){showStatus(e.message);}});
    document.addEventListener('click',async event=>{
        const button=event.target.closest('#logoutButton');
        if(!button||logoutReleased||!token())return;
        event.preventDefault();event.stopImmediatePropagation();
        try{await Promise.race([disconnect(),new Promise(resolve=>setTimeout(resolve,2000))]);}catch{}
        logoutReleased=true;button.click();
    },true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
    window.addEventListener('storage',()=>{mount();load();});
    window.addEventListener('pageshow',mount);
    setInterval(()=>{if(!document.hidden)load();},30000);
    load();pushState().catch(()=>{});
})();
