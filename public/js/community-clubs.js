"use strict";
(()=>{
 const root=document.getElementById("communityClubs"),form=document.getElementById("createClubForm"),list=document.getElementById("communityClubsList"),status=root.querySelector(":scope > p");
 const dialog = document.getElementById("createClubDialog");
 const formStatus = document.getElementById("clubFormStatus");
 let editingClubId = null;
 function openClubDialog(club = null) {
  editingClubId = club?.id || null;
  form.reset();
  form.elements.name.value = club?.name || "";
  form.elements.description.value = club?.description || "";
  document.getElementById("createClubTitle").textContent = club ? "Редагувати клуб" : "Створити клуб";
  form.querySelector("button").textContent = club ? "Зберегти зміни" : "Створити";
  form.hidden = false;
  formStatus.textContent = "";
  dialog.showModal();
  form.elements.name.focus({preventScroll: true});
 }
 document.getElementById("closeClubDialog").addEventListener("click", () => dialog.close());
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
  card.append(title,description,open);
  if (club.owned) {
   const edit = document.createElement("button");
   edit.type = "button";
   edit.textContent = "Редагувати";
   edit.addEventListener("click", () => openClubDialog(club));
   const remove = document.createElement("button");
   remove.type = "button";
   remove.textContent = "Видалити клуб";
   remove.addEventListener("click", async () => {
    if (!confirm("Видалити клуб «" + club.name + "» зі списку? Опубліковані дописи залишаться в спільній стрічці.")) return;
    remove.disabled = true;
    try {
     await api("/api/clubs/" + encodeURIComponent(club.id), {method: "DELETE"});
     filter.value = "all";
     filter.dispatchEvent(new Event("change"));
     await refresh();
    } catch (error) {
     status.textContent = error.message;
     remove.disabled = false;
    }
   });
   card.append(edit, remove);
  } else card.append(join);
  list.appendChild(card);
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
   openClubDialog();
   if (select === filter) filter.dispatchEvent(new Event("change"));
  });
 }
 document.getElementById("createClub").addEventListener("click",()=>openClubDialog());
 form.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector("button");button.disabled=true;try{await api(editingClubId ? "/api/clubs/" + encodeURIComponent(editingClubId) : "/api/clubs",{method:editingClubId ? "PATCH" : "POST",body:JSON.stringify({name:form.elements.name.value,description:form.elements.description.value})});form.reset();dialog.close();await refresh();}catch(error){formStatus.textContent=error.message;}finally{button.disabled=false;}});
 const requestedClub = new URLSearchParams(location.search).get("club");
 refresh().then(() => {
  if (location.hash === "#communityClubs") root.scrollIntoView({block:"start"});
  if (requestedClub && [...filter.options].some(option => option.value === "club:" + requestedClub)) {
   filter.value = "club:" + requestedClub;
   filter.dispatchEvent(new Event("change"));
  }
 }).catch(error=>{status.textContent=error.message;});
})();
