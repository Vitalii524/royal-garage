(() => {
 const modal=document.getElementById('businessBookingModal'),form=document.getElementById('businessBookingForm'),open=document.getElementById('royalAutoBooking');if(!modal||!form||!open)return;
 open.addEventListener('click',()=>{modal.hidden=false;form.elements.name.focus();});
 modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>{modal.hidden=true;open.focus();}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true;});
 form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('[type=submit]'),status=document.getElementById('businessBookingStatus');button.disabled=true;status.textContent='Надсилання…';try{const values=Object.fromEntries(new FormData(form));values.attachments=await RGRequestMedia.collect(form);const r=await fetch('/api/businesses/32ce413e-9eb6-417a-b99a-77d9ca7c144a/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});const d=await r.json();if(!r.ok)throw new Error(d.message||'Не вдалося надіслати заявку.');form.reset();status.textContent='Заявку надіслано. RoyalAuto зв’яжеться з вами для узгодження часу.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}});
})();
