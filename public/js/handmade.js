"use strict";


/* =========================
   ROYAL AUTO
   ========================= */

const ROYAL_AUTO_CURRENT_USER_KEY =
    "royalGarageCurrentUser";

const ROYAL_AUTO_OWNER_ID =
    "32ce413e-9eb6-417a-b99a-77d9ca7c144a";


function getRoyalAutoCurrentUser() {
    try {
        const value =
            localStorage.getItem(
                ROYAL_AUTO_CURRENT_USER_KEY
            );

        return value
            ? JSON.parse(value)
            : null;

    } catch (error) {
        console.error(
            "Royal Auto current user error:",
            error
        );

        return null;
    }
}


function isRoyalAutoOwner() {
    const currentUser =
        getRoyalAutoCurrentUser();

    if (!currentUser) {
        return false;
    }

    return (
        String(currentUser.id) ===
        String(ROYAL_AUTO_OWNER_ID)
    );
}



/* =========================
   ПАНЕЛЬ ВЛАСНИКА
   ========================= */

const royalAutoOwnerPanel =
    document.getElementById(
        "royalAutoOwnerPanel"
    );


function renderRoyalAutoOwnerPanel() {
    if (!royalAutoOwnerPanel) {
        return;
    }

    royalAutoOwnerPanel.hidden =
        !isRoyalAutoOwner();
}


renderRoyalAutoOwnerPanel();



/* =========================
   КНОПКИ ПАНЕЛІ
   ========================= */

const manageRoyalAutoCarsButton =
    document.getElementById(
        "manageRoyalAutoCarsButton"
    );

const manageSeatCoversButton =
    document.getElementById(
        "manageSeatCoversButton"
    );

const managePillowsButton =
    document.getElementById(
        "managePillowsButton"
    );


function scrollToRoyalAutoSection(
    sectionId
) {
    const section =
        document.getElementById(
            sectionId
        );

    if (!section) {
        return;
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


manageRoyalAutoCarsButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "cars"
            );
        }
    );


manageSeatCoversButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "seat-covers"
            );
        }
    );


managePillowsButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "pillows"
            );
        }
    );



/* =========================
   АВТОМОБІЛІ ROYAL AUTO
   ========================= */

const royalAutoCarsGrid =
    document.getElementById(
        "royalAutoCarsGrid"
    );

const royalAutoCarsLoading =
    document.getElementById(
        "royalAutoCarsLoading"
    );

const royalAutoCarsEmpty =
    document.getElementById(
        "royalAutoCarsEmpty"
    );


function formatRoyalAutoPrice(
    listing
) {

    const priceUsd =
        Number(
            listing.priceUsd ??
            listing.price_usd
        );

    const priceUah =
        Number(
            listing.priceUah ??
            listing.price_uah
        );


    if (
        Number.isFinite(priceUsd) &&
        priceUsd > 0
    ) {
        return (
            new Intl.NumberFormat(
                "uk-UA"
            ).format(priceUsd) +
            " $"
        );
    }


    if (
        Number.isFinite(priceUah) &&
        priceUah > 0
    ) {
        return (
            new Intl.NumberFormat(
                "uk-UA"
            ).format(priceUah) +
            " грн"
        );
    }


    return "Ціна договірна";
}


function getRoyalAutoCarPhoto(
    listing
) {

    const photos =
        Array.isArray(listing.photos)
            ? listing.photos
            : [];


    if (photos.length === 0) {
        return "";
    }


    const activeIndex =
        Number(
            listing.activePhotoIndex ??
            listing.active_photo_index ??
            0
        );


    return (
        photos[activeIndex] ||
        photos[0] ||
        ""
    );
}


