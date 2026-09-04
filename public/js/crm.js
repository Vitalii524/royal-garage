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

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadCrm();
        bindClientForm();
    }
);