"use strict";
(async()=>{
 const box=document.getElementById("profileVideos");if(!box)return;
 const status=box.querySelector("p"),input=box.querySelector("input"),list=box.querySelector("div");
 async function refresh(){const r=await fetch("/api/media/videos",{headers:{Authorization:`Bearer ${localStorage.getItem("royalGarageToken") || ""}`}});const data=await r.json();if(!r.ok)throw new Error(data.message);list.replaceChildren();for(const item of data.videos){const video=document.createElement("video");video.controls=true;video.playsInline=true;video.preload="metadata";video.src=`/api/media/videos/${item.id}`;video.style.width="100%";list.appendChild(video);}}
 input.addEventListener("change",async()=>{if(!input.files[0])return;input.disabled=true;status.textContent="Завантаження…";try{await uploadGarageVideo(input.files[0]);await refresh();status.textContent="Відео збережено.";}catch(e){status.textContent=e.message;}finally{input.disabled=false;input.value="";}});
 try{await refresh();}catch(e){status.textContent=e.message;}
})();
