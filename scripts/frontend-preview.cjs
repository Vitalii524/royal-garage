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
app.get('/api/business/profiles/:ownerId', (req, res) => {
    const profile = profiles[req.params.ownerId];
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
