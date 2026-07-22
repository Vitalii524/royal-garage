const currentUser = getCurrentUser();

if (!currentUser) {
    window.location.href = "index.html";
}

const openListingButton =
    document.getElementById("openListingButton");

const listingModal =
    document.getElementById("listingModal");

const closeListingModal =
    document.getElementById("closeListingModal");

const listingForm =
    document.getElementById("listingForm");

const listingCar =
    document.getElementById("listingCar");

const marketSearch =
    document.getElementById("marketSearch");

const marketSort =
    document.getElementById("marketSort");

const marketListings =
    document.getElementById("marketListings");

const CARS_STORAGE_KEY =
    `royalGarageCars_${currentUser.id}`;

const MARKET_STORAGE_KEY =
    "royalGarageMarketListings";

const listingYear =
    document.getElementById("listingYear");

const listingVin =
    document.getElementById("listingVin");

    const listingName =
    document.getElementById("listingName");

const listingPhotos =
    document.getElementById("listingPhotos");

const listingPhotosPreview =
    document.getElementById("listingPhotosPreview");

let cars = JSON.parse(
    localStorage.getItem(CARS_STORAGE_KEY)
) || [];

let listings = JSON.parse(
    localStorage.getItem(MARKET_STORAGE_KEY)
) || [];

function fillCarSelect() {
    listingCar.innerHTML = `
        <option value="">
            Обери автомобіль
        </option>
    `;

    cars.forEach((car) => {
        const option = document.createElement("option");

        option.value = car.id;
        option.textContent =
            `${car.name} (${car.year})`;

        listingCar.appendChild(option);
    });
}

openListingButton.addEventListener("click", () => {
    fillCarSelect();
    listingModal.style.display = "flex";
});

closeListingModal.addEventListener("click", () => {
    listingModal.style.display = "none";
    listingForm.reset();
});

listingModal.addEventListener("click", (event) => {
    if (event.target === listingModal) {
        listingModal.style.display = "none";
        listingForm.reset();
    }
});

const selectedCarPreview =
    document.getElementById("selectedCarPreview");

const selectedCarPhoto =
    document.getElementById("selectedCarPhoto");

const selectedCarName =
    document.getElementById("selectedCarName");

const selectedCarDetails =
    document.getElementById("selectedCarDetails");

const selectedCarVin =
    document.getElementById("selectedCarVin");

const listingMileage =
    document.getElementById("listingMileage");

listingCar.addEventListener("change", () => {
    const car = cars.find(
        (item) => item.id === listingCar.value
    );

    if (!car) {
        selectedCarPreview.hidden = true;
        return;
    }

    listingVin.value = car.vin || "";
    listingMileage.value = car.mileage || 0;
    listingYear.value = car.year || "";
    listingFuel.value = car.fuel || "";
    listingTransmission.value = car.transmission || "";
    listingBody.value = car.body || "";
    listingDrive.value = car.drive || "";

listingFuel.dispatchEvent(new Event("change"));

    selectedCarName.textContent = car.name;

    selectedCarDetails.textContent =
        `${car.year} рік • ${car.mileage} км • ${car.engine}`;

    selectedCarVin.textContent =
        `VIN: ${car.vin || "не вказано"}`;

    selectedCarPhoto.src =
        car.photo || "";

    selectedCarPhoto.hidden = !car.photo;
    selectedCarPreview.hidden = false;
});

const listingPrice =
    document.getElementById("listingPrice");

const pricePreview =
    document.getElementById("pricePreview");

let usdRate = null;

async function loadUsdRate() {
    try {
        const response = await fetch(
            "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json"
        );

        if (!response.ok) {
            throw new Error("Не вдалося отримати курс");
        }

        const data = await response.json();
        usdRate = data[0]?.rate || null;

        updatePricePreview();
    } catch (error) {
        console.error("Помилка курсу валют:", error);

        pricePreview.textContent =
            "Курс долара тимчасово недоступний";
    }
}

