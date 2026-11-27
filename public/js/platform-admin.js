(async () => {
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
        if (response.status === 403) throw new Error("Цей акаунт не має доступу до запитаної дії адміністратора (403).");
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
            const stat = document.createElement("div");
            stat.className = "platform-admin-stat";
            stat.append(term, count);
            list.append(stat);
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
        expired: "Доступ неактивний", disabled: "Акаунт обмежено",
        review: "На перевірці", restricted: "Тимчасово обмежено", blocked: "Заблоковано"
    };
    let page = 1;
    let businessRequestId = 0;
    const date = value => value ? dateFormat.format(new Date(value)) : "Не задано";

    async function loadBusinesses(targetPage = 1) {
        const requestId = ++businessRequestId;
        const filters = new URLSearchParams(new FormData(form));
        filters.set("page", targetPage);
        const submit = form.querySelector("button");
        submit.disabled = previous.disabled = next.disabled = true;
        status.textContent = "Завантажуємо…";
        try {
            const data = await adminApi(`/api/admin/businesses?${filters}`);
            if (requestId !== businessRequestId) return;
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
                row.className = "platform-admin-business";
                const heading = document.createElement("h3");
                heading.textContent = business.name;
                const details = document.createElement("dl");
                details.className = "platform-admin-business-details";
                const expiry = business.complimentarySubscription ? "Безстроково" : date(business.accessUntil);
                for (const [label, value] of [
                    ["Категорія", business.businessType || "Бізнес"],
                    ["Статус", businessStatus[business.status]],
                    ["Телефон", `${business.phone || "Не вказано"} · ${business.phoneVerified ? "Підтверджено" : "Не підтверджено"}`],
                    ["Тариф", business.planName || "Не задано"],
                    ["Реєстрація", date(business.createdAt)],
                    ["Доступ", expiry],
                    ["Відкриті скарги", business.openComplaints]
                ]) {
                    const field = document.createElement("div");
                    const term = document.createElement("dt");
                    const description = document.createElement("dd");
                    term.textContent = label;
                    description.textContent = value;
                    field.append(term, description);
                    details.append(field);
                }
                const link = document.createElement("a");
                link.href = `business-profile.html?id=${encodeURIComponent(business.ownerId)}`;
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
                row.append(details, link);
                if (!business.phoneVerified && /^380\d{9}$/.test(business.phone || "") && business.status !== "disabled") row.append(businessPhoneVerification(business));
                row.append(businessActions(business), businessComplaints(business), businessModeration(business));
                result.append(row);
            }
        } catch (error) {
            if (requestId === businessRequestId) status.textContent = error.message;
        } finally {
            if (requestId === businessRequestId) submit.disabled = previous.disabled = next.disabled = false;
        }
    }

    function businessPhoneVerification(business) {
        const panel = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Підтвердити номер телефону вручну";
        const form = document.createElement("form");
        form.className = "royal-auto-admin-form";
        const reason = document.createElement("input");
        reason.required = true;
        reason.maxLength = 500;
        reason.placeholder = "Причина підтвердження";
        reason.setAttribute("aria-label", reason.placeholder);
        const submit = document.createElement("button");
        submit.className = "upholstery-primary-button";
        submit.textContent = "Підтвердити номер телефону вручну";
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        form.append(reason, submit, feedback);
        panel.append(summary, form);
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (submit.disabled || !reason.value.trim()) {
                feedback.textContent = "Вкажіть причину підтвердження.";
                return;
            }
            if (!window.confirm("Підтвердити номер " + business.phone + " для «" + business.name + "»?")) return;
            submit.disabled = true;
            try {
                await adminApi("/api/admin/businesses/" + encodeURIComponent(business.id) + "/verify-phone", {
                    method: "PATCH", body: { phone: business.phone, reason: reason.value.trim() }
                });
                await loadBusinesses(page);
                status.textContent = "Телефон підтверджено. Дію збережено в журналі.";
            } catch (error) {
                feedback.textContent = error.message;
            } finally {
                submit.disabled = false;
            }
        });
        return panel;
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
        submit.disabled = true;
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
        let loading = false;
        panel.addEventListener("toggle", async () => {
            if (!panel.open || loaded || loading) return;
            loading = true;
            feedback.textContent = "Завантажуємо тарифи та журнал…";
            try {
                const [options, audit] = await Promise.all([
                    adminApi(`/api/admin/business-plans?category=${encodeURIComponent(business.category || "")}`),
                    adminApi(`/api/admin/businesses/${encodeURIComponent(business.id)}/audit`)
                ]);
                plan.replaceChildren(new Option("Оберіть тариф", ""), ...options.plans.map(item => new Option(item.name, item.id)));
                plan.required = true;
                const entries = audit.entries.map(entry => {
                    const item = document.createElement("li");
                    item.textContent = `${date(entry.createdAt)} · ${entry.action === "manual_phone_verification" ? "Ручне підтвердження телефону" : names[entry.action] || entry.action} · ${entry.adminId} · ${entry.reason}`;
                    return item;
                });
                history.replaceChildren(...entries);
                loaded = true;
                submit.disabled = false;
                feedback.textContent = "";
            } catch (error) {
                feedback.textContent = error.message;
            } finally {
                loading = false;
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
        const reasons = {
            fraud: "Шахрайство",
            incorrect_information: "Неправдива інформація",
            inappropriate_content: "Неприйнятний вміст",
            other: "Інше"
        };
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
                    message.textContent = `${date(complaint.createdAt)} · ${statuses[complaint.status]} · ${reasons[complaint.reason] || complaint.reason}: ${complaint.explanation}`;
                    entry.append(message);
                    for (const evidence of complaint.evidence) {
                        const reference = document.createElement("p");
                        reference.textContent = evidence;
                        entry.append(reference);
                    }
                    const review = document.createElement("form");
                    review.className = "royal-auto-admin-form";
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
                    save.className = "upholstery-primary-button";
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

    function businessModeration(business) {
        const panel = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Модерація й оскарження";
        const form = document.createElement("form");
        form.className = "royal-auto-admin-form";
        const action = document.createElement("select");
        action.setAttribute("aria-label", "Рішення модерації");
        for (const [value, label] of Object.entries({
            warning: "Попередити", review: "Перевести на перевірку",
            restrict: "Тимчасово обмежити", block: "Заблокувати", restore: "Відновити"
        })) action.add(new Option(label, value));
        const reason = document.createElement("input");
        reason.required = true;
        reason.maxLength = 1000;
        reason.placeholder = "Причина рішення";
        reason.setAttribute("aria-label", reason.placeholder);
        const until = document.createElement("input");
        until.type = "datetime-local";
        until.setAttribute("aria-label", "Обмеження до");
        const toggleUntil = () => { until.disabled = until.hidden = action.value !== "restrict"; until.required = !until.disabled; };
        action.addEventListener("change", toggleUntil);
        toggleUntil();
        const submit = document.createElement("button");
        submit.textContent = "Застосувати рішення";
        submit.className = "upholstery-primary-button";
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        const appeals = document.createElement("ul");
        const path = `/api/admin/businesses/${encodeURIComponent(business.id)}`;
        form.append(action, reason, until, submit);
        panel.append(summary, form, feedback, appeals);
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (!window.confirm(`${action.selectedOptions[0].text} «${business.name}»?`)) return;
            submit.disabled = true;
            try {
                await adminApi(`${path}/moderation`, { method: "PATCH", body: {
                    action: action.value, reason: reason.value, confirmed: true,
                    until: until.disabled ? null : new Date(until.value).toISOString()
                }});
                await loadBusinesses(page);
                status.textContent = "Рішення записано, власник отримав сповіщення.";
            } catch (error) {
                feedback.textContent = error.message;
            } finally {
                submit.disabled = false;
            }
        });
        panel.addEventListener("toggle", async () => {
            if (!panel.open) return;
            try {
                const data = await adminApi(`${path}/appeals`);
                appeals.replaceChildren();
                for (const appeal of data.appeals) {
                    const row = document.createElement("li");
                    const label = document.createElement("p");
                    label.textContent = `Рішення: ${appeal.reason}. Оскарження: ${appeal.explanation}`;
                    row.append(label);
                    if (appeal.status !== "new") {
                        const resolution = document.createElement("p");
                        resolution.textContent = `${appeal.status === "resolved" ? "Розглянуто" : "Відхилено"}: ${appeal.response}`;
                        row.append(resolution);
                    } else {
                        const review = document.createElement("form");
                        review.className = "royal-auto-admin-form";
                        const result = document.createElement("select");
                        result.setAttribute("aria-label", "Статус оскарження");
                        result.add(new Option("Розглянуто", "resolved"));
                        result.add(new Option("Відхилено", "dismissed"));
                        const response = document.createElement("input");
                        response.placeholder = "Відповідь власнику";
                        response.setAttribute("aria-label", response.placeholder);
                        response.required = true;
                        response.maxLength = 1000;
                        const save = document.createElement("button");
                        save.textContent = "Зберегти відповідь";
                        save.className = "upholstery-primary-button";
                        review.append(result, response, save);
                        review.addEventListener("submit", async event => {
                            event.preventDefault();
                            save.disabled = true;
                            try {
                                await adminApi(`${path}/appeals/${encodeURIComponent(appeal.id)}`, {
                                    method: "PATCH", body: { status: result.value, response: response.value }
                                });
                                await loadBusinesses(page);
                            } catch (error) {
                                feedback.textContent = error.message;
                            } finally {
                                save.disabled = false;
                            }
                        });
                        row.append(review);
                    }
                    appeals.append(row);
                }
            } catch (error) {
                feedback.textContent = error.message;
            }
        });
        return panel;
    }

    // Apply select filters immediately; never leave a previous category's results visible.
    for (const fieldName of ["category", "status"]) {
        form.elements[fieldName].addEventListener("change", () => loadBusinesses(1));
    }
    form.elements.q.addEventListener("input", () => {
        // Clear stale results while the search term is being edited.
        result.replaceChildren();
        status.textContent = "Натисніть «Знайти», щоб виконати пошук за назвою.";
    });
    previous.addEventListener("click", () => loadBusinesses(page - 1));
    next.addEventListener("click", () => loadBusinesses(page + 1));
    form.addEventListener("submit", event => {
        event.preventDefault();
        loadBusinesses();
    });

    // Ordinary users: admin-only directory and explicit, audited conversion.
    const usersPanel = document.getElementById("adminUsersPanel");
    const usersForm = document.getElementById("adminUsersSearch");
    const usersResults = document.getElementById("adminUsersResults");
    const usersStatus = document.getElementById("adminUsersStatus");
    const usersPrevious = document.getElementById("adminUsersPrevious");
    const usersNext = document.getElementById("adminUsersNext");
    let usersPage = 1;
    let conversionCategories = [];

    async function loadUsers(targetPage = 1) {
        usersStatus.textContent = "Завантажуємо користувачів…";
        usersPrevious.disabled = usersNext.disabled = true;
        const filters = new URLSearchParams(new FormData(usersForm));
        filters.set("page", targetPage);
        try {
            const data = await adminApi(`/api/admin/users?${filters}`);
            usersPage = data.page;
            usersResults.replaceChildren();
            usersPrevious.hidden = usersPage <= 1;
            usersNext.hidden = !data.hasMore;
            usersStatus.textContent = data.users.length
                ? `Сторінка ${usersPage} · Показано ${data.users.length}`
                : "Користувачів не знайдено.";
            for (const user of data.users) {
                const article = document.createElement("article");
                article.className = "platform-admin-business";
                const heading = document.createElement("h3");
                heading.textContent = user.name;
                const details = document.createElement("p");
                details.textContent = `${user.email} · Реєстрація: ${date(user.createdAt)} · Email: ${user.emailVerified ? "підтверджений" : "не підтверджений"} · Телефон: ${user.phoneVerified ? "підтверджений" : "не підтверджений"}${user.disabled ? " · Акаунт обмежено" : ""}`;
                article.append(heading, details);
                const panel = document.createElement("details");
                const summary = document.createElement("summary");
                summary.textContent = "Перевести в бізнес";
                const conversion = document.createElement("form");
                conversion.className = "royal-auto-admin-form";
                const businessName = document.createElement("input");
                businessName.required = true;
                businessName.maxLength = 100;
                businessName.placeholder = "Назва бізнесу";
                businessName.setAttribute("aria-label", "Назва бізнесу");
                const category = document.createElement("select");
                category.required = true;
                category.setAttribute("aria-label", "Категорія бізнесу");
                category.add(new Option("Оберіть категорію", ""));
                for (const item of conversionCategories) category.add(new Option(item.name, item.code));
                const contentType = document.createElement("select");
                contentType.setAttribute("aria-label", "Вміст бізнес-профілю");
                for (const [value, label] of Object.entries({
                    services: "Послуги", products: "Товари", both: "Послуги й товари"
                })) contentType.add(new Option(label, value));
                const toggleContent = () => {
                    contentType.hidden = category.value !== "other";
                    contentType.disabled = contentType.hidden;
                };
                category.addEventListener("change", toggleContent);
                toggleContent();
                const reason = document.createElement("input");
                reason.required = true;
                reason.minLength = 5;
                reason.maxLength = 500;
                reason.placeholder = "Причина переведення (для журналу)";
                reason.setAttribute("aria-label", reason.placeholder);
                const confirmLabel = document.createElement("label");
                const consent = document.createElement("input");
                consent.type = "checkbox";
                consent.required = true;
                confirmLabel.append(consent, document.createTextNode(" Підтверджую запит власника акаунта на переведення"));
                const submit = document.createElement("button");
                submit.type = "submit";
                submit.textContent = "Перевести в бізнес";
                submit.className = "upholstery-primary-button";
                const feedback = document.createElement("p");
                feedback.setAttribute("role", "status");
                const verificationNotice = document.createElement("p");
                verificationNotice.setAttribute("role", "note");
                verificationNotice.textContent = user.phoneVerified
                    ? "Телефон підтверджено. Після переведення бізнес зможе з’явитися в каталозі за умови активного доступу."
                    : "Увага: телефон не підтверджений. Після переведення бізнес НЕ з’явиться на головній і в «Партнерах», доки власник не підтвердить номер у своєму кабінеті. Адміністратор не повинен обходити перевірку.";
                conversion.append(businessName, category, contentType, reason, verificationNotice, confirmLabel, submit, feedback);
                conversion.addEventListener("submit", async event => {
                    event.preventDefault();
                    if (!window.confirm(`Перевести акаунт «${user.name}» (${user.email}) у бізнес «${businessName.value}»? Дія змінить тип акаунта.`)) return;
                    submit.disabled = true;
                    try {
                        const data = await adminApi(`/api/admin/users/${encodeURIComponent(user.id)}/convert-to-business`, {
                            method: "POST",
                            body: { businessName: businessName.value, category: category.value,
                                contentType: contentType.value, reason: reason.value, confirmed: consent.checked }
                        });
                        await loadUsers(usersPage);
                        usersStatus.textContent = data.message + (user.phoneVerified ? "" : " Увага: власник має підтвердити телефон, інакше профіль не буде публічним.");
                    } catch (error) {
                        feedback.textContent = error.message;
                        submit.disabled = false;
                    }
                });
                panel.append(summary, conversion);
                article.append(panel);
                usersResults.append(article);
            }
        } catch (error) {
            usersStatus.textContent = error.message;
        } finally {
            usersPrevious.disabled = usersNext.disabled = false;
        }
    }
    usersForm.addEventListener("submit", event => { event.preventDefault(); loadUsers(1); });
    usersPrevious.addEventListener("click", () => loadUsers(usersPage - 1));
    usersNext.addEventListener("click", () => loadUsers(usersPage + 1));

    const accessStatus = document.getElementById("platformAccessStatus");
    if (!token) {
        accessStatus.hidden = false;
        accessStatus.textContent = "Увійдіть до Royal Garage, щоб перевірити доступ.";
        return;
    }

    try {
        const { user } = await adminApi("/api/profile");
        if (user?.role !== "admin" || user.accountType === "business" || user.account_type === "business") return;
        accessStatus.hidden = false;
        const data = await adminApi("/api/admin/registrations");
        document.getElementById("platformAdmin").hidden = false;
        accessStatus.hidden = true;
        renderStats(data.stats);
        registrationStatus.hidden = true;
        loadSiteAnalytics();
        if (data.canManageBusinesses) {
            businessControls.hidden = false;
            usersPanel.hidden = false;
            document.getElementById("adminUsersJump").hidden = false;
            try { const list = await adminApi("/api/admin/businesses?page=1"); conversionCategories = list.categories; }
            catch (error) { usersStatus.textContent = "Не вдалося завантажити категорії: " + error.message; }
            loadUsers();
            document.getElementById("adminBusinessJump").hidden = false;
            return loadBusinesses();
        }
    } catch (error) {
        accessStatus.textContent = error.message;
    }
})();
