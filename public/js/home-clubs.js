"use strict";
(async()=>{
 const track=document.getElementById("homeClubsTrack"),status=document.getElementById("homeClubsStatus");
 if(!track)return;
 try{
  const response=await fetch("/api/clubs/discover");
  if(!response.ok)throw new Error("Не вдалося завантажити клуби.");
  const data=await response.json();
  for(const club of data.clubs){
   const card=document.createElement("a"),name=document.createElement("strong");
   card.className="home-partner-card home-club-card";
   card.href="forum.html?club="+encodeURIComponent(club.id);
   if(club.cover_url){
    const photo=document.createElement("img");photo.src=club.cover_url;photo.alt="";photo.loading="lazy";
    photo.addEventListener("error",()=>photo.remove(),{once:true});card.append(photo);
   }
   name.textContent=club.name;card.append(name);track.append(card);
  }
  status.hidden=data.clubs.length>0;status.textContent="Ще немає клубів. Створіть перший у Royal Garage Club.";
 }catch(error){status.hidden=false;status.textContent="Не вдалося завантажити клуби. Спробуйте оновити сторінку.";}
})();