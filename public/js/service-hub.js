"use strict";

/* =========================
   SERVICE HUB LVIV
   ========================= */

const BUSINESSES_KEY =
    "royalGarageBusinesses";

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";

const SERVICE_HUB_ID =
    "service-hub-lviv";

    const SERVICE_HUB_OWNER_ID =
    "d2363e3d-4723-4755-9030-594cd3ccd6f0";

/* =========================
   STORAGE
   ========================= */

function readJson(
    key,
    fallback
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


function loadBusinesses() {
    return readJson(
        BUSINESSES_KEY,
        {}
    );
}


function saveBusinesses(
    businesses
) {
    localStorage.setItem(
        BUSINESSES_KEY,
        JSON.stringify(
            businesses
        )
    );
}


function getCurrentUser() {
    return readJson(
        CURRENT_USER_KEY,
        null
    );
}


/* =========================
   СТВОРЕННЯ / ОНОВЛЕННЯ
   БІЗНЕСУ
   ========================= */

function ensureServiceHubBusiness() {
    const businesses =
        loadBusinesses();

    const oldBusiness =
        businesses[
            SERVICE_HUB_ID
        ] || {};

    businesses[
        SERVICE_HUB_ID
    ] = {
        id:
            SERVICE_HUB_ID,

        name:
            oldBusiness.name ||
            "SERVICE HUB LVIV",

        city:
            oldBusiness.city ||
            "Львів",

        address:
            oldBusiness.address ||
            "вул. Кульпарківська, 230а",

        phone:
            oldBusiness.phone ||
            "",

        telegram:
            oldBusiness.telegram ||
            "",

        instagram:
            oldBusiness.instagram ||
            "",

        description:
            oldBusiness.description ||
            "Професійне обслуговування та ремонт автомобілів.",

        mainPhoto:
            oldBusiness.mainPhoto ||
            "",

        photos:
            Array.isArray(
                oldBusiness.photos
            )
                ? oldBusiness.photos
                : [],

                media:
    Array.isArray(
        oldBusiness.media
    )
        ? oldBusiness.media
        : (
            Array.isArray(
                oldBusiness.photos
            )
                ? oldBusiness.photos.map(
                    (photo) => ({
                        type: "image",
                        src: photo,
                        caption: ""
                    })
                )
                : []
        ),

        services:
            Array.isArray(
                oldBusiness.services
            )
                ? oldBusiness.services
                : [
                    "Заміна мастила та фільтрів",
                    "Гальмівна система",
                    "Ремонт ходової",
                    "Діагностика та ремонт",
                    "Кондиціонери",
                    "Автоелектрика"
                ],

                serviceDetails:
    oldBusiness.serviceDetails || {
        "oil-service": {
            title:
                "Заміна мастила та фільтрів",

            description:
                "Планове технічне обслуговування автомобіля з перевіркою основних витратних матеріалів."
        },

        "brakes": {
            title:
                "Гальмівна система",

            description:
                "Діагностика та ремонт гальмівної системи автомобіля."
        },

        "suspension": {
            title:
                "Діагностика та ремонт підвіски",

            description:
                "Перевірка стану ходової частини та ремонт несправних елементів."
        },

        "diagnostics": {
            title:
                "Пошук несправностей та ремонт",

            description:
                "Комплексна діагностика автомобіля та пошук несправностей."
        },

        "air-conditioning": {
            title:
                "Кондиціонери",

            description:
                "Діагностика, обслуговування та заправка системи кондиціонування."
        },

        "auto-electric": {
            title:
                "Автоелектрика",

            description:
                "Діагностика та ремонт електричних систем автомобіля."
        }
    },

        ownerId:
            SERVICE_HUB_OWNER_ID,

        updatedAt:
            oldBusiness.updatedAt ||
            new Date().toISOString()
    };

    saveBusinesses(
        businesses
    );
}


function getServiceHubBusiness() {
    const businesses =
        loadBusinesses();

    return (
        businesses[
            SERVICE_HUB_ID
        ] || null
    );
}


/* =========================
   ДОПОМІЖНІ
   ========================= */

function escapeHtml(value) {
    return String(value || "")
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
                            "Не вдалося відкрити фото."
                        )
                    );
                };

                image.onload = () => {

                    const maxSize =
                        1200;

                    const scale =
                        Math.min(
                            1,
                            maxSize /
                                image.naturalWidth,
                            maxSize /
                                image.naturalHeight
                        );

                    const width =
                        Math.round(
                            image.naturalWidth *
                            scale
                        );

                    const height =
                        Math.round(
                            image.naturalHeight *
                            scale
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


function makeTelegramUrl(value) {
    const telegram =
        String(value || "")
            .trim();

    if (!telegram) {
        return "";
    }

    if (
        telegram.startsWith(
            "http://"
        ) ||
        telegram.startsWith(
            "https://"
        )
    ) {
        return telegram;
    }

    return (
        "https://t.me/" +
        telegram.replace(
            /^@/,
            ""
        )
    );
}


/* =========================
   ВІДОБРАЖЕННЯ СТОРІНКИ
   ========================= */
   function renderServiceHub() {
    const business =
        getServiceHubBusiness();

    if (!business) {
        return;
    }

    const name =
        document.getElementById(
            "serviceHubName"
        );

    const description =
        document.getElementById(
            "serviceHubDescription"
        );

    const address =
        document.getElementById(
            "serviceHubAddress"
        );

    if (name) {
        name.textContent =
            business.name;
    }

    if (description) {
        description.textContent =
            business.description;
    }

    if (address) {
        address.textContent =
            [
                business.city,
                business.address
            ]
                .filter(Boolean)
                .join(", ");
    }

    renderMainPhoto(
        business
    );

    renderServiceDetails(
        business
    );

    renderPublicServices(
        business
    );

    renderGallery(
        business
    );

    renderContacts(
        business
    );

    renderOwnerPanel(
        business
    );

    renderServicesEditor(
        business
    );
}


/* =========================
   ДЕТАЛЬНІ ОПИСИ ПОСЛУГ
   ========================= */

function renderServiceDetails(
    business
) {
    const details =
        business.serviceDetails || {};

    const owner =
        isServiceHubOwner();

    Object.entries(
        details
    ).forEach(
        ([serviceId, service]) => {

            const card =
                document.getElementById(
                    serviceId
                );

            if (!card) {
                return;
            }

            const title =
    
            card.querySelector(
                "h2"
            );
        
        const description =
            card.querySelector(
                "h2 + p"
            );
            if (title) {
                title.textContent =
                    service.title || "";
            }

            if (description) {
                description.textContent =
                    service.description || "";
            }


            /* КНОПКА ТІЛЬКИ ДЛЯ ВЛАСНИКА */

            let editButton =
                card.querySelector(
                    ".service-hub-detail-edit-button"
                );

            if (!owner) {
                if (editButton) {
                    editButton.remove();
                }

                return;
            }

            if (!editButton) {
                editButton =
                    document.createElement(
                        "button"
                    );

                editButton.type =
                    "button";

                editButton.className =
                    "upholstery-secondary-button service-hub-detail-edit-button";

                editButton.textContent =
                    "Редагувати опис";

                editButton.addEventListener(
                    "click",
                    () => {
                        editServiceHubDetail(
                            serviceId
                        );
                    }
                );

                card.appendChild(
                    editButton
                );
            }
        }
    );
}


/* =========================
   РЕДАГУВАННЯ ОПИСУ
   ========================= */

function editServiceHubDetail(
    serviceId
) {
    if (!isServiceHubOwner()) {
        return;
    }

    const businesses =
        loadBusinesses();

    const business =
        businesses[
            SERVICE_HUB_ID
        ];

    if (!business) {
        return;
    }

    business.serviceDetails =
        business.serviceDetails || {};

    const current =
        business.serviceDetails[
            serviceId
        ];

    if (!current) {
        return;
    }


    /* НАЗВА */

    const newTitle =
        prompt(
            "Назва детальної послуги:",
            current.title || ""
        );

    if (newTitle === null) {
        return;
    }

    const cleanTitle =
        newTitle.trim();

    if (!cleanTitle) {
        alert(
            "Назва не може бути порожньою."
        );

        return;
    }


    /* ОПИС */

    const newDescription =
        prompt(
            "Опис послуги:",
            current.description || ""
        );

    if (newDescription === null) {
        return;
    }


    business.serviceDetails[
        serviceId
    ] = {
        ...current,

        title:
            cleanTitle,

        description:
            newDescription.trim(),

        updatedAt:
            new Date()
                .toISOString()
    };

    business.updatedAt =
        new Date()
            .toISOString();

    saveBusinesses(
        businesses
    );

    renderServiceHub();
}

function renderPublicServices(
    business
) {
    const container =
        document.getElementById(
            "serviceHubPublicServices"
        );

    if (!container) {
        return;
    }

    const services =
        Array.isArray(
            business.services
        )
            ? business.services
            : [];

    container.innerHTML = "";

    services.forEach(
        (service) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "service-hub-public-service-card";

            const name =
                typeof service === "string"
                    ? service
                    : service.name || "";

            const price =
                typeof service === "object"
                    ? service.price || ""
                    : "";

            const title =
                document.createElement(
                    "strong"
                );

            title.textContent =
                name;

            card.appendChild(
                title
            );

            if (price) {
                const priceElement =
                    document.createElement(
                        "span"
                    );

                priceElement.textContent =
                    price;

                card.appendChild(
                    priceElement
                );
            }

            container.appendChild(
                card
            );
        }
    );
}


/* =========================
   ГОЛОВНЕ ФОТО
   ========================= */

function renderMainPhoto(
    business
) {
    const image =
        document.getElementById(
            "serviceHubMainPhoto"
        );

    const placeholder =
        document.getElementById(
            "serviceHubMainPhotoPlaceholder"
        );

    if (
        !image ||
        !placeholder
    ) {
        return;
    }

    const photoSource =
    business.mainPhoto ||
    "images/service-hub-logo.jpg";

    image.classList.toggle(
        "service-hub-logo-image",
        !business.mainPhoto
    );

image.src =
    photoSource;

image.hidden =
    false;

placeholder.hidden =
    true;

image.onclick = () => {
    openViewer(
        photoSource
    );
};
}


/* =========================
   ГАЛЕРЕЯ
   ========================= */

   function deleteServiceHubMedia(
    mediaIndex
) {
    if (!isServiceHubOwner()) {
        return;
    }

    const businesses =
        loadBusinesses();

    const business =
        businesses[
            SERVICE_HUB_ID
        ];

    if (
        !business ||
        !Array.isArray(
            business.media
        )
    ) {
        return;
    }

    const confirmed =
        confirm(
            "Видалити це фото або відео?"
        );

    if (!confirmed) {
        return;
    }

    business.media.splice(
        mediaIndex,
        1
    );

    business.updatedAt =
        new Date()
            .toISOString();

    saveBusinesses(
        businesses
    );

    renderServiceHub();
}

   function renderGallery(
    business
) {
    const gallery =
        document.getElementById(
            "serviceHubGallery"
        );

    if (!gallery) {
        return;
    }

    const media =
        Array.isArray(
            business.media
        )
            ? business.media
            : [];

    gallery.innerHTML = "";

    if (media.length === 0) {
        gallery.innerHTML = `
            <div
                class="upholstery-photo-placeholder"
            >
                <span>📷</span>

                <p>
                    Фото та відео робіт
                    поки не додані.
                </p>
            </div>
        `;

        return;
    }


    media.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "service-hub-media-card";


            /* ===== ФОТО ===== */

            if (
                item.type === "image" &&
                item.src
            ) {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "service-hub-media-image-button";

                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    item.src;

                image.alt =
                    item.caption ||
                    `Робота SERVICE HUB LVIV ${
                        index + 1
                    }`;

                button.appendChild(
                    image
                );

                button.addEventListener(
                    "click",
                    () => {
                        openViewer(
                            item.src
                        );
                    }
                );

                card.appendChild(
                    button
                );
            }


            /* ===== ВІДЕО ===== */

            if (
                item.type === "video" &&
                item.url
            ) {
                const videoLink =
                    document.createElement(
                        "a"
                    );

                videoLink.href =
                    item.url;

                videoLink.target =
                    "_blank";

                videoLink.rel =
                    "noopener noreferrer";

                videoLink.className =
                    "service-hub-video-link";

                videoLink.innerHTML = `
                    <span>▶️</span>
                    <strong>
                        Переглянути відео
                    </strong>
                `;

                card.appendChild(
                    videoLink
                );
            }


            /* ===== ПІДПИС ===== */

            if (item.caption) {
                const caption =
                    document.createElement(
                        "p"
                    );

                caption.className =
                    "service-hub-media-caption";

                caption.textContent =
                    item.caption;

                card.appendChild(
                    caption
                );
            }

            if (isServiceHubOwner()) {
                const deleteButton =
                    document.createElement(
                        "button"
                    );
            
                deleteButton.type =
                    "button";
            
                deleteButton.className =
                    "service-hub-media-delete";
            
                deleteButton.textContent =
                    "Видалити";
            
                deleteButton.addEventListener(
                    "click",
                    () => {
                        deleteServiceHubMedia(
                            index
                        );
                    }
                );
            
                card.appendChild(
                    deleteButton
                );
            }


            gallery.appendChild(
                card
            );
        }
    );
}

