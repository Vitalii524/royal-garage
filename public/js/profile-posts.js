"use strict";
window.mountGaragePosts = function(root, ownerId, isOwner) {
 if (!root || !ownerId) return;
 const token = localStorage.getItem("royalGarageToken") || "";
 const headers = {"Content-Type":"application/json", Authorization:"Bearer "+token};
 const el = (tag, value) => { const n=document.createElement(tag); if(value)n.textContent=value; return n; };
 root.classList.add("garage-posts");
 if(!document.getElementById("garagePostsStyles")){
  const style=el("style");style.id="garagePostsStyles";style.textContent=".garage-posts{color:inherit;min-width:0}.garage-posts form,.garage-posts article{display:flex;flex-wrap:wrap;gap:12px;padding:16px;margin:12px 0;border:1px solid #806b42;border-radius:14px;background:#202124;color:#f5f5f5}.garage-posts textarea{width:100%;min-height:90px;background:#17181a;color:#fff;border:1px solid #806b42;border-radius:10px;padding:12px;box-sizing:border-box}.garage-posts button,.garage-posts article a{background:#d6a445;color:#17181a;border:0;border-radius:9px;padding:10px 14px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}.garage-posts button:disabled{opacity:.5;cursor:wait}.garage-posts article h3,.garage-posts article p,.garage-posts form p{width:100%;margin:0;overflow-wrap:anywhere;white-space:pre-wrap}.garage-posts article img,.garage-posts article video{width:100%;max-height:560px;object-fit:contain;border-radius:10px;background:#111}.garage-posts [role=status]{overflow-wrap:anywhere}.garage-posts h2{color:#d6a445}";
  document.head.append(style);
 }
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
  form.append(description);
  let files=[];
  const selected=el("div");selected.style.width="100%";
  const refresh=()=>{selected.replaceChildren(el("p",files.length+" / 20"));files.forEach((f,i)=>{const b=el("button",f.name+" ×");b.type="button";b.onclick=()=>{files.splice(i,1);refresh();};selected.append(b);});};
  for(const [label,accept,capture] of [["Зняти фото","image/*",true],["Зняти відео","video/*",true],["З галереї","image/*,video/*",false]]){
   const input=el("input");input.type="file";input.accept=accept;input.multiple=!capture;if(capture)input.setAttribute("capture","environment");input.hidden=true;
   const button=el("button",label);button.type="button";button.onclick=()=>input.click();
   input.onchange=async()=>{const picked=Array.from(input.files);input.value="";if(files.length+picked.length>20){status.textContent="Максимум 20 файлів.";return;}submit.disabled=true;try{const snapshots=await Promise.all(picked.map(async f=>{if(f.size>(f.type.startsWith("image/")?10:20)*1024*1024)throw Error("Файл надто великий: "+f.name);return new File([await f.arrayBuffer()],f.name,{type:f.type});}));files.push(...snapshots);refresh();}catch(e){status.textContent=e.message;}finally{submit.disabled=false;}};
   form.append(button,input);
  }
  form.append(selected,submit);root.append(form);
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
    const response=await fetch("/api/forum/topics",{method:"POST",headers,body:JSON.stringify({title:body.slice(0,80)||"Публікація",category:"Загальне",content:body||"Публікація",attachment})});
    const result=await response.json();if(!response.ok)throw Error(result.message||"Не вдалося опублікувати.");
    form.reset();files=[];refresh();await load();status.textContent="Опубліковано.";
   }catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
  };
 }
 root.append(status,feed);
 async function load(){
  try{
   const response=await fetch("/api/forum/topics");if(!response.ok)throw Error("Не вдалося завантажити публікації.");
   const data=await response.json();feed.replaceChildren();
   const posts=(data.topics||[]).filter(t=>String(t.user_id)===String(ownerId)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
   if(!posts.length)feed.append(el("p","Публікацій ще немає."));
   for(const post of posts){
    const card=el("article");if(post.title && !String(post.content||"").startsWith(post.title))card.append(el("h3",post.title));card.append(el("p",post.content));
    const gallery=el("div");gallery.style.cssText="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;width:100%;gap:8px";
    const attachments=post.attachment?.items||[post.attachment];
    for(const a of attachments){
     let media;
     if(a?.type==="image" && /^data:image\/(jpeg|png|webp);base64,/i.test(a.data)){media=el("img");media.src=a.data;media.alt="Фото публікації";}
     if(a?.type==="video" && /^\/api\/media\/videos\/[a-zA-Z0-9-]+$/.test(a.data)){media=el("video");media.src=a.data;media.controls=true;media.preload="metadata";media.playsInline=true;}
     if(media){media.style.cssText="flex:0 0 100%;min-width:0;scroll-snap-align:start";gallery.append(media);}
    }
    if(gallery.children.length){card.append(gallery);if(gallery.children.length>1){const prev=el("button","‹"),next=el("button","›");prev.type=next.type="button";prev.onclick=()=>gallery.scrollBy({left:-gallery.clientWidth,behavior:"smooth"});next.onclick=()=>gallery.scrollBy({left:gallery.clientWidth,behavior:"smooth"});card.append(prev,el("span",gallery.children.length+" фото / відео"),next);}}
    const likes=Array.isArray(post.like_user_ids)?post.like_user_ids.length:0;
    const replies=Array.isArray(post.replies)?post.replies.length:0;
    const link=el("a","♡ "+likes+" · Коментарі "+replies);link.href="forum.html?topicId="+encodeURIComponent(post.id);card.append(link);
    const share=el("button","Поділитися");share.type="button";
    share.onclick=()=>{
     const url=new URL(link.href,location.href).href;
     const menu=el("div");menu.style.cssText="display:flex;flex-wrap:wrap;gap:8px;width:100%";
     const enc=encodeURIComponent;
     const add=(label,href)=>{const a=el("a",label);a.href=href;a.target="_blank";a.rel="noopener noreferrer";menu.append(a);};
     add("Facebook — допис","https://www.facebook.com/sharer/sharer.php?u="+enc(url));
     add("Threads — допис","https://www.threads.net/intent/post?text="+enc(post.content+" "+url));
     add("X — допис","https://twitter.com/intent/tweet?text="+enc(post.content)+"&url="+enc(url));
     const native=el("button","Інші застосунки");native.type="button";native.onclick=async()=>{try{if(navigator.share)await navigator.share({title:post.title,text:post.content,url});else window.prompt("Скопіюйте посилання",url);}catch(e){if(e.name!=="AbortError")status.textContent="Не вдалося поділитися.";}};menu.append(native);
     const copy=el("button","Копіювати посилання");copy.type="button";copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);status.textContent="Посилання скопійовано.";}catch(e){window.prompt("Скопіюйте посилання",url);}};menu.append(copy);
     share.replaceWith(menu);
    };card.append(share);
    const endpoint="/api/forum/topics/"+encodeURIComponent(post.id);
    const action=(label,handler)=>{const b=el("button",label);b.type="button";b.onclick=async()=>{b.disabled=true;try{await handler();}catch(error){status.textContent=error.message;}finally{b.disabled=false;}};card.append(b);return b;};
    const request=async(url,method,body)=>{const r=await fetch(url,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.message||"Не вдалося виконати дію.");}await load();};
    if(token){
     action("♡ Лайк",()=>request(endpoint+"/like","POST"));
     const comment=el("textarea");comment.placeholder="Написати коментар";comment.maxLength=2000;card.append(comment);
     action("Надіслати",async()=>{const content=comment.value.trim();if(content)await request(endpoint+"/replies","POST",{content});});
    }
    for(const reply of (Array.isArray(post.replies)?post.replies:[])){const p=el("p",(reply.author_name||reply.authorName||"Користувач")+": "+(reply.content||reply.text||""));card.append(p);}
    if(isOwner && token){
     action("Редагувати",async()=>{
      if(card.querySelector("form"))return;
      const form=el("form"),desc=el("textarea"),picker=el("input"),preview=el("div"),save=el("button","Зберегти"),cancel=el("button","Скасувати");
      desc.value=post.content;desc.maxLength=2000;picker.type="file";picker.accept="image/*,video/*";picker.multiple=true;cancel.type="button";cancel.onclick=()=>form.remove();
      let items=(post.attachment?.items||[post.attachment]).filter(Boolean).map(({items,...a})=>a);
      const refresh=()=>{preview.replaceChildren();items.forEach((a,i)=>{const row=el("div"),b=el("button","Видалити "+(a.name||"файл"));b.type="button";b.onclick=()=>{items.splice(i,1);refresh();};if(a.type==="image"&&a.data){const img=el("img");img.src=a.data;img.style.cssText="width:80px;height:80px;object-fit:cover";row.append(img);}row.append(b);preview.append(row);});};
      picker.onchange=async()=>{const files=Array.from(picker.files);if(items.length+files.length>20){status.textContent="Максимум 20 файлів.";return;}save.disabled=picker.disabled=cancel.disabled=true;try{const copies=await Promise.all(files.map(async f=>{if(f.size>(f.type.startsWith("image/")?10:20)*1024*1024)throw Error("Файл надто великий.");return new File([await f.arrayBuffer()],f.name,{type:f.type});}));for(const f of copies){items.push(await convert(f));refresh();}}catch(e){status.textContent=e.message;}finally{save.disabled=picker.disabled=cancel.disabled=false;picker.value="";}};
      form.onsubmit=async e=>{e.preventDefault();if(save.disabled)return;save.disabled=picker.disabled=cancel.disabled=true;try{const content=desc.value.trim()||"Публікація";await request(endpoint,"PATCH",{title:content.slice(0,80),category:post.category,content,attachment:items.length?{...items[0],items}:null});}catch(e){status.textContent=e.message;save.disabled=picker.disabled=cancel.disabled=false;}};
      form.append(desc,picker,preview,save,cancel);refresh();card.append(form);
     });
     action("Видалити",async()=>{if(window.confirm("Видалити цю публікацію з профілю та форуму?"))await request(endpoint,"DELETE");});
    }
    feed.append(card);
   }
  }catch(error){status.textContent=error.message;}
 }
 load();
};
