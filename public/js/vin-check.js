"use strict";

const params =
    new URLSearchParams(
        window.location.search
    );

const vin =
    (params.get("vin") || "")
        .trim()
        .toUpperCase();

const vinValue =
    document.getElementById(
        "vinValue"
    );

const vinStatus =
    document.getElementById(
        "vinStatus"
    );

const vinResult =
    document.getElementById(
        "vinResult"
    );


/* ===== ДОПОМІЖНІ ФУНКЦІЇ ===== */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatNumber(value) {
    return new Intl.NumberFormat(
        "uk-UA"
    ).format(
        Number(value) || 0
    );
}


function formatDate(value) {
    if (!value) {
        return "Дата не вказана";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Дата не вказана";
    }

    return new Intl.DateTimeFormat(
        "uk-UA"
    ).format(date);
}


function isValidVin(value) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(
        value
    );
}


/* ===== ЗАВАНТАЖЕННЯ ОГОЛОШЕНЬ ІЗ POSTGRESQL ===== */

async function loadListings() {
    try {
        const response =
            await fetch(
                "/api/market/listings"
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити оголошення."
            );
        }

        return Array.isArray(
            data.listings
        )
            ? data.listings
            : [];

    } catch (error) {
        console.error(
            "VIN listings load error:",
            error
        );

        return [];
    }
}


/* ===== ВИВЕДЕННЯ АВТОМОБІЛЯ ===== */

function renderListing(listing) {
    const services =
        Array.isArray(
            listing.services
        )
            ? listing.services
            : [];

    if (vinStatus) {
        vinStatus.textContent =
            "Автомобіль знайдений у базі Royal Garage.";
    }

    const serviceCards =
        services.length > 0
            ? services
                .map(
                    (service) => `
                        <article class="vin-service-card">
                            <h3>
                                ${escapeHtml(
                                    service.title ||
                                    "Обслуговування"
                                )}
                            </h3>

                            <p>
                                <strong>
                                    Дата:
                                </strong>

                                ${formatDate(
                                    service.date
                                )}
                            </p>

                            <p>
                                <strong>
                                    Пробіг:
                                </strong>

                                ${formatNumber(
                                    service.mileage
                                )} км
                            </p>

                            ${
                                service.station
                                    ? `
                                        <p>
                                            <strong>
                                                СТО:
                                            </strong>

                                            ${escapeHtml(
                                                service.station
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                            ${
                                service.description
                                    ? `
                                        <p>
                                            ${escapeHtml(
                                                service.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }
                        </article>
                    `
                )
                .join("")
            : `
                <p>
                    Публічних записів обслуговування немає.
                </p>
            `;

    if (!vinResult) {
        return;
    }

    vinResult.innerHTML = `
        <section class="vin-vehicle-summary">
            <h2>
                ${escapeHtml(
                    listing.name ||
                    "Автомобіль"
                )}
                ${
                    listing.year
                        ? `(${escapeHtml(
                            listing.year
                        )})`
                        : ""
                }
            </h2>

            <p>
                <strong>
                    VIN:
                </strong>

                ${escapeHtml(
                    listing.vin ||
                    vin
                )}
            </p>

            <p>
                <strong>
                    Пробіг:
                </strong>

                ${formatNumber(
                    listing.mileage
                )} км
            </p>

            <p>
                <strong>
                    Двигун:
                </strong>

                ${escapeHtml(
                    listing.engine ||
                    listing.powerValue ||
                    "Не вказано"
                )}
            </p>

            <p>
                <strong>
                    Паливо:
                </strong>

                ${escapeHtml(
                    listing.fuel ||
                    "Не вказано"
                )}
            </p>

            <p>
                <strong>
                    Коробка:
                </strong>

                ${escapeHtml(
                    listing.transmission ||
                    "Не вказано"
                )}
            </p>

            <p>
                <strong>
                    Кузов:
                </strong>

                ${escapeHtml(
                    listing.body ||
                    "Не вказано"
                )}
            </p>

            <p>
                <strong>
                    Привід:
                </strong>

                ${escapeHtml(
                    listing.drive ||
                    "Не вказано"
                )}
            </p>

            <p>
                <strong>
                    Публічних записів обслуговування:
                </strong>

                ${services.length}
            </p>
        </section>

        <section class="vin-service-history">
            <h2>
                Історія обслуговування
            </h2>

            ${serviceCards}
        </section>
    `;
}


/* ===== ЗАПУСК VIN-ПЕРЕВІРКИ ===== */

async function initVinCheck() {
    if (vinValue) {
        vinValue.textContent =
            vin || "Не вказано";
    }

    if (!vin) {
        if (vinStatus) {
            vinStatus.textContent =
                "VIN-код не передано.";
        }

        if (vinResult) {
            vinResult.innerHTML = `
                <p>
                    Поверніться до оголошення та спробуйте ще раз.
                </p>
            `;
        }

        return;
    }

    if (!isValidVin(vin)) {
        if (vinStatus) {
            vinStatus.textContent =
                "VIN-код має неправильний формат.";
        }

        if (vinResult) {
            vinResult.innerHTML = `
                <p>
                    VIN повинен містити рівно 17 символів.
                </p>

                <p>
                    Символи I, O та Q у VIN не використовуються.
                </p>
            `;
        }

        return;
    }

    if (vinStatus) {
        vinStatus.textContent =
            "Перевіряємо автомобіль...";
    }

    const listings =
        await loadListings();

    const listing =
        listings.find(
            (item) =>
                String(
                    item.vin || ""
                )
                    .trim()
                    .toUpperCase() === vin
        );

    if (!listing) {
        if (vinStatus) {
            vinStatus.textContent =
                "Автомобіль не знайдений у базі Royal Garage.";
        }

        if (vinResult) {
            vinResult.innerHTML = `
                <p>
                    Формат VIN правильний, але активне оголошення
                    з таким VIN поки відсутнє.
                </p>
            `;
        }

        return;
    }

    renderListing(
        listing
    );
}


initVinCheck();