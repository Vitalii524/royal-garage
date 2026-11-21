(() => {
 'use strict';
 const availability={available:'У наявності',order:'Під замовлення',unavailable:'Немає в наявності'};
 function card(item){
  const card=window.RGServiceGallery.card({...item,name:item.title,priceUah:item.price},item.category||'Автотовари');
  const info=card.querySelector('.rg-service-info');
  if(item.price!=null)info.querySelector('strong').textContent=Number(item.price).toLocaleString('uk-UA')+' грн';
  const seller=document.createElement('a');seller.href='business-profile.html?id='+encodeURIComponent(item.ownerId);seller.textContent=item.sellerName||'Продавець';
  const stock=document.createElement('p');stock.textContent=availability[item.availability]||'';info.append(stock,seller);
  card.querySelector('.rg-service-more').onclick=()=>{location.href='product.html?id='+encodeURIComponent(item.id);};
  return card;
 }
 function orders(item,root){
  root.replaceChildren();
  if(item.availability==='unavailable'){root.textContent='Немає в наявності';return;}
  const methods=[];
  if(item.orderTelegram&&/^[a-zA-Z0-9_]{5,32}$/.test(item.orderTelegram))methods.push(['Telegram','https://t.me/'+item.orderTelegram+'?text='+encodeURIComponent(item.title+' — '+location.href)]);
  if(item.orderViber&&/^\+[1-9]\d{7,14}$/.test(item.orderViber))methods.push(['Viber','viber://chat?number='+encodeURIComponent(item.orderViber)]);
  if(item.orderChat)methods.push(['Чат Royal Garage','chat.html?withUserId='+encodeURIComponent(item.ownerId)]);
  const title=document.createElement('strong');title.textContent='Замовити — оберіть спосіб зв’язку';root.append(title);
  for(const [label,url] of methods){const a=document.createElement('a');a.textContent=label;a.href=url;a.className='rg-service-more';if(url.startsWith('https:')){a.target='_blank';a.rel='noopener';}root.append(a);}
 }
 window.RGProductCatalog={card,orders,availability};
 const grid=document.getElementById('catalogGrid'),status=document.getElementById('catalogStatus');
 if(!status)return;
 let page=1,searchId=0;
 async function load(append=false){
  const serial=++searchId;status.textContent='Завантаження…';
  try{const query=new URLSearchParams({q:document.getElementById('catalogSearch')?.value||'',category:document.getElementById('catalogCategory')?.value||'',page:String(page)});
   const response=await fetch('/api/catalog/products?'+query);const data=await response.json();if(!response.ok)throw Error(data.message);if(serial!==searchId)return;
   if(!append)grid.replaceChildren();for(const item of data.products)grid.append(card(item));status.textContent=grid.children.length?'':'Товарів не знайдено.';document.getElementById('catalogMore').hidden=!data.hasMore;
  }catch(e){if(serial===searchId)status.textContent=e.message||'Не вдалося завантажити каталог.';}
 }
 if(grid){document.getElementById('catalogSearchForm').addEventListener('submit',e=>{e.preventDefault();page=1;load();});document.getElementById('catalogMore').addEventListener('click',()=>{page++;load(true);});load();}
 else(async()=>{
  try{const id=new URLSearchParams(location.search).get('id');if(!id)throw Error('Не вказано товар.');const response=await fetch('/api/catalog/products/'+encodeURIComponent(id));const data=await response.json();if(!response.ok)throw Error(data.message);
   const p=data.product;document.title=p.title+' | Royal Garage';document.getElementById('productTitle').textContent=p.title;
   document.getElementById('productMedia').append(window.RGServiceGallery.gallery(p.photos,p.title));
   document.getElementById('productDescription').textContent=p.description||'';
   document.getElementById('productPrice').textContent=p.price==null?'Ціна договірна':Number(p.price).toLocaleString('uk-UA')+' грн';
   document.getElementById('productCategory').textContent=[p.category,availability[p.availability]].filter(Boolean).join(' · ');
   const seller=document.getElementById('productSeller');seller.textContent=p.sellerName;seller.href='business-profile.html?id='+encodeURIComponent(p.ownerId);
   orders(p,document.getElementById('productOrders'));status.textContent='';
  }catch(e){status.textContent=e.message||'Не вдалося завантажити товар.';}
 })();
})();
