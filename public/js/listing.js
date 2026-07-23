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
}

    else 
    
           {

         
    const photos =
        Array.isArray(listing.photos)
            ? listing.photos
            : [];

            const mainPhotoIndex =
            Number.isInteger(listing.activePhotoIndex)
                ? listing.activePhotoIndex
                : 0;
        
        const mainPhoto =
            photos[mainPhotoIndex] ||
            photos[0] ||
            "";

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

            <p>
            Опубліковано:
            ${
                listing.createdAt
                    ? new Date(listing.createdAt)
                        .toLocaleDateString("uk-UA")
                    : "Дата не вказана"
            }
        </p>

        </section>

        <section class="listing-card">
            <h2>Основні параметри</h2>

            <<div class="listing-parameters">
            <p>
                <strong>Рік випуску:</strong>
                ${listing.year || "Не вказано"}
            </p>
        
            <p>
                <strong>Пробіг:</strong>
                ${Number(listing.mileage || 0).toLocaleString("uk-UA")} км
            </p>

            <p>
                <strong>Пальне:</strong>
                ${listing.fuel || "Не вказано"}
            </p>
        
            <p>
                <strong>Коробка:</strong>
                ${listing.transmission || "Не вказано"}
            </p>
        
            <p>
                <strong>Кузов:</strong>
                ${listing.body || "Не вказано"}
            </p>
        
            <p>
                <strong>Привід:</strong>
                ${listing.drive || "Не вказано"}
            </p>
        
            <p>
                <strong>
                    ${
                        listing.powerType === "battery"
                            ? "Ємність батареї:"
                            : "Об’єм двигуна:"
                    }
                </strong>
        
                ${
                    listing.powerValue
                        ? `${listing.powerValue} ${
                            listing.powerType === "battery"
                                ? "кВт·год"
                                : "л"
                        }`
                        : listing.engine || "Не вказано"
                }
            </p>
        
            <p>
                <strong>VIN-код:</strong>
                <span id="listingVinValue">
                    ${listing.vin || "Не вказано"}
                </span>
        
                ${
                    listing.vin
                        ? `
                            <button
                                type="button"
                                id="copyVinButton"
                                class="copy-vin-button"
                            >
                                Копіювати VIN
                            </button>
                        `
                        : ""
                }
            </p>
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

    const showPhoneButton =
    document.getElementById("showPhoneButton");

showPhoneButton.addEventListener("click", () => {
    showPhoneButton.textContent =
        listing.phone || "Номер не вказано";
});

const openChatButton =
    document.getElementById("openChatButton");

    openChatButton.addEventListener("click", () => {
        const currentUser = getCurrentUser();
    
        if (!currentUser) {
            alert("Спочатку увійдіть у свій профіль.");
            return;
        }
    
        window.location.href =
            `chat.html?listingId=${encodeURIComponent(listing.id)}`;
    });

    const copyVinButton =
    document.getElementById("copyVinButton");

if (copyVinButton) {
    copyVinButton.addEventListener(
        "click",
        async () => {
            try {
                await navigator.clipboard.writeText(
                    listing.vin
                );

                copyVinButton.textContent =
                    "Скопійовано ✓";

                setTimeout(() => {
                    copyVinButton.textContent =
                        "Копіювати VIN";
                }, 1500);
            } catch (error) {
                console.error(
                    "Не вдалося скопіювати VIN:",
                    error
                );

                alert(
                    "Не вдалося скопіювати VIN."
                );
            }
        }
    );
}


}