function updatePricePreview() {
    const dollars = Number(listingPrice.value);

    if (!dollars) {
        pricePreview.textContent =
            "Еквівалент у гривнях: 0 грн";
        return;
    }

    if (!usdRate) {
        pricePreview.textContent =
            "Завантаження курсу долара...";
        return;
    }

    const hryvnias = Math.round(
        dollars * usdRate
    );

    pricePreview.textContent =
        `${dollars.toLocaleString("uk-UA")} $ ≈ ` +
        `${hryvnias.toLocaleString("uk-UA")} грн`;
}

listingPrice.addEventListener(
    "input",
    updatePricePreview
);

loadUsdRate();

const listingFuel =
    document.getElementById("listingFuel");

const powerValueField =
    document.getElementById("powerValueField");

const powerValueLabel =
    document.getElementById("powerValueLabel");

const listingPowerValue =
    document.getElementById("listingPowerValue");

function updatePowerValueField() {
    const fuel = listingFuel.value;

    const car = cars.find(
        (item) => item.id === listingCar.value
    );

    if (!fuel) {
        powerValueField.hidden = true;
        listingPowerValue.required = false;
        listingPowerValue.value = "";
        return;
    }

    powerValueField.hidden = false;
    listingPowerValue.required = true;

    if (fuel === "Електро") {
        powerValueLabel.textContent =
            "Ємність батареї, кВт·год";

        listingPowerValue.placeholder =
            "Наприклад, 64";

        listingPowerValue.min = "1";
        listingPowerValue.max = "300";

        listingPowerValue.value =
            car?.batteryCapacity || "";
    } else {
        powerValueLabel.textContent =
            "Об’єм двигуна, л";

        listingPowerValue.placeholder =
            "Наприклад, 1.6";

        listingPowerValue.min = "0.1";
        listingPowerValue.max = "20";

        const engineText = String(
            car?.engine || ""
        ).replace(",", ".");

        const engineVolume = engineText.match(
            /\d+(\.\d+)?/
        );

        listingPowerValue.value =
            car?.engineVolume ||
            engineVolume?.[0] ||
            "";
    }
}

listingFuel.addEventListener(
    "change",
    updatePowerValueField
);

listingCar.addEventListener(
    "change",
    updatePowerValueField
);

