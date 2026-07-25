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
    listings =
        JSON.parse(
            localStorage.getItem(
                MARKET_STORAGE_KEY
            )
        ) || [];
} catch (error) {
    console.error(
        "Не вдалося завантажити оголошення:",
        error
    );
}


const listing =
    listings.find(
        (item) => item.id === listingId
    );


if (!listing) {
    listingDetails.innerHTML = `
        <div class="listing-card">
            <h1>Оголошення не знайдено</h1>

            <p>
                Воно могло бути видалене.
            </p>
        </div>
    `;
} else {
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


    listingDetails.innerHTML = `
        <section
            class="listing-card listing-gallery"
        >
            ${
                mainPhoto
                    ? `
                        <div class="listing-photo-stage">

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
                                alt="${listing.name}"
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
                                ${mainPhotoIndex + 1} / ${photos.length}
                            </div>

                        </div>

                        <div
                            id="listingPhotoThumbnails"
                            class="listing-photo-thumbnails"
                        >
                            ${photos
                                .map(
                                    (photo, index) => `
                                        <button
                                            type="button"
                                            class="listing-photo-thumbnail ${
                                                index === mainPhotoIndex
                                                    ? "is-active"
                                                    : ""
                                            }"
                                            data-photo-index="${index}"
                                            aria-label="Відкрити фото ${index + 1}"
                                        >
                                            <img
                                                src="${photo}"
                                                alt="${listing.name}, фото ${index + 1}"
                                            >
                                        </button>
                                    `
                                )
                                .join("")}
                        </div>
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
                ${Number(
                    listing.priceUsd || 0
                ).toLocaleString("uk-UA")} $
            </h2>

            <p>
                ≈ ${Number(
                    listing.priceUah || 0
                ).toLocaleString("uk-UA")} грн
            </p>

            <p>
                📍 ${listing.city || "Місто не вказано"}
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
            <h2>Основні параметри</h2>

            <div class="listing-parameters">
                <p>
                    <strong>Рік випуску:</strong>

                    ${
                        listing.year ||
                        "Не вказано"
                    }
                </p>

                <p>
                    <strong>Пробіг:</strong>

                    ${Number(
                        listing.mileage || 0
                    ).toLocaleString("uk-UA")} км
                </p>

                <p>
                    <strong>Пальне:</strong>

                    ${
                        listing.fuel ||
                        "Не вказано"
                    }
                </p>

                <p>
                    <strong>Коробка:</strong>

                    ${
                        listing.transmission ||
                        "Не вказано"
                    }
                </p>

                <p>
                    <strong>Кузов:</strong>

                    ${
                        listing.body ||
                        "Не вказано"
                    }
                </p>

                <p>
                    <strong>Привід:</strong>

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
                            ? `${listing.powerValue} ${
                                listing.powerType ===
                                "battery"
                                    ? "кВт·год"
                                    : "л"
                            }`
                            : listing.engine ||
                              "Не вказано"
                    }
                </p>

                <p>
                    <strong>VIN-код:</strong>

                    <span id="listingVinValue">
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
            <h2>Опис автомобіля</h2>

            <p class="listing-description">
                ${
                    listing.description ||
                    "Опис не додано."
                }
            </p>
        </section>


        <section
            class="listing-card seller-card"
        >
            <h2>Продавець</h2>

            <p>
                Місто:
                ${
                    listing.city ||
                    "Не вказано"
                }
            </p>

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


    /* ===== КНОПКА ЧАТУ ===== */

    const openChatButton =
        document.getElementById(
            "openChatButton"
        );


    if (openChatButton) {
        openChatButton.addEventListener(
            "click",
            () => {
                const currentUser =
                    getCurrentUser();

                if (!currentUser) {
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
                    await navigator.clipboard.writeText(
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
            `${listing.name}, фото ${
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
                `${listing.name}, фото ${
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


        photoViewer.classList.add(
            "is-open"
        );


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

        photoViewer.classList.remove(
            "is-open"
        );


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


    /* ===== СТРІЛКИ БІЛЯ ГОЛОВНОГО ФОТО ===== */

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


    /* ===== ВІДКРИТТЯ НА ВЕСЬ ЕКРАН ===== */

    if (listingMainPhoto) {
        listingMainPhoto.addEventListener(
            "click",
            openPhotoViewer
        );


        listingMainPhoto.tabIndex = 0;


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


    /* ===== СТРІЛКИ У ПОВНОЕКРАННОМУ РЕЖИМІ ===== */

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


    /* ===== ЗАКРИТТЯ ПОВНОЕКРАННОГО РЕЖИМУ ===== */

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


    /* ===== КЛАВІАТУРА ===== */

    document.addEventListener(
        "keydown",
        (event) => {
            const viewerIsOpen =
                photoViewer?.classList.contains(
                    "is-open"
                );


            if (!viewerIsOpen) {
                return;
            }


            if (event.key === "Escape") {
                closePhotoViewer();

                return;
            }


            if (event.key === "ArrowLeft") {
                showPreviousPhoto();

                return;
            }


            if (event.key === "ArrowRight") {
                showNextPhoto();
            }
        }
    );


    /* ===== СТРІЛКИ НЕ ПОТРІБНІ ДЛЯ ОДНОГО ФОТО ===== */

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