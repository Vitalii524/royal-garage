(() => {
    const registrationStatus = document.getElementById("adminRegistrationStatus");
    const trafficStatus = document.getElementById("adminTrafficStatus");
    const businessControls = document.getElementById("adminBusinessControls");
    const form = document.getElementById("adminBusinessSearch");
    const result = document.getElementById("adminBusinessResults");
    const status = document.getElementById("adminBusinessStatus");
    const token = localStorage.getItem("royalGarageToken");

    async function adminApi(url, { method = "GET", body } = {}) {
        const response = await fetch(url, {
            method, cache: "no-store",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        if (response.status === 401) throw new Error("Сесія недійсна або завершилася. Увійдіть повторно (401).");
        if (response.status === 403) throw new Error("Сервер не надав цьому акаунту доступ до аналітики адміністратора (403).");
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || `HTTP ${response.status}`);
        return data;
    }

    function renderStats(stats) {
        const labels = {
            created: "Створені акаунти",
            unverifiedEmail: "Непідтверджені email",
            unverifiedPhone: "Непідтверджені телефони",
            users: "Успішні реєстрації звичайних користувачів",
            businesses: "Успішні реєстрації бізнесів"
        };
        const list = document.getElementById("adminRegistrationStats");
        for (const [key, label] of Object.entries(labels)) {
            const term = document.createElement("dt");
            term.textContent = label;
            const count = document.createElement("dd");
            count.textContent = stats[key];
            list.append(term, count);
        }
    }

    async function loadSiteAnalytics() {
        const status = document.getElementById("adminTrafficStatus");
        const table = document.getElementById("adminTrafficReport");
        if (!table || !status) return;
        try {
            const data = await adminApi("/api/admin/site-analytics");
            if (!data.periods) {
                status.textContent = "GA4 ще не підключено до адмінпанелі.";
                return;
            }

            const format = new Intl.NumberFormat("uk-UA");
            for (const [key, label] of Object.entries({
                activeUsers: "Активні користувачі",
                sessions: "Сеанси",
                pageViews: "Перегляди сторінок"
            })) {
                const row = table.tBodies[0].insertRow();
                const heading = document.createElement("th");
                heading.scope = "row";
                heading.textContent = label;
                row.append(heading);
                row.insertCell().textContent = format.format(data.periods.week[key]);
                row.insertCell().textContent = format.format(data.periods.month[key]);
            }
            status.textContent = "";
            table.hidden = false;
        } catch (error) {
            status.textContent = error.message;
        }
    }

    const previous = document.getElementById("adminBusinessPrevious");
    const next = document.getElementById("adminBusinessNext");
    const dateFormat = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv" });
    const businessStatus = {
        active: "Активний", pending: "Очікує підтвердження",
        expired: "Доступ неактивний", disabled: "Акаунт обмежено"
    };
    let page = 1;
    const date = value => value ? dateFormat.format(new Date(value)) : "Не задано";

    async function loadBusinesses(targetPage = 1) {
        const filters = new URLSearchParams(new FormData(form));
        filters.set("page", targetPage);
        const submit = form.querySelector("button");
        submit.disabled = previous.disabled = next.disabled = true;
        status.textContent = "Завантажуємо…";
        try {
            const data = await adminApi(`/api/admin/businesses?${filters}`);
            const category = form.elements.category;
            const selected = filters.get("category");
            category.replaceChildren(new Option("Усі категорії", ""), ...data.categories.map(
                item => new Option(item.name, item.code)
            ));
            category.value = selected;
            page = data.page;
            previous.hidden = page <= 1;
            next.hidden = !data.hasMore;
            result.replaceChildren();
            status.textContent = data.businesses.length
                ? `Сторінка ${page} · Показано ${data.businesses.length}`
                : "За цими фільтрами бізнесів не знайдено.";
            for (const business of data.businesses) {
                const row = document.createElement("article");
                row.className = "upholstery-section";
                const heading = document.createElement("h3");
                heading.textContent = business.name;
                const details = document.createElement("p");
                const expiry = business.complimentarySubscription ? "Безстроково" : date(business.accessUntil);
                details.textContent = [
                    business.businessType || "Бізнес", businessStatus[business.status], business.planName || "Тариф не задано",
                    `Реєстрація: ${date(business.createdAt)}`, `Доступ: ${expiry}`
                ].join(" · ");
                const link = document.createElement("a");
                link.href = `seller.html?sellerId=${encodeURIComponent(business.ownerId)}`;
                link.textContent = "Публічна сторінка";
                row.append(heading);
                if (business.hasLogo && business.status === "active") {
                    const logo = document.createElement("img");
                    logo.src = `/api/businesses/${encodeURIComponent(business.ownerId)}/logo`;
                    logo.alt = "";
                    logo.width = logo.height = 48;
                    logo.loading = "lazy";
                    logo.addEventListener("error", () => logo.remove());
                    heading.prepend(logo);
                }
                const button = document.createElement("button");
                button.type = "button";
                button.className = "upholstery-primary-button";
                const refreshLabel = () => {
                    button.textContent = business.complimentarySubscription ? "Скасувати безкоштовний доступ" : "Надати безкоштовний доступ";
                };
                refreshLabel();
                button.addEventListener("click", async () => {
                    button.disabled = true;
                    try {
                        const updated = await adminApi(`/api/admin/businesses/${encodeURIComponent(business.id)}/complimentary`, {
                            method: "PATCH", body: { enabled: !business.complimentarySubscription }
                        });
                        business.complimentarySubscription = updated.business.complimentarySubscription;
                        refreshLabel();
                        status.textContent = `Доступ оновлено для «${business.name}».`;
                    } catch (error) {
                        status.textContent = error.message;
                    } finally {
                        button.disabled = false;
                    }
                });
                row.append(details, link, button);
                result.append(row);
            }
        } catch (error) {
            status.textContent = error.message;
        } finally {
            submit.disabled = previous.disabled = next.disabled = false;
        }
    }

    previous.addEventListener("click", () => loadBusinesses(page - 1));
    next.addEventListener("click", () => loadBusinesses(page + 1));
    form.addEventListener("submit", event => {
        event.preventDefault();
        loadBusinesses();
    });
    if (!token) {
        registrationStatus.textContent = trafficStatus.textContent = "Увійдіть до Royal Garage, щоб переглянути аналітику.";
        return;
    }

    loadSiteAnalytics();
    adminApi("/api/admin/registrations").then(data => {
        renderStats(data.stats);
        registrationStatus.hidden = true;
        if (data.canManageBusinesses) {
            businessControls.hidden = false;
            return loadBusinesses();
        }
    }).catch(error => {
        registrationStatus.textContent = error.message;
    });
})();
