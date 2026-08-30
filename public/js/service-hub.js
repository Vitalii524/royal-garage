"use strict";

/* =========================
   SERVICE HUB LVIV
   BUSINESS PROFILE
   ========================= */

const SERVICE_HUB_OWNER_ID =
    "d2363e3d-4723-4755-9030-594cd3ccd6f0";

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";

    let currentServiceHubProfile =
    null;


function getToken() {
    return (
        localStorage.getItem(
            "royalGarageToken"
        ) || ""
    );
}


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
        (
            service,
            index
        ) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "service-hub-service-card";

            const title =
                document.createElement(
                    "h3"
                );

            const serviceName =
                typeof service ===
                "string"
                    ? service
                    : service?.name ||
                      service?.title ||
                      "Послуга";

            title.textContent =
                serviceName;

            card.appendChild(
                title
            );


            if (
                isServiceHubOwner()
            ) {
                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "service-hub-service-actions";


                const editButton =
                    document.createElement(
                        "button"
                    );

                editButton.type =
                    "button";

                editButton.className =
                    "service-hub-secondary-button";

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


                const deleteButton =
                    document.createElement(
                        "button"
                    );

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "service-hub-delete-button";

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


                actions.append(
                    editButton,
                    deleteButton
                );

                card.appendChild(
                    actions
                );
            }


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

        currentServiceHubProfile =
            data.profile;

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

async function editServiceHubService(
    index
) {
    if (
        !isServiceHubOwner() ||
        !currentServiceHubProfile
    ) {
        return;
    }

    const services =
        Array.isArray(
            currentServiceHubProfile.services
        )
            ? [
                ...currentServiceHubProfile.services
            ]
            : [];

    const current =
        services[index];

    if (!current) {
        return;
    }

    const currentName =
        typeof current ===
        "string"
            ? current
            : current.name ||
              current.title ||
              "";

    const newName =
        prompt(
            "Нова назва послуги:",
            currentName
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

    services[index] = {
        id:
            typeof current === "object" &&
            current.id
                ? current.id
                : crypto.randomUUID(),

        name:
            cleanName
    };

    try {
        await saveServiceHubServices(
            services
        );

        alert(
            "Послугу оновлено."
        );

    } catch (error) {
        console.error(
            "Service Hub edit service error:",
            error
        );

        alert(
            error.message
        );
    }
}


async function deleteServiceHubService(
    index
) {
    if (
        !isServiceHubOwner() ||
        !currentServiceHubProfile
    ) {
        return;
    }

    const services =
        Array.isArray(
            currentServiceHubProfile.services
        )
            ? [
                ...currentServiceHubProfile.services
            ]
            : [];

    const service =
        services[index];

    if (!service) {
        return;
    }

    const serviceName =
        typeof service ===
        "string"
            ? service
            : service.name ||
              service.title ||
              "цю послугу";

    const confirmed =
        confirm(
            `Видалити послугу "${serviceName}"?`
        );

    if (!confirmed) {
        return;
    }

    services.splice(
        index,
        1
    );

    try {
        await saveServiceHubServices(
            services
        );

        alert(
            "Послугу видалено."
        );

    } catch (error) {
        console.error(
            "Service Hub delete service error:",
            error
        );

        alert(
            error.message
        );
    }
}

async function saveServiceHubServices(
    services
) {
    const token =
        getToken();

    if (!token) {
        alert(
            "Потрібно увійти в акаунт."
        );

        return false;
    }

    const response =
        await fetch(
            "/api/business/profile",
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
                        services
                    })
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Не вдалося зберегти послуги."
        );
    }

    currentServiceHubProfile = {
        ...currentServiceHubProfile,
        ...data.profile
    };

    renderServices(
        currentServiceHubProfile.services
    );

    return true;
}


async function addServiceHubService() {
    if (!isServiceHubOwner()) {
        return;
    }

    const name =
        prompt(
            "Назва послуги:"
        );

    if (name === null) {
        return;
    }

    const cleanName =
        name.trim();

    if (!cleanName) {
        alert(
            "Назва послуги не може бути порожньою."
        );

        return;
    }

    const currentServices =
        Array.isArray(
            currentServiceHubProfile?.services
        )
            ? [
                ...currentServiceHubProfile.services
            ]
            : [];

    currentServices.push({
        id:
            crypto.randomUUID(),

        name:
            cleanName
    });

    try {
        await saveServiceHubServices(
            currentServices
        );

        alert(
            "Послугу додано."
        );

    } catch (error) {
        console.error(
            "Service Hub add service error:",
            error
        );

        alert(
            error.message
        );
    }
}


document
    .getElementById(
        "serviceHubAddServiceButton"
    )
    ?.addEventListener(
        "click",
        addServiceHubService
    );
    document
    .getElementById(
        "serviceHubMapButton"
    )
    ?.addEventListener(
        "click",
        () => {
            if (
                !isServiceHubOwner()
            ) {
                return;
            }

            alert(
                "Google Maps доступний для SERVICE HUB LVIV."
            );
        }
    );


document
    .getElementById(
        "serviceHubCrmButton"
    )
    ?.addEventListener(
        "click",
        () => {
            if (
                !isServiceHubOwner()
            ) {
                return;
            }

            alert(
                "CRM доступна для SERVICE HUB LVIV."
            );
        }
    );

/* =========================
   FLOATING BUTTONS
   ========================= */

const contactFloat =
    document.getElementById(
        "serviceHubContactFloat"
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

}


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