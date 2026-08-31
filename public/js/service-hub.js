(() => {
    "use strict";

    const SERVICE_HUB_OWNER_ID = "d2363e3d-4723-4755-9030-594cd3ccd6f0";
    const DEFAULT_SERVICE_HUB_LOGO = "images/service-hub-logo.jpg";
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
            const user = window.getCurrentUser();
            if (user) return user;
        }

        try {
            return JSON.parse(localStorage.getItem("royalGarageCurrentUser") || "null");
        } catch {
            return null;
        }
    }

    function isServiceHubOwner() {
        const user = getStoredUser();
        const userId = user?.id ?? user?.userId ?? user?.user_id;
        return Boolean(token() && userId && String(userId) === SERVICE_HUB_OWNER_ID);
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
        const parts = String(name || "SERVICE HUB")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2);

        return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "SH";
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
        const source = String(profile.logo || "").trim() || DEFAULT_SERVICE_HUB_LOGO;

        placeholder.textContent = initials(profile.name);
        image.dataset.fallbackTried = "";
        image.onerror = () => {
            if (!image.dataset.fallbackTried && source !== DEFAULT_SERVICE_HUB_LOGO) {
                image.dataset.fallbackTried = "1";
                image.src = DEFAULT_SERVICE_HUB_LOGO;
                return;
            }

            image.hidden = true;
            placeholder.hidden = false;
        };

        image.src = source;
        image.alt = profile.name || "SERVICE HUB LVIV";
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

        manage.hidden = !state.isOwner;
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

    function serviceCard(service) {
        const card = document.createElement("article");
        card.className = "business-content-card";
        const priceText = money(service.priceFrom);

        card.innerHTML = `
            ${createPhotos(service.photos, service.title)}
            <div class="business-content-body">
                <h3>${escapeHtml(service.title || "Послуга")}</h3>
                ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
                ${priceText ? `<span class="business-price">${priceText}</span>` : ""}
                ${state.isOwner ? `
                    <div class="business-card-owner-actions">
                        <button type="button" data-edit-service="${escapeHtml(service.id)}">✏️ Редагувати</button>
                        <button type="button" data-delete-service="${escapeHtml(service.id)}">🗑 Видалити</button>
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
        services.forEach((service) => root.appendChild(serviceCard(service)));
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
            console.error("Service Hub reviews error:", error);
        }
    }

    async function renderProfile(profile) {
        state.profile = profile;
        renderLogo(profile);

        $("businessTypeLabel").textContent = profile.businessTypeName || "СТО / автосервіс";
        $("businessName").textContent = profile.name || "SERVICE HUB LVIV";
        $("businessHeroDescription").textContent = profile.description || "";
        $("businessDescription").textContent = profile.description || "Опис ще не додано.";

        const cityLine = [profile.city, profile.address].filter(Boolean).join(" · ");
        $("businessCityLine").textContent = cityLine ? `📍 ${cityLine}` : "";
        $("businessCityLine").hidden = !cityLine;
        $("businessAddress").textContent = [profile.city, profile.address].filter(Boolean).join(", ") || "Не вказано";

        renderContacts(profile);
        renderSchedule(profile);
        renderOwnerControls(profile);
        renderServices(profile);
        loadReviews(profile.ownerId || SERVICE_HUB_OWNER_ID);

        document.title = `${profile.name || "SERVICE HUB LVIV"} | Royal Garage`;
    }

    async function loadProfile() {
        state.isOwner = isServiceHubOwner();

        try {
            const data = state.isOwner
                ? await api("/api/business/profile")
                : await api(`/api/business/profiles/${encodeURIComponent(SERVICE_HUB_OWNER_ID)}`, {
                    headers: { Authorization: "" }
                });

            if (String(data.profile?.ownerId || "") !== SERVICE_HUB_OWNER_ID) {
                throw new Error("Профіль SERVICE HUB LVIV не знайдено.");
            }

            await renderProfile(data.profile);
            $("businessPageLoading").hidden = true;
            $("businessPageError").hidden = true;
            $("businessPageContent").hidden = false;
        } catch (error) {
            console.error("Service Hub profile load error:", error);
            setPageError(
                error.status === 404
                    ? "Профіль SERVICE HUB LVIV ще не опублікований."
                    : error.message
            );
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
        const source = state.editingLogo || DEFAULT_SERVICE_HUB_LOGO;
        root.innerHTML = `<img src="${escapeHtml(source)}" alt="Логотип SERVICE HUB LVIV">`;
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

    function findService(id) {
        const list = Array.isArray(state.profile?.services) ? state.profile.services : [];
        return list.find((service) => String(service.id) === String(id));
    }

    function openServiceModal(service = null) {
        $("businessItemId").value = service?.id || "";
        $("businessItemTitle").value = service?.title || "";
        $("businessItemDescription").value = service?.description || "";
        $("businessItemPrice").value = service?.priceFrom || "";
        $("businessItemModalTitle").textContent = service ? "Редагувати послугу" : "Додати послугу";
        $("businessItemFormError").textContent = "";
        $("businessItemPhotosInput").value = "";
        state.editingItemPhotos = Array.isArray(service?.photos) ? [...service.photos] : [];
        renderItemPhotosPreview();
        openModal("businessItemModal");
    }

    function renderItemPhotosPreview() {
        const root = $("businessItemPhotosPreview");
        root.innerHTML = "";

        state.editingItemPhotos.forEach((src, index) => {
            const item = document.createElement("div");
            item.className = "business-photo-preview-item";
            item.innerHTML = `<img src="${escapeHtml(src)}" alt="Фото послуги"><button type="button" data-remove-photo="${index}" aria-label="Видалити">×</button>`;
            root.appendChild(item);
        });
    }

    async function saveService(event) {
        event.preventDefault();
        const id = $("businessItemId").value;
        const error = $("businessItemFormError");
        error.textContent = "";

        try {
            const price = Number($("businessItemPrice").value || 0);
            const body = {
                title: $("businessItemTitle").value.trim(),
                description: $("businessItemDescription").value.trim(),
                priceFrom: price > 0 ? price : null,
                photos: state.editingItemPhotos
            };

            await api(
                id
                    ? `/api/business/services/${encodeURIComponent(id)}`
                    : "/api/business/services",
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

    async function deleteService(id) {
        if (!confirm("Видалити послугу?")) return;

        try {
            await api(`/api/business/services/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
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

    function bindEvents() {
        $("businessManageButton")?.addEventListener("click", () => {
            $("businessOwnerPanel").hidden = false;
            $("businessOwnerPanel").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        $("businessOwnerPanelClose")?.addEventListener("click", () => {
            $("businessOwnerPanel").hidden = true;
        });

        $("businessEditProfileButton")?.addEventListener("click", () => {
            fillProfileForm();
            openModal("businessProfileModal");
        });

        $("businessAddServiceButton")?.addEventListener("click", () => openServiceModal());
        $("businessVerifyEmailButton")?.addEventListener("click", sendVerificationEmail);
        $("businessVerifyPhoneButton")?.addEventListener("click", () => {
            $("businessPhoneCodeForm").hidden = true;
            $("businessPhoneFormError").textContent = "";
            openModal("businessPhoneModal");
        });

        $("businessProfileForm")?.addEventListener("submit", saveProfile);
        $("businessItemForm")?.addEventListener("submit", saveService);
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

            const edit = event.target.closest("[data-edit-service]");
            if (edit) openServiceModal(findService(edit.dataset.editService));

            const del = event.target.closest("[data-delete-service]");
            if (del) deleteService(del.dataset.deleteService);
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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
