const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');const {synchronize}=require('../dealer-xml');
if(!process.env.RG_QA_BRIDGE)throw Error('Isolated SQL bridge required. Never use production.');
const pool={query:async(sql,params=[])=>{if(/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql))return {rows:[],rowCount:0};const r=spawnSync('python',[process.env.RG_QA_BRIDGE],{encoding:'utf8',input:JSON.stringify({sql,params})});assert.equal(r.status,0,'Isolated SQL operation failed');const data=JSON.parse(r.stdout);return {...data,rowCount:data.rows.length};},connect:async()=>pool,release(){}};
const id='ffffffff-ffff-4fff-8fff-ffffffffffff';
const xml=(price,status='active')=>`<inventory><vehicle id="qa-external-1"><brand>Opel</brand><model>Vivaro</model><year>2015</year><price_usd>${price}</price_usd><status>${status}</status></vehicle></inventory>`;
(async()=>{
 await synchronize(pool,id,async()=>xml(9000));
 const first=await pool.query('SELECT listing_id FROM business_xml_listings WHERE feed_id=$1',[id]);assert.equal(first.rowCount,1);const listing=first.rows[0].listing_id;
 await synchronize(pool,id,async()=>xml(8800,'sold'));
 const second=await pool.query('SELECT listing_id FROM business_xml_listings WHERE feed_id=$1',[id]);assert.equal(second.rowCount,1);assert.equal(second.rows[0].listing_id,listing);
 const car=await pool.query('SELECT price_usd,status,sold_at FROM market_listings WHERE id=$1',[listing]);assert.equal(Number(car.rows[0].price_usd),8800);assert.equal(car.rows[0].status,'sold');assert.ok(car.rows[0].sold_at);
 const manual=await pool.query('SELECT status FROM market_listings WHERE id=$1',['11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);assert.equal(manual.rowCount,1);assert.equal(manual.rows[0].status,'active');
 await assert.rejects(()=>synchronize(pool,id,async()=>{throw Error('offline');}),/offline/);
 console.log('PASS real PostgreSQL statements: stable mapping, repeated import without duplicate, price and sold update, manual listing retained, outage unchanged. Transaction rollback not simulated by standalone bridge.');
})().catch(e=>{console.error(e);process.exitCode=1;});
