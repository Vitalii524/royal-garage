"use strict";
(()=>{
 const root=document.getElementById("communityClubs"),form=document.getElementById("createClubForm"),list=document.getElementById("communityClubsList"),status=root.querySelector("p");
 const category=document.getElementById("topicCategory"),filter=document.getElementById("forumCategoryFilter");
 async function api(path,options={}){const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("royalGarageToken")||""}`}});const data=await response.json();if(!response.ok)throw new Error(data.message||"Увійдіть, щоб керувати клубами.");return data;}
 async function refresh(){
 const data=await api("/api/clubs");list.replaceChildren();
 for(const select of [category,filter])for(const option of [...select.options])if(option.value.startsWith("club:"))option.remove();
 for(const club of data.clubs){
  for(const select of [filter,...(club.joined?[category]:[])]){const option=document.createElement("option");option.value="club:"+club.id;option.textContent=club.name;select.appendChild(option);}
  const card=document.createElement("article"),title=document.createElement("h3"),description=document.createElement("p"),open=document.createElement("button"),join=document.createElement("button");
  title.textContent=club.name;description.textContent=club.description;open.type=join.type="button";open.textContent=`Дописи · ${club.members} учасників`;join.textContent=club.joined?"Відписатися":"Підписатися";
  open.addEventListener("click",()=>{filter.value="club:"+club.id;filter.dispatchEvent(new Event("change"));document.getElementById("forumTopics").scrollIntoView({behavior:"smooth"});});
  join.addEventListener("click",async()=>{join.disabled=true;try{await api(`/api/clubs/${club.id}/membership`,{method:"PUT",body:JSON.stringify({joined:!club.joined})});await refresh();}catch(error){status.textContent=error.message;join.disabled=false;}});
  card.append(title,description,open,join);list.appendChild(card);
 }
 status.textContent=data.clubs.length?"":"Створіть перший клуб спільноти.";
 }
 for (const select of [category, filter]) {
  const option = document.createElement("option");
  option.value = "create-club";
  option.textContent = "Створити клуб";
  select.appendChild(option);
  select.addEventListener("change", () => {
   if (select.value !== "create-club") return;
   select.value = select === filter ? "all" : "";
   if (select === category) {
    const close = document.querySelector("#topicModal [data-close-modal]");
    if (close) close.click();
   }
   form.hidden = false;
   root.scrollIntoView({behavior: "smooth", block: "start"});
   form.elements.name.focus({preventScroll: true});
   if (select === filter) filter.dispatchEvent(new Event("change"));
  });
 }
 document.getElementById("createClub").addEventListener("click",()=>{form.hidden=!form.hidden;});
 form.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector("button");button.disabled=true;try{await api("/api/clubs",{method:"POST",body:JSON.stringify({name:form.elements.name.value,description:form.elements.description.value})});form.reset();form.hidden=true;await refresh();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
 refresh().catch(error=>{status.textContent=error.message;});
})();
