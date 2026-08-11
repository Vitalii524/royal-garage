"use strict";

/* =========================
   ROYAL GARAGE — PROFILE.JS
   ========================= */

document.documentElement.style.visibility = "hidden";

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";

const MESSAGES_KEY =
    "royalGarageMessages";

const LISTINGS_KEY =
    "royalGarageMarketListings";

let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem(
            CURRENT_USER_KEY
        )
    );
} catch (error) {
    console.error(
        "Помилка читання користувача:",
        error
    );
}

if (!currentUser?.id) {
    window.location.replace(
        "index.html"
    );

    throw new Error(
        "Користувач не авторизований."
    );
}

function getFavoritesStorageKey() {
    return `royalGarageFavoriteListings_${currentUser.id}`;
}


function loadFavoriteListingIds() {
    try {
        const storedFavorites =
            JSON.parse(
                localStorage.getItem(
                    getFavoritesStorageKey()
                )
            ) || [];

        return Array.isArray(
            storedFavorites
        )
            ? storedFavorites.map(String)
            : [];
    } catch (error) {
        console.error(
            "Не вдалося завантажити обране:",
            error
        );

        return [];
    }
}

async function renderFavoriteListings() {
    const favoritesList =
        document.getElementById(
            "profileFavoritesList"
        );

    const favoritesCount =
        document.getElementById(
            "profileFavoritesCount"
        );

    if (
        !favoritesList ||
        !favoritesCount
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        favoritesCount.textContent = "0";

        favoritesList.innerHTML = `
            <p class="profile-favorites-empty">
                Увійдіть у профіль, щоб переглянути обране.
            </p>
        `;

        return;
    }

    try {
        const [
            favoritesResponse,
            listingsResponse
        ] = await Promise.all([
            fetch(
                "/api/market/favorites",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            ),

            fetch(
                "/api/market/listings"
            )
        ]);

        const favoritesData =
            await favoritesResponse.json();

        const listingsData =
            await listingsResponse.json();

        if (!favoritesResponse.ok) {
            throw new Error(
                favoritesData.message ||
                "Не вдалося завантажити обране."
            );
        }

        if (!listingsResponse.ok) {
            throw new Error(
                listingsData.message ||
                "Не вдалося завантажити оголошення."
            );
        }

        const favoriteIds =
            Array.isArray(
                favoritesData.favoriteIds
            )
                ? favoritesData.favoriteIds.map(
                    String
                )
                : [];

        const listings =
            Array.isArray(
                listingsData.listings
            )
                ? listingsData.listings
                : [];

        const favoriteListings =
            listings.filter(
                (listing) =>
                    favoriteIds.includes(
                        String(listing.id)
                    )
            );

        favoritesCount.textContent =
            String(
                favoriteListings.length
            );

        if (
            favoriteListings.length === 0
        ) {
            favoritesList.innerHTML = `
                <p class="profile-favorites-empty">
                    Ви ще не додали оголошення в обране.
                </p>
            `;

            return;
        }

        favoritesList.innerHTML =
            favoriteListings
                .map((listing) => {
                    const listingPhotos =
                        Array.isArray(
                            listing.photos
                        )
                            ? listing.photos
                            : listing.photo
                                ? [
                                    listing.photo
                                ]
                                : [];

                    const mainPhoto =
                        listingPhotos[0] ||
                        "";

                    const priceUsd =
                        listing.price_usd ??
                        listing.priceUsd ??
                        null;

                    return `
                        <a
                            class="profile-favorite-card"
                            href="listing.html?id=${encodeURIComponent(
                                listing.id
                            )}"
                        >
                            ${
                                mainPhoto
                                    ? `
                                        <img
                                            class="profile-favorite-photo"
                                            src="${escapeHtml(
                                                mainPhoto
                                            )}"
                                            alt="${escapeHtml(
                                                listing.name ||
                                                "Автомобіль"
                                            )}"
                                        >
                                    `
                                    : ""
                            }

                            <div class="profile-favorite-info">
                                <strong>
                                    ${escapeHtml(
                                        listing.name ||
                                        "Автомобіль"
                                    )}
                                </strong>

                                ${
                                    listing.year
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    String(
                                                        listing.year
                                                    )
                                                )} рік
                                            </span>
                                        `
                                        : ""
                                }

                                ${
                                    priceUsd
                                        ? `
                                            <span>
                                                ${Number(
                                                    priceUsd
                                                ).toLocaleString(
                                                    "uk-UA"
                                                )} $
                                            </span>
                                        `
                                        : ""
                                }
                            </div>
                        </a>
                    `;
                })
                .join("");

    } catch (error) {
        console.error(
            "Profile favorites load error:",
            error
        );

        favoritesCount.textContent = "0";

        favoritesList.innerHTML = `
            <p class="profile-favorites-empty">
                Не вдалося завантажити обране.
            </p>
        `;
    }
}
document.documentElement.style.visibility =
    "visible";

const STORAGE_KEY =
    `royalGarageCars_${currentUser.id}`;

const elements = {
    garageCarsList:
        document.getElementById(
            "garageCarsList"
        ),

    noCarsMessage:
        document.getElementById(
            "noCarsMessage"
        ),

    selectedCarEmpty:
        document.getElementById(
            "selectedCarEmpty"
        ),

    selectedCarContent:
        document.getElementById(
            "selectedCarContent"
        ),

    selectedCarName:
        document.getElementById(
            "selectedCarName"
        ),

    selectedCarInfo:
        document.getElementById(
            "selectedCarInfo"
        ),

    selectedCarPhoto:
        document.getElementById(
            "selectedCarPhoto"
        ),

    carPhotoPlaceholder:
        document.getElementById(
            "carPhotoPlaceholder"
        ),

    carPhotoGallery:
        document.getElementById(
            "carPhotoGallery"
        ),

    serviceHistory:
        document.getElementById(
            "serviceHistory"
        ),

    noServiceMessage:
        document.getElementById(
            "noServiceMessage"
        ),

    serviceCount:
        document.getElementById(
            "serviceCount"
        ),

    totalServiceCost:
        document.getElementById(
            "totalServiceCost"
        ),

    currentMileage:
        document.getElementById(
            "currentMileage"
        ),

    carModal:
        document.getElementById(
            "carModal"
        ),

    serviceModal:
        document.getElementById(
            "serviceModal"
        ),

    historyModal:
        document.getElementById(
            "historyModal"
        ),

    chatsModal:
        document.getElementById(
            "chatsModal"
        ),

    carForm:
        document.getElementById(
            "carForm"
        ),

    serviceForm:
        document.getElementById(
            "serviceForm"
        ),

    openCarButton:
        document.getElementById(
            "openCarButton"
        ),

    editCarButton:
        document.getElementById(
            "editCarButton"
        ),

    deleteCarButton:
        document.getElementById(
            "deleteCarButton"
        ),

    openServiceButton:
        document.getElementById(
            "openServiceButton"
        ),

    openHistoryButton:
        document.getElementById(
            "openHistoryButton"
        ),

    openChatsButton:
        document.getElementById(
            "openChatsButton"
        ),

    myChatsList:
        document.getElementById(
            "myChatsList"
        ),

    updateCarPhoto:
        document.getElementById(
            "updateCarPhoto"
        ),

    photoViewer:
        document.getElementById(
            "photoViewer"
        ),

    photoViewerImage:
        document.getElementById(
            "photoViewerImage"
        ),

    closePhotoViewer:
        document.getElementById(
            "closePhotoViewer"
        ),

    previousCarPhoto:
        document.getElementById(
            "previousCarPhoto"
        ),

    nextCarPhoto:
        document.getElementById(
            "nextCarPhoto"
        )
};

async function loadGarageCarsFromServer() {
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
                "/api/garage/cars",
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
            console.error(
                "Garage load failed:",
                data
            );

            return null;
        }

        if (
            !Array.isArray(
                data.cars
            )
        ) {
            return [];
        }

        return data.cars;
    } catch (error) {
        console.error(
            "Garage load request error:",
            error
        );

        return null;
    }
}

async function createGarageCarOnServer(carData) {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        throw new Error(
            "Сесія недійсна. Увійдіть повторно."
        );
    }

    const response =
        await fetch(
            "/api/garage/cars",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body:
                    JSON.stringify(
                        carData
                    )
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Не вдалося додати автомобіль."
        );
    }

    return (
        data.car ||
        data
    );
}

let cars = [];

const globalOpenChatsButton =
    document.getElementById("globalOpenChatsButton");
    function updateGlobalChatsButton() {
        if (!globalOpenChatsButton) {
            return;
        }
    
        globalOpenChatsButton.hidden =
            cars.length > 0;
    }
let selectedCarId =
    cars[0]?.id ?? null;

let editingCarId = null;
let editingServiceId = null;

let viewerPhotos = [];
let viewerIndex = 0;

async function loadProfileFromServer() {
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

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити профіль."
            );
        }

        const user =
            data.user;

        currentUser.phone =
            user.phone || "";

        currentUser.city =
            user.city || "";

        currentUser.telegram =
            user.telegram || "";

        currentUser.profilePhoto =
            user.profile_photo || "";

        currentUser.showPhone =
            Boolean(
                user.show_phone
            );

        currentUser.showTelegram =
            Boolean(
                user.show_telegram
            );

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(
                currentUser
            )
        );

        return user;

    } catch (error) {
        console.error(
            "Profile load request error:",
            error
        );

        return null;
    }
}

async function initializeGarageCars() {
    const serverCars =
        await loadGarageCarsFromServer();

    if (!Array.isArray(serverCars)) {
        cars = [];

        selectedCarId = null;

        renderPage();
        return;
    }

    cars = serverCars;

    selectedCarId =
        cars[0]?.id ?? null;

        updateGlobalChatsButton();

    renderPage();
}

/* =========================
   ДОПОМІЖНІ ФУНКЦІЇ
   ========================= */

function readJson(
    key,
    fallback = []
) {
    try {
        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch (error) {
        console.error(
            `Помилка читання ${key}:`,
            error
        );

        return fallback;
    }
}

let sellerProfilePhotoData = "";

function renderSellerProfilePhoto(
    photo,
    name = ""
) {
    const preview =
        document.getElementById(
            "sellerProfilePhotoPreview"
        );

    if (!preview) {
        return;
    }

    if (photo) {
        preview.innerHTML = `
            <img
                src="${photo}"
                alt="Фото профілю продавця"
            >
        `;

        return;
    }

    preview.textContent =
        String(name || "П")
            .trim()
            .charAt(0)
            .toUpperCase() || "П";
}

const sellerProfilePhotoInput =
    document.getElementById(
        "sellerProfilePhoto"
    );

const removeSellerProfilePhotoButton =
    document.getElementById(
        "removeSellerProfilePhoto"
    );
    if (sellerProfilePhotoInput) {
        sellerProfilePhotoInput.addEventListener(
            "change",
            async () => {
                const file =
                    sellerProfilePhotoInput
                        .files?.[0];
    
                if (!file) {
                    return;
                }
    
                try {
                    const compressedPhoto =
                        await compressImage(file);
    
                    const token =
                        localStorage.getItem(
                            "royalGarageToken"
                        );
    
                    if (!token) {
                        alert(
                            "Сесія недійсна. Увійдіть повторно."
                        );
    
                        return;
                    }
    
                    const response =
                        await fetch(
                            "/api/profile",
                            {
                                method: "PATCH",
    
                                headers: {
                                    "Content-Type":
                                        "application/json",
    
                                    Authorization:
                                        `Bearer ${token}`
                                },
    
                                body:
                                    JSON.stringify({
                                        profilePhoto:
                                            compressedPhoto
                                    })
                            }
                        );
    
                    const data =
                        await response.json();
    
                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            "Не вдалося зберегти фото профілю."
                        );
                    }
    
                    sellerProfilePhotoData =
                        data.user.profile_photo ||
                        compressedPhoto;
    
                    currentUser.profilePhoto =
                        sellerProfilePhotoData;
    
                    localStorage.setItem(
                        CURRENT_USER_KEY,
                        JSON.stringify(
                            currentUser
                        )
                    );
    
                    const profileName =
                        document
                            .getElementById(
                                "sellerProfileName"
                            )
                            ?.value
                            .trim() || "";
    
                    renderSellerProfilePhoto(
                        sellerProfilePhotoData,
                        profileName
                    );
    
                } catch (error) {
                    console.error(
                        "Profile photo update error:",
                        error
                    );
    
                    alert(
                        error.message ||
                        "Не вдалося обробити фото."
                    );
                }
    
                sellerProfilePhotoInput.value =
                    "";
            }
        );
    }
    if (removeSellerProfilePhotoButton) {
        removeSellerProfilePhotoButton
            .addEventListener(
                "click",
                async () => {
                    const token =
                        localStorage.getItem(
                            "royalGarageToken"
                        );
    
                    if (!token) {
                        alert(
                            "Сесія недійсна. Увійдіть повторно."
                        );
    
                        return;
                    }
    
                    try {
                        const response =
                            await fetch(
                                "/api/profile",
                                {
                                    method: "PATCH",
    
                                    headers: {
                                        "Content-Type":
                                            "application/json",
    
                                        Authorization:
                                            `Bearer ${token}`
                                    },
    
                                    body:
                                        JSON.stringify({
                                            profilePhoto: ""
                                        })
                                }
                            );
    
                        const data =
                            await response.json();
    
                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                "Не вдалося видалити фото профілю."
                            );
                        }
    
                        sellerProfilePhotoData = "";
    
                        currentUser.profilePhoto = "";
    
                        localStorage.setItem(
                            CURRENT_USER_KEY,
                            JSON.stringify(
                                currentUser
                            )
                        );
    
                        const profileName =
                            document
                                .getElementById(
                                    "sellerProfileName"
                                )
                                ?.value
                                .trim() || "";
    
                        renderSellerProfilePhoto(
                            "",
                            profileName
                        );
    
                    } catch (error) {
                        console.error(
                            "Profile photo delete error:",
                            error
                        );
    
                        alert(
                            error.message ||
                            "Не вдалося видалити фото профілю."
                        );
                    }
                }
            );
    }

    function fillSellerProfileSettings() {
        sellerProfilePhotoData =
            currentUser.profilePhoto ||
            "";
    
        const nameInput =
            document.getElementById(
                "sellerProfileName"
            );
    
        const cityInput =
            document.getElementById(
                "sellerProfileCity"
            );
    
        const phoneInput =
            document.getElementById(
                "sellerProfilePhone"
            );
    
        const telegramInput =
            document.getElementById(
                "sellerProfileTelegram"
            );
    
        const showPhoneInput =
            document.getElementById(
                "sellerProfileShowPhone"
            );
    
        const showTelegramInput =
            document.getElementById(
                "sellerProfileShowTelegram"
            );
    
        if (nameInput) {
            nameInput.value =
                currentUser.name ||
                "";
        }
    
        if (cityInput) {
            cityInput.value =
                currentUser.city ||
                "";
        }
    
        if (phoneInput) {
            phoneInput.value =
                currentUser.phone ||
                "";
        }
    
        if (telegramInput) {
            telegramInput.value =
                currentUser.telegram ||
                "";
        }
    
        if (showPhoneInput) {
            showPhoneInput.checked =
                Boolean(
                    currentUser.showPhone
                );
        }
    
        if (showTelegramInput) {
            showTelegramInput.checked =
                Boolean(
                    currentUser.showTelegram
                );
        }
    
        renderSellerProfilePhoto(
            sellerProfilePhotoData,
            currentUser.name ||
            ""
        );
    }

    async function saveSellerProfileSettings(event) {
        event.preventDefault();
    
        const name =
            document
                .getElementById(
                    "sellerProfileName"
                )
                ?.value
                .trim() || "";
    
        const city =
            document
                .getElementById(
                    "sellerProfileCity"
                )
                ?.value
                .trim() || "";
    
        const phone =
            document
                .getElementById(
                    "sellerProfilePhone"
                )
                ?.value
                .trim() || "";
    
        const telegram =
            document
                .getElementById(
                    "sellerProfileTelegram"
                )
                ?.value
                .trim() || "";
    
        const showPhone =
            Boolean(
                document.getElementById(
                    "sellerProfileShowPhone"
                )?.checked
            );
    
        const showTelegram =
            Boolean(
                document.getElementById(
                    "sellerProfileShowTelegram"
                )?.checked
            );
    
        const token =
            localStorage.getItem(
                "royalGarageToken"
            );
    
        if (!token) {
            alert(
                "Сесія недійсна. Увійдіть повторно."
            );
    
            return;
        }
    
        try {
            const response =
                await fetch(
                    "/api/profile",
                    {
                        method: "PATCH",
    
                        headers: {
                            "Content-Type":
                                "application/json",
    
                            Authorization:
                                `Bearer ${token}`
                        },
    
                        body:
                            JSON.stringify({
                                city,
                                telegram,
                                profilePhoto:
                                    sellerProfilePhotoData,
                                showPhone,
                                showTelegram
                            })
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося зберегти налаштування профілю."
                );
            }
    
            currentUser.city =
                data.user.city || "";
    
            currentUser.telegram =
                data.user.telegram || "";
    
            currentUser.profilePhoto =
                data.user.profile_photo || "";
    
            currentUser.showPhone =
                Boolean(
                    data.user.show_phone
                );
    
            currentUser.showTelegram =
                Boolean(
                    data.user.show_telegram
                );
    
            localStorage.setItem(
                CURRENT_USER_KEY,
                JSON.stringify(
                    currentUser
                )
            );
    
            alert(
                "Налаштування профілю продавця збережено."
            );
    
        } catch (error) {
            console.error(
                "Seller profile update error:",
                error
            );
    
            alert(
                error.message ||
                "Не вдалося зберегти налаштування профілю."
            );
        }
    }
const sellerProfileSettingsForm =
    document.getElementById(
        "sellerProfileSettingsForm"
    );

if (sellerProfileSettingsForm) {
    sellerProfileSettingsForm
        .addEventListener(
            "submit",
            saveSellerProfileSettings
        );
}

async function getProfileSellerRating() {
    const sellerId =
        currentUser?.id ||
        currentUser?.userId ||
        "";

    if (!sellerId) {
        return {
            average: 0,
            count: 0
        };
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

        return {
            average:
                Number(
                    data.rating?.average || 0
                ),

            count:
                Number(
                    data.rating?.count || 0
                )
        };

    } catch (error) {
        console.error(
            "Profile seller rating load error:",
            error
        );

        return {
            average: 0,
            count: 0
        };
    }
}


function calculateProfileRating(
    sellerData
) {
    const votes =
        sellerData?.votes &&
        typeof sellerData.votes ===
            "object"
            ? Object.values(
                sellerData.votes
            )
                .map(Number)
                .filter(
                    (rating) =>
                        Number.isFinite(
                            rating
                        ) &&
                        rating >= 1 &&
                        rating <= 5
                )
            : [];


    if (
        votes.length === 0
    ) {
        return {
            average: 0,
            count: 0
        };
    }


    const total =
        votes.reduce(
            (sum, rating) =>
                sum + rating,
            0
        );


    return {
        average:
            total / votes.length,

        count:
            votes.length
    };
}
function getRatingCountLabel(
    count
) {
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

function loadCars() {
    const loadedCars =
        readJson(
            STORAGE_KEY,
            []
        );

    if (!Array.isArray(loadedCars)) {
        return [];
    }

    const uniqueCars = [];
    const usedVinNumbers =
        new Set();

    loadedCars.forEach((car) => {
        if (!car?.id) {
            return;
        }

        const normalizedVin =
            normalizeVin(car.vin);

        if (
            normalizedVin &&
            usedVinNumbers.has(
                normalizedVin
            )
        ) {
            return;
        }

        if (normalizedVin) {
            usedVinNumbers.add(
                normalizedVin
            );
        }

        if (
            !Array.isArray(
                car.services
            )
        ) {
            car.services = [];
        }

        if (
            !Array.isArray(
                car.photos
            )
        ) {
            car.photos =
                car.photo
                    ? [car.photo]
                    : [];
        }

        if (
            !Number.isInteger(
                car.activePhotoIndex
            )
        ) {
            car.activePhotoIndex = 0;
        }

        uniqueCars.push(car);
    });

    return uniqueCars;
}

function saveCars() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cars)
        );

        return true;
    } catch (error) {
        console.error(
            "Не вдалося зберегти гараж:",
            error
        );

        alert(
            "У браузері недостатньо місця. " +
            "Спробуй видалити частину фотографій."
        );

        return false;
    }
}

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
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
        new Date(
            `${value}T00:00:00`
        );

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

function normalizeVin(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function openModal(modal) {
    modal?.classList.add(
        "modal-open"
    );
}

function closeModal(modal) {
    modal?.classList.remove(
        "modal-open"
    );
}

function getSelectedCar() {
    return cars.find(
        (car) =>
            String(car.id) ===
            String(selectedCarId)
    );
}

function getCarPhotos(car) {
    if (
        !Array.isArray(
            car.photos
        )
    ) {
        car.photos =
            car.photo
                ? [car.photo]
                : [];
    }

    return car.photos;
}

function getServicePhotos(
    service
) {
    if (
        !Array.isArray(
            service.photos
        )
    ) {
        service.photos = [];
    }

    return service.photos;
}

function setFieldValue(
    id,
    value
) {
    const field =
        document.getElementById(id);

    if (field) {
        field.value =
            value ?? "";
    }
}

function compressImage(file) {
    return new Promise(
        (resolve, reject) => {
            if (
                !file ||
                !file.type.startsWith(
                    "image/"
                )
            ) {
                reject(
                    new Error(
                        "Оберіть правильний файл зображення."
                    )
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onerror = () => {
                reject(
                    new Error(
                        "Не вдалося прочитати фото."
                    )
                );
            };

            reader.onload = () => {
                const image =
                    new Image();

                image.onerror = () => {
                    reject(
                        new Error(
                            "Неправильний формат фото."
                        )
                    );
                };

                image.onload = () => {
                    const maxSize =
                        1200;

                    let width =
                        image.naturalWidth;

                    let height =
                        image.naturalHeight;

                    const scale =
                        Math.min(
                            1,
                            maxSize / width,
                            maxSize / height
                        );

                    width =
                        Math.round(
                            width * scale
                        );

                    height =
                        Math.round(
                            height * scale
                        );

                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    canvas.width =
                        width;

                    canvas.height =
                        height;

                    const context =
                        canvas.getContext(
                            "2d"
                        );

                    if (!context) {
                        reject(
                            new Error(
                                "Браузер не підтримує обробку фото."
                            )
                        );

                        return;
                    }

                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );

                    resolve(
                        canvas.toDataURL(
                            "image/jpeg",
                            0.78
                        )
                    );
                };

                image.src =
                    reader.result;
            };

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================
   ПЕРЕГЛЯДАЧ ФОТО
   ========================= */

function showPhotoInViewer(
    index
) {
    if (
        viewerPhotos.length === 0 ||
        !elements.photoViewerImage
    ) {
        return;
    }

    viewerIndex =
        (
            index +
            viewerPhotos.length
        ) %
        viewerPhotos.length;

    elements.photoViewerImage.src =
        viewerPhotos[
            viewerIndex
        ];

    const onlyOne =
        viewerPhotos.length <= 1;

    if (
        elements.previousCarPhoto
    ) {
        elements.previousCarPhoto.hidden =
            onlyOne;
    }

    if (
        elements.nextCarPhoto
    ) {
        elements.nextCarPhoto.hidden =
            onlyOne;
    }
}

function openPhotoViewer(
    photos,
    startIndex = 0
) {
    if (
        !elements.photoViewer ||
        !Array.isArray(photos) ||
        photos.length === 0
    ) {
        return;
    }

    viewerPhotos = [...photos];

    showPhotoInViewer(
        startIndex
    );

    elements.photoViewer
        .classList.add("open");
}

function closeViewer() {
    elements.photoViewer
        ?.classList.remove(
            "open"
        );

    if (
        elements.photoViewerImage
    ) {
        elements.photoViewerImage.src =
            "";
    }

    viewerPhotos = [];
    viewerIndex = 0;
}


/* =========================
   ВІДОБРАЖЕННЯ АВТО
   ========================= */

function renderCars() {
    if (
        !elements.garageCarsList
    ) {
        return;
    }

    elements.garageCarsList
        .querySelectorAll(
            ".garage-car-button"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );

    if (
        elements.noCarsMessage
    ) {
        elements.noCarsMessage.style.display =
    cars.length > 0
        ? "none"
        : "block";
    }

    cars.forEach((car) => {
        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "garage-car-button";

        if (
            String(car.id) ===
            String(
                selectedCarId
            )
        ) {
            button.classList.add(
                "active"
            );
        }

        button.innerHTML = `
            <strong>
                ${escapeHtml(
                    car.name
                )}
            </strong>

            <span>
                ${escapeHtml(
                    car.year
                )} рік ·

                ${formatNumber(
                    car.mileage
                )} км
            </span>
        `;

        button.addEventListener(
            "click",
            () => {
                selectedCarId =
                    car.id;

                age();
            }
        );

        elements.garageCarsList
            .appendChild(
                button
            );
    });
}

function renderCarGallery(
    car
) {
    if (
        !elements.carPhotoGallery ||
        !elements.selectedCarPhoto ||
        !elements.carPhotoPlaceholder
    ) {
        return;
    }

    const photos =
        getCarPhotos(car);

    elements.carPhotoGallery
        .innerHTML = "";

    if (
        photos.length === 0
    ) {
        elements.selectedCarPhoto
            .removeAttribute(
                "src"
            );

        elements.selectedCarPhoto
            .classList.add(
                "hidden"
            );

        elements.carPhotoPlaceholder
            .classList.remove(
                "hidden"
            );

        return;
    }

    if (
        car.activePhotoIndex < 0 ||
        car.activePhotoIndex >=
            photos.length
    ) {
        car.activePhotoIndex = 0;
    }

    const activePhoto =
        photos[
            car.activePhotoIndex
        ];

    car.photo =
        activePhoto;

    elements.selectedCarPhoto.src =
        activePhoto;

    elements.selectedCarPhoto
        .classList.remove(
            "hidden"
        );

    elements.carPhotoPlaceholder
        .classList.add(
            "hidden"
        );

    elements.selectedCarPhoto.onclick =
        () => {
            openPhotoViewer(
                photos,
                car.activePhotoIndex
            );
        };

    photos.forEach(
        (photo, index) => {
            const photoItem =
                document.createElement(
                    "div"
                );

            photoItem.className =
                "car-photo-thumbnail-item";

            const thumbnailButton =
                document.createElement(
                    "button"
                );

            thumbnailButton.type =
                "button";

            thumbnailButton.className =
                "car-photo-thumbnail-button";

            if (
                index ===
                car.activePhotoIndex
            ) {
                thumbnailButton
                    .classList.add(
                        "active"
                    );
            }

            const thumbnail =
                document.createElement(
                    "img"
                );

            thumbnail.src =
                photo;

            thumbnail.alt =
                `Фото автомобіля ${
                    index + 1
                }`;

            thumbnailButton
                .appendChild(
                    thumbnail
                );

            thumbnailButton
                .addEventListener(
                    "click",
                    () => {
                        car.activePhotoIndex =
                            index;

                        car.photo =
                            photos[index];

                        saveCars();
                        renderSelectedCar();
                    }
                );

            const mainButton =
                document.createElement(
                    "button"
                );

            mainButton.type =
                "button";

            mainButton.className =
                "main-car-photo-button";

            mainButton.textContent =
                index ===
                car.activePhotoIndex
                    ? "★"
                    : "☆";

            mainButton.title =
                "Зробити головним фото";

            mainButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    car.activePhotoIndex =
                        index;

                    car.photo =
                        photos[index];

                    saveCars();
                    renderSelectedCar();
                }
            );

            const replaceInput =
                document.createElement(
                    "input"
                );

            replaceInput.type =
                "file";

            replaceInput.accept =
                "image/jpeg,image/png,image/webp";

            replaceInput.hidden =
                true;

            const replaceButton =
                document.createElement(
                    "button"
                );

            replaceButton.type =
                "button";

            replaceButton.className =
                "replace-car-photo-button";

            replaceButton.textContent =
                "🔄";

            replaceButton.title =
                "Замінити фото";

            replaceButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    replaceInput.click();
                }
            );

            replaceInput.addEventListener(
                "change",
                async () => {
                    const file =
                        replaceInput
                            .files?.[0];

                    if (!file) {
                        return;
                    }

                    try {
                        photos[index] =
                            await compressImage(
                                file
                            );

                        car.photos =
                            photos;

                        car.photo =
                            photos[
                                car.activePhotoIndex
                            ] ||
                            photos[0] ||
                            "";

                        saveCars();
                        renderSelectedCar();
                    } catch (error) {
                        alert(
                            error.message
                        );
                    }

                    replaceInput.value =
                        "";
                }
            );

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.className =
                "delete-car-photo-button";

            deleteButton.textContent =
                "🗑️";

            deleteButton.title =
                "Видалити фото";

            deleteButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    const confirmed =
                        confirm(
                            "Видалити це фото автомобіля?"
                        );

                    if (
                        !confirmed
                    ) {
                        return;
                    }

                    photos.splice(
                        index,
                        1
                    );

                    if (
                        car.activePhotoIndex >=
                        photos.length
                    ) {
                        car.activePhotoIndex =
                            Math.max(
                                0,
                                photos.length -
                                    1
                            );
                    } else if (
                        index <
                        car.activePhotoIndex
                    ) {
                        car.activePhotoIndex -=
                            1;
                    }

                    car.photos =
                        photos;

                    car.photo =
                        photos[
                            car.activePhotoIndex
                        ] ||
                        photos[0] ||
                        "";

                    saveCars();
                    renderSelectedCar();
                }
            );

            photoItem.append(
                thumbnailButton,
                replaceInput,
                mainButton,
                replaceButton,
                deleteButton
            );

            elements.carPhotoGallery
                .appendChild(
                    photoItem
                );
        }
    );
}


/* =========================
   ЗАПИСИ ОБСЛУГОВУВАННЯ
   ========================= */

function findService(
    car,
    serviceId
) {
    return car.services.find(
        (service) =>
            String(
                service.id
            ) ===
            String(
                serviceId
            )
    );
}

function deleteService(
    serviceId
) {
    const car =
        getSelectedCar();

    if (!car) {
        return;
    }

    const confirmed =
        confirm(
            "Видалити цей запис обслуговування?"
        );

    if (!confirmed) {
        return;
    }

    car.services =
        car.services.filter(
            (service) =>
                String(
                    service.id
                ) !==
                String(
                    serviceId
                )
        );

    saveCars();
    age();
}

function deleteServicePhoto(
    serviceId,
    photoIndex
) {
    const car =
        getSelectedCar();

    if (!car) {
        return;
    }

    const service =
        findService(
            car,
            serviceId
        );

    if (!service) {
        return;
    }

    const photos =
        getServicePhotos(
            service
        );

    const confirmed =
        confirm(
            "Видалити цю фотографію?"
        );

    if (!confirmed) {
        return;
    }

    photos.splice(
        photoIndex,
        1
    );

    service.photos =
        photos;

    saveCars();
    age();
}

async function replaceServicePhoto(
    serviceId,
    photoIndex,
    file
) {
    const car =
        getSelectedCar();

    if (!car || !file) {
        return;
    }

    const service =
        findService(
            car,
            serviceId
        );

    if (!service) {
        return;
    }

    try {
        const photos =
            getServicePhotos(
                service
            );

        photos[photoIndex] =
            await compressImage(
                file
            );

        service.photos =
            photos;

        saveCars();
        age();
    } catch (error) {
        alert(error.message);
    }
}

async function addServicePhotos(
    serviceId,
    fileList
) {
    const car =
        getSelectedCar();

    if (!car) {
        return;
    }

    const service =
        findService(
            car,
            serviceId
        );

    if (!service) {
        return;
    }

    const files =
        Array.from(
            fileList || []
        );

    if (
        files.length === 0
    ) {
        return;
    }

    const oldPhotos =
        getServicePhotos(
            service
        );

    if (
        oldPhotos.length +
            files.length >
        3
    ) {
        alert(
            "До одного запису можна додати максимум 3 фото."
        );

        return;
    }

    try {
        const newPhotos =
            await Promise.all(
                files.map(
                    (file) =>
                        compressImage(
                            file
                        )
                )
            );

        service.photos = [
            ...oldPhotos,
            ...newPhotos
        ];

        saveCars();
        age();
    } catch (error) {
        alert(error.message);
    }
}

function openServiceEditor(
    service
) {
    editingServiceId =
        service.id;

    setFieldValue(
        "serviceTitle",
        service.title
    );

    setFieldValue(
        "serviceDate",
        service.date
    );

    setFieldValue(
        "serviceMileage",
        service.mileage
    );

    setFieldValue(
        "serviceCost",
        service.cost
    );

    setFieldValue(
        "serviceStation",
        service.station
    );

    setFieldValue(
        "serviceDescription",
        service.description
    );

    const publicCheckbox =
        document.getElementById(
            "servicePublic"
        );

    if (publicCheckbox) {
        publicCheckbox.checked =
            Boolean(
                service.isPublic
            );
    }

    const servicePhotos =
        document.getElementById(
            "servicePhotos"
        );

    if (servicePhotos) {
        servicePhotos.value =
            "";
    }

    openModal(
        elements.serviceModal
    );
}

function renderServiceCard(
    service
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "service-card";

    card.innerHTML = `
        <div class="service-card-top">

            <div>
                <p class="service-date">
                    ${formatDate(
                        service.date
                    )}
                </p>

                <h3>
                    ${escapeHtml(
                        service.title
                    )}
                </h3>
            </div>

            <span class="service-visibility">
                ${
                    service.isPublic
                        ? "Публічний"
                        : "Приватний"
                }
            </span>

        </div>

        <div class="service-details">

            <span>
                Пробіг:

                <strong>
                    ${formatNumber(
                        service.mileage
                    )} км
                </strong>
            </span>

            <span>
                Вартість:

                <strong>
                    ${formatNumber(
                        service.cost
                    )} грн
                </strong>
            </span>

        </div>

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

        <div class="service-card-actions">

            <button
                class="edit-service-button"
                type="button"
            >
                Редагувати запис
            </button>

            <button
                class="delete-service-button"
                type="button"
            >
                Видалити запис
            </button>

        </div>
    `;

    card
        .querySelector(
            ".edit-service-button"
        )
        ?.addEventListener(
            "click",
            () => {
                openServiceEditor(
                    service
                );
            }
        );

    card
        .querySelector(
            ".delete-service-button"
        )
        ?.addEventListener(
            "click",
            () => {
                deleteService(
                    service.id
                );
            }
        );

    const photos =
        getServicePhotos(
            service
        );

    if (
        photos.length > 0
    ) {
        const gallery =
            document.createElement(
                "div"
            );

        gallery.className =
            "service-photo-gallery";

        photos.forEach(
            (
                photo,
                photoIndex
            ) => {
                const photoItem =
                    document.createElement(
                        "div"
                    );

                photoItem.className =
                    "service-photo-item";

                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    photo;

                image.alt =
                    "Фото до запису";

                image.className =
                    "service-photo";

                image.addEventListener(
                    "click",
                    () => {
                        openPhotoViewer(
                            photos,
                            photoIndex
                        );
                    }
                );

                const replaceInput =
                    document.createElement(
                        "input"
                    );

                replaceInput.type =
                    "file";

                replaceInput.accept =
                    "image/jpeg,image/png,image/webp";

                replaceInput.hidden =
                    true;

                const replaceButton =
                    document.createElement(
                        "button"
                    );

                replaceButton.type =
                    "button";

                replaceButton.className =
                    "replace-service-photo-button";

                replaceButton.textContent =
                    "Замінити фото";

                replaceButton
                    .addEventListener(
                        "click",
                        () => {
                            replaceInput
                                .click();
                        }
                    );

                replaceInput
                    .addEventListener(
                        "change",
                        async () => {
                            const file =
                                replaceInput
                                    .files?.[0];

                            if (file) {
                                await replaceServicePhoto(
                                    service.id,
                                    photoIndex,
                                    file
                                );
                            }

                            replaceInput.value =
                                "";
                        }
                    );

                const deleteButton =
                    document.createElement(
                        "button"
                    );

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "delete-service-photo-button";

                deleteButton.textContent =
                    "Видалити фото";

                deleteButton
                    .addEventListener(
                        "click",
                        () => {
                            deleteServicePhoto(
                                service.id,
                                photoIndex
                            );
                        }
                    );

                photoItem.append(
                    image,
                    replaceButton,
                    deleteButton,
                    replaceInput
                );

                gallery.appendChild(
                    photoItem
                );
            }
        );

        card.appendChild(
            gallery
        );
    }

    if (
        photos.length < 3
    ) {
        const addInput =
            document.createElement(
                "input"
            );

        addInput.type =
            "file";

        addInput.accept =
            "image/jpeg,image/png,image/webp";

        addInput.multiple =
            true;

        addInput.hidden =
            true;

        const addButton =
            document.createElement(
                "button"
            );

        addButton.type =
            "button";

        addButton.className =
            "add-service-photo-button";

        addButton.textContent =
            photos.length === 0
                ? "Додати фото"
                : "Додати ще фото";

        addButton.addEventListener(
            "click",
            () => {
                addInput.click();
            }
        );

        addInput.addEventListener(
            "change",
            async () => {
                await addServicePhotos(
                    service.id,
                    addInput.files
                );

                addInput.value =
                    "";
            }
        );

        card.append(
            addButton,
            addInput
        );
    }

    return card;
}

function renderSelectedCar() {
    const car =
        getSelectedCar();

    if (!car) {
        elements.selectedCarEmpty
            ?.classList.remove(
                "hidden"
            );

        elements.selectedCarContent
            ?.classList.add(
                "hidden"
            );

        if (
            elements.serviceHistory
        ) {
            elements.serviceHistory
                .querySelectorAll(
                    ".service-card"
                )
                .forEach(
                    (element) => {
                        element.remove();
                    }
                );
        }

        return;
    }

    elements.selectedCarEmpty
        ?.classList.add(
            "hidden"
        );

    elements.selectedCarContent
        ?.classList.remove(
            "hidden"
        );

    if (
        elements.selectedCarName
    ) {
        elements.selectedCarName
            .textContent =
                car.name ||
                "Автомобіль";
    }

    if (
        elements.selectedCarInfo
    ) {
        const details = [
            car.year
                ? `${car.year} рік`
                : null,

            `${formatNumber(
                car.mileage
            )} км`,

            car.engine ||
                null,

            car.fuel ||
                null,

            car.transmission ||
                null
        ].filter(Boolean);

        elements.selectedCarInfo
            .textContent =
                `${details.join(" • ")}

