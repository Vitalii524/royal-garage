"use strict";

/* =========================
   SERVICE HUB LVIV
   BUSINESS PROFILE
   ========================= */

const SERVICE_HUB_OWNER_ID =
    "d2363e3d-4723-4755-9030-594cd3ccd6f0";

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";


function readCurrentUser() {
    try {
        const value =
            localStorage.getItem(
                CURRENT_USER_KEY
            );

        return value
            ? JSON.parse(value)
            : null;

    } catch (error) {
        console.error(
            "Не вдалося прочитати поточного користувача:",
            error
        );

        return null;
    }
}


function isServiceHubOwner() {
    const currentUser =
        readCurrentUser();

    if (!currentUser) {
        return false;
    }

    return (
        String(currentUser.id) ===
        String(SERVICE_HUB_OWNER_ID)
    );
}


function makeTelegramUrl(
    value
) {
    const telegram =
        String(
            value || ""
        ).trim();

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


function makeInstagramUrl(
    value
) {
    const instagram =
        String(
            value || ""
        ).trim();

    if (!instagram) {
        return "";
    }

    if (
        instagram.startsWith(
            "http://"
        ) ||
        instagram.startsWith(
            "https://"
        )
    ) {
        return instagram;
    }

    return (
        "https://instagram.com/" +
        instagram.replace(
            /^@/,
            ""
        )
    );
}


/* =========================
   RENDER PROFILE
   ========================= */

function renderServiceHubProfile(
    profile
) {
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
            profile.name ||
            "SERVICE HUB LVIV";
    }

    if (description) {
        description.textContent =
            profile.description ||
            "Профіль автосервісу в Royal Garage.";
    }

    if (address) {
        address.textContent =
            [
                profile.city,
                profile.address
            ]
                .filter(Boolean)
                .join(", ") ||
            "Адресу ще не вказано";
    }

    renderMainPhoto(
        profile
    );

    renderServices(
        profile.services
    );

    renderGallery(
        profile.photos
    );

    renderContacts(
        profile
    );

    renderOwnerPanel();
}


/* =========================
   MAIN PHOTO
   ========================= */

function renderMainPhoto(
    profile
) {
    const image =
        document.getElementById(
            "serviceHubMainPhoto"
        );

    if (!image) {
        return;
    }

    const source =
        profile.logo ||
        "images/service-hub-logo.jpg";

    image.src =
        source;

    image.alt =
        profile.name ||
        "SERVICE HUB LVIV";
}


/* =========================
   SERVICES
   ========================= */

function renderServices(
    services
) {
    const container =
        document.getElementById(
            "serviceHubPublicServices"
        );

    if (!container) {
        return;
    }

    const list =
        Array.isArray(
            services
        )
            ? services
            : [];

    container.innerHTML = "";

    if (
        list.length === 0
    ) {
        const empty =
            document.createElement(
                "p"
            );

        empty.id =
            "serviceHubServicesEmpty";

        empty.className =
            "service-hub-empty";

        empty.textContent =
            "Послуги ще не додано.";

        container.appendChild(
            empty
        );

        return;
    }

    list.forEach(
        (service) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "service-hub-service-card";

            const title =
                typeof service ===
                "string"
                    ? service
                    : service?.name ||
                      service?.title ||
                      "Послуга";

            const heading =
                document.createElement(
                    "h3"
                );

            heading.textContent =
                title;

            card.appendChild(
                heading
            );

            container.appendChild(
                card
            );
        }
    );
}


/* =========================
   GALLERY
   ========================= */

function renderGallery(
    photos
) {
    const gallery =
        document.getElementById(
            "serviceHubGallery"
        );

    if (!gallery) {
        return;
    }

    const list =
        Array.isArray(
            photos
        )
            ? photos
            : [];

    gallery.innerHTML = "";

    if (
        list.length === 0
    ) {
        const empty =
            document.createElement(
                "p"
            );

        empty.id =
            "serviceHubGalleryEmpty";

        empty.className =
            "service-hub-empty";

        empty.textContent =
            "Фото робіт ще не додано.";

        gallery.appendChild(
            empty
        );

        return;
    }

    list.forEach(
        (photo) => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "service-hub-gallery-item";

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                photo;

            image.alt =
                "Фото роботи";

            image.loading =
                "lazy";

            item.appendChild(
                image
            );

            gallery.appendChild(
                item
            );
        }
    );
}


/* =========================
   CONTACTS
   ========================= */

function renderContacts(
    profile
) {
    const telegram =
        document.getElementById(
            "serviceHubTelegram"
        );

    const instagram =
        document.getElementById(
            "serviceHubInstagram"
        );

    const phone =
        document.getElementById(
            "serviceHubPhoneLink"
        );

    const route =
        document.getElementById(
            "serviceHubRouteButton"
        );


    if (telegram) {
        const url =
            makeTelegramUrl(
                profile.telegram
            );

        telegram.hidden =
            !url;

        if (url) {
            telegram.href =
                url;
        }
    }


    if (instagram) {
        const url =
            makeInstagramUrl(
                profile.instagram
            );

        instagram.hidden =
            !url;

        if (url) {
            instagram.href =
                url;
        }
    }


    if (phone) {
        const cleanPhone =
            String(
                profile.phone || ""
            )
                .replace(
                    /\D/g,
                    ""
                );

        phone.hidden =
            !cleanPhone;

        if (cleanPhone) {
            phone.href =
                `tel:+${cleanPhone}`;
        }
    }


    if (route) {
        const routeAddress =
            [
                profile.city,
                profile.address
            ]
                .filter(Boolean)
                .join(", ");

        if (routeAddress) {
            route.href =
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(
                    routeAddress
                );
        }
    }
}


/* =========================
   OWNER PANEL
   ========================= */

function renderOwnerPanel() {
    const panel =
        document.getElementById(
            "serviceHubOwnerPanel"
        );

    if (!panel) {
        return;
    }

    panel.hidden =
        !isServiceHubOwner();
}


/* =========================
   LOAD PUBLIC PROFILE
   ========================= */

async function loadServiceHubProfile() {
    try {
        const response =
            await fetch(
                `/api/business/profiles/${SERVICE_HUB_OWNER_ID}`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити бізнес-профіль."
            );
        }

        renderServiceHubProfile(
            data.profile
        );

    } catch (error) {
        console.error(
            "Service Hub profile load error:",
            error
        );
    }
}


/* =========================
   FLOATING BUTTONS
   ========================= */

const contactFloat =
    document.getElementById(
        "serviceHubContactFloat"
    );

const backToTopButton =
    document.getElementById(
        "serviceHubBackToTop"
    );


function updateFloatingButtons() {
    const contacts =
        document.getElementById(
            "contacts"
        );

    const contactsRect =
        contacts
            ?.getBoundingClientRect();

    const contactsVisible =
        Boolean(
            contactsRect &&
            contactsRect.top <
                window.innerHeight &&
            contactsRect.bottom > 0
        );

    if (contactFloat) {
        contactFloat
            .classList
            .toggle(
                "is-visible",
                window.scrollY > 350 &&
                !contactsVisible
            );
    }

    if (backToTopButton) {
        backToTopButton
            .classList
            .toggle(
                "is-visible",
                window.scrollY > 350
            );
    }
}


backToTopButton
    ?.addEventListener(
        "click",
        () => {
            window.scrollTo({
                top: 0,
                behavior:
                    "smooth"
            });
        }
    );


window.addEventListener(
    "scroll",
    updateFloatingButtons,
    {
        passive: true
    }
);


/* =========================
   START
   ========================= */

updateFloatingButtons();
loadServiceHubProfile();