/* =========================
   КОНТАКТИ
   ========================= */

function renderContacts(
    business
) {
    const telegram =
        document.getElementById(
            "serviceHubTelegram"
        );

    const instagram =
        document.getElementById(
            "serviceHubInstagram"
        );

    const routeButton =
        document.getElementById(
            "serviceHubRouteButton"
        );

    const phoneButton =
        document.getElementById(
            "copyServiceHubPhoneButton"
        );


    if (telegram) {
        const telegramUrl =
            makeTelegramUrl(
                business.telegram
            );

        telegram.hidden =
            !telegramUrl;

        if (telegramUrl) {
            telegram.href =
                telegramUrl;

            telegram.target =
                "_blank";

            telegram.rel =
                "noopener noreferrer";
        }
    }


    if (instagram) {
        const instagramUrl =
            String(
                business.instagram ||
                ""
            ).trim();

        instagram.hidden =
            !instagramUrl;

        if (instagramUrl) {
            instagram.href =
                instagramUrl;

            instagram.target =
                "_blank";

            instagram.rel =
                "noopener noreferrer";
        }
    }


    if (routeButton) {
        const routeAddress =
            [
                business.city,
                business.address
            ]
                .filter(Boolean)
                .join(", ");

        routeButton.href =
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(
                routeAddress
            );
    }


    if (phoneButton) {
        phoneButton.hidden =
            !business.phone;

        if (business.phone) {
            phoneButton.textContent =
                `Телефон: ${business.phone}`;
        }
    }
}


