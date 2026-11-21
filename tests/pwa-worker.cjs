'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{const handlers={},notifications=[],opened=[];const self={location:{origin:'https://royalgarage.com.ua'},addEventListener:(name,handler)=>handlers[name]=handler,registration:{showNotification:async(title,options)=>notifications.push({title,...options})}};vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),{self,URL,clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)}});
 assert.equal(handlers.fetch,undefined,'Worker must not cache private requests');
 for(const url of ['/forum.html','https://attacker.example/','//attacker.example/']){let pending;handlers.push({data:{json:()=>({title:'QA',body:'Synthetic',url})},waitUntil:value=>pending=value});await pending;assert.equal(notifications.at(-1).data.url,url==='/forum.html'?url:'/forum.html');}
 let pending;handlers.notificationclick({notification:{close(){},data:{url:'https://attacker.example/'}},waitUntil:value=>pending=value});await pending;assert.equal(opened[0],'https://royalgarage.com.ua/notifications.html');
 console.log('PASS service worker: no private fetch cache, push external URL rejected, notification click constrained to site origin');})().catch(e=>{console.error(e);process.exitCode=1;});
