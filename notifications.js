// Account-scoped notification centre. No credentials are stored in this module.
const crypto = require('crypto');
const SOURCES = ['forum', 'market', 'service', 'clubs', 'profile'];
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function validSubscription(sub) {
    try {
        const url=new URL(sub?.endpoint);
        const host=url.hostname;
        const allowed=host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||host==='web.push.apple.com'||host.endsWith('.notify.windows.com');
        return allowed&&url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&sub.endpoint.length<=2048&&
            /^[A-Za-z0-9_-]+={0,2}$/.test(sub.keys?.p256dh||'')&&Buffer.from(sub.keys.p256dh,'base64url').length===65&&
            /^[A-Za-z0-9_-]+={0,2}$/.test(sub.keys?.auth||'')&&Buffer.from(sub.keys.auth,'base64url').length===16;
    } catch { return false; }
}
function safeUrl(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/notifications.html';
    try { const url = new URL(value, 'https://royalgarage.com.ua'); return url.origin === 'https://royalgarage.com.ua' ? url.pathname + url.search + url.hash : '/notifications.html'; }
    catch { return '/notifications.html'; }
}
function installNotifications({app, pool, requireAuth, databaseReady, sendPush}) {
    async function emit({userId, actorId=null, kind, topicId=null, source='forum', message, url, eventKey}) {
        if (!userId || String(userId) === String(actorId)) return;
        try {
            await databaseReady;
            const id = crypto.randomUUID();
            const target = safeUrl(url || (topicId ? '/forum.html?topicId='+encodeURIComponent(topicId) : '/notifications.html'));
            const result = await pool.query(`INSERT INTO forum_notifications(id,user_id,actor_id,kind,topic_id,message,source,url,event_key)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(user_id,event_key) DO NOTHING RETURNING id`,
                [id,userId,actorId,kind,topicId,String(message).slice(0,300),SOURCES.includes(source)?source:'forum',target,eventKey||null]);
            if (result.rowCount) {
                const prefs=await pool.query('SELECT push_enabled FROM notification_preferences WHERE user_id=$1',[userId]);
                if (prefs.rows[0]?.push_enabled !== false) Promise.resolve(sendPush(userId,message,topicId,{url:target,id})).catch(error=>console.warn('Push delivery:',error.message));
            }
        } catch(error) { console.error('Notification delivery failed:',error.message); }
    }
    async function topicPublished(topic) {
        try {
            await databaseReady;
            const clubId=String(topic.category||'').startsWith('club:') ? topic.category.slice(5) : null;
            const recipients=await pool.query(`SELECT follower_id AS id FROM forum_follows WHERE author_id=$1
                UNION SELECT user_id AS id FROM community_club_members WHERE club_id=$2::uuid`,[topic.user_id,clubId]);
            await Promise.allSettled(recipients.rows.map(row=>emit({userId:row.id,actorId:topic.user_id,kind:'new_post',topicId:topic.id,
                source:clubId?'clubs':'forum',message:clubId?'Новий допис у вашому клубі':'Новий допис автора, на якого ви підписані',eventKey:'topic:'+topic.id})));
        } catch(error) { console.error('Topic notification failed:',error.message); }
    }
    async function replyPublished(reply) {
        try {
            await databaseReady;
            const recipients=await pool.query(`SELECT user_id FROM forum_topics WHERE id=$1 UNION SELECT user_id FROM forum_replies WHERE topic_id=$1`,[reply.topic_id]);
            await Promise.allSettled(recipients.rows.map(row=>emit({userId:row.user_id,actorId:reply.user_id,kind:'reply',topicId:reply.topic_id,
                message:'Нова відповідь у вашому обговоренні',eventKey:'reply:'+reply.id})));
        } catch(error) { console.error('Reply notification failed:',error.message); }
    }
    const route = handler => async(req,res) => {
        res.set('Cache-Control','no-store');
        try { await databaseReady; await handler(req,res); }
        catch(error) { console.error('Notification API:',error.message); res.status(503).json({message:'Сповіщення тимчасово недоступні. Спробуйте ще раз.'}); }
    };
    app.get('/api/notifications',requireAuth,route(async(req,res)=>{
        const source=SOURCES.includes(req.query.source)?req.query.source:null;
        const page=Math.min(10000,Math.max(0,Number.parseInt(req.query.page,10)||0));
        const [items,count,prefs]=await Promise.all([
            pool.query(`SELECT n.id,n.kind,n.source,n.url,n.message,n.is_read,n.created_at,u.name AS actor_name
                FROM forum_notifications n LEFT JOIN users u ON u.id=n.actor_id
                WHERE n.user_id=$1 AND ($2::text IS NULL OR n.source=$2) ORDER BY n.created_at DESC,n.id DESC LIMIT 31 OFFSET $3`,[req.user.userId,source,page*30]),
            pool.query('SELECT COUNT(*)::int AS count FROM forum_notifications WHERE user_id=$1 AND NOT is_read',[req.user.userId]),
            pool.query('SELECT push_enabled FROM notification_preferences WHERE user_id=$1',[req.user.userId])]);
        res.json({notifications:items.rows.slice(0,30).map(n=>({...n,url:safeUrl(n.url)})),unread:count.rows[0].count,hasMore:items.rows.length>30,pushEnabled:prefs.rows[0]?.push_enabled!==false});
    }));
    app.post('/api/notifications/read',requireAuth,route(async(req,res)=>{
        const ids=req.body?.ids;
        if(!Array.isArray(ids)||ids.length>100||ids.some(id=>!UUID.test(id))) return res.status(400).json({message:'Некоректний список сповіщень.'});
        if (ids.length) await pool.query('UPDATE forum_notifications SET is_read=TRUE WHERE user_id=$1 AND id IN ('+ids.map((_,i)=>'$'+(i+2)).join(',')+')',[req.user.userId,...ids]);
        res.json({ok:true});
    }));
    app.post('/api/notifications/read-all',requireAuth,route(async(req,res)=>{
        const before=new Date(req.body?.before);
        if(!Number.isFinite(before.getTime()))return res.status(400).json({message:'Некоректний час.'});
        await pool.query('UPDATE forum_notifications SET is_read=TRUE WHERE user_id=$1 AND created_at<=$2',[req.user.userId,before]);
        res.json({ok:true});
    }));
    app.put('/api/notifications/preferences',requireAuth,route(async(req,res)=>{
        if(typeof req.body?.pushEnabled!=='boolean')return res.status(400).json({message:'Некоректне налаштування.'});
        await pool.query(`INSERT INTO notification_preferences(user_id,push_enabled) VALUES($1,$2)
            ON CONFLICT(user_id) DO UPDATE SET push_enabled=EXCLUDED.push_enabled`,[req.user.userId,req.body.pushEnabled]);
        res.json({ok:true});
    }));
    return {emit,topicPublished,replyPublished,ready: databaseReady};
}
module.exports={installNotifications,safeUrl,validSubscription};
