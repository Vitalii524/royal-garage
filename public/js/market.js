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

const listingPhotosCounter =
    document.getElementById("listingPhotosCounter");

const MAX_LISTING_PHOTOS = 20;

let selectedPhotoFiles = [];
let selectedMainPhotoIndex = 0;

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
    resetSelectedPhotos();
selectedCarPreview.hidden = true;
});

listingModal.addEventListener("click", (event) => {
    if (event.target === listingModal) {
        listingModal.style.display = "none";
        listingForm.reset();
        resetSelectedPhotos();
selectedCarPreview.hidden = true;
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

    const searchQuery =
    marketSearch.value.trim().toLowerCase();

const filteredListings = listings.filter((listing) => {
    const searchableText = `
        ${listing.name || ""}
        ${listing.year || ""}
        ${listing.city || ""}
        ${listing.vin || ""}
    `.toLowerCase();

    return searchableText.includes(searchQuery);
});

if (filteredListings.length === 0) {
        marketListings.innerHTML = `
            <p class="empty-market">
                Оголошень поки немає.
            </p>
        `;
        return;
    }

    const sortedListings = [...filteredListings];

if (marketSort.value === "price-low") {
    sortedListings.sort(
        (a, b) =>
            Number(a.priceUsd) -
            Number(b.priceUsd)
    );
} else if (marketSort.value === "price-high") {
    sortedListings.sort(
        (a, b) =>
            Number(b.priceUsd) -
            Number(a.priceUsd)
    );
} else {
    sortedListings.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );
}

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

marketSearch.addEventListener("input", () => {
    renderListings();
});

marketSort.addEventListener("change", () => {
    renderListings();
});

/* ===== ФОТО ОГОЛОШЕННЯ ===== */

function updatePhotosCounter() {
    listingPhotosCounter.textContent =
        `Вибрано: ${selectedPhotoFiles.length} / ${MAX_LISTING_PHOTOS}`;
}


function resetSelectedPhotos() {
    selectedPhotoFiles = [];
    selectedMainPhotoIndex = 0;

    listingPhotos.value = "";
    listingPhotosPreview.innerHTML = "";

    updatePhotosCounter();
}


function renderSelectedPhotos() {
    listingPhotosPreview.innerHTML = "";

    selectedPhotoFiles.forEach((file, index) => {
        const previewCard =
            document.createElement("div");

        previewCard.className =
            "listing-photo-preview-card";

        if (index === selectedMainPhotoIndex) {
            previewCard.classList.add("is-main");
        }

        const image =
            document.createElement("img");

        image.src = URL.createObjectURL(file);
        image.alt = `Фото ${index + 1}`;

        image.addEventListener(
            "load",
            () => {
                URL.revokeObjectURL(image.src);
            },
            { once: true }
        );

        const mainBadge =
            document.createElement("span");

        mainBadge.className =
            "listing-photo-main-badge";

        mainBadge.textContent =
            index === selectedMainPhotoIndex
                ? "Головне фото"
                : `Фото ${index + 1}`;

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.className =
            "listing-photo-remove";

        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Видалити фото ${index + 1}`
        );

        previewCard.addEventListener(
            "click",
            () => {
                selectedMainPhotoIndex = index;
                renderSelectedPhotos();
            }
        );

        removeButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                selectedPhotoFiles.splice(index, 1);

                if (
                    selectedMainPhotoIndex >=
                    selectedPhotoFiles.length
                ) {
                    selectedMainPhotoIndex =
                        Math.max(
                            0,
                            selectedPhotoFiles.length - 1
                        );
                } else if (
                    index < selectedMainPhotoIndex
                ) {
                    selectedMainPhotoIndex -= 1;
                }

                renderSelectedPhotos();
            }
        );

        previewCard.append(
            image,
            mainBadge,
            removeButton
        );

        listingPhotosPreview.appendChild(
            previewCard
        );
    });

    updatePhotosCounter();
}


listingPhotos.addEventListener(
    "change",
    () => {
        const newFiles =
            Array.from(listingPhotos.files || [])
                .filter((file) =>
                    file.type.startsWith("image/")
                );

        const freePlaces =
            MAX_LISTING_PHOTOS -
            selectedPhotoFiles.length;

        if (freePlaces <= 0) {
            alert(
                `Можна додати максимум ${MAX_LISTING_PHOTOS} фото.`
            );

            listingPhotos.value = "";
            return;
        }

        if (newFiles.length > freePlaces) {
            alert(
                `Можна додати ще лише ${freePlaces} фото.`
            );
        }

        selectedPhotoFiles.push(
            ...newFiles.slice(0, freePlaces)
        );

        listingPhotos.value = "";

        renderSelectedPhotos();
    }
);

updatePhotosCounter();

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

        if (selectedPhotoFiles.length === 0) {
            const garageHasPhotos =
                Array.isArray(car?.photos) &&
                car.photos.length > 0;
        
            if (!garageHasPhotos) {
                alert(
                    "Додай хоча б одну фотографію автомобіля."
                );
                return;
            }
        }
        
        let uploadedPhotos = [];
        
        try {
            uploadedPhotos =
                await readPhotosAsDataUrls(
                    selectedPhotoFiles
                );
        } catch (error) {
            console.error(
                "Не вдалося обробити фотографії:",
                error
            );
        
            alert(
                "Не вдалося обробити одну з фотографій."
            );
        
            return;
        }

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
        ? selectedMainPhotoIndex
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

    try {
        localStorage.setItem(
            MARKET_STORAGE_KEY,
            JSON.stringify(listings)
        );
    } catch (error) {
        console.error(
            "Не вдалося зберегти оголошення:",
            error
        );
    
        listings.pop();
    
        alert(
            "Фотографії займають забагато місця. " +
            "Спробуй додати менше фото."
        );
    
        return;
    }

    alert("Оголошення успішно опубліковано.");


listingModal.style.display = "none";
listingForm.reset();
resetSelectedPhotos();
selectedCarPreview.hidden = true;
powerValueField.hidden = true;
updatePricePreview();
renderListings();

    });

fillCarSelect();

renderListings();