"use strict";

const params =
    new URLSearchParams(window.location.search);

const vin =
    (params.get("vin") || "")
        .trim()
        .toUpperCase();

const vinValue =
    document.getElementById("vinValue");

const vinStatus =
    document.getElementById("vinStatus");

const vinResult =
    document.getElementById("vinResult");

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNumber(value) {
    return new Intl.NumberFormat("uk-UA").format(
        Number(value) || 0
    );
}

function formatDate(value) {
    if (!value) {
        return "Дата не вказана";
    }

    return new Intl.DateTimeFormat("uk-UA").format(
        new Date(`${value}T00:00:00`)
    );
}

function isValidVin(value) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(value);
}

function loadListings() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "royalGarageMarketListings"
            )
        ) || [];
    } catch (error) {
        console.error(
            "Не вдалося завантажити оголошення:",
            error
        );

        return [];
    }
}

if (vinValue) {
    vinValue.textContent =
        vin || "Не вказано";
}

if (!vin) {
    vinStatus.textContent =
        "VIN-код не передано.";

    vinResult.innerHTML = `
        <p>
            Поверніться до оголошення та спробуйте ще раз.
        </p>
    `;
} else if (!isValidVin(vin)) {
    vinStatus.textContent =
        "VIN-код має неправильний формат.";

    vinResult.innerHTML = `
        <p>
            VIN повинен містити рівно 17 символів.
        </p>

        <p>
            Символи I, O та Q у VIN не використовуються.
        </p>
    `;
} else {
    const listings = loadListings();

    const listing = listings.find(
        item =>
            (item.vin || "")
                .trim()
                .toUpperCase() === vin
    );

    if (!listing) {
        vinStatus.textContent =
            "Автомобіль не знайдений у базі Royal Garage.";

        vinResult.innerHTML = `
            <p>
                Формат VIN правильний, але оголошення
                з таким VIN поки відсутнє.
            </p>
        `;
    } else {
        const services =
            Array.isArray(listing.services)
                ? listing.services
                : [];

        vinStatus.textContent =
            "Автомобіль знайдений у базі Royal Garage.";

        const serviceCards = services.length
            ? services.map(service => `
                <article class="vin-service-card">
                    <h3>
                        ${escapeHtml(service.title)}
                    </h3>

                    <p>
                        <strong>Дата:</strong>
                        ${formatDate(service.date)}
                    </p>

                    <p>
                        <strong>Пробіг:</strong>
                        ${formatNumber(service.mileage)} км
                    </p>

                    ${
                        service.station
                            ? `
                                <p>
                                    <strong>СТО:</strong>
                                    ${escapeHtml(service.station)}
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
            `).join("")
            : `
                <p>
                    Публічних записів обслуговування немає.
                </p>
            `;

        vinResult.innerHTML = `
            <section class="vin-vehicle-summary">
                <h2>
                    ${escapeHtml(listing.name)}
                    (${escapeHtml(listing.year)})
                </h2>

                <p>
                    <strong>VIN:</strong>
                    ${escapeHtml(listing.vin)}
                </p>

                <p>
                    <strong>Пробіг:</strong>
                    ${formatNumber(listing.mileage)} км
                </p>

                <p>
                    <strong>Двигун:</strong>
                    ${escapeHtml(
                        listing.engine ||
                        listing.powerValue ||
                        "Не вказано"
                    )}
                </p>

                <p>
                    <strong>Паливо:</strong>
                    ${escapeHtml(
                        listing.fuel || "Не вказано"
                    )}
                </p>

                <p>
                    <strong>Коробка:</strong>
                    ${escapeHtml(
                        listing.transmission ||
                        "Не вказано"
                    )}
                </p>

                <p>
                    <strong>Кузов:</strong>
                    ${escapeHtml(
                        listing.body || "Не вказано"
                    )}
                </p>

                <p>
                    <strong>Привід:</strong>
                    ${escapeHtml(
                        listing.drive || "Не вказано"
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
                <h2>Історія обслуговування</h2>

                ${serviceCards}
            </section>
        `;
    }
}