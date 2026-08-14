"use strict";

/* =========================
   ROYAL GARAGE — SELLER.JS
   ========================= */

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";


/* =========================
   ЕЛЕМЕНТИ СТОРІНКИ
   ========================= */

const elements = {
    loading:
        document.getElementById(
            "sellerLoading"
        ),

    profile:
        document.getElementById(
            "sellerProfile"
        ),

    notFound:
        document.getElementById(
            "sellerNotFound"
        ),

    avatarLetter:
        document.getElementById(
            "sellerAvatarLetter"
        ),

    name:
        document.getElementById(
            "sellerName"
        ),

    city:
        document.getElementById(
            "sellerCity"
        ),

    registeredAt:
        document.getElementById(
            "sellerRegisteredAt"
        ),

    verification:
        document.getElementById(
            "sellerVerification"
        ),

    rating:
        document.getElementById(
            "sellerRating"
        ),

    ratingCount:
        document.getElementById(
            "sellerRatingCount"
        ),

    contacts:
        document.getElementById(
            "sellerContacts"
        ),

    openChatButton:
        document.getElementById(
            "openSellerChatButton"
        ),

    listingsCount:
        document.getElementById(
            "sellerListingsCount"
        ),

    listings:
        document.getElementById(
            "sellerListings"
        ),

    unlockHistoryButton:
        document.getElementById(
            "unlockServiceHistoryButton"
        ),

    serviceHistory:
        document.getElementById(
            "sellerServiceHistory"
        ),

    reviews:
        document.getElementById(
            "sellerReviews"
        )
};


/* =========================
   ДОПОМІЖНІ ФУНКЦІЇ
   ========================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getOwnerId(listing) {
    return String(
        listing.ownerId ||
        listing.userId ||
        listing.sellerId ||
        listing.ownerEmail ||
        listing.email ||
        ""
    );
}


function formatDate(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        "uk-UA"
    );
}


function getRatingCountLabel(count) {
    const value =
        Number(count) || 0;

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


function showNotFound() {
    elements.loading
        ?.classList.add("hidden");

    elements.profile
        ?.classList.add("hidden");

    elements.notFound
        ?.classList.remove("hidden");
}


function showProfile() {
    elements.loading
        ?.classList.add("hidden");

    elements.notFound
        ?.classList.add("hidden");

    elements.profile
        ?.classList.remove("hidden");
}


/* =========================
   ПАРАМЕТРИ URL
   ========================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const sellerId =
    String(
        urlParams.get("sellerId") ||
        ""
    );

const requestedListingId =
    String(
        urlParams.get("listingId") ||
        ""
    );

/* =========================
ЗАВАНТАЖЕННЯ ДАНИХ
========================= */

let listings = [];
let currentUser = null;

async function loadCurrentUser() {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        return null;
    }

    try {
        const response =
            await fetch(
                "/api/profile",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        return data.user || null;

    } catch (error) {
        console.error(
            "Current user load error:",
            error
        );

        return null;
    }
}

async function loadSellerPage() {
   
    currentUser =
    await loadCurrentUser();
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

        listings =
            Array.isArray(data.listings)
                ? data.listings.map(
                    (item) => ({
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
                    })
                )
                : [];

    } catch (error) {
        console.error(
            "Не вдалося завантажити оголошення продавця:",
            error
        );

        showNotFound();
        return;
    }


    if (
        !sellerId ||
        !Array.isArray(listings)
    ) {
        showNotFound();
        return;
    }


    const sellerListings =
        listings
            .filter(
                (listing) =>
                    getOwnerId(listing) ===
                    sellerId
            )
            .sort(
                (
                    firstListing,
                    secondListing
                ) =>
                    new Date(
                        secondListing.createdAt ||
                        0
                    ) -
                    new Date(
                        firstListing.createdAt ||
                        0
                    )
            );


    /*
        Публічна сторінка продавця
        існує тільки після появи
        хоча б одного оголошення.
    */

    if (
        sellerListings.length ===
        0
    ) {
        showNotFound();
        return;
    }


    const mainListing =
        sellerListings.find(
            (listing) =>
                String(listing.id) ===
                requestedListingId
        ) ||
        sellerListings[0];

        let storedSellerProfile = {};

        try {
            const profileResponse =
                await fetch(
                    `/api/sellers/${encodeURIComponent(
                        sellerId
                    )}/profile`
                );
        
            const profileData =
                await profileResponse.json();
        
            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                    "Не вдалося завантажити профіль продавця."
                );
            }
        
            const serverSeller =
                profileData.seller || {};
        
            storedSellerProfile = {
                ...serverSeller,
        
                profilePhoto:
                    serverSeller.profile_photo ||
                    "",
        
                photo:
                    serverSeller.profile_photo ||
                    "",
        
                showPhone:
                    Boolean(
                        serverSeller.show_phone
                    ),
        
                showTelegram:
                    Boolean(
                        serverSeller.show_telegram
                    ),
        
                createdAt:
                    serverSeller.created_at ||
                    ""
            };
        
        } catch (error) {
            console.error(
                "Seller profile load error:",
                error
            );
        }


    const sellerProfile = {
        ...storedSellerProfile,

        name:
            storedSellerProfile.name ||
            mainListing.sellerName ||
            "Продавець"
    };


    renderSellerMainInfo(
        sellerProfile,
        sellerListings
    );

    renderVerification(
        sellerProfile
    );

   await renderRating();

    renderContacts(
        sellerProfile,
        mainListing
    );

    renderListings(
        sellerListings
    );

    await renderReviews();

    configureChatButton(
        mainListing
    );

    await configureHistoryButton(
        mainListing
    );

    showProfile();
}


