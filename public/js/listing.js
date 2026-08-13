"use strict";


const MARKET_STORAGE_KEY =
    "royalGarageMarketListings";

    /* ===== РЕПУТАЦІЯ ПРОДАВЦІВ ===== */

    async function getSellerRatingData(
        sellerId
    ) {
        const normalizedSellerId =
            String(
                sellerId || ""
            );
    
        if (!normalizedSellerId) {
            return {
                average: 0,
                count: 0
            };
        }
    
        try {
            const response =
                await fetch(
                    `/api/sellers/${
                        encodeURIComponent(
                            normalizedSellerId
                        )
                    }/rating`
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося завантажити рейтинг продавця."
                );
            }
    
            return {
                average:
                    Number(
                        data.rating?.average ||
                        0
                    ),
    
                count:
                    Number(
                        data.rating?.count ||
                        0
                    )
            };
    
        } catch (error) {
            console.error(
                "Listing seller rating load error:",
                error
            );
    
            return {
                average: 0,
                count: 0
            };
        }
    }


    async function saveSellerVote(
        sellerId,
        voterId,
        rating
    ) {
        const normalizedSellerId =
            String(
                sellerId || ""
            );
    
        const normalizedRating =
            Number(rating);
    
        if (
            !normalizedSellerId ||
            !Number.isInteger(
                normalizedRating
            ) ||
            normalizedRating < 1 ||
            normalizedRating > 5
        ) {
            return false;
        }
    
        const token =
            localStorage.getItem(
                "royalGarageToken"
            );
    
        if (!token) {
            alert(
                "Сесія недійсна. Увійдіть повторно."
            );
    
            return false;
        }
    
        try {
            const response =
                await fetch(
                    `/api/sellers/${
                        encodeURIComponent(
                            normalizedSellerId
                        )
                    }/rating`,
                    {
                        method: "POST",
    
                        headers: {
                            "Content-Type":
                                "application/json",
    
                            Authorization:
                                `Bearer ${token}`
                        },
    
                        body:
                            JSON.stringify({
                                rating:
                                    normalizedRating
                            })
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося зберегти оцінку."
                );
            }
    
            return true;
    
        } catch (error) {
            console.error(
                "Seller vote save error:",
                error
            );
    
            alert(
                error.message ||
                "Не вдалося зберегти оцінку."
            );
    
            return false;
        }
    }

/* ===== ЗБЕРЕЖЕННЯ ВІДГУКУ ПРО ПРОДАВЦЯ ===== */

async function saveSellerReview(
    sellerId,
    voterId,
    voterName,
    ratingValue,
    reviewText
) {
    const normalizedSellerId =
        String(sellerId || "");

    const normalizedVoterId =
        String(voterId || "");

    const normalizedRating =
        Number(ratingValue);

    const normalizedReviewText =
        String(reviewText || "")
            .trim()
            .slice(0, 1000);

    if (
        normalizedSellerId ===
        normalizedVoterId
    ) {
        return false;
    }

    if (
        !normalizedSellerId ||
        !normalizedVoterId ||
        !Number.isInteger(
            normalizedRating
        ) ||
        normalizedRating < 1 ||
        normalizedRating > 5
    ) {
        return false;
    }

    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        alert(
            "Сесія недійсна. Увійдіть повторно."
        );

        return false;
    }

    try {
        const response =
            await fetch(
                `/api/sellers/${
                    encodeURIComponent(
                        normalizedSellerId
                    )
                }/rating`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            rating:
                                normalizedRating,

                            review:
                                normalizedReviewText
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося зберегти відгук."
            );
        }

        return true;

    } catch (error) {
        console.error(
            "Seller review save error:",
            error
        );

        alert(
            error.message ||
            "Не вдалося зберегти відгук."
        );

        return false;
    }
}

async function getSellerReviews(
    sellerId
) {
    const normalizedSellerId =
        String(
            sellerId || ""
        );

    if (!normalizedSellerId) {
        return [];
    }

    try {
        const response =
            await fetch(
                `/api/sellers/${
                    encodeURIComponent(
                        normalizedSellerId
                    )
                }/reviews`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити відгуки продавця."
            );
        }

        return Array.isArray(
            data.reviews
        )
            ? data.reviews
            : [];

    } catch (error) {
        console.error(
            "Listing seller reviews load error:",
            error
        );

        return [];
    }
}


function formatSellerRating(
average,
count
) {
if (count === 0) {
    return "Новий продавець";
}

return `${average.toFixed(1)} із 5`;
}

function getRatingCountLabel(count) {
    const value = Number(count) || 0;

    const lastTwoDigits =
        value % 100;

    const lastDigit =
        value % 10;

    if (
        lastTwoDigits >= 11 &&
        lastTwoDigits <= 14
    ) {
        return `${value} оцінок`;
    }

    if (lastDigit === 1) {
        return `${value} оцінка`;
    }

    if (
        lastDigit >= 2 &&
        lastDigit <= 4
    ) {
        return `${value} оцінки`;
    }

    return `${value} оцінок`;
}

const listingDetails =
    document.getElementById(
        "listingDetails"
    );


const urlParams =
    new URLSearchParams(
        window.location.search
    );


const listingId =
    urlParams.get("id");


let listings = [];


/* ===== ЗАВАНТАЖЕННЯ ОГОЛОШЕННЯ З POSTGRESQL ===== */

