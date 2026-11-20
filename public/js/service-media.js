(() => {
    const token=()=>localStorage.getItem('royalGarageToken');
    async function api(url,options={}) {
        const response=await fetch(url,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),Authorization:`Bearer ${token()}`}});
        if(!response.ok){let d={};try{d=await response.json();}catch{}throw new Error(d.message||'Не вдалося виконати дію.');}return response;
    }
    const read=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Не вдалося прочитати файл.'));r.readAsDataURL(file);});
    // Read native picker files immediately: mobile providers may revoke access while a caption is typed.
    const selections = new WeakMap();
    function capture(input) {
        const files = Array.from(input.files || []);
        let total = 0;
        if (files.length > 20) throw new Error('Не більше 20 файлів.');
        for (const file of files) {
            total += file.size;
            if (file.size > (file.type.startsWith('image/') ? 20 : 50) * 1048576 || total > 100 * 1048576)
                throw new Error('Перевищено розмір вкладень: фото 20 МБ, відео 50 МБ, разом 100 МБ.');
        }
        const entries = files.map(file => ({
            file,
            // Resolve errors as values to avoid an unhandled rejection before submit.
            ready: read(file).then(data => ({data}), () => ({error: new Error(
                'Не вдалося прочитати «' + file.name + '». Виберіть файл повторно з пам’яті телефону або спочатку завантажте його з хмари.'
            )}))
        }));
        selections.set(input, entries);
        return entries;
    }
    function mount(form,video=true){
        if(form.querySelector('[data-media-input]'))return;
        const box=document.createElement('fieldset');box.className='rg-media';
        const legend=document.createElement('legend');legend.textContent=video?'Фото та відео до скарги (необов’язково)':'Фото до наряду';
        const input=document.createElement('input');input.type='file';input.multiple=true;input.accept=video?'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime':'image/jpeg,image/png,image/webp';input.dataset.mediaInput='';
        const hint=document.createElement('p');hint.textContent='До 20 файлів: фото до 20 МБ, відео до 50 МБ; разом до 100 МБ. Коментар — до 1000 символів.';
        const captions=document.createElement('div');input.addEventListener('change',()=>{selections.delete(input);const status=form.querySelector('[role=status]');try{capture(input);if(status)status.textContent='';}catch(e){if(status)status.textContent=e.message;}captions.replaceChildren();for(const file of input.files){const label=document.createElement('label');label.textContent=file.name;const text=document.createElement('textarea');text.maxLength=1000;text.placeholder='Коментар до цього файлу';text.dataset.mediaCaption='';label.append(text);captions.append(label);}});
        box.append(legend,input,hint,captions);const submitButton=form.querySelector('[type=submit]');if(submitButton){let anchor=submitButton;while(anchor.parentNode!==form)anchor=anchor.parentNode;form.insertBefore(box,anchor);}else form.append(box);
        form.addEventListener('reset',()=>{selections.delete(input);captions.replaceChildren();});
    }
    async function optimizePhoto(file) {
        if (!file.type.startsWith('image/') || file.size < 512 * 1024) return file;
        let bitmap;
        try {
            if (typeof createImageBitmap !== 'function') return file;
            bitmap = await createImageBitmap(file);
            const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext('2d');
            if (!context) return file;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            return blob && blob.size < file.size ? blob : file;
        } catch { return file; }
        finally { bitmap?.close(); }
    }
    async function collect(form) {
        const input = form.querySelector('[data-media-input]');
        if (!input) return [];
        const files = Array.from(input.files || []);
        if (files.length > 20) throw new Error('Не більше 20 файлів.');
        let total = 0;
        for (const file of files) {
            total += file.size;
            if (file.size > (file.type.startsWith('image/') ? 20 : 50) * 1048576 || total > 100 * 1048576)
                throw new Error('Перевищено розмір вкладень: фото 20 МБ, відео 50 МБ, разом 100 МБ.');
        }
        let entries = selections.get(input);
        if (!entries || entries.length !== files.length || entries.some((entry,i)=>entry.file !== files[i]))
            entries = capture(input);
        const captions = form.querySelectorAll('[data-media-caption]');
        const status = form.querySelector('[role=status]');
        const items = [];
        for (const [i, file] of files.entries()) {
            if (status) status.textContent = `Підготовка файлу ${i + 1} із ${files.length}…`;
            const result = await entries[i].ready;
            if (result.error) throw result.error;
            let data = result.data;
            if (file.type.startsWith('image/') && file.size >= 512 * 1024) {
                const binary = atob(data.slice(data.indexOf(',') + 1));
                const bytes = new Uint8Array(binary.length);
                for (let j=0;j<binary.length;j++) bytes[j]=binary.charCodeAt(j);
                const snapshot = new Blob([bytes], {type:file.type});
                const optimized = await optimizePhoto(snapshot);
                if (optimized !== snapshot) data = await read(optimized);
            }
            items.push({ data, caption: captions[i]?.value || '' });
        }
        return items;
    }
    function upload(url, attachments, status) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.timeout = 180000;
            xhr.setRequestHeader('Authorization', `Bearer ${token()}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.upload.onprogress = event => {
                status.textContent = event.lengthComputable
                    ? `Завантаження: ${Math.round(event.loaded / event.total * 100)}%`
                    : 'Завантаження фото…';
            };
            xhr.upload.onload = () => { status.textContent = 'Файли передано. Сервер зберігає фото…'; };
            xhr.onload = () => {
                let result = {}; try { result = JSON.parse(xhr.responseText); } catch {}
                if (xhr.status >= 200 && xhr.status < 300) resolve(result);
                else reject(new Error(result.message || 'Не вдалося зберегти фото. Оновіть наряд і перевірте вкладення перед повторною спробою.'));
            };
            const interrupted = () => reject(new Error('З’єднання перервано або перевищено час очікування. Оновіть наряд і перевірте, чи фото вже збережені, перш ніж повторювати.'));
            xhr.onerror = interrupted; xhr.ontimeout = interrupted; xhr.onabort = interrupted;
            status.textContent = 'Завантаження: 0%';
            xhr.send(JSON.stringify({ attachments }));
        });
    }
    async function render(root,url,editable=false){
        root.textContent='Завантажуємо вкладення…';
        try{const {media}=await(await api(url)).json();root.replaceChildren();if(!media.length){root.textContent='Вкладень поки немає.';return;}
            for(const item of media){const card=document.createElement('figure');card.className='rg-media';const response=await api('/api/crm/media/'+encodeURIComponent(item.id));const objectUrl=URL.createObjectURL(await response.blob());const visual=document.createElement(item.mime.startsWith('video/')?'video':'img');visual.src=objectUrl;if(visual.tagName==='VIDEO'){visual.controls=true;visual.preload='metadata';}else visual.alt='Фото до заявки або наряду';window.addEventListener('pagehide',()=>URL.revokeObjectURL(objectUrl),{once:true});
                const caption=document.createElement('figcaption');caption.textContent=item.caption||'Без коментаря';card.append(visual,caption);
                if(editable){const text=document.createElement('textarea');text.value=item.caption;text.maxLength=1000;text.setAttribute('aria-label','Коментар до фото або відео');const save=document.createElement('button');save.type='button';save.textContent='Зберегти коментар';save.addEventListener('click',async()=>{save.disabled=true;try{await api('/api/crm/media/'+encodeURIComponent(item.id),{method:'PATCH',body:JSON.stringify({caption:text.value})});caption.textContent=text.value||'Без коментаря';}catch(e){alert(e.message);}finally{save.disabled=false;}});card.append(text,save);}root.append(card);
            }
        }catch(e){root.textContent=e.message;}
    }
    window.RGRequestMedia={mount,collect,render,api};
    document.querySelectorAll('#businessBookingForm').forEach(form=>mount(form));
    const orderRoot=document.getElementById('crmOrderMedia');
    if(orderRoot){const id=new URLSearchParams(location.search).get('id');const url='/api/crm/work-orders/'+encodeURIComponent(id||'')+'/media';const list=document.createElement('div');const form=document.createElement('form');const submit=document.createElement('button');submit.type='submit';submit.textContent='Додати фото';const status=document.createElement('p');status.setAttribute('role','status');form.append(submit,status);mount(form,false);orderRoot.append(form,list);if(id)render(list,url,true);form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;status.textContent='Збереження…';try{const attachments=await collect(form);if(!attachments.length)throw new Error('Оберіть фото.');await upload(url,attachments,status);form.reset();status.textContent='Фото збережено.';await render(list,url,true);}catch(e){status.textContent=e.message;}finally{submit.disabled=false;}});}
})();