VIN: ${car.vin || "-"}

Номер: ${car.plate || "-"}`;
    }

    renderCarGallery(car);

    const services =
        Array.isArray(
            car.services
        )
            ? [...car.services]
            : [];

    services.sort(
        (
            first,
            second
        ) =>
            String(
                second.date || ""
            ).localeCompare(
                String(
                    first.date || ""
                )
            )
    );

    if (
        elements.serviceCount
    ) {
        elements.serviceCount
            .textContent =
                String(
                    services.length
                );
    }

    const totalCost =
        services.reduce(
            (
                total,
                service
            ) =>
                total +
                Number(
                    service.cost || 0
                ),
            0
        );

    if (
        elements.totalServiceCost
    ) {
        elements.totalServiceCost
            .textContent =
                `${formatNumber(
                    totalCost
                )} грн`;
    }

    if (
        elements.currentMileage
    ) {
        elements.currentMileage
            .textContent =
                `${formatNumber(
                    car.mileage
                )} км`;
    }

    if (
        !elements.serviceHistory
    ) {
        return;
    }

    elements.serviceHistory
        .querySelectorAll(
            ".service-card"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );

    if (
        elements.noServiceMessage
    ) {
        elements.noServiceMessage.hidden =
            services.length > 0;
    }

    services.forEach(
        (service) => {
            elements.serviceHistory
                .appendChild(
                    renderServiceCard(
                        service
                    )
                );
        }
    );
}

async function renderProfileSellerReputation() {
    const ratingElement =
        document.getElementById(
            "profileSellerRating"
        );

    const countElement =
        document.getElementById(
            "profileSellerRatingCount"
        );

    if (
        !ratingElement ||
        !countElement
    ) {
        return;
    }

    const ratingData =
    await getProfileSellerRating();

    if (
        ratingData.count === 0
    ) {
        ratingElement.textContent =
            "—";

        countElement.textContent =
            "Новий продавець";

        return;
    }

    ratingElement.textContent =
        ratingData.average.toFixed(1);

    countElement.textContent =
        `· ${getRatingCountLabel(
            ratingData.count
        )}`;
}

async function renderProfileSellerReviews() {
    const reviewsList =
        document.getElementById(
            "profileSellerReviewsList"
        );

    if (!reviewsList) {
        return;
    }

    const sellerId =
        currentUser?.id ||
        currentUser?.userId ||
        "";

    if (!sellerId) {
        reviewsList.innerHTML = `
            <p class="profile-seller-reviews-empty">
                Відгуків поки немає.
            </p>
        `;

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

        if (
            reviews.length === 0
        ) {
            reviewsList.innerHTML = `
                <p class="profile-seller-reviews-empty">
                    Відгуків поки немає.
                </p>
            `;

            return;
        }

        reviewsList.innerHTML =
            reviews
                .map(
                    (review) => `
                        <article class="profile-seller-review-card">

                            <div class="profile-seller-review-header">

                                <strong>
                                    ${escapeHtml(
                                        review.user_name ||
                                        "Користувач"
                                    )}
                                </strong>

                                <span>
                                    ${
                                        review.updated_at
                                            ? new Date(
                                                review.updated_at
                                            ).toLocaleDateString(
                                                "uk-UA"
                                            )
                                            : ""
                                    }
                                </span>

                            </div>

                            <div class="profile-seller-review-stars">
                                ${[1, 2, 3, 4, 5]
                                    .map(
                                        (star) => `
                                            <span
                                                class="${
                                                    star <=
                                                    Number(
                                                        review.rating || 0
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
            "Profile seller reviews load error:",
            error
        );

        reviewsList.innerHTML = `
            <p class="profile-seller-reviews-empty">
                Не вдалося завантажити відгуки.
            </p>
        `;
    }
}

function normalizePhone(value) {
    const digits =
        String(value || "")
            .replace(/\D/g, "");

    if (
        digits.length === 10 &&
        digits.startsWith("0")
    ) {
        return `380${digits.slice(1)}`;
    }

    return digits;
}

function renderAccountSettings() {
    
    const accountEmail =
        document.getElementById(
            "accountEmail"
        );

    const accountPhone =
        document.getElementById(
            "accountPhone"
        );

        const changeAccountPhoneButton =
    document.getElementById(
        "changeAccountPhoneButton"
    );

if (changeAccountPhoneButton) {
    changeAccountPhoneButton.textContent =
        currentUser.phone
            ? "Змінити номер телефону"
            : "Додати номер телефону";
}

    if (accountEmail) {
        accountEmail.textContent =
            currentUser.email || "—";
    }

    if (accountPhone) {
        accountPhone.textContent =
            currentUser.phone || "—";
    }
}

const changeAccountPhoneButton =
    document.getElementById(
        "changeAccountPhoneButton"
    );

if (changeAccountPhoneButton) {
    changeAccountPhoneButton.addEventListener(
        "click",
        async () => {
            const enteredPhone =
                prompt(
                    "Введи новий номер телефону:"
                );
    
            if (!enteredPhone) {
                return;
            }
    
            const newPhone =
                normalizePhone(
                    enteredPhone
                );
    
            if (
                !/^380\d{9}$/.test(
                    newPhone
                )
            ) {
                alert(
                    "Введи правильний український номер телефону."
                );
    
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
    
                return;
            }
    
            try {
                const response =
                    await fetch(
                        "/api/profile",
                        {
                            method: "PATCH",
    
                            headers: {
                                "Content-Type":
                                    "application/json",
    
                                Authorization:
                                    `Bearer ${token}`
                            },
    
                            body:
                                JSON.stringify({
                                    phone:
                                        newPhone
                                })
                        }
                    );
    
                const data =
                    await response.json();
    
                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Не вдалося змінити номер телефону."
                    );
                }
    
                const updatedUser =
                    data.user;
    
                currentUser.phone =
                    updatedUser.phone;
    
                localStorage.setItem(
                    CURRENT_USER_KEY,
                    JSON.stringify(
                        currentUser
                    )
                );
    
                const sellerPhoneInput =
                    document.getElementById(
                        "sellerProfilePhone"
                    );
    
                if (sellerPhoneInput) {
                    sellerPhoneInput.value =
                        updatedUser.phone ||
                        "";
                }
    
                renderAccountSettings();
    
                alert(
                    "Номер телефону змінено."
                );
    
            } catch (error) {
                console.error(
                    "Profile phone update error:",
                    error
                );
    
                alert(
                    error.message ||
                    "Не вдалося змінити номер телефону."
                );
            }
        }
    );
}

function renderPage() {
    updateGlobalChatsButton();
    renderAccountSettings();
    renderCars();
    renderSelectedCar();
    renderMyChats();
    renderFavoriteListings();
}

/* =========================
   МАРКА ТА МОДЕЛЬ АВТО
   ========================= */

   const carBrand =
   document.getElementById(
       "carBrand"
   );

const carModel =
   document.getElementById(
       "carModel"
   );

const carName =
   document.getElementById(
       "carName"
   );


/*
   ВАЖЛИВО:
   сюди встав той самий
   CAR_BRANDS_MODELS,
   який ми вже додали
   в market.js
*/

const CAR_BRANDS_MODELS = {
   "Audi": [
       "A1",
       "A3",
       "A4",
       "A5",
       "A6",
       "A7",
       "A8",
       "Q2",
       "Q3",
       "Q4 e-tron",
       "Q5",
       "Q7",
       "Q8",
       "TT",
       "R8",
       "e-tron",
       "Інша модель"
   ],

   "BMW": [
       "1 Series",
       "2 Series",
       "3 Series",
       "4 Series",
       "5 Series",
       "6 Series",
       "7 Series",
       "8 Series",
       "X1",
       "X2",
       "X3",
       "X4",
       "X5",
       "X6",
       "X7",
       "XM",
       "Z4",
       "i3",
       "i4",
       "i5",
       "i7",
       "iX",
       "Інша модель"
   ],

   "Mercedes-Benz": [
       "A-Class",
       "B-Class",
       "C-Class",
       "E-Class",
       "S-Class",
       "CLA",
       "CLS",
       "GLA",
       "GLB",
       "GLC",
       "GLE",
       "GLS",
       "G-Class",
       "V-Class",
       "AMG GT",
       "EQA",
       "EQB",
       "EQE",
       "EQS",
       "Інша модель"
   ],

   "Volkswagen": [
       "Polo",
       "Golf",
       "Jetta",
       "Passat",
       "Arteon",
       "Touran",
       "Tiguan",
       "Touareg",
       "T-Roc",
       "T-Cross",
       "Caddy",
       "Transporter",
       "Multivan",
       "ID.3",
       "ID.4",
       "ID.5",
       "ID.7",
       "Інша модель"
   ],

   "Toyota": [
       "Yaris",
       "Corolla",
       "Camry",
       "Avalon",
       "Prius",
       "C-HR",
       "RAV4",
       "Highlander",
       "Land Cruiser",
       "Hilux",
       "Proace",
       "bZ4X",
       "Інша модель"
   ],

   "Skoda": [
       "Fabia",
       "Scala",
       "Octavia",
       "Superb",
       "Kamiq",
       "Karoq",
       "Kodiaq",
       "Enyaq",
       "Roomster",
       "Yeti",
       "Інша модель"
   ],

   "Renault": [
       "Clio",
       "Megane",
       "Laguna",
       "Talisman",
       "Captur",
       "Kadjar",
       "Austral",
       "Koleos",
       "Scenic",
       "Espace",
       "Kangoo",
       "Trafic",
       "Master",
       "Zoe",
       "Інша модель"
   ],

   "Peugeot": [
       "107",
       "108",
       "206",
       "207",
       "208",
       "301",
       "307",
       "308",
       "407",
       "408",
       "508",
       "2008",
       "3008",
       "5008",
       "Partner",
       "Rifter",
       "Expert",
       "Traveller",
       "Інша модель"
   ],

   "Citroen": [
       "C1",
       "C3",
       "C4",
       "C5",
       "C-Elysee",
       "C3 Aircross",
       "C5 Aircross",
       "Berlingo",
       "Jumpy",
       "Jumper",
       "Інша модель"
   ],

   "Ford": [
       "Fiesta",
       "Focus",
       "Mondeo",
       "Fusion",
       "Mustang",
       "Puma",
       "Kuga",
       "Edge",
       "Explorer",
       "Ranger",
       "Transit",
       "Інша модель"
   ],

   "Opel": [
       "Corsa",
       "Astra",
       "Insignia",
       "Mokka",
       "Crossland",
       "Grandland",
       "Zafira",
       "Combo",
       "Vivaro",
       "Інша модель"
   ],

   "Nissan": [
       "Micra",
       "Note",
       "Almera",
       "Sentra",
       "Altima",
       "Maxima",
       "Juke",
       "Qashqai",
       "X-Trail",
       "Pathfinder",
       "Patrol",
       "Leaf",
       "Інша модель"
   ],

   "Mazda": [
       "2",
       "3",
       "6",
       "CX-3",
       "CX-30",
       "CX-5",
       "CX-60",
       "CX-7",
       "CX-9",
       "MX-5",
       "Інша модель"
   ],

   "Honda": [
       "Jazz",
       "Civic",
       "Accord",
       "Insight",
       "HR-V",
       "CR-V",
       "Pilot",
       "Інша модель"
   ],

   "Hyundai": [
       "i10",
       "i20",
       "i30",
       "Elantra",
       "Sonata",
       "Accent",
       "Tucson",
       "Santa Fe",
       "Kona",
       "Palisade",
       "Ioniq",
       "Ioniq 5",
       "Ioniq 6",
       "Інша модель"
   ],

   "Kia": [
       "Picanto",
       "Rio",
       "Ceed",
       "Cerato",
       "Optima",
       "K5",
       "Stonic",
       "Niro",
       "Sportage",
       "Sorento",
       "EV6",
       "EV9",
       "Інша модель"
   ],

   "Volvo": [
       "S40",
       "S60",
       "S80",
       "S90",
       "V40",
       "V60",
       "V90",
       "XC40",
       "XC60",
       "XC70",
       "XC90",
       "Інша модель"
   ],

   "Lexus": [
       "IS",
       "ES",
       "GS",
       "LS",
       "UX",
       "NX",
       "RX",
       "GX",
       "LX",
       "Інша модель"
   ],

   "Porsche": [
       "718",
       "911",
       "Panamera",
       "Macan",
       "Cayenne",
       "Taycan",
       "Інша модель"
   ],

   "Tesla": [
       "Model 3",
       "Model S",
       "Model X",
       "Model Y",
       "Cybertruck",
       "Інша модель"
   ],

   "Chevrolet": [
       "Aveo",
       "Cruze",
       "Malibu",
       "Camaro",
       "Captiva",
       "Equinox",
       "Tahoe",
       "Інша модель"
   ],

   "Mitsubishi": [
       "Colt",
       "Lancer",
       "ASX",
       "Eclipse Cross",
       "Outlander",
       "Pajero",
       "L200",
       "Інша модель"
   ],

   "Subaru": [
       "Impreza",
       "Legacy",
       "Outback",
       "Forester",
       "XV",
       "Crosstrek",
       "WRX",
       "BRZ",
       "Інша модель"
   ],

   "Suzuki": [
       "Swift",
       "Baleno",
       "SX4",
       "Vitara",
       "S-Cross",
       "Jimny",
       "Інша модель"
   ],

   "Land Rover": [
       "Defender",
       "Discovery",
       "Discovery Sport",
       "Range Rover",
       "Range Rover Sport",
       "Range Rover Velar",
       "Range Rover Evoque",
       "Інша модель"
   ],

   "Jeep": [
       "Renegade",
       "Compass",
       "Cherokee",
       "Grand Cherokee",
       "Wrangler",
       "Інша модель"
   ],

   "Fiat": [
       "500",
       "Panda",
       "Tipo",
       "Punto",
       "Doblo",
       "Ducato",
       "Інша модель"
   ],

   "Alfa Romeo": [
       "Giulietta",
       "Giulia",
       "Stelvio",
       "Tonale",
       "Інша модель"
   ],

   "Dacia": [
       "Logan",
       "Sandero",
       "Duster",
       "Jogger",
       "Lodgy",
       "Dokker",
       "Інша модель"
   ],

   "SEAT": [
       "Ibiza",
       "Leon",
       "Toledo",
       "Arona",
       "Ateca",
       "Tarraco",
       "Інша модель"
   ],

   "Cupra": [
       "Leon",
       "Formentor",
       "Ateca",
       "Born",
       "Tavascan",
       "Інша модель"
   ],

   "Інша марка": [
       "Інша модель"
   ]
};


function fillCarBrandSelect() {
   if (!carBrand) {
       return;
   }

   carBrand.innerHTML = `
       <option value="">
           Обери марку
       </option>
   `;

   Object.keys(
       CAR_BRANDS_MODELS
   ).forEach(
       (brand) => {
           const option =
               document.createElement(
                   "option"
               );

           option.value =
               brand;

           option.textContent =
               brand;

           carBrand.appendChild(
               option
           );
       }
   );
}


function fillCarModelSelect(
   brand,
   selectedModel = ""
) {
   if (!carModel) {
       return;
   }


   carModel.innerHTML = "";


   if (
       !brand ||
       !CAR_BRANDS_MODELS[brand]
   ) {
       carModel.innerHTML = `
           <option value="">
               Спочатку обери марку
           </option>
       `;

       carModel.disabled =
           true;

       return;
   }


   carModel.disabled =
       false;


   const defaultOption =
       document.createElement(
           "option"
       );

   defaultOption.value = "";

   defaultOption.textContent =
       "Обери модель";

   carModel.appendChild(
       defaultOption
   );


   CAR_BRANDS_MODELS[
       brand
   ].forEach(
       (model) => {
           const option =
               document.createElement(
                   "option"
               );

           option.value =
               model;

           option.textContent =
               model;

           carModel.appendChild(
               option
           );
       }
   );


   if (selectedModel) {
       carModel.value =
           selectedModel;
   }
}


function updateCarNameFromBrandModel() {
   if (
       !carName ||
       !carBrand ||
       !carModel
   ) {
       return;
   }

   const brand =
       carBrand.value.trim();

   const model =
       carModel.value.trim();

   carName.value =
       [brand, model]
           .filter(Boolean)
           .join(" ");
}


function setCarBrandAndModelFromName(
   vehicleName
) {
   if (
       !carBrand ||
       !carModel
   ) {
       return;
   }


   const name =
       String(
           vehicleName || ""
       ).trim();


   if (!name) {
       carBrand.value = "";

       fillCarModelSelect("");

       if (carName) {
           carName.value = "";
       }

       updateCarPowerField();

       return;
   }


   const brands =
       Object.keys(
           CAR_BRANDS_MODELS
       )
           .filter(
               (brand) =>
                   brand !==
                   "Інша марка"
           )
           .sort(
               (
                   firstBrand,
                   secondBrand
               ) =>
                   secondBrand.length -
                   firstBrand.length
           );


   const foundBrand =
       brands.find(
           (brand) =>
               name
                   .toLowerCase()
                   .startsWith(
                       brand.toLowerCase() +
                       " "
                   ) ||
               name.toLowerCase() ===
                   brand.toLowerCase()
       );


   if (!foundBrand) {
       carBrand.value =
           "Інша марка";

       fillCarModelSelect(
           "Інша марка"
       );

       carModel.value =
           "Інша модель";

       return;
   }


   const model =
       name
           .slice(
               foundBrand.length
           )
           .trim();


   carBrand.value =
       foundBrand;


   fillCarModelSelect(
       foundBrand
   );


   if (model) {
       const modelExists =
           Array.from(
               carModel.options
           ).some(
               (option) =>
                   option.value ===
                   model
           );


       if (!modelExists) {
           const option =
               document.createElement(
                   "option"
               );

           option.value =
               model;

           option.textContent =
               model;

           carModel.appendChild(
               option
           );
       }


       carModel.value =
           model;
   }


   if (carName) {
       carName.value =
           name;
   }
}


carBrand?.addEventListener(
   "change",
   () => {
       fillCarModelSelect(
           carBrand.value
       );

       updateCarNameFromBrandModel();
   }
);


carModel?.addEventListener(
   "change",
   updateCarNameFromBrandModel
);

/* =========================
   ФОРМА АВТО
   ========================= */

   const carPowerValueField =
    document.getElementById(
        "carPowerValueField"
    );

const carPowerValueLabel =
    document.getElementById(
        "carPowerValueLabel"
    );

const carFuel =
    document.getElementById(
        "carFuel"
    );

const carEngine =
    document.getElementById(
        "carEngine"
    );


function updateCarPowerField() {
    if (
        !carFuel ||
        !carPowerValueField ||
        !carPowerValueLabel ||
        !carEngine
    ) {
        return;
    }

    const fuel =
        carFuel.value;

        if (!fuel) {
            carPowerValueField.hidden =
                true;
        
            carPowerValueField.style.display =
                "none";
        
            carEngine.required =
                false;
        
            carEngine.value =
                "";
        
            return;
        }
        
        carPowerValueField.hidden =
            false;
        
        carPowerValueField.style.display =
            "";

    carEngine.required =
        true;

    if (fuel === "Електро") {
        carPowerValueLabel.textContent =
            "Ємність батареї, кВт·год";

        carEngine.placeholder =
            "Наприклад, 64";

        carEngine.min =
            "1";

        carEngine.max =
            "300";

        carEngine.step =
            "1";
    } else {
        carPowerValueLabel.textContent =
            "Об’єм двигуна, л";

        carEngine.placeholder =
            "Наприклад, 1.6";

        carEngine.min =
            "0.1";

        carEngine.max =
            "20";

        carEngine.step =
            "0.1";
    }
}


if (carFuel) {
    carFuel.addEventListener(
        "change",
        updateCarPowerField
    );
}

updateCarPowerField();

   function resetCarForm() {
    editingCarId = null;

    elements.carForm
        ?.reset();


    if (carBrand) {
        carBrand.value = "";
    }


    fillCarModelSelect("");


    if (carName) {
        carName.value = "";
    }
}

function openCarEditor(car) {
    editingCarId =
        car.id;

    setFieldValue(
        "carName",
        car.name
    );

    setCarBrandAndModelFromName(
        car.name
    );

    setFieldValue(
        "carYear",
        car.year
    );

    setFieldValue(
        "carMileage",
        car.mileage
    );

    setFieldValue(
        "carEngine",
        car.engine
    );

    setFieldValue(
        "carFuel",
        car.fuel
    );

    updateCarPowerField();

    setFieldValue(
        "carTransmission",
        car.transmission
    );

    setFieldValue(
        "carBody",
        car.body
    );

    setFieldValue(
        "carDrive",
        car.drive
    );

    setFieldValue(
        "carVin",
        car.vin
    );

    setFieldValue(
        "carPlate",
        car.plate
    );

    setFieldValue(
        "carPhoto",
        ""
    );

    openModal(
        elements.carModal
    );
}

async function updateGarageCarOnServer(
    carId,
    carData
) {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        throw new Error(
            "Сесія недійсна. Увійдіть повторно."
        );
    }

    const response =
        await fetch(
            `/api/garage/cars/${encodeURIComponent(
                carId
            )}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify(
                    carData
                )
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Не вдалося оновити автомобіль."
        );
    }

    return data.car;
}

