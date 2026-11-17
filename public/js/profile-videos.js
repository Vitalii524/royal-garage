"use strict";
(async()=>{
 const box=document.getElementById("profileVideos");if(!box)return;
 const status=box.querySelector("p"),list=box.querySelector("div"),pickers=[...box.querySelectorAll("input")];
 status.setAttribute("role","status");
 const headers=()=>({Authorization:`Bearer ${localStorage.getItem("royalGarageToken")||""}`});
 async function refresh(){
  const r=await fetch("/api/media/videos",{headers:headers()});const data=await r.json();
  if(!r.ok)throw new Error(data.message||"Не вдалося завантажити відео.");
  list.replaceChildren();
  for(const item of data.videos){
   const card=document.createElement("article"),video=document.createElement("video"),remove=document.createElement("button");
   video.controls=true;video.playsInline=true;video.preload="metadata";video.src="/api/media/videos/"+item.id;
   remove.type="button";remove.textContent="Видалити відео";remove.className="profile-video-delete";
   remove.addEventListener("click",async()=>{
    if(!confirm("Видалити це відео назавжди? Воно також перестане відтворюватися в дописах, де використовується."))return;
    remove.disabled=true;
    try{
     const r=await fetch("/api/media/videos/"+encodeURIComponent(item.id),{method:"DELETE",headers:headers()});
     const data=await r.json();if(!r.ok)throw new Error(data.message||"Не вдалося видалити відео.");
     video.pause();video.removeAttribute("src");video.load();card.remove();status.textContent="Відео видалено.";
    }catch(error){status.textContent=error.message;remove.disabled=false;}
   });
   card.append(video,remove);list.append(card);
  }
 }
 for(const picker of pickers)picker.addEventListener("change",async()=>{
  if(!picker.files[0])return;
  pickers.forEach(p=>p.disabled=true);status.textContent="Завантаження…";
  try{await uploadGarageVideo(picker.files[0]);await refresh();status.textContent="Відео збережено.";}
  catch(error){status.textContent=error.message;}
  finally{pickers.forEach(p=>p.disabled=false);picker.value="";}
 });
 try{await refresh();}catch(error){status.textContent=error.message;}
})();