/* =========================
   ВЛАСНИК
   ========================= */

function isServiceHubOwner() {
    const currentUser =
        getCurrentUser();

    const business =
        getServiceHubBusiness();

    if (
        !currentUser ||
        !business
    ) {
        return false;
    }

    return (
        String(
            currentUser.id
        ) ===
        String(
            business.ownerId
        )
    );
}


function renderOwnerPanel(
    business
) {
    const ownerPanel =
        document.getElementById(
            "serviceHubOwnerPanel"
        );

    if (!ownerPanel) {
        return;
    }

    const owner =
        isServiceHubOwner();

    ownerPanel.hidden =
        !owner;

    if (!owner) {
        return;
    }


    const name =
        document.getElementById(
            "serviceHubEditName"
        );

    const city =
        document.getElementById(
            "serviceHubEditCity"
        );

    const address =
        document.getElementById(
            "serviceHubEditAddress"
        );

    const phone =
        document.getElementById(
            "serviceHubEditPhone"
        );

    const telegram =
        document.getElementById(
            "serviceHubEditTelegram"
        );

    const instagram =
        document.getElementById(
            "serviceHubEditInstagram"
        );

    const description =
        document.getElementById(
            "serviceHubEditDescription"
        );


    if (name) {
        name.value =
            business.name || "";
    }

    if (city) {
        city.value =
            business.city || "";
    }

    if (address) {
        address.value =
            business.address || "";
    }

    if (phone) {
        phone.value =
            business.phone || "";
    }

    if (telegram) {
        telegram.value =
            business.telegram || "";
    }

    if (instagram) {
        instagram.value =
            business.instagram || "";
    }

    if (description) {
        description.value =
            business.description || "";
    }
}