async function deleteGarageCarFromServer(carId) {
    const response =
        await fetch(
            `/api/garage/cars/${carId}`,
            {
                method: "DELETE",
                credentials:
                    "include"
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Не вдалося видалити автомобіль."
        );
    }

    return data;
}

async function deleteGarageCarFromServer(carId) {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        throw new Error(
            "Сесія недійсна. Увійдіть повторно."
        );
    }

    const response =
        await fetch(
            `/api/garage/cars/${carId}`,
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
        throw new Error(
            data.message ||
            "Не вдалося видалити автомобіль."
        );
    }

    return data;
}



async function handleCarSubmit(
    event
) {
    event.preventDefault();

    const name =
        document
            .getElementById(
                "carName"
            )
            ?.value
            .trim() || "";

    const year =
        Number(
            document
                .getElementById(
                    "carYear"
                )
                ?.value
        );

    const mileage =
        Number(
            document
                .getElementById(
                    "carMileage"
                )
                ?.value
        );

    const engine =
        document
            .getElementById(
                "carEngine"
            )
            ?.value
            .trim() || "";

    const fuel =
        document
            .getElementById(
                "carFuel"
            )
            ?.value || "";

    const transmission =
        document
            .getElementById(
                "carTransmission"
            )
            ?.value || "";

    const body =
        document
            .getElementById(
                "carBody"
            )
            ?.value || "";

    const drive =
        document
            .getElementById(
                "carDrive"
            )
            ?.value || "";

    const vin =
        normalizeVin(
            document
                .getElementById(
                    "carVin"
                )
                ?.value
        );

    const plate =
        String(
            document
                .getElementById(
                    "carPlate"
                )
                ?.value || ""
        )
            .trim()
            .toUpperCase();

    const photoInput =
        document.getElementById(
            "carPhoto"
        );

    const photoFile =
        photoInput
            ?.files?.[0];

    if (
        !name ||
        !year ||
        year < 1886 ||
        mileage < 0
    ) {
        alert(
            "Перевір назву, рік і пробіг автомобіля."
        );

        return;
    }

    const duplicateVin =
        vin &&
        cars.some(
            (car) =>
                String(
                    car.id
                ) !==
                    String(
                        editingCarId
                    ) &&
                normalizeVin(
                    car.vin
                ) === vin
        );

    if (duplicateVin) {
        alert(
            "Автомобіль з таким VIN вже є."
        );

        return;
    }

    let compressedPhoto =
        "";

    if (photoFile) {
        try {
            compressedPhoto =
                await compressImage(
                    photoFile
                );
        } catch (error) {
            alert(
                error.message
            );

            return;
        }
    }

    if (editingCarId) {
        const car =
            cars.find(
                (item) =>
                    String(
                        item.id
                    ) ===
                    String(
                        editingCarId
                    )
            );

        if (!car) {
            alert(
                "Автомобіль не знайдений."
            );

            return;
        }

        Object.assign(
            car,
            {
                name,
                year,
                mileage,
                engine,
                fuel,
                transmission,
                body,
                drive,
                vin,
                plate
            }
        );

        if (
            compressedPhoto
        ) {
            const photos =
                getCarPhotos(
                    car
                );

            if (
                photos.length === 0
            ) {
                photos.push(
                    compressedPhoto
                );

                car.activePhotoIndex =
                    0;
            } else {
                photos[
                    car.activePhotoIndex
                ] =
                    compressedPhoto;
            }

            car.photos =
                photos;

            car.photo =
                photos[
                    car.activePhotoIndex
                ];
        }

        try {
            const updatedCar =
                await updateGarageCarOnServer(
                    car.id,
                    {
                        name:
                            car.name,
        
                        year:
                            car.year,
        
                        mileage:
                            car.mileage,
        
                        engine:
                            car.engine,
        
                        fuel:
                            car.fuel,
        
                        transmission:
                            car.transmission,
        
                        body:
                            car.body,
        
                        drive:
                            car.drive,
        
                        vin:
                            car.vin,
        
                        plate:
                            car.plate,
        
                        photo:
                            car.photo || "",
        
                        photos:
                            Array.isArray(
                                car.photos
                            )
                                ? car.photos
                                : [],
        
                        activePhotoIndex:
                            Number.isInteger(
                                car.activePhotoIndex
                            )
                                ? car.activePhotoIndex
                                : 0,
        
                        services:
                            Array.isArray(
                                car.services
                            )
                                ? car.services
                                : []
                    }
                );
        
            Object.assign(
                car,
                updatedCar
            );
        } catch (error) {
            console.error(
                "Garage car update request error:",
                error
            );
        
            alert(
                error.message ||
                "Не вдалося оновити автомобіль."
            );
        
            return;
        }
        
        selectedCarId =
            car.id;

        selectedCarId =
            car.id;
        } else {
            try {
                const newCar =
                    await createGarageCarOnServer({
                        name,
                        year,
                        mileage,
                        engine,
                        fuel,
                        transmission,
                        body,
                        drive,
                        vin,
                        plate,
        
                        photo:
                            compressedPhoto,
        
                        photos:
                            compressedPhoto
                                ? [
                                    compressedPhoto
                                ]
                                : [],
        
                        activePhotoIndex:
                            0,
        
                        services:
                            []
                    });
        
                cars.unshift(
                    newCar
                );
        
                selectedCarId =
                    newCar.id;
            } catch (error) {
                console.error(
                    "Garage car create request error:",
                    error
                );
        
                alert(
                    error.message ||
                    "Не вдалося додати автомобіль."
                );
        
                return;
            }
        }

    if (!saveCars()) {
        return;
    }

    resetCarForm();

    closeModal(
        elements.carModal
    );

    renderPage();
}


