"use strict";

/* =========================
   BUSINESS PROFILE
   ========================= */

let currentBusinessProfile = null;

const businessElements = {
    logo:
        document.getElementById(
            "businessLogo"
        ),

    logoPlaceholder:
        document.getElementById(
            "businessLogoPlaceholder"
        ),

    logoUploadLabel:
        document.getElementById(
            "businessLogoUploadLabel"
        ),

    logoInput:
        document.getElementById(
            "businessLogoInput"
        ),

    ownerPanel:
        document.getElementById(
            "businessOwnerPanel"
        ),

    name:
        document.getElementById(
            "businessName"
        ),

    typeLabel:
        document.getElementById(
            "businessTypeLabel"
        ),

    heroDescription:
        document.getElementById(
            "businessHeroDescription"
        ),

    description:
        document.getElementById(
            "businessDescription"
        ),

    city:
        document.getElementById(
            "businessCity"
        ),

    address:
        document.getElementById(
            "businessAddress"
        ),

    planName:
        document.getElementById(
            "businessPlanName"
        ),

    phoneLink:
        document.getElementById(
            "businessPhoneLink"
        ),

    telegramLink:
        document.getElementById(
            "businessTelegramLink"
        ),

    instagramLink:
        document.getElementById(
            "businessInstagramLink"
        ),

    servicesGrid:
        document.getElementById(
            "businessServicesGrid"
        ),

    servicesEmpty:
        document.getElementById(
            "businessServicesEmpty"
        ),

    gallery:
        document.getElementById(
            "businessGallery"
        ),

    galleryEmpty:
        document.getElementById(
            "businessGalleryEmpty"
        ),

    carsSection:
        document.getElementById(
            "businessCarsSection"
        ),

    carsGrid:
        document.getElementById(
            "businessCarsGrid"
        ),

    carsLoading:
        document.getElementById(
            "businessCarsLoading"
        ),

    carsEmpty:
        document.getElementById(
            "businessCarsEmpty"
        )
};


function getToken() {
    return localStorage.getItem(
        "royalGarageToken"
    );
}


function renderBusinessLogo(
    logo,
    businessName = ""
) {
    if (
        !businessElements.logo ||
        !businessElements.logoPlaceholder
    ) {
        return;
    }

    if (logo) {
        businessElements.logo.src =
            logo;

        businessElements.logo.hidden =
            false;

        businessElements
            .logoPlaceholder
            .hidden = true;

        return;
    }

    businessElements.logo.hidden =
        true;

    businessElements.logo.src =
        "";

    businessElements
        .logoPlaceholder
        .hidden = false;

    const initials =
        String(
            businessName || "RG"
        )
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                (part) =>
                    part
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");

    businessElements
        .logoPlaceholder
        .textContent =
            initials || "RG";
}


function renderBusinessProfile(
    profile
) {
    currentBusinessProfile =
        profile;

    if (businessElements.name) {
        businessElements.name.textContent =
            profile.name ||
            "Бізнес";
    }

    if (businessElements.typeLabel) {
        businessElements
            .typeLabel
            .textContent =
                profile.businessTypeName ||
                "Бізнес";
    }

    if (businessElements.heroDescription) {
        businessElements
            .heroDescription
            .textContent =
                profile.description ||
                "Профіль бізнесу в Royal Garage.";
    }

    if (businessElements.description) {
        businessElements
            .description
            .textContent =
                profile.description ||
                "Опис компанії ще не додано.";
    }

    if (businessElements.city) {
        businessElements.city.textContent =
            profile.city ||
            "Не вказано";
    }

    if (businessElements.address) {
        businessElements.address.textContent =
            profile.address ||
            "Не вказано";
    }

    if (businessElements.planName) {
        businessElements
            .planName
            .textContent =
                profile.planName
                    ? `${profile.planName} — ${profile.priceUah || 0} грн/міс`
                    : "—";
    }

    renderBusinessLogo(
        profile.logo,
        profile.name
    );

    renderBusinessContacts(
        profile
    );

    renderBusinessServices(
        profile.services
    );

    renderBusinessGallery(
        profile.photos
    );

    renderBusinessTypeFeatures(
        profile
    );
}