/* =========================
   ЗБЕРЕЖЕННЯ ЗМІН
   ========================= */

async function saveServiceHubChanges(
    event
) {
    event.preventDefault();

    if (!isServiceHubOwner()) {
        alert(
            "У вас немає доступу до редагування цієї сторінки."
        );

        return;
    }


    const businesses =
        loadBusinesses();

    const business =
        businesses[
            SERVICE_HUB_ID
        ];

    if (!business) {
        return;
    }


    business.name =
        document
            .getElementById(
                "serviceHubEditName"
            )
            ?.value
            .trim() ||
        "SERVICE HUB LVIV";


    business.city =
        document
            .getElementById(
                "serviceHubEditCity"
            )
            ?.value
            .trim() ||
        "";


    business.address =
        document
            .getElementById(
                "serviceHubEditAddress"
            )
            ?.value
            .trim() ||
        "";


    business.phone =
        document
            .getElementById(
                "serviceHubEditPhone"
            )
            ?.value
            .trim() ||
        "";


    business.telegram =
        document
            .getElementById(
                "serviceHubEditTelegram"
            )
            ?.value
            .trim() ||
        "";


    business.instagram =
        document
            .getElementById(
                "serviceHubEditInstagram"
            )
            ?.value
            .trim() ||
        "";


    business.description =
        document
            .getElementById(
                "serviceHubEditDescription"
            )
            ?.value
            .trim() ||
        "";


    const mainPhotoInput =
        document.getElementById(
            "serviceHubEditMainPhoto"
        );

    const mainPhotoFile =
        mainPhotoInput
            ?.files?.[0];


    if (mainPhotoFile) {
        try {
            business.mainPhoto =
                await compressImage(
                    mainPhotoFile
                );
        } catch (error) {
            alert(
                error.message
            );

            return;
        }
    }


    const photoInput =
    document.getElementById(
        "serviceHubEditPhoto"
    );

const photoCaptionInput =
    document.getElementById(
        "serviceHubEditPhotoCaption"
    );

const photoFile =
    photoInput?.files?.[0];

business.media =
    Array.isArray(
        business.media
    )
        ? business.media
        : [];


/* ===== ДОДАЄМО ФОТО ===== */

if (photoFile) {
    try {
        const photoData =
            await compressImage(
                photoFile
            );

        const photoCaption =
            photoCaptionInput
                ?.value
                .trim() || "";

        business.media.push({
            type: "image",
            src: photoData,
            caption:
                photoCaption,
            createdAt:
                new Date()
                    .toISOString()
        });

        /*
         * Залишаємо також у старому photos,
         * щоб нічого не поламати,
         * поки переробляємо галерею.
         */
        business.photos =
            Array.isArray(
                business.photos
            )
                ? business.photos
                : [];

        business.photos.push(
            photoData
        );

    } catch (error) {
        alert(
            error.message
        );

        return;
    }
}


/* ===== ДОДАЄМО ВІДЕО ===== */

const videoUrlInput =
    document.getElementById(
        "serviceHubEditVideoUrl"
    );

const videoCaptionInput =
    document.getElementById(
        "serviceHubEditVideoCaption"
    );

const videoUrl =
    videoUrlInput
        ?.value
        .trim() || "";

if (videoUrl) {
    try {
        const parsedUrl =
            new URL(
                videoUrl
            );

        if (
            parsedUrl.protocol !==
                "https:" &&
            parsedUrl.protocol !==
                "http:"
        ) {
            throw new Error();
        }

    } catch {
        alert(
            "Введи правильне посилання на відео."
        );

        return;
    }

    business.media.push({
        type: "video",
        url: videoUrl,
        caption:
            videoCaptionInput
                ?.value
                .trim() || "",
        createdAt:
            new Date()
                .toISOString()
    });
}

    business.updatedAt =
        new Date()
            .toISOString();


    saveBusinesses(
        businesses
    );


    if (mainPhotoInput) {
        mainPhotoInput.value =
            "";
    }

    if (photoInput) {
        photoInput.value = "";
    }
    
    if (photoCaptionInput) {
        photoCaptionInput.value = "";
    }
    
    if (videoUrlInput) {
        videoUrlInput.value = "";
    }
    
    if (videoCaptionInput) {
        videoCaptionInput.value = "";
    }

    renderServiceHub();


    alert(
        "Сторінку SERVICE HUB LVIV оновлено."
    );
}