/* =========================
   ФОРМА ОБСЛУГОВУВАННЯ
   ========================= */

function resetServiceForm() {
    editingServiceId =
        null;

    elements.serviceForm
        ?.reset();
}

async function handleServiceSubmit(
    event
) {
    event.preventDefault();

    const car =
        getSelectedCar();

    if (!car) {
        alert(
            "Автомобіль не знайдено."
        );

        return;
    }

    const title =
        document
            .getElementById(
                "serviceTitle"
            )
            ?.value
            .trim() || "";

    const date =
        document
            .getElementById(
                "serviceDate"
            )
            ?.value || "";

    const mileage =
        Number(
            document
                .getElementById(
                    "serviceMileage"
                )
                ?.value
        );

    const cost =
        Number(
            document
                .getElementById(
                    "serviceCost"
                )
                ?.value
        );

    const station =
        document
            .getElementById(
                "serviceStation"
            )
            ?.value
            .trim() || "";

    const description =
        document
            .getElementById(
                "serviceDescription"
            )
            ?.value
            .trim() || "";

    const isPublic =
        Boolean(
            document
                .getElementById(
                    "servicePublic"
                )
                ?.checked
        );

    const photoInput =
        document.getElementById(
            "servicePhotos"
        );

    const photoFiles =
        Array.from(
            photoInput
                ?.files || []
        );

    if (
        !title ||
        !date
    ) {
        alert(
            "Вкажи назву роботи та дату."
        );

        return;
    }

    if (
        mileage < 0 ||
        cost < 0
    ) {
        alert(
            "Пробіг і вартість не можуть бути від’ємними."
        );

        return;
    }

    let oldService =
        null;

    let oldPhotos =
        [];

    if (
        editingServiceId
    ) {
        oldService =
            findService(
                car,
                editingServiceId
            );

        oldPhotos =
            oldService
                ? getServicePhotos(
                    oldService
                )
                : [];
    }

    if (
        oldPhotos.length +
            photoFiles.length >
        3
    ) {
        alert(
            "До одного запису можна додати максимум 3 фото."
        );

        return;
    }

    let newPhotos =
        [];

    try {
        newPhotos =
            await Promise.all(
                photoFiles.map(
                    (file) =>
                        compressImage(
                            file
                        )
                )
            );
    } catch (error) {
        alert(
            error.message
        );

        return;
    }

    if (
        editingServiceId &&
        oldService
    ) {
        Object.assign(
            oldService,
            {
                title,
                date,
                mileage,
                cost,
                station,
                description,
                isPublic,

                photos: [
                    ...oldPhotos,
                    ...newPhotos
                ]
            }
        );
    } else {
        car.services.push({
            id: createId(),

            title,
            date,
            mileage,
            cost,
            station,
            description,
            isPublic,

            photos:
                newPhotos,

            createdAt:
                new Date()
                    .toISOString()
        });
    }

    if (
        mileage >
        Number(
            car.mileage
        )
    ) {
        car.mileage =
            mileage;
    }

    if (!saveCars()) {
        return;
    }

    resetServiceForm();

    closeModal(
        elements.serviceModal
    );

    renderPage();
}


