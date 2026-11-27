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
    const progressBox=el("div"), progressText=el("p"), progress=el("progress"), summary=el("p");
    progressBox.hidden=true;progressBox.style.cssText="margin:12px 0;display:block";
    progressBox.removeAttribute("style");progressBox.style.margin="12px 0";
    progress.max=1;progress.value=0;progress.setAttribute("aria-label","Прогрес імпорту Instagram");progress.style.cssText="width:100%;height:14px;accent-color:#d6a445;display:block;margin:8px 0";
    progressText.setAttribute("role","status");summary.style.cssText="font-size:14px;overflow-wrap:anywhere";
    progressBox.append(progressText,progress,summary);
    panel.append(heading,info,controls,list,progressBox,more,run);
    // Keep the panel outside the existing publication form to avoid nested forms and accidental submit.
    root.append(panel);
    const place=()=>{if(form.parentNode===root)form.after(panel);};queueMicrotask(place);
    let selected=new Map(),cursor=null,busy=false,listing=false;
    function syncSelection(){run.textContent="Імпортувати вибрані ("+selected.size+")";run.disabled=busy||listing||!selected.size;}
    function showProgress(total,processed,done,skipped,failed,finished=false){
        progressBox.hidden=false;progress.max=total;progress.value=processed;
        const percent=Math.round(100*processed/total);
        progressText.textContent=(finished?"Обробку завершено: ":"Завантаження: ")+processed+" / "+total+" · "+percent+"%";
        summary.textContent="Імпортовано: "+done+" · Уже імпортовано: "+skipped+" · Помилки: "+failed;
    }
    function lockList(locked){
        for(const check of list.querySelectorAll('input[type="checkbox"]')) check.disabled=locked||check.dataset.imported==="1";
    }
    syncSelection();
    async function api(path,options={}) {
        const response=await fetch(base+path,{...options,cache:"no-store",credentials:"same-origin",headers:{...headers}});
        const data=await response.json();
        if(!response.ok)throw Error(data.message||"Помилка Instagram.");
        return data;
    }
    function reset(){list.replaceChildren();selected.clear();cursor=null;more.hidden=true;run.hidden=true;syncSelection();}
    async function page(clear){
        if(clear)reset();
        listing=true;more.disabled=true;syncSelection();
        try {
            const data=await api("/media"+(cursor?"?after="+encodeURIComponent(cursor):""));
            for(const item of data.items){
                const row=el("label");row.style.cssText="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid #806b42";
                const check=el("input");check.type="checkbox";check.dataset.imported=item.imported?"1":"0";check.disabled=busy||item.imported;
                check.checked=selected.has(item.id);
                check.onchange=()=>{if(busy)return;if(check.checked)selected.set(item.id,item.proof);else selected.delete(item.id);syncSelection();};
                row.append(check);
                if(item.preview){const img=el("img");img.src=item.preview;img.loading="lazy";img.referrerPolicy="no-referrer";img.style.cssText="width:68px;height:68px;object-fit:cover;border-radius:6px";row.append(img);}
                row.append(el("span",(item.imported?"Вже імпортовано · ":"")+(item.caption||item.type).slice(0,160)));
                list.append(row);
            }
            cursor=data.after;more.hidden=!cursor;run.hidden=false;syncSelection();
            info.textContent=list.children.length?"Оберіть публікації для імпорту.":"Публікацій немає.";
        }finally{listing=false;more.disabled=busy;syncSelection();}
    }
    async function refresh(){
        reset();info.textContent="Перевіряємо підключення…";connect.hidden=disconnect.hidden=true;
        try{
            const data=await api("/status");
            connect.hidden=data.connected||!data.configured;disconnect.hidden=!data.connected;
            if(data.pending){
                heading.textContent="Оберіть Instagram-акаунт";
                const result=await api("/accounts");
                for(const account of result.accounts){const choice=el("button","@"+account.username);choice.type="button";choice.onclick=async()=>{choice.disabled=true;try{await api("/select",{method:"POST",body:JSON.stringify({id:account.id})});await refresh();}catch(e){info.textContent=e.message;choice.disabled=false;}};list.append(choice);}
                info.textContent="Виберіть акаунт для цього бізнес-профілю.";
            }else if(data.connected){heading.textContent="Instagram · @"+data.username;await page(true);}
            else{heading.textContent="Імпорт з Instagram";info.textContent=data.configured?"Підключіть власний професійний акаунт Instagram.":"Підключення Instagram очікує налаштування Meta адміністратором.";}
        }catch(e){info.textContent=e.message;}
    }
    button.onclick=()=>{if(busy)return;panel.hidden=!panel.hidden;if(!panel.hidden){progressBox.hidden=true;refresh();}};
    connect.onclick=async()=>{connect.disabled=true;try{const data=await api("/connect",{method:"POST"});const url=new URL(data.url);if(url.origin!=="https://www.facebook.com"||url.pathname!=="/dialog/oauth")throw Error("Невірне посилання Instagram.");location.assign(url.href);}catch(e){info.textContent=e.message;}finally{connect.disabled=false;}};
    disconnect.onclick=async()=>{if(busy)return;disconnect.disabled=true;try{await api("/disconnect",{method:"POST"});await refresh();}catch(e){info.textContent=e.message;}finally{disconnect.disabled=false;}};
    more.onclick=()=>page(false).catch(e=>{info.textContent=e.message;});
    run.onclick=async()=>{
        if(busy||listing||!selected.size)return;
        busy=true;run.disabled=more.disabled=disconnect.disabled=button.disabled=true;lockList(true);
        let done=0,skipped=0,processed=0;const errors=[],entries=[...selected],total=entries.length;
        showProgress(total,0,0,0,0);
        try{
            for(const [id,proof] of entries){
                run.textContent="Завантаження "+(processed+1)+" / "+total+"…";
                try{const r=await api("/media",{method:"POST",body:JSON.stringify({id,proof})});if(r.imported)done++;else skipped++;}
                catch(e){errors.push(e.message);}
                processed++;showProgress(total,processed,done,skipped,errors.length);
            }
            await load();await page(true);
            info.textContent="Імпортовано: "+done+(errors.length?". Помилки: "+errors.join("; "):"");
        }catch(e){info.textContent=e.message;}
        finally{
            showProgress(total,processed,done,skipped,errors.length,processed===total);
            busy=false;more.disabled=disconnect.disabled=button.disabled=false;lockList(false);syncSelection();
        }
    };
    const result=new URLSearchParams(location.search).get("instagram");
    if(result){panel.hidden=false;refresh().then(()=>{if(result==="error")info.textContent="Не вдалося підключити Instagram. Перевірте дозвіл Meta та повторіть спробу.";if(result==="no_accounts")info.textContent="Meta не надала доступу до Instagram-акаунтів. Перевірте вибрані ресурси та дозволи.";});const url=new URL(location.href);url.searchParams.delete("instagram");history.replaceState(null,"",url.href);}
};
