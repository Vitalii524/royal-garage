(() => {
 const root=document.getElementById('royalRequests'),refresh=document.getElementById('royalRequestsRefresh');if(!root||!refresh)return;
 const api=async(url,options)=>await(await RGRequestMedia.api(url,options)).json();
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 async function load(page=0){refresh.disabled=true;if(!page)root.textContent='Завантаження заявок…';try{
  await api('/api/crm/bootstrap',{method:'POST'});
  const data=await api('/api/business/requests?page='+page),team=await api('/api/crm/employees');if(!page)root.replaceChildren();
  if(!data.requests.length){root.textContent='Заявок поки немає.';return;}
  for(const request of data.requests){const card=el('article');card.className='rg-media';card.append(el('h3',request.name+' · '+request.brand+' '+request.model));const info=el('p',[request.phone,'Рік: '+request.year,'Пробіг: '+request.mileage+' км','Двигун: '+(request.engine||'—'),'Паливо: '+(request.fuel||'—'),'Коробка: '+(request.transmission||'—'),'Держномер: '+(request.plate||'—'),'VIN: '+(request.vin||'—'),'Скарга: '+request.reason,request.status==='confirmed'?'Підтверджено':'Очікує підтвердження'].join('\n'));info.style.whiteSpace='pre-wrap';card.append(info);
   const status=el('p');status.setAttribute('role','status');const call=el('button','Зателефонувати');call.type='button';call.addEventListener('click',async()=>{call.disabled=true;try{await api('/api/business/requests/'+request.id+'/contact',{method:'POST'});status.textContent='Клієнта й автомобіль збережено в CRM.';location.href='tel:'+request.phone.replace(/[^+0-9]/g,'');}catch(e){status.textContent=e.message;}finally{call.disabled=false;}});card.append(call,status);
   const details=el('details'),summary=el('summary','Фото та відео скарги'),media=el('div');details.append(summary,media);details.addEventListener('toggle',()=>{if(details.open)RGRequestMedia.render(media,'/api/business/requests/'+request.id+'/media');});card.append(details);
   if(request.crm_work_order_id){const link=el('a','Відкрити наряд');link.href='crm-work-order.html?id='+encodeURIComponent(request.crm_work_order_id);card.append(link);}
   if(request.status==='pending'){const form=el('form');const date=el('input');date.type='datetime-local';date.required=true;const dateLabel=el('label','Дата й час');dateLabel.append(date);const employee=el('select');employee.required=true;employee.append(new Option('Оберіть майстра',''));for(const e of team.employees.filter(x=>x.status==='active'))employee.append(new Option(e.name,e.id));const employeeLabel=el('label','Майстер');employeeLabel.append(employee);const duration=el('input');duration.type='number';duration.min=1;duration.max=1440;duration.value=60;duration.required=true;const durationLabel=el('label','Тривалість, хв');durationLabel.append(duration);const submit=el('button','Підтвердити й додати в CRM');submit.type='submit';form.append(dateLabel,employeeLabel,durationLabel,submit);form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{await api('/api/business/requests/'+request.id+'/confirm',{method:'POST',body:JSON.stringify({scheduledAt:new Date(date.value).toISOString(),employeeId:employee.value,durationMinutes:Number(duration.value)})});await load();}catch(e){status.textContent=e.message;submit.disabled=false;}});card.append(form);if(!team.employees.some(x=>x.status==='active'))card.append(el('p','Спочатку додайте активного майстра в CRM → Працівники.'));}
   root.append(card);
  }
  if(data.hasMore){const more=el('button','Показати ще заявки');more.type='button';more.addEventListener('click',()=>{more.remove();load(page+1);});root.append(more);}
 }catch(e){root.textContent=e.message;}finally{refresh.disabled=false;}}
 refresh.addEventListener('click',()=>load());
 root.parentElement.addEventListener('toggle',()=>{if(root.parentElement.open)load();});
 if(new URLSearchParams(location.search).has('requests'))root.parentElement.open=true;
})();
