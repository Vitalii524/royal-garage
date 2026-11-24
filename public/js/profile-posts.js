"use strict";
window.mountGaragePosts = function(root, ownerId, isOwner) {
 if (!root || !ownerId) return;
 const token = localStorage.getItem("royalGarageToken") || "";
 const headers = {"Content-Type":"application/json", Authorization:"Bearer "+token};
 const el = (tag, value) => { const n=document.createElement(tag); if(value)n.textContent=value; return n; };
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
    const link=el("a","Переглянути · лайки та коментарі");link.href="forum.html?topicId="+encodeURIComponent(post.id);card.append(link);
    const share=el("button","Поділитися");share.type="button";
    share.onclick=async()=>{
     const url=new URL(link.href,location.href).href;
     try{
      if(navigator.share)await navigator.share({title:post.title,text:post.content,url});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url);status.textContent="Посилання скопійовано.";}
      else window.prompt("Скопіюйте посилання",url);
     }catch(error){if(error.name!=="AbortError")window.prompt("Скопіюйте посилання",url);}
    };card.append(share);feed.append(card);
   }
  }catch(error){status.textContent=error.message;}
 }
 load();
};
