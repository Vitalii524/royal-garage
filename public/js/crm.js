"use strict";

const CRM_TOKEN_KEY = "royalGarageToken";

function getToken() {
    return localStorage.getItem(CRM_TOKEN_KEY);
}

function getApiBaseUrl() {
    const hostname = window.location.hostname;

    if (
        hostname === "localhost" ||
        hostname === "127.0.0.1"
    ) {
        return "https://royal-garage.onrender.com";
    }

    return "";
}

async function loadCrm() {
    const status =
        document.getElementById("crmStatus");

    const dashboard =
        document.getElementById("crmDashboard");

    const businessName =
        document.getElementById("crmBusinessName");

    const token = getToken();

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const apiBaseUrl =
            getApiBaseUrl();

        const response = await fetch(
            `${apiBaseUrl}/api/crm/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Немає доступу до CRM RG."
            );
        }

        if (businessName) {
            businessName.textContent =
                data.crm?.businessName ||
                "Мій бізнес";
        }

        if (status) {
            status.textContent =
                `CRM активна · ${data.crm?.planName || ""}`;
        }

        if (dashboard) {
            dashboard.hidden = false;
        }

    } catch (error) {
        console.error(
            "CRM load error:",
            error
        );

        if (status) {
            status.classList.add(
                "crm-error"
            );

            status.textContent =
                error.message ||
                "Не вдалося відкрити CRM RG.";
        }

        if (dashboard) {
            dashboard.hidden = true;
        }
    }
}

function bindClientForm() {
    const addButton =
        document.getElementById(
            "crmAddClientButton"
        );

    const form =
        document.getElementById(
            "crmClientForm"
        );

    if (!addButton || !form) {
        return;
    }

    addButton.addEventListener(
        "click",
        () => {
            form.hidden =
                !form.hidden;
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const name =
                document
                    .getElementById(
                        "crmClientName"
                    )
                    ?.value.trim() || "";

            const phone =
                document
                    .getElementById(
                        "crmClientPhone"
                    )
                    ?.value.trim() || "";

            const email =
                document
                    .getElementById(
                        "crmClientEmail"
                    )
                    ?.value.trim() || "";

            const notes =
                document
                    .getElementById(
                        "crmClientNotes"
                    )
                    ?.value.trim() || "";

            if (!name) {
                alert(
                    "Вкажіть ім'я клієнта."
                );
                return;
            }

            const token =
                getToken();

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/clients`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                name,
                                phone,
                                email,
                                notes
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося додати клієнта."
                    );
                }

                alert(
                    "Клієнта додано."
                );

                form.reset();
                form.hidden = true;
                loadClients();

            } catch (error) {
                console.error(
                    "CRM client create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося додати клієнта."
                );
            }
        }
    );
}

