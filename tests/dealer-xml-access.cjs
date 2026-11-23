'use strict';
const assert=require('node:assert/strict');
const {installDealerXml}=require('../dealer-xml');
(async()=>{
 const routes=new Map();let queries=[],dealerAllowed=true;
 const app={get:(p,...h)=>routes.set('GET '+p,h),post:(p,...h)=>routes.set('POST '+p,h),patch:(p,...h)=>routes.set('PATCH '+p,h)};
 const auth=()=>{},admin=()=>{};
 const pool={query:async(sql,params=[])=>{queries.push({sql,params});if(sql.includes('SELECT bp.id'))return {rowCount:dealerAllowed?1:0,rows:dealerAllowed?[{id:'dealer'}]:[]};if(sql.includes('INSERT INTO business_xml_feeds'))return {rowCount:1,rows:[{approved:false,enabled:false}]};return {rowCount:0,rows:[]};}};
 const worker=installDealerXml({app,pool,requireAuth:auth,requireAdmin:admin,databaseReady:Promise.resolve()});
 await new Promise(resolve=>setImmediate(resolve));worker.stop();queries=[];
 async function invoke(key,body={},user='owner-a'){let status=200,data;const response={status(n){status=n;return this;},json(value){data=value;return this;},sendStatus(n){status=n;return this;}};await routes.get(key).at(-1)({body,user:{userId:user},params:{id:'feed-id'}},response);return {status,data};}
 for(const handlers of routes.values())assert.equal(handlers[0],auth);
 assert.equal(routes.get('PATCH /api/admin/xml-feeds/:id/approval')[1],admin);
 let result=await invoke('POST /api/business/xml-feeds',{url:'https://dealer.example/feed.xml'});assert.equal(result.status,201);assert.equal(result.data.feed.approved,false);assert.equal(result.data.feed.enabled,false);
 result=await invoke('PATCH /api/business/xml-feeds/:id',{enabled:true},'foreign-owner');assert.equal(result.status,404);const update=queries.find(q=>q.sql.includes('UPDATE business_xml_feeds SET enabled'));assert.match(update.sql,/owner_id=\$2/);assert.equal(update.params[1],'foreign-owner');assert.match(update.sql,/approved OR \$3=FALSE/);
 dealerAllowed=false;queries=[];result=await invoke('POST /api/business/xml-feeds',{url:'https://dealer.example/feed.xml'});assert.equal(result.status,403);assert.equal(queries.some(q=>q.sql.includes('INSERT')),false);
 result=await invoke('PATCH /api/business/xml-feeds/:id',{enabled:true});assert.equal(result.status,403);
 dealerAllowed=true;result=await invoke('POST /api/business/xml-feeds',{url:'https://127.0.0.1/feed'});assert.equal(result.status,400);
 console.log('PASS XML route authentication, admin approval middleware, dealer-only creation, inactive defaults, owner scope and approval gate');
})().catch(error=>{console.error(error);process.exitCode=1;});
