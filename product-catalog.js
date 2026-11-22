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
module.exports={productFields,installProductCatalog};