async function loadClients() {
    const count =
        document.getElementById(
            "crmClientsCount"
        );

    const list =
        document.getElementById(
            "crmClientsList"
        );

    if (!count || !list) {
        return;
    }

    const token = getToken();

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/clients`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити клієнтів."
            );
        }

        const clients =
            Array.isArray(data.clients)
                ? data.clients
                : [];

        count.textContent =
            `Клієнтів: ${clients.length}`;

        if (clients.length === 0) {
            list.innerHTML =
                "<p>Клієнтів ще немає.</p>";
            return;
        }

        list.innerHTML =
            clients
                .map(
                    (client) => `
                        <div style="
                            padding: 12px 0;
                            border-top: 1px solid #333;
                        ">
                            <strong>
                                ${client.name}
                            </strong>

                            ${
                                client.phone
                                    ? `<div>${client.phone}</div>`
                                    : ""
                            }

                            ${
                                client.email
                                    ? `<div>${client.email}</div>`
                                    : ""
                            }

                            ${
                                client.notes
                                    ? `<div>${client.notes}</div>`
                                    : ""
                            }
                        </div>
                    `
                )
                .join("");

    } catch (error) {
        console.error(
            "CRM clients load error:",
            error
        );

        count.textContent =
            "Не вдалося завантажити клієнтів.";

        list.innerHTML = "";
    }
}

async function bindCarForm() {
    const addButton =
        document.getElementById(
            "crmAddCarButton"
        );

    const form =
        document.getElementById(
            "crmCarForm"
        );

    const clientSelect =
        document.getElementById(
            "crmCarClient"
        );

    if (
        !addButton ||
        !form ||
        !clientSelect
    ) {
        return;
    }

    async function loadClientOptions() {
        try {
            const response =
                await fetch(
                    `${getApiBaseUrl()}/api/crm/clients`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося завантажити клієнтів."
                );
            }

            const clients =
                Array.isArray(data.clients)
                    ? data.clients
                    : [];

            clientSelect.innerHTML = `
                <option value="">
                    Виберіть клієнта
                </option>
                ${clients
                    .map(
                        (client) => `
                            <option value="${client.id}">
                                ${client.name}
                            </option>
                        `
                    )
                    .join("")}
            `;

        } catch (error) {
            console.error(
                "CRM clients select error:",
                error
            );
        }
    }

    addButton.addEventListener(
        "click",
        async () => {
            form.hidden =
                !form.hidden;

            if (!form.hidden) {
                await loadClientOptions();
            }
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const clientId =
                clientSelect.value;

            const brand =
                document
                    .getElementById(
                        "crmCarBrand"
                    )
                    ?.value.trim() || "";

            const model =
                document
                    .getElementById(
                        "crmCarModel"
                    )
                    ?.value.trim() || "";

            const year =
                document
                    .getElementById(
                        "crmCarYear"
                    )
                    ?.value || "";

            const vin =
                document
                    .getElementById(
                        "crmCarVin"
                    )
                    ?.value.trim() || "";

            const plate =
                document
                    .getElementById(
                        "crmCarPlate"
                    )
                    ?.value.trim() || "";

            const mileage =
                document
                    .getElementById(
                        "crmCarMileage"
                    )
                    ?.value || "";

            const engine =
                document
                    .getElementById(
                        "crmCarEngine"
                    )
                    ?.value.trim() || "";

            const fuel =
                document
                    .getElementById(
                        "crmCarFuel"
                    )
                    ?.value.trim() || "";

            const transmission =
                document
                    .getElementById(
                        "crmCarTransmission"
                    )
                    ?.value.trim() || "";

            const notes =
                document
                    .getElementById(
                        "crmCarNotes"
                    )
                    ?.value.trim() || "";

            if (!clientId) {
                alert(
                    "Виберіть клієнта."
                );
                return;
            }

            if (!brand && !model) {
                alert(
                    "Вкажіть марку або модель автомобіля."
                );
                return;
            }

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/cars`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getToken()}`
                            },

                            body: JSON.stringify({
                                clientId,
                                brand,
                                model,
                                year,
                                vin,
                                plate,
                                mileage,
                                engine,
                                fuel,
                                transmission,
                                notes
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося додати автомобіль."
                    );
                }

                alert(
                    "Автомобіль додано."
                );

                form.reset();
                form.hidden = true;
                loadCars();

            } catch (error) {
                console.error(
                    "CRM car create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося додати автомобіль."
                );
            }
        }
    );
}

async function loadCars() {
    const count =
        document.getElementById(
            "crmCarsCount"
        );

    const list =
        document.getElementById(
            "crmCarsList"
        );

    if (!count || !list) {
        return;
    }

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/cars`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити автомобілі."
            );
        }

        const cars =
            Array.isArray(data.cars)
                ? data.cars
                : [];

        count.textContent =
            `Автомобілів: ${cars.length}`;

        if (cars.length === 0) {
            list.innerHTML =
                "<p>Автомобілів ще немає.</p>";
            return;
        }

        list.innerHTML =
            cars
                .map(
                    (car) => `
                        <div style="
                            padding: 12px 0;
                            border-top: 1px solid #333;
                        ">
                            <strong>
                                ${car.brand || ""}
                                ${car.model || ""}
                            </strong>

                            ${
                                car.year
                                    ? `<div>Рік: ${car.year}</div>`
                                    : ""
                            }

                            ${
                                car.plate
                                    ? `<div>Номер: ${car.plate}</div>`
                                    : ""
                            }

                            ${
                                car.vin
                                    ? `<div>VIN: ${car.vin}</div>`
                                    : ""
                            }

                            ${
                                car.mileage != null
                                    ? `<div>Пробіг: ${car.mileage} км</div>`
                                    : ""
                            }

                            ${
                                car.clientName
                                    ? `<div>Клієнт: ${car.clientName}</div>`
                                    : ""
                            }
                        </div>
                    `
                )
                .join("");

    } catch (error) {
        console.error(
            "CRM cars load error:",
            error
        );

        count.textContent =
            "Не вдалося завантажити автомобілі.";

        list.innerHTML = "";
    }
}