/* =========================
   МОЇ ЧАТИ
   ========================= */

function getLastMessageText(
    message
) {
    const text =
        String(
            message.text || ""
        ).trim();

    if (text) {
        return text;
    }

    if (
        message.attachment
            ?.type ===
        "image"
    ) {
        return "📷 Фото";
    }

    if (
        message.attachment
            ?.type ===
        "video"
    ) {
        return "🎥 Відео";
    }

    return "Нове повідомлення";
}

function renderMyChats() {
    if (
        !elements.myChatsList
    ) {
        return;
    }

    const messages =
        readJson(
            MESSAGES_KEY,
            []
        );

    const listings =
        readJson(
            LISTINGS_KEY,
            []
        );

    const currentUserId =
        String(
            currentUser.id
        );

    const totalUnread =
        messages.filter(
            (message) =>
                String(
                    message.receiverId
                ) ===
                    currentUserId &&
                !message.readAt
        ).length;

    if (
        elements.openChatsButton
    ) {
        elements.openChatsButton
            .innerHTML =
                totalUnread > 0
                    ? `
                        Мої чати

                        <span
                            class="chats-button-badge"
                        >
                            ${
                                totalUnread >
                                99
                                    ? "99+"
                                    : totalUnread
                            }
                        </span>
                    `
                    : "Мої чати";
    }

    const conversations =
        new Map();

    messages
        .filter(
            (message) =>
                String(
                    message.senderId
                ) ===
                    currentUserId ||
                String(
                    message.receiverId
                ) ===
                    currentUserId
        )
        .forEach(
            (message) => {
                const otherUserId =
                    String(
                        message.senderId
                    ) ===
                        currentUserId
                        ? String(
                            message.receiverId
                        )
                        : String(
                            message.senderId
                        );

                const key =
                    `${
                        message.listingId
                    }_${
                        otherUserId
                    }`;

                const previous =
                    conversations.get(
                        key
                    );

                if (
                    !previous ||
                    new Date(
                        message.createdAt
                    ) >
                        new Date(
                            previous
                                .message
                                .createdAt
                        )
                ) {
                    conversations.set(
                        key,
                        {
                            message,
                            otherUserId
                        }
                    );
                }
            }
        );

    if (
        conversations.size ===
        0
    ) {
        elements.myChatsList
            .innerHTML = `
                <p>
                    Чатів поки немає.
                </p>
            `;

        return;
    }

    elements.myChatsList
        .innerHTML = "";

    [
        ...conversations.values()
    ]
        .sort(
            (
                first,
                second
            ) =>
                new Date(
                    second
                        .message
                        .createdAt
                ) -
                new Date(
                    first
                        .message
                        .createdAt
                )
        )
        .forEach(
            ({
                message,
                otherUserId
            }) => {
                const listing =
                    listings.find(
                        (item) =>
                            String(
                                item.id
                            ) ===
                            String(
                                message
                                    .listingId
                            )
                    );

                const unreadCount =
                    messages.filter(
                        (
                            chatMessage
                        ) =>
                            String(
                                chatMessage
                                    .listingId
                            ) ===
                                String(
                                    message
                                        .listingId
                                ) &&
                            String(
                                chatMessage
                                    .senderId
                            ) ===
                                String(
                                    otherUserId
                                ) &&
                            String(
                                chatMessage
                                    .receiverId
                            ) ===
                                currentUserId &&
                            !chatMessage
                                .readAt
                    ).length;

                const title =
                    listing
                        ? `${
                            listing.name
                        } (${
                            listing.year
                        })`
                        : "Оголошення";

                const photo =
                    listing
                        ?.photos
                        ?.[0] ||
                    listing
                        ?.photo ||
                    "";

                const messageDate =
                    new Date(
                        message.createdAt
                    );

                const formattedDate =
                    Number.isNaN(
                        messageDate
                            .getTime()
                    )
                        ? ""
                        : messageDate
                            .toLocaleString(
                                "uk-UA",
                                {
                                    day:
                                        "2-digit",

                                    month:
                                        "2-digit",

                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"
                                }
                            );

                const chatLink =
                    document.createElement(
                        "a"
                    );

                chatLink.className =
                    "my-chat-card";

                chatLink.href =
                    `chat.html?listingId=${
                        encodeURIComponent(
                            message
                                .listingId
                        )
                    }&withUserId=${
                        encodeURIComponent(
                            otherUserId
                        )
                    }`;

                chatLink.innerHTML = `
                    <div
                        class="chat-card-header"
                    >

                        <div
                            class="chat-avatar"
                        >
                            ${
                                photo
                                    ? `
                                        <img
                                            src="${photo}"
                                            alt="${escapeHtml(
                                                title
                                            )}"
                                        >
                                    `
                                    : "🚗"
                            }
                        </div>

                        <div
                            class="chat-main"
                        >

                            <div
                                class="chat-title"
                            >
                                ${escapeHtml(
                                    title
                                )}
                            </div>

                            <div
                                class="chat-last-message"
                            >
                                ${escapeHtml(
                                    getLastMessageText(
                                        message
                                    )
                                )}
                            </div>

                        </div>

                        <div
                            class="chat-card-side"
                        >

                            <div
                                class="chat-time"
                            >
                                ${formattedDate}
                            </div>

                            ${
                                unreadCount > 0
                                    ? `
                                        <span
                                            class="chat-unread-badge"
                                        >
                                            ${
                                                unreadCount >
                                                99
                                                    ? "99+"
                                                    : unreadCount
                                            }
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;

                elements.myChatsList
                    .appendChild(
                        chatLink
                    );
            }
        );
}


