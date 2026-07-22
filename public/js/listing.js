"use strict";

const MARKET_STORAGE_KEY =
    "royalGarageMarketListings";

const listingDetails =
    document.getElementById("listingDetails");

const urlParams =
    new URLSearchParams(window.location.search);

const listingId =
    urlParams.get("id");

let listings = [];

try {
    listings = JSON.parse(
        localStorage.getItem(MARKET_STORAGE_KEY)
    ) || [];
} catch (error) {
    console.error(
        "Не вдалося завантажити оголошення:",
        error
    );
}

const listing = listings.find(
    (item) => item.id === listingId
);

if (!listing) {
    listingDetails.innerHTML = `
        <div class="listing-card">
            <h1>Оголошення не знайдено</h1>
            <p>Воно могло бути видалене.</p>
        </div>
    `;
} else {
    const photos =
        Array.isArray(listing.photos)
            ? listing.photos
            : [];

    const mainPhoto = photos[0] || "";

    listingDetails.innerHTML = `
        <section class="listing-card listing-gallery">
            ${
                mainPhoto
                    ? `
                        <img
                            class="listing-main-photo"
                            src="${mainPhoto}"
                            alt="${listing.name}"
                        >
                    `
                    : `
                        <div class="listing-no-photo">
                            🚗 Немає фотографії
                        </div>
                    `
            }
        </section>

        <section class="listing-card">
            <h1>
                ${listing.name} (${listing.year})
            </h1>

            <h2 class="listing-price">
                ${Number(listing.priceUsd).toLocaleString("uk-UA")} $
            </h2>

            <p>
                ≈ ${Number(listing.priceUah || 0).toLocaleString("uk-UA")} грн
            </p>

            <p>📍 ${listing.city}</p>
        </section>

        <section class="listing-card">
            <h2>Основні параметри</h2>

            <div class="listing-parameters">
                <p><strong>Пробіг:</strong> ${Number(listing.mileage).toLocaleString("uk-UA")} км</p>
                <p><strong>Пальне:</strong> ${listing.fuel}</p>
                <p><strong>Коробка:</strong> ${listing.transmission}</p>
                <p><strong>Кузов:</strong> ${listing.body}</p>
                <p><strong>Привід:</strong> ${listing.drive}</p>
            </div>
        </section>

        <section class="listing-card">
            <h2>Опис автомобіля</h2>

            <p class="listing-description">
                ${listing.description || "Опис не додано."}
            </p>
        </section>

        <section class="listing-card seller-card">
            <h2>Продавець</h2>

            <p>Місто: ${listing.city}</p>

            <button
                type="button"
                id="showPhoneButton"
                class="primary-button"
            >
                Показати номер
            </button>

            <button
                type="button"
                id="openChatButton"
                class="secondary-button"
            >
                Написати продавцю
            </button>
        </section>
    `;
}