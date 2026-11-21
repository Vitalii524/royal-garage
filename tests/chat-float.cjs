const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const source=fs.readFileSync('public/js/handmade.js','utf8');
async function run(owner,messages){
 const {window,document}=parseHTML(fs.readFileSync('public/handmade.html','utf8'));
 window.setInterval=()=>1;
 const ctx={window,document,console,localStorage:{getItem:()=> 'token'},getRoyalAutoCurrentUser:()=>({id:owner?'owner':'client'}),ROYAL_AUTO_OWNER_ID:'owner',fetch:async()=>({ok:true,json:async()=>({messages})})};
 const start=source.indexOf('// Royal Auto uses');const end=source.indexOf("window.addEventListener('resize'",start);
 vm.runInNewContext(source.slice(start,end),ctx);await new Promise(r=>setImmediate(r));
 const link=document.getElementById('royalAutoChatFloat');
 assert.equal(link.querySelector('span').textContent,'✉️');
 assert.equal(link.href,owner?'profile.html?section=chats':'chat.html?withUserId=owner');
 return link;
}
(async()=>{
 const owner=await run(true,[{receiverId:'owner',senderId:'a'},{receiverId:'owner',readAt:'today'},{receiverId:'owner',deletedAt:'today'},{receiverId:'other'}]);
 assert.equal(owner.querySelector('.royal-auto-chat-badge').textContent,'1');
 assert.equal(owner.querySelector('.royal-auto-chat-badge').hidden,false);
 const client=await run(false,[{receiverId:'client',senderId:'unrelated'},{receiverId:'client',senderId:'owner'}]);
 assert.equal(client.querySelector('.royal-auto-chat-badge').textContent,'1');
 assert.equal((await run(true,[])).querySelector('.royal-auto-chat-badge').hidden,true);
 const css=fs.readFileSync('public/css/handmade.css','utf8');assert.match(css,/width:48px; height:48px/);assert.match(css,/safe-area-inset-bottom/);
 console.log('PASS icon and same destinations, owner/client unread scoping, zero badge hidden, fixed 48px and safe-area spacing');
})().catch(e=>{console.error(e);process.exitCode=1;});
