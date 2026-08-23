const businessList =
    document.getElementById("businessList");

const businessListTitle =
    document.getElementById("businessListTitle");

const businessListDescription =
    document.getElementById("businessListDescription");

const businessListLoading =
    document.getElementById("businessListLoading");

const businessListEmpty =
    document.getElementById("businessListEmpty");

const businessListError =
    document.getElementById("businessListError");


async function loadBusinesses() {

    const params =
        new URLSearchParams(window.location.search);

    const type =
        String(params.get("type") || "").trim();


    if (!type) {

        if (businessListLoading) {
            businessListLoading.hidden = true;
        }

        if (businessListError) {
            businessListError.hidden = false;
        }

        if (businessListTitle) {
            businessListTitle.textContent =
                "Категорію не знайдено";
        }

        return;
    }


    try {

        const response =
            await fetch(
                `/api/businesses?type=${encodeURIComponent(type)}`
            );

        const data =
            await response.json();


        if (!response.ok || !data.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити бізнеси."
            );
        }


        const businesses =
            Array.isArray(data.businesses)
                ? data.businesses
                : [];


        if (businessListLoading) {
            businessListLoading.hidden = true;
        }


        if (businesses.length === 0) {

            if (businessListEmpty) {
                businessListEmpty.hidden = false;
            }

            if (businessListTitle) {
                businessListTitle.textContent =
                    "Бізнеси";
            }

            return;
        }


        const categoryName =
            businesses[0].businessTypeName ||
            "Бізнеси";


        if (businessListTitle) {
            businessListTitle.textContent =
                categoryName;
        }


        if (businessListDescription) {

            businessListDescription.textContent =
                `Активні бізнеси: ${businesses.length}`;
        }


        renderBusinesses(businesses);


    } catch (error) {

        console.error(
            "Business list load error:",
            error
        );


        if (businessListLoading) {
            businessListLoading.hidden = true;
        }


        if (businessListError) {
            businessListError.hidden = false;
        }


        if (businessListTitle) {
            businessListTitle.textContent =
                "Помилка завантаження";
        }
    }
}



function renderBusinesses(businesses) {

    if (!businessList) {
        return;
    }


    businessList.innerHTML = "";


    businesses.forEach((business) => {

        const card =
            document.createElement("a");


        card.className =
            "business-list-card";


            card.href =
            `business-profile.html?id=${encodeURIComponent(
                business.id
            )}`;


        /* LOGO */

        const logoBox =
            document.createElement("div");

        logoBox.className =
            "business-list-logo";


        if (business.logoUrl) {

            const image =
                document.createElement("img");

            image.src =
                business.logoUrl;

            image.alt =
                business.businessName || "Бізнес";

            logoBox.appendChild(image);

        } else {

            const icon =
                document.createElement("i");

            icon.className =
                "fa-solid fa-building";

            logoBox.appendChild(icon);
        }


        /* INFO */

        const info =
            document.createElement("div");

        info.className =
            "business-list-info";


        const title =
            document.createElement("h2");

        title.textContent =
            business.businessName ||
            "Бізнес";


        info.appendChild(title);


        if (business.city) {

            const location =
                document.createElement("p");

            location.className =
                "business-list-location";

            location.innerHTML =
                '<i class="fa-solid fa-location-dot"></i> ';

            const locationText =
                document.createElement("span");

            locationText.textContent =
                business.address
                    ? `${business.city}, ${business.address}`
                    : business.city;

            location.appendChild(locationText);

            info.appendChild(location);
        }


        if (business.description) {

            const description =
                document.createElement("p");

            description.className =
                "business-list-description";

            description.textContent =
                business.description;

            info.appendChild(description);
        }


        /* ARROW */

        const arrow =
            document.createElement("div");

        arrow.className =
            "business-list-arrow";

        arrow.innerHTML =
            '<i class="fa-solid fa-chevron-right"></i>';


        card.appendChild(logoBox);
        card.appendChild(info);
        card.appendChild(arrow);

        businessList.appendChild(card);
    });
}


loadBusinesses();