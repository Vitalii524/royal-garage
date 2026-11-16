
(async () => {
    const track = document.getElementById("homePartnersTrack");
    const status = document.getElementById("homePartnersStatus");
    try {
        const response = await fetch("/api/businesses/featured");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const { businesses } = await response.json();
        const cards = document.createDocumentFragment();
        for (const business of businesses) {
            const card = document.createElement("a");
            card.className = "home-partner-card";
            card.href = `business-profile.html?id=${encodeURIComponent(business.ownerId)}`;
            if (business.logoUrl) {
                const logo = document.createElement("img");
                logo.alt = "";
                logo.loading = "lazy";
                logo.src = business.logoUrl;
                logo.addEventListener("error", () => logo.remove(), { once: true });
                card.append(logo);
            }
            const name = document.createElement("strong");
            name.textContent = business.businessName;
            card.append(name);
            cards.append(card);
        }
        track.append(cards);
        if (!businesses.length) {
            status.hidden = false;
            status.textContent = "Каталог партнерів поповнюється.";
        }
    } catch (error) {
        console.error("Partners:", error);
        status.hidden = false;
        status.textContent = "Не вдалося завантажити партнерів.";
    }
})();