/* =========================
ЗАПУСК СТОРІНКИ ПРОДАВЦЯ
========================= */

loadSellerPage();


/* =========================
   ОСНОВНА ІНФОРМАЦІЯ
   ========================= */

   function renderSellerMainInfo(
    sellerProfile,
    sellerListings
) {
    const firstListing =
        sellerListings[
            sellerListings.length - 1
        ];

    const latestListing =
        sellerListings[0];

    const users =
        typeof getUsers === "function"
            ? getUsers()
            : [];

    const sellerAccount =
        users.find(
            (user) =>
                String(user.id) ===
                String(latestListing.ownerId)
        ) || {};

    const sellerName =
        sellerProfile.name ||
        sellerProfile.username ||
        sellerProfile.displayName ||
        sellerAccount.name ||
        sellerAccount.username ||
        sellerAccount.displayName ||
        sellerAccount.fullName ||
        latestListing.sellerName ||
        latestListing.ownerName ||
        latestListing.userName ||
        latestListing.contactName ||
        "Продавець";

    const sellerCity =
        sellerProfile.city ||
        sellerAccount.city ||
        latestListing.city ||
        "Місто не вказано";

    const registrationDate =
        sellerProfile.createdAt ||
        sellerAccount.createdAt ||
        firstListing.createdAt ||
        "";

    if (elements.name) {
        elements.name.textContent =
            sellerName;
    }

    if (elements.avatarLetter) {
        if (sellerProfile.photo) {
            elements.avatarLetter.innerHTML = `
                <img
                    src="${sellerProfile.photo}"
                    alt="${escapeHtml(sellerName)}"
                    class="seller-avatar-photo"
                >
            `;
        } else {
            elements.avatarLetter.textContent =
                sellerName
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "P";
        }
    }

    if (elements.city) {
        elements.city.textContent =
            `📍 ${sellerCity}`;
    }

    if (elements.registeredAt) {
        const formattedDate =
            formatDate(
                registrationDate
            );

        elements.registeredAt.textContent =
            formattedDate
                ? `На Royal Garage з ${formattedDate}`
                : "Дата реєстрації не вказана";
    }
}

/* =========================
   ВЕРИФІКАЦІЯ
   ========================= */

function renderVerification(
    sellerProfile
) {
    if (!elements.verification) {
        return;
    }

    const phoneVerified =
        sellerProfile.phoneVerified ===
        true;

    const emailVerified =
        sellerProfile.emailVerified ===
        true;

    const businessVerified =
        sellerProfile.businessVerified ===
        true;

    const verificationItems = [];

    if (phoneVerified) {
        verificationItems.push(
            "✓ Номер телефону підтверджено"
        );
    }

    if (emailVerified) {
        verificationItems.push(
            "✓ Електронну пошту підтверджено"
        );
    }

    if (businessVerified) {
        verificationItems.push(
            "✓ Бізнес-профіль перевірено"
        );
    }

    if (
        verificationItems.length === 0
    ) {
        elements.verification.innerHTML = `
            <p>
                Профіль ще не пройшов
                верифікацію.
            </p>
        `;

        return;
    }

    elements.verification.innerHTML =
        verificationItems
            .map(
                (item) => `
                    <p class="seller-verification-item">
                        ${escapeHtml(item)}
                    </p>
                `
            )
            .join("");
}