function renderBusinessContacts(
    profile
) {
    const phone =
        String(
            profile.phone || ""
        ).replace(/\s+/g, "");

    if (businessElements.phoneLink) {
        if (phone) {
            businessElements
                .phoneLink
                .href =
                    `tel:+${phone.replace(
                        /^\+/,
                        ""
                    )}`;

            businessElements
                .phoneLink
                .textContent =
                    "📞 Зателефонувати";

            businessElements
                .phoneLink
                .hidden = false;
        } else {
            businessElements
                .phoneLink
                .hidden = true;
        }
    }

    if (
        businessElements.telegramLink
    ) {
        const telegram =
            String(
                profile.telegram || ""
            ).trim();

        if (telegram) {
            const username =
                telegram
                    .replace(
                        /^https?:\/\/t\.me\//i,
                        ""
                    )
                    .replace(/^@/, "");

            businessElements
                .telegramLink
                .href =
                    `https://t.me/${username}`;

            businessElements
                .telegramLink
                .hidden = false;
        } else {
            businessElements
                .telegramLink
                .hidden = true;
        }
    }

    if (
        businessElements.instagramLink
    ) {
        const instagram =
            String(
                profile.instagram || ""
            ).trim();

        if (instagram) {
            businessElements
                .instagramLink
                .href =
                    instagram.startsWith(
                        "http"
                    )
                        ? instagram
                        : `https://instagram.com/${instagram.replace(
                            /^@/,
                            ""
                        )}`;

            businessElements
                .instagramLink
                .hidden = false;
        } else {
            businessElements
                .instagramLink
                .hidden = true;
        }
    }
}


function renderBusinessServices(
    services
) {
    if (
        !businessElements.servicesGrid
    ) {
        return;
    }

    const list =
        Array.isArray(services)
            ? services
            : [];

    businessElements
        .servicesGrid
        .innerHTML = "";

    if (list.length === 0) {
        const empty =
            document.createElement(
                "p"
            );

        empty.id =
            "businessServicesEmpty";

        empty.textContent =
            "Послуги ще не додано.";

        businessElements
            .servicesGrid
            .appendChild(
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
                "upholstery-service-card";

            const title =
                typeof service ===
                "string"
                    ? service
                    : service?.name ||
                      service?.title ||
                      "Послуга";

            card.innerHTML = `
                <span>🔧</span>

                <h3>
                    ${escapeBusinessHtml(
                        title
                    )}
                </h3>
            `;

            businessElements
                .servicesGrid
                .appendChild(
                    card
                );
        }
    );
}


function renderBusinessGallery(
    photos
) {
    if (!businessElements.gallery) {
        return;
    }

    const list =
        Array.isArray(photos)
            ? photos
            : [];

    businessElements
        .gallery
        .innerHTML = "";

    if (list.length === 0) {
        const empty =
            document.createElement(
                "p"
            );

        empty.id =
            "businessGalleryEmpty";

        empty.textContent =
            "Фото робіт ще не додано.";

        businessElements
            .gallery
            .appendChild(
                empty
            );

        return;
    }

    list.forEach(
        (photo) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "royal-auto-car-card";

            const photoBox =
                document.createElement(
                    "div"
                );

            photoBox.className =
                "royal-auto-car-photo";

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

            photoBox.appendChild(
                image
            );

            card.appendChild(
                photoBox
            );

            businessElements
                .gallery
                .appendChild(
                    card
                );
        }
    );
}


function renderBusinessTypeFeatures(
    profile
) {
    const type =
        profile.businessTypeCode ||
        "";

    const isCarDealer =
        type === "car_dealer";

    if (businessElements.carsSection) {
        businessElements
            .carsSection
            .hidden =
                !isCarDealer;
    }

    const addListingButton =
        document.getElementById(
            "businessAddListingButton"
        );

    if (addListingButton) {
        addListingButton.hidden =
            !isCarDealer;
    }

    if (isCarDealer) {
        loadBusinessCars(
            profile.ownerId
        );
    }
}


