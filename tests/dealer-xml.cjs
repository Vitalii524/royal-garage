const assert=require('node:assert/strict');const {parseFeed,feedUrl,publicIPv4,synchronize}=require('../dealer-xml');
const vehicle=(id,extra='')=>`<vehicle id="${id}"><brand>Opel</brand><model>Vivaro</model><year>2015</year><price_usd>9000</price_usd><description><![CDATA[Тест & дані]]></description><photos><photo>https://images.example.com/car.jpg</photo></photos>${extra}</vehicle>`;
const xml='<inventory>'+vehicle('external-1')+'</inventory>';
const cars=parseFeed(xml);assert.equal(cars[0].externalId,'external-1');assert.equal(cars[0].description,'Тест & дані');assert.equal(cars[0].photos.length,1);assert.equal(cars[0].priceUsd,9000);
assert.throws(()=>parseFeed('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+xml));assert.throws(()=>parseFeed('<inventory>'+vehicle('same')+vehicle('same')+'</inventory>'));assert.throws(()=>parseFeed('<inventory><vehicle>'));
for(const url of ['http://example.com/feed','https://127.0.0.1/feed','https://user:password@example.com/feed','https://example.com:8443/feed'])assert.throws(()=>feedUrl(url));
for(const ip of ['127.0.0.1','10.1.1.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.1.1','::1'])assert.equal(publicIPv4(ip),false);assert.equal(publicIPv4('8.8.8.8'),true);
(async()=>{
 let fetched=0;const empty={query:async()=>({rowCount:0,rows:[]})};assert.deepEqual(await synchronize(empty,'id',async()=>{fetched++;return xml;}),{skipped:true});assert.equal(fetched,0);
 const offline={query:async()=>({rowCount:1,rows:[{id:'id',owner_id:'owner',url:'https://example.com/feed'}]}),connect(){throw Error('Must not mutate listings if fetch fails');}};
 await assert.rejects(()=>synchronize(offline,'id',async()=>{throw Error('offline');}),/offline/);
 console.log('PASS XML parsing, CDATA, duplicate IDs, malformed XML/DTD, private-address guards, disabled feed makes no request, outage starts no DB transaction');
})().catch(e=>{console.error(e);process.exitCode=1;});
