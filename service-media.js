const crypto = require('crypto');
const sharp = require('sharp');
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
async function prepareMedia(items = []) {
    if (!Array.isArray(items) || items.length > 20) throw new Error('Додайте не більше 20 вкладень.');
    let total = 0;
    const result = [];
    for (const item of items) {
        const match = /^data:(image\/(?:jpeg|png|webp)|video\/(?:mp4|webm|quicktime));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(item.data || ''));
        if (!match) throw new Error('Підтримуються JPG, PNG, WebP, MP4, WebM та MOV.');
        let data = Buffer.from(match[2], 'base64'), mime = match[1];
        const image = mime.startsWith('image/');
        if (!data.length || data.length > (image ? 20 : 50) * 1024 * 1024) throw new Error('Фото — до 20 МБ, відео — до 50 МБ.');
        total += data.length;
        if (total > 100 * 1024 * 1024) throw new Error('Усі вкладення разом — до 100 МБ.');
        if (image) { data = await sharp(data, {limitInputPixels: 40000000}).rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer(); mime = 'image/jpeg'; }
        else if (!(mime === 'video/webm' ? data.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])) : data.subarray(4,8).toString() === 'ftyp')) throw new Error('Некоректний відеофайл.');
        result.push({id:crypto.randomUUID(),mime,data,caption:String(item.caption || '').trim().slice(0,1000)});
    }
    return result;
}
async function saveMedia(client, items, ownerId, requestId = null, orderId = null) {
    for (const item of items) await client.query('INSERT INTO crm_media(id,owner_id,request_id,work_order_id,mime_type,data,caption) VALUES($1,$2,$3,$4,$5,$6,$7)',[item.id,ownerId,requestId,orderId,item.mime,item.data,item.caption]);
}
function installMedia({app,pool,requireAuth,requireCrmAccess,databaseReady}) {
    const access=[requireAuth,requireCrmAccess];
    const orderOwned=async(req,id)=>UUID.test(id) && (await pool.query('SELECT w.id FROM crm_work_orders w JOIN crm_services s ON s.id=w.service_id WHERE w.id=$1 AND s.business_profile_id=$2',[id,req.crm.businessProfileId])).rowCount>0;
    app.get('/api/business/requests/:id/media',...access,async(req,res)=>{
        try { await databaseReady; const r=await pool.query('SELECT id FROM business_service_requests WHERE id=$1 AND owner_id=$2',[UUID.test(req.params.id)?req.params.id:null,req.user.userId]);
            if(!r.rowCount)return res.sendStatus(404);
            res.set('Cache-Control','no-store').json({ok:true,media:(await pool.query('SELECT id,mime_type AS mime,caption FROM crm_media WHERE request_id=$1 AND owner_id=$2 ORDER BY created_at,id',[req.params.id,req.user.userId])).rows});
        }catch(e){console.error(e);res.status(500).json({message:'Не вдалося завантажити вкладення.'});}
    });
    app.get('/api/crm/work-orders/:id/media',...access,async(req,res)=>{
        try {await databaseReady;if(!await orderOwned(req,req.params.id))return res.sendStatus(404);
            res.set('Cache-Control','no-store').json({ok:true,media:(await pool.query('SELECT id,mime_type AS mime,caption FROM crm_media WHERE work_order_id=$1 AND owner_id=$2 ORDER BY created_at,id',[req.params.id,req.user.userId])).rows});
        }catch(e){console.error(e);res.status(500).json({message:'Не вдалося завантажити вкладення.'});}
    });
    app.post('/api/crm/work-orders/:id/media',...access,async(req,res)=>{
        try {await databaseReady;if(!await orderOwned(req,req.params.id))return res.sendStatus(404);
            let items;try{items=await prepareMedia(req.body.attachments);}catch(e){return res.status(400).json({message:e.message});}
            const client=await pool.connect();try{await client.query('BEGIN');await saveMedia(client,items,req.user.userId,null,req.params.id);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
            res.status(201).json({ok:true});
        }catch(e){console.error(e);res.status(500).json({message:'Не вдалося зберегти вкладення.'});}
    });
    app.get('/api/crm/media/:id',...access,async(req,res)=>{
        try {await databaseReady;const result=await pool.query('SELECT mime_type,data FROM crm_media WHERE id=$1 AND owner_id=$2',[UUID.test(req.params.id)?req.params.id:null,req.user.userId]);
            const media=result.rows[0];if(!media)return res.sendStatus(404);
            res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}).type(media.mime_type).send(media.data);
        }catch(e){console.error(e);res.sendStatus(500);}
    });
    app.patch('/api/crm/media/:id',...access,async(req,res)=>{
        try {await databaseReady;if(typeof req.body.caption!=='string'||req.body.caption.length>1000)return res.status(400).json({message:'Коментар — до 1000 символів.'});
            const r=await pool.query('UPDATE crm_media SET caption=$3 WHERE id=$1 AND owner_id=$2',[UUID.test(req.params.id)?req.params.id:null,req.user.userId,req.body.caption.trim()]);
            if(!r.rowCount)return res.sendStatus(404);res.json({ok:true});
        }catch(e){console.error(e);res.sendStatus(500);}
    });
    return databaseReady;
}
module.exports={prepareMedia,saveMedia,installMedia};
