'use strict';
// Isolated UI preview: never loads server.js, database, secrets, mail or payment code.
const express=require('express'),path=require('node:path');
const app=express();
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Robots-Tag','noindex, nofollow');next();});
app.use('/api',(req,res)=>res.status(503).json({ok:false,message:'Тестове середовище інтерфейсу: запис даних і платежі вимкнено.'}));
app.use(express.static(path.join(__dirname,'../public'),{index:'index.html',dotfiles:'deny'}));
app.listen(Number(process.env.PORT)||10000,'0.0.0.0');
