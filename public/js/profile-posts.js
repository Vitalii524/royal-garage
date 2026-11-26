"use strict";
function fitActiveGallery(gallery){const update=()=>{if(!gallery.clientWidth)return;const slides=Array.from(gallery.children);const active=slides.reduce((best,node)=>Math.abs(node.offsetLeft-slides[0].offsetLeft-gallery.scrollLeft)<Math.abs(best.offsetLeft-slides[0].offsetLeft-gallery.scrollLeft)?node:best,slides[0]);if(!active)return;const h=active.getBoundingClientRect().height;if(h>0)gallery.style.height=Math.ceil(h)+"px";};gallery.addEventListener("scroll",update,{passive:true});gallery.addEventListener("load",update,true);gallery.addEventListener("loadedmetadata",update,true);if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(update);Array.from(gallery.children).forEach(node=>observer.observe(node));}requestAnimationFrame(update);}
window.mountGaragePosts = function(root, ownerId, isOwner, atelier = false) {
 if (!root || !ownerId) return;
 const token = localStorage.getItem("royalGarageToken") || "";
 const headers = {"Content-Type":"application/json", Authorization:"Bearer "+token};
 const el = (tag, value) => { const n=document.createElement(tag); if(value)n.textContent=value; return n; };
 root.classList.add("garage-posts");
 if(!document.getElementById("garagePostsStyles")){
  const style=el("style");style.id="garagePostsStyles";style.textContent=".garage-posts{color:inherit;min-width:0}.garage-posts form,.garage-posts article{display:flex;flex-wrap:wrap;gap:12px;padding:16px;margin:12px 0;border:1px solid #806b42;border-radius:14px;background:#202124;color:#f5f5f5}.garage-posts textarea{width:100%;min-height:90px;background:#17181a;color:#fff;border:1px solid #806b42;border-radius:10px;padding:12px;box-sizing:border-box}.garage-posts button,.garage-posts article a{background:#d6a445;color:#17181a;border:0;border-radius:9px;padding:10px 14px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}.garage-posts button:disabled{opacity:.5;cursor:wait}.garage-posts article h3,.garage-posts article p,.garage-posts form p{width:100%;margin:0;overflow-wrap:anywhere;white-space:pre-wrap}.garage-posts article img,.garage-posts article video{width:100%;max-height:560px;object-fit:contain;border-radius:10px;background:#111}.garage-posts [role=status]{overflow-wrap:anywhere}.garage-posts h2{color:#d6a445}";
  style.textContent+=".garage-posts .post-tools,.garage-posts .post-gallery-nav,.garage-posts .post-comment{display:flex;align-items:center;gap:8px;width:100%;min-width:0}.garage-posts .post-gallery-nav{justify-content:center}.garage-posts .post-tools button,.garage-posts .post-tools a,.garage-posts .post-gallery-nav button,.garage-posts .post-comment button{background:transparent;color:#d6a445;padding:8px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:5px;box-sizing:border-box}.garage-posts .post-tools svg,.garage-posts .post-comment svg,.garage-posts .post-gallery-nav svg{width:23px;height:23px;flex-shrink:0}.garage-posts .post-comment textarea{flex:1;min-width:0;min-height:44px;border-radius:22px}.garage-posts .post-menu{margin-left:auto;position:relative}.garage-posts .post-menu summary{list-style:none;cursor:pointer;color:#d6a445;padding:10px;min-width:44px;box-sizing:border-box;text-align:center}.garage-posts .post-menu summary::-webkit-details-marker{display:none}.garage-posts .post-menu div{position:absolute;right:0;top:100%;z-index:5;background:#202124;border:1px solid #806b42;border-radius:10px;padding:5px;min-width:145px}.garage-posts .post-menu div button{width:100%;justify-content:flex-start}.garage-posts .post-tools .post-share-menu{flex-basis:100%}.garage-posts .post-tools{flex-wrap:wrap}";
  style.textContent+=".garage-posts .post-compose-tools{display:flex;align-items:center;gap:4px;width:100%;flex-wrap:wrap}.garage-posts .post-compose-tools button{background:transparent;color:#d6a445;padding:8px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px}.garage-posts .post-compose-tools svg{width:23px;height:23px}.garage-posts .post-compose-tools button[type=submit]{margin-left:auto}.garage-posts .post-compose-tools button[type=submit] span{font-size:14px}";
  document.head.append(style);
 }
 const icon=(node,label,shape,count)=>{node.replaceChildren();node.setAttribute("aria-label",label);node.title=label;const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");svg.setAttribute("stroke-width","1.8");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");svg.setAttribute("aria-hidden","true");const p=document.createElementNS(svg.namespaceURI,"path");p.setAttribute("d",shape);svg.append(p);node.append(svg);if(count!==undefined)node.append(el("span",String(count)));return node;};
 const shapes={heart:"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",comment:"M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5Z",share:"M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7",send:"m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13",left:"m15 18-6-6 6-6",right:"m9 18 6-6-6-6",more:"M4 12h1m6 0h1m6 0h1"};
 async function convert(file){
    let attachment;
    if(file.type.startsWith("video/")){
     const probe=el("video"), probeUrl=URL.createObjectURL(file);
     try{await new Promise((resolve,reject)=>{probe.onloadedmetadata=resolve;probe.onerror=()=>reject(Error("Не вдалося прочитати відео."));probe.preload="metadata";probe.src=probeUrl;});if(!Number.isFinite(probe.duration)||probe.duration>180)throw Error("Відео — до 3 хвилин.");}finally{probe.removeAttribute("src");probe.load();URL.revokeObjectURL(probeUrl);}
     const data=await window.uploadGarageVideo(file);
     attachment={type:"video",mimeType:file.type,name:file.name,data,originalSize:file.size};
    }else if(file.type.startsWith("image/")){
     const url=URL.createObjectURL(file);
     try{
      const img=new Image();img.src=url;await img.decode();
      const scale=Math.min(1,1600/img.width,1600/img.height),canvas=el("canvas");
      canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      attachment={type:"image",mimeType:"image/jpeg",name:file.name,data:canvas.toDataURL("image/jpeg",0.8),originalSize:file.size};
     }finally{URL.revokeObjectURL(url);}
    }else throw Error("Оберіть фото або відео.");

 return attachment;
 }
 root.replaceChildren(el("h2","Публікації"));
 const status=el("p");status.setAttribute("role","status");
 const feed=el("div");
 if(isOwner && token){
  const form=el("form"), description=el("textarea"), submit=el("button","Опублікувати");
  description.placeholder="Додайте опис (необов’язково)";description.maxLength=2000;
  form.append(description);const tools=el("div");tools.className="post-compose-tools";
  let files=[];
  const selected=el("div");selected.style.width="100%";
  const refresh=()=>{selected.replaceChildren(el("p",files.length+" / 20"));files.forEach((f,i)=>{const b=el("button",f.name+" ×");b.type="button";b.onclick=()=>{files.splice(i,1);refresh();};selected.append(b);});};
  for(const [label,accept,capture] of [["Зняти фото","image/*",true],["Зняти відео","video/*",true],["З галереї","image/*,video/*",false]]){
   const input=el("input");input.type="file";input.accept=accept;input.multiple=!capture;if(capture)input.setAttribute("capture","environment");input.hidden=true;
   const button=el("button",label);button.type="button";button.onclick=()=>input.click();
   input.onchange=async()=>{const picked=Array.from(input.files);input.value="";if(files.length+picked.length>20){status.textContent="Максимум 20 файлів.";return;}submit.disabled=true;try{const snapshots=await Promise.all(picked.map(async f=>{if(f.size>(f.type.startsWith("image/")?10:20)*1024*1024)throw Error("Файл надто великий: "+f.name);return new File([await f.arrayBuffer()],f.name,{type:f.type});}));files.push(...snapshots);refresh();}catch(e){status.textContent=e.message;}finally{submit.disabled=false;}};
   const shape=label==="Зняти фото"?"M3 6h4l2-3h6l2 3h4v14H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z":label==="Зняти відео"?"M3 5h13v14H3ZM16 9l5-3v12l-5-3":"M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M16 7h.01";icon(button,label,shape);tools.append(button,input);
  }
  submit.type="submit";icon(submit,"Опублікувати",shapes.send,"Опублікувати");tools.append(submit);form.append(tools,selected);root.append(form);
  form.onsubmit=async event=>{
   event.preventDefault();if(submit.disabled)return;
   if(!files.length){status.textContent="Оберіть фото або відео.";return;}
   submit.disabled=true;
   try{
    const items=[];
    for(const file of files){
    status.textContent="Обробка "+(items.length+1)+" / "+files.length;
    if(file.size>20*1024*1024)throw Error("Максимальний розмір — 20 МБ.");
    const attachment=await convert(file);
    items.push(attachment);
    }
    const attachment={...items[0],items};
    const body=description.value.trim();
    const response=await fetch("/api/forum/topics",{method:"POST",headers,body:JSON.stringify({title:body.slice(0,80)||"Публікація",category:atelier?"Royal Auto Atelier":"Загальне",content:body||"Публікація",attachment})});
    const result=await response.json();if(!response.ok)throw Error(result.message||"Не вдалося опублікувати.");
    form.reset();files=[];refresh();await load();status.textContent="Опубліковано.";
   }catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
  };
 }
 if(atelier && isOwner && token){
 const open=el("button","Імпорт з Instagram"), panel=el("div"), list=el("div"), more=el("button","Показати ще"), run=el("button","Імпортувати вибрані");panel.hidden=true;more.hidden=true;run.disabled=true;const selected=new Set();let cursor=null;
 const requestIG=async(url,options={})=>{const response=await fetch(url,{...options,headers});const data=await response.json();if(!response.ok)throw Error(data.message||"Помилка Instagram.");return data;};
 async function page(reset){open.disabled=more.disabled=true;try{if(reset){list.replaceChildren();selected.clear();cursor=null;run.disabled=true;}const data=await requestIG("/api/atelier/instagram"+(cursor?"?after="+encodeURIComponent(cursor):""));for(const item of data.items){const row=el("label");row.style.cssText="display:flex;gap:10px;align-items:center;padding:8px;border-bottom:1px solid #806b42";const check=el("input");check.type="checkbox";check.disabled=item.imported;check.onchange=()=>{if(check.checked)selected.add(item.id);else selected.delete(item.id);run.disabled=!selected.size;};row.append(check);if(item.preview){const img=el("img");img.src=item.preview;img.loading="lazy";img.style.cssText="width:76px;height:76px;object-fit:cover;border-radius:6px";row.append(img);}row.append(el("span",(item.imported?"Вже імпортовано · ":"")+(item.caption||item.type).slice(0,160)));list.append(row);}cursor=data.after;more.hidden=!cursor;status.textContent=data.items.length?"":"Публікацій немає.";}catch(e){status.textContent=e.message;}finally{open.disabled=more.disabled=false;}}
 open.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)page(true);};more.onclick=()=>page(false);
 run.onclick=async()=>{run.disabled=open.disabled=more.disabled=true;const ids=[...selected];let count=0;const errors=[];for(const id of ids){try{status.textContent="Імпорт "+(count+errors.length+1)+" / "+ids.length;const result=await requestIG("/api/atelier/instagram",{method:"POST",body:JSON.stringify({id})});if(result.imported)count++;}catch(e){errors.push(e.message);}}await load();await page(true);status.textContent="Імпортовано: "+count+(errors.length?". Помилки: "+errors.join("; "):"");};
 panel.append(list,more,run);root.append(open,panel);
 }
 root.append(status,feed);
 async function load(){
  try{
   const response=await fetch("/api/forum/topics");if(!response.ok)throw Error("Не вдалося завантажити публікації.");
   const data=await response.json();feed.replaceChildren();
   const posts=(data.topics||[]).filter(t=>String(t.user_id)===String(ownerId) && (atelier ? t.category === 'Royal Auto Atelier' : t.category !== 'Royal Auto Atelier')).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
   if(!posts.length)feed.append(el("p","Публікацій ще немає."));
   for(const post of posts){
    const card=el("article");if(post.title && !String(post.content||"").startsWith(post.title))card.append(el("h3",post.title));card.append(el("p",post.content));
    const gallery=el("div");gallery.style.cssText="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;width:100%;gap:8px;align-items:flex-start;overflow-y:hidden;position:relative";
    const attachments=post.attachment?.items||[post.attachment];
    for(const a of attachments){
     let media;
     if(a?.type==="image" && /^data:image\/(jpeg|png|webp);base64,/i.test(a.data)){media=el("img");media.src=a.data;media.alt="Фото публікації";}
     if(a?.type==="video" && /^\/api\/media\/videos\/[a-zA-Z0-9-]+$/.test(a.data)){media=el("video");media.src=a.data;media.controls=true;media.preload="metadata";media.playsInline=true;}
     if(media){media.style.cssText="flex:0 0 100%;min-width:0;scroll-snap-align:start;height:auto;align-self:flex-start;display:block";gallery.append(media);}
    }
    if(gallery.children.length){card.append(gallery);fitActiveGallery(gallery);if(gallery.children.length>1){const prev=el("button","‹"),next=el("button","›");prev.type=next.type="button";prev.onclick=()=>gallery.scrollBy({left:-gallery.clientWidth,behavior:"smooth"});next.onclick=()=>gallery.scrollBy({left:gallery.clientWidth,behavior:"smooth"});const nav=el("div"),counter=el("span","1 / "+gallery.children.length);nav.className="post-gallery-nav";icon(prev,"Попереднє фото",shapes.left);icon(next,"Наступне фото",shapes.right);gallery.addEventListener("scroll",()=>{counter.textContent=Math.min(gallery.children.length,Math.round(gallery.scrollLeft/(gallery.clientWidth+8))+1)+" / "+gallery.children.length;},{passive:true});nav.append(prev,counter,next);card.append(nav);}}
    const likes=Array.isArray(post.like_user_ids)?post.like_user_ids.length:0;
    const replies=Array.isArray(post.replies)?post.replies.length:0;
    const link=el("a","♡ "+likes+" · Коментарі "+replies);link.href="forum.html?topicId="+encodeURIComponent(post.id);const toolbar=el("div");toolbar.className="post-tools";card.append(toolbar);icon(link,"Коментарі",shapes.comment,replies);toolbar.append(link);
    const share=el("button","Поділитися");share.type="button";
    share.onclick=()=>{
     const url=new URL(link.href,location.href).href;
     const menu=el("div");menu.className="post-share-menu";menu.style.cssText="display:flex;flex-wrap:wrap;gap:8px;width:100%";
     const enc=encodeURIComponent;
     const add=(label,href)=>{const a=el("a",label);a.href=href;a.target="_blank";a.rel="noopener noreferrer";menu.append(a);};
     add("Facebook — допис","https://www.facebook.com/sharer/sharer.php?u="+enc(url));
     add("Threads — допис","https://www.threads.net/intent/post?text="+enc(post.content+" "+url));
     add("X — допис","https://twitter.com/intent/tweet?text="+enc(post.content)+"&url="+enc(url));
     const native=el("button","Інші застосунки");native.type="button";native.onclick=async()=>{try{if(navigator.share)await navigator.share({title:post.title,text:post.content,url});else window.prompt("Скопіюйте посилання",url);}catch(e){if(e.name!=="AbortError")status.textContent="Не вдалося поділитися.";}};menu.append(native);
     const copy=el("button","Копіювати посилання");copy.type="button";copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);status.textContent="Посилання скопійовано.";}catch(e){window.prompt("Скопіюйте посилання",url);}};menu.append(copy);
     if(toolbar.querySelector(".post-share-menu")){toolbar.querySelector(".post-share-menu").remove();return;}toolbar.append(menu);
    };icon(share,"Поділитися",shapes.share);toolbar.append(share);
    const endpoint="/api/forum/topics/"+encodeURIComponent(post.id);
    const action=(label,handler,parent=card)=>{const b=el("button",label);b.type="button";b.onclick=async()=>{b.disabled=true;try{await handler();}catch(error){status.textContent=error.message;}finally{b.disabled=false;}};parent.append(b);return b;};
    const request=async(url,method,body)=>{const r=await fetch(url,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.message||"Не вдалося виконати дію.");}await load();};
    if(token){
     const like=action("Лайк",()=>request(endpoint+"/like","POST"),toolbar);icon(like,"Лайк",shapes.heart,likes);toolbar.prepend(like);
     const comment=el("textarea");comment.placeholder="Написати коментар";comment.maxLength=2000;const commentRow=el("div");commentRow.className="post-comment";commentRow.append(comment);card.append(commentRow);
     icon(action("Надіслати",async()=>{const content=comment.value.trim();if(content)await request(endpoint+"/replies","POST",{content});},commentRow),"Надіслати коментар",shapes.send);
    }
    for(const reply of (Array.isArray(post.replies)?post.replies:[])){const p=el("p",(reply.author_name||reply.authorName||"Користувач")+": "+(reply.content||reply.text||""));card.append(p);}
    if(isOwner && token){
     const details=el("details"),summary=el("summary"),options=el("div");details.className="post-menu";icon(summary,"Дії публікації",shapes.more);details.append(summary,options);toolbar.append(details);
     action("Редагувати",async()=>{
      details.open=false;if(card.querySelector("form"))return;
      const form=el("form"),desc=el("textarea"),picker=el("input"),preview=el("div"),save=el("button","Зберегти"),cancel=el("button","Скасувати");
      desc.value=post.content;desc.maxLength=2000;picker.type="file";picker.accept="image/*,video/*";picker.multiple=true;cancel.type="button";cancel.onclick=()=>form.remove();
      let items=(post.attachment?.items||[post.attachment]).filter(Boolean).map(({items,...a})=>a);
      const refresh=()=>{preview.replaceChildren();items.forEach((a,i)=>{const row=el("div"),b=el("button","Видалити "+(a.name||"файл"));b.type="button";b.onclick=()=>{items.splice(i,1);refresh();};if(a.type==="image"&&a.data){const img=el("img");img.src=a.data;img.style.cssText="width:80px;height:80px;object-fit:cover";row.append(img);}row.append(b);preview.append(row);});};
      picker.onchange=async()=>{const files=Array.from(picker.files);if(items.length+files.length>20){status.textContent="Максимум 20 файлів.";return;}save.disabled=picker.disabled=cancel.disabled=true;try{const copies=await Promise.all(files.map(async f=>{if(f.size>(f.type.startsWith("image/")?10:20)*1024*1024)throw Error("Файл надто великий.");return new File([await f.arrayBuffer()],f.name,{type:f.type});}));for(const f of copies){items.push(await convert(f));refresh();}}catch(e){status.textContent=e.message;}finally{save.disabled=picker.disabled=cancel.disabled=false;picker.value="";}};
      form.onsubmit=async e=>{e.preventDefault();if(save.disabled)return;save.disabled=picker.disabled=cancel.disabled=true;try{const content=desc.value.trim()||"Публікація";await request(endpoint,"PATCH",{title:content.slice(0,80),category:post.category,content,attachment:items.length?{...items[0],items}:null});}catch(e){status.textContent=e.message;save.disabled=picker.disabled=cancel.disabled=false;}};
      form.append(desc,picker,preview,save,cancel);refresh();card.append(form);
     },options);
     action("Видалити",async()=>{if(window.confirm("Видалити цю публікацію з профілю та форуму?"))await request(endpoint,"DELETE");},options);
    }
    feed.append(card);
   }
  }catch(error){status.textContent=error.message;}
 }
 load();
};

;document.addEventListener("click",event=>{document.querySelectorAll(".garage-posts .post-menu[open]").forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});},true);
