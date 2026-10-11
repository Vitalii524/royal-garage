/* Royal Garage Forum Web Push */
self.addEventListener('push', event => {
    let data={};
    try { data=event.data ? event.data.json() : {}; } catch(e) { data={body:event.data?.text()||''}; }
    const url=typeof data.url==='string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/forum.html';
    event.waitUntil(self.registration.showNotification(data.title||'Royal Garage',{
      body:data.body||'Нове сповіщення форуму',icon:'/images/favicon.png',badge:'/images/favicon.png',tag:'royalgarage-forum',data:{url}
    }));
  });
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url=new URL(event.notification.data?.url||'/forum.html',self.location.origin).href;
    event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
      for(const win of windows){if(win.url===url && 'focus' in win) return win.focus();}
      return clients.openWindow(url);
    }));
  });
  