async function loadBusinessCars(
    ownerId
) {
    if (
        !businessElements.carsGrid ||
        !ownerId
    ) {
        return;
    }

    try {
        if (
            businessElements.carsLoading
        ) {
            businessElements
                .carsLoading
                .hidden = false;
        }

        if (
            businessElements.carsEmpty
        ) {
            businessElements
                .carsEmpty
                .hidden = true;
        }

        businessElements
            .carsGrid
            .innerHTML = "";

        const response =
            await fetch(
                "/api/market/listings"
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити автомобілі."
            );
        }

        const listings =
            Array.isArray(
                data.listings
            )
                ? data.listings
                : [];

        const businessListings =
            listings.filter(
                (listing) =>
                    String(
                        listing.ownerId ??
                        listing.owner_id
                    ) ===
                    String(ownerId)
            );

        if (
            businessElements.carsLoading
        ) {
            businessElements
                .carsLoading
                .hidden = true;
        }

        if (
            businessListings.length ===
            0
        ) {
            if (
                businessElements
                    .carsEmpty
            ) {
                businessElements
                    .carsEmpty
                    .hidden = false;
            }

            return;
        }

        businessListings.forEach(
            (listing) => {
                businessElements
                    .carsGrid
                    .appendChild(
                        createBusinessCarCard(
                            listing
                        )
                    );
            }
        );

    } catch (error) {
        console.error(
            "Business cars load error:",
            error
        );

        if (
            businessElements.carsLoading
        ) {
            businessElements
                .carsLoading
                .hidden = true;
        }
    }
}


function createBusinessCarCard(
    listing
) {
    const link =
        document.createElement(
            "a"
        );

    link.className =
        "royal-auto-car-card";

    link.href =
        `listing.html?id=${encodeURIComponent(
            listing.id
        )}`;

    const photos =
        Array.isArray(
            listing.photos
        )
            ? listing.photos
            : [];

    const activeIndex =
        Number(
            listing.activePhotoIndex ??
            listing.active_photo_index ??
            0
        );

    const photo =
        photos[activeIndex] ||
        photos[0] ||
        "";

    const photoBox =
        document.createElement(
            "div"
        );

    photoBox.className =
        "royal-auto-car-photo";

    if (photo) {
        const image =
            document.createElement(
                "img"
            );

        image.src =
            photo;

        image.alt =
            listing.name ||
            "Автомобіль";

        photoBox.appendChild(
            image
        );
    } else {
        photoBox.innerHTML = `
            <div class="royal-auto-car-placeholder">
                🚘
            </div>
        `;
    }

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "royal-auto-car-info";

    const price =
        Number(
            listing.priceUsd ??
            listing.price_usd
        );

    info.innerHTML = `
        <h3>
            ${escapeBusinessHtml(
                listing.name ||
                "Автомобіль"
            )}
            ${
                listing.year
                    ? escapeBusinessHtml(
                        String(
                            listing.year
                        )
                    )
                    : ""
            }
        </h3>

        <strong class="royal-auto-car-price">
            ${
                Number.isFinite(
                    price
                ) &&
                price > 0
                    ? `${new Intl.NumberFormat(
                        "uk-UA"
                    ).format(
                        price
                    )} $`
                    : "Ціна договірна"
            }
        </strong>

        <span class="royal-auto-car-more">
            Детальніше
        </span>
    `;

    link.append(
        photoBox,
        info
    );

    return link;
}


function escapeBusinessHtml(
    value
) {
    return String(
        value ?? ""
    )
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


async function loadBusinessProfile() {
    const token =
        getToken();

    if (!token) {
        window.location.href =
            "index.html";

        return;
    }

    try {
        const response =
            await fetch(
                "/api/business/profile",
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
                "Не вдалося завантажити бізнес-профіль."
            );
        }

        renderBusinessProfile(
            data.profile
        );

        if (
            businessElements.ownerPanel
        ) {
            businessElements
                .ownerPanel
                .hidden = false;
        }

        if (
            businessElements
                .logoUploadLabel
        ) {
            businessElements
                .logoUploadLabel
                .hidden = false;
        }

    } catch (error) {
        console.error(
            "Business profile load error:",
            error
        );

        alert(
            error.message
        );
    }
}


loadBusinessProfile();