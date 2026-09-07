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

function getWorkOrderId() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    return String(
        params.get("id") || ""
    ).trim();
}

async function loadWorkOrder() {
    const workOrderId =
        getWorkOrderId();

    const title =
        document.getElementById(
            "crmWorkOrderTitle"
        );

    const status =
        document.getElementById(
            "crmWorkOrderStatus"
        );

    const info =
        document.getElementById(
            "crmWorkOrderInfo"
        );

    const services =
        document.getElementById(
            "crmWorkOrderServices"
        );

    const parts =
        document.getElementById(
            "crmWorkOrderParts"
        );

    const total =
        document.getElementById(
            "crmWorkOrderTotal"
        );

    if (!workOrderId) {
        status.textContent =
            "ID наряду не вказано.";

        info.textContent =
            "Не вдалося відкрити наряд.";

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
                "Не вдалося завантажити наряд."
            );
        }

        const workOrders =
            Array.isArray(data.workOrders)
                ? data.workOrders
                : [];

        const order =
            workOrders.find(
                (item) =>
                    String(item.id) ===
                    workOrderId
            );

        if (!order) {
            status.textContent =
                "Наряд не знайдено.";

            info.textContent =
                "Наряд відсутній або недоступний.";

            return;
        }

        title.textContent =
            order.orderNumber ||
            "Замовлення-наряд";

        status.textContent =
            `Статус: ${order.status || "—"}`;

        info.innerHTML = `
            <div>
                <strong>Клієнт</strong>
                <div>
                    ${order.clientName || "—"}
                </div>

                ${
                    order.clientPhone
                        ? `<div>${order.clientPhone}</div>`
                        : ""
                }
            </div>

            <div>
                <strong>Автомобіль</strong>
                <div>
                    ${order.brand || ""}
                    ${order.model || ""}
                </div>

                ${
                    order.year
                        ? `<div>Рік: ${order.year}</div>`
                        : ""
                }

                ${
                    order.plate
                        ? `<div>Номер: ${order.plate}</div>`
                        : ""
                }

                ${
                    order.vin
                        ? `<div>VIN: ${order.vin}</div>`
                        : ""
                }
            </div>

            <div>
                <strong>Приймання</strong>

                ${
                    order.mileage != null
                        ? `<div>Пробіг: ${order.mileage} км</div>`
                        : "<div>Пробіг: —</div>"
                }

                ${
                    order.customerComplaint
                        ? `<div>Скарга: ${order.customerComplaint}</div>`
                        : ""
                }

                ${
                    order.diagnostics
                        ? `<div>Діагностика: ${order.diagnostics}</div>`
                        : ""
                }
            </div>
        `;

        total.textContent =
            `Сума: ${Number(
                order.totalAmount || 0
            ).toFixed(2)} грн`;

        await Promise.all([
            loadWorkOrderServices(
                workOrderId,
                services
            ),
            loadWorkOrderParts(
                workOrderId,
                parts
            )
        ]);

    } catch (error) {
        console.error(
            "CRM work order load error:",
            error
        );

        status.textContent =
            "Помилка завантаження.";

        info.textContent =
            error.message ||
            "Не вдалося завантажити наряд.";
    }
}

