'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {parseHTML}=require('linkedom');
const source=fs.readFileSync('public/js/pwa-install.js','utf8');
function setup({ua='Android Chrome',standalone=false,storage={},touch=0}={}) {
 const {document}=parseHTML('<html lang="uk"><head></head><body></body></html>');
 const listeners={};let registrations=0;
 const window={matchMedia:()=>({matches:standalone}),isSecureContext:true,addEventListener:(n,f)=>{listeners[n]=f;}};
 const navigator={userAgent:ua,maxTouchPoints:touch,serviceWorker:{register:async()=>{registrations++;}}};
 const localStorage={getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=v;}};
 vm.runInNewContext(source,{window,document,navigator,localStorage,Date});
 document.dispatchEvent(new document.defaultView.Event('DOMContentLoaded'));
 return {document,listeners,storage,get registrations(){return registrations;}};
}
test('Android waits for browser install event, decline persists, no account storage',()=>{
 const s=setup();assert.equal(s.document.querySelector('.rg-install'),null);
 let prevented=false;s.listeners.beforeinstallprompt({preventDefault(){prevented=true;}});
 assert.ok(prevented);assert.ok(s.document.querySelector('.rg-install'));
 s.document.querySelector('.rg-install-later').click();
 assert.equal(s.document.querySelector('.rg-install'),null);
 assert.ok(Number(s.storage['rg-install-dismissed-until'])>Date.now());
 assert.deepEqual(Object.keys(s.storage),['rg-install-dismissed-until']);
 s.listeners.beforeinstallprompt({preventDefault(){throw Error('must not intercept');}});
});
test('iPhone provides Safari instruction; installation removes panel',()=>{
 const s=setup({ua:'iPhone Version/18 Safari/604'});
 assert.match(s.document.querySelector('.rg-install p').textContent,/Поділитися/);
 s.listeners.appinstalled();assert.equal(s.document.querySelector('.rg-install'),null);
});
test('standalone and desktop show no proposal',()=>{
 for(const opts of [{standalone:true},{ua:'Windows Chrome'}])assert.equal(setup(opts).document.querySelector('.rg-install'),null);
});
test('manifest/apple icon bootstrapped once and worker registered independently of Push',()=>{
 const s=setup();assert.equal(s.registrations,1);
 assert.equal(s.document.querySelector('link[rel="manifest"]').getAttribute('href'),'/manifest.json');
 assert.ok(s.document.querySelector('link[rel="apple-touch-icon"]'));
 assert.equal(s.document.querySelector('meta[name="apple-mobile-web-app-capable"]').content,'yes');
});
test('expired native event removes broken install button',async()=>{
 const s=setup();s.listeners.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('expired');}});
 s.document.querySelector('.rg-install button').click();await new Promise(r=>setImmediate(r));
 assert.equal(s.document.querySelector('.rg-install'),null);
});
