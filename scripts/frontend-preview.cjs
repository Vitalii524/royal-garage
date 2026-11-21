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
app.use('/api',(req,res)=>res.status(503).json({ok:false,message:'Тестове середовище інтерфейсу: запис даних і платежі вимкнено.'}));
app.use(express.static(path.join(__dirname,'../public'),{index:'index.html',dotfiles:'deny'}));
app.listen(Number(process.env.PORT)||10000,'0.0.0.0');