async function loadWorkOrderServices(
    workOrderId,
    container
) {
    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/services`,
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
                "Не вдалося завантажити роботи."
            );
        }

        const items =
            Array.isArray(data.services)
                ? data.services
                : [];

        if (items.length === 0) {
            container.textContent =
                "Робіт ще немає.";
            return;
        }

        const servicesTotal =
        items.reduce(
            (sum, item) =>
                sum + Number(item.total || 0),
            0
        );
    
    container.innerHTML = `
        ${items
            .map(
                (item) => `
                    <div style="
                        padding: 12px 0;
                        border-top: 1px solid #374151;
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                    ">
                        <strong>
                            ${item.name || ""}
                        </strong>
    
                        <strong>
                            ${Number(
                                item.total || 0
                            ).toFixed(2)} грн
                        </strong>
                    </div>
                `
            )
            .join("")}
    
        <div style="
            padding-top: 14px;
            border-top: 1px solid #4b5563;
            text-align: right;
            font-weight: bold;
        ">
            Разом роботи:
            ${servicesTotal.toFixed(2)} грн
        </div>
    `;

    } catch (error) {
        console.error(
            "CRM work order services load error:",
            error
        );

        container.textContent =
            "Не вдалося завантажити роботи.";
    }
}

async function loadWorkOrderParts(
    workOrderId,
    container
) {
    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/parts`,
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
                "Не вдалося завантажити запчастини."
            );
        }

        const items =
            Array.isArray(data.parts)
                ? data.parts
                : [];

        if (items.length === 0) {
            container.textContent =
                "Запчастин ще немає.";
            return;
        }

        const partsTotal =
        items.reduce(
            (sum, item) =>
                sum + Number(item.total || 0),
            0
        );
    
    container.innerHTML = `
        ${items
            .map(
                (item) => `
                    <div style="
                        padding: 12px 0;
                        border-top: 1px solid #374151;
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                    ">
                        <div>
                            <strong>
                                ${item.name || ""}
                            </strong>
    
                            ${
                                item.partNumber
                                    ? `<div>Артикул: ${item.partNumber}</div>`
                                    : ""
                            }
    
                            <div style="
                                opacity: 0.8;
                                margin-top: 4px;
                            ">
                                ${Number(item.quantity || 0)}
                                ×
                                ${Number(item.price || 0).toFixed(2)} грн
                            </div>
                        </div>
    
                        <strong>
                            ${Number(
                                item.total || 0
                            ).toFixed(2)} грн
                        </strong>
                    </div>
                `
            )
            .join("")}
    
        <div style="
            padding-top: 14px;
            border-top: 1px solid #4b5563;
            text-align: right;
            font-weight: bold;
        ">
            Разом запчастини:
            ${partsTotal.toFixed(2)} грн
        </div>
    `;

    } catch (error) {
        console.error(
            "CRM work order parts load error:",
            error
        );

        container.textContent =
            "Не вдалося завантажити запчастини.";
    }
}

function bindServiceForm() {
    const button =
        document.getElementById(
            "crmAddServiceButton"
        );

    const form =
        document.getElementById(
            "crmServiceForm"
        );

    const nameInput =
        document.getElementById(
            "crmServiceName"
        );

    const priceInput =
        document.getElementById(
            "crmServicePrice"
        );

    const notesInput =
        document.getElementById(
            "crmServiceNotes"
        );

    if (
        !button ||
        !form ||
        !nameInput ||
        !priceInput ||
        !notesInput
    ) {
        return;
    }

    button.addEventListener(
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

            const workOrderId =
                getWorkOrderId();

            if (!workOrderId) {
                alert(
                    "Не вдалося визначити наряд."
                );
                return;
            }

            const payload = {
                name:
                    nameInput.value.trim(),
                quantity:
                    1,
                price:
                    priceInput.value,
                notes:
                    notesInput.value.trim()
            };

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/services`,
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
                        "Не вдалося додати роботу."
                    );
                }

                form.reset();

                form.hidden =
                    true;

                await loadWorkOrder();

            } catch (error) {
                console.error(
                    "CRM service create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося додати роботу."
                );
            }
        }
    );
}

function bindPartForm() {
    const button =
        document.getElementById(
            "crmAddPartButton"
        );

    const form =
        document.getElementById(
            "crmPartForm"
        );

    const nameInput =
        document.getElementById(
            "crmPartName"
        );

    const partNumberInput =
        document.getElementById(
            "crmPartNumber"
        );

    const quantityInput =
        document.getElementById(
            "crmPartQuantity"
        );

    const priceInput =
        document.getElementById(
            "crmPartPrice"
        );

    const notesInput =
        document.getElementById(
            "crmPartNotes"
        );

    if (
        !button ||
        !form ||
        !nameInput ||
        !partNumberInput ||
        !quantityInput ||
        !priceInput ||
        !notesInput
    ) {
        return;
    }

    button.addEventListener(
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

            const workOrderId =
                getWorkOrderId();

            if (!workOrderId) {
                alert(
                    "Не вдалося визначити наряд."
                );
                return;
            }

            const payload = {
                name:
                    nameInput.value.trim(),
                partNumber:
                    partNumberInput.value.trim(),
                quantity:
                    quantityInput.value,
                price:
                    priceInput.value,
                notes:
                    notesInput.value.trim()
            };

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/parts`,
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
                        "Не вдалося додати запчастину."
                    );
                }

                form.reset();

                quantityInput.value =
                    "1";

                form.hidden =
                    true;

                await loadWorkOrder();

            } catch (error) {
                console.error(
                    "CRM part create error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося додати запчастину."
                );
            }
        }
    );
}
document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadWorkOrder();
        bindServiceForm();
        bindPartForm();
    }
);