/* =========================
   КОПІЮВАННЯ ТЕЛЕФОНУ
   ========================= */

const phoneButton =
    document.getElementById(
        "copyServiceHubPhoneButton"
    );

phoneButton?.addEventListener(
    "click",
    async () => {

        const business =
            getServiceHubBusiness();

        if (!business?.phone) {
            return;
        }

        try {
            await navigator.clipboard
                .writeText(
                    business.phone
                );

            const oldText =
                phoneButton.textContent;

            phoneButton.textContent =
                "Номер скопійовано ✓";

            setTimeout(
                () => {
                    phoneButton.textContent =
                        oldText;
                },
                1500
            );

        } catch (error) {
            alert(
                "Не вдалося скопіювати номер."
            );
        }
    }
);


/* =========================
   ПОВНОЕКРАННЕ ФОТО
   ========================= */

const viewer =
    document.getElementById(
        "serviceHubViewer"
    );

const viewerImage =
    document.getElementById(
        "serviceHubViewerImage"
    );

const closeViewerButton =
    document.getElementById(
        "closeServiceHubViewer"
    );


function openViewer(
    photo
) {
    if (
        !viewer ||
        !viewerImage ||
        !photo
    ) {
        return;
    }

    viewerImage.src =
        photo;

    viewer.classList.add(
        "is-open"
    );

    viewer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "upholstery-viewer-open"
    );
}