/* =========================
   РЕЙТИНГ
   ========================= */
   async function renderRating() {
    if (
        !elements.rating ||
        !elements.ratingCount
    ) {
        return;
    }

    try {
        const response =
            await fetch(
                `/api/sellers/${encodeURIComponent(
                    sellerId
                )}/rating`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити рейтинг продавця."
            );
        }

        const average =
            Number(
                data.rating?.average || 0
            );

        const count =
            Number(
                data.rating?.count || 0
            );

        if (count === 0) {
            elements.rating.textContent =
                "—";

            elements.ratingCount.textContent =
                "Новий продавець";

            return;
        }

        elements.rating.textContent =
            average.toFixed(1);

        elements.ratingCount.textContent =
            `· ${getRatingCountLabel(
                count
            )}`;

    } catch (error) {
        console.error(
            "Seller rating load error:",
            error
        );

        elements.rating.textContent =
            "—";

        elements.ratingCount.textContent =
            "Новий продавець";
    }
}

/* =========================
   КОНТАКТИ
   ========================= */

function renderContacts(
    sellerProfile,
    mainListing
) {
    if (!elements.contacts) {
        return;
    }

    const contactItems = [];

    const showPhone =
        sellerProfile.showPhone ===
        true;

    const showTelegram =
        sellerProfile.showTelegram ===
        true;

    const showViber =
        sellerProfile.showViber ===
        true;

    const showInstagram =
        sellerProfile.showInstagram ===
        true;

    if (showPhone) {
        const phone =
            sellerProfile.phone ||
            mainListing.phone ||
            "";

        if (phone) {
            contactItems.push(`
                <p>
                    <strong>Телефон:</strong>
                    <a href="tel:${escapeHtml(phone)}">
                        ${escapeHtml(phone)}
                    </a>
                </p>
            `);
        }
    }

    if (
        showTelegram &&
        sellerProfile.telegram
    ) {
        contactItems.push(`
            <p>
                <strong>Telegram:</strong>
                ${escapeHtml(
                    sellerProfile.telegram
                )}
            </p>
        `);
    }

    if (
        showViber &&
        sellerProfile.viber
    ) {
        contactItems.push(`
            <p>
                <strong>Viber:</strong>
                ${escapeHtml(
                    sellerProfile.viber
                )}
            </p>
        `);
    }

    if (
        showInstagram &&
        sellerProfile.instagram
    ) {
        contactItems.push(`
            <p>
                <strong>Instagram:</strong>
                ${escapeHtml(
                    sellerProfile.instagram
                )}
            </p>
        `);
    }

    if (
        contactItems.length === 0
    ) {
        elements.contacts.innerHTML = `
            <p>
                Продавець не відкрив
                контакти у своєму профілі.
            </p>
        `;

        return;
    }

    elements.contacts.innerHTML =
        contactItems.join("");
}


/* =========================
   ОГОЛОШЕННЯ ПРОДАВЦЯ
   ========================= */

function renderListings(
    sellerListings
) {
    if (
        !elements.listings ||
        !elements.listingsCount
    ) {
        return;
    }

    elements.listingsCount.textContent =
        String(
            sellerListings.length
        );

    elements.listings.innerHTML =
        sellerListings
            .map(
                (listing) => {
                    const photos =
                        Array.isArray(
                            listing.photos
                        )
                            ? listing.photos
                            : listing.photo
                                ? [
                                    listing.photo
                                ]
                                : [];

                    const photo =
                        photos[0] || "";

                    return `
                        <a
                            href="listing.html?id=${encodeURIComponent(
                                listing.id
                            )}"
                            class="seller-listing-card"
                        >
                            ${
                                photo
                                    ? `
                                        <img
                                            src="${escapeHtml(photo)}"
                                            alt="${escapeHtml(
                                                listing.name ||
                                                "Автомобіль"
                                            )}"
                                            class="seller-listing-photo"
                                        >
                                    `
                                    : `
                                        <div class="seller-listing-no-photo">
                                            🚗
                                        </div>
                                    `
                            }

                            <div class="seller-listing-info">

                                <strong>
                                    ${escapeHtml(
                                        listing.name ||
                                        "Автомобіль"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        listing.year ||
                                        "Рік не вказано"
                                    )}
                                </span>

                                <span>
                                    ${Number(
                                        listing.priceUsd ||
                                        0
                                    ).toLocaleString(
                                        "uk-UA"
                                    )} $
                                </span>

                            </div>
                        </a>
                    `;
                }
            )
            .join("");
}


