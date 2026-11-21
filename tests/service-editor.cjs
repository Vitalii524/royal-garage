const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
(async()=>{
 const {window,document}=parseHTML(fs.readFileSync('public/royal-auto-admin.html','utf8'));
 const alerts=[],writes=[];
 const context={window,document,console,Intl,URLSearchParams,localStorage:{getItem:k=>k==='royalGarageToken'?'test':null},alert:x=>alerts.push(x),confirm:()=>true,
 fetch:async(url,options={})=>{if(options.body)writes.push({url,options,body:JSON.parse(options.body)});return {ok:true,json:async()=>({products:[],sections:[]})};}};
 vm.runInNewContext(fs.readFileSync('public/js/service-gallery.js','utf8'),context);
 document.getElementById('royalAutoProductForm').scrollIntoView=()=>{};
 document.getElementById('royalAutoProductForm').reset=()=>{};
 const section=document.getElementById('royalAutoProductSection');Object.defineProperty(section,'value',{writable:true,value:'category'});
 vm.runInNewContext(fs.readFileSync('public/js/royal-auto-admin.js','utf8')+'\nwindow.edit=editRoyalAutoProduct;',context);
 const product={id:'existing-service',sectionId:'category',name:'Перетяжка дверних карт',description:'Original description',priceUah:3500,photos:['data:image/jpeg;base64,eA==','data:image/jpeg;base64,eQ==']};
 vm.runInNewContext('royalAutoProducts = '+JSON.stringify([product])+';renderAdminProducts();',context);
 assert.equal(document.querySelectorAll('.rg-service-card').length,1);
 document.querySelector('.rg-service-next').click();assert.equal(document.querySelector('.rg-service-counter').textContent,'2 / 2');
 assert.match(document.querySelector('.rg-service-info strong').textContent,/3/);
 window.edit(product);assert.equal(document.querySelectorAll('#royalAutoPhotoPreview img').length,2);
 const form=document.getElementById('royalAutoProductForm');
 form.dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,10));
 assert.equal(writes[0].options.method,'PATCH');assert.deepEqual(writes[0].body.photos,product.photos);assert.equal(writes[0].body.description,product.description);
 window.edit(product);document.querySelector('#royalAutoPhotoPreview button').click();
 assert.equal(document.querySelectorAll('#royalAutoPhotoPreview img').length,1);
 form.dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,10));assert.deepEqual(writes[1].body.photos,[product.photos[1]]);
 assert.equal(document.getElementById('royalAutoProductName').hasAttribute('required'),true);
 assert.equal(document.getElementById('royalAutoProductPhotos').getAttribute('accept').includes('video/mp4'),true);
 console.log('PASS: existing two-photo edit/save retains both, single-photo removal retains other, PATCH preserves id/description, required title, video picker');
})().catch(e=>{console.error(e);process.exitCode=1;});