async function loadListingPage() {
    let listing = null;

    try {
        const response = await fetch(
            `/api/market/listings/${encodeURIComponent(
                listingId
            )}`
        );

        const data =
            await response.json();

        if (
            response.ok &&
            data.listing
        ) {
            const item =
                data.listing;

            listing = {
                ...item,

                ownerId:
                    item.owner_id ??
                    item.ownerId,

                sellerName:
                    item.seller_name ??
                    item.sellerName,

                carId:
                    item.car_id ??
                    item.carId,

                activePhotoIndex:
                    item.active_photo_index ??
                    item.activePhotoIndex ??
                    0,

                powerType:
                    item.power_type ??
                    item.powerType,

                powerValue:
                    item.power_value ??
                    item.powerValue,

                priceUsd:
                    item.price_usd ??
                    item.priceUsd,

                priceUah:
                    item.price_uah ??
                    item.priceUah,

                createdAt:
                    item.created_at ??
                    item.createdAt,

                updatedAt:
                    item.updated_at ??
                    item.updatedAt
            };
        }

    } catch (error) {
        console.error(
            "Не вдалося завантажити оголошення:",
            error
        );
    }



/* ===== ОГОЛОШЕННЯ НЕ ЗНАЙДЕНО ===== */

if (!listing) {
    if (listingDetails) {
        listingDetails.innerHTML = `
            <div class="listing-card">
                <h1>
                    Оголошення не знайдено
                </h1>

                <p>
                    Воно могло бути видалене.
                </p>

                <a
                    href="market.html"
                    class="primary-button"
                >
                    Повернутися на маркет
                </a>
            </div>
        `;
    }
} else {
    /* ===== ФОТОГРАФІЇ ===== */

    const photos =
        Array.isArray(listing.photos)
            ? listing.photos
            : listing.photo
                ? [listing.photo]
                : [];


    const requestedMainPhotoIndex =
        Number.isInteger(
            listing.activePhotoIndex
        )
            ? listing.activePhotoIndex
            : 0;


    const mainPhotoIndex =
        photos.length > 0
            ? Math.min(
                Math.max(
                    requestedMainPhotoIndex,
                    0
                ),
                photos.length - 1
            )
            : 0;


    const mainPhoto =
        photos[mainPhotoIndex] ||
        photos[0] ||
        "";


    /* ===== ВИЗНАЧЕННЯ ВЛАСНИКА ===== */

    const currentUser =
        typeof getCurrentUser === "function"
            ? getCurrentUser()
            : null;


    const currentUserId =
        currentUser?.id ||
        currentUser?.userId ||
        currentUser?.email ||
        "";


    const listingOwnerId =
        listing.ownerId ||
        listing.userId ||
        listing.sellerId ||
        listing.ownerEmail ||
        listing.email ||
        "";


    const isListingOwner =
        Boolean(
            currentUser &&
            currentUserId &&
            listingOwnerId &&
            String(currentUserId) ===
                String(listingOwnerId)
        );

        /* ===== ДАНІ РЕПУТАЦІЇ ПРОДАВЦЯ ===== */

const sellerRatingData =
await getSellerRatingData(
    listingOwnerId
);


const currentUserVote = 0;

    const sellerReviews =
   await getSellerReviews(
        listingOwnerId
    );

const currentUserReview =
    currentUserId
        ? sellerReviews.find(
            (review) =>
                String(review.userId) ===
                String(currentUserId)
        )
        : null;

        const visibleSellerReviews =
    sellerReviews.filter(
        (review) =>
            String(
                review.text || ""
            ).trim().length > 0
    );


const canRateSeller =
Boolean(
    currentUser &&
    listingOwnerId &&
    !isListingOwner
);


    /* ===== ВИВЕДЕННЯ ОГОЛОШЕННЯ ===== */

    if (listingDetails) {
        listingDetails.innerHTML = `
            <section
                class="listing-card listing-gallery"
            >
                ${
                    mainPhoto
                        ? `
                            <div
                                class="listing-photo-stage"
                            >
                                <button
                                    type="button"
                                    id="previousListingPhoto"
                                    class="listing-photo-arrow listing-photo-arrow-left"
                                    aria-label="Попереднє фото"
                                >
                                    ‹
                                </button>

                                <img
                                    id="listingMainPhoto"
                                    class="listing-main-photo"
                                    src="${mainPhoto}"
                                    alt="${listing.name || "Автомобіль"}"
                                >

                                <button
                                    type="button"
                                    id="nextListingPhoto"
                                    class="listing-photo-arrow listing-photo-arrow-right"
                                    aria-label="Наступне фото"
                                >
                                    ›
                                </button>

                                <div
                                    id="listingPhotoCounter"
                                    class="listing-photo-counter"
                                >
                                    ${mainPhotoIndex + 1}
                                    /
                                    ${photos.length}
                                </div>
                            </div>

                            <div
                                id="listingPhotoThumbnails"
                                class="listing-photo-thumbnails"
                            >
                                ${photos
                                    .map(
                                        (
                                            photo,
                                            index
                                        ) => `
                                            <button
                                                type="button"
                                                class="listing-photo-thumbnail ${
                                                    index ===
                                                    mainPhotoIndex
                                                        ? "is-active"
                                                        : ""
                                                }"
                                                data-photo-index="${index}"
                                                aria-label="Відкрити фото ${
                                                    index + 1
                                                }"
                                            >
                                                <img
                                                    src="${photo}"
                                                    alt="${
                                                        listing.name ||
                                                        "Автомобіль"
                                                    }, фото ${
                                                        index + 1
                                                    }"
                                                >
                                            </button>
                                        `
                                    )
                                    .join("")}
                            </div>
                        `
                        : `
                            <div
                                class="listing-no-photo"
                            >
                                🚗 Немає фотографії
                            </div>
                        `
                }
            </section>


            <section class="listing-card">
                <h1>
                    ${
                        listing.name ||
                        "Автомобіль"
                    }
                    (
                    ${
                        listing.year ||
                        "рік не вказано"
                    }
                    )
                </h1>

                <h2 class="listing-price">
                    ${Number(
                        listing.priceUsd || 0
                    ).toLocaleString(
                        "uk-UA"
                    )}
                    $
                </h2>

                <p>
                    ≈
                    ${Number(
                        listing.priceUah || 0
                    ).toLocaleString(
                        "uk-UA"
                    )}
                    грн
                </p>

                <p>
                    📍
                    ${
                        listing.city ||
                        "Місто не вказано"
                    }
                </p>

                <p>
                    Опубліковано:
                    ${
                        listing.createdAt
                            ? new Date(
                                listing.createdAt
                            ).toLocaleDateString(
                                "uk-UA"
                            )
                            : "Дата не вказана"
                    }
                </p>
            </section>


            <section class="listing-card">
                <h2>
                    Основні параметри
                </h2>

                <div
                    class="listing-parameters"
                >
                    <p>
                        <strong>
                            Рік випуску:
                        </strong>

                        ${
                            listing.year ||
                            "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            Пробіг:
                        </strong>

                        ${Number(
                            listing.mileage || 0
                        ).toLocaleString(
                            "uk-UA"
                        )}
                        км
                    </p>

                    <p>
                        <strong>
                            Пальне:
                        </strong>

                        ${
                            listing.fuel ||
                            "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            Коробка:
                        </strong>

                        ${
                            listing.transmission ||
                            "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            Кузов:
                        </strong>

                        ${
                            listing.body ||
                            "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            Привід:
                        </strong>

                        ${
                            listing.drive ||
                            "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            ${
                                listing.powerType ===
                                "battery"
                                    ? "Ємність батареї:"
                                    : "Об’єм двигуна:"
                            }
                        </strong>

                        ${
                            listing.powerValue
                                ? `
                                    ${listing.powerValue}
                                    ${
                                        listing.powerType ===
                                        "battery"
                                            ? "кВт·год"
                                            : "л"
                                    }
                                `
                                : listing.engine ||
                                  "Не вказано"
                        }
                    </p>

                    <p>
                        <strong>
                            VIN-код:
                        </strong>

                        <span
                            id="listingVinValue"
                        >
                            ${
                                listing.vin ||
                                "Не вказано"
                            }
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
                <h2>
                    Опис автомобіля
                </h2>

                <p
                    class="listing-description"
                >
                    ${
                        listing.description ||
                        "Опис не додано."
                    }
                </p>
            </section>


            <section
                class="listing-card seller-card"
            >
                <h2>
                    Продавець
                </h2>

                <div
    class="seller-reputation"
    id="sellerReputation"
>
    <div class="seller-rating-summary">
        <div
            class="seller-rating-display"
            aria-label="Рейтинг продавця ${
                sellerRatingData.count > 0
                    ? sellerRatingData.average.toFixed(1)
                    : "ще не сформовано"
            }"
        >
            ${[1, 2, 3, 4, 5]
                .map(
                    (star) => `
                        <span
                            class="seller-display-star ${
                                star <=
                                Math.round(
                                    sellerRatingData.average
                                )
                                    ? "is-filled"
                                    : ""
                            }"
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    `
                )
                .join("")}
        </div>

        <strong
            class="seller-rating-number"
            id="sellerRatingNumber"
        >
            ${
                sellerRatingData.count > 0
                    ? sellerRatingData.average.toFixed(1)
                    : "—"
            }
        </strong>

        <span
            class="seller-rating-count"
            id="sellerRatingCount"
        >
            ${
                sellerRatingData.count === 0
                    ? "Новий продавець"
                    :getRatingCountLabel(
                        sellerRatingData.count
                    )
            }
        </span>
    </div>

    ${
        isListingOwner
        ? `
            <p class="seller-rating-message">
                ${
                    sellerRatingData.count === 0
                        ? "Вам ще не поставили жодної оцінки."
                        : `Вам поставили ${sellerRatingData.average.toFixed(1)} із 5 на основі ${sellerRatingData.count} ${
                            sellerRatingData.count === 1
                                ? "оцінки"
                                : "оцінок"
                        }.`
                }
            </p>
        `
            : !currentUser
                ? `
                    <p class="seller-rating-message">
                        Увійдіть, щоб оцінити продавця.
                    </p>
                `
                : canRateSeller
                    ? `
                        <div
                            class="seller-rating-form"
                            id="sellerRatingForm"
                        >
                            <p>
                                ${
                                    currentUserVote
                                        ? "Ваша оцінка:"
                                        : "Оцініть продавця:"
                                }
                            </p>

                            <div
                                class="seller-rating-buttons"
                                role="radiogroup"
                                aria-label="Оцінка продавця"
                            >
                                ${[1, 2, 3, 4, 5]
                                    .map(
                                        (star) => `
                                            <button
                                                type="button"
                                                class="seller-rating-button ${
                                                    star <=
                                                    currentUserVote
                                                        ? "is-selected"
                                                        : ""
                                                }"
                                                data-rating-value="${star}"
                                                aria-label="${star} із 5"
                                                aria-pressed="${
                                                    star ===
                                                    currentUserVote
                                                }"
                                            >
                                                ★
                                            </button>
                                        `
                                    )
                                    .join("")}
                            </div>

                            <p
                                class="seller-rating-status"
                                id="sellerRatingStatus"
                                aria-live="polite"
                            >
                                ${
                                    currentUserVote
                                        ? `Ви поставили ${currentUserVote} із 5. Оцінку можна змінити.`
                                        : ""
                                }
                            </p>

                            <label
                            class="seller-review-label"
                            for="sellerReviewText"
                        >
                            Ваш відгук
                        </label>
                        
                        <textarea
                            id="sellerReviewText"
                            class="seller-review-textarea"
                            maxlength="1000"
                            rows="4"
                            placeholder="Напишіть, як пройшло спілкування з продавцем..."
                        >${currentUserReview?.text || ""}</textarea>
                        
                        <div class="seller-review-footer">
                            <span
                                id="sellerReviewCounter"
                                class="seller-review-counter"
                            >
                                ${
                                    currentUserReview?.text
                                        ? currentUserReview.text.length
                                        : 0
                                } / 1000
                            </span>
                        
                            <button
                                type="button"
                                id="saveSellerReviewButton"
                                class="primary-button seller-review-save-button"
                            >
                                ${
                                    currentUserReview
                                        ? "Оновити відгук"
                                        : "Зберегти оцінку та відгук"
                                }
                            </button>
                        </div>
                        
                        <p
                            id="sellerReviewStatus"
                            class="seller-review-status"
                            aria-live="polite"
                        ></p>

                        </div>
                    `
                    : ""
    }
</div>

<section class="seller-reviews-section">
    <h3 class="seller-reviews-title">
        Відгуки про продавця
    </h3>

    ${
        visibleSellerReviews.length === 0
            ? `
                <p class="seller-reviews-empty">
                    Відгуків поки немає.
                </p>
            `
            : visibleSellerReviews
                .map(
                    (review) => `
                        <article class="seller-review-card">

                            <div class="seller-review-header">
                                <strong class="seller-review-author">
                                    ${
                                        escapeHtml(
                                            review.userName ||
                                            "Користувач"
                                        )
                                    }
                                </strong>

                                <span class="seller-review-date">
                                    ${
                                        review.updatedAt
                                            ? new Date(
                                                review.updatedAt
                                            ).toLocaleDateString(
                                                "uk-UA"
                                            )
                                            : ""
                                    }
                                </span>
                            </div>

                            <div
                                class="seller-review-stars"
                                aria-label="Оцінка ${
                                    Number(
                                        review.rating || 0
                                    )
                                } із 5"
                            >
                                ${[1, 2, 3, 4, 5]
                                    .map(
                                        (star) => `
                                            <span
                                                class="seller-review-star ${
                                                    star <=
                                                    Number(
                                                        review.rating ||
                                                        0
                                                    )
                                                        ? "is-filled"
                                                        : ""
                                                }"
                                            >
                                                ★
                                            </span>
                                        `
                                    )
                                    .join("")}
                            </div>

                            <p class="seller-review-text">
                                ${
                                    escapeHtml(
                                        review.text
                                    )
                                }
                            </p>

                        </article>
                    `
                )
                .join("")
    }
</section>

                <p>
                    Місто:
                    ${
                        listing.city ||
                        "Не вказано"
                    }
                </p>

                <button
                    type="button"
                    id="openSellerProfileButton"
                    class="primary-button"
                >
                    Переглянути профіль продавця
                </button>

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

                <button
                    type="button"
                    id="serviceHistoryButton"
                    class="secondary-button"
                >
                    Подивитися історію
                    обслуговування
                </button>

                <button
                    type="button"
                    id="checkVinButton"
                    class="secondary-button"
                >
                    Перевірити автомобіль
                    за VIN
                </button>

                ${
                    isListingOwner
                        ? `
                            <div
                                id="listingOwnerActions"
                                class="listing-owner-actions"
                            >
                                <button
                                    type="button"
                                    id="editListingButton"
                                    class="primary-button"
                                >
                                    ✏️ Редагувати
                                    оголошення
                                </button>

                                <button
                                    type="button"
                                    id="deleteListingButton"
                                    class="secondary-button"
                                >
                                    🗑️ Видалити
                                    оголошення
                                </button>
                            </div>
                        `
                        : ""
                }
            </section>
        `;
    }


    /* ===== КНОПКА НОМЕРА ===== */

    const showPhoneButton =
        document.getElementById(
            "showPhoneButton"
        );


    if (showPhoneButton) {
        showPhoneButton.addEventListener(
            "click",
            () => {
                showPhoneButton.textContent =
                    listing.phone ||
                    "Номер не вказано";
            }
        );
    }

    /* ===== ПРОФІЛЬ ПРОДАВЦЯ ===== */

