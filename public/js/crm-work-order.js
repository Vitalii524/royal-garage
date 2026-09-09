const CRM_TOKEN_KEY = "royalGarageToken";

let currentCrmWorkOrder = null;

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
        `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}`,
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

        const order =
            data.workOrder || null;

        currentCrmWorkOrder =
            order;

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

            const statusSelect =
            document.getElementById(
                "crmWorkOrderStatusSelect"
            );
        
        const statusMessage =
            document.getElementById(
                "crmWorkOrderStatusMessage"
            );
        
        if (statusSelect) {
            statusSelect.value =
                order.status || "new";
        }
        
        if (statusMessage) {
            statusMessage.textContent = "";
        }

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

        const [
            servicesTotal,
            partsTotal
        ] = await Promise.all([
            loadWorkOrderServices(
                workOrderId,
                services
            ),
            loadWorkOrderParts(
                workOrderId,
                parts
            )
        ]);
        
        const grandTotal =
            servicesTotal + partsTotal;
        
        total.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
            ">
                <span>Роботи</span>
                <strong>
                    ${servicesTotal.toFixed(2)} грн
                </strong>
            </div>
        
            <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
            ">
                <span>Запчастини</span>
                <strong>
                    ${partsTotal.toFixed(2)} грн
                </strong>
            </div>
        
            <div style="
                display: flex;
                justify-content: space-between;
                padding-top: 12px;
                margin-top: 8px;
                border-top: 1px solid #4b5563;
                font-size: 18px;
            ">
                <strong>Всього</strong>
                <strong>
                    ${grandTotal.toFixed(2)} грн
                </strong>
            </div>
        `;

        await loadWorkOrderHistory(
            workOrderId
        );

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
            return 0;
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

    return servicesTotal;

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
                return 0;
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

    return partsTotal;

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

function bindWorkOrderEdit() {
    const editButton =
        document.getElementById(
            "crmEditWorkOrderButton"
        );

    const form =
        document.getElementById(
            "crmWorkOrderEditForm"
        );

    const mileageInput =
        document.getElementById(
            "crmWorkOrderMileage"
        );

    const complaintInput =
        document.getElementById(
            "crmWorkOrderComplaint"
        );

    const diagnosticsInput =
        document.getElementById(
            "crmWorkOrderDiagnostics"
        );

    const cancelButton =
        document.getElementById(
            "crmCancelWorkOrderEdit"
        );

    const message =
        document.getElementById(
            "crmWorkOrderEditMessage"
        );

    if (
        !editButton ||
        !form ||
        !mileageInput ||
        !complaintInput ||
        !diagnosticsInput ||
        !cancelButton
    ) {
        return;
    }

    editButton.addEventListener(
        "click",
        () => {
            if (!currentCrmWorkOrder) {
                return;
            }

            mileageInput.value =
                currentCrmWorkOrder.mileage ?? "";

            complaintInput.value =
                currentCrmWorkOrder
                    .customerComplaint || "";

            diagnosticsInput.value =
                currentCrmWorkOrder
                    .diagnostics || "";

            if (message) {
                message.textContent = "";
            }

            form.hidden = false;
        }
    );

    cancelButton.addEventListener(
        "click",
        () => {
            form.hidden = true;

            if (message) {
                message.textContent = "";
            }
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const workOrderId =
                getWorkOrderId();

            if (!workOrderId) {
                return;
            }

            const payload = {
                mileage:
                    mileageInput.value,

                customerComplaint:
                    complaintInput.value.trim(),

                diagnostics:
                    diagnosticsInput.value.trim()
            };

            if (message) {
                message.textContent =
                    "Збереження...";
            }

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}`,
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
                        "Не вдалося зберегти зміни."
                    );
                }

                form.hidden = true;

                await loadWorkOrder();

            } catch (error) {
                console.error(
                    "CRM work order edit error:",
                    error
                );

                if (message) {
                    message.textContent =
                        error.message ||
                        "Помилка збереження.";
                }
            }
        }
    );
}

async function loadWorkOrderHistory(
    workOrderId
) {
    const container =
        document.getElementById(
            "crmWorkOrderHistory"
        );

    if (!container) {
        return;
    }

    const statusLabels = {
        new: "Новий",
        in_progress: "В роботі",
        ready: "Готовий",
        completed: "Виданий"
    };

    try {
        const response =
            await fetch(
                `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/events`,
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
                "Не вдалося завантажити історію."
            );
        }

        const events =
            Array.isArray(data.events)
                ? data.events
                : [];

        container.innerHTML = "";

        if (events.length === 0) {
            container.textContent =
                "Історія змін ще порожня.";

            return;
        }

        events.forEach(
            (event) => {
                const row =
                    document.createElement(
                        "div"
                    );

                row.style.padding =
                    "12px 0";

                row.style.borderTop =
                    "1px solid #374151";

                const title =
                    document.createElement(
                        "div"
                    );

                title.style.fontWeight =
                    "600";

                if (
                    event.eventType ===
                    "status_changed"
                ) {
                    const oldStatus =
                        statusLabels[
                            event.oldStatus
                        ] ||
                        event.oldStatus ||
                        "—";

                    const newStatus =
                        statusLabels[
                            event.newStatus
                        ] ||
                        event.newStatus ||
                        "—";

                    title.textContent =
                        `${oldStatus} → ${newStatus}`;

                } else {
                    title.textContent =
                        event.message ||
                        "Подія";
                }

                const date =
                    document.createElement(
                        "div"
                    );

                date.className =
                    "crm-muted";

                date.style.marginTop =
                    "4px";

                if (event.createdAt) {
                    date.textContent =
                        new Date(
                            event.createdAt
                        ).toLocaleString(
                            "uk-UA"
                        );
                }

                row.appendChild(
                    title
                );

                row.appendChild(
                    date
                );

                container.appendChild(
                    row
                );
            }
        );

    } catch (error) {
        console.error(
            "CRM work order history load error:",
            error
        );

        container.textContent =
            error.message ||
            "Не вдалося завантажити історію.";
    }
}

function bindWorkOrderStatus() {
    const statusSelect =
        document.getElementById(
            "crmWorkOrderStatusSelect"
        );

    const statusMessage =
        document.getElementById(
            "crmWorkOrderStatusMessage"
        );

    if (!statusSelect) {
        return;
    }

    statusSelect.addEventListener(
        "change",
        async () => {
            const workOrderId =
                getWorkOrderId();

            if (!workOrderId) {
                return;
            }

            const newStatus =
                statusSelect.value;

            statusSelect.disabled = true;

            if (statusMessage) {
                statusMessage.textContent =
                    "Збереження...";
            }

            try {
                const response =
                    await fetch(
                        `${getApiBaseUrl()}/api/crm/work-orders/${encodeURIComponent(workOrderId)}/status`,
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
                                    status: newStatus
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося змінити статус."
                    );
                }

                if (statusMessage) {
                    statusMessage.textContent =
                        "Збережено";
                }

                await loadWorkOrderHistory(
                    workOrderId
                );

            } catch (error) {
                console.error(
                    "CRM work order status update error:",
                    error
                );
            
                alert(
                    error.message ||
                    "Не вдалося змінити статус."
                );
            
                if (statusMessage) {
                    statusMessage.textContent =
                        "Помилка";
                }
            
                await loadWorkOrder();

            } finally {
                statusSelect.disabled = false;
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
        bindWorkOrderStatus();
        bindWorkOrderEdit();
    }
);