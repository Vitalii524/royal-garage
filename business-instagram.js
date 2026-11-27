"use strict";
const crypto = require("node:crypto");
const ROOT = "/api/business/instagram";
const COOKIE = "rg_business_instagram";
const STATE = "rg_instagram_state";
const PENDING = "rg_instagram_pending";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,children{id,media_type,media_url}";
const opts = { httpOnly:true, secure:true, sameSite:"lax", path:ROOT };
function key(secret) {
    if (!secret) throw Error("Instagram connection unavailable");
    return crypto.createHmac("sha256", secret).update("royal-garage-instagram-cookie-v1").digest();
}
function seal(value, secret) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key(secret), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
    return Buffer.concat([iv,cipher.getAuthTag(),data]).toString("base64url");
}
function open(value, secret) {
    try {
        if (typeof value !== "string" || value.length > 3800) return null;
        const raw = Buffer.from(value,"base64url");
        if(raw.length < 29) return null;
        const cipher = crypto.createDecipheriv("aes-256-gcm",key(secret),raw.subarray(0,12));
        cipher.setAuthTag(raw.subarray(12,28));
        const data = JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]).toString("utf8"));
        return data.exp > Date.now() ? data : null;
    } catch { return null; }
}
function cookie(req,name) {
    const part = String(req.headers.cookie || "").split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));
    return part?.slice(name.length+1);
}
function topicId(owner, account, id) {
    const h=crypto.createHash("sha256").update("business-instagram:"+owner+":"+account+":"+id).digest("hex");
    return h.slice(0,8)+"-"+h.slice(8,12)+"-4"+h.slice(13,16)+"-8"+h.slice(17,20)+"-"+h.slice(20,32);
}
async function jsonRequest(url, init={}) {
    const response=await fetch(url,{...init,redirect:"error",signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok||data.error) throw Error("Instagram відхилив запит (код "+(Number(data.error?.code)||response.status)+").");
    return data;
}
async function graph(path, token, fields, after) {
    const url=new URL("https://graph.facebook.com/v24.0/"+path);
    url.searchParams.set("fields",fields);
    if(after)url.searchParams.set("after",after);
    if(path.endsWith("/media"))url.searchParams.set("limit","25");
    return jsonRequest(url,{headers:{Authorization:"Bearer "+token}});
}
function installBusinessInstagram({app,pool,requireAuth,publicOrigin,normalizeAttachment}) {
    const config=()=>({id:process.env.META_APP_ID||"1830896391125670",configId:process.env.META_LOGIN_CONFIG_ID||"2712311745891050",secret:process.env.META_APP_SECRET,key:process.env.JWT_SECRET});
    const configured=()=>Boolean(config().id&&config().configId&&config().secret&&config().key);
    const redirectUri=publicOrigin+ROOT+"/callback";
    const returnPage=publicOrigin+"/business-profile.html";
    async function exists(owner) {
        const result=await pool.query("SELECT bp.id FROM business_profiles bp JOIN users u ON u.id=bp.owner_id WHERE bp.owner_id=$1 AND NOT bp.is_deleted AND NOT u.account_disabled AND u.account_type='business'",[owner]);
        return result.rowCount>0;
    }
    async function business(req,res,next) {
        res.set("Cache-Control","no-store");
        try {
            if(!await exists(req.user.userId)) return res.status(403).json({message:"Доступ лише власнику бізнес-профілю."});
            return next();
        } catch { return res.status(503).json({message:"Не вдалося перевірити бізнес-профіль."}); }
    }
    function connection(req) {
        const c=open(cookie(req,COOKIE),config().key);
        return c?.kind==="connection" && c.provider==="unified" && c.owner===req.user.userId ? c : null;
    }
    function pending(req) {
        const c=open(cookie(req,PENDING),config().key);
        return c?.kind==="pending"&&c.owner===req.user.userId?c:null;
    }
    async function assigned(token) {
        const accounts=new Map();let after;
        for(let page=0;page<20;page++){
            const data=await graph("me/assigned_instagram_accounts",token,"id,username",after);
            if(!Array.isArray(data.data))throw Error("Не вдалося отримати список Instagram-акаунтів.");
            for(const a of data.data){
                const id=String(a.id||"");
                if(/^\d{5,30}$/.test(id)&&a.username)accounts.set(id,{id,username:String(a.username).slice(0,100)});
            }
            if(!data.paging?.next)return [...accounts.values()];
            const next=data.paging.cursors?.after;
            if(!next||next===after)throw Error("Не вдалося отримати повний список акаунтів.");
            after=next;
        }
        throw Error("Забагато підключених Instagram-акаунтів.");
    }
    function saveConnection(res,c,account) {
        res.cookie(COOKIE,seal({kind:"connection",provider:"unified",owner:c.owner,account:account.id,username:account.username,token:c.token,exp:c.tokenExp},config().key),{...opts,maxAge:c.tokenExp-Date.now()});
        res.clearCookie(PENDING,opts);
    }
    function connected(req,res,next) {
        const c=connection(req);
        if(!c) return res.status(401).json({message:"Спочатку підключіть Instagram."});
        req.instagram=c;
        next();
    }
    app.get(ROOT+"/status",requireAuth,business,(req,res)=>{
        const c=connection(req);
        res.json({configured:configured(),connected:Boolean(c),username:c?.username||null,pending:Boolean(pending(req))});
    });
    app.post(ROOT+"/connect",requireAuth,business,(req,res)=>{
        if(!configured()) return res.status(503).json({message:"Підключення Instagram очікує налаштування застосунку Meta адміністратором."});
        const nonce=crypto.randomBytes(32).toString("hex"), exp=Date.now()+10*60*1000;
        res.cookie(STATE,seal({kind:"state",owner:req.user.userId,nonce,exp},config().key),{...opts,maxAge:10*60*1000});
        const url=new URL("https://www.facebook.com/dialog/oauth");
        url.search=new URLSearchParams({client_id:config().id,config_id:config().configId,display:"popup",override_default_response_type:"true",redirect_uri:redirectUri,response_type:"code",state:nonce,prompt:"login"}).toString();
        res.json({url:url.toString()});
    });
    app.get(ROOT+"/callback",async(req,res)=>{
        res.set("Cache-Control","no-store");
        res.set("Referrer-Policy","no-referrer");
        const s=open(cookie(req,STATE),config().key);
        res.clearCookie(STATE,opts);
        const fail=()=>res.redirect(returnPage+"?instagram=error");
        if(!configured()||!s||s.kind!=="state"||typeof req.query.state!=="string"||req.query.state!==s.nonce||typeof req.query.code!=="string"||req.query.code.length>4000)return fail();
        try {
            if(!await exists(s.owner))return fail();
            const url=new URL("https://graph.facebook.com/v24.0/oauth/access_token");
            url.search=new URLSearchParams({client_id:config().id,client_secret:config().secret,redirect_uri:redirectUri,code:req.query.code}).toString();
            const codeData=await jsonRequest(url);
            const token=codeData.access_token;
            if(typeof token!=="string"||token.length>2000)return fail();
            // The integration may issue a non-expiring system-user token. Limit the local session regardless.
            const seconds=Number(codeData.expires_in);
            const ttl=Math.min(60*24*60*60,seconds>0?seconds:60*24*60*60)*1000;
            const accounts=await assigned(token);
            if(!accounts.length)return res.redirect(returnPage+"?instagram=no_accounts");
            const c={owner:s.owner,token,tokenExp:Date.now()+ttl};
            if(accounts.length===1){saveConnection(res,c,accounts[0]);return res.redirect(returnPage+"?instagram=connected");}
            res.cookie(PENDING,seal({kind:"pending",...c,exp:Date.now()+10*60*1000},config().key),{...opts,maxAge:10*60*1000});
            return res.redirect(returnPage+"?instagram=choose");
        } catch { return fail(); }
    });
    app.get(ROOT+"/accounts",requireAuth,business,async(req,res)=>{
        const c=pending(req);if(!c)return res.status(401).json({message:"Підключіть Instagram повторно."});
        try{res.json({accounts:await assigned(c.token)});}catch(e){res.status(502).json({message:e.message});}
    });
    app.post(ROOT+"/select",requireAuth,business,async(req,res)=>{
        const c=pending(req),id=String(req.body?.id||"");
        if(!c||!/^\d{5,30}$/.test(id))return res.status(400).json({message:"Оберіть підключений Instagram-акаунт."});
        try{
            const account=(await assigned(c.token)).find(a=>a.id===id);
            if(!account)return res.status(403).json({message:"Немає дозволу на цей Instagram-акаунт."});
            saveConnection(res,c,account);res.json({ok:true});
        }catch(e){res.status(502).json({message:e.message});}
    });
    app.post(ROOT+"/disconnect",requireAuth,business,(req,res)=>{
        res.clearCookie(COOKIE,opts);res.clearCookie(STATE,opts);res.clearCookie(PENDING,opts);res.json({ok:true});
    });
    app.get(ROOT+"/media",requireAuth,business,connected,async(req,res)=>{
        try {
            const c=req.instagram;
            const data=await graph(c.account+"/media",c.token,FIELDS,String(req.query.after||"").slice(0,1000));
            const items=(data.data||[]).filter(x=>/^\d{5,30}$/.test(String(x.id))&&["IMAGE","VIDEO","CAROUSEL_ALBUM"].includes(x.media_type));
            const existing=await pool.query("SELECT id FROM forum_topics WHERE id=ANY($1::uuid[])",[items.map(x=>topicId(c.owner,c.account,x.id))]);
            const seen=new Set(existing.rows.map(x=>x.id));
            res.json({items:items.map(x=>({id:x.id,caption:x.caption||"",type:x.media_type,preview:x.thumbnail_url||x.media_url||x.children?.data?.[0]?.media_url,imported:seen.has(topicId(c.owner,c.account,x.id)),proof:seal({kind:"media",owner:c.owner,account:c.account,id:x.id,exp:Date.now()+30*60*1000},config().key)})),after:data.paging?.next?data.paging.cursors?.after:null});
        } catch(e){res.status(502).json({message:e.message});}
    });
    app.post(ROOT+"/media",requireAuth,business,connected,async(req,res)=>{
        const c=req.instagram, id=String(req.body?.id||"");
        const proof=open(req.body?.proof,config().key);
        if(!/^\d{5,30}$/.test(id)||proof?.kind!=="media"||proof.owner!==c.owner||proof.account!==c.account||String(proof.id)!==id)return res.status(400).json({message:"Виберіть публікацію зі свого Instagram повторно."});
        let client;
        try {
            const tid=topicId(c.owner,c.account,id);
            const media=await graph(id,c.token,FIELDS);
            if(String(media.id)!==id)throw Error("Не вдалося перевірити публікацію.");
            const sources=media.media_type==="CAROUSEL_ALBUM"?media.children?.data:[media];
            if(!sources?.length||sources.length>20)throw Error("Непідтримувана карусель.");
            client=await pool.connect();await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[tid]);
            if((await client.query("SELECT id FROM forum_topics WHERE id=$1",[tid])).rowCount){await client.query("ROLLBACK");return res.json({imported:false,message:"Вже імпортовано."});}
            const items=[];let total=0;
            for(const item of sources){
                const url=new URL(item.media_url);
                if(url.protocol!=="https:"||url.username||url.password||url.port||!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname))throw Error("Непідтримуване джерело медіа.");
                const video=item.media_type==="VIDEO", limit=video?20*1024*1024:5*1024*1024;
                if(!video&&item.media_type!=="IMAGE")throw Error("Непідтримуваний тип медіа.");
                const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(30000)});
                if(!response.ok)throw Error("Не вдалося завантажити медіа.");
                const mime=String(response.headers.get("content-type")||"").split(";")[0];
                if(!(video?mime==="video/mp4":/^image\/(jpeg|png|webp)$/.test(mime)))throw Error("Непідтримуваний формат медіа.");
                const chunks=[];let size=0;
                for await(const chunk of response.body){size+=chunk.length;total+=chunk.length;if(size>limit||total>40*1024*1024)throw Error("Медіафайл надто великий.");chunks.push(Buffer.from(chunk));}
                if(!size)throw Error("Порожній медіафайл.");
                const buffer=Buffer.concat(chunks),name="instagram-"+item.id;let data;
                if(video){const vid=crypto.randomUUID();await client.query("INSERT INTO uploaded_videos (id,owner_id,mime_type,data,name) VALUES ($1,$2,$3,$4,$5)",[vid,c.owner,mime,buffer,name]);data="/api/media/videos/"+vid;}
                else data="data:"+mime+";base64,"+buffer.toString("base64");
                items.push({type:video?"video":"image",mimeType:mime,name,data,originalSize:size});
            }
            const attachment=normalizeAttachment({...items[0],items}),content=String(media.caption||"Публікація Instagram").slice(0,2000);
            await client.query("INSERT INTO forum_topics (id,user_id,title,category,content,attachment) VALUES ($1,$2,$3,$4,$5,$6)",[tid,c.owner,content.slice(0,80),"Загальне",content,attachment]);
            await client.query("COMMIT");res.json({imported:true});
        }catch(e){if(client)await client.query("ROLLBACK").catch(()=>{});res.status(502).json({message:e.message});}finally{client?.release();}
    });
}
module.exports={installBusinessInstagram,seal,open,topicId};