/* =========================
   ВІДКРИТТЯ ІСТОРІЇ
   З ОГОЛОШЕННЯ
   ========================= */
   function openServiceHistoryFromUrl() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const section =
        params.get("section");

    const listingId =
        params.get("listingId");

    if (
        section !== "service" ||
        !listingId
    ) {
        return;
    }

    const listings =
        readJson(
            LISTINGS_KEY,
            []
        );

    const listing =
        listings.find(
            (item) =>
                String(item.id) ===
                String(listingId)
        );

    if (!listing) {
        alert(
            "Оголошення не знайдено."
        );

        return;
    }

    const listingVin =
        normalizeVin(
            listing.vin
        );

    if (!listingVin) {
        alert(
            "В оголошенні не збережений VIN автомобіля."
        );

        return;
    }

    const listingOwnerId =
        listing.ownerId ||
        listing.userId ||
        listing.sellerId ||
        listing.ownerEmail ||
        listing.email ||
        "";

    if (!listingOwnerId) {
        alert(
            "Не вдалося визначити власника автомобіля."
        );

        return;
    }

    const isOwner =
        String(currentUser.id) ===
        String(listingOwnerId);


    /* ===== ВЛАСНИК АВТО ===== */

    if (isOwner) {
        const matchingCar =
            cars.find(
                (car) =>
                    normalizeVin(
                        car.vin
                    ) ===
                    listingVin
            );

        if (!matchingCar) {
            alert(
                `Автомобіль з VIN ${listingVin} не знайдений у вашому гаражі.`
            );

            return;
        }

        selectedCarId =
            matchingCar.id;

        renderPage();

        openModal(
            elements.historyModal
        );

        window.history.replaceState(
            {},
            document.title,
            "profile.html"
        );

        return;
    }


    /* ===== ПОКУПЕЦЬ — ЧИТАЄМО ГАРАЖ ПРОДАВЦЯ ===== */

    const sellerGarageKey =
        `royalGarageCars_${listingOwnerId}`;

    const sellerCars =
        readJson(
            sellerGarageKey,
            []
        );

    const matchingCar =
        Array.isArray(sellerCars)
            ? sellerCars.find(
                (car) =>
                    normalizeVin(
                        car.vin
                    ) ===
                    listingVin
            )
            : null;

    if (!matchingCar) {
        alert(
            "Історія обслуговування цього автомобіля недоступна."
        );

        return;
    }


    /* ===== ТІЛЬКИ ПУБЛІЧНІ ЗАПИСИ ===== */

    const publicServices =
        Array.isArray(
            matchingCar.services
        )
            ? matchingCar.services
                .filter(
                    (service) =>
                        service.isPublic === true
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        String(
                            second.date || ""
                        ).localeCompare(
                            String(
                                first.date || ""
                            )
                        )
                )
            : [];


    if (
        elements.serviceHistory
    ) {
        elements.serviceHistory
            .querySelectorAll(
                ".service-card"
            )
            .forEach(
                (element) => {
                    element.remove();
                }
            );
    }


    if (
        elements.noServiceMessage
    ) {
        elements.noServiceMessage.hidden =
            publicServices.length > 0;

        if (
            publicServices.length === 0
        ) {
            elements.noServiceMessage.textContent =
                "Продавець ще не опублікував історію обслуговування цього автомобіля.";
        }
    }


    /* ===== СТАТИСТИКА ПУБЛІЧНОЇ ІСТОРІЇ ===== */

    if (
        elements.serviceCount
    ) {
        elements.serviceCount.textContent =
            String(
                publicServices.length
            );
    }

    const publicTotalCost =
        publicServices.reduce(
            (
                total,
                service
            ) =>
                total +
                Number(
                    service.cost || 0
                ),
            0
        );

    if (
        elements.totalServiceCost
    ) {
        elements.totalServiceCost.textContent =
            `${formatNumber(
                publicTotalCost
            )} грн`;
    }

    if (
        elements.currentMileage
    ) {
        elements.currentMileage.textContent =
            `${formatNumber(
                matchingCar.mileage
            )} км`;
    }


    /* ===== ВІДОБРАЖЕННЯ ПУБЛІЧНИХ ЗАПИСІВ ===== */

    publicServices.forEach(
        (service) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "service-card";

            card.innerHTML = `
                <div class="service-card-top">

                    <div>
                        <p class="service-date">
                            ${formatDate(
                                service.date
                            )}
                        </p>

                        <h3>
                            ${escapeHtml(
                                service.title
                            )}
                        </h3>
                    </div>

                    <span class="service-visibility">
                        Публічний
                    </span>

                </div>

                <div class="service-details">

                    <span>
                        Пробіг:

                        <strong>
                            ${formatNumber(
                                service.mileage
                            )} км
                        </strong>
                    </span>

                    <span>
                        Вартість:

                        <strong>
                            ${formatNumber(
                                service.cost
                            )} грн
                        </strong>
                    </span>

                </div>

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
            `;


            /* ===== ПУБЛІЧНІ ФОТО ===== */

            const photos =
                Array.isArray(
                    service.photos
                )
                    ? service.photos
                    : [];

            if (
                photos.length > 0
            ) {
                const gallery =
                    document.createElement(
                        "div"
                    );

                gallery.className =
                    "service-photo-gallery";

                photos.forEach(
                    (
                        photo,
                        photoIndex
                    ) => {
                        const photoItem =
                            document.createElement(
                                "div"
                            );

                        photoItem.className =
                            "service-photo-item";

                        const image =
                            document.createElement(
                                "img"
                            );

                        image.src =
                            photo;

                        image.alt =
                            "Фото до запису";

                        image.className =
                            "service-photo";

                        image.addEventListener(
                            "click",
                            () => {
                                openPhotoViewer(
                                    photos,
                                    photoIndex
                                );
                            }
                        );

                        photoItem.appendChild(
                            image
                        );

                        gallery.appendChild(
                            photoItem
                        );
                    }
                );

                card.appendChild(
                    gallery
                );
            }


            elements.serviceHistory
                ?.appendChild(
                    card
                );
        }
    );


    openModal(
        elements.historyModal
    );


    window.history.replaceState(
        {},
        document.title,
        "profile.html"
    );
}