const openSellerProfileButton =
document.getElementById(
    "openSellerProfileButton"
);

if (openSellerProfileButton) {
openSellerProfileButton.addEventListener(
    "click",
    () => {
        if (!listingOwnerId) {
            alert(
                "Не вдалося визначити продавця."
            );

            return;
        }

        window.location.href =
            `seller.html?sellerId=${encodeURIComponent(
                listingOwnerId
            )}&listingId=${encodeURIComponent(
                listing.id
            )}`;
    }
);
}

    /* ===== ОЦІНЮВАННЯ ПРОДАВЦЯ ===== */

const sellerRatingButtons =
document.querySelectorAll(
    ".seller-rating-button"
);


const sellerRatingStatus =
document.getElementById(
    "sellerRatingStatus"
);


sellerRatingButtons.forEach(
(button) => {
    button.addEventListener(
        "click",
        async () => {
            const user =
                typeof getCurrentUser ===
                "function"
                    ? getCurrentUser()
                    : null;


            if (!user) {
                alert(
                    "Спочатку увійдіть у профіль."
                );

                return;
            }


            const userId =
                user.id ||
                user.userId ||
                user.email ||
                "";


            if (
                !listingOwnerId ||
                !userId
            ) {
                alert(
                    "Не вдалося визначити продавця або користувача."
                );

                return;
            }


            if (
                String(userId) ===
                String(listingOwnerId)
            ) {
                alert(
                    "Ви не можете оцінювати самого себе."
                );

                return;
            }


            const ratingValue =
                Number(
                    button.dataset
                        .ratingValue
                );


            const saved =
               await saveSellerVote(
                    listingOwnerId,
                    userId,
                    ratingValue
                );


            if (!saved) {
                return;
            }


            sellerRatingButtons.forEach(
                (ratingButton) => {
                    const buttonValue =
                        Number(
                            ratingButton.dataset
                                .ratingValue
                        );


                    const isSelected =
                        buttonValue <=
                        ratingValue;


                    ratingButton.classList.toggle(
                        "is-selected",
                        isSelected
                    );


                    ratingButton.setAttribute(
                        "aria-pressed",
                        String(
                            buttonValue ===
                            ratingValue
                        )
                    );
                }
            );


            const updatedRatingData =
              await  getSellerRatingData(
                    listingOwnerId
                );


            const sellerRatingNumber =
                document.getElementById(
                    "sellerRatingNumber"
                );


            const sellerRatingCount =
                document.getElementById(
                    "sellerRatingCount"
                );


            const sellerDisplayStars =
                document.querySelectorAll(
                    ".seller-display-star"
                );


            if (
                sellerRatingNumber
            ) {
                sellerRatingNumber.textContent =
                    updatedRatingData.count >
                    0
                        ? updatedRatingData.average.toFixed(
                            1
                        )
                        : "—";
            }


            if (
                sellerRatingCount
            ) {
                sellerRatingCount.textContent =
                    updatedRatingData.count ===
                    0
                        ? "Новий продавець"
                        : getRatingCountLabel(
                            updatedRatingData.count
                        )
            }


            sellerDisplayStars.forEach(
                (
                    starElement,
                    index
                ) => {
                    const starNumber =
                        index + 1;


                    starElement.classList.toggle(
                        "is-filled",
                        starNumber <=
                            Math.round(
                                updatedRatingData.average
                            )
                    );
                }
            );


            if (
                sellerRatingStatus
            ) {
                sellerRatingStatus.textContent =
                    `Ви поставили ${ratingValue} із 5. Оцінку можна змінити.`;
            }
        }
    );
}
);

