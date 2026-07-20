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
    if (cars.length === 0) {
        alert(
            "Спочатку додай автомобіль у свій гараж."
        );
        return;
    }

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

    listingMileage.value = car.mileage || 0;

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

listingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const car = cars.find(
        (item) => item.id === listingCar.value
    );

    if (!car) {
        alert("Обери автомобіль.");
        return;
    }

    const priceUsd = Number(listingPrice.value);
    const priceUah = usdRate
        ? Math.round(priceUsd * usdRate)
        : null;

    const newListing = {
        id: Date.now().toString(),
        ownerId: currentUser.id,
        carId: car.id,

        name: car.name,
        year: car.year,
        vin: car.vin || "",
        engine: car.engine || "",
        mileage: Number(listingMileage.value),

        photos: Array.isArray(car.photos)
            ? car.photos
            : car.photo
                ? [car.photo]
                : [],

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
});

fillCarSelect();