/* =========================
   ОБРОБНИКИ ПОДІЙ
   ========================= */

elements.openCarButton
    ?.addEventListener(
        "click",
        () => {
            resetCarForm();

            openModal(
                elements.carModal
            );
        }
    );

elements.editCarButton
    ?.addEventListener(
        "click",
        () => {
            const car =
                getSelectedCar();

            if (!car) {
                alert(
                    "Автомобіль не вибраний."
                );

                return;
            }

            openCarEditor(car);
        }
    );

    elements.deleteCarButton
    ?.addEventListener(
        "click",
        async () => {
            const car =
                getSelectedCar();

            if (!car) {
                alert(
                    "Спочатку вибери автомобіль."
                );

                return;
            }

            const confirmed =
                confirm(
                    `Видалити автомобіль "${car.name}" разом з усією історією?`
                );

            if (!confirmed) {
                return;
            }

            try {
                await deleteGarageCarFromServer(
                    car.id
                );

                cars =
                    cars.filter(
                        (item) =>
                            String(
                                item.id
                            ) !==
                            String(
                                car.id
                            )
                    );

                selectedCarId =
                    cars[0]?.id ??
                    null;

                renderPage();

                alert(
                    "Автомобіль видалено з гаража."
                );
            } catch (error) {
                console.error(
                    "Garage car delete request error:",
                    error
                );

                alert(
                    error.message ||
                    "Не вдалося видалити автомобіль."
                );
            }
        }
    );
