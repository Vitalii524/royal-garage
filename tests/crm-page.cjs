const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const source=fs.readFileSync('public/js/crm.js','utf8');
async function run(allowed){
 const elements=Object.fromEntries(['crmStatus','crmDashboard','crmBusinessName'].map(id=>[id,{hidden:true,textContent:'',classList:{add(){}}}]));
 const calls=[];const context={console:{error(){}},AbortController,setTimeout,clearTimeout,document:{getElementById:id=>elements[id],addEventListener(){}},window:{location:{hostname:'royalgarage.com.ua'}},localStorage:{getItem:()=> 'test-session'},fetch:async(url,options)=>{calls.push(url);return {ok:allowed,json:async()=>allowed?{crm:{businessName:'Test STO',planName:'Business'}}:{message:'Підписка бізнесу не активна.'}}}};
 vm.createContext(context);vm.runInContext(source,context);await context.loadCrm();
 assert.equal(elements.crmDashboard.hidden,!allowed);
 assert.equal(calls.length,allowed?2:1,'bootstrap only after successful access check');
 assert.equal(elements.crmStatus.textContent,allowed?'CRM активна · Business':'Підписка бізнесу не активна.');
 if(allowed)assert.equal(elements.crmBusinessName.textContent,'Test STO');
}
(async()=>{await run(true);await run(false);console.log('PASS: CRM bootstrap, dashboard activation and explicit denied-access message');})().catch(e=>{console.error(e);process.exit(1)});
