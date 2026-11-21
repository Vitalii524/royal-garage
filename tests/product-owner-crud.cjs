const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
if(!process.env.RG_QA_BRIDGE)throw Error('Provide isolated PostgreSQL bridge through RG_QA_BRIDGE. Never target production.');
const paths={},calls=[];
const pool={query:async(sql,params)=>{const r=spawnSync('python',[process.env.RG_QA_BRIDGE],{input:JSON.stringify({sql,params}),encoding:'utf8'});assert.equal(r.status,0,'isolated SQL statement failed');return JSON.parse(r.stdout);}};
const source=fs.readFileSync('server.js','utf8');const start=source.indexOf('app.post(\n    "/api/business/products"');const end=source.indexOf('app.delete(\n    "/api/business/products/',start);
vm.runInNewContext(source.slice(start,end),{app:{post:(p,...h)=>paths.post=h.at(-1),patch:(p,...h)=>paths.patch=h.at(-1)},pool,crypto:require('node:crypto'),require:p=>require('../'+p),getOwnedBusinessId:async()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',requireAuth(){},console});
function response(){return {code:200,status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
(async()=>{
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const body={title:'Автотканина QA',description:'Original QA description',price:250,photos:['/images/icon-192.png','/images/icon-512.png'],category:'Автотканина',availability:'order',orderTelegram:'RoyalShop',orderViber:'+380670000001',orderChat:true};
let res=response();await paths.post({user:{userId:owner},body},res);assert.equal(res.code,201);const id=res.body.product.id;
const saved=await pool.query('SELECT category,availability,order_telegram,order_viber,order_chat,photos FROM business_products WHERE id=$1',[id]);assert.equal(saved.rows[0].category,body.category);assert.deepEqual(saved.rows[0].photos,body.photos);
res=response();await paths.patch({user:{userId:owner},params:{productId:id},body:{...body,price:275,availability:'available'}},res);assert.equal(res.code,200);
res=response();await paths.patch({user:{userId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},params:{productId:id},body:{...body,title:'Hijack'}},res);assert.equal(res.code,404);
const final=await pool.query('SELECT title,price,description,photos FROM business_products WHERE id=$1',[id]);assert.equal(final.rows[0].title,body.title);assert.equal(Number(final.rows[0].price),275);assert.equal(final.rows[0].description,body.description);assert.deepEqual(final.rows[0].photos,body.photos);
console.log('PASS real PostgreSQL: existing POST/PATCH save catalog fields and both photos; foreign owner denied; originals/description preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
