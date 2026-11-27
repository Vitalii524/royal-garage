const { PUBLIC_BUSINESS_MODERATION } = require("./business-moderation");
'use strict';
function productFields(body){
 const category=String(body.category||'').trim();
 const availability=body.availability||'available';
 const telegram=String(body.orderTelegram||'').trim().replace(/^https:\/\/t\.me\//i,'').replace(/^@/,'');
 const viber=String(body.orderViber||'').trim().replace(/[\s()-]/g,'');
 if(category.length>100 || !['available','order','unavailable'].includes(availability))throw Error('Перевірте категорію та наявність.');
 if(telegram&&!/^[a-zA-Z0-9_]{5,32}$/.test(telegram))throw Error('Telegram: вкажіть ім’я користувача або https://t.me/ім’я.');
 if(viber&&!/^\+[1-9]\d{7,14}$/.test(viber))throw Error('Viber: номер у міжнародному форматі +380…');
 const chat=body.orderChat!==false;
 if(!telegram&&!viber&&!chat)throw Error('Залиште хоча б один спосіб замовлення.');
 return [category,availability,telegram,viber,chat];
}
function installProductCatalog({app,pool,databaseReady}){
 const visible=`FROM business_products p JOIN business_profiles bp ON bp.id=p.business_id
 JOIN users u ON u.id=bp.owner_id JOIN business_types bt ON bt.id=bp.business_type_id
 JOIN subscription_plans sp ON sp.id=bp.subscription_plan_id
 WHERE p.active=TRUE AND bt.code IN ('auto_shop','wholesale') AND NOT bp.is_deleted
 AND NOT u.account_disabled AND u.email_verified AND u.phone_verified AND sp.is_active
 AND (bp.complimentary_subscription OR bp.subscription_expires_at>NOW()) AND ${PUBLIC_BUSINESS_MODERATION}`;
 const columns=`p.id,p.title,p.description,p.price,p.photos,p.category,p.availability,
 p.order_telegram AS "orderTelegram",p.order_viber AS "orderViber",p.order_chat AS "orderChat",
 bp.name AS "sellerName",bp.owner_id AS "ownerId",bp.city`;
 app.get('/api/catalog/products',async(req,res)=>{
  try{await databaseReady;
   const q=String(req.query.q||'').trim().slice(0,120),category=String(req.query.category||'').trim().slice(0,100);
   const page=Math.max(1,Math.min(10000,parseInt(req.query.page,10)||1));
   const result=await pool.query(`SELECT ${columns} ${visible}
    AND ($1='' OR position(lower($1 COLLATE pg_catalog."pg_c_utf8") in lower((p.title||' '||p.category) COLLATE pg_catalog."pg_c_utf8"))>0)
    AND ($2='' OR lower(p.category COLLATE pg_catalog."pg_c_utf8")=lower($2 COLLATE pg_catalog."pg_c_utf8")) ORDER BY p.created_at DESC,p.id LIMIT 24 OFFSET $3`,[q,category,(page-1)*24]);
   res.json({ok:true,products:result.rows,page,hasMore:result.rows.length===24});
  }catch(e){res.status(500).json({ok:false,message:'Не вдалося завантажити каталог.'});}
 });
 app.get('/api/catalog/products/:id',async(req,res)=>{
  if(!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(req.params.id))return res.status(404).json({ok:false,message:'Товар не знайдено.'});
  try{await databaseReady;const result=await pool.query(`SELECT ${columns} ${visible} AND p.id=$1`,[req.params.id]);
   if(!result.rows.length)return res.status(404).json({ok:false,message:'Товар не знайдено.'});
   res.json({ok:true,product:result.rows[0]});
  }catch(e){res.status(500).json({ok:false,message:'Не вдалося завантажити товар.'});}
 });
}

function parseProm(xml){
 xml=xml.replace(/<!DOCTYPE\s+yml_catalog\s+SYSTEM\s+["']shops\.dtd["']\s*>/i,'');
 if(/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw Error('DTD не підтримується');
 const {SaxesParser}=require('saxes'),p=new SaxesParser(),items=[],categories=new Map(),stack=[];let offer=null,category=null;
 p.on('opentag',n=>{if(stack.length>30)throw Error('XML надто складний');stack.push({name:n.name,text:''});if(n.name==='offer')offer={id:String(n.attributes.id||''),available:n.attributes.available,photos:[]};if(n.name==='category'&&!offer)category=String(n.attributes.id||'');});
 const add=t=>{if(stack.length){const x=stack[stack.length-1];x.text=(x.text+t).slice(0,30000);}};p.on('text',add);p.on('cdata',add);
 p.on('closetag',n=>{const x=stack.pop(),v=x.text.trim();if(offer){if(n.name==='offer'){items.push(offer);offer=null;if(items.length>5000)throw Error('Максимум 5000 товарів');}else if(stack.at(-1)?.name==='offer'){if(n.name==='picture'){try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password&&offer.photos.length<6)offer.photos.push(u.href);}catch{}}else offer[n.name]=v;}}else if(n.name==='category'&&category!==null){categories.set(category,v);category=null;}});
 p.write(xml).close();const seen=new Set();return items.filter(x=>x.id&&x.id.length<=160&&!seen.has(x.id)&&seen.add(x.id)&&(x.name_ua||x.name||x.model)&&['UAH',''].includes(x.currencyId||'')).map(x=>({id:x.id,title:(x.name_ua||x.name||x.model).slice(0,200),description:(x.description_ua||x.description||'').replace(/<[^>]*>/g,' ').slice(0,10000),price:x.price&&Number.isFinite(Number(x.price))&&Number(x.price)>=0&&Number(x.price)<=1e9?Number(x.price):null,photos:x.photos,category:(categories.get(x.categoryId)||'').slice(0,100),availability:x.available==='false'?'unavailable':'available'}));
}
function installProm({app,pool,databaseReady,requireAuth}){
 const {downloadFeed,feedUrl}=require('./dealer-xml'),crypto=require('node:crypto');
 const previews=new Map();
 app.post('/api/business/prom/preview',requireAuth,async(req,res)=>{try{await databaseReady;const owner=req.user.userId;const b=await pool.query("SELECT bp.id FROM business_profiles bp JOIN business_types bt ON bt.id=bp.business_type_id WHERE bp.owner_id=$1 AND NOT bp.is_deleted AND bt.code IN ('auto_shop','wholesale')",[owner]);if(!b.rowCount)return res.sendStatus(403);const url=feedUrl(String(req.body.url||'')).href;const old=previews.get(owner);if(old?.busy)return res.status(429).json({message:'Зачекайте завершення завантаження'});if(previews.size>=100&&!old)return res.status(429).json({message:'Спробуйте пізніше'});previews.set(owner,{busy:true});try{const items=parseProm(await downloadFeed(url));if(!items.length)throw Error('Не знайдено товарів у гривнях');const token=crypto.randomUUID();previews.set(owner,{token,items,business:b.rows[0].id,url});setTimeout(()=>{if(previews.get(owner)?.token===token)previews.delete(owner);},600000).unref();res.json({ok:true,token,items});}catch(e){previews.delete(owner);throw e;}}catch(e){res.status(400).json({message:'Не вдалося прочитати YML/XML. Перевірте адресу та формат.'});}});
 app.post('/api/business/prom/import',requireAuth,async(req,res)=>{let c;try{const owner=req.user.userId,p=previews.get(owner);if(!p||p.token!==req.body.token||!Array.isArray(req.body.ids))return res.status(400).json({message:'Завантажте каталог повторно'});const ids=new Set(req.body.ids),items=p.items.filter(x=>ids.has(x.id));if(!items.length||items.length>500)return res.status(400).json({message:'Виберіть від 1 до 500 товарів за раз'});c=await pool.connect();await c.query('BEGIN');const b=await c.query("SELECT bp.id FROM business_profiles bp JOIN business_types bt ON bt.id=bp.business_type_id WHERE bp.id=$1 AND bp.owner_id=$2 AND NOT bp.is_deleted AND bt.code IN ('auto_shop','wholesale')",[p.business,owner]);if(!b.rowCount)throw Error('Профіль недоступний');for(const x of items){const h=crypto.createHash('sha256').update(JSON.stringify([p.business,p.url,x.id])).digest('hex'),id=h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-8'+h.slice(17,20)+'-'+h.slice(20,32);await c.query("INSERT INTO business_products(id,business_id,title,description,price,photos,category,availability,order_chat) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,true) ON CONFLICT(id) DO UPDATE SET price=EXCLUDED.price,availability=EXCLUDED.availability,updated_at=NOW() WHERE business_products.business_id=EXCLUDED.business_id",[id,p.business,x.title,x.description,x.price,JSON.stringify(x.photos),x.category,x.availability]);}await c.query('COMMIT');res.json({ok:true,count:items.length});}catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});res.status(500).json({message:'Імпорт не завершено'});}finally{c?.release();}});
}

module.exports={productFields,installProductCatalog,installProm,parseProm};
