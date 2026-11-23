"use strict";
window.uploadGarageVideo = async function(file) {
 if (!file || !["video/mp4","video/webm","video/quicktime"].includes(file.type)) throw new Error("Оберіть MP4, WebM або MOV.");
 if (file.size > 20*1024*1024) throw new Error("Максимальний розмір — 20 МБ.");
 const duration = await new Promise((resolve,reject)=>{
  const video=document.createElement("video"),url=URL.createObjectURL(file);
  video.preload="metadata";
  video.onloadedmetadata=()=>{const duration=video.duration;URL.revokeObjectURL(url);resolve(duration);};
  video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Браузер не підтримує цей відеофайл."));};
  video.src=url;
 });
 if (!Number.isFinite(duration) || duration>180) throw new Error("Відео має бути тривалістю до 3 хвилин.");
 const data = await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Не вдалося прочитати файл."));r.readAsDataURL(file);});
 const response=await fetch("/api/media/videos",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("royalGarageToken") || ""}`},body:JSON.stringify({data,name:file.name})});
 const result=await response.json();if(!response.ok)throw new Error(result.message || "Помилка завантаження.");return result.url;
};
