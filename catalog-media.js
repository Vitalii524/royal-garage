"use strict";
const crypto = require('crypto');
const sharp = require('sharp');
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function installCatalogMedia({app,pool,requireAuth,databaseReady}) {
 const ready = Promise.resolve(databaseReady).then(()=>pool.query(`CREATE TABLE IF NOT EXISTS service_catalog_images (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id), mime TEXT NOT NULL,
 original BYTEA NOT NULL, preview BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`));
 ready.catch(e=>console.error('Service catalog images:',e));
 app.post('/api/service-catalog/images',requireAuth,async(req,res)=>{
  try {
   await ready;
   const owner = await pool.query('SELECT id FROM business_profiles WHERE owner_id=$1 LIMIT 1',[req.user.userId]);
   if(!owner.rowCount && req.user.userId!=='32ce413e-9eb6-417a-b99a-77d9ca7c144a') return res.status(403).json({message:'Потрібен бізнес-профіль.'});
   const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(req.body.data||''));
   if(!match)return res.status(400).json({message:'Оберіть JPG, PNG або WebP.'});
   const original=Buffer.from(match[2],'base64');
   if(!original.length || original.length>10*1048576)return res.status(413).json({message:'Фото — до 10 МБ.'});
   let preview;
   try {
    const metadata=await sharp(original,{limitInputPixels:50000000}).metadata();
    if(!['jpeg','png','webp'].includes(metadata.format))throw Error('format');
    preview=await sharp(original,{limitInputPixels:50000000}).rotate().resize({width:900,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
   }catch{return res.status(400).json({message:'Не вдалося прочитати зображення. Оберіть JPG, PNG або WebP.'});}
   const id=crypto.randomUUID();
   await pool.query('INSERT INTO service_catalog_images (id,owner_id,mime,original,preview) VALUES ($1,$2,$3,$4,$5)',[id,req.user.userId,match[1],original,preview]);
   return res.status(201).json({url:'/api/service-catalog/images/'+id});
  }catch(e){console.error('Catalog image upload:',e);return res.status(500).json({message:'Не вдалося зберегти фото.'});}
 });
 app.get('/api/service-catalog/images/:id',async(req,res)=>{
  if(!UUID.test(req.params.id))return res.sendStatus(404);
  try {
   await ready;
   const thumb=req.query.preview==='1';
   const result=await pool.query(`SELECT ${thumb?'preview':'original'} AS data, mime FROM service_catalog_images WHERE id=$1`,[req.params.id]);
   if(!result.rowCount)return res.sendStatus(404);
   res.set({'Content-Type':thumb?'image/webp':result.rows[0].mime,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'});
   return res.send(result.rows[0].data);
  }catch(e){console.error('Catalog image read:',e);return res.sendStatus(500);}
 });
 return ready;
}
module.exports={installCatalogMedia};