async function bindWorkOrderForm() {
    const addButton =
        document.getElementById(
            "crmAddWorkOrderButton"
        );

    const form =
        document.getElementById(
            "crmWorkOrderForm"
        );

    const clientSelect =
        document.getElementById(
            "crmWorkOrderClient"
        );

    const carSelect =
        document.getElementById(
            "crmWorkOrderCar"
        );

    if (
        !addButton ||
        !form ||
        !clientSelect ||
        !carSelect
    ) {
        return;
    }

    let carsCache = [];

    async function loadClientsAndCars() {
        try {
            const [
                clientsResponse,
                carsResponse
            ] = await Promise.all([
                fetch(
                    `${getApiBaseUrl()}/api/crm/clients`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                ),
                fetch(
                    `${getApiBaseUrl()}/api/crm/cars`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                )
            ]);

            const clientsData =
                await clientsResponse.json();

            const carsData =
                await carsResponse.json();

            if (!clientsResponse.ok) {
                throw new Error(
                    clientsData.message ||
                    "Не вдалося завантажити клієнтів."
                );
            }

            if (!carsResponse.ok) {
                throw new Error(
                    carsData.message ||
                    "Не вдалося завантажити автомобілі."
                );
            }

            const clients =
                Array.isArray(clientsData.clients)
                    ? clientsData.clients
                    : [];

            carsCache =
                Array.isArray(carsData.cars)
                    ? carsData.cars
                    : [];

            clientSelect.innerHTML = `
                <option value="">
                    Виберіть клієнта
                </option>
                ${clients
                    .map(
                        (client) => `
                            <option value="${client.id}">
                                ${client.name}
                            </option>
                        `
                    )
                    .join("")}
            `;

            carSelect.innerHTML = `
                <option value="">
                    Спочатку виберіть клієнта
                </option>
            `;

            carSelect.disabled = true;

        } catch (error) {
            console.error(
                "CRM work order options error:",
                error
            );

            alert(
                error.message ||
                "Не вдалося завантажити дані для наряду."
            );
        }
    }

    clientSelect.addEventListener(
        "change",
        () => {
            const clientId =
                clientSelect.value;

            if (!clientId) {
                carSelect.innerHTML = `
                    <option value="">
                        Спочатку виберіть клієнта
                    </option>
                `;

                carSelect.disabled = true;
                return;
            }

            const clientCars =
                carsCache.filter(
                    (car) =>
                        car.clientId === clientId
                );

            carSelect.innerHTML = `
                <option value="">
                    Виберіть автомобіль
                </option>
                ${clientCars
                    .map(
                        (car) => `
                            <option value="${car.id}">
                                ${car.brand || ""}
                                ${car.model || ""}
                                ${car.plate
                                    ? ` · ${car.plate}`
                                    : ""}
                                ${car.vin
                                    ? ` · VIN ${car.vin}`
                                    : ""}
                            </option>
                        `
                    )
                    .join("")}
            `;

            carSelect.disabled =
                clientCars.length === 0;
        }
    );

    addButton.addEventListener(
        "click",
        async () => {
            form.hidden =
                !form.hidden;

            if (!form.hidden) {
                await loadClientsAndCars();
            }
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const clientId =
                clientSelect.value;

            const carId =
                carSelect.value;

            const mileage =
                document
                    .getElementById(
                        "crmWorkOrderMileage"
                    )
                    ?.value || "";

            const customerComplaint =
                document
                    .getElementById(
                        "crmWorkOrderComplaint"
                    )
                    ?.value.trim() || "";

            const diagnostics =
                document
                    .getElementById(
                        "crmWorkOrderDiagnostics"
                    )
                    ?.value.trim() || "";

            if (!clientId) {
                alert(
                    "Виберіть клієнта."
                );
                return;
            }

            if (!carId) {
                alert(
                    "Виберіть автомобіль."
                );
                return;
            }

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/work-orders`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getToken()}`
                            },

                            body: JSON.stringify({
                                clientId,
                                carId,
                                mileage,
                                customerComplaint,
                                diagnostics
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося створити замовлення-наряд."
                    );
                }

                alert(
                    `Наряд ${data.workOrder?.orderNumber || ""} створено.`
                );

                form.reset();
                form.hidden = true;
                loadWorkOrders();

                carSelect.innerHTML = `
                    <option value="">
                        Спочатку виберіть клієнта
                    </option>
                `;

                carSelect.disabled = true;

            } catch (error) {
                console.error(
                    "CRM work order create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося створити замовлення-наряд."
                );
            }
        }
    );
}

let crmWorkOrdersCache = [];