function closeViewer() {
    viewer?.classList.remove(
        "is-open"
    );

    viewer?.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "upholstery-viewer-open"
    );
}


closeViewerButton?.addEventListener(
    "click",
    closeViewer
);


viewer?.addEventListener(
    "click",
    (event) => {
        if (
            event.target ===
            viewer
        ) {
            closeViewer();
        }
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
        }
    }
);


/* =========================
   ФОРМА
   ========================= */

const editForm =
    document.getElementById(
        "serviceHubEditForm"
    );

editForm?.addEventListener(
    "submit",
    saveServiceHubChanges
);

function deleteServiceHubService(
    serviceIndex
) {
    if (!isServiceHubOwner()) {
        return;
    }

    const businesses =
        loadBusinesses();

    const business =
        businesses[
            SERVICE_HUB_ID
        ];

    if (
        !business ||
        !Array.isArray(
            business.services
        )
    ) {
        return;
    }

    const confirmed =
        confirm(
            "Видалити цю послугу?"
        );

    if (!confirmed) {
        return;
    }

    business.services.splice(
        serviceIndex,
        1
    );

    business.updatedAt =
        new Date()
            .toISOString();

    saveBusinesses(
        businesses
    );

    renderServiceHub();
}

function editServiceHubService(
    serviceIndex
) {
    if (!isServiceHubOwner()) {
        return;
    }

    const businesses =
        loadBusinesses();

    const business =
        businesses[
            SERVICE_HUB_ID
        ];

    if (
        !business ||
        !Array.isArray(
            business.services
        )
    ) {
        return;
    }

    const service =
        business.services[
            serviceIndex
        ];

    const oldName =
        typeof service === "string"
            ? service
            : service.name || "";

    const oldPrice =
        typeof service === "object"
            ? service.price || ""
            : "";

    const newName =
        prompt(
            "Назва послуги:",
            oldName
        );

    if (newName === null) {
        return;
    }

    const cleanName =
        newName.trim();

    if (!cleanName) {
        alert(
            "Назва послуги не може бути порожньою."
        );

        return;
    }

    const newPrice =
        prompt(
            "Ціна:",
            oldPrice
        );

    if (newPrice === null) {
        return;
    }

    business.services[
        serviceIndex
    ] = {
        name: cleanName,
        price: newPrice.trim(),
        updatedAt:
            new Date()
                .toISOString()
    };

    business.updatedAt =
        new Date()
            .toISOString();

    saveBusinesses(
        businesses
    );

    renderServiceHub();
}

