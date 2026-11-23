(() => {
 'use strict';
 const isVideo=src=>/^\/api\/media\/videos\//.test(src)||/^data:video\//.test(src)||/\.(mp4|webm|mov)(?:[?#]|$)/i.test(src);
 const safe=src=>typeof src==='string' && (/^data:(?:image\/(?:jpeg|jpg|png|webp)|video\/(?:mp4|webm|quicktime));base64,/i.test(src)||/^\/(?!\/)/.test(src)||/^https?:\/\//i.test(src));
 const list=value=>Array.isArray(value)?value.filter(safe):[];
 function media(src,title,full=false) {
  const video=isVideo(src),el=document.createElement(video?'video':'img');
  el.src=!video&&!full&&/^\/api\/service-catalog\/images\/[\da-f-]+$/i.test(src)?src+'?preview=1':src;
  if(video){el.controls=true;el.preload='none';el.playsInline=true;}else{el.alt=title||'Фото послуги';el.loading='lazy';el.decoding='async';}
  return el;
 }
 function gallery(value,title,full=false) {
  const files=list(value),root=document.createElement('div');root.className='rg-service-gallery';
  if(!files.length){root.classList.add('is-empty');root.textContent='Фото та відео поки немає';return root;}
  const stage=document.createElement('div');stage.className='rg-service-stage';
  const dots=document.createElement('div');dots.className='rg-service-dots';
  const counter=document.createElement('span');counter.className='rg-service-counter';counter.setAttribute('aria-live','polite');
  let index=0,start=null;
  function show(next){index=(next+files.length)%files.length;stage.querySelectorAll('video').forEach(v=>v.pause());stage.replaceChildren();const visual=media(files[index],title,full);stage.append(visual);if(!isVideo(files[index])){visual.tabIndex=0;visual.setAttribute('role','button');visual.setAttribute('aria-label','Збільшити фото: '+(title||'Послуга'));visual.addEventListener('click',()=>{if(!full)details({name:title,photos:files},index);});visual.addEventListener('keydown',e=>{if(e.key==='Enter'&&!full)details({name:title,photos:files},index);});}counter.textContent=(index+1)+' / '+files.length;[...dots.children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));});}
  function button(text,label,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',fn);return b;}
  if(files.length>1){const prev=button('‹','Попереднє фото або відео',()=>show(index-1)),next=button('›','Наступне фото або відео',()=>show(index+1));prev.className='rg-service-prev';next.className='rg-service-next';root.append(prev,next);files.forEach((_,i)=>{const dot=button('','Файл '+(i+1),()=>show(i));dots.append(dot);});}
  stage.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
  stage.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))show(index+(dx<0?1:-1));start=null;},{passive:true});
  root.append(stage,counter,dots);show(0);root.show=show;return root;
 }
 function details(item,index=0) {
  const dialog=document.createElement('dialog');dialog.className='rg-service-dialog';const previous=document.activeElement;
  const close=document.createElement('button');close.type='button';close.className='rg-service-close';close.textContent='×';close.setAttribute('aria-label','Закрити перегляд');close.onclick=()=>dialog.close();
  const title=document.createElement('h2');title.textContent=item.name||item.title||'Послуга';
  const g=gallery(item.photos,title.textContent,true);g.show?.(index);
  const description=document.createElement('p');description.textContent=item.description||'';description.className='rg-service-full-description';
  dialog.append(close,title,g,description);document.body.append(dialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());dialog.remove();previous?.focus();},{once:true});dialog.showModal();
 }
 function card(item,category='') {
  const root=document.createElement('article');root.className='rg-service-card';root.append(gallery(item.photos,item.name||item.title));
  const info=document.createElement('div');info.className='rg-service-info';const cat=document.createElement('small');cat.textContent=category||item.sectionName||'Послуги';
  const title=document.createElement('h3');title.textContent=item.name||item.title||'Послуга';
  const price=document.createElement('strong');const value=Number(item.priceUah??item.priceFrom);price.textContent=value>0?value.toLocaleString('uk-UA')+' грн':'Ціна договірна';
  const desc=document.createElement('p');desc.className='rg-service-excerpt';desc.textContent=item.description||'';
  const more=document.createElement('button');more.type='button';more.className='rg-service-more';more.textContent='Детальніше';more.onclick=()=>details(item);
  info.append(cat,title,price,desc,more);root.append(info);return root;
 }
 function read(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Не вдалося прочитати «'+file.name+'». Виберіть файл із пам’яті пристрою повторно.'));r.readAsDataURL(file);});}
 async function upload(file,onProgress) {
  const video=['video/mp4','video/webm','video/quicktime'].includes(file.type);
  if(!video&&!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Оберіть JPG, PNG, WebP, MP4, WebM або MOV. Для HEIC виберіть експорт у JPG.');
  if(!file.size||file.size>(video?20:10)*1048576)throw Error(video?'Відео — до 20 МБ.':'Фото — до 10 МБ.');
  // Start copying immediately while mobile picker access is valid.
  const pending=read(file).then(data=>({data}),error=>({error}));
  if(video)await new Promise((resolve,reject)=>{const v=document.createElement('video'),url=URL.createObjectURL(file);const timer=setTimeout(()=>finish(Error('Не вдалося визначити тривалість відео.')),15000);let done=false;function finish(error){if(done)return;done=true;clearTimeout(timer);v.removeAttribute('src');v.load();URL.revokeObjectURL(url);error?reject(error):resolve();}v.preload='metadata';v.onloadedmetadata=()=>finish(!Number.isFinite(v.duration)||v.duration>180?Error('Відео — до 3 хвилин.'):null);v.onerror=()=>finish(Error('Цей відеоформат не підтримується браузером.'));v.src=url;});
  const result=await pending;if(result.error)throw result.error;
  if(typeof onProgress==='function')return new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('POST',video?'/api/media/videos':'/api/service-catalog/images');xhr.timeout=180000;
   xhr.setRequestHeader('Content-Type','application/json');xhr.setRequestHeader('Authorization','Bearer '+(localStorage.getItem('royalGarageToken')||''));
   xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));};
   xhr.onload=()=>{let body;try{body=JSON.parse(xhr.responseText);}catch{reject(Error('Некоректна відповідь сервера.'));return;}if(xhr.status>=200&&xhr.status<300&&body.url)resolve(body.url);else reject(Error(body.message||'Не вдалося завантажити файл.'));};
   xhr.onerror=()=>reject(Error('Помилка мережі. Спробуйте повторити завантаження.'));xhr.ontimeout=()=>reject(Error('Перевищено час завантаження. Спробуйте повторити.'));
   xhr.send(JSON.stringify({data:result.data,name:file.name}));
  });
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000);
  try{const response=await fetch(video?'/api/media/videos':'/api/service-catalog/images',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('royalGarageToken')||'')},body:JSON.stringify({data:result.data,name:file.name})});const body=await response.json();if(!response.ok)throw Error(body.message||'Не вдалося завантажити файл.');return body.url;}finally{clearTimeout(timer);}
 }
 window.RGServiceGallery={gallery,card,details,media,isVideo,upload};
})();