function normalizeCrmSearchValue(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeCrmPhone(value) {
    return String(value || "")
        .replace(/\D/g, "");
}

function getCrmWorkOrderStatusLabel(status) {
    const labels = {
        new: "Новий",
        in_progress: "В роботі",
        ready: "Готовий",
        completed: "Виданий"
    };

    return labels[status] || status || "—";
}

function renderWorkOrders(workOrders) {
    const count =
        document.getElementById(
            "crmWorkOrdersCount"
        );

    const list =
        document.getElementById(
            "crmWorkOrdersList"
        );

    const searchInput =
        document.getElementById(
            "crmWorkOrdersSearch"
        );

    if (!count || !list) {
        return;
    }

    const query =
        normalizeCrmSearchValue(
            searchInput?.value
        );

    const phoneQuery =
        normalizeCrmPhone(
            searchInput?.value
        );

    const filteredOrders =
        workOrders.filter((order) => {
            if (!query) {
                return true;
            }

            const searchableText =
                normalizeCrmSearchValue([
                    order.orderNumber,
                    order.clientName,
                    order.clientPhone,
                    order.brand,
                    order.model,
                    order.plate,
                    order.vin,
                    order.status
                ].join(" "));

            const orderPhone =
                normalizeCrmPhone(
                    order.clientPhone
                );

            return (
                searchableText.includes(query) ||
                (
                    phoneQuery.length >= 3 &&
                    orderPhone.includes(phoneQuery)
                )
            );
        });

    count.textContent =
        query
            ? `Знайдено: ${filteredOrders.length} з ${workOrders.length}`
            : `Нарядів: ${workOrders.length}`;

    if (workOrders.length === 0) {
        list.innerHTML =
            "<p>Замовлень-нарядів ще немає.</p>";
        return;
    }

    if (filteredOrders.length === 0) {
        list.innerHTML =
            "<p>За цим запитом нарядів не знайдено.</p>";
        return;
    }

    list.innerHTML =
        filteredOrders
            .map(
                (order) => `
                    <div style="
                        display: grid;
                        grid-template-columns:
                            minmax(120px, 0.9fr)
                            minmax(120px, 1fr)
                            minmax(150px, 1.3fr)
                            auto;
                        gap: 14px;
                        align-items: center;
                        padding: 14px 0;
                        border-top: 1px solid #333;
                    ">
                        <div>
                            <a
                                href="crm-work-order.html?id=${encodeURIComponent(order.id)}"
                                style="
                                    color: #fff;
                                    text-decoration: none;
                                    font-weight: 700;
                                "
                            >
                                ${order.orderNumber || "Наряд"}
                            </a>

                            <div style="
                                color: #aaa;
                                font-size: 14px;
                            ">
                            ${getCrmWorkOrderStatusLabel(order.status)}
                            </div>
                        </div>

                        <div>
                            <strong>
                                ${order.clientName || "—"}
                            </strong>

                            ${
                                order.clientPhone
                                    ? `<div style="color:#aaa;font-size:14px;">${order.clientPhone}</div>`
                                    : ""
                            }
                        </div>

                        <div>
                            ${order.brand || ""}
                            ${order.model || ""}

                            ${
                                order.plate
                                    ? `<div style="color:#aaa;font-size:14px;">${order.plate}</div>`
                                    : ""
                            }
                        </div>

                        <div style="
                            text-align: right;
                            font-weight: 700;
                            white-space: nowrap;
                        ">
                            ${Number(order.totalAmount || 0).toFixed(2)} грн
                        </div>
                    </div>
                `
            )
            .join("");
}

function bindWorkOrdersSearch() {
    const searchInput =
        document.getElementById(
            "crmWorkOrdersSearch"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        () => {
            renderWorkOrders(
                crmWorkOrdersCache
            );
        }
    );
}

async function loadWorkOrders() {
    const count =
        document.getElementById(
            "crmWorkOrdersCount"
        );

    const list =
        document.getElementById(
            "crmWorkOrdersList"
        );

    if (!count || !list) {
        return;
    }

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/work-orders`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити замовлення-наряди."
            );
        }

        crmWorkOrdersCache =
            Array.isArray(data.workOrders)
                ? data.workOrders
                : [];

        renderWorkOrders(
            crmWorkOrdersCache
        );

    } catch (error) {
        console.error(
            "CRM work orders load error:",
            error
        );

        count.textContent =
            "Не вдалося завантажити замовлення-наряди.";

        list.innerHTML = "";
    }
}

async function loadAppointments() {
    const count =
        document.getElementById(
            "crmAppointmentsCount"
        );

    const list =
        document.getElementById(
            "crmAppointmentsList"
        );

    if (!count || !list) {
        return;
    }

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/appointments`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити записи."
            );
        }

        const appointments =
            Array.isArray(data.appointments)
                ? data.appointments
                : [];

        count.textContent =
            `Записів: ${appointments.length}`;

        if (appointments.length === 0) {
            list.innerHTML = `
                <div class="crm-empty-block">
                    Записів ще немає.
                </div>
            `;

            return;
        }

        list.innerHTML =
            appointments
                .map((appointment) => {
                    const date =
                        new Date(
                            appointment.scheduledAt
                        );

                    const dateText =
                        date.toLocaleString(
                            "uk-UA",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );

                    const carText = [
                        appointment.brand,
                        appointment.model
                    ]
                        .filter(Boolean)
                        .join(" ");

                    const employeeText =
                          appointment.employeeName
                                ? `👨‍🔧 ${appointment.employeeName}`
                                : "👨‍🔧 Працівника не призначено";

                        return `
                        <div style="
                            padding: 14px 0;
                            border-top: 1px solid #333;
                        ">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                gap: 16px;
                                align-items: flex-start;
                            ">
                                <div>
                                    <strong>
                                        ${appointment.title || "Запис"}
                                    </strong>
                    
                                    <div style="
                                        color: #aaa;
                                        margin-top: 4px;
                                    ">
                                        ${dateText}
                                    </div>
                    
                                    ${
                                        appointment.clientName
                                            ? `
                                                <div style="
                                                    margin-top: 6px;
                                                ">
                                                    👤
                                                    ${appointment.clientName}
                                                </div>
                                            `
                                            : ""
                                    }
                    
                                    ${
                                        carText
                                            ? `
                                                <div style="
                                                    color: #aaa;
                                                    margin-top: 3px;
                                                ">
                                                    🚗
                                                    ${carText}
                                                    ${
                                                        appointment.plate
                                                            ? ` · ${appointment.plate}`
                                                            : ""
                                                    }
                                                </div>
                                            `
                                            : ""
                                    }

                                    <div style="
                                        color: #aaa;
                                        margin-top: 6px;
                                    ">
                                        ${employeeText}
                                    </div>
                    
                                    ${
                                        appointment.notes
                                            ? `
                                                <div style="
                                                    color: #aaa;
                                                    margin-top: 6px;
                                                ">
                                                    ${appointment.notes}
                                                </div>
                                            `
                                            : ""
                                    }
                    
                                    <div style="
                                        display: flex;
                                        gap: 8px;
                                        margin-top: 10px;
                                        flex-wrap: wrap;
                                    ">
                                        <button
                                            type="button"
                                            class="crm-appointment-edit"
                                            data-appointment-id="${appointment.id}"
                                        >
                                            Редагувати
                                        </button>
                    
                                        <button
                                            type="button"
                                            class="crm-appointment-delete"
                                            data-appointment-id="${appointment.id}"
                                        >
                                            Видалити
                                        </button>
                                    </div>
                                </div>
                    
                                <div style="
                                    color: #aaa;
                                    white-space: nowrap;
                                ">
                                    ${
                                        appointment.durationMinutes || 60
                                    } хв
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join("");

                list
    .querySelectorAll(
        ".crm-appointment-edit"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            async () => {
                const appointmentId =
                    button.dataset
                        .appointmentId;

                const appointment =
                    appointments.find(
                        (item) =>
                            String(item.id) ===
                            String(appointmentId)
                    );

                if (!appointment) {
                    return;
                }

                const title =
                    prompt(
                        "Назва запису:",
                        appointment.title || ""
                    );

                if (title === null) {
                    return;
                }

                const durationMinutes =
                    prompt(
                        "Тривалість, хв:",
                        appointment.durationMinutes || 60
                    );

                if (durationMinutes === null) {
                    return;
                }

                const notes =
                    prompt(
                        "Примітка:",
                        appointment.notes || ""
                    );

                if (notes === null) {
                    return;
                }

                const currentDate =
                    new Date(
                        appointment.scheduledAt
                    );

                const localDateTime =
                    new Date(
                        currentDate.getTime() -
                        currentDate.getTimezoneOffset() *
                        60000
                    )
                        .toISOString()
                        .slice(0, 16);

                const scheduledAtInput =
                    prompt(
                        "Дата і час (YYYY-MM-DDTHH:MM):",
                        localDateTime
                    );

                if (scheduledAtInput === null) {
                    return;
                }

                const scheduledDate =
                    new Date(
                        scheduledAtInput
                    );

                if (
                    Number.isNaN(
                        scheduledDate.getTime()
                    )
                ) {
                    alert(
                        "Невірна дата або час."
                    );
                    return;
                }

                const payload = {
                    clientId:
                        appointment.clientId || null,

                    carId:
                        appointment.carId || null,

                    employeeId:
                        appointment.employeeId || null,

                    title:
                        String(title).trim(),

                    scheduledAt:
                        scheduledDate.toISOString(),

                    durationMinutes:
                        Number(durationMinutes),

                    status:
                        appointment.status ||
                        "scheduled",

                    notes:
                        String(notes).trim()
                };

                try {
                    const response =
                        await fetch(
                            `${getApiBaseUrl()}/api/crm/appointments/${encodeURIComponent(appointmentId)}`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${getToken()}`
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            "Не вдалося відредагувати запис."
                        );
                    }

                    await loadAppointments();

                } catch (error) {
                    console.error(
                        "CRM appointment update error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Не вдалося відредагувати запис."
                    );
                }
            }
        );
    });

                list
    .querySelectorAll(
        ".crm-appointment-delete"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            async () => {
                const appointmentId =
                    button.dataset
                        .appointmentId;

                const appointment =
                    appointments.find(
                        (item) =>
                            String(item.id) ===
                            String(appointmentId)
                    );

                if (!appointment) {
                    return;
                }

                const confirmed =
                    window.confirm(
                        `Видалити запис "${appointment.title}"?`
                    );

                if (!confirmed) {
                    return;
                }

                try {
                    const response =
                        await fetch(
                            `${getApiBaseUrl()}/api/crm/appointments/${encodeURIComponent(appointmentId)}`,
                            {
                                method: "DELETE",

                                headers: {
                                    Authorization:
                                        `Bearer ${getToken()}`
                                }
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            "Не вдалося видалити запис."
                        );
                    }

                    await loadAppointments();

                } catch (error) {
                    console.error(
                        "CRM appointment delete error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Не вдалося видалити запис."
                    );
                }
            }
        );
    });

    } catch (error) {
        console.error(
            "CRM appointments load error:",
            error
        );

        count.textContent =
            "Не вдалося завантажити записи.";

        list.innerHTML = "";
    }
}

