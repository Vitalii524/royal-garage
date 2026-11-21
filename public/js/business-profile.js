(() => {
    "use strict";

    const MAX_ITEM_PHOTOS = 6;
    const ROYAL_AUTO_OWNER_ID = "32ce413e-9eb6-417a-b99a-77d9ca7c144a";
    const BOOKING_TYPES = new Set(["car_service", "detailing", "tire_service", "road_assistance"]);
    let requestsPage = 0;
    const DAYS = [
        ["mon", "Пн"],
        ["tue", "Вт"],
        ["wed", "Ср"],
        ["thu", "Чт"],
        ["fri", "Пт"],
        ["sat", "Сб"],
        ["sun", "Нд"]
    ];

    const state = {
        profile: null,
        isOwner: false,
        editingItemPhotos: [],
        editingProduct: false,
        itemUploading: false,
        editingLogo: null,
        editingPortfolioImage: null
    };

    const $ = (id) => document.getElementById(id);
    const token = () => localStorage.getItem("royalGarageToken") || "";

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getStoredUser() {
        if (typeof window.getCurrentUser === "function") {
            const user = window.getCurrentUser();
            if (user) return user;
        }

        try {
            return JSON.parse(localStorage.getItem("royalGarageCurrentUser") || "null");
        } catch {
            return null;
        }
    }

    function requestedOwnerId() {
        return new URLSearchParams(window.location.search).get("id")?.trim() || "";
    }

    function isCurrentBusinessOwner(ownerId) {
        const user = getStoredUser();
        const userId = user?.id ?? user?.userId ?? user?.user_id;
        return Boolean(token() && userId && (user?.accountType || user?.account_type) === "business" && (!ownerId || String(userId) === String(ownerId)));
    }

    async function api(url, options = {}) {
        const headers = new Headers(options.headers || {});
        const authToken = token();

        if (authToken && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${authToken}`);
        }

        if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(url, { ...options, headers });
        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            const error = new Error(data.message || "Помилка сервера.");
            error.status = response.status;
            throw error;
        }

        return data;
    }

    function setPageError(message) {
        $("businessPageLoading").hidden = true;
        $("businessPageContent").hidden = true;
        const error = $("businessPageError");
        error.textContent = message;
        error.hidden = false;
    }

    function initials(name) {
        const parts = String(name || "Royal Garage")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2);

        return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "RG";
    }

    function formatPhone(phone) {
        const digits = String(phone || "").replace(/\D/g, "");
        return digits ? `+${digits}` : "";
    }

    function telegramUrl(value) {
        const raw = String(value || "").trim();
        if (!raw) return "";
        const normalized = raw.replace(/^https?:\/\/(?:www\.)?t\.me\//i, "").replace(/^@/, "").replace(/\/$/, "");
        return /^[A-Za-z0-9_]{5,32}$/.test(normalized) ? `https://t.me/${normalized}` : "";
    }

    function instagramUrl(value) {
        const raw = String(value || "").trim();
        if (!raw) return "";
        if (/^https?:\/\//i.test(raw)) return raw;
        return `https://instagram.com/${raw.replace(/^@/, "")}`;
    }

    function mapUrl(profile) {
        const query = [profile.city, profile.address].filter(Boolean).join(", ").trim();
        if (!query) return "";
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    function money(value) {
        const number = Number(value);
        if (!Number.isFinite(number) || number <= 0) return "";
        return `від ${Math.round(number).toLocaleString("uk-UA")} грн`;
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function normalizeSchedule(schedule) {
        const source = schedule && typeof schedule === "object" && !Array.isArray(schedule)
            ? schedule
            : {};

        const result = {};
        for (const [key] of DAYS) {
            const current = source[key] || {};
            result[key] = {
                enabled: Boolean(current.enabled),
                open: String(current.open || "09:00"),
                close: String(current.close || "18:00")
            };
        }
        return result;
    }

    function renderLogo(profile) {
        const image = $("businessLogo");
        const placeholder = $("businessLogoPlaceholder");
        const source = String(profile.logo || "").trim();
        placeholder.textContent = initials(profile.name);
        image.onerror = () => {
            image.hidden = true;
            placeholder.hidden = false;
        };
        if (!source) {
            image.removeAttribute("src");
            image.hidden = true;
            placeholder.hidden = false;
            return;
        }
        image.src = source;
        image.alt = `Логотип ${profile.name || "бізнесу"}`;
        image.hidden = false;
        placeholder.hidden = true;
    }

    function setContactLink(id, href, visible) {
        const element = $(id);
        if (!element) return;
        element.hidden = !visible;
        if (visible) element.href = href;
    }

    function renderContacts(profile) {
        const phone = formatPhone(profile.phone);
        const tg = telegramUrl(profile.telegram);
        const ig = instagramUrl(profile.instagram);
        const route = mapUrl(profile);
        const mapAllowed = profile.mapEnabled !== false && profile.hasMap !== false;

        setContactLink("businessPhoneLink", phone ? `tel:${phone}` : "#", Boolean(phone));
        setContactLink("businessTelegramLink", tg, Boolean(tg));
        setContactLink("businessInstagramLink", ig, Boolean(ig));
        setContactLink("businessRouteLink", route, Boolean(route && mapAllowed));

        setContactLink("businessBottomPhone", phone ? `tel:${phone}` : "#", Boolean(phone));
        setContactLink("businessBottomTelegram", tg, Boolean(tg));
        setContactLink("businessBottomInstagram", ig, Boolean(ig));
        setContactLink("businessMapLink", route, Boolean(route && mapAllowed));
    }

    function renderSchedule(profile) {
        const root = $("businessSchedule");
        root.innerHTML = "";
        const schedule = normalizeSchedule(profile.workSchedule);
        const hasAny = DAYS.some(([key]) => schedule[key].enabled);

        if (!hasAny) {
            root.innerHTML = '<p class="business-empty">Графік ще не вказано.</p>';
            return;
        }

        const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const today = schedule[dayKeys[new Date().getDay()]];
        const todayNode = $("businessTodaySchedule");
        if (todayNode) todayNode.textContent = today.enabled ? `Сьогодні: ${today.open}–${today.close}` : "Сьогодні: вихідний";
        const scheduleDetails = $("businessScheduleDetails");
        if (scheduleDetails) scheduleDetails.open = state.isOwner;
        for (const [key, label] of DAYS) {
            const day = schedule[key];
            const row = document.createElement("div");
            row.className = "business-schedule-row";
            row.innerHTML = `<strong>${label}</strong><span>${day.enabled ? `${escapeHtml(day.open)}–${escapeHtml(day.close)}` : "Вихідний"}</span>`;
            root.appendChild(row);
        }
    }

    function renderOwnerControls(profile) {
        const panel = $("businessOwnerPanel");
        const manage = $("businessManageButton");

        $("businessHeroOwnerActions").hidden = !state.isOwner;
        manage.hidden = !state.isOwner;
        $("businessAddPortfolioButton").hidden = !state.isOwner;
        $("businessOwnerDraftBadge").hidden = !(state.isOwner && profile.profileStatus !== "active");

        if (!state.isOwner) {
            panel.hidden = true;
            return;
        }

        const active = profile.profileStatus === "active";
        $("businessProfileStatusText").textContent = active ? "Активний" : "Чернетка";
        $("businessProfileStatusHint").textContent = active
            ? "Профіль опублікований у «Партнерах»."
            : "Перевірте підтвердження email і телефону.";
        $("businessProfileStatusDot").classList.toggle("active", active);

        $("businessEmailStatus").textContent = profile.emailVerified ? "Підтверджено ✓" : "Не підтверджено";
        $("businessPhoneStatus").textContent = profile.phoneVerified ? "Підтверджено ✓" : "Не підтверджено";
        $("businessVerifyEmailButton").hidden = Boolean(profile.emailVerified);
        $("businessVerifyPhoneButton").hidden = Boolean(profile.phoneVerified);
        $("businessPlanButton").hidden = profile.complimentarySubscription === true;
        $("businessPlanStatus").textContent = profile.complimentarySubscription
            ? "Безстроковий безкоштовний доступ"
            : profile.subscriptionStatus === "active" ? "Активна підписка" : "Підписка завершилась";
        $("businessPlanExpires").textContent = !profile.complimentarySubscription && profile.subscriptionExpiresAt
            ? `Діє до ${new Date(profile.subscriptionExpiresAt).toLocaleDateString("uk-UA")}`
            : "";
        $("businessAddCarButton").hidden = profile.businessTypeCode !== "car_dealer";
        $("businessCrmButton").hidden = !profile.hasCrm;
    }

    function createPhotos(photos, alt) {
        const list = Array.isArray(photos)
            ? photos.filter(Boolean).slice(0, MAX_ITEM_PHOTOS)
            : [];

        if (!list.length) return "";

        return `<div class="business-card-photos">${list
            .map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`)
            .join("")}</div>`;
    }

    function itemCard(service, product = false) {
        if (!product && window.RGServiceGallery) {
            const card=window.RGServiceGallery.card(service);
            if(state.isOwner){
                const actions=document.createElement('div');actions.className='business-card-owner-actions';
                for(const [action,label] of [['edit','✏️ Редагувати'],['delete','🗑 Видалити послугу']]){
                    const button=document.createElement('button');button.type='button';button.textContent=label;
                    button.dataset[action==='edit'?'editItem':'deleteItem']=service.id;button.dataset.product='false';actions.append(button);
                }
                card.append(actions);
            }
            return card;
        }
        if(product && window.RGProductCatalog){
            const card=window.RGProductCatalog.card({...service,ownerId:state.profile.ownerId,sellerName:state.profile.name||state.profile.businessName});
            if(state.isOwner){const actions=document.createElement('div');actions.className='business-card-owner-actions';for(const [action,label] of [['edit','✏️ Редагувати'],['delete','🗑 Видалити товар']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset[action==='edit'?'editItem':'deleteItem']=service.id;b.dataset.product='true';actions.append(b);}card.append(actions);}return card;
        }
        const card = document.createElement("article");
        card.className = "business-content-card";
        const priceText = money(product ? service.price : service.priceFrom);

        card.innerHTML = `
            ${createPhotos(service.photos, service.title)}
            <div class="business-content-body">
                <h3>${escapeHtml(service.title || (product ? "Товар" : "Послуга"))}</h3>
                ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
                ${priceText ? `<span class="business-price">${priceText}</span>` : ""}
                ${state.isOwner ? `
                    <div class="business-card-owner-actions">
                        <button type="button" data-edit-item="${escapeHtml(service.id)}" data-product="${product}">✏️ Редагувати</button>
                        <button type="button" data-delete-item="${escapeHtml(service.id)}" data-product="${product}">🗑 Видалити</button>
                    </div>
                ` : ""}
            </div>`;

        return card;
    }

    function renderServices(profile) {
        const root = $("businessMainGrid");
        const empty = $("businessMainEmpty");
        const services = Array.isArray(profile.services) ? profile.services : [];

        root.innerHTML = "";
        services.slice(0, state.isOwner ? undefined : 3).forEach((service) => root.appendChild(itemCard(service)));
        const allServices = $("businessAllServicesLink");
        if (allServices) { allServices.hidden = services.length <= 3; allServices.href = `business-services.html?id=${encodeURIComponent(profile.ownerId)}`; }
        empty.hidden = services.length > 0;
    }

    async function loadReviews(ownerId) {
        try {
            const [ratingData, reviewsData] = await Promise.all([
                api(`/api/sellers/${encodeURIComponent(ownerId)}/rating`, { headers: { Authorization: "" } }),
                api(`/api/sellers/${encodeURIComponent(ownerId)}/reviews`, { headers: { Authorization: "" } })
            ]);

            const average = Number(ratingData?.rating?.average || 0);
            const count = Number(ratingData?.rating?.count || 0);
            $("businessRatingAverage").textContent = count ? `⭐ ${average.toFixed(1)}` : "⭐ —";
            $("businessRatingCount").textContent = count ? `${count} оцінок` : "Відгуків ще немає";

            const link = $("businessReviewsLink");
            const linkCount = $("businessReviewsLinkCount");
            if (link && linkCount) {
                link.hidden = false;
                linkCount.textContent = `(${count})`;
                const returnUrl = location.pathname.split("/").pop() + location.search;
                link.href = `business-reviews.html?ownerId=${encodeURIComponent(ownerId)}&back=${encodeURIComponent(returnUrl)}`;
            }
        } catch (error) {
            console.error("Service Hub reviews error:", error);
        }
    }

    async function saveBusinessReview(event) {
        event.preventDefault();
    
        const ownerId =
            state.profile?.ownerId;
    
        const rating =
            Number(
                $("businessReviewRating")
                    ?.value
            );
    
        const review =
            String(
                $("businessReviewText")
                    ?.value || ""
            ).trim();
    
        const error =
            $("businessReviewFormError");
    
        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            error.textContent =
                "Оберіть оцінку від 1 до 5.";
            return;
        }
    
        error.textContent = "";
    
        try {
            const body = {
                rating
            };
    
            if (review) {
                body.review = review;
            }
    
            await api(
                `/api/sellers/${
                    encodeURIComponent(ownerId)
                }/rating`,
                {
                    method: "POST",
                    body: JSON.stringify(body)
                }
            );
    
            closeModal(
                "businessReviewModal"
            );
    
            await loadReviews(
                ownerId
            );
    
        } catch (saveError) {
            error.textContent =
                saveError.message;
        }
    }

    function renderPortfolio(profile) {
        const root =
            $("businessPortfolioList");
    
        const empty =
            $("businessPortfolioEmpty");
    
        const portfolio =
            Array.isArray(profile.portfolio)
                ? profile.portfolio
                : [];
    
        root.innerHTML = "";
        empty.hidden =
            portfolio.length > 0;
        const allWorks = $("businessAllWorksLink");
        if (allWorks) { allWorks.hidden = portfolio.length <= 4; allWorks.href = `business-works.html?id=${encodeURIComponent(profile.ownerId)}`; }
    
        for (const item of (state.isOwner ? portfolio : portfolio.slice(0, 4))) {
            const card =
                document.createElement(
                    "article"
                );
    
            card.className =
                "business-portfolio-card";
    
            if (
                item.mediaType === "image" &&
                item.mediaUrl
            ) {
                const image =
                    document.createElement(
                        "img"
                    );
    
                image.src =
                    item.mediaUrl;
    
                image.alt =
                    item.description ||
                    "Робота бізнесу";
    
                image.loading =
                    "lazy";
    
                card.appendChild(
                    image
                );
            }
    
            if (
                item.mediaType === "video" &&
                item.mediaUrl
            ) {
                const link =
                    document.createElement(
                        "a"
                    );
    
                if (item.mediaUrl.startsWith("/api/media/videos/")) {
                    const video = document.createElement("video");
                    video.src = item.mediaUrl; video.controls = true; video.playsInline = true;
                    video.preload = "metadata"; video.style.width = "100%"; card.appendChild(video);
                } else link.href = item.mediaUrl;
    
                link.target =
                    "_blank";
    
                link.rel =
                    "noopener noreferrer";
    
                link.className =
                    "business-portfolio-video";
    
                link.textContent =
                    "▶ Переглянути відео";
    
                if (!item.mediaUrl.startsWith("/api/media/videos/")) card.appendChild(
                    link
                );
            }
    
            if (item.description) {
                const description =
                    document.createElement(
                        "p"
                    );
    
                description.textContent =
                    item.description;
    
                card.appendChild(
                    description
                );
            }
    
            if (state.isOwner) {
                const deleteButton =
                    document.createElement(
                        "button"
                    );
    
                deleteButton.type =
                    "button";
    
                deleteButton.className =
                    "business-portfolio-delete";
    
                deleteButton.dataset.portfolioDelete =
                    item.id;
    
                deleteButton.textContent =
                    "🗑 Видалити";
    
                card.appendChild(
                    deleteButton
                );
            }
    
            root.appendChild(card);
        }
    }

    async function renderProfile(profile) {
        state.profile = profile;
        renderLogo(profile);

        $("businessTypeLabel").textContent = profile.businessTypeName || "СТО / автосервіс";
        $("businessName").textContent = profile.name || "Бізнес";
        $("businessDescription").textContent = profile.description || "Опис ще не додано.";
        const desc = $("businessDescription"), toggle = $("businessDescriptionToggle");
        desc.classList.add("business-description-clamped");
        toggle.textContent = "Читати більше ↓";
        toggle.hidden = !profile.description || String(profile.description).length < 170;

        const cityLine = [profile.city, profile.address].filter(Boolean).join(" · ");
        $("businessCityLine").textContent = cityLine ? `📍 ${cityLine}` : "";
        $("businessCityLine").hidden = !cityLine;
        $("businessAddress").textContent = [profile.city, profile.address].filter(Boolean).join(", ") || "Не вказано";

        renderContacts(profile);
        const chatLink = $("businessChatLink");
        if (chatLink && profile.ownerId && !state.isOwner) {
            chatLink.hidden = false;
            chatLink.href = token() ? `chat.html?withUserId=${encodeURIComponent(profile.ownerId)}` : "profile.html";
            chatLink.title = token() ? "Написати компанії" : "Увійдіть, щоб написати";
        }
        renderSchedule(profile);
        renderOwnerControls(profile);
        const bell = $("businessRequestsBell");
        bell.hidden = !(state.isOwner && profile.hasCrm && profile.subscriptionStatus === "active"
            && BOOKING_TYPES.has(profile.businessTypeCode));
        if (!bell.hidden) refreshRequestCount();
        const quickAdd = $("businessAddServiceQuick");
        if (quickAdd) quickAdd.hidden = !state.isOwner;
        renderServices(profile);
        renderPortfolio(profile);
        renderProducts(profile);
        if (profile.businessTypeCode === "car_dealer") loadBusinessCars(profile.ownerId);

        // Публічно показуємо лише заповнені розділи.
        // Власник бачить порожні розділи, щоб мати можливість їх заповнити.
        const hasText = (value) => Boolean(String(value || "").trim());
        const hasServices = Array.isArray(profile.services) && profile.services.length > 0;
        const hasPortfolio = Array.isArray(profile.portfolio) && profile.portfolio.length > 0;
        const hasDescription = hasText(profile.description);
        const hasAddress = hasText(profile.city) || hasText(profile.address);
        const schedule = normalizeSchedule(profile.workSchedule);
        const hasSchedule = DAYS.some(([day]) => schedule[day].enabled);
        const show = (id, visible) => { const el = $(id); if (el) el.hidden = !visible; };

        show("businessMainContentSection", state.isOwner || hasServices);
        show("businessAboutDescriptionCard", state.isOwner || hasDescription);
        show("businessAboutAddressCard", state.isOwner || hasAddress);
        show("businessAboutScheduleCard", state.isOwner || hasSchedule);
        show("businessAboutSection", state.isOwner || hasDescription || hasAddress || hasSchedule);
        show("businessPortfolioSection", state.isOwner || hasPortfolio);
        show("businessBookingButton", !state.isOwner && profile.acceptsServiceRequests === true);

        if (profile.ownerId) loadReviews(profile.ownerId);

        document.title = `${profile.name || "Бізнес"} | Royal Garage`;
    }

    function renderProducts(profile) {
        const products = profile.products || [];
        const canEdit = state.isOwner && (products.length > 0 || ["products", "both"].includes(profile.businessContentType));
        const legacyCatalog = profile.ownerId === ROYAL_AUTO_OWNER_ID;
        $("businessProductsSection").hidden = !(products.length || canEdit || legacyCatalog);
        $("businessAddProductQuick").hidden = !canEdit;
        $("businessRoyalAutoCatalog").hidden = !legacyCatalog;
        $("businessProductsGrid").replaceChildren(...products.map(product => itemCard(product, true)));
    }

    async function loadBusinessCars(ownerId) {
        const section = $("businessCarsSection");
        const status = $("businessCarsStatus");
        section.hidden = false;
        try {
            const { listings } = await api(`/api/market/listings?ownerId=${encodeURIComponent(ownerId)}`);
            const cards = listings.map(listing => {
                const card = document.createElement("a");
                card.className = "business-info-card";
                card.href = `listing.html?id=${encodeURIComponent(listing.id)}`;
                card.textContent = listing.name || [listing.brand, listing.model, listing.year].filter(Boolean).join(" ");
                return card;
            });
            $("businessCarsGrid").replaceChildren(...cards);
            status.textContent = cards.length ? "" : "Активних оголошень поки немає.";
        } catch (error) {
            status.textContent = error.message;
        }
    }

    async function loadProfile() {
        const ownerId = requestedOwnerId();
        state.isOwner = isCurrentBusinessOwner(ownerId);

        try {
            if (!ownerId && !state.isOwner) {
                throw new Error("Для перегляду бізнес-профілю відкрийте його з каталогу.");
            }

            const data = state.isOwner
                ? await api("/api/business/profile")
                : await api(`/api/business/profiles/${encodeURIComponent(ownerId)}`, {
                    headers: { Authorization: "" }
                });

            if (!data.profile || (ownerId && String(data.profile.ownerId) !== ownerId)) {
                throw new Error("Не вдалося завантажити вибраний бізнес-профіль.");
            }

            await renderProfile(data.profile);
            $("businessPageLoading").hidden = true;
            $("businessPageError").hidden = true;
            $("businessPageContent").hidden = false;
        } catch (error) {
            console.error("Business profile load error:", error);
            setPageError(error.status === 404
                ? "Бізнес-профіль не знайдено або ще не опублікований."
                : error.message);
        }
    }

    function openModal(id) {
        const modal = $(id);
        if (!modal) return;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal(id) {
        const modal = $(id);
        if (!modal) return;
        modal.hidden = true;
        if (!document.querySelector(".business-modal:not([hidden])")) {
            document.body.style.overflow = "";
        }
    }

    function setupScheduleEditor() {
        const root = $("businessScheduleEditor");
        root.innerHTML = "";
        const schedule = normalizeSchedule(state.profile?.workSchedule);

        for (const [key, label] of DAYS) {
            const day = schedule[key];
            const row = document.createElement("div");
            row.className = "business-schedule-edit-row";
            row.innerHTML = `
                <strong>${label}</strong>
                <label><input type="checkbox" data-day-enabled="${key}" ${day.enabled ? "checked" : ""}> Працює</label>
                <input type="time" data-day-open="${key}" value="${escapeHtml(day.open)}">
                <input type="time" data-day-close="${key}" value="${escapeHtml(day.close)}">`;
            root.appendChild(row);
        }
    }

    function readScheduleEditor() {
        const result = {};
        for (const [key] of DAYS) {
            result[key] = {
                enabled: Boolean(document.querySelector(`[data-day-enabled="${key}"]`)?.checked),
                open: document.querySelector(`[data-day-open="${key}"]`)?.value || "09:00",
                close: document.querySelector(`[data-day-close="${key}"]`)?.value || "18:00"
            };
        }
        return result;
    }

    function fillProfileForm() {
        const profile = state.profile;
        $("businessEditName").value = profile.name || "";
        $("businessEditCity").value = profile.city || "";
        $("businessEditAddress").value = profile.address || "";
        $("businessEditPhone").value = profile.phone || "";
        $("businessEditTelegram").value = profile.telegram || "";
        $("businessEditInstagram").value = profile.instagram || "";
        $("businessEditDescription").value = profile.description || "";
        $("businessProfileFormError").textContent = "";
        state.editingLogo = profile.logo || null;
        renderLogoEditPreview();
        setupScheduleEditor();
    }

    function renderLogoEditPreview() {
        const root = $("businessLogoEditPreview");
        const source = String(state.editingLogo || "").trim();
        root.innerHTML = source
            ? `<img src="${escapeHtml(source)}" alt="Логотип бізнесу">`
            : '<span class="business-empty">Логотип ще не додано</span>';
    }

    async function compressImage(file, maxSize = 1200, quality = 0.82) {
        if (!file?.type?.startsWith("image/")) {
            throw new Error("Оберіть файл зображення.");
        }

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });

        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", quality);
    }

    async function saveProfile(event) {
        event.preventDefault();
        const error = $("businessProfileFormError");
        error.textContent = "";

        try {
            const body = {
                name: $("businessEditName").value.trim(),
                logo: state.editingLogo,
                city: $("businessEditCity").value.trim(),
                address: $("businessEditAddress").value.trim(),
                phone: $("businessEditPhone").value.trim(),
                telegram: $("businessEditTelegram").value.trim(),
                instagram: $("businessEditInstagram").value.trim(),
                description: $("businessEditDescription").value.trim(),
                workSchedule: readScheduleEditor()
            };

            const data = await api("/api/business/profile", {
                method: "PATCH",
                body: JSON.stringify(body)
            });

            closeModal("businessProfileModal");
            await renderProfile(data.profile);
        } catch (e) {
            error.textContent = e.message;
        }
    }

    function openItemModal(item = null, product = false) {
        if(state.itemUploading)return;
        state.editingProduct = product;
        $('businessProductFields').hidden=!product;
        $('businessProductCategory').value=item?.category||'';
        $('businessProductAvailability').value=item?.availability||'available';
        $('businessProductTelegram').value=item?.orderTelegram||'';
        $('businessProductViber').value=item?.orderViber||'';
        $('businessProductChat').checked=item?.orderChat!==false;
        $('businessUploadRetry').hidden=true;
        $('businessUploadProgress').hidden=true;
        $("businessItemId").value = item?.id || "";
        $("businessItemTitle").value = item?.title || "";
        $("businessItemDescription").value = item?.description || "";
        $("businessItemPrice").value = (product ? item?.price : item?.priceFrom) ?? "";
        $("businessItemModalTitle").textContent = product
            ? (item ? "Редагувати товар" : "Додати товар")
            : (item ? "Редагувати послугу" : "Додати послугу");
        $("businessItemFormError").textContent = "";
        $("businessItemPhotosInput").value = "";
        $("businessItemPhotosInput").accept = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';
        let hint=$('serviceMediaHint');
        if(!hint){hint=document.createElement('p');hint.id='serviceMediaHint';$('businessItemPhotosInput').after(hint);}
        hint.hidden=false;hint.textContent='До 6 файлів: фото JPG, PNG, WebP — до 10 МБ; відео MP4, WebM, MOV — до 20 МБ та 3 хвилин. Оригінали фото зберігаються.';
        state.editingItemPhotos = Array.isArray(item?.photos) ? [...item.photos] : [];
        renderItemPhotosPreview();
        openModal("businessItemModal");
    }

    function renderItemPhotosPreview() {
        const root = $("businessItemPhotosPreview");
        root.innerHTML = "";

        state.editingItemPhotos.forEach((src, index) => {
            const item = document.createElement("div");
            item.className = "business-photo-preview-item";
            item.innerHTML = `<button type="button" data-remove-photo="${index}" aria-label="Видалити файл">×</button>`;
            item.prepend(window.RGServiceGallery.media(src,'Фото послуги'));
            root.appendChild(item);
        });
    }

    async function saveItem(event) {
        event.preventDefault();
        if(state.itemUploading)return;
        const id = $("businessItemId").value;
        const error = $("businessItemFormError");
        error.textContent = "";

        try {
            const rawPrice = $("businessItemPrice").value;
            const price = rawPrice === "" ? null : Number(rawPrice);
            const resource = state.editingProduct ? "products" : "services";
            const body = {
                title: $("businessItemTitle").value.trim(),
                description: $("businessItemDescription").value.trim(),
                [state.editingProduct ? "price" : "priceFrom"]: price,
                photos: state.editingItemPhotos
            };

            if(state.editingProduct)Object.assign(body,{category:$('businessProductCategory').value,availability:$('businessProductAvailability').value,orderTelegram:$('businessProductTelegram').value,orderViber:$('businessProductViber').value,orderChat:$('businessProductChat').checked});
            await api(
                `/api/business/${resource}${id ? "/" + encodeURIComponent(id) : ""}`,
                {
                    method: id ? "PATCH" : "POST",
                    body: JSON.stringify(body)
                }
            );

            closeModal("businessItemModal");
            await refreshOwnerProfile();
        } catch (e) {
            error.textContent = e.message;
        }
    }

    async function savePortfolio(event) {
        event.preventDefault();
    
        const error =
            $("businessPortfolioFormError");
    
        error.textContent = "";
    
        try {
            const mediaType =
                $("businessPortfolioType").value;
    
            let mediaUrl = "";
    
            if (mediaType === "image") {
                mediaUrl =
                    state.editingPortfolioImage || "";
    
                if (!mediaUrl) {
                    throw new Error(
                        "Оберіть фото."
                    );
                }
            } else {
                mediaUrl = await uploadGarageVideo($("businessPortfolioCamera")?.files[0] || $("businessPortfolioVideoUrl").files[0]);
            }
    
            await api(
                "/api/business/portfolio",
                {
                    method: "POST",
                    body: JSON.stringify({
                        mediaType,
                        mediaUrl,
                        description:
                            $("businessPortfolioDescription")
                                .value
                                .trim()
                    })
                }
            );
    
            state.editingPortfolioImage =
                null;
    
            closeModal(
                "businessPortfolioModal"
            );
    
            await refreshOwnerProfile();
    
        } catch (e) {
            error.textContent =
                e.message;
        }
    }

    async function deleteItem(id, product) {
        if (!confirm(product ? "Видалити товар?" : "Видалити послугу?")) return;
        const resource = product ? "products" : "services";

        try {
            await api(`/api/business/${resource}/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
            await refreshOwnerProfile();
        } catch (error) {
            alert(error.message);
        }
    }

    async function deletePortfolioItem(id) {
        if (!confirm("Видалити цю роботу з портфоліо?")) {
            return;
        }
    
        try {
            await api(
                `/api/business/portfolio/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );
    
            await refreshOwnerProfile();
    
        } catch (error) {
            alert(
                error.message ||
                "Не вдалося видалити роботу."
            );
        }
    }

    async function refreshOwnerProfile() {
        const data = await api("/api/business/profile");
        await renderProfile(data.profile);
    }

    async function sendVerificationEmail() {
        try {
            const data = await api("/api/resend-verification-email", {
                method: "POST",
                headers: { Authorization: "" },
                body: JSON.stringify({ email: state.profile.email })
            });
            alert(data.message || "Лист надіслано.");
        } catch (error) {
            alert(error.message);
        }
    }

    async function sendPhoneCode() {
        try {
            const data = await api("/api/phone/send-code", {
                method: "POST",
                body: JSON.stringify({})
            });
            alert(data.message || "Код надіслано.");
            $("businessPhoneCodeForm").hidden = false;
            $("businessPhoneCode").focus();
        } catch (error) {
            $("businessPhoneFormError").textContent = error.message;
        }
    }

    async function verifyPhoneCode(event) {
        event.preventDefault();

        try {
            const data = await api("/api/phone/verify-code", {
                method: "POST",
                body: JSON.stringify({ code: $("businessPhoneCode").value.trim() })
            });
            if (data.registrationCompleted && typeof gtag === "function") gtag("event", "sign_up", { method: "email" });
            closeModal("businessPhoneModal");
            await refreshOwnerProfile();
        } catch (error) {
            $("businessPhoneFormError").textContent = error.message;
        }
    }

    function updateRequestCount(count) {
        $("businessRequestsCount").textContent = count || "";
        $("businessRequestsBell").setAttribute("aria-label", count ? `Заявки на обслуговування · ${count} нових` : "Заявки на обслуговування");
    }

    async function refreshRequestCount() {
        if ($("businessRequestsBell").hidden || document.hidden) return;
        try {
            const data = await api("/api/business/requests?count=1");
            updateRequestCount(data.pending);
        } catch (error) {
            console.error("Business requests badge:", error);
        }
    }

    function assignmentForm(request, employees) {
        const form = document.createElement("form");
        form.className = "business-form";
        form.innerHTML = `<label>Дата й час<input name="scheduledAt" type="datetime-local" required></label>
            <label>Майстер<select name="employeeId" required><option value="">Оберіть майстра</option></select></label>
            <label>Тривалість, хв<input name="duration" type="number" min="1" max="1440" value="60" required></label>
            <button class="business-primary-button" type="submit">Підтвердити й додати в CRM</button>
            <p role="status"></p>`;
        const select = form.elements.employeeId;
        for (const employee of employees) select.add(new Option(employee.name, employee.id));
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const button = form.querySelector("button");
            const status = form.querySelector("[role=status]");
            button.disabled = true;
            status.textContent = "Зберігаємо…";
            try {
                await api(`/api/business/requests/${encodeURIComponent(request.id)}/confirm`, {
                    method: "POST", body: JSON.stringify({
                        scheduledAt: new Date(form.elements.scheduledAt.value).toISOString(),
                        employeeId: select.value,
                        durationMinutes: Number(form.elements.duration.value)
                    })
                });
                await loadBusinessRequests();
            } catch (error) {
                status.textContent = error.message;
                button.disabled = false;
            }
        });
        return form;
    }

    async function loadBusinessRequests(page = 0) {
        const root = $("businessRequestsList");
        const status = $("businessRequestsStatus");
        const setup = $("businessRequestsCrmSetup");
        const more = $("businessRequestsMore");
        const refresh = $("businessRequestsRefresh");
        more.disabled = refresh.disabled = true;
        status.textContent = "Завантажуємо…";
        setup.hidden = true;
        try {
            const data = await api(`/api/business/requests?page=${page}`);
            let employees = [];
            if (data.requests.some(request => request.status === "pending")) {
                try {
                    const team = await api("/api/crm/employees");
                    employees = team.employees.filter(employee => employee.status === "active");
                } catch (error) {
                    if (error.status !== 404) throw error;
                }
                setup.hidden = employees.length > 0;
            }
            const cards = document.createDocumentFragment();
            for (const request of data.requests) {
                const card = document.createElement("article");
                card.className = "business-info-card";
                const title = document.createElement("strong");
                title.textContent = `${request.name} · ${request.brand} ${request.model}`;
                const details = document.createElement("p");
                details.style.whiteSpace = "pre-line";
                details.textContent = [
                    `Подано: ${new Date(request.created_at).toLocaleString("uk-UA")}`,
                    `Телефон: ${request.phone}`, `Держномер: ${request.plate || "—"}`,
                    `VIN: ${request.vin || "—"}`, `Рік: ${request.year ?? "—"}`,
                    `Пробіг, км: ${request.mileage ?? "—"}`, `Двигун: ${request.engine || "—"}`,
                    `Паливо: ${request.fuel || "—"}`, `Коробка: ${request.transmission || "—"}`,
                    `Причина звернення: ${request.reason}`,
                    request.status === "confirmed" ? "Підтверджено" : "Очікує підтвердження",
                    request.scheduled_at ? `Запис: ${new Date(request.scheduled_at).toLocaleString("uk-UA")}` : "",
                    request.employee_name ? `Майстер: ${request.employee_name}` : ""
                ].filter(Boolean).join("\n");
                const call = document.createElement("a");
                call.href = `tel:${String(request.phone).replace(/[^+0-9]/g, "")}`;
                call.textContent = "Зателефонувати";
                call.className = "business-inline-link";
                const importStatus = document.createElement("p");
                importStatus.setAttribute("role", "status");
                let importing = false;
                call.addEventListener("click", async event => {
                    event.preventDefault();
                    if (importing) return;
                    importing = true;
                    importStatus.textContent = "Зберігаємо клієнта й автомобіль у CRM…";
                    try {
                        await api(`/api/business/requests/${encodeURIComponent(request.id)}/contact`, { method: "POST" });
                        importStatus.textContent = "Клієнта й автомобіль збережено в CRM.";
                        window.location.href = call.href;
                    } catch (error) {
                        importStatus.textContent = error.message;
                    } finally { importing = false; }
                });
                card.append(title, details, call, importStatus);
                const mediaDetails = document.createElement("details");
                const summary = document.createElement("summary");summary.textContent = "Фото та відео заявки";
                const mediaList = document.createElement("div");mediaDetails.append(summary,mediaList);
                mediaDetails.addEventListener("toggle",()=>{if(mediaDetails.open) window.RGRequestMedia.render(mediaList,`/api/business/requests/${encodeURIComponent(request.id)}/media`);});
                card.append(mediaDetails);
                if (request.crm_work_order_id) {
                    const order = document.createElement("a");
                    order.href = `crm-work-order.html?id=${encodeURIComponent(request.crm_work_order_id)}`;
                    order.textContent = "Відкрити наряд";
                    order.className = "business-inline-link";
                    card.append(order);
                }
                if (request.status === "pending" && employees.length) card.append(assignmentForm(request, employees));
                cards.append(card);
            }
            if (!page) root.replaceChildren();
            root.append(cards);
            requestsPage = page;
            more.hidden = !data.hasMore;
            updateRequestCount(data.pending);
            status.textContent = data.requests.length ? "" : "Заявок поки немає.";
        } catch (error) {
            status.textContent = error.message;
        } finally {
            more.disabled = refresh.disabled = false;
        }
    }

    function bindEvents() {
        $("businessRequestsBell").addEventListener("click", () => {
            openModal("businessRequestsModal");
            loadBusinessRequests();
        });
        $("businessRequestsRefresh").addEventListener("click", () => loadBusinessRequests());
        $("businessRequestsMore").addEventListener("click", () => loadBusinessRequests(requestsPage + 1));
        document.addEventListener("visibilitychange", refreshRequestCount);
        setInterval(refreshRequestCount, 30000);
        $("businessAddProductQuick").addEventListener("click", () => openItemModal(null, true));
        $("businessPlanButton").addEventListener("click", async () => {
            if (!state.profile?.planId || state.profile.complimentarySubscription) return;
            try {
                const data = await api("/api/payments/liqpay/create", {
                    method: "POST", body: JSON.stringify({ planId: state.profile.planId })
                });
                submitRegistrationLiqPay(data);
            } catch (error) {
                alert(error.message);
            }
        });
        $("businessManageButton")?.addEventListener("click", () => {
            $("businessOwnerPanel").hidden = false;
            $("businessOwnerPanel").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        $("businessOwnerPanelClose")?.addEventListener("click", () => {
            $("businessOwnerPanel").hidden = true;
        });

        $("businessCrmButton")?.addEventListener("click", () => {
            window.location.href = "crm.html";
        });
        $("businessEditProfileButton")?.addEventListener("click", () => {
            fillProfileForm();
            openModal("businessProfileModal");
        });

        $("businessAddServiceButton")?.addEventListener("click", () => openItemModal());
        $("businessAddServiceQuick")?.addEventListener("click", () => openItemModal());
        $("businessDescriptionToggle")?.addEventListener("click", () => {
            const desc = $("businessDescription"), button = $("businessDescriptionToggle");
            const collapsed = desc.classList.toggle("business-description-clamped");
            button.textContent = collapsed ? "Читати більше ↓" : "Згорнути ↑";
        });
        $("businessBookingButton")?.addEventListener("click", () => openModal("businessBookingModal"));
        $("businessBookingForm")?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.currentTarget, button = form.querySelector('[type="submit"]');
            const status = $("businessBookingStatus");
            const ownerId = state.profile?.ownerId;
            if (!ownerId) { status.textContent = "Компанію не знайдено"; return; }
            const values = Object.fromEntries(new FormData(form).entries());
            button.disabled = true; status.textContent = "Надсилання…";
            try {
                values.attachments = await window.RGRequestMedia.collect(form);
                await api(`/api/businesses/${encodeURIComponent(ownerId)}/requests`, { method:"POST", body:JSON.stringify(values) });
                status.textContent = "Заявку надіслано. СТО зв'яжеться з вами для узгодження часу.";
                form.reset();
            } catch (err) { status.textContent = err.message || "Не вдалося надіслати заявку"; }
            finally { button.disabled = false; }
        });

        $("businessAddPortfolioButton")?.addEventListener("click", () => {
            state.editingPortfolioImage = null;
        
            $("businessPortfolioForm").reset();
            $("businessPortfolioType").value = "image";
            $("businessPortfolioImageField").hidden = false;
            $("businessPortfolioVideoField").hidden = true;
            $("businessPortfolioFormError").textContent = "";
        
            openModal("businessPortfolioModal");
        });
        
        $("businessPortfolioType")?.addEventListener("change", () => {
            const isVideo =
                $("businessPortfolioType").value === "video";
        
            $("businessPortfolioImageField").hidden =
                isVideo;
        
            $("businessPortfolioVideoField").hidden =
                !isVideo;
        
            if (isVideo) {
                state.editingPortfolioImage = null;
                $("businessPortfolioImageInput").value = "";
            } else {
                $("businessPortfolioVideoUrl").value = "";
            }
        });

        $("businessWriteReviewButton")?.addEventListener(
            "click",
            () => {
                if (!token()) {
                    alert(
                        "Щоб написати відгук, спочатку увійдіть у профіль."
                    );
                    return;
                }
        
                $("businessReviewRating").value = "";
                $("businessReviewText").value = "";
                $("businessReviewFormError").textContent = "";
        
                openModal(
                    "businessReviewModal"
                );
            }
        );

        $("businessVerifyEmailButton")?.addEventListener("click", sendVerificationEmail);
        $("businessVerifyPhoneButton")?.addEventListener("click", () => {
            $("businessPhoneCodeForm").hidden = true;
            $("businessPhoneFormError").textContent = "";
            openModal("businessPhoneModal");
        });

        $("businessProfileForm")?.addEventListener("submit", saveProfile);
        $("businessItemForm")?.addEventListener("submit", saveItem);
        $("businessPortfolioForm")?.addEventListener(
            "submit",
            savePortfolio
        );
        $("businessReviewForm")?.addEventListener(
            "submit",
            saveBusinessReview
        );
        $("businessSendPhoneCodeButton")?.addEventListener("click", sendPhoneCode);
        $("businessPhoneCodeForm")?.addEventListener("submit", verifyPhoneCode);

        $("businessLogoInput")?.addEventListener("change", async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
                state.editingLogo = await compressImage(file, 900, 0.84);
                renderLogoEditPreview();
            } catch (error) {
                $("businessProfileFormError").textContent = error.message;
            }
        });

        $("businessPortfolioImageInput")?.addEventListener(
            "change",
            async (event) => {
                const file =
                    event.target.files?.[0];
        
                if (!file) {
                    state.editingPortfolioImage = null;
                    return;
                }
        
                try {
                    state.editingPortfolioImage =
                        await compressImage(
                            file,
                            1200,
                            0.82
                        );
        
                    $("businessPortfolioFormError").textContent =
                        "";
                } catch (error) {
                    state.editingPortfolioImage = null;
        
                    $("businessPortfolioFormError").textContent =
                        error.message;
                }
            }
        );

        let failedProductFiles=[];
        async function uploadItems(files){
            if(state.itemUploading||!files.length)return;
            const errors=[];
            const input=$('businessItemPhotosInput'),save=$('businessItemForm').querySelector('[type=submit]'),progress=$('businessUploadProgress'),retry=$('businessUploadRetry'),status=$('businessItemFormError');
            if(files.length>MAX_ITEM_PHOTOS-state.editingItemPhotos.length){status.textContent=`Максимум ${MAX_ITEM_PHOTOS} файлів.`;return;}
            state.itemUploading=true;input.disabled=true;save.disabled=true;retry.hidden=true;failedProductFiles=[];
            for(const file of files){
                status.textContent='Підготовка: '+file.name;progress.hidden=false;progress.removeAttribute('value');
                try{const url=await window.RGServiceGallery.upload(file,state.editingProduct?percent=>{progress.value=percent;status.textContent=file.name+': '+percent+'%'+(percent===100?' — обробка сервером…':'');}:undefined);state.editingItemPhotos.push(url);renderItemPhotosPreview();}
                catch(error){failedProductFiles.push(file);errors.push(file.name+': '+error.message);status.textContent=error.message;}
            }
            progress.hidden=true;input.value='';input.disabled=false;state.itemUploading=false;save.disabled=false;
            retry.hidden=!failedProductFiles.length;
            status.textContent=failedProductFiles.length?errors.join(' • ')+'. Повторіть або виберіть файли з пам’яті пристрою повторно.':'Файли завантажено. Збережіть '+(state.editingProduct?'товар.':'послугу.');
        }
        $('businessItemPhotosInput')?.addEventListener('change',e=>uploadItems(Array.from(e.target.files||[])));
        $('businessUploadRetry')?.addEventListener('click',()=>uploadItems([...failedProductFiles]));

        document.addEventListener("click", (event) => {
            const close = event.target.closest("[data-close-modal]");
            if (close) closeModal(close.dataset.closeModal);

            const removePhoto = event.target.closest("[data-remove-photo]");
            if (removePhoto) {
                state.editingItemPhotos.splice(Number(removePhoto.dataset.removePhoto), 1);
                renderItemPhotosPreview();
            }

            const edit = event.target.closest("[data-edit-item]");
            if (edit) {
                const product = edit.dataset.product === "true";
                const items = product ? state.profile.products : state.profile.services;
                const item = items?.find(entry => entry.id === edit.dataset.editItem);
                if (item) openItemModal(item, product);
            }
            const del = event.target.closest("[data-delete-item]");
            if (del) deleteItem(del.dataset.deleteItem, del.dataset.product === "true");
            const portfolioDelete =
    event.target.closest(
        "[data-portfolio-delete]"
    );

if (portfolioDelete) {
    deletePortfolioItem(
        portfolioDelete.dataset
            .portfolioDelete
    );
}
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            document
                .querySelectorAll(".business-modal:not([hidden])")
                .forEach((modal) => closeModal(modal.id));
        });
    }

    async function init() {
        bindEvents();
        await loadProfile();
        if (new URLSearchParams(location.search).get('notifications') === 'requests' && !$("businessRequestsBell").hidden) {
            openModal("businessRequestsModal");
            await loadBusinessRequests();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

