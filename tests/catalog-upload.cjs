const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');const {window,document}=parseHTML('<html><body></body></html>');
let last;
class Reader{readAsDataURL(){this.result='data:image/jpeg;base64,eA==';queueMicrotask(()=>this.onload());}}
class XHR{constructor(){this.upload={};last=this;}open(method,url){this.method=method;this.url=url;}setRequestHeader(){}send(){} }
const context={window,document,FileReader:Reader,XMLHttpRequest:XHR,localStorage:{getItem:()=> 'qa'},setTimeout,clearTimeout,URL};
vm.runInNewContext(fs.readFileSync('public/js/service-gallery.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('public/js/product-catalog.js','utf8'),{...context,location:{href:'https://example.invalid/product.html?id=qa'}});
(async()=>{
 const percentages=[];let done=false;
 const pending=window.RGServiceGallery.upload({type:'image/jpeg',size:100,name:'qa.jpg'},x=>percentages.push(x)).then(x=>{done=true;return x;});
 await new Promise(r=>setImmediate(r));
 last.upload.onprogress({lengthComputable:true,loaded:50,total:100});last.upload.onprogress({lengthComputable:true,loaded:100,total:100});
 assert.deepEqual(percentages,[50,100]);assert.equal(done,false,'100% sent is not server success');
 last.status=201;last.responseText=JSON.stringify({url:'/api/service-catalog/images/qa'});last.onload();assert.equal(await pending,'/api/service-catalog/images/qa');
 const failed=window.RGServiceGallery.upload({type:'image/png',size:100,name:'qa.png'},()=>{});await new Promise(r=>setImmediate(r));last.onerror();await assert.rejects(failed,/Помилка мережі/);
 const root=document.createElement('div');window.RGProductCatalog.orders({title:'QA',availability:'available',ownerId:'owner',orderChat:true,orderTelegram:'RoyalShop',orderViber:'+380670000001'},root);
 assert.equal(root.querySelectorAll('a').length,3);assert.match(root.querySelectorAll('a')[1].href,/^viber:\/\/chat\?number=/);
 window.RGProductCatalog.orders({availability:'unavailable'},root);assert.equal(root.querySelectorAll('a').length,0);
 console.log('PASS actual XHR byte percentages, server confirmation required, network failure reported, 3 order methods, unavailable item cannot order');
})().catch(e=>{console.error(e);process.exitCode=1;});
