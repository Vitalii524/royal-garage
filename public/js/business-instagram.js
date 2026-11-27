"use strict";
window.mountBusinessInstagram = function({root,tools,form,status,load,icon,el,headers}) {
    const base="/api/business/instagram";
    const button=el("button");button.type="button";
    icon(button,"Імпорт з Instagram","M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17.5 6.5h.01");
    tools.append(button);
    const panel=el("section");panel.hidden=true;panel.style.cssText="width:100%;box-sizing:border-box;padding:12px;border:1px solid #806b42;border-radius:12px";
    const heading=el("h3","Імпорт з Instagram"), info=el("p"), controls=el("div"), list=el("div"), more=el("button","Показати ще"), run=el("button","Імпортувати вибрані");
    info.setAttribute("role","status");more.type=run.type="button";more.hidden=true;run.hidden=true;run.disabled=true;
    list.style.cssText="max-height:420px;overflow:auto";
    const connect=el("button","Підключити Instagram"), disconnect=el("button","Від’єднати Instagram");
    connect.type=disconnect.type="button";connect.hidden=disconnect.hidden=true;controls.append(connect,disconnect);
    panel.append(heading,info,controls,list,more,run);
    // Keep the panel outside the existing publication form to avoid nested forms and accidental submit.
    root.append(panel);
    const place=()=>{if(form.parentNode===root)form.after(panel);};queueMicrotask(place);
    let selected=new Map(),cursor=null,busy=false;
    async function api(path,options={}) {
        const response=await fetch(base+path,{...options,cache:"no-store",credentials:"same-origin",headers:{...headers}});
        const data=await response.json();
        if(!response.ok)throw Error(data.message||"Помилка Instagram.");
        return data;
    }
    function reset(){list.replaceChildren();selected.clear();cursor=null;more.hidden=true;run.hidden=true;run.disabled=true;}
    async function page(clear){
        if(clear)reset();
        more.disabled=true;
        try {
            const data=await api("/media"+(cursor?"?after="+encodeURIComponent(cursor):""));
            for(const item of data.items){
                const row=el("label");row.style.cssText="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid #806b42";
                const check=el("input");check.type="checkbox";check.disabled=item.imported;
                check.checked=selected.has(item.id);
                check.onchange=()=>{if(check.checked)selected.set(item.id,item.proof);else selected.delete(item.id);run.disabled=!selected.size;};
                row.append(check);
                if(item.preview){const img=el("img");img.src=item.preview;img.loading="lazy";img.referrerPolicy="no-referrer";img.style.cssText="width:68px;height:68px;object-fit:cover;border-radius:6px";row.append(img);}
                row.append(el("span",(item.imported?"Вже імпортовано · ":"")+(item.caption||item.type).slice(0,160)));
                list.append(row);
            }
            cursor=data.after;more.hidden=!cursor;run.hidden=false;run.disabled=!selected.size;
            info.textContent=list.children.length?"Оберіть публікації для імпорту.":"Публікацій немає.";
        }finally{more.disabled=false;}
    }
    async function refresh(){
        reset();info.textContent="Перевіряємо підключення…";connect.hidden=disconnect.hidden=true;
        try{
            const data=await api("/status");
            connect.hidden=data.connected||!data.configured;disconnect.hidden=!data.connected;
            if(data.connected){heading.textContent="Instagram · @"+data.username;await page(true);}
            else{heading.textContent="Імпорт з Instagram";info.textContent=data.configured?"Підключіть власний професійний акаунт Instagram.":"Підключення Instagram очікує налаштування Meta адміністратором.";}
        }catch(e){info.textContent=e.message;}
    }
    button.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)refresh();};
    connect.onclick=async()=>{connect.disabled=true;try{const data=await api("/connect",{method:"POST"});const url=new URL(data.url);if(url.origin!=="https://www.instagram.com")throw Error("Невірне посилання Instagram.");location.assign(url.href);}catch(e){info.textContent=e.message;}finally{connect.disabled=false;}};
    disconnect.onclick=async()=>{if(busy)return;disconnect.disabled=true;try{await api("/disconnect",{method:"POST"});await refresh();}catch(e){info.textContent=e.message;}finally{disconnect.disabled=false;}};
    more.onclick=()=>page(false).catch(e=>{info.textContent=e.message;});
    run.onclick=async()=>{if(busy||!selected.size)return;busy=true;run.disabled=more.disabled=disconnect.disabled=true;let done=0;const errors=[];const entries=[...selected];
        try{
            for(const [id,proof] of entries){info.textContent="Імпорт "+(done+errors.length+1)+" / "+entries.length;try{const r=await api("/media",{method:"POST",body:JSON.stringify({id,proof})});if(r.imported)done++;}catch(e){errors.push(e.message);}}
            await load();await page(true);info.textContent="Імпортовано: "+done+(errors.length?". Помилки: "+errors.join("; "):"");
        }catch(e){info.textContent=e.message;}finally{busy=false;run.disabled=!selected.size;more.disabled=disconnect.disabled=false;}
    };
    const result=new URLSearchParams(location.search).get("instagram");
    if(result){panel.hidden=false;refresh().then(()=>{if(result==="error")info.textContent="Не вдалося підключити Instagram. Перевірте дозвіл Meta та повторіть спробу.";});const url=new URL(location.href);url.searchParams.delete("instagram");history.replaceState(null,"",url.href);}
};