/* ===== ПОЛЕ ТА ЗБЕРЕЖЕННЯ ВІДГУКУ ===== */

const sellerReviewText =
    document.getElementById(
        "sellerReviewText"
    );

const sellerReviewCounter =
    document.getElementById(
        "sellerReviewCounter"
    );

const saveSellerReviewButton =
    document.getElementById(
        "saveSellerReviewButton"
    );

const sellerReviewStatus =
    document.getElementById(
        "sellerReviewStatus"
    );


function getSelectedSellerRating() {
    const selectedButtons =
        Array.from(
            document.querySelectorAll(
                ".seller-rating-button.is-selected"
            )
        );

    if (selectedButtons.length === 0) {
        return 0;
    }

    return Math.max(
        ...selectedButtons.map(
            (button) =>
                Number(
                    button.dataset.ratingValue
                ) || 0
        )
    );
}


if (
    sellerReviewText &&
    sellerReviewCounter
) {
    sellerReviewText.addEventListener(
        "input",
        () => {
            sellerReviewCounter.textContent =
                `${sellerReviewText.value.length} / 1000`;
        }
    );
}


if (saveSellerReviewButton) {
    saveSellerReviewButton.addEventListener(
        "click",
        async () => {
            const user =
                typeof getCurrentUser ===
                "function"
                    ? getCurrentUser()
                    : null;

            if (!user) {
                alert(
                    "Спочатку увійдіть у профіль."
                );
                return;
            }

            const userId =
                user.id ||
                user.userId ||
                user.email ||
                "";

            if (
                !listingOwnerId ||
                !userId
            ) {
                alert(
                    "Не вдалося визначити продавця або користувача."
                );
                return;
            }

            if (
                String(userId) ===
                String(listingOwnerId)
            ) {
                alert(
                    "Ви не можете залишити відгук самому собі."
                );
                return;
            }

            const selectedRating =
                getSelectedSellerRating();

            if (
                selectedRating < 1 ||
                selectedRating > 5
            ) {
                if (sellerReviewStatus) {
                    sellerReviewStatus.textContent =
                        "Спочатку виберіть оцінку від 1 до 5.";
                }
                return;
            }

            const reviewText =
                sellerReviewText
                    ? sellerReviewText.value.trim()
                    : "";

            if (
                reviewText.length > 0 &&
                reviewText.length < 5
            ) {
                if (sellerReviewStatus) {
                    sellerReviewStatus.textContent =
                        "Відгук повинен містити щонайменше 5 символів.";
                }
                return;
            }

            const saved =
            await saveSellerReview(
                listingOwnerId,
                userId,
                user.name ||
                    user.email ||
                    "Користувач",
                selectedRating,
                reviewText
            );

            if (!saved) {
                return;
            }

            if (sellerReviewStatus) {
                sellerReviewStatus.textContent =
                    reviewText
                        ? "Вашу оцінку та відгук збережено."
                        : "Вашу оцінку збережено.";
            }

            saveSellerReviewButton.textContent =
                "Оновити відгук";

            const ratingForm =
                document.getElementById(
                    "sellerRatingForm"
                );

            if (ratingForm) {
                ratingForm.classList.remove(
                    "rating-success"
                );

                void ratingForm.offsetWidth;

                ratingForm.classList.add(
                    "rating-success"
                );

                setTimeout(
                    () => {
                        ratingForm.classList.remove(
                            "rating-success"
                        );
                    },
                    700
                );
            }
        }
    );
}

    /* ===== КНОПКА ЧАТУ ===== */

    const openChatButton =
    document.getElementById(
        "openChatButton"
    );