function createRoyalAutoCarCard(
    listing
) {

    const link =
        document.createElement("a");

    link.className =
        "royal-auto-car-card";

    link.href =
        `listing.html?id=${
            encodeURIComponent(
                listing.id
            )
        }`;


    const photoBox =
        document.createElement("div");

    photoBox.className =
        "royal-auto-car-photo";


    const photo =
        getRoyalAutoCarPhoto(
            listing
        );


    if (photo) {

        const image =
            document.createElement("img");

        image.src =
            photo;

        image.alt =
            listing.name ||
            "Автомобіль Royal Auto";

        image.loading =
            "lazy";

        photoBox.appendChild(
            image
        );

    } else {

        const placeholder =
            document.createElement("div");

        placeholder.className =
            "royal-auto-car-placeholder";

        placeholder.textContent =
            "🚘";

        photoBox.appendChild(
            placeholder
        );
    }


    const info =
        document.createElement("div");

    info.className =
        "royal-auto-car-info";


    const title =
        document.createElement("h3");

    title.textContent =
        listing.name ||
        "Автомобіль";


    if (listing.year) {
        title.textContent +=
            ` ${listing.year}`;
    }


    const price =
        document.createElement("strong");

    price.className =
        "royal-auto-car-price";

    price.textContent =
        formatRoyalAutoPrice(
            listing
        );


    const button =
        document.createElement("span");

    button.className =
        "royal-auto-car-more";

    button.textContent =
        "Детальніше";


    info.append(
        title,
        price,
        button
    );


    link.append(
        photoBox,
        info
    );


    return link;
}


async function loadRoyalAutoCars() {

    if (!royalAutoCarsGrid) {
        return;
    }


    try {

        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                false;
        }


        if (royalAutoCarsEmpty) {
            royalAutoCarsEmpty.hidden =
                true;
        }


        royalAutoCarsGrid.innerHTML =
            "";


        const response =
            await fetch(
                "/api/market/listings"
            );


        if (!response.ok) {
            throw new Error(
                "Не вдалося отримати оголошення."
            );
        }


        const data =
            await response.json();


        const listings =
            Array.isArray(data.listings)
                ? data.listings
                : [];


        const royalAutoListings =
            listings.filter(
                (listing) => {

                    const ownerId =
                        listing.ownerId ??
                        listing.owner_id;

                    return (
                        String(ownerId) ===
                        String(
                            ROYAL_AUTO_OWNER_ID
                        )
                    );
                }
            );


        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                true;
        }


        if (
            royalAutoListings.length ===
            0
        ) {

            if (royalAutoCarsEmpty) {
                royalAutoCarsEmpty.hidden =
                    false;
            }

            return;
        }


        royalAutoListings.forEach(
            (listing) => {

                royalAutoCarsGrid.appendChild(
                    createRoyalAutoCarCard(
                        listing
                    )
                );
            }
        );


    } catch (error) {

        console.error(
            "Royal Auto cars load error:",
            error
        );


        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                true;
        }


        if (royalAutoCarsEmpty) {

            royalAutoCarsEmpty.hidden =
                false;

            royalAutoCarsEmpty.textContent =
                "Не вдалося завантажити автомобілі.";
        }
    }
}


loadRoyalAutoCars();



/* =========================
   КОПІЮВАННЯ ТЕЛЕФОНУ
   ========================= */

const copyPhoneButton =
    document.getElementById(
        "copyPhoneButton"
    );


if (copyPhoneButton) {

    copyPhoneButton.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard
                    .writeText(
                        "+380632384348"
                    );


                copyPhoneButton.textContent =
                    "Номер скопійовано ✓";


                setTimeout(
                    () => {

                        copyPhoneButton.textContent =
                            "Телефон: +380 63 238 43 48";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Phone copy error:",
                    error
                );


                alert(
                    "Не вдалося скопіювати номер."
                );
            }
        }
    );
}

/* =========================
   ПЛАВАЮЧА КНОПКА ЗВ'ЯЗКУ
   ========================= */

   const royalAutoContactFloat =
   document.querySelector(
       ".royal-auto-contact-float"
   );


function updateRoyalAutoContactFloat() {

   if (!royalAutoContactFloat) {
       return;
   }


   royalAutoContactFloat.classList.toggle(
       "is-visible",
       window.scrollY > 350
   );
}


window.addEventListener(
   "scroll",
   updateRoyalAutoContactFloat,
   {
       passive: true
   }
);


updateRoyalAutoContactFloat();