const assert=require('node:assert/strict');
const {productFields,installProductCatalog}=require('../product-catalog');
assert.deepEqual(productFields({category:' Автохімія ',orderTelegram:'https://t.me/RoyalShop',orderViber:'+380 (67) 000-00-01'}),['Автохімія','available','RoyalShop','+380670000001',true]);
for(const input of [{availability:'bad'},{orderTelegram:'javascript:alert(1)'},{orderViber:'123'},{orderChat:false}])assert.throws(()=>productFields(input));
(async()=>{
 const routes={},calls=[];
 installProductCatalog({app:{get:(path,fn)=>routes[path]=fn},pool:{query:async(sql,params)=>{calls.push({sql,params});return {rows:[]};}},databaseReady:Promise.resolve()});
 const response={statusCode:200,status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};
 await routes['/api/catalog/products']({query:{q:"' OR 1=1 --",category:'Автохімія',page:'-5'}},response);
 assert.equal(calls[0].params[0],"' OR 1=1 --");assert.equal(calls[0].params[2],0);assert.ok(!calls[0].sql.includes("' OR 1=1 --"));
 assert.match(calls[0].sql,/u.email_verified AND u.phone_verified/);assert.match(calls[0].sql,/bt.code IN \('auto_shop','wholesale'\)/);assert.match(calls[0].sql,/NOT bp.is_deleted/);assert.match(calls[0].sql,/NOT u.account_disabled/);
 await routes['/api/catalog/products/:id']({params:{id:'invalid'}},response);assert.equal(response.statusCode,404);assert.equal(calls.length,1);
 await routes['/api/catalog/products/:id']({params:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}},response);assert.equal(response.statusCode,404);
 require('node:fs').writeFileSync('/tmp/rg-catalog-select.json',JSON.stringify(calls[0]));
 console.log('PASS: contact validation, unsafe URL rejection, parameterized search, page bounds, publication filters, missing product');
})().catch(e=>{console.error(e);process.exitCode=1;});
