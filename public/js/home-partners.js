(async () => {
    const track = document.getElementById("homePartnersTrack");
    const status = document.getElementById("homePartnersStatus");
    const royalAuto = {
        ownerId: "32ce413e-9eb6-417a-b99a-77d9ca7c144a",
        businessName: "Royal Auto",
        logoUrl: "images/royal-auto-atelier-logo.webp",
        href: "handmade.html"
    };
    const royalAutoNames = new Set(["royalauto", "royalautoatelier"]);

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
                ? "handmade.html"
                : (business.href || `business-profile.html?id=${encodeURIComponent(business.ownerId)}`);
            const isRoyalAuto = business.ownerId === royalAuto.ownerId || royalAutoNames.has(String(business.businessName || "").trim().toLowerCase().replace(/\s+/g, ""));
            if (isRoyalAuto) card.classList.add("home-partner-card--royalauto");
            const logoUrl = isRoyalAuto ? royalAuto.logoUrl : business.logoUrl;
            if (logoUrl) {
                const logo = document.createElement("img");
                logo.alt = "";
                logo.loading = "lazy";
                logo.src = logoUrl;
                logo.addEventListener("error", () => logo.remove(), { once: true });
                card.append(logo);
            }
            const name = document.createElement("strong");
            name.textContent = business.businessName;
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