function renderListings() {
    marketListings.innerHTML = "";

    if (listings.length === 0) {
        marketListings.innerHTML = `
            <p class="empty-market">
                Оголошень поки немає.
            </p>
        `;
        return;
    }

    const sortedListings = [...listings].sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );

    sortedListings.forEach((listing) => {
        const card = document.createElement("article");
        card.className = "market-card";

        const listingCar = cars.find(
            (car) => car.id === listing.carId
        );

        const photos = Array.isArray(listing.photos)
        ? listing.photos
        : listing.photo
            ? [listing.photo]
            : [];
    
            const mainPhotoIndex =
            Number.isInteger(listing.activePhotoIndex)
                ? listing.activePhotoIndex
                : 0;
        
        const photo =
            photos[mainPhotoIndex] ||
            photos[0] ||
            "";

        card.innerHTML = `
            ${
                photo
                    ? `<img
                        class="market-card-photo"
                        src="${photo}"
                        alt="${listing.name}"
                    >`
                    : `<div class="market-card-no-photo">
                        🚗
                    </div>`
            }

            <div class="market-card-content">
                <h2>
                    ${listing.name} (${listing.year})
                </h2>

                <p class="market-card-price">
                    ${listing.priceUsd.toLocaleString("uk-UA")} $
                    ${
                        listing.priceUah
                            ? `≈ ${listing.priceUah.toLocaleString("uk-UA")} грн`
                            : ""
                    }
                </p>

                <p>
                    ${listing.mileage.toLocaleString("uk-UA")} км •
                    ${listing.fuel} •
                    ${listing.transmission}
                </p>

                <p>
                    ${listing.body} • ${listing.drive}
                </p>

                <p>📍 ${listing.city}</p>

                <p class="market-card-description">
                    ${listing.description}
                </p>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `listing.html?id=${encodeURIComponent(listing.id)}`;
        });

        marketListings.appendChild(card);
    });
}

function compressPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const maxSize = 1000;

                let width = image.width;
                let height = image.height;

                if (width > height && width > maxSize) {
                    height = Math.round(
                        height * maxSize / width
                    );
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round(
                        width * maxSize / height
                    );
                    height = maxSize;
                }

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context =
                    canvas.getContext("2d");

                if (!context) {
                    reject(
                        new Error(
                            "Не вдалося обробити фото."
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
                        0.7
                    )
                );
            };

            image.onerror = () => {
                reject(
                    new Error(
                        `Не вдалося відкрити фото: ${file.name}`
                    )
                );
            };

            image.src = reader.result;
        };

        reader.onerror = () => {
            reject(
                new Error(
                    `Не вдалося прочитати файл: ${file.name}`
                )
            );
        };

        reader.readAsDataURL(file);
    });
}

function readPhotosAsDataUrls(fileList) {
    const files = Array.from(fileList || []);

    return Promise.all(
        files.map((file) => compressPhoto(file))
    );
}

listingForm.addEventListener("submit",async (event) => {
    event.preventDefault();

    const car = cars.find(
        (item) => item.id === listingCar.value
    );


 const name =
    listingName.value.trim() || car?.name || "";

const year =
    Number(listingYear.value) ||
    Number(car?.year) ||
    0;

const vin =
    listingVin.value.trim().toUpperCase() ||
    car?.vin ||
    "";

if (!name) {
    alert("Введи назву автомобіля.");
    return;
}

if (!year) {
    alert("Вкажи рік випуску.");
    return;
}
    const priceUsd = Number(listingPrice.value);
    const priceUah = usdRate
        ? Math.round(priceUsd * usdRate)
        : null;

        const uploadedPhotos =
    await readPhotosAsDataUrls(listingPhotos.files);

const garagePhotos =
    Array.isArray(car?.photos)
        ? car.photos
        : [];

const photos =
    uploadedPhotos.length > 0
        ? uploadedPhotos
        : garagePhotos;

    const newListing = {
        id: Date.now().toString(),
        ownerId: currentUser.id,
        carId: car?.id || null,
        
        name: name,
        year: year,
        vin: vin,
        photos: photos,
        activePhotoIndex:
    uploadedPhotos.length > 0
        ? 0
        : Number.isInteger(car?.activePhotoIndex)
            ? car.activePhotoIndex
            : 0,
        engine: car?.engine || "",
        mileage: Number(listingMileage.value),

        fuel: listingFuel.value,

        powerType:
            listingFuel.value === "Електро"
                ? "battery"
                : "engine",

        powerValue: Number(
            listingPowerValue.value
        ),

        transmission: document
            .getElementById("listingTransmission")
            .value,

        body: document
            .getElementById("listingBody")
            .value,

        drive: document
            .getElementById("listingDrive")
            .value,

        priceUsd,
        priceUah,

        city: document
            .getElementById("listingCity")
            .value
            .trim(),

        phone: document
            .getElementById("listingPhone")
            .value
            .trim(),

        description: document
            .getElementById("listingDescription")
            .value
            .trim(),

        createdAt: new Date().toISOString()
    };

    listings.push(newListing);

    localStorage.setItem(
        MARKET_STORAGE_KEY,
        JSON.stringify(listings)
    );

    alert("Оголошення успішно опубліковано.");


listingModal.style.display = "none";
listingForm.reset();
selectedCarPreview.hidden = true;
powerValueField.hidden = true;
updatePricePreview();
renderListings();

    });

fillCarSelect();

renderListings();