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

document.addEventListener(
    "DOMContentLoaded",
    loadCrm
);