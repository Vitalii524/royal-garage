const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
async function run(search){
 const {window,document}=parseHTML(fs.readFileSync('public/chat.html','utf8'));
 const calls=[];window.location={search};window.setInterval=()=>1;window.clearInterval=()=>{};
 document.getElementById('chatMessages').scrollTo=()=>{};
 const ctx={window,document,console,URLSearchParams,getCurrentUser:()=>({id:'client'}),localStorage:{getItem:()=> 'test'},requestAnimationFrame:f=>f(),setTimeout,clearTimeout,
 fetch:async(url,opts={})=>{calls.push({url,opts});return {ok:true,json:async()=>url.startsWith('/api/market/')?{listing:{id:'listing',ownerId:'business',name:'Auto'}}:{messages:[]}};}};
 vm.runInNewContext(fs.readFileSync('public/js/chat.js','utf8'),ctx);await new Promise(r=>setTimeout(r,30));
 assert.ok(calls.some(c=>c.url.startsWith('/api/chat/messages?')),'conversation must load');
 const read=calls.find(c=>c.url==='/api/chat/messages/read');assert.ok(read,'incoming messages must be marked read');
 return JSON.parse(read.opts.body);
}
(async()=>{
 const direct=await run('?withUserId=business');assert.equal(direct.listingId,null);assert.equal(direct.partnerId,'business');
 const listing=await run('?listingId=listing');assert.equal(listing.listingId,'listing');
 console.log('PASS direct business chat loads and marks read without listing; listing chat retained');
})().catch(e=>{console.error(e);process.exitCode=1;});
