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
                                ${order.status || "—"}
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

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadCrm();
        loadClients();
        loadCars();
        loadWorkOrders();
        bindClientForm();
        bindCarForm();
        bindWorkOrderForm();
        bindWorkOrdersSearch();
    }
);