(async () => {
    const track = document.getElementById("homePartnersTrack");
    const status = document.getElementById("homePartnersStatus");
    const royalAuto = {
        ownerId: "32ce413e-9eb6-417a-b99a-77d9ca7c144a",
        businessName: "RoyalAuto",
        logoUrl: "images/royal-auto-atelier-logo.webp",
        href: "business-profile.html?id=32ce413e-9eb6-417a-b99a-77d9ca7c144a"
    };
    const royalAutoNames = new Set(["royalauto", "royalautoatelier"]);
    const shopOwnerId = "f706d645-f099-4916-9935-74d309297fb7";

    function clearShopLogoBackground(image, source) {
        const original = new Image();
        original.onload = () => {
            if (image.getAttribute("src") !== source || !image.classList.contains("home-shop-logo")) return;
            try {
                const scale = Math.min(1, 1200 / Math.max(original.naturalWidth, original.naturalHeight));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(original.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(original.naturalHeight * scale));
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
                const w = canvas.width, h = canvas.height, pixels = ctx.getImageData(0, 0, w, h);
                const data = pixels.data, visited = new Uint8Array(w*h), queue = new Int32Array(w*h);
                let head=0, tail=0;
                function add(i) {
                    if (visited[i]) return;
                    visited[i]=1;
                    const k=i*4, r=data[k], g=data[k+1], b=data[k+2];
                    if (data[k+3]===0 || (Math.min(r,g,b)>=215 && Math.max(r,g,b)-Math.min(r,g,b)<=32)) {
                        data[k+3]=0; queue[tail++]=i;
                    }
                }
                for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
                for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
                while(head<tail){
                    const i=queue[head++],x=i%w;
                    if(x>0)add(i-1);if(x<w-1)add(i+1);
                    if(i>=w)add(i-w);if(i<(h-1)*w)add(i+w);
                }
                if(tail){ctx.putImageData(pixels,0,0);image.src=canvas.toDataURL("image/png");}
            } catch { /* Keep the original when the browser cannot read image pixels. */ }
        };
        original.src=source;
    }



    try {
        const response = await fetch("/api/businesses/featured");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const { businesses } = await response.json();
        const byOwner = businesses.find(business => business.ownerId === royalAuto.ownerId);
        const savedProfile = byOwner || businesses.find(business =>
            royalAutoNames.has(business.businessName.trim().toLowerCase().replace(/\s+/g, ""))
        );
        const partners = [savedProfile || royalAuto, ...businesses.filter(business => business !== savedProfile)];
        const cards = document.createDocumentFragment();
        for (const business of partners) {
            const card = document.createElement("a");
            card.className = "home-partner-card";
            card.href = (business.ownerId === royalAuto.ownerId || royalAutoNames.has(String(business.businessName || "").trim().toLowerCase().replace(/\s+/g, "")))
                ? royalAuto.href
                : (business.href || `business-profile.html?id=${encodeURIComponent(business.ownerId)}`);
            const isRoyalAuto = business.ownerId === royalAuto.ownerId || royalAutoNames.has(String(business.businessName || "").trim().toLowerCase().replace(/\s+/g, ""));
            if (isRoyalAuto) card.classList.add("home-partner-card--royalauto");
            const logoUrl = isRoyalAuto ? royalAuto.logoUrl : business.logoUrl;
            if (logoUrl) {
                const logo = document.createElement("img");
                logo.alt = "";
                logo.loading = "lazy";
                logo.src = logoUrl;
                logo.addEventListener("error", () => { logo.hidden = true; }, { once: true });
                card.append(logo);
                if (String(business.ownerId) === shopOwnerId) {
                    logo.classList.add("home-shop-logo");
                    clearShopLogoBackground(logo, logoUrl);
                }
            }
            const name = document.createElement("strong");
            name.textContent = isRoyalAuto ? "RoyalAuto" : business.businessName;
            card.append(name);
            cards.append(card);
        }
        track.append(cards);
    } catch (error) {
        console.error("Partners:", error);
        status.hidden = false;
        status.textContent = "Не вдалося завантажити партнерів.";
    }
})();