function bindAppointmentForm() {
    const addButton =
        document.getElementById(
            "crmAddAppointmentButton"
        );

    const form =
        document.getElementById(
            "crmAppointmentForm"
        );

    const clientSelect =
        document.getElementById(
            "crmAppointmentClient"
        );

    const carSelect =
        document.getElementById(
            "crmAppointmentCar"
        );

    const employeeSelect =
        document.getElementById(
            "crmAppointmentEmployee"
        );

    if (
        !addButton ||
        !form ||
        !clientSelect ||
        !carSelect
    ) {
        return;
    }

    let carsCache = [];

    async function loadClientsAndCars() {
        try {
            const [
                clientsResponse,
                carsResponse
            ] = await Promise.all([
                fetch(
                    `${getApiBaseUrl()}/api/crm/clients`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                ),

                fetch(
                    `${getApiBaseUrl()}/api/crm/cars`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                )
            ]);

            try {
                const employeesResponse =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/employees`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${getToken()}`
                            }
                        }
                    );
            
                const employeesData =
                    await employeesResponse.json();
            
                if (employeesResponse.ok) {
                    const employees =
                        Array.isArray(employeesData.employees)
                            ? employeesData.employees
                            : [];
            
                    employeeSelect.innerHTML =
                        `<option value="">Без призначеного працівника</option>`;
            
                    employees
                        .filter(
                            employee =>
                                employee.status === "active"
                        )
                        .forEach(employee => {
                            const option =
                                document.createElement("option");
            
                            option.value =
                                employee.id;
            
                            option.textContent =
                                employee.name;
            
                            employeeSelect.appendChild(option);
                        });
                }
            } catch (error) {
                console.error(
                    "Помилка завантаження працівників:",
                    error
                );
            }

            const clientsData =
                await clientsResponse.json();

            const carsData =
                await carsResponse.json();

            if (!clientsResponse.ok) {
                throw new Error(
                    clientsData.message ||
                    "Не вдалося завантажити клієнтів."
                );
            }

            if (!carsResponse.ok) {
                throw new Error(
                    carsData.message ||
                    "Не вдалося завантажити автомобілі."
                );
            }

            const clients =
                Array.isArray(
                    clientsData.clients
                )
                    ? clientsData.clients
                    : [];

            carsCache =
                Array.isArray(
                    carsData.cars
                )
                    ? carsData.cars
                    : [];

            clientSelect.innerHTML = `
                <option value="">
                    Виберіть клієнта
                </option>

                ${clients
                    .map(
                        (client) => `
                            <option value="${client.id}">
                                ${client.name}
                            </option>
                        `
                    )
                    .join("")}
            `;

            carSelect.innerHTML = `
                <option value="">
                    Спочатку виберіть клієнта
                </option>
            `;

        } catch (error) {
            console.error(
                "CRM appointment form load error:",
                error
            );

            alert(
                error.message ||
                "Не вдалося підготувати форму запису."
            );
        }
    }

    clientSelect.addEventListener(
        "change",
        () => {
            const clientId =
                clientSelect.value;

            if (!clientId) {
                carSelect.innerHTML = `
                    <option value="">
                        Спочатку виберіть клієнта
                    </option>
                `;

                return;
            }

            const clientCars =
                carsCache.filter(
                    (car) =>
                        String(car.clientId) ===
                        String(clientId)
                );

            carSelect.innerHTML = `
                <option value="">
                    Без автомобіля
                </option>

                ${clientCars
                    .map(
                        (car) => `
                            <option value="${car.id}">
                                ${
                                    [
                                        car.brand,
                                        car.model,
                                        car.plate
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")
                                }
                            </option>
                        `
                    )
                    .join("")}
            `;
        }
    );

    addButton.addEventListener(
        "click",
        async () => {
            form.hidden =
                !form.hidden;

            if (!form.hidden) {
                await loadClientsAndCars();
            }
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const title =
                document
                    .getElementById(
                        "crmAppointmentTitle"
                    )
                    ?.value.trim() || "";

            const dateTimeValue =
                document
                    .getElementById(
                        "crmAppointmentDateTime"
                    )
                    ?.value || "";

            const durationMinutes =
                document
                    .getElementById(
                        "crmAppointmentDuration"
                    )
                    ?.value || "60";

            const notes =
                document
                    .getElementById(
                        "crmAppointmentNotes"
                    )
                    ?.value.trim() || "";

            if (!title) {
                alert(
                    "Вкажіть назву запису."
                );
                return;
            }

            if (!dateTimeValue) {
                alert(
                    "Вкажіть дату та час запису."
                );
                return;
            }

            const scheduledAt =
                new Date(
                    dateTimeValue
                ).toISOString();

                const payload = {
                    clientId: clientSelect.value || null,
                    carId: carSelect.value || null,
                    employeeId: employeeSelect.value || null,
                    title,
                    scheduledAt,
                    durationMinutes: Number(durationMinutes),
                    notes
                };

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/appointments`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getToken()}`
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося створити запис."
                    );
                }

                alert(
                    "Запис створено."
                );

                form.reset();
                form.hidden = true;

                await loadAppointments();

            } catch (error) {
                console.error(
                    "CRM appointment create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося створити запис."
                );
            }
        }
    );
}

