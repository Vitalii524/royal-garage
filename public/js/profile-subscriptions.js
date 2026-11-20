"use strict";
const subscriptionsPanel=document.getElementById("mySubscriptions");
subscriptionsPanel?.addEventListener("toggle",async()=>{
 if(!subscriptionsPanel.open)return;
 const status=subscriptionsPanel.querySelector("p"),list=subscriptionsPanel.querySelector("div");
 status.textContent="Завантаження…";
 try {
  const response=await fetch("/api/forum/subscriptions",{headers:{Authorization:`Bearer ${localStorage.getItem("royalGarageToken") || ""}`}});
  const data=await response.json();if(!response.ok)throw new Error(data.message||"Увійдіть в акаунт.");
  list.replaceChildren();
  for(const author of data.authors){const row=document.createElement("p");row.textContent=author.name;list.appendChild(row);}
  const clubResponse=await fetch("/api/clubs",{headers:{Authorization:`Bearer ${localStorage.getItem("royalGarageToken") || ""}`}});
  const clubs=await clubResponse.json();if(!clubResponse.ok)throw new Error(clubs.message||"Не вдалося завантажити клуби.");
  const joined=clubs.clubs.filter(club=>club.joined);
  for(const club of joined){const row=document.createElement("p");row.textContent="Клуб · "+club.name;list.appendChild(row);}
  status.textContent=data.authors.length||joined.length?"":"Підписок ще немає.";
 }catch(error){status.textContent=error.message;}
});
