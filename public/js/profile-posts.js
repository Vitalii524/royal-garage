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
 root.replaceChildren(el("h2","Публікації"));
 const status=el("p");status.setAttribute("role","status");
 const feed=el("div");
 if(isOwner && token){
  const form=el("form"), description=el("textarea"), submit=el("button","Опублікувати");
  description.placeholder="Додайте опис (необов’язково)";description.maxLength=2000;
  form.append(description);
  let file=null;
  const selected=el("p");
  for(const [label,accept,capture] of [["Зняти фото","image/*",true],["Зняти відео","video/*",true],["З галереї","image/*,video/*",false]]){
   const input=el("input");input.type="file";input.accept=accept;if(capture)input.setAttribute("capture","environment");input.hidden=true;
   const button=el("button",label);button.type="button";button.onclick=()=>input.click();
   input.onchange=()=>{if(input.files[0]){file=input.files[0];selected.textContent=file.name;}};
   form.append(button,input);
  }
  form.append(selected,submit);root.append(form);
  form.onsubmit=async event=>{
   event.preventDefault();if(submit.disabled)return;
   if(!file){status.textContent="Оберіть фото або відео.";return;}
   submit.disabled=true;
   try{
    if(file.size>20*1024*1024)throw Error("Максимальний розмір — 20 МБ.");
    let attachment;
    if(file.type.startsWith("video/")){
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
    const body=description.value.trim();
    const response=await fetch("/api/forum/topics",{method:"POST",headers,body:JSON.stringify({title:body.slice(0,80)||"Публікація",category:"Загальне",content:body||"Публікація",attachment})});
    const result=await response.json();if(!response.ok)throw Error(result.message||"Не вдалося опублікувати.");
    form.reset();file=null;selected.textContent="";await load();status.textContent="Опубліковано.";
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
    const card=el("article");card.append(el("h3",post.title),el("p",post.content));
    const a=post.attachment;
    if(a?.type==="image" && /^data:image\/(jpeg|png|webp);base64,/i.test(a.data)){const img=el("img");img.src=a.data;img.alt="Фото публікації";img.style.maxWidth="100%";card.append(img);}
    if(a?.type==="video" && /^\/api\/media\/videos\/[a-zA-Z0-9-]+$/.test(a.data)){const video=el("video");video.src=a.data;video.controls=true;video.preload="metadata";video.style.maxWidth="100%";card.append(video);}
    const likes=Array.isArray(post.like_user_ids)?post.like_user_ids.length:0;
    const replies=Array.isArray(post.replies)?post.replies.length:0;
    const link=el("a","♡ "+likes+" · Коментарі "+replies);link.href="forum.html?topicId="+encodeURIComponent(post.id);card.append(link);
    const share=el("button","Поділитися");share.type="button";
    share.onclick=async()=>{
     const url=new URL(link.href,location.href).href;
     try{
      if(navigator.share)await navigator.share({title:post.title,text:post.content,url});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url);status.textContent="Посилання скопійовано.";}
      else window.prompt("Скопіюйте посилання",url);
     }catch(error){if(error.name!=="AbortError")window.prompt("Скопіюйте посилання",url);}
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
     action("Редагувати",async()=>{const content=window.prompt("Опис публікації",post.content);if(content===null)return;await request(endpoint,"PATCH",{title:post.title,category:post.category,content:content.trim()||"Публікація",attachment:post.attachment||null});});
     action("Видалити",async()=>{if(window.confirm("Видалити цю публікацію з профілю та форуму?"))await request(endpoint,"DELETE");});
    }
    feed.append(card);
   }
  }catch(error){status.textContent=error.message;}
 }
 load();
};