function getCrmEmployeeRoleLabel(role) {
    const labels = {
        mechanic: "Механік",
        master: "Майстер-приймальник",
        manager: "Менеджер",
        admin: "Адміністратор"
    };

    return labels[role] || role || "—";
}


function getCrmEmployeeStatusLabel(status) {
    const labels = {
        active: "Працює",
        inactive: "Неактивний"
    };

    return labels[status] || status || "—";
}


async function loadEmployees() {
    const count =
        document.getElementById(
            "crmEmployeesCount"
        );

    const list =
        document.getElementById(
            "crmEmployeesList"
        );

    if (!count || !list) {
        return;
    }

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/employees`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити працівників."
            );
        }

        const employees =
            Array.isArray(data.employees)
                ? data.employees
                : [];

        count.textContent =
            `Працівників: ${employees.length}`;

        if (employees.length === 0) {
            list.innerHTML = `
                <div class="crm-empty-block">
                    Працівників ще немає.
                </div>
            `;

            return;
        }

        list.innerHTML =
            employees
                .map(
                    (employee) => `
                        <div style="
                            padding: 14px 0;
                            border-top: 1px solid #333;
                        ">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                gap: 16px;
                                flex-wrap: wrap;
                            ">
                                <div>
                                    <strong>
                                        ${employee.name || "Без імені"}
                                    </strong>

                                    <div style="
                                        margin-top: 4px;
                                        color: #aaa;
                                    ">
                                        ${getCrmEmployeeRoleLabel(
                                            employee.role
                                        )}
                                    </div>

                                    ${
                                        employee.specialization
                                            ? `
                                                <div style="
                                                    margin-top: 4px;
                                                ">
                                                    🔧
                                                    ${employee.specialization}
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        employee.phone
                                            ? `
                                                <div style="
                                                    margin-top: 4px;
                                                ">
                                                    📞
                                                    ${employee.phone}
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        employee.email
                                            ? `
                                                <div style="
                                                    margin-top: 4px;
                                                ">
                                                    ✉️
                                                    ${employee.email}
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        employee.notes
                                            ? `
                                                <div style="
                                                    margin-top: 6px;
                                                    color: #aaa;
                                                ">
                                                    ${employee.notes}
                                                </div>
                                            `
                                            : ""
                                    }

                                    <div style="
                                        display: flex;
                                        gap: 8px;
                                        flex-wrap: wrap;
                                        margin-top: 10px;
                                    ">
                                        <button
                                            type="button"
                                            class="crm-employee-edit"
                                            data-employee-id="${employee.id}"
                                        >
                                            Редагувати
                                        </button>

                                        <button
                                            type="button"
                                            class="crm-employee-delete"
                                            data-employee-id="${employee.id}"
                                        >
                                            Видалити
                                        </button>
                                    </div>
                                </div>

                                <div style="
                                    color: #aaa;
                                    white-space: nowrap;
                                ">
                                    ${getCrmEmployeeStatusLabel(
                                        employee.status
                                    )}
                                </div>
                            </div>
                        </div>
                    `
                )
                .join("");

        list
            .querySelectorAll(
                ".crm-employee-edit"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const employeeId =
                            button.dataset.employeeId;

                        const employee =
                            employees.find(
                                (item) =>
                                    String(item.id) ===
                                    String(employeeId)
                            );

                        if (!employee) {
                            return;
                        }

                        const name =
                            prompt(
                                "Ім'я працівника:",
                                employee.name || ""
                            );

                        if (name === null) {
                            return;
                        }

                        const phone =
                            prompt(
                                "Телефон:",
                                employee.phone || ""
                            );

                        if (phone === null) {
                            return;
                        }

                        const email =
                            prompt(
                                "Email:",
                                employee.email || ""
                            );

                        if (email === null) {
                            return;
                        }

                        const role =
                            prompt(
                                "Посада: mechanic / master / manager / admin",
                                employee.role || "mechanic"
                            );

                        if (role === null) {
                            return;
                        }

                        const specialization =
                            prompt(
                                "Спеціалізація:",
                                employee.specialization || ""
                            );

                        if (specialization === null) {
                            return;
                        }

                        const status =
                            prompt(
                                "Статус: active / inactive",
                                employee.status || "active"
                            );

                        if (status === null) {
                            return;
                        }

                        const notes =
                            prompt(
                                "Примітки:",
                                employee.notes || ""
                            );

                        if (notes === null) {
                            return;
                        }

                        try {
                            const response =
                                await fetch(
                                    `${getApiBaseUrl()}/api/crm/employees/${encodeURIComponent(employeeId)}`,
                                    {
                                        method: "PATCH",

                                        headers: {
                                            "Content-Type":
                                                "application/json",

                                            Authorization:
                                                `Bearer ${getToken()}`
                                        },

                                        body:
                                            JSON.stringify({
                                                name:
                                                    String(name).trim(),

                                                phone:
                                                    String(phone).trim(),

                                                email:
                                                    String(email).trim(),

                                                role:
                                                    String(role).trim(),

                                                specialization:
                                                    String(
                                                        specialization
                                                    ).trim(),

                                                status:
                                                    String(status).trim(),

                                                notes:
                                                    String(notes).trim()
                                            })
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    data.message ||
                                    "Не вдалося оновити працівника."
                                );
                            }

                            await loadEmployees();

                        } catch (error) {
                            console.error(
                                "CRM employee update error:",
                                error
                            );

                            alert(
                                error.message ||
                                "Не вдалося оновити працівника."
                            );
                        }
                    }
                );
            });

        list
            .querySelectorAll(
                ".crm-employee-delete"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const employeeId =
                            button.dataset.employeeId;

                        const employee =
                            employees.find(
                                (item) =>
                                    String(item.id) ===
                                    String(employeeId)
                            );

                        if (!employee) {
                            return;
                        }

                        const confirmed =
                            window.confirm(
                                `Видалити працівника "${employee.name}"?`
                            );

                        if (!confirmed) {
                            return;
                        }

                        try {
                            const response =
                                await fetch(
                                    `${getApiBaseUrl()}/api/crm/employees/${encodeURIComponent(employeeId)}`,
                                    {
                                        method: "DELETE",

                                        headers: {
                                            Authorization:
                                                `Bearer ${getToken()}`
                                        }
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    data.message ||
                                    "Не вдалося видалити працівника."
                                );
                            }

                            await loadEmployees();

                        } catch (error) {
                            console.error(
                                "CRM employee delete error:",
                                error
                            );

                            alert(
                                error.message ||
                                "Не вдалося видалити працівника."
                            );
                        }
                    }
                );
            });

    } catch (error) {
        console.error(
            "CRM employees load error:",
            error
        );

        count.textContent =
            "Не вдалося завантажити працівників.";

        list.innerHTML = "";
    }
}


