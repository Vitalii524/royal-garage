/* Royal Garage unified Web Push: no caching of private responses. */
self.addEventListener('push', event => {
    let data={};
    try { data=event.data ? event.data.json() : {}; } catch(e) { data={body:event.data?.text()||''}; }
    const url=typeof data.url==='string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/forum.html';
    event.waitUntil(self.registration.showNotification(data.title||'Royal Garage',{
      body:data.body||'Нове сповіщення Royal Garage',icon:'/images/favicon.png',badge:'/images/favicon.png',tag:data.id?'rg-'+data.id:'royalgarage',data:{url}
    }));
  });
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    const target=new URL(event.notification.data?.url||'/notifications.html',self.location.origin);
    const url=target.origin===self.location.origin?target.href:new URL('/notifications.html',self.location.origin).href;
    event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
      for(const win of windows){if(win.url===url && 'focus' in win) return win.focus();}
      return clients.openWindow(url);
    }));
  });
