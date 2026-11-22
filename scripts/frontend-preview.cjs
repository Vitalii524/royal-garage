'use strict';
// Isolated UI preview: never loads server.js, database, secrets, mail or payment code.
const express=require('express'),path=require('node:path');
const app=express();
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Robots-Tag','noindex, nofollow');next();});
// Explicit synthetic UI fixture; not a live business or a persisted product.
const product={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',ownerId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',title:'Тестовий товар — лише перевірка UI',sellerName:'Тестовий продавець',description:'Це ізольований тест інтерфейсу, замовлення не обробляються.',category:'Автохімія',availability:'available',price:250,photos:['/images/icon-192.png','/images/icon-512.png'],orderChat:false,orderTelegram:'',orderViber:''};
app.get('/api/catalog/products',(req,res)=>res.json({ok:true,products:[product],hasMore:false}));
app.get('/api/catalog/products/:id',(req,res)=>req.params.id===product.id?res.json({ok:true,product}):res.status(404).json({ok:false,message:'Тестовий товар не знайдено.'}));
// Synthetic public profiles and inventory for checking the shared action row.
const serviceId = 'd2363e3d-4723-4755-9030-594cd3ccd6f0';
const royalId = '32ce413e-9eb6-417a-b99a-77d9ca7c144a';
const profiles = {
    [serviceId]: {
        ownerId: serviceId, name: 'SERVICE HUB LVIV — тестовий профіль', description: 'Тестовий опис',
        businessTypeCode: 'car_service', businessTypeName: 'СТО', city: 'Львів',
        phone: '+380000000000', telegram: 'preview_only', acceptsServiceRequests: true, services: [], portfolio: []
    },
    [product.ownerId]: {
        ownerId: product.ownerId, name: 'Тестовий магазин', businessTypeCode: 'auto_shop',
        businessTypeName: 'Магазин', products: [product], services: [], portfolio: []
    }
};
const editorId = 'b61d05c8-0cab-4432-b36e-267440d87b6a';
const user = { id: editorId, name: 'Редакція Royal Garage', accountType: 'business' };
const testToken = 'isolated-editorial-preview';
const proposals = [];
const feeds = [];
const editorial = { ownerId: editorId, name: user.name, businessTypeName: 'Редакція', businessTypeCode: 'car_service', logo: '/images/royal-garage-logo.png', profileStatus: 'active', subscriptionStatus: 'active', emailVerified: true, phoneVerified: true, acceptsServiceRequests: false, services: [], portfolio: [] };
function qaAuth(req, res, next) {
    if (req.get('Authorization') !== 'Bearer ' + testToken) return res.sendStatus(403);
    next();
}
app.use(express.json({ limit: '20kb' }));
app.get('/qa/editorial', (req, res) => res.type('html').send(`<script>
    localStorage.setItem('royalGarageCurrentUser', ${JSON.stringify(JSON.stringify(user))});
    localStorage.setItem('royalGarageToken', ${JSON.stringify(testToken)});
    location.replace('/business-profile.html?id=${editorId}');
</script>`));
app.get('/api/business/profile', qaAuth, (req, res) => res.json({ profile: editorial }));
app.get('/api/businesses/featured', (req, res) => res.json({ businesses: [{ ownerId: product.ownerId, businessName: 'Тестовий магазин' }] }));
app.get('/api/business/xml-feeds', qaAuth, (req, res) => res.json({ feeds }));
app.post('/api/business/xml-feeds', qaAuth, (req, res) => {
    if (req.body.url !== 'https://example.test/editorial.xml') return res.sendStatus(400);
    if (!feeds.length) feeds.push({ id: 'test-feed', url: req.body.url, approved: false, enabled: false });
    res.status(201).json({ ok: true, feed: feeds[0] });
});
app.get('/api/editorial/proposals', qaAuth, (req, res) => res.json({ proposals }));
app.post('/api/editorial/proposals', qaAuth, (req, res) => {
    const { confirmed, recipientId, recipientName, text } = req.body;
    if (!confirmed || recipientId !== product.ownerId || recipientName !== 'Тестовий магазин' || !text) return res.sendStatus(400);
    if (proposals.length) return res.status(409).json({ message: 'Пропозицію вже надіслано.' });
    proposals.push({ recipientId, recipientName, text, sentAt: new Date().toISOString() });
    res.status(201).json({ ok: true, id: 'synthetic-proposal' });
});
app.get('/api/forum/topics', (req, res) => res.json({ topics: [] }));
app.post('/api/forum/topics', qaAuth, (req, res) => res.status(201).json({ ok: true, topic: { ...req.body, id: 'synthetic-topic' } }));
app.get('/api/business/profiles/:ownerId', (req, res) => {
    const profile = req.params.ownerId === editorId ? editorial : profiles[req.params.ownerId];
    if (!profile) return res.sendStatus(404);
    res.json({ profile });
});
app.get('/api/market/listings', (req, res) => {
    const listings = req.query.ownerId === royalId ? [
        { id: 'preview-car', ownerId: royalId, name: 'Тестовий автомобіль', brand: 'Preview', model: 'Car', year: 2020, priceUsd: 1000 }
    ] : [];
    res.json({ listings });
});
app.use('/api',(req,res)=>res.status(503).json({ok:false,message:'Тестове середовище інтерфейсу: запис даних і платежі вимкнено.'}));
app.use(express.static(path.join(__dirname,'../public'),{index:'index.html',dotfiles:'deny'}));
app.listen(Number(process.env.PORT)||10000,'0.0.0.0');
