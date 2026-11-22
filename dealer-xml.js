'use strict';
const {SaxesParser}=require('saxes');
const crypto=require('node:crypto'),dns=require('node:dns').promises,https=require('node:https'),net=require('node:net');
const MAX_BYTES=5*1024*1024;
function feedUrl(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||net.isIP(u.hostname)||!u.hostname.includes('.')||/\.(local|internal|localhost)$/i.test(u.hostname))throw Error('Потрібна публічна HTTPS-адреса XML-фіду.');u.hash='';return u;}
const blocked=new net.BlockList();for(const [ip,mask] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]])blocked.addSubnet(ip,mask);
function publicIPv4(ip){return net.isIPv4(ip)&&!blocked.check(ip);}
async function downloadFeed(value){
 const u=feedUrl(value),answers=await dns.lookup(u.hostname,{all:true}),ipv4=answers.filter(a=>a.family===4);
 if(!ipv4.length||ipv4.some(a=>!publicIPv4(a.address)))throw Error('Адреса фіду недоступна для безпечного імпорту.');
 const ip=ipv4[0].address;
 return new Promise((resolve,reject)=>{
  let totalTimer;
  const request=https.get(u,{family:4,lookup:(_host,_options,callback)=>callback(null,ip,4),headers:{Accept:'application/xml,text/xml','Accept-Encoding':'identity'}},response=>{
   if(response.statusCode!==200){response.resume();reject(Error('Фід не повернув XML.'));return;}
   let size=0;const chunks=[];
   response.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES){response.destroy();reject(Error('Фід перевищує 5 МБ.'));}else chunks.push(chunk);});
   response.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));response.on('error',reject);
  });
  totalTimer=setTimeout(()=>request.destroy(Error('Час завантаження фіду вичерпано.')),15000);
  request.on('close',()=>clearTimeout(totalTimer));request.setTimeout(15000,()=>request.destroy(Error('Час завантаження фіду вичерпано.')));request.on('error',reject);
 });
}
function parseFeed(xml){
 if(typeof xml!=='string'||Buffer.byteLength(xml)>MAX_BYTES||/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw Error('Неприпустимий XML або DTD.');
 const parser=new SaxesParser({xmlns:false});let stack=[],record=null,items=[],nodes=0,text='';
 parser.on('error',()=>{throw Error('Некоректний XML.');});parser.on('doctype',()=>{throw Error('DTD не підтримується.');});
 parser.on('opentag',node=>{if(++nodes>50000||stack.length>12)throw Error('XML надто складний.');stack.push(node.name);text='';if(node.name==='vehicle'){if(record)throw Error('Вкладені vehicle не підтримуються.');record={id:node.attributes.id,photos:[]};}});
 const add=t=>{text+=t;if(text.length>12000)throw Error('Поле XML надто довге.');};parser.on('text',add);parser.on('cdata',add);
 parser.on('closetag',node=>{const name=node.name;if(record&&stack.length>1){if(name==='photo')record.photos.push(text.trim());else if(name!=='vehicle'&&name!=='photos')record[name]=text.trim();if(name==='vehicle'){items.push(record);record=null;if(items.length>2000)throw Error('Максимум 2000 автомобілів.');}}stack.pop();text='';});
 parser.write(xml).close();if(!items.length)throw Error('У XML немає vehicle.');
 const ids=new Set();return items.map(r=>{
  const id=String(r.id||'').trim(),brand=String(r.brand||r.make||'').trim(),model=String(r.model||'').trim(),year=Number(r.year),vin=String(r.vin||'').trim().toUpperCase();
  if(!id||id.length>160||ids.has(id)||!brand||brand.length>100||!model||model.length>100||!Number.isInteger(year)||year<1900||year>new Date().getFullYear()+1)throw Error('Перевірте ID, марку, модель і рік автомобілів.');ids.add(id);
  if(vin&&!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))throw Error('Некоректний VIN.');
  const usd=r.price_usd==null?null:Number(r.price_usd),uah=r.price_uah==null?null:Number(r.price_uah);
  if((usd==null&&uah==null)||[usd,uah].some(p=>p!=null&&(!Number.isFinite(p)||p<0||p>1e9)))throw Error('Перевірте ціну автомобіля.');
  const status=String(r.status||'active').toLowerCase();if(!['active','sold'].includes(status))throw Error('Статус має бути active або sold.');
  const photos=r.photos.filter(Boolean).slice(0,20).map(p=>{const u=feedUrl(p);return u.href;});
  return {externalId:id,brand,model,year:String(year),vin,name:brand+' '+model+' '+year,priceUsd:usd,priceUah:uah,description:String(r.description||'').slice(0,10000),photos,status};
 });
}
async function synchronize(pool,feedId,fetchXml=downloadFeed, editorialOwnerId = null){
 const source=await pool.query(`SELECT f.* FROM business_xml_feeds f JOIN business_profiles bp ON bp.owner_id=f.owner_id JOIN business_types bt ON bt.id=bp.business_type_id JOIN users u ON u.id=f.owner_id
 WHERE f.id=$1 AND f.approved AND f.enabled AND ((bp.owner_id IS DISTINCT FROM $2::uuid AND bt.code='car_dealer') OR (bp.owner_id=$2 AND NULLIF(BTRIM(f.publication_rights_evidence),'') IS NOT NULL)) AND NOT bp.is_deleted AND NOT u.account_disabled AND u.email_verified AND u.phone_verified AND (bp.complimentary_subscription OR bp.subscription_expires_at>NOW())`,[feedId,editorialOwnerId]);
 if(!source.rowCount)return {skipped:true};const feed=source.rows[0];
 const items=parseFeed(await fetchXml(feed.url)); // Download and validate entirely before starting a DB transaction.
 const client=await pool.connect();try{
  await client.query('BEGIN');const locked=await client.query('SELECT * FROM business_xml_feeds WHERE id=$1 AND approved AND enabled FOR UPDATE',[feed.id]);if(!locked.rowCount){await client.query('ROLLBACK');return {skipped:true};}
  const owner=await client.query(`SELECT bp.name,bp.city,bp.phone FROM business_profiles bp JOIN business_types bt ON bt.id=bp.business_type_id JOIN users u ON u.id=bp.owner_id WHERE bp.owner_id=$1 AND ((bp.owner_id IS DISTINCT FROM $2::uuid AND bt.code='car_dealer') OR (bp.owner_id=$2 AND NULLIF(BTRIM($3::text),'') IS NOT NULL)) AND NOT bp.is_deleted AND NOT u.account_disabled AND u.email_verified AND u.phone_verified AND (bp.complimentary_subscription OR bp.subscription_expires_at>NOW()) FOR UPDATE OF bp`,[feed.owner_id,editorialOwnerId,locked.rows[0].publication_rights_evidence || null]);
  if(!owner.rowCount)throw Error('Профіль дилера недоступний для імпорту.');
  for(const car of items){
   const mapped=await client.query('SELECT listing_id FROM business_xml_listings WHERE feed_id=$1 AND external_id=$2',[feed.id,car.externalId]);
   const id=mapped.rows[0]?.listing_id||crypto.randomUUID();
   if(!mapped.rowCount){
    if(car.vin){const conflict=await client.query('SELECT id FROM market_listings WHERE owner_id=$1 AND vin=$2',[feed.owner_id,car.vin]);if(conflict.rowCount)throw Error('VIN уже є серед оголошень. Потрібне ручне узгодження.');}
    await client.query(`INSERT INTO market_listings(id,owner_id,name,year,brand,model,vin,photos,price_usd,price_uah,description,city,phone,status,published_at,sold_at,seller_name)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,NOW(),CASE WHEN $14::varchar='sold' THEN NOW() END,$15)`,[id,feed.owner_id,car.name,car.year,car.brand,car.model,car.vin,JSON.stringify(car.photos),car.priceUsd,car.priceUah,car.description,owner.rows[0]?.city||'',owner.rows[0]?.phone||'',car.status,owner.rows[0]?.name||'Автомайданчик']);
    await client.query('INSERT INTO business_xml_listings(feed_id,external_id,listing_id) VALUES($1,$2,$3)',[feed.id,car.externalId,id]);
   }else{
    const updated=await client.query(`UPDATE market_listings SET name=$3,year=$4,brand=$5,model=$6,vin=$7,photos=$8::jsonb,price_usd=$9,price_uah=$10,description=$11,status=$12,sold_at=CASE WHEN $12='sold' THEN COALESCE(sold_at,NOW()) ELSE NULL END,updated_at=NOW() WHERE id=$1 AND owner_id=$2`,[id,feed.owner_id,car.name,car.year,car.brand,car.model,car.vin,JSON.stringify(car.photos),car.priceUsd,car.priceUah,car.description,car.status]);if(!updated.rowCount)throw Error('Власник оголошення не збігається.');
   }
  }
  await client.query('UPDATE business_xml_feeds SET last_attempt_at=NOW(),last_success_at=NOW(),last_error=NULL WHERE id=$1',[feed.id]);await client.query('COMMIT');return {imported:items.length};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
function installDealerXml({app,pool,requireAuth,requireAdmin,databaseReady,editorialOwnerId}){
 async function dealer(userId){const result=await pool.query(`SELECT bp.id FROM business_profiles bp JOIN business_types bt ON bt.id=bp.business_type_id WHERE bp.owner_id=$1 AND (bt.code='car_dealer' OR bp.owner_id=$2) AND NOT bp.is_deleted`,[userId,editorialOwnerId || null]);return result.rowCount>0;}
 app.get('/api/business/xml-feeds',requireAuth,async(req,res)=>{try{await databaseReady;if(!await dealer(req.user.userId))return res.sendStatus(403);const result=await pool.query('SELECT id,url,approved,enabled,last_attempt_at,last_success_at,last_error FROM business_xml_feeds WHERE owner_id=$1 ORDER BY created_at',[req.user.userId]);res.json({ok:true,feeds:result.rows});}catch{res.status(500).json({message:'Не вдалося завантажити фіди.'});}});
 app.post('/api/business/xml-feeds',requireAuth,async(req,res)=>{
  try{await databaseReady;if(!await dealer(req.user.userId))return res.sendStatus(403);let url;try{url=feedUrl(req.body.url).href;}catch(e){return res.status(400).json({message:e.message});}
   const result=await pool.query(`INSERT INTO business_xml_feeds(id,owner_id,url) VALUES($1,$2,$3) ON CONFLICT(owner_id,url) DO UPDATE SET url=EXCLUDED.url RETURNING id,url,approved,enabled`,[crypto.randomUUID(),req.user.userId,url]);res.status(201).json({ok:true,feed:result.rows[0]});
  }catch{res.status(500).json({message:'Не вдалося додати фід.'});}
 });
 app.patch('/api/business/xml-feeds/:id',requireAuth,async(req,res)=>{
  try{await databaseReady;if(!await dealer(req.user.userId))return res.sendStatus(403);if(typeof req.body.enabled!=='boolean')return res.status(400).json({message:'Вкажіть enabled.'});
   const result=await pool.query(`UPDATE business_xml_feeds SET enabled=$3 WHERE id=$1 AND owner_id=$2 AND (approved OR $3=FALSE) RETURNING id,approved,enabled`,[req.params.id,req.user.userId,req.body.enabled]);if(!result.rowCount)return res.status(404).json({message:'Фід не знайдено або джерело ще не погоджено.'});res.json({ok:true,feed:result.rows[0]});
  }catch{res.status(500).json({message:'Не вдалося змінити стан фіду.'});}
 });
 app.patch('/api/admin/xml-feeds/:id/approval',requireAuth,requireAdmin,async(req,res)=>{
  try{await databaseReady;if(typeof req.body.approved!=='boolean')return res.status(400).json({message:'Вкажіть approved.'});
   const evidence=typeof req.body.publicationRightsEvidence==='string'?req.body.publicationRightsEvidence.trim():'';
   if(evidence.length>1000)return res.status(400).json({message:'Підтвердження має містити до 1000 символів.'});
   const result=await pool.query(`UPDATE business_xml_feeds SET approved=$2,enabled=FALSE,
     publication_rights_evidence=CASE WHEN $2 AND owner_id=$3 THEN $4 ELSE NULL END
     WHERE id=$1 AND (NOT $2 OR $3::uuid IS NULL OR owner_id<>$3 OR $4<>'')
     RETURNING id,approved,enabled`,[req.params.id,req.body.approved,editorialOwnerId || null,evidence]);
   if(!result.rowCount)return res.status(409).json({message:'Фід не знайдено або бракує підтвердження прав на публікацію.'});
   res.json({ok:true,feed:result.rows[0]});
  }catch{res.status(500).json({message:'Не вдалося погодити джерело.'});}
 });
 app.get('/api/admin/xml-feeds',requireAuth,requireAdmin,async(req,res)=>{
  try{
   await databaseReady;
   const rows=await pool.query(`SELECT f.id,f.url,f.approved,f.enabled,f.last_attempt_at,f.last_success_at,f.last_error,
      bp.name AS business_name
      FROM business_xml_feeds f
      JOIN business_profiles bp ON bp.owner_id=f.owner_id
      ORDER BY f.created_at DESC LIMIT 100`);
   res.set('Cache-Control','no-store').json({ok:true,feeds:rows.rows});
  }catch(error){console.error('Admin XML feeds:',error);res.status(500).json({ok:false,message:'Не вдалося завантажити XML-джерела.'});}
 });
 const syncInProgress=new Set();
 function safeSyncError(error){
  const message=String(error?.message||'Невідома помилка');
  if(/^(Адреса фіду|Фід не повернув XML|Фід перевищує|Час завантаження|Некоректний XML|Неприпустимий XML|DTD не підтримується|У XML немає|Перевірте|Статус має бути|Некоректний VIN|Профіль дилера недоступний|VIN уже є)/.test(message))return message.slice(0,240);
  return 'Помилка імпорту. Перегляньте журнали сервера.';
 }
 async function runFeed(feedId){
  if(syncInProgress.has(feedId))return {busy:true};
  syncInProgress.add(feedId);
  try{
   const outcome=await synchronize(pool,feedId,undefined,editorialOwnerId||null);
   if(outcome.skipped)return {skipped:true};
   return {imported:outcome.imported};
  }catch(error){
   console.error('XML import failed',feedId,error);
   const message=safeSyncError(error);
   await pool.query('UPDATE business_xml_feeds SET last_attempt_at=NOW(),last_error=$2 WHERE id=$1',[feedId,message]).catch(e=>console.error('XML status update failed',e));
   return {error:message};
  }finally{syncInProgress.delete(feedId);}
 }
 app.post('/api/admin/xml-feeds/:id/sync',requireAuth,requireAdmin,async(req,res)=>{
  try{
   await databaseReady;
   const feed=await pool.query('SELECT id FROM business_xml_feeds WHERE id=$1 AND approved AND enabled',[req.params.id]);
   if(!feed.rowCount)return res.status(409).json({ok:false,message:'Джерело не погоджене або вимкнене.'});
   const outcome=await runFeed(feed.rows[0].id);
   if(outcome.busy)return res.status(409).json({ok:false,message:'Синхронізація вже виконується.'});
   if(outcome.skipped)return res.status(409).json({ok:false,message:'Імпорт пропущено: перевірте статус бізнес-профілю.'});
   if(outcome.error)return res.status(422).json({ok:false,message:outcome.error});
   res.json({ok:true,imported:outcome.imported});
  }catch(error){console.error('Admin XML sync failed',error);res.status(500).json({ok:false,message:'Не вдалося запустити імпорт.'});}
 });
 app.post('/api/business/xml-feeds/:id/sync',requireAuth,async(req,res)=>{
  try{
   await databaseReady;
   if(!await dealer(req.user.userId))return res.sendStatus(403);
   const feed=await pool.query('SELECT id FROM business_xml_feeds WHERE id=$1 AND owner_id=$2 AND approved AND enabled',[req.params.id,req.user.userId]);
   if(!feed.rowCount)return res.status(409).json({ok:false,message:'Джерело не знайдено, не погоджено або вимкнене.'});
   const outcome=await runFeed(feed.rows[0].id);
   if(outcome.busy)return res.status(409).json({ok:false,message:'Синхронізація вже виконується.'});
   if(outcome.skipped)return res.status(409).json({ok:false,message:'Імпорт пропущено: перевірте статус бізнес-профілю та підтвердження контактів.'});
   if(outcome.error)return res.status(422).json({ok:false,message:outcome.error});
   res.json({ok:true,imported:outcome.imported});
  }catch(error){console.error('Manual XML sync failed',error);res.status(500).json({ok:false,message:'Не вдалося запустити синхронізацію.'});}
 });
 let running=false;
 async function tick(){if(running)return;running=true;try{await databaseReady;const feeds=await pool.query(`SELECT id FROM business_xml_feeds WHERE approved AND enabled AND (last_attempt_at IS NULL OR last_attempt_at<NOW()-INTERVAL '6 hours')`);for(const feed of feeds.rows){await runFeed(feed.id);}}catch{console.error('XML synchronization unavailable');}finally{running=false;}}
 const timer=setInterval(tick,60000);timer.unref?.();return {tick,stop:()=>clearInterval(timer)};
}
module.exports={parseFeed,feedUrl,publicIPv4,downloadFeed,synchronize,installDealerXml};
