(() => {
    "use strict";

    const MAX_ITEM_PHOTOS = 6;
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
        publicOwnerId: null,
        editingItemPhotos: [],
        editingLogo: null
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
            return window.getCurrentUser();
        }

        try {
            return JSON.parse(localStorage.getItem("royalGarageCurrentUser") || "null");
        } catch {
            return null;
        }
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
        let data = null;

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
        if (/^https?:\/\//i.test(raw)) return raw;
        return `https://t.me/${raw.replace(/^@/, "")}`;
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

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(value, prefix = "") {
        const number = Number(value);
        if (!Number.isFinite(number) || number <= 0) return "";
        return `${prefix}${Math.round(number).toLocaleString("uk-UA")} грн`;
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
        placeholder.textContent = initials(profile.name);

        if (profile.logo) {
            image.src = profile.logo;
            image.hidden = false;
            placeholder.hidden = true;
        } else {
            image.removeAttribute("src");
            image.hidden = true;
            placeholder.hidden = false;
        }
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

        for (const [key, label] of DAYS) {
            const day = schedule[key];
            const row = document.createElement("div");
            row.className = "business-schedule-row";
            row.innerHTML = `<strong>${label}</strong><span>${day.enabled ? `${escapeHtml(day.open)}–${escapeHtml(day.close)}` : "Вихідний"}</span>`;
            root.appendChild(row);
        }
    }

    function contentMode(profile) {
        const type = profile.businessTypeCode;
        if (["car_service", "detailing", "tire_service", "road_assistance"].includes(type)) return "services";
        if (type === "auto_shop") return "products";
        if (type === "car_dealer") return "cars";
        return profile.businessContentType || "services";
    }

    function renderOwnerControls(profile) {
        const panel = $("businessOwnerPanel");
        const manage = $("businessManageButton");
        panel.hidden = !state.isOwner;
        manage.hidden = !state.isOwner;
        $("businessOwnerDraftBadge").hidden = !(state.isOwner && profile.profileStatus !== "active");

        if (!state.isOwner) return;

        const active = profile.profileStatus === "active";
        $("businessProfileStatusText").textContent = active ? "Активний" : "Чернетка";
        $("businessProfileStatusHint").textContent = active
            ? "Профіль опублікований у «Партнерах»."
            : "Для публікації потрібні активний тариф, підтверджений email і телефон.";
        $("businessProfileStatusDot").classList.toggle("active", active);

        $("businessEmailStatus").textContent = profile.emailVerified ? "Підтверджено ✓" : "Не підтверджено";
        $("businessPhoneStatus").textContent = profile.phoneVerified ? "Підтверджено ✓" : "Не підтверджено";
        $("businessVerifyEmailButton").hidden = Boolean(profile.emailVerified);
        $("businessVerifyPhoneButton").hidden = Boolean(profile.phoneVerified);

        const subActive = profile.subscriptionStatus === "active";
        $("businessPlanStatus").textContent = subActive
            ? `${profile.planName || "Тариф"} — активний`
            : `${profile.planName || "Тариф"} — неактивний`;
        $("businessPlanExpires").textContent = profile.subscriptionExpiresAt
            ? `До ${formatDate(profile.subscriptionExpiresAt)}`
            : "";

        const mode = contentMode(profile);
        $("businessAddServiceButton").hidden = !(mode === "services" || mode === "both");
        $("businessAddProductButton").hidden = !(mode === "products" || mode === "both");
        $("businessAddCarButton").hidden = mode !== "cars";
    }

    function createPhotos(photos, alt) {
        const list = Array.isArray(photos) ? photos.filter(Boolean).slice(0, MAX_ITEM_PHOTOS) : [];
        if (!list.length) return "";
        return `<div class="business-card-photos">${list.map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`).join("")}</div>`;
    }

    function itemCard(item, kind) {
        const card = document.createElement("article");
        card.className = "business-content-card";
        const priceText = kind === "service"
            ? money(item.priceFrom, "від ")
            : money(item.price);

        card.innerHTML = `
            ${createPhotos(item.photos, item.title)}
            <div class="business-content-body">
                <h3>${escapeHtml(item.title || (kind === "service" ? "Послуга" : "Товар"))}</h3>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
                ${priceText ? `<span class="business-price">${priceText}</span>` : ""}
                ${state.isOwner ? `
                    <div class="business-card-owner-actions">
                        <button type="button" data-edit-kind="${kind}" data-edit-id="${escapeHtml(item.id)}">✏️ Редагувати</button>
                        <button type="button" data-delete-kind="${kind}" data-delete-id="${escapeHtml(item.id)}">🗑 Видалити</button>
                    </div>
                ` : ""}
            </div>`;
        return card;
    }

    async function renderCars(profile) {
        const root = $("businessMainGrid");
        const empty = $("businessMainEmpty");
        root.innerHTML = "";
        $("businessMainTitle").textContent = "Автомобілі у продажу";
        $("businessMainEyebrow").textContent = "Авторинок";
        empty.textContent = "Активних оголошень ще немає.";

        try {
            const data = await api("/api/market/listings", { headers: { Authorization: "" } });
            const listings = (Array.isArray(data.listings) ? data.listings : [])
                .filter((listing) => String(listing.ownerId ?? listing.owner_id) === String(profile.ownerId));

            empty.hidden = listings.length > 0;
            for (const listing of listings) {
                const photos = Array.isArray(listing.photos) ? listing.photos : [];
                const activeIndex = Number(listing.activePhotoIndex ?? listing.active_photo_index ?? 0) || 0;
                const photo = photos[activeIndex] || photos[0] || "";
                const card = document.createElement("a");
                card.className = "business-content-card";
                card.href = `listing.html?id=${encodeURIComponent(listing.id)}`;
                card.style.textDecoration = "none";
                card.innerHTML = `
                    ${photo ? `<div class="business-card-photos"><img src="${escapeHtml(photo)}" alt="${escapeHtml(listing.name || "Автомобіль")}" loading="lazy"></div>` : ""}
                    <div class="business-content-body">
                        <h3>${escapeHtml([listing.name, listing.year].filter(Boolean).join(" "))}</h3>
                        ${listing.city ? `<p>${escapeHtml(listing.city)}</p>` : ""}
                        ${money(listing.priceUsd) ? `<span class="business-price">${Math.round(Number(listing.priceUsd)).toLocaleString("uk-UA")} $</span>` : ""}
                    </div>`;
                root.appendChild(card);
            }
        } catch (error) {
            console.error("Business cars load error:", error);
            empty.hidden = false;
            empty.textContent = "Не вдалося завантажити автомобілі.";
        }
    }

    async function renderMainContent(profile) {
        const root = $("businessMainGrid");
        const empty = $("businessMainEmpty");
        root.innerHTML = "";
        empty.hidden = true;

        const mode = contentMode(profile);
        if (mode === "cars") {
            await renderCars(profile);
            return;
        }

        const services = Array.isArray(profile.services) ? profile.services : [];
        const products = Array.isArray(profile.products) ? profile.products : [];

        if (mode === "products") {
            $("businessMainTitle").textContent = "Товари";
            $("businessMainEyebrow").textContent = "Каталог";
            products.forEach((item) => root.appendChild(itemCard(item, "product")));
            empty.textContent = "Товари ще не додано.";
            empty.hidden = products.length > 0;
            return;
        }

        if (mode === "both") {
            $("businessMainTitle").textContent = "Послуги та товари";
            $("businessMainEyebrow").textContent = "Пропозиції";
            services.forEach((item) => root.appendChild(itemCard(item, "service")));
            products.forEach((item) => root.appendChild(itemCard(item, "product")));
            empty.textContent = "Пропозиції ще не додано.";
            empty.hidden = services.length + products.length > 0;
            return;
        }

        $("businessMainTitle").textContent = "Послуги";
        $("businessMainEyebrow").textContent = "Послуги";
        services.forEach((item) => root.appendChild(itemCard(item, "service")));
        empty.textContent = "Послуги ще не додано.";
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

            const reviews = Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [];
            const root = $("businessReviewsList");
            root.innerHTML = "";
            $("businessReviewsEmpty").hidden = reviews.length > 0;

            for (const review of reviews) {
                const card = document.createElement("article");
                card.className = "business-review-card";
                const stars = "⭐".repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)));
                card.innerHTML = `
                    <div class="business-review-top">
                        <strong>${escapeHtml(review.userName || "Користувач")}</strong>
                        <span>${stars}</span>
                    </div>
                    <p>${escapeHtml(review.text || "")}</p>
                    <small>${formatDate(review.updatedAt)}</small>`;
                root.appendChild(card);
            }
        } catch (error) {
            console.error("Business reviews error:", error);
        }
    }

    async function renderProfile(profile) {
        state.profile = profile;
        renderLogo(profile);
        $("businessTypeLabel").textContent = profile.businessTypeName || "Автобізнес";
        $("businessName").textContent = profile.name || "Бізнес";
        $("businessHeroDescription").textContent = profile.description || "";
        $("businessDescription").textContent = profile.description || "Опис ще не додано.";

        const cityLine = [profile.city, profile.address].filter(Boolean).join(" · ");
        $("businessCityLine").textContent = cityLine ? `📍 ${cityLine}` : "";
        $("businessCityLine").hidden = !cityLine;
        $("businessAddress").textContent = [profile.city, profile.address].filter(Boolean).join(", ") || "Не вказано";

        renderContacts(profile);
        renderSchedule(profile);
        renderOwnerControls(profile);
        await renderMainContent(profile);
        loadReviews(profile.ownerId);

        document.title = `${profile.name || "Бізнес"} | Royal Garage`;
    }

    async function loadProfile() {
        const params = new URLSearchParams(location.search);
        state.publicOwnerId = params.get("id");
        state.isOwner = !state.publicOwnerId;

        if (state.isOwner && !token()) {
            location.href = "index.html";
            return;
        }

        try {
            const data = state.isOwner
                ? await api("/api/business/profile")
                : await api(`/api/business/profiles/${encodeURIComponent(state.publicOwnerId)}`, { headers: { Authorization: "" } });

            await renderProfile(data.profile);
            $("businessPageLoading").hidden = true;
            $("businessPageError").hidden = true;
            $("businessPageContent").hidden = false;
        } catch (error) {
            console.error("Business profile load error:", error);
            setPageError(error.status === 404
                ? "Бізнес-профіль не знайдено або він ще не опублікований."
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
        const p = state.profile;
        $("businessEditName").value = p.name || "";
        $("businessEditCity").value = p.city || "";
        $("businessEditAddress").value = p.address || "";
        $("businessEditPhone").value = p.phone || "";
        $("businessEditTelegram").value = p.telegram || "";
        $("businessEditInstagram").value = p.instagram || "";
        $("businessEditDescription").value = p.description || "";
        $("businessProfileFormError").textContent = "";
        state.editingLogo = p.logo || null;
        renderLogoEditPreview();

        const otherField = $("businessOtherContentTypeField");
        otherField.hidden = p.businessTypeCode !== "other";
        if (!otherField.hidden) {
            const value = p.businessContentType || "services";
            const radio = document.querySelector(`input[name="businessContentType"][value="${value}"]`);
            if (radio) radio.checked = true;
        }
        setupScheduleEditor();
    }

    function renderLogoEditPreview() {
        const root = $("businessLogoEditPreview");
        root.innerHTML = state.editingLogo ? `<img src="${escapeHtml(state.editingLogo)}" alt="Логотип">` : "";
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

            if (state.profile.businessTypeCode === "other") {
                body.businessContentType = document.querySelector('input[name="businessContentType"]:checked')?.value || "services";
            }

            const data = await api("/api/business/profile", {
                method: "PATCH",
                body: JSON.stringify(body)
            });

            state.profile = data.profile;
            closeModal("businessProfileModal");
            await renderProfile(state.profile);
        } catch (e) {
            error.textContent = e.message;
        }
    }

    function findItem(kind, id) {
        const list = kind === "service" ? state.profile.services : state.profile.products;
        return (Array.isArray(list) ? list : []).find((item) => String(item.id) === String(id));
    }

    function openItemModal(kind, item = null) {
        $("businessItemKind").value = kind;
        $("businessItemId").value = item?.id || "";
        $("businessItemTitle").value = item?.title || "";
        $("businessItemDescription").value = item?.description || "";
        $("businessItemPrice").value = kind === "service" ? (item?.priceFrom || "") : (item?.price || "");
        $("businessItemModalTitle").textContent = `${item ? "Редагувати" : "Додати"} ${kind === "service" ? "послугу" : "товар"}`;
        $("businessItemPriceLabel").firstChild.textContent = kind === "service" ? "Ціна від, грн\n" : "Ціна, грн\n";
        $("businessItemFormError").textContent = "";
        $("businessItemPhotosInput").value = "";
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
            item.innerHTML = `<img src="${escapeHtml(src)}" alt="Фото"><button type="button" data-remove-photo="${index}" aria-label="Видалити">×</button>`;
            root.appendChild(item);
        });
    }

    async function saveItem(event) {
        event.preventDefault();
        const kind = $("businessItemKind").value;
        const id = $("businessItemId").value;
        const error = $("businessItemFormError");
        error.textContent = "";

        try {
            const price = Number($("businessItemPrice").value || 0);
            const body = {
                title: $("businessItemTitle").value.trim(),
                description: $("businessItemDescription").value.trim(),
                photos: state.editingItemPhotos
            };

            if (kind === "service") body.priceFrom = price > 0 ? price : null;
            else body.price = price > 0 ? price : null;

            const base = kind === "service" ? "/api/business/services" : "/api/business/products";
            await api(id ? `${base}/${encodeURIComponent(id)}` : base, {
                method: id ? "PATCH" : "POST",
                body: JSON.stringify(body)
            });

            closeModal("businessItemModal");
            await refreshOwnerProfile();
        } catch (e) {
            error.textContent = e.message;
        }
    }

    async function deleteItem(kind, id) {
        if (!confirm(`Видалити ${kind === "service" ? "послугу" : "товар"}?`)) return;
        const base = kind === "service" ? "/api/business/services" : "/api/business/products";
        try {
            await api(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
            await refreshOwnerProfile();
        } catch (error) {
            alert(error.message);
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
            const data = await api("/api/phone/send-code", { method: "POST", body: JSON.stringify({}) });
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
            await api("/api/phone/verify-code", {
                method: "POST",
                body: JSON.stringify({ code: $("businessPhoneCode").value.trim() })
            });
            closeModal("businessPhoneModal");
            await refreshOwnerProfile();
        } catch (error) {
            $("businessPhoneFormError").textContent = error.message;
        }
    }

    async function openPlanModal() {
        $("businessPlanModalError").textContent = "";
        $("businessPlansList").innerHTML = "Завантаження…";
        openModal("businessPlanModal");

        try {
            const data = await api(`/api/business/plans?type=${encodeURIComponent(state.profile.businessTypeCode)}`, { headers: { Authorization: "" } });
            const plans = Array.isArray(data.plans) ? data.plans : [];
            const root = $("businessPlansList");
            root.innerHTML = "";

            for (const plan of plans) {
                const card = document.createElement("div");
                card.className = "business-plan-card";
                card.innerHTML = `
                    <div><strong>${escapeHtml(plan.name)}</strong><p>${Number(plan.priceUah || 0).toLocaleString("uk-UA")} грн / 30 днів</p></div>
                    <button class="business-primary-button" type="button" data-pay-plan="${escapeHtml(plan.id)}">Оплатити</button>`;
                root.appendChild(card);
            }
        } catch (error) {
            $("businessPlanModalError").textContent = error.message;
        }
    }

    async function payPlan(planId) {
        try {
            const data = await api("/api/payments/liqpay/create", {
                method: "POST",
                body: JSON.stringify({ planId })
            });
            submitLiqPay(data);
        } catch (error) {
            $("businessPlanModalError").textContent = error.message;
        }
    }

    function submitLiqPay(data) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.checkoutUrl;
        form.innerHTML = `
            <input type="hidden" name="data" value="${escapeHtml(data.data)}">
            <input type="hidden" name="signature" value="${escapeHtml(data.signature)}">`;
        document.body.appendChild(form);
        form.submit();
    }

    function bindEvents() {
        $("businessManageButton")?.addEventListener("click", () => {
            $("businessOwnerPanel").hidden = false;
            $("businessOwnerPanel").scrollIntoView({ behavior: "smooth", block: "start" });
        });
        $("businessOwnerPanelClose")?.addEventListener("click", () => { $("businessOwnerPanel").hidden = true; });

        $("businessEditProfileButton")?.addEventListener("click", () => {
            fillProfileForm();
            openModal("businessProfileModal");
        });
        $("businessAddServiceButton")?.addEventListener("click", () => openItemModal("service"));
        $("businessAddProductButton")?.addEventListener("click", () => openItemModal("product"));
        $("businessVerifyEmailButton")?.addEventListener("click", sendVerificationEmail);
        $("businessVerifyPhoneButton")?.addEventListener("click", () => {
            $("businessPhoneCodeForm").hidden = true;
            $("businessPhoneFormError").textContent = "";
            openModal("businessPhoneModal");
        });
        $("businessPlanButton")?.addEventListener("click", openPlanModal);

        $("businessProfileForm")?.addEventListener("submit", saveProfile);
        $("businessItemForm")?.addEventListener("submit", saveItem);
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

        $("businessItemPhotosInput")?.addEventListener("change", async (event) => {
            const files = Array.from(event.target.files || []);
            const free = MAX_ITEM_PHOTOS - state.editingItemPhotos.length;
            if (files.length > free) {
                $("businessItemFormError").textContent = `Можна додати максимум ${MAX_ITEM_PHOTOS} фото.`;
            }

            for (const file of files.slice(0, Math.max(0, free))) {
                try {
                    state.editingItemPhotos.push(await compressImage(file));
                } catch (error) {
                    $("businessItemFormError").textContent = error.message;
                }
            }
            renderItemPhotosPreview();
            event.target.value = "";
        });

        document.addEventListener("click", (event) => {
            const close = event.target.closest("[data-close-modal]");
            if (close) closeModal(close.dataset.closeModal);

            const removePhoto = event.target.closest("[data-remove-photo]");
            if (removePhoto) {
                state.editingItemPhotos.splice(Number(removePhoto.dataset.removePhoto), 1);
                renderItemPhotosPreview();
            }

            const edit = event.target.closest("[data-edit-kind][data-edit-id]");
            if (edit) openItemModal(edit.dataset.editKind, findItem(edit.dataset.editKind, edit.dataset.editId));

            const del = event.target.closest("[data-delete-kind][data-delete-id]");
            if (del) deleteItem(del.dataset.deleteKind, del.dataset.deleteId);

            const pay = event.target.closest("[data-pay-plan]");
            if (pay) payPlan(pay.dataset.payPlan);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            document.querySelectorAll(".business-modal:not([hidden])").forEach((modal) => closeModal(modal.id));
        });

        const top = $("businessBackToTop");
        window.addEventListener("scroll", () => top?.classList.toggle("visible", window.scrollY > 500));
        top?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    async function init() {
        bindEvents();
        const current = getStoredUser();
        if (!new URLSearchParams(location.search).get("id") && current) {
            const accountType = current.accountType || current.account_type;
            if (accountType !== "business") {
                setPageError("Ця сторінка доступна для бізнес-акаунта.");
                return;
            }
        }
        await loadProfile();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