function bindEmployeeForm() {
    const addButton =
        document.getElementById(
            "crmAddEmployeeButton"
        );

    const form =
        document.getElementById(
            "crmEmployeeForm"
        );

    if (!addButton || !form) {
        return;
    }

    addButton.addEventListener(
        "click",
        () => {
            form.hidden =
                !form.hidden;
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const name =
                document
                    .getElementById(
                        "crmEmployeeName"
                    )
                    ?.value.trim() || "";

            const phone =
                document
                    .getElementById(
                        "crmEmployeePhone"
                    )
                    ?.value.trim() || "";

            const email =
                document
                    .getElementById(
                        "crmEmployeeEmail"
                    )
                    ?.value.trim() || "";

            const role =
                document
                    .getElementById(
                        "crmEmployeeRole"
                    )
                    ?.value || "mechanic";

            const specialization =
                document
                    .getElementById(
                        "crmEmployeeSpecialization"
                    )
                    ?.value.trim() || "";

            const notes =
                document
                    .getElementById(
                        "crmEmployeeNotes"
                    )
                    ?.value.trim() || "";

            if (!name) {
                alert(
                    "Вкажіть ім'я працівника."
                );

                return;
            }

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/employees`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getToken()}`
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    phone,
                                    email,
                                    role,
                                    specialization,
                                    notes
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося додати працівника."
                    );
                }

                alert(
                    "Працівника додано."
                );

                form.reset();
                form.hidden = true;

                await loadEmployees();

            } catch (error) {
                console.error(
                    "CRM employee create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося додати працівника."
                );
            }
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadCrm();
        loadClients();
        loadCars();
        loadWorkOrders();
        loadAppointments();
        loadEmployees();

        bindClientForm();
        bindCarForm();
        bindWorkOrderForm();
        bindWorkOrdersSearch();
        bindAppointmentForm();
        bindEmployeeForm();
    }
);