function renderServicesEditor(
    business
) {
    const list =
        document.getElementById(
            "serviceHubServicesEditorList"
        );

    if (!list) {
        return;
    }

    const services =
        Array.isArray(
            business.services
        )
            ? business.services
            : [];

    list.innerHTML = "";

    services.forEach(
        (service, index) => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "service-hub-service-editor-item";

            const serviceName =
                typeof service === "string"
                    ? service
                    : service.name || "";

            const servicePrice =
                typeof service === "object"
                    ? service.price || ""
                    : "";

            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                servicePrice
                    ? `${serviceName} — ${servicePrice}`
                    : serviceName;

            item.appendChild(
                text
            );

            const editButton =
    document.createElement(
        "button"
    );

editButton.type =
    "button";

editButton.className =
    "service-hub-service-edit";

editButton.textContent =
    "Редагувати";

editButton.addEventListener(
    "click",
    () => {
        editServiceHubService(
            index
        );
    }
);

item.appendChild(
    editButton
);

            const deleteButton =
    document.createElement(
        "button"
    );

deleteButton.type =
    "button";

deleteButton.className =
    "service-hub-service-delete";

deleteButton.textContent =
    "Видалити";

deleteButton.addEventListener(
    "click",
    () => {
        deleteServiceHubService(
            index
        );
    }
);

item.appendChild(
    deleteButton
);

            list.appendChild(
                item
            );
        }
    );
}


document
    .getElementById(
        "serviceHubAddServiceButton"
    )
    ?.addEventListener(
        "click",
        () => {
            if (!isServiceHubOwner()) {
                return;
            }

            const nameInput =
                document.getElementById(
                    "serviceHubNewServiceName"
                );

            const priceInput =
                document.getElementById(
                    "serviceHubNewServicePrice"
                );

            const name =
                nameInput
                    ?.value
                    .trim() || "";

            const price =
                priceInput
                    ?.value
                    .trim() || "";

            if (!name) {
                alert(
                    "Введи назву послуги."
                );

                return;
            }

            const businesses =
                loadBusinesses();

            const business =
                businesses[
                    SERVICE_HUB_ID
                ];

            if (!business) {
                return;
            }

            business.services =
                Array.isArray(
                    business.services
                )
                    ? business.services
                    : [];

            business.services.push({
                name,
                price,
                createdAt:
                    new Date()
                        .toISOString()
            });

            business.updatedAt =
                new Date()
                    .toISOString();

            saveBusinesses(
                businesses
            );

            nameInput.value = "";
            priceInput.value = "";

            renderServicesEditor(
                business
            );
        }
    );


/* =========================
   СТАРТ
   ========================= */

ensureServiceHubBusiness();

renderServiceHub();