if (openChatButton) {

    if (isListingOwner) {

        openChatButton.textContent =
            "Мої чати";

        openChatButton.addEventListener(
            "click",
            () => {
                window.location.href =
                "profile.html?section=chats";
            }
        );

    } else {

        openChatButton.addEventListener(
            "click",
            () => {

                const user =
                    typeof getCurrentUser ===
                    "function"
                        ? getCurrentUser()
                        : null;

                if (!user) {
                    alert(
                        "Спочатку увійдіть у свій профіль."
                    );
                    return;
                }

                window.location.href =
                    `chat.html?listingId=${encodeURIComponent(
                        listing.id
                    )}`;
            }
        );

    }

}
   /* ===== КНОПКА ІСТОРІЇ ===== */

const serviceHistoryButton =
document.getElementById(
    "serviceHistoryButton"
);

if (serviceHistoryButton) {
serviceHistoryButton.addEventListener(
    "click",
    () => {
        /*
            Власник автомобіля бачить
            свою історію безкоштовно.
        */

        if (isListingOwner) {
            window.location.href =
                `profile.html?section=service&listingId=${encodeURIComponent(
                    listing.id
                )}`;

            return;
        }

        /*
            Покупець переходить у профіль
            продавця до платного блоку історії.
        */

        if (!listingOwnerId) {
            alert(
                "Не вдалося визначити продавця."
            );

            return;
        }

        window.location.href =
            `seller.html?sellerId=${encodeURIComponent(
                listingOwnerId
            )}&listingId=${encodeURIComponent(
                listing.id
            )}#service-history`;
    }
);
}

    /* ===== КНОПКА ПЕРЕВІРКИ VIN ===== */

    const checkVinButton =
        document.getElementById(
            "checkVinButton"
        );


    if (checkVinButton) {
        checkVinButton.addEventListener(
            "click",
            () => {
                if (!listing.vin) {
                    alert(
                        "VIN-код цього автомобіля не вказаний."
                    );

                    return;
                }


                window.location.href =
                    `vin-check.html?vin=${encodeURIComponent(
                        listing.vin
                    )}`;
            }
        );
    }


    /* ===== КНОПКА РЕДАГУВАННЯ ===== */

    const editListingButton =
    document.getElementById(
        "editListingButton"
    );

    if (editListingButton) {
        editListingButton.addEventListener(
            "click",
            () => {
                const user =
                    typeof getCurrentUser === "function"
                        ? getCurrentUser()
                        : null;
    
                const userId =
                    user?.id ||
                    user?.userId ||
                    user?.email ||
                    "";
    
                const listingOwnerId =
                    listing.ownerId ||
                    listing.userId ||
                    listing.sellerId ||
                    listing.ownerEmail ||
                    listing.email ||
                    "";
    
                if (
                    !userId ||
                    !listingOwnerId ||
                    String(userId) !==
                        String(listingOwnerId)
                ) {
                    alert(
                        "Ви не можете редагувати чуже оголошення."
                    );
    
                    return;
                }
    
                window.location.href =
                    `market.html?edit=${encodeURIComponent(
                        listing.id
                    )}`;
            }
        );
    }

    /* ===== КНОПКА ВИДАЛЕННЯ ===== */

    const deleteListingButton =
        document.getElementById(
            "deleteListingButton"
        );


    if (deleteListingButton) {
        deleteListingButton.addEventListener(
            "click",
           async () => {

                const user =
                typeof getCurrentUser === "function"
                    ? getCurrentUser()
                    : null;
            
            const userId =
                user?.id ||
                user?.userId ||
                user?.email ||
                "";
            
            if (
                !userId ||
                !listingOwnerId ||
                String(userId) !== String(listingOwnerId)
            ) {
                alert(
                    "Ви не можете видалити чуже оголошення."
                );
            
                return;
            }

                const shouldDelete =
                    window.confirm(
                        "Ви точно хочете видалити це оголошення?"
                    );


                if (!shouldDelete) {
                    return;
                }


                const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
            
            if (!token) {
                alert(
                    "Сесія недійсна. Увійдіть повторно."
                );
            
                window.location.href =
                    "index.html";
            
                return;
            }
            
            try {
                const response =
                    await fetch(
                        `/api/market/listings/${encodeURIComponent(
                            listing.id
                        )}`,
                        {
                            method: "DELETE",
            
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );
            
                const data =
                    await response.json();
            
                if (!response.ok) {
                    alert(
                        data.message ||
                        "Не вдалося видалити оголошення."
                    );
            
                    return;
                }
            
            } catch (error) {
                console.error(
                    "Market listing delete request error:",
                    error
                );
            
                alert(
                    "Не вдалося з’єднатися із сервером."
                );
            
                return;
            }
            
            alert(
                "Оголошення успішно видалено."
            );
            
            window.location.href =
                "market.html";
            }
        );
    }


    /* ===== КОПІЮВАННЯ VIN ===== */

    const copyVinButton =
        document.getElementById(
            "copyVinButton"
        );


    if (copyVinButton) {
        copyVinButton.addEventListener(
            "click",
            async () => {
                try {
                    await navigator.clipboard
                        .writeText(
                            listing.vin
                        );


                    copyVinButton.textContent =
                        "Скопійовано ✓";


                    setTimeout(
                        () => {
                            copyVinButton.textContent =
                                "Копіювати VIN";
                        },
                        1500
                    );
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


    /* ===== ГАЛЕРЕЯ ===== */

    let currentPhotoIndex =
        mainPhotoIndex;


    const listingMainPhoto =
        document.getElementById(
            "listingMainPhoto"
        );


    const previousListingPhoto =
        document.getElementById(
            "previousListingPhoto"
        );


    const nextListingPhoto =
        document.getElementById(
            "nextListingPhoto"
        );


    const listingPhotoCounter =
        document.getElementById(
            "listingPhotoCounter"
        );


    const listingPhotoThumbnails =
        document.querySelectorAll(
            ".listing-photo-thumbnail"
        );


    /* ===== ПОВНОЕКРАННИЙ ПЕРЕГЛЯД ===== */

    const photoViewer =
        document.getElementById(
            "photoViewer"
        );


    const photoViewerImage =
        document.getElementById(
            "photoViewerImage"
        );


    const closePhotoViewerButton =
        document.getElementById(
            "closePhotoViewer"
        );


    const previousViewerPhoto =
        document.getElementById(
            "previousViewerPhoto"
        );


    const nextViewerPhoto =
        document.getElementById(
            "nextViewerPhoto"
        );


    function showListingPhoto(index) {
        if (
            photos.length === 0 ||
            !listingMainPhoto
        ) {
            return;
        }


        currentPhotoIndex =
            (
                index +
                photos.length
            ) % photos.length;


        const currentPhoto =
            photos[currentPhotoIndex];


        listingMainPhoto.src =
            currentPhoto;


        listingMainPhoto.alt =
            `${
                listing.name ||
                "Автомобіль"
            }, фото ${
                currentPhotoIndex + 1
            }`;


        if (listingPhotoCounter) {
            listingPhotoCounter.textContent =
                `${
                    currentPhotoIndex + 1
                } / ${photos.length}`;
        }


        listingPhotoThumbnails.forEach(
            (
                thumbnail,
                thumbnailIndex
            ) => {
                const isActive =
                    thumbnailIndex ===
                    currentPhotoIndex;


                thumbnail.classList.toggle(
                    "is-active",
                    isActive
                );


                if (isActive) {
                    thumbnail.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center"
                    });
                }
            }
        );


        if (photoViewerImage) {
            photoViewerImage.src =
                currentPhoto;


            photoViewerImage.alt =
                `${
                    listing.name ||
                    "Автомобіль"
                }, фото ${
                    currentPhotoIndex + 1
                }`;
        }
    }


    function showPreviousPhoto(event) {
        if (event) {
            event.stopPropagation();
        }


        showListingPhoto(
            currentPhotoIndex - 1
        );
    }


    function showNextPhoto(event) {
        if (event) {
            event.stopPropagation();
        }


        showListingPhoto(
            currentPhotoIndex + 1
        );
    }


    function openPhotoViewer() {
        if (
            !listingMainPhoto ||
            !photoViewer ||
            !photoViewerImage
        ) {
            return;
        }


        photoViewerImage.src =
            photos[currentPhotoIndex] ||
            listingMainPhoto.src;


        photoViewerImage.alt =
            listingMainPhoto.alt;


            photoViewer.classList.add("open");

        photoViewer.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "photo-viewer-open"
        );


        if (closePhotoViewerButton) {
            closePhotoViewerButton.focus();
        }
    }


    function closePhotoViewer() {
        if (!photoViewer) {
            return;
        }


        if (
            document.activeElement &&
            photoViewer.contains(
                document.activeElement
            )
        ) {
            document.activeElement.blur();
        }

        photoViewer.classList.remove("open");

        photoViewer.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "photo-viewer-open"
        );


        if (listingMainPhoto) {
            listingMainPhoto.focus();
        }
    }


    /* ===== СТРІЛКИ ГАЛЕРЕЇ ===== */

    if (previousListingPhoto) {
        previousListingPhoto.addEventListener(
            "click",
            showPreviousPhoto
        );
    }


    if (nextListingPhoto) {
        nextListingPhoto.addEventListener(
            "click",
            showNextPhoto
        );
    }


    /* ===== МІНІАТЮРИ ===== */

    listingPhotoThumbnails.forEach(
        (thumbnail) => {
            thumbnail.addEventListener(
                "click",
                () => {
                    const photoIndex =
                        Number(
                            thumbnail.dataset
                                .photoIndex
                        );


                    showListingPhoto(
                        photoIndex
                    );
                }
            );
        }
    );


    /* ===== ВІДКРИТТЯ ФОТО ===== */

    if (listingMainPhoto) {
        listingMainPhoto.addEventListener(
            "click",
            openPhotoViewer
        );


        listingMainPhoto.tabIndex =
            0;


        listingMainPhoto.setAttribute(
            "role",
            "button"
        );


        listingMainPhoto.setAttribute(
            "aria-label",
            "Відкрити фото на весь екран"
        );


        listingMainPhoto.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();


                    openPhotoViewer();
                }
            }
        );
    }


    /* ===== СТРІЛКИ ПОВНОГО ЕКРАНА ===== */

    if (previousViewerPhoto) {
        previousViewerPhoto.addEventListener(
            "click",
            showPreviousPhoto
        );
    }


    if (nextViewerPhoto) {
        nextViewerPhoto.addEventListener(
            "click",
            showNextPhoto
        );
    }


    /* ===== ЗАКРИТТЯ ПОВНОГО ЕКРАНА ===== */

    if (closePhotoViewerButton) {
        closePhotoViewerButton.addEventListener(
            "click",
            closePhotoViewer
        );
    }


    if (photoViewer) {
        photoViewer.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    photoViewer
                ) {
                    closePhotoViewer();
                }
            }
        );
    }

    /* ===== ЖИВИЙ СВАЙП ФОТО НА ТЕЛЕФОНІ ===== */