elements.openServiceButton
    ?.addEventListener(
        "click",
        () => {
            const car =
                getSelectedCar();

            if (!car) {
                alert(
                    "Спочатку додай автомобіль."
                );

                return;
            }

            resetServiceForm();

            setFieldValue(
                "serviceMileage",
                car.mileage
            );

            setFieldValue(
                "serviceDate",
                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    )
            );

            closeModal(
                elements.historyModal
            );

            openModal(
                elements.serviceModal
            );
        }
    );

elements.openHistoryButton
    ?.addEventListener(
        "click",
        () => {
            if (
                !getSelectedCar()
            ) {
                alert(
                    "Спочатку вибери автомобіль."
                );

                return;
            }

            renderSelectedCar();

            openModal(
                elements.historyModal
            );
        }
    );

elements.openChatsButton
    ?.addEventListener(
        "click",
        () => {
            renderMyChats();

            openModal(
                elements.chatsModal
            );
        }
    );

elements.carForm
    ?.addEventListener(
        "submit",
        handleCarSubmit
    );

elements.serviceForm
    ?.addEventListener(
        "submit",
        handleServiceSubmit
    );

elements.updateCarPhoto
    ?.addEventListener(
        "change",
        async () => {
            const files =
                Array.from(
                    elements
                        .updateCarPhoto
                        .files || []
                );

            if (
                files.length === 0
            ) {
                return;
            }

            const car =
                getSelectedCar();

            if (!car) {
                alert(
                    "Автомобіль не знайдено."
                );

                elements
                    .updateCarPhoto
                    .value = "";

                return;
            }

            const currentPhotos =
                getCarPhotos(
                    car
                );

            if (
                currentPhotos.length +
                    files.length >
                6
            ) {
                alert(
                    "Можна додати максимум 6 фото автомобіля."
                );

                elements
                    .updateCarPhoto
                    .value = "";

                return;
            }

            try {
                const newPhotos =
                    await Promise.all(
                        files.map(
                            (file) =>
                                compressImage(
                                    file
                                )
                        )
                    );

                car.photos = [
                    ...currentPhotos,
                    ...newPhotos
                ];

                if (
                    currentPhotos.length ===
                    0
                ) {
                    car.activePhotoIndex =
                        0;
                } else {
                    car.activePhotoIndex =
                        currentPhotos.length;
                }

                car.photo =
                    car.photos[
                        car.activePhotoIndex
                    ];

                saveCars();
                renderPage();
            } catch (error) {
                alert(
                    error.message
                );
            }

            elements
                .updateCarPhoto
                .value = "";
        }
    );

elements.previousCarPhoto
    ?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            showPhotoInViewer(
                viewerIndex - 1
            );
        }
    );

elements.nextCarPhoto
    ?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            showPhotoInViewer(
                viewerIndex + 1
            );
        }
    );

elements.closePhotoViewer
    ?.addEventListener(
        "click",
        closeViewer
    );

elements.photoViewer
    ?.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                elements.photoViewer
            ) {
                closeViewer();
            }
        }
    );

document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    closeModal(
                        button.closest(
                            ".modal"
                        )
                    );
                }
            );
        }
    );

document
    .querySelectorAll(
        ".modal"
    )
    .forEach(
        (modal) => {
            modal.addEventListener(
                "click",
                (event) => {
                    if (
                        event.target ===
                        modal
                    ) {
                        closeModal(
                            modal
                        );
                    }
                }
            );
        }
    );

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key ===
            "Escape"
        ) {
            closeViewer();

            document
                .querySelectorAll(
                    ".modal.modal-open"
                )
                .forEach(
                    (modal) => {
                        closeModal(
                            modal
                        );
                    }
                );
        }
    }
);

window.addEventListener(
    "storage",
    (event) => {
        if (
            event.key ===
            MESSAGES_KEY
        ) {
            renderMyChats();
        }
    }
);

document.addEventListener(
    "visibilitychange",
    () => {
        if (
            !document.hidden
        ) {
            renderMyChats();
        }
    }
);


/* =========================
   ЗАПУСК
   ========================= */

   fillCarBrandSelect();
   async function initializeProfilePage() {
    await loadProfileFromServer();

    await initializeGarageCars();

    fillSellerProfileSettings();

    await renderProfileSellerReputation();

    await renderProfileSellerReviews();

    openServiceHistoryFromUrl();
}
   
   initializeProfilePage();

const profileParams =
    new URLSearchParams(
        window.location.search
    );

if (
    profileParams.get("section") ===
    "chats"
) {
    renderMyChats();

    openModal(
        elements.chatsModal
    );

    window.history.replaceState(
        {},
        document.title,
        "profile.html"
    );
}

function updateGlobalChatsButton() {
    if (!globalOpenChatsButton) {
        return;
    }

    globalOpenChatsButton.hidden =
        cars.length > 0;

    globalOpenChatsButton.addEventListener(
        "click",
        () => {
            renderMyChats();
            openModal(elements.chatsModal);
        }
    );
}

/* ===== КНОПКА "ВГОРУ" ===== */

let backToTopButton =
    document.getElementById(
        "backToTopButton"
    );

if (!backToTopButton) {
    backToTopButton =
        document.createElement(
            "button"
        );

    backToTopButton.type =
        "button";

    backToTopButton.id =
        "backToTopButton";

    backToTopButton.className =
        "back-to-top-button";

    backToTopButton.setAttribute(
        "aria-label",
        "Повернутися вгору"
    );

    backToTopButton.textContent =
        "↑";

    document.body.appendChild(
        backToTopButton
    );
}

function updateBackToTopButton() {
    backToTopButton.classList.toggle(
        "is-visible",
        window.scrollY > 350
    );
}

backToTopButton.addEventListener(
    "click",
    () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);

window.addEventListener(
    "scroll",
    updateBackToTopButton,
    {
        passive: true
    }
);

updateBackToTopButton();