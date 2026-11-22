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
                    `Реєстрація: ${date(business.createdAt)}`, `Доступ: ${expiry}`, `Відкриті скарги: ${business.openComplaints}`
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
                row.append(details, link, businessActions(business), businessComplaints(business));
                result.append(row);
            }
        } catch (error) {
            status.textContent = error.message;
        } finally {
            submit.disabled = previous.disabled = next.disabled = false;
        }
    }

    function businessActions(business) {
        const panel = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Керування доступом і журнал";
        panel.append(summary);

        const actions = document.createElement("form");
        actions.className = "royal-auto-admin-form";
        const action = document.createElement("select");
        action.setAttribute("aria-label", "Дія з тарифом");
        const names = {
            standard: "Призначити стандартний тариф",
            promotion: "Призначити акційний доступ",
            grant_complimentary: "Надати безкоштовно назавжди",
            revoke_complimentary: "Скасувати безстроковий доступ"
        };
        for (const key of ["standard", "promotion", business.complimentarySubscription ? "revoke_complimentary" : "grant_complimentary"]) {
            action.add(new Option(names[key], key));
        }
        const plan = document.createElement("select");
        plan.setAttribute("aria-label", "Тариф");
        const until = document.createElement("input");
        until.type = "datetime-local";
        until.setAttribute("aria-label", "Дата завершення акції");
        const reason = document.createElement("input");
        reason.required = true;
        reason.maxLength = 500;
        reason.placeholder = "Причина зміни";
        reason.setAttribute("aria-label", "Причина зміни");
        const submit = document.createElement("button");
        submit.textContent = "Застосувати";
        submit.className = "upholstery-primary-button";
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        const history = document.createElement("ul");
        const toggleFields = () => {
            plan.hidden = action.value !== "standard";
            plan.disabled = plan.hidden;
            until.hidden = action.value !== "promotion";
            until.disabled = until.hidden;
            until.required = !until.hidden;
        };
        action.addEventListener("change", toggleFields);
        toggleFields();

        let loaded = false;
        panel.addEventListener("toggle", async () => {
            if (!panel.open || loaded) return;
            try {
                const [options, audit] = await Promise.all([
                    adminApi(`/api/admin/business-plans?category=${encodeURIComponent(business.category || "")}`),
                    adminApi(`/api/admin/businesses/${encodeURIComponent(business.id)}/audit`)
                ]);
                plan.replaceChildren(new Option("Оберіть тариф", ""), ...options.plans.map(item => new Option(item.name, item.id)));
                plan.required = true;
                const entries = audit.entries.map(entry => {
                    const item = document.createElement("li");
                    item.textContent = `${date(entry.createdAt)} · ${names[entry.action] || entry.action} · ${entry.adminId} · ${entry.reason}`;
                    return item;
                });
                history.replaceChildren(...entries);
                loaded = true;
            } catch (error) {
                feedback.textContent = error.message;
            }
        });

        actions.addEventListener("submit", async event => {
            event.preventDefault();
            if (!loaded || !window.confirm(`Підтвердити зміну доступу для «${business.name}»?`)) return;
            submit.disabled = true;
            try {
                const body = { action: action.value, reason: reason.value, planId: plan.value };
                if (!until.disabled) body.until = new Date(until.value).toISOString();
                await adminApi(`/api/admin/businesses/${encodeURIComponent(business.id)}/access`, { method: "PATCH", body });
                await loadBusinesses(page);
                status.textContent = `Доступ для «${business.name}» оновлено. Дію збережено в журналі.`;
            } catch (error) {
                feedback.textContent = error.message;
            } finally {
                submit.disabled = false;
            }
        });
        actions.append(action, plan, until, reason, submit, feedback);
        panel.append(actions, history);
        return panel;
    }

    function businessComplaints(business) {
        const panel = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Скарги";
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        const list = document.createElement("ul");
        const statuses = { new: "Нова", reviewing: "Розглядається", resolved: "Вирішена", dismissed: "Відхилена" };
        const path = `/api/admin/businesses/${encodeURIComponent(business.id)}/complaints`;
        panel.append(summary, feedback, list);

        panel.addEventListener("toggle", async () => {
            if (!panel.open) return;
            try {
                const data = await adminApi(path);
                list.replaceChildren();
                feedback.textContent = data.complaints.length ? "" : "Скарг немає.";
                for (const complaint of data.complaints) {
                    const entry = document.createElement("li");
                    const message = document.createElement("p");
                    message.textContent = `${date(complaint.createdAt)} · ${statuses[complaint.status]} · ${complaint.explanation}`;
                    entry.append(message);
                    for (const evidence of complaint.evidence) {
                        const reference = document.createElement("p");
                        reference.textContent = evidence;
                        entry.append(reference);
                    }
                    const review = document.createElement("form");
                    const select = document.createElement("select");
                    select.setAttribute("aria-label", "Статус скарги");
                    for (const key of ["reviewing", "resolved", "dismissed"]) select.add(new Option(statuses[key], key));
                    const reason = document.createElement("input");
                    reason.setAttribute("aria-label", "Причина рішення");
                    reason.placeholder = "Причина рішення";
                    reason.required = true;
                    reason.maxLength = 500;
                    const save = document.createElement("button");
                    save.textContent = "Зберегти рішення";
                    review.append(select, reason, save);
                    review.addEventListener("submit", async event => {
                        event.preventDefault();
                        save.disabled = true;
                        try {
                            await adminApi(`${path}/${encodeURIComponent(complaint.id)}`, {
                                method: "PATCH", body: { status: select.value, reason: reason.value }
                            });
                            await loadBusinesses(page);
                        } catch (error) {
                            feedback.textContent = error.message;
                        } finally {
                            save.disabled = false;
                        }
                    });
                    entry.append(review);
                    list.append(entry);
                }
            } catch (error) {
                feedback.textContent = error.message;
            }
        });
        return panel;
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