let touchStartX = 0;
let touchCurrentX = 0;
let touchStartY = 0;

let isDraggingPhoto = false;

const swipeThreshold = 80;


function startPhotoDrag(event) {
    if (!event.touches.length) {
        return;
    }

    touchStartX =
        event.touches[0].clientX;

    touchCurrentX =
        touchStartX;

    touchStartY =
        event.touches[0].clientY;

    isDraggingPhoto = true;

    const target =
        event.currentTarget;

    target.style.transition =
        "none";
}


function movePhotoDrag(event) {
    if (
        !isDraggingPhoto ||
        !event.touches.length
    ) {
        return;
    }

    const currentX =
        event.touches[0].clientX;

    const currentY =
        event.touches[0].clientY;

    const distanceX =
        currentX - touchStartX;

    const distanceY =
        currentY - touchStartY;


    /*
        Якщо користувач скролить
        сторінку вертикально —
        фото не рухаємо.
    */

    if (
        Math.abs(distanceY) >
        Math.abs(distanceX)
    ) {
        return;
    }


    touchCurrentX =
        currentX;

    const target =
        event.currentTarget;


    /*
        Трохи зменшуємо рух,
        щоб фото відчувалося плавніше.
    */

    target.style.transform =
        `translateX(${distanceX * 0.8}px)`;
}