/* =========================
   ВІДГУКИ
   ========================= */
   async function renderReviews() {
    if (!elements.reviews) {
        return;
    }

    try {
        const response =
            await fetch(
                `/api/sellers/${encodeURIComponent(
                    sellerId
                )}/reviews`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити відгуки продавця."
            );
        }

        const reviews =
            Array.isArray(
                data.reviews
            )
                ? data.reviews
                : [];

        if (reviews.length === 0) {
            elements.reviews.innerHTML = `
                <p>
                    Відгуків поки немає.
                </p>
            `;

            return;
        }

        elements.reviews.innerHTML =
            reviews
                .map(
                    (review) => `
                        <article class="seller-public-review">

                            <div class="seller-public-review-header">

                                <strong>
                                    ${escapeHtml(
                                        review.user_name ||
                                        "Користувач"
                                    )}
                                </strong>

                                <span>
                                    ${formatDate(
                                        review.updated_at
                                    )}
                                </span>

                            </div>

                            <div class="seller-public-review-stars">
                                ${[1, 2, 3, 4, 5]
                                    .map(
                                        (star) => `
                                            <span class="${
                                                star <=
                                                Number(
                                                    review.rating || 0
                                                )
                                                    ? "is-filled"
                                                    : ""
                                            }">
                                                ★
                                            </span>
                                        `
                                    )
                                    .join("")}
                            </div>

                            <p>
                                ${escapeHtml(
                                    review.review || ""
                                )}
                            </p>

                        </article>
                    `
                )
                .join("");

    } catch (error) {
        console.error(
            "Seller reviews load error:",
            error
        );

        elements.reviews.innerHTML = `
            <p>
                Не вдалося завантажити відгуки.
            </p>
        `;
    }
}


/* =========================
   ЧАТ
   ========================= */

function configureChatButton(
    mainListing
) {
    if (
        !elements.openChatButton ||
        !mainListing
    ) {
        return;
    }

    const currentUserId =
        String(
            currentUser?.id ||
            currentUser?.userId ||
            currentUser?.email ||
            ""
        );

    if (
        currentUserId &&
        currentUserId === sellerId
    ) {
        elements.openChatButton.textContent =
            "Мої чати";

        elements.openChatButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    "profile.html?section=chats";
            }
        );

        return;
    }

    elements.openChatButton.addEventListener(
        "click",
        () => {
            if (!currentUserId) {
                alert(
                    "Спочатку увійдіть у свій профіль."
                );

                return;
            }

            window.location.href =
                `chat.html?listingId=${encodeURIComponent(
                    mainListing.id
                )}`;
        }
    );
}


/* =========================
   ПЛАТНА ІСТОРІЯ
   ========================= */
   async function configureHistoryButton(
    mainListing
) {
    if (
        !elements.unlockHistoryButton ||
        !mainListing
    ) {
        return;
    }

    const listingId =
        mainListing.id ||
        mainListing.listingId ||
        "";

    if (!listingId) {
        elements.unlockHistoryButton.disabled =
            true;

        elements.unlockHistoryButton.textContent =
            "Історія обслуговування відсутня";

        return;
    }

    try {
        const response =
            await fetch(
                `/api/garage/public-history/${
                    encodeURIComponent(
                        listingId
                    )
                }`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося перевірити історію обслуговування."
            );
        }

        const publicServices =
            Array.isArray(
                data.car?.services
            )
                ? data.car.services
                : [];

        if (
            publicServices.length === 0
        ) {
            elements.unlockHistoryButton.disabled =
                true;

            elements.unlockHistoryButton.textContent =
                "Історія обслуговування відсутня";

            return;
        }

        elements.unlockHistoryButton.disabled =
            false;

        elements.unlockHistoryButton.textContent =
            "Відкрити історію за 50 грн";

        elements.unlockHistoryButton.addEventListener(
            "click",
            () => {
                alert(
                    "Підключення оплати 50 грн додамо наступним кроком. Історія поки залишається закритою."
                );
            }
        );

    } catch (error) {
        console.error(
            "Seller public history check error:",
            error
        );

        elements.unlockHistoryButton.disabled =
            true;

        elements.unlockHistoryButton.textContent =
            "Історія обслуговування недоступна";
    }
}