function endPhotoDrag(event) {
    if (!isDraggingPhoto) {
        return;
    }

    isDraggingPhoto = false;


    const distanceX =
        touchCurrentX -
        touchStartX;


    const target =
        event.currentTarget;


    target.style.transition =
        "transform 0.25s ease";


    /*
        Якщо свайп достатньо великий —
        міняємо фото.
    */

    if (
        Math.abs(distanceX) >=
        swipeThreshold
    ) {
        if (distanceX < 0) {
            target.style.transform =
                "translateX(-120%)";

            setTimeout(
                () => {
                    showNextPhoto();

                    target.style.transition =
                        "none";

                    target.style.transform =
                        "translateX(120%)";

                    requestAnimationFrame(
                        () => {
                            requestAnimationFrame(
                                () => {
                                    target.style.transition =
                                        "transform 0.25s ease";

                                    target.style.transform =
                                        "translateX(0)";
                                }
                            );
                        }
                    );
                },
                180
            );
        } else {
            target.style.transform =
                "translateX(120%)";

            setTimeout(
                () => {
                    showPreviousPhoto();

                    target.style.transition =
                        "none";

                    target.style.transform =
                        "translateX(-120%)";

                    requestAnimationFrame(
                        () => {
                            requestAnimationFrame(
                                () => {
                                    target.style.transition =
                                        "transform 0.25s ease";

                                    target.style.transform =
                                        "translateX(0)";
                                }
                            );
                        }
                    );
                },
                180
            );
        }

        return;
    }


    /*
        Якщо протягнули недостатньо —
        фото повертається назад.
    */

    target.style.transform =
        "translateX(0)";
}


/* ===== ГОЛОВНЕ ФОТО ===== */

if (listingMainPhoto) {
    listingMainPhoto.style.touchAction =
        "pan-y";

    listingMainPhoto.addEventListener(
        "touchstart",
        startPhotoDrag,
        {
            passive: true
        }
    );

    listingMainPhoto.addEventListener(
        "touchmove",
        movePhotoDrag,
        {
            passive: true
        }
    );

    listingMainPhoto.addEventListener(
        "touchend",
        endPhotoDrag,
        {
            passive: true
        }
    );
}


/* ===== ПОВНОЕКРАННЕ ФОТО ===== */

if (photoViewerImage) {
    photoViewerImage.style.touchAction =
        "pan-y";

    photoViewerImage.addEventListener(
        "touchstart",
        startPhotoDrag,
        {
            passive: true
        }
    );

    photoViewerImage.addEventListener(
        "touchmove",
        movePhotoDrag,
        {
            passive: true
        }
    );

    photoViewerImage.addEventListener(
        "touchend",
        endPhotoDrag,
        {
            passive: true
        }
    );
}


    /* ===== КЕРУВАННЯ КЛАВІАТУРОЮ ===== */

    document.addEventListener(
        "keydown",
        (event) => {
            const viewerIsOpen =
                photoViewer?.classList
                .contains("open");

            if (!viewerIsOpen) {
                return;
            }


            if (event.key === "Escape") {
                closePhotoViewer();

                return;
            }


            if (
                event.key ===
                "ArrowLeft"
            ) {
                showPreviousPhoto();

                return;
            }


            if (
                event.key ===
                "ArrowRight"
            ) {
                showNextPhoto();
            }
        }
    );


    /* ===== ПРИХОВАТИ СТРІЛКИ ДЛЯ ОДНОГО ФОТО ===== */

    if (photos.length <= 1) {
        if (previousListingPhoto) {
            previousListingPhoto.hidden =
                true;
        }


        if (nextListingPhoto) {
            nextListingPhoto.hidden =
                true;
        }


        if (previousViewerPhoto) {
            previousViewerPhoto.hidden =
                true;
        }


        if (nextViewerPhoto) {
            nextViewerPhoto.hidden =
                true;
        }
    }
}

}

/* ===== ЗАПУСК СТОРІНКИ ОГОЛОШЕННЯ ===== */

loadListingPage();