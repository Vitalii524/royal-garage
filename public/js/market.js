"use strict";


/* =====================================================
   КОРИСТУВАЧ
===================================================== */

const currentUser =
    typeof getCurrentUser === "function"
        ? getCurrentUser()
        : null;


if (!currentUser) {
    window.location.href = "index.html";
}


/* =====================================================
   ОСНОВНІ ЕЛЕМЕНТИ СТОРІНКИ
===================================================== */

const openListingButton =
    document.getElementById(
        "openListingButton"
    );


const listingModal =
    document.getElementById(
        "listingModal"
    );


const closeListingModal =
    document.getElementById(
        "closeListingModal"
    );


const listingForm =
    document.getElementById(
        "listingForm"
    );


const listingCar =
    document.getElementById(
        "listingCar"
    );


const marketSearch =
    document.getElementById(
        "marketSearch"
    );


const marketSort =
    document.getElementById(
        "marketSort"
    );


const marketListings =
    document.getElementById(
        "marketListings"
    );


/* =====================================================
   ПОЛЯ ФОРМИ
===================================================== */

const listingName =
    document.getElementById(
        "listingName"
    );

    const listingBrand =
    document.getElementById(
        "listingBrand"
    );


const listingModel =
    document.getElementById(
        "listingModel"
    );


const listingYear =
    document.getElementById(
        "listingYear"
    );


const listingVin =
    document.getElementById(
        "listingVin"
    );


const listingMileage =
    document.getElementById(
        "listingMileage"
    );


const listingFuel =
    document.getElementById(
        "listingFuel"
    );


const listingTransmission =
    document.getElementById(
        "listingTransmission"
    );


const listingBody =
    document.getElementById(
        "listingBody"
    );


const listingDrive =
    document.getElementById(
        "listingDrive"
    );


const listingPowerValue =
    document.getElementById(
        "listingPowerValue"
    );


const listingPrice =
    document.getElementById(
        "listingPrice"
    );


const listingCity =
    document.getElementById(
        "listingCity"
    );


const listingPhone =
    document.getElementById(
        "listingPhone"
    );


const listingDescription =
    document.getElementById(
        "listingDescription"
    );


const listingPhotos =
    document.getElementById(
        "listingPhotos"
    );


const listingPhotosPreview =
    document.getElementById(
        "listingPhotosPreview"
    );


const listingPhotosCounter =
    document.getElementById(
        "listingPhotosCounter"
    );


const pricePreview =
    document.getElementById(
        "pricePreview"
    );


const powerValueField =
    document.getElementById(
        "powerValueField"
    );


const powerValueLabel =
    document.getElementById(
        "powerValueLabel"
    );


/* =====================================================
   ПЕРЕГЛЯД ОБРАНОГО АВТОМОБІЛЯ
===================================================== */

const selectedCarPreview =
    document.getElementById(
        "selectedCarPreview"
    );


const selectedCarPhoto =
    document.getElementById(
        "selectedCarPhoto"
    );


const selectedCarName =
    document.getElementById(
        "selectedCarName"
    );


const selectedCarDetails =
    document.getElementById(
        "selectedCarDetails"
    );


const selectedCarVin =
    document.getElementById(
        "selectedCarVin"
    );

    /* =====================================================
   МАРКИ ТА МОДЕЛІ АВТОМОБІЛІВ
===================================================== */

const CAR_BRANDS_MODELS = {
        BMW: [
            "114", "116", "118", "120", "123", "125", "128", "130", "135", "140",
            "216", "218", "220", "225", "228", "230", "235", "240",
            "315", "316", "318", "320", "323", "325", "328", "330", "335", "340",
            "418", "420", "425", "428", "430", "435", "440",
            "518", "520", "523", "524", "525", "528", "530", "535", "540", "545", "550",
            "620", "628", "630", "633", "635", "640", "645", "650",
            "725", "728", "730", "735", "740", "745", "750", "760",
            "840", "850",
            "X1", "X2", "X3", "X4", "X5", "X6", "X7",
            "Z3", "Z4",
            "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2",
            "M2", "M3", "M4", "M5", "M6", "M8",
            "X3 M", "X4 M", "X5 M", "X6 M"
        ],
    
        "Mercedes-Benz": [
            "A140", "A150", "A160", "A170", "A180", "A200", "A220", "A250", "A35 AMG", "A45 AMG",
            "B150", "B160", "B170", "B180", "B200", "B220", "B250",
            "C180", "C200", "C220", "C230", "C240", "C250", "C270", "C280", "C300", "C320", "C350",
            "C43 AMG", "C55 AMG", "C63 AMG",
            "E200", "E220", "E230", "E240", "E250", "E270", "E280", "E300", "E320", "E350", "E400", "E420", "E430", "E500",
            "E43 AMG", "E53 AMG", "E55 AMG", "E63 AMG",
            "S280", "S300", "S320", "S350", "S400", "S420", "S430", "S450", "S500", "S550", "S600",
            "S63 AMG", "S65 AMG",
            "CLA", "CLS",
            "GLA", "GLB", "GLC", "GLE", "GL", "GLS",
            "ML", "G-Class",
            "Vito", "Viano", "V-Class",
            "Sprinter",
            "SL", "SLK", "SLC",
            "EQC", "EQA", "EQB", "EQE", "EQS"
        ],
    
        Audi: [
            "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
            "S1", "S3", "S4", "S5", "S6", "S7", "S8",
            "RS3", "RS4", "RS5", "RS6", "RS7",
            "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8",
            "SQ5", "SQ7", "SQ8",
            "RS Q3", "RS Q8",
            "TT", "TTS", "TT RS",
            "R8",
            "e-tron", "e-tron GT"
        ],
    
        Volkswagen: [
            "Golf",
            "Golf GTI",
            "Golf R",
            "Passat",
            "Passat CC",
            "Arteon",
            "Jetta",
            "Bora",
            "Polo",
            "Vento",
            "Phaeton",
            "Beetle",
            "Scirocco",
            "Touran",
            "Sharan",
            "Tiguan",
            "Touareg",
            "T-Roc",
            "T-Cross",
            "Taigo",
            "Caddy",
            "Transporter",
            "Caravelle",
            "Multivan",
            "Crafter",
            "Amarok",
            "ID.3",
            "ID.4",
            "ID.5",
            "ID.7",
            "ID.Buzz"
        ],
    
        Skoda: [
            "Fabia",
            "Octavia",
            "Superb",
            "Rapid",
            "Scala",
            "Roomster",
            "Yeti",
            "Kamiq",
            "Karoq",
            "Kodiaq",
            "Enyaq"
        ],
    
        Peugeot: [
            "106", "107", "108",
            "205", "206", "207", "208",
            "301", "306", "307", "308",
            "405", "406", "407", "408",
            "508",
            "605", "607",
            "2008", "3008", "4007", "4008", "5008",
            "Partner",
            "Expert",
            "Boxer",
            "RCZ",
            "Rifter"
        ],
    
        Renault: [
            "Clio",
            "Megane",
            "Laguna",
            "Talisman",
            "Fluence",
            "Symbol",
            "Scenic",
            "Grand Scenic",
            "Espace",
            "Captur",
            "Kadjar",
            "Koleos",
            "Austral",
            "Arkana",
            "Duster",
            "Kangoo",
            "Trafic",
            "Master",
            "Zoe"
        ],
    
        Toyota: [
            "Aygo",
            "Yaris",
            "Corolla",
            "Auris",
            "Avensis",
            "Camry",
            "Prius",
            "C-HR",
            "RAV4",
            "Highlander",
            "Land Cruiser",
            "Land Cruiser Prado",
            "Hilux",
            "Fortuner",
            "Supra",
            "GT86",
            "Celica",
            "Sienna",
            "Proace",
            "bZ4X"
        ],
    
        Ford: [
            "Ka",
            "Fiesta",
            "Focus",
            "Mondeo",
            "Fusion",
            "Taurus",
            "Mustang",
            "Puma",
            "EcoSport",
            "Kuga",
            "Edge",
            "Explorer",
            "Ranger",
            "Maverick",
            "Transit",
            "Transit Connect",
            "Tourneo Connect",
            "Tourneo Custom"
        ],
    
        Opel: [
            "Adam",
            "Corsa",
            "Astra",
            "Vectra",
            "Insignia",
            "Omega",
            "Meriva",
            "Zafira",
            "Mokka",
            "Crossland",
            "Grandland",
            "Antara",
            "Combo",
            "Vivaro",
            "Movano"
        ],
    
        Nissan: [
            "Micra",
            "Almera",
            "Note",
            "Tiida",
            "Sentra",
            "Primera",
            "Maxima",
            "Juke",
            "Qashqai",
            "X-Trail",
            "Murano",
            "Pathfinder",
            "Patrol",
            "Navara",
            "350Z",
            "370Z",
            "GT-R",
            "Leaf"
        ],
    
        Honda: [
            "Jazz",
            "Civic",
            "Accord",
            "Legend",
            "CR-Z",
            "HR-V",
            "CR-V",
            "Pilot",
            "Prelude",
            "Integra",
            "S2000",
            "e"
        ],
    
        Mazda: [
            "2",
            "3",
            "5",
            "6",
            "CX-3",
            "CX-30",
            "CX-5",
            "CX-60",
            "CX-7",
            "CX-9",
            "MX-5",
            "RX-7",
            "RX-8"
        ],
    
        Volvo: [
            "C30",
            "C70",
            "S40",
            "S60",
            "S70",
            "S80",
            "S90",
            "V40",
            "V50",
            "V60",
            "V70",
            "V90",
            "XC40",
            "XC60",
            "XC70",
            "XC90",
            "EX30",
            "EX90"
        ],
    
        Hyundai: [
            "i10",
            "i20",
            "i30",
            "i40",
            "Accent",
            "Elantra",
            "Sonata",
            "Veloster",
            "Bayon",
            "Kona",
            "Tucson",
            "Santa Fe",
            "Palisade",
            "Staria",
            "Ioniq",
            "Ioniq 5",
            "Ioniq 6"
        ],
    
        Kia: [
            "Picanto",
            "Rio",
            "Ceed",
            "ProCeed",
            "Cerato",
            "Optima",
            "K5",
            "Stinger",
            "Stonic",
            "Niro",
            "Soul",
            "Sportage",
            "Sorento",
            "Carnival",
            "EV3",
            "EV6",
            "EV9"
        ],
    
        Lexus: [
            "CT",
            "IS",
            "ES",
            "GS",
            "LS",
            "RC",
            "LC",
            "UX",
            "NX",
            "RX",
            "GX",
            "LX",
            "RZ"
        ],
    
        Porsche: [
            "911",
            "718 Boxster",
            "718 Cayman",
            "Boxster",
            "Cayman",
            "Panamera",
            "Macan",
            "Cayenne",
            "Taycan"
        ]
    };


function fillBrandSelect() {
    if (!listingBrand) {
        return;
    }

    listingBrand.innerHTML = `
        <option value="">
            Обери марку
        </option>
    `;


    Object.keys(
        CAR_BRANDS_MODELS
    ).forEach(
        (brand) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                brand;

            option.textContent =
                brand;

            listingBrand.appendChild(
                option
            );
        }
    );
}


function fillModelSelect(
    brand,
    selectedModel = ""
) {
    if (!listingModel) {
        return;
    }


    listingModel.innerHTML = "";


    if (
        !brand ||
        !CAR_BRANDS_MODELS[brand]
    ) {
        listingModel.innerHTML = `
            <option value="">
                Спочатку обери марку
            </option>
        `;

        listingModel.disabled =
            true;

        return;
    }


    listingModel.disabled =
        false;


    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "Обери модель";

    listingModel.appendChild(
        defaultOption
    );


    CAR_BRANDS_MODELS[
        brand
    ].forEach(
        (model) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                model;

            option.textContent =
                model;

            listingModel.appendChild(
                option
            );
        }
    );


    if (selectedModel) {
        listingModel.value =
            selectedModel;
    }
}


function updateListingNameFromBrandModel() {
    if (
        !listingName ||
        !listingBrand ||
        !listingModel
    ) {
        return;
    }


    const brand =
        listingBrand.value.trim();

    const model =
        listingModel.value.trim();


    listingName.value =
        [brand, model]
            .filter(Boolean)
            .join(" ");
}

function setBrandAndModelFromName(
    vehicleName
) {
    if (
        !listingBrand ||
        !listingModel
    ) {
        return;
    }

    const originalName =
        String(vehicleName || "")
            .trim();

    const name =
        originalName
            .replace(
                /\s*\(\d{4}\)\s*$/,
                ""
            )
            .trim();

    if (!name) {
        listingBrand.value = "";

        fillModelSelect("");

        if (listingName) {
            listingName.value = "";
        }

        return;
    }

    const brands =
        Object.keys(
            CAR_BRANDS_MODELS
        )
            .sort(
                (
                    firstBrand,
                    secondBrand
                ) =>
                    secondBrand.length -
                    firstBrand.length
            );

    const foundBrand =
        brands.find(
            (brand) =>
                name
                    .toLowerCase()
                    .startsWith(
                        brand.toLowerCase() +
                        " "
                    ) ||
                name.toLowerCase() ===
                    brand.toLowerCase()
        );

    if (!foundBrand) {
        listingBrand.value = "";

        fillModelSelect("");

        if (listingName) {
            listingName.value =
                name;
        }

        return;
    }

    const model =
        name
            .slice(
                foundBrand.length
            )
            .trim();

    listingBrand.value =
        foundBrand;

    fillModelSelect(
        foundBrand
    );

    if (model) {
        const modelExists =
            Array.from(
                listingModel.options
            ).some(
                (option) =>
                    option.value ===
                    model
            );

        if (!modelExists) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                model;

            option.textContent =
                model;

            listingModel.appendChild(
                option
            );
        }

        listingModel.value =
            model;
    }

    if (listingName) {
        listingName.value =
            [foundBrand, model]
                .filter(Boolean)
                .join(" ");
    }
}


if (listingBrand) {
    listingBrand.addEventListener(
        "change",
        () => {
            fillModelSelect(
                listingBrand.value
            );

            updateListingNameFromBrandModel();
        }
    );
}


if (listingModel) {
    listingModel.addEventListener(
        "change",
        updateListingNameFromBrandModel
    );
}

/* =====================================================
   LOCAL STORAGE
===================================================== */

async function getSellerRatingData(
    sellerId
) {
    const normalizedSellerId =
        String(
            sellerId || ""
        );

    if (!normalizedSellerId) {
        return {
            average: 0,
            count: 0
        };
    }

    if (
        sellerRatingsCache.has(
            normalizedSellerId
        )
    ) {
        return sellerRatingsCache.get(
            normalizedSellerId
        );
    }

    try {
        const response =
            await fetch(
                `/api/sellers/${
                    encodeURIComponent(
                        normalizedSellerId
                    )
                }/rating`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити рейтинг."
            );
        }

        const ratingData = {
            average:
                Number(
                    data.rating?.average ||
                    0
                ),

            count:
                Number(
                    data.rating?.count ||
                    0
                )
        };

        sellerRatingsCache.set(
            normalizedSellerId,
            ratingData
        );

        return ratingData;

    } catch (error) {
        console.error(
            "Market seller rating load error:",
            error
        );

        const fallback = {
            average: 0,
            count: 0
        };

        sellerRatingsCache.set(
            normalizedSellerId,
            fallback
        );

        return fallback;
    }
}

function getRatingCountLabel(
    count
) {
    const value =
        Number(count) || 0;

    const lastTwoDigits =
        value % 100;

    const lastDigit =
        value % 10;

    if (
        lastTwoDigits >= 11 &&
        lastTwoDigits <= 14
    ) {
        return `${value} оцінок`;
    }

    if (lastDigit === 1) {
        return `${value} оцінка`;
    }

    if (
        lastDigit >= 2 &&
        lastDigit <= 4
    ) {
        return `${value} оцінки`;
    }

    return `${value} оцінок`;
}

let favoriteListingIds = [];


async function loadFavoriteListingsFromServer() {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        favoriteListingIds = [];
        return;
    }

    try {
        const response =
            await fetch(
                "/api/market/favorites",
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
                "Не вдалося завантажити обране."
            );
        }

        favoriteListingIds =
            Array.isArray(
                data.favoriteIds
            )
                ? data.favoriteIds.map(
                    String
                )
                : [];

    } catch (error) {
        console.error(
            "Market favorites load error:",
            error
        );

        favoriteListingIds = [];
    }
}


function isFavoriteListing(listingId) {
    return favoriteListingIds.includes(
        String(listingId)
    );
}


async function toggleFavoriteListing(
    listingId
) {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        alert(
            "Спочатку увійдіть у профіль."
        );

        return;
    }

    const normalizedId =
        String(listingId);

    const isFavorite =
        favoriteListingIds.includes(
            normalizedId
        );

    try {
        const response =
            await fetch(
                `/api/market/favorites/${encodeURIComponent(
                    normalizedId
                )}`,
                {
                    method:
                        isFavorite
                            ? "DELETE"
                            : "POST",

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
                "Не вдалося змінити обране."
            );
        }

        if (isFavorite) {
            favoriteListingIds =
                favoriteListingIds.filter(
                    (id) =>
                        id !==
                        normalizedId
                );
        } else {
            favoriteListingIds.push(
                normalizedId
            );
        }

        renderListings();

    } catch (error) {
        console.error(
            "Market favorite toggle error:",
            error
        );

        alert(
            error.message ||
            "Не вдалося змінити обране."
        );
    }
}

let cars = [];


let listings = [];

const sellerRatingsCache =
    new Map();

async function loadMarketListings() {
    try {
        const response = await fetch(
            "/api/market/listings"
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити оголошення."
            );
        }

        listings =
            Array.isArray(data.listings)
                ? data.listings
                : [];

        renderListings();

    } catch (error) {
        console.error(
            "Market listings load request error:",
            error
        );

        listings = [];

        renderListings();
    }
}


async function loadGarageCarsForMarket() {
    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        cars = [];
        fillCarSelect();
        return;
    }

    try {
        const response =
            await fetch(
                "/api/garage/cars",
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
                "Не вдалося завантажити автомобілі."
            );
        }

        cars =
            Array.isArray(
                data.cars
            )
                ? data.cars
                : [];

        fillCarSelect();

    } catch (error) {
        console.error(
            "Market garage load error:",
            error
        );

        cars = [];
        fillCarSelect();
    }
}

loadGarageCarsForMarket();

/* =====================================================
   РЕЖИМ РЕДАГУВАННЯ
===================================================== */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const editListingId =
    urlParams.get("edit");


    let editingListing =
    editListingId
        ? listings.find(
            (listing) =>
                String(listing.id) ===
                String(editListingId)
        )
        : null;


let isEditMode =
    Boolean(editingListing);


/*
Кожна фотографія у масиві має вигляд:

Старе фото:
{
    type: "existing",
    src: "data:image/..."
}

Нове фото:
{
    type: "file",
    file: File
}
*/

const MAX_LISTING_PHOTOS = 20;


let selectedPhotos = [];


let selectedMainPhotoIndex = 0;


let usdRate = null;


/* =====================================================
   ДОПОМІЖНІ ФУНКЦІЇ
===================================================== */

function getListingSubmitButton() {
    return listingForm?.querySelector(
        'button[type="submit"]'
    );
}


function getListingModalTitle() {
    return listingModal?.querySelector(
        "h1, h2, .modal-title"
    );
}


function showListingModal() {
    if (!listingModal) {
        return;
    }


    listingModal.style.display =
        "flex";
}


function hideListingModal() {
    if (!listingModal) {
        return;
    }


    listingModal.style.display =
        "none";
}


function resetSelectedCarPreview() {
    if (selectedCarPreview) {
        selectedCarPreview.hidden =
            true;
    }


    if (selectedCarPhoto) {
        selectedCarPhoto.src = "";
        selectedCarPhoto.hidden =
            true;
    }


    if (selectedCarName) {
        selectedCarName.textContent =
            "";
    }


    if (selectedCarDetails) {
        selectedCarDetails.textContent =
            "";
    }


    if (selectedCarVin) {
        selectedCarVin.textContent =
            "";
    }
}


/* =====================================================
   СПИСОК АВТОМОБІЛІВ
===================================================== */

function fillCarSelect() {
    if (!listingCar) {
        return;
    }


    listingCar.innerHTML = `
        <option value="">
            Обери автомобіль
        </option>
    `;


    cars.forEach((car) => {
        const option =
            document.createElement(
                "option"
            );


        option.value =
            car.id;


        option.textContent =
            `${car.name} (${car.year})`;


        listingCar.appendChild(
            option
        );
    });
}


/* =====================================================
   ПЕРЕГЛЯД ОБРАНОГО АВТОМОБІЛЯ
===================================================== */

function showSelectedCarPreview(car) {
    if (!car) {
        resetSelectedCarPreview();

        return;
    }


    if (selectedCarName) {
        selectedCarName.textContent =
            car.name ||
            "Автомобіль";
    }


    if (selectedCarDetails) {
        const year =
            car.year ||
            "рік не вказано";


        const mileage =
            Number(
                car.mileage || 0
            ).toLocaleString(
                "uk-UA"
            );


        const engine =
            car.engine ||
            "двигун не вказано";


        selectedCarDetails.textContent =
            `${year} рік • ${mileage} км • ${engine}`;
    }


    if (selectedCarVin) {
        selectedCarVin.textContent =
            `VIN: ${
                car.vin ||
                "не вказано"
            }`;
    }


    if (selectedCarPhoto) {
        const carPhotos =
            Array.isArray(
                car.photos
            )
                ? car.photos
                : car.photo
                    ? [car.photo]
                    : [];


        const photoIndex =
            Number.isInteger(
                car.activePhotoIndex
            )
                ? car.activePhotoIndex
                : 0;


        const photo =
            carPhotos[photoIndex] ||
            carPhotos[0] ||
            "";


        selectedCarPhoto.src =
            photo;


        selectedCarPhoto.hidden =
            !photo;
    }


    if (selectedCarPreview) {
        selectedCarPreview.hidden =
            false;
    }
}


/* =====================================================
   ЗАПОВНЕННЯ ДАНИХ З ГАРАЖА
===================================================== */

function fillFieldsFromCar(car) {
    if (!car) {
        return;
    }


    if (listingName) {
        listingName.value =
            car.name || "";
    }
    
    
    setBrandAndModelFromName(
        car.name
    );


    if (listingVin) {
        listingVin.value =
            car.vin || "";
    }


    if (listingMileage) {
        listingMileage.value =
            car.mileage || 0;
    }


    if (listingYear) {
        listingYear.value =
            car.year || "";
    }


    if (listingFuel) {
        listingFuel.value =
            car.fuel || "";
    }


    if (listingTransmission) {
        listingTransmission.value =
            car.transmission || "";
    }


    if (listingBody) {
        listingBody.value =
            car.body || "";
    }


    if (listingDrive) {
        listingDrive.value =
            car.drive || "";
    }


    updatePowerValueField(
        car
    );


    showSelectedCarPreview(
        car
    );
}


/* =====================================================
   ЗМІНА ОБРАНОГО АВТОМОБІЛЯ
===================================================== */

if (listingCar) {
    listingCar.addEventListener(
        "change",
        () => {
            const car =
                cars.find(
                    (item) =>
                        String(item.id) ===
                        String(
                            listingCar.value
                        )
                );


            if (!car) {
                resetSelectedCarPreview();

                return;
            }


            fillFieldsFromCar(
                car
            );
        }
    );
}


/* =====================================================
   ПОЛЕ ДВИГУНА АБО БАТАРЕЇ
===================================================== */

function updatePowerValueField(
    providedCar = null
) {
    if (
        !listingFuel ||
        !powerValueField ||
        !listingPowerValue
    ) {
        return;
    }


    const fuel =
        listingFuel.value;


    const car =
        providedCar ||
        cars.find(
            (item) =>
                String(item.id) ===
                String(
                    listingCar?.value
                )
        );


    if (!fuel) {
        powerValueField.hidden =
            true;


        listingPowerValue.required =
            false;


        listingPowerValue.value =
            "";


        return;
    }


    powerValueField.hidden =
        false;


    listingPowerValue.required =
        true;


    if (fuel === "Електро") {
        if (powerValueLabel) {
            powerValueLabel.textContent =
                "Ємність батареї, кВт·год";
        }


        listingPowerValue.placeholder =
            "Наприклад, 64";


        listingPowerValue.min =
            "1";


        listingPowerValue.max =
            "300";


        if (
            !isEditMode ||
            !listingPowerValue.value
        ) {
            listingPowerValue.value =
                car?.batteryCapacity ||
                "";
        }
    } else {
        if (powerValueLabel) {
            powerValueLabel.textContent =
                "Об’єм двигуна, л";
        }


        listingPowerValue.placeholder =
            "Наприклад, 1.6";


        listingPowerValue.min =
            "0.1";


        listingPowerValue.max =
            "20";


        const engineText =
            String(
                car?.engine || ""
            ).replace(
                ",",
                "."
            );


        const engineVolume =
            engineText.match(
                /\d+(\.\d+)?/
            );


        if (
            !isEditMode ||
            !listingPowerValue.value
        ) {
            listingPowerValue.value =
                car?.engineVolume ||
                engineVolume?.[0] ||
                "";
        }
    }
}


if (listingFuel) {
    listingFuel.addEventListener(
        "change",
        () => {
            updatePowerValueField();
        }
    );
}


/* =====================================================
   КУРС ДОЛАРА
===================================================== */

async function loadUsdRate() {
    try {
        const response =
            await fetch(
                "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json"
            );


        if (!response.ok) {
            throw new Error(
                "Не вдалося отримати курс"
            );
        }


        const data =
            await response.json();


        usdRate =
            data[0]?.rate ||
            null;


        updatePricePreview();
    } catch (error) {
        console.error(
            "Помилка курсу валют:",
            error
        );


        if (pricePreview) {
            pricePreview.textContent =
                "Курс долара тимчасово недоступний";
        }
    }
}


function updatePricePreview() {
    if (
        !listingPrice ||
        !pricePreview
    ) {
        return;
    }


    const dollars =
        Number(
            listingPrice.value
        );


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


    const hryvnias =
        Math.round(
            dollars *
            usdRate
        );


    pricePreview.textContent =
        `${dollars.toLocaleString(
            "uk-UA"
        )} $ ≈ ` +
        `${hryvnias.toLocaleString(
            "uk-UA"
        )} грн`;
}


if (listingPrice) {
    listingPrice.addEventListener(
        "input",
        updatePricePreview
    );
}


/* =====================================================
   ФОТОГРАФІЇ
===================================================== */

function updatePhotosCounter() {
    if (!listingPhotosCounter) {
        return;
    }


    listingPhotosCounter.textContent =
        `Вибрано: ${selectedPhotos.length} / ${MAX_LISTING_PHOTOS}`;
}


function resetSelectedPhotos() {
    selectedPhotos = [];


    selectedMainPhotoIndex =
        0;


    if (listingPhotos) {
        listingPhotos.value =
            "";
    }


    if (listingPhotosPreview) {
        listingPhotosPreview.innerHTML =
            "";
    }


    updatePhotosCounter();
}


function getPhotoPreviewSource(
    photoItem
) {
    if (
        photoItem.type ===
        "existing"
    ) {
        return photoItem.src;
    }


    if (
        photoItem.type ===
        "file"
    ) {
        return URL.createObjectURL(
            photoItem.file
        );
    }


    return "";
}

function updatePhotoCount() {
    const photoCount =
        document.getElementById(
            "listingPhotosCounter"
        );

    if (!photoCount) {
        return;
    }

    photoCount.textContent =
        `Вибрано: ${selectedPhotos.length} / 20`;
}


function renderSelectedPhotos() {
    if (!listingPhotosPreview) {
        return;
    }


    listingPhotosPreview.innerHTML =
        "";


    selectedPhotos.forEach(
        (
            photoItem,
            index
        ) => {
            const previewCard =
                document.createElement(
                    "div"
                );


            previewCard.className =
                "listing-photo-preview-card";


            if (
                index ===
                selectedMainPhotoIndex
            ) {
                previewCard.classList.add(
                    "is-main"
                );
            }


            const image =
                document.createElement(
                    "img"
                );


            const previewSource =
                getPhotoPreviewSource(
                    photoItem
                );


            image.src =
                previewSource;


            image.alt =
                `Фото ${index + 1}`;


            if (
                photoItem.type ===
                "file"
            ) {
                image.addEventListener(
                    "load",
                    () => {
                        URL.revokeObjectURL(
                            previewSource
                        );
                    },
                    {
                        once: true
                    }
                );
            }


            const mainBadge =
                document.createElement(
                    "span"
                );


            mainBadge.className =
                "listing-photo-main-badge";


            mainBadge.textContent =
                index ===
                selectedMainPhotoIndex
                    ? "Головне фото"
                    : `Фото ${index + 1}`;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "listing-photo-remove";


            removeButton.textContent =
                "×";


            removeButton.setAttribute(
                "aria-label",
                `Видалити фото ${index + 1}`
            );


            previewCard.addEventListener(
                "click",
                () => {
                    selectedMainPhotoIndex =
                        index;


                    renderSelectedPhotos();
                }
            );


            removeButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();


                    selectedPhotos.splice(
                        index,
                        1
                    );

                    updatePhotoCount();

                    if (
                        selectedPhotos.length ===
                        0
                    ) {
                        selectedMainPhotoIndex =
                            0;
                    } else if (
                        selectedMainPhotoIndex >=
                        selectedPhotos.length
                    ) {
                        selectedMainPhotoIndex =
                            selectedPhotos.length -
                            1;
                    } else if (
                        index <
                        selectedMainPhotoIndex
                    ) {
                        selectedMainPhotoIndex -=
                            1;
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
        }
    );


    updatePhotosCounter();
}


if (listingPhotos) {
    listingPhotos.addEventListener(
        "change",
        () => {
            const newFiles =
                Array.from(
                    listingPhotos.files ||
                    []
                ).filter(
                    (file) =>
                        file.type.startsWith(
                            "image/"
                        )
                );


            const freePlaces =
                MAX_LISTING_PHOTOS -
                selectedPhotos.length;


            if (freePlaces <= 0) {
                alert(
                    `Можна додати максимум ${MAX_LISTING_PHOTOS} фото.`
                );


                listingPhotos.value =
                    "";


                return;
            }


            if (
                newFiles.length >
                freePlaces
            ) {
                alert(
                    `Можна додати ще лише ${freePlaces} фото.`
                );
            }


            const acceptedFiles =
                newFiles.slice(
                    0,
                    freePlaces
                );


            acceptedFiles.forEach(
                (file) => {
                    selectedPhotos.push({
                        type: "file",
                        file
                    });
                }
            );

            updatePhotoCount();

            listingPhotos.value =
                "";


            renderSelectedPhotos();
        }
    );
}


/* =====================================================
   СТИСНЕННЯ ФОТО
===================================================== */

function compressPhoto(file) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const reader =
                new FileReader();


            reader.onload =
                () => {
                    const image =
                        new Image();


                    image.onload =
                        () => {
                            const maxSize =
                                1000;


                            let width =
                                image.width;


                            let height =
                                image.height;


                            if (
                                width >
                                    height &&
                                width >
                                    maxSize
                            ) {
                                height =
                                    Math.round(
                                        height *
                                        maxSize /
                                        width
                                    );


                                width =
                                    maxSize;
                            } else if (
                                height >
                                maxSize
                            ) {
                                width =
                                    Math.round(
                                        width *
                                        maxSize /
                                        height
                                    );


                                height =
                                    maxSize;
                            }


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


                    image.onerror =
                        () => {
                            reject(
                                new Error(
                                    `Не вдалося відкрити фото: ${file.name}`
                                )
                            );
                        };


                    image.src =
                        reader.result;
                };


            reader.onerror =
                () => {
                    reject(
                        new Error(
                            `Не вдалося прочитати файл: ${file.name}`
                        )
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


async function prepareSelectedPhotos() {
    const preparedPhotos = [];


    for (
        const photoItem of
        selectedPhotos
    ) {
        if (
            photoItem.type ===
            "existing"
        ) {
            preparedPhotos.push(
                photoItem.src
            );


            continue;
        }


        if (
            photoItem.type ===
            "file"
        ) {
            const compressedPhoto =
                await compressPhoto(
                    photoItem.file
                );


            preparedPhotos.push(
                compressedPhoto
            );
        }
    }


    return preparedPhotos;
}

/* =====================================================
   ЗАПОВНЕННЯ ФОРМИ ПІД ЧАС РЕДАГУВАННЯ
===================================================== */

function fillEditForm(listing) {
    if (!listing) {
        return;
    }


    if (listingCar) {
        listingCar.value =
            listing.carId || "";
    }


    if (listingName) {
        listingName.value =
            listing.name || "";
    }
    
    
    setBrandAndModelFromName(
        listing.name
    );


    if (listingYear) {
        listingYear.value =
            listing.year || "";
    }


    if (listingVin) {
        listingVin.value =
            listing.vin || "";
    }


    if (listingMileage) {
        listingMileage.value =
            listing.mileage || 0;
    }


    if (listingFuel) {
        listingFuel.value =
            listing.fuel || "";
    }


    if (listingTransmission) {
        listingTransmission.value =
            listing.transmission || "";
    }


    if (listingBody) {
        listingBody.value =
            listing.body || "";
    }


    if (listingDrive) {
        listingDrive.value =
            listing.drive || "";
    }


    if (listingPowerValue) {
        listingPowerValue.value =
            listing.powerValue || "";
    }


    if (listingPrice) {
        listingPrice.value =
            listing.priceUsd || "";
    }


    if (listingCity) {
        listingCity.value =
            listing.city || "";
    }


    if (listingPhone) {
        listingPhone.value =
            listing.phone || "";
    }


    if (listingDescription) {
        listingDescription.value =
            listing.description || "";
    }


    const existingPhotos =
        Array.isArray(listing.photos)
            ? listing.photos
            : listing.photo
                ? [listing.photo]
                : [];


    selectedPhotos =
        existingPhotos.map(
            (photo) => ({
                type: "existing",
                src: photo
            })
        );


    selectedMainPhotoIndex =
        Number.isInteger(
            listing.activePhotoIndex
        )
            ? Math.min(
                Math.max(
                    listing.activePhotoIndex,
                    0
                ),
                Math.max(
                    selectedPhotos.length - 1,
                    0
                )
            )
            : 0;


    const car =
        cars.find(
            (item) =>
                String(item.id) ===
                String(listing.carId)
        );


    if (car) {
        showSelectedCarPreview(car);
    } else {
        resetSelectedCarPreview();
    }


    updatePowerValueField(car);


    renderSelectedPhotos();


    updatePricePreview();


    const submitButton =
        getListingSubmitButton();


    if (submitButton) {
        submitButton.textContent =
            "Зберегти зміни";
    }


    const modalTitle =
        getListingModalTitle();


    if (modalTitle) {
        modalTitle.textContent =
            "Редагування оголошення";
    }
}


/* =====================================================
   СКИДАННЯ ФОРМИ
===================================================== */

function resetListingForm() {
    if (listingForm) {
        listingForm.reset();
    }

    if (listingBrand) {
        listingBrand.value = "";
    }
    
    fillModelSelect("");
    
    if (listingName) {
        listingName.value = "";
    }


    resetSelectedPhotos();


    resetSelectedCarPreview();


    if (powerValueField) {
        powerValueField.hidden =
            true;
    }


    if (listingPowerValue) {
        listingPowerValue.required =
            false;
    }


    const submitButton =
        getListingSubmitButton();


    if (submitButton) {
        submitButton.textContent =
            "Опублікувати оголошення";
    }


    const modalTitle =
        getListingModalTitle();


    if (modalTitle) {
        modalTitle.textContent =
            "Створення оголошення";
    }


    updatePricePreview();
}


/* =====================================================
   ЗАКРИТТЯ МОДАЛЬНОГО ВІКНА
===================================================== */

function closeListingFormModal() {
    hideListingModal();


    resetListingForm();


    if (isEditMode) {
        window.location.href =
            "market.html";
    }
}


/* =====================================================
   ВІДКРИТТЯ ФОРМИ НОВОГО ОГОЛОШЕННЯ
===================================================== */

if (openListingButton) {
    openListingButton.addEventListener(
        "click",
        () => {
            resetListingForm();

            fillBrandSelect();

            fillCarSelect();

            showListingModal();
        }
    );
}




/* =====================================================
   КНОПКА ЗАКРИТТЯ
===================================================== */

if (closeListingModal) {
    closeListingModal.addEventListener(
        "click",
        closeListingFormModal
    );
}


/* =====================================================
   ЗАКРИТТЯ ПРИ НАТИСКАННІ НА ФОН
===================================================== */

if (listingModal) {
    listingModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                listingModal
            ) {
                closeListingFormModal();
            }
        }
    );
}


/* =====================================================
   ЗАКРИТТЯ КЛАВІШЕЮ ESCAPE
===================================================== */

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key !== "Escape"
        ) {
            return;
        }


        if (
            listingModal?.style.display ===
            "flex"
        ) {
            closeListingFormModal();
        }
    }
);

/* =====================================================
   ПОВНОЕКРАННИЙ ПЕРЕГЛЯД ФОТО АВТОРИНКУ
===================================================== */

let marketViewerPhotos = [];
let marketViewerIndex = 0;
let marketViewerTouchStartX = null;

function ensureMarketPhotoViewer() {
    let viewer =
        document.getElementById(
            "marketPhotoViewer"
        );

    if (viewer) {
        return viewer;
    }

    viewer =
        document.createElement(
            "div"
        );

    viewer.id =
        "marketPhotoViewer";

    viewer.className =
        "photo-viewer";

    viewer.setAttribute(
        "aria-hidden",
        "true"
    );

    viewer.innerHTML = `
        <button
            type="button"
            id="closeMarketPhotoViewer"
            class="photo-viewer-close"
            aria-label="Закрити фото"
        >
            ×
        </button>

        <button
            type="button"
            id="previousMarketViewerPhoto"
            class="photo-viewer-arrow photo-viewer-arrow-left"
            aria-label="Попереднє фото"
        >
            ‹
        </button>

        <img
            id="marketPhotoViewerImage"
            class="photo-viewer-image"
            src=""
            alt=""
        >

        <button
            type="button"
            id="nextMarketViewerPhoto"
            class="photo-viewer-arrow photo-viewer-arrow-right"
            aria-label="Наступне фото"
        >
            ›
        </button>
    `;

    document.body.appendChild(
        viewer
    );

    const closeButton =
        viewer.querySelector(
            "#closeMarketPhotoViewer"
        );

    const previousButton =
        viewer.querySelector(
            "#previousMarketViewerPhoto"
        );

    const nextButton =
        viewer.querySelector(
            "#nextMarketViewerPhoto"
        );

    closeButton?.addEventListener(
        "click",
        closeMarketPhotoViewer
    );

    previousButton?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            showPreviousMarketPhoto();
        }
    );

    nextButton?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            showNextMarketPhoto();
        }
    );

    viewer.addEventListener(
        "click",
        (event) => {
            if (
                event.target === viewer
            ) {
                closeMarketPhotoViewer();
            }
        }
    );

    viewer.addEventListener(
        "touchstart",
        (event) => {
            marketViewerTouchStartX =
                event.touches?.[0]
                    ?.clientX ?? null;
        },
        {
            passive: true
        }
    );

    viewer.addEventListener(
        "touchend",
        (event) => {
            if (
                marketViewerTouchStartX ===
                null
            ) {
                return;
            }

            const touchEndX =
                event.changedTouches?.[0]
                    ?.clientX;

            if (
                typeof touchEndX !==
                "number"
            ) {
                marketViewerTouchStartX =
                    null;

                return;
            }

            const difference =
                touchEndX -
                marketViewerTouchStartX;

            marketViewerTouchStartX =
                null;

            if (
                Math.abs(difference) <
                40
            ) {
                return;
            }

            if (difference < 0) {
                showNextMarketPhoto();
            } else {
                showPreviousMarketPhoto();
            }
        },
        {
            passive: true
        }
    );

    return viewer;
}

function renderMarketPhotoViewer() {
    const viewer =
        ensureMarketPhotoViewer();

    const image =
        viewer.querySelector(
            "#marketPhotoViewerImage"
        );

    const previousButton =
        viewer.querySelector(
            "#previousMarketViewerPhoto"
        );

    const nextButton =
        viewer.querySelector(
            "#nextMarketViewerPhoto"
        );

    if (
        !image ||
        marketViewerPhotos.length ===
            0
    ) {
        return;
    }

    marketViewerIndex =
        (
            marketViewerIndex +
            marketViewerPhotos.length
        ) %
        marketViewerPhotos.length;

    image.src =
        marketViewerPhotos[
            marketViewerIndex
        ];

    const onlyOnePhoto =
        marketViewerPhotos.length <= 1;

    if (previousButton) {
        previousButton.hidden =
            onlyOnePhoto;
    }

    if (nextButton) {
        nextButton.hidden =
            onlyOnePhoto;
    }
}

function openMarketPhotoViewer(
    photos,
    startIndex = 0
) {
    if (
        !Array.isArray(photos) ||
        photos.length === 0
    ) {
        return;
    }

    marketViewerPhotos =
        [...photos];

    marketViewerIndex =
        Math.min(
            Math.max(
                Number(startIndex) || 0,
                0
            ),
            marketViewerPhotos.length -
                1
        );

    const viewer =
        ensureMarketPhotoViewer();

    renderMarketPhotoViewer();

    viewer.classList.add(
        "open"
    );

    viewer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}

function closeMarketPhotoViewer() {
    const viewer =
        document.getElementById(
            "marketPhotoViewer"
        );

    if (!viewer) {
        return;
    }

    viewer.classList.remove(
        "open"
    );

    viewer.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    marketViewerPhotos = [];
    marketViewerIndex = 0;
}

function showPreviousMarketPhoto() {
    if (
        marketViewerPhotos.length <= 1
    ) {
        return;
    }

    marketViewerIndex -= 1;

    renderMarketPhotoViewer();
}

function showNextMarketPhoto() {
    if (
        marketViewerPhotos.length <= 1
    ) {
        return;
    }

    marketViewerIndex += 1;

    renderMarketPhotoViewer();
}

document.addEventListener(
    "keydown",
    (event) => {
        const viewer =
            document.getElementById(
                "marketPhotoViewer"
            );

        if (
            !viewer?.classList.contains(
                "open"
            )
        ) {
            return;
        }

        if (event.key === "Escape") {
            closeMarketPhotoViewer();
        }

        if (
            event.key ===
            "ArrowLeft"
        ) {
            showPreviousMarketPhoto();
        }

        if (
            event.key ===
            "ArrowRight"
        ) {
            showNextMarketPhoto();
        }
    }
);

/* =====================================================
   ВІДОБРАЖЕННЯ ОГОЛОШЕНЬ
===================================================== */

async function renderListings() {
    if (!marketListings) {
        return;
    }


    marketListings.innerHTML =
        "";


    const searchQuery =
        marketSearch
            ? marketSearch.value
                .trim()
                .toLowerCase()
            : "";


    const filteredListings =
        listings.filter(
            (listing) => {
                const searchableText = `
                    ${listing.name || ""}
                    ${listing.year || ""}
                    ${listing.city || ""}
                    ${listing.vin || ""}
                    ${listing.fuel || ""}
                    ${listing.body || ""}
                `.toLowerCase();


                return searchableText.includes(
                    searchQuery
                );
            }
        );


    if (
        filteredListings.length ===
        0
    ) {
        marketListings.innerHTML = `
            <p class="empty-market">
                Оголошень поки немає.
            </p>
        `;


        return;
    }


    const sortedListings =
        [...filteredListings];


    if (
        marketSort?.value ===
        "price-low"
    ) {
        sortedListings.sort(
            (firstListing, secondListing) =>
                Number(
                    firstListing.priceUsd ||
                    0
                ) -
                Number(
                    secondListing.priceUsd ||
                    0
                )
        );
    } else if (
        marketSort?.value ===
        "price-high"
    ) {
        sortedListings.sort(
            (firstListing, secondListing) =>
                Number(
                    secondListing.priceUsd ||
                    0
                ) -
                Number(
                    firstListing.priceUsd ||
                    0
                )
        );
    } else {
        sortedListings.sort(
            (firstListing, secondListing) =>
                new Date(
                    secondListing.createdAt ||
                    0
                ) -
                new Date(
                    firstListing.createdAt ||
                    0
                )
        );
    }


   for (
    const listing of
    sortedListings) 
        {
            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "market-card";


            const photos =
                Array.isArray(
                    listing.photos
                )
                    ? listing.photos
                    : listing.photo
                        ? [listing.photo]
                        : [];


            const requestedPhotoIndex =
                Number.isInteger(
                    listing.activePhotoIndex
                )
                    ? listing.activePhotoIndex
                    : 0;


            const mainPhotoIndex =
                photos.length > 0
                    ? Math.min(
                        Math.max(
                            requestedPhotoIndex,
                            0
                        ),
                        photos.length - 1
                    )
                    : 0;


            const photo =
                photos[mainPhotoIndex] ||
                photos[0] ||
                "";


            const priceUsd =
                Number(
                    listing.priceUsd ||
                    0
                );


            const priceUah =
                Number(
                    listing.priceUah ||
                    0
                );


            const mileage =
                Number(
                    listing.mileage ||
                    0
                );

                const sellerId =
                listing.ownerId ||
                listing.userId ||
                listing.sellerId ||
                listing.ownerEmail ||
                "";
            
            const sellerRating =
             await getSellerRatingData(
                    sellerId
                );

                const isFavorite =
    isFavoriteListing(
        listing.id
    );

            card.innerHTML = `

            <button
            type="button"
            class="favorite-headlight-button ${
                isFavorite
                    ? "is-active"
                    : ""
            }"
            aria-label="${
                isFavorite
                    ? "Прибрати з обраного"
                    : "Додати в обране"
            }"
            aria-pressed="${isFavorite}"
            title="${
                isFavorite
                    ? "В обраному"
                    : "Додати в обране"
            }"
        >
            <span
                class="favorite-headlight-beam"
                aria-hidden="true"
            ></span>
        
            <svg
                class="favorite-headlight-icon"
                viewBox="0 0 64 44"
                aria-hidden="true"
            >
                <path
                    class="favorite-headlight-shell"
                    d="M8 22C15 9 29 5 49 8L57 22L49 36C29 39 15 35 8 22Z"
                ></path>
        
                <path
                    class="favorite-headlight-lens"
                    d="M17 22C23 14 33 12 45 14L50 22L45 30C33 32 23 30 17 22Z"
                ></path>
        
                <path
                    class="favorite-headlight-lines"
                    d="M3 14H12M1 22H11M3 30H12"
                ></path>
            </svg>
        </button>

                ${
                    photo
                        ? `
                            <img
                                class="market-card-photo"
                                src="${photo}"
                                alt="${
                                    listing.name ||
                                    "Автомобіль"
                                }"
                            >
                        `
                        : `
                            <div
                                class="market-card-no-photo"
                            >
                                🚗
                            </div>
                        `
                }

                <div
                    class="market-card-content"
                >
                    <h2>
                        ${
                            listing.name ||
                            "Автомобіль"
                        }
                        (
                        ${
                            listing.year ||
                            "рік не вказано"
                        }
                        )
                    </h2>

                    <p
                        class="market-card-price"
                    >
                        ${priceUsd.toLocaleString(
                            "uk-UA"
                        )}
                        $

                        ${
                            priceUah
                                ? `
                                    ≈
                                    ${priceUah.toLocaleString(
                                        "uk-UA"
                                    )}
                                    грн
                                `
                                : ""
                        }
                    </p>

                    <p>
                        ${mileage.toLocaleString(
                            "uk-UA"
                        )}
                        км
                        •
                        ${
                            listing.fuel ||
                            "Пальне не вказано"
                        }
                        •
                        ${
                            listing.transmission ||
                            "Коробка не вказана"
                        }
                    </p>

                    <p>
                        ${
                            listing.body ||
                            "Кузов не вказано"
                        }
                        •
                        ${
                            listing.drive ||
                            "Привід не вказано"
                        }
                    </p>

                    <p>
                        📍
                        ${
                            listing.city ||
                            "Місто не вказано"
                        }
                    </p>

                    <div class="market-card-seller-rating">
    ${
        sellerRating.count > 0
            ? `
                <span class="market-card-rating-star">
                    ★
                </span>

                <strong>
                    ${sellerRating.average.toFixed(1)}
                </strong>

                <span>
                    · ${getRatingCountLabel(
                        sellerRating.count
                    )}
                </span>
            `
            : `
                <span class="market-card-new-seller">
                    ☆ Новий продавець
                </span>
            `
    }
</div>

                    <p
                        class="market-card-description"
                    >
                        ${
                            listing.description ||
                            "Опис не додано."
                        }
                    </p>
                </div>
            `;

            const marketCardPhoto =
    card.querySelector(
        ".market-card-photo"
    );

marketCardPhoto?.addEventListener(
    "click",
    (event) => {
        event.preventDefault();
        event.stopPropagation();

        openMarketPhotoViewer(
            photos,
            mainPhotoIndex
        );
    }
);

            const favoriteButton =
            card.querySelector(
                ".favorite-headlight-button"
            );
        
        favoriteButton?.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopPropagation();
        
                toggleFavoriteListing(
                    listing.id
                );
            }
        );

            card.addEventListener(
                "click",
                () => {
                    window.location.href =
                        `listing.html?id=${encodeURIComponent(
                            listing.id
                        )}`;
                }
            );


            marketListings.appendChild(
                card
            );
        }
}


/* =====================================================
   ПОШУК І СОРТУВАННЯ
===================================================== */

if (marketSearch) {
    marketSearch.addEventListener(
        "input",
        renderListings
    );
}


if (marketSort) {
    marketSort.addEventListener(
        "change",
        renderListings
    );
}


/* =====================================================
   ЗБЕРЕЖЕННЯ ОГОЛОШЕННЯ
===================================================== */

if (listingForm) {
    listingForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();


            const car =
                cars.find(
                    (item) =>
                        String(item.id) ===
                        String(
                            listingCar?.value
                        )
                );


            const name =
                listingName?.value
                    .trim() ||
                car?.name ||
                "";


            const year =
                Number(
                    listingYear?.value
                ) ||
                Number(
                    car?.year
                ) ||
                0;


            const vin =
                listingVin?.value
                    .trim()
                    .toUpperCase() ||
                car?.vin ||
                "";


            const priceUsd =
                Number(
                    listingPrice?.value
                );


            const mileage =
                Number(
                    listingMileage?.value
                );


            const fuel =
                listingFuel?.value ||
                "";


            const powerValue =
                Number(
                    listingPowerValue
                        ?.value
                );


            const transmission =
                listingTransmission?.value ||
                "";


            const body =
                listingBody?.value ||
                "";


            const drive =
                listingDrive?.value ||
                "";


            const city =
                listingCity?.value
                    .trim() ||
                "";


            const phone =
                listingPhone?.value
                    .trim() ||
                "";


            const description =
                listingDescription
                    ?.value
                    .trim() ||
                "";


            if (!name) {
                alert(
                    "Введи назву автомобіля."
                );

                return;
            }


            if (!year) {
                alert(
                    "Вкажи рік випуску."
                );

                return;
            }


            if (!priceUsd) {
                alert(
                    "Вкажи ціну автомобіля."
                );

                return;
            }


            if (!mileage && mileage !== 0) {
                alert(
                    "Вкажи пробіг автомобіля."
                );

                return;
            }


            if (!fuel) {
                alert(
                    "Обери тип пального."
                );

                return;
            }


            if (!transmission) {
                alert(
                    "Обери коробку передач."
                );

                return;
            }


            if (!body) {
                alert(
                    "Обери тип кузова."
                );

                return;
            }


            if (!drive) {
                alert(
                    "Обери тип приводу."
                );

                return;
            }


            if (!city) {
                alert(
                    "Вкажи місто."
                );

                return;
            }


            if (!phone) {
                alert(
                    "Вкажи номер телефону."
                );

                return;
            }


            if (
                selectedPhotos.length ===
                0
            ) {
                alert(
                    "Додай хоча б одну фотографію автомобіля."
                );

                return;
            }


            let preparedPhotos = [];


            try {
                preparedPhotos =
                    await prepareSelectedPhotos();
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


            if (
                preparedPhotos.length ===
                0
            ) {
                alert(
                    "Додай хоча б одну фотографію автомобіля."
                );

                return;
            }


            const safeMainPhotoIndex =
                Math.min(
                    Math.max(
                        selectedMainPhotoIndex,
                        0
                    ),
                    preparedPhotos.length - 1
                );


            const priceUah =
                usdRate
                    ? Math.round(
                        priceUsd *
                        usdRate
                    )
                    : isEditMode
                        ? editingListing
                            ?.priceUah ||
                          null
                        : null;


            const publicServices =
                car
                    ? (
                        car.services ||
                        []
                    )
                        .filter(
                            (service) =>
                                service.isPublic
                        )
                        .map(
                            (service) => ({
                                ...service
                            })
                        )
                    : isEditMode
                        ? (
                            editingListing
                                ?.services ||
                            []
                        ).map(
                            (service) => ({
                                ...service
                            })
                        )
                        : [];


            if (isEditMode) {
                const currentUserId =
                    currentUser?.id ||
                    currentUser?.userId ||
                    currentUser?.email ||
                    "";


                const listingOwnerId =
                    editingListing?.ownerId ||
                    editingListing?.userId ||
                    editingListing?.sellerId ||
                    editingListing
                        ?.ownerEmail ||
                    "";


                const isOwner =
                    currentUserId &&
                    listingOwnerId &&
                    String(
                        currentUserId
                    ) ===
                    String(
                        listingOwnerId
                    );


                if (!isOwner) {
                    alert(
                        "Ти не можеш редагувати чуже оголошення."
                    );


                    window.location.href =
                        "market.html";


                    return;
                }


                const listingIndex =
                    listings.findIndex(
                        (listing) =>
                            String(
                                listing.id
                            ) ===
                            String(
                                editingListing.id
                            )
                    );


                if (
                    listingIndex ===
                    -1
                ) {
                    alert(
                        "Оголошення не знайдено."
                    );


                    window.location.href =
                        "market.html";


                    return;
                }


                const updatedListing = {
                    ...editingListing,

                    ownerId:
                        editingListing.ownerId ||
                        currentUser.id,

                    carId:
                        car?.id ||
                        editingListing.carId ||
                        null,

                    name,
                    year,
                    vin,

                    photos:
                        preparedPhotos,

                    activePhotoIndex:
                        safeMainPhotoIndex,

                    engine:
                        car?.engine ||
                        editingListing.engine ||
                        "",

                    mileage,
                    fuel,

                    powerType:
                        fuel === "Електро"
                            ? "battery"
                            : "engine",

                    powerValue,

                    transmission,
                    body,
                    drive,

                    services:
                        publicServices,

                    priceUsd,
                    priceUah,

                    city,
                    phone,
                    description,

                    createdAt:
                        editingListing
                            .createdAt ||
                        new Date()
                            .toISOString(),

                    updatedAt:
                        new Date()
                            .toISOString()
                };


                const previousListing =
                    listings[
                        listingIndex
                    ];


                listings[
                    listingIndex
                ] =
                    updatedListing;

                    const token =
                    localStorage.getItem(
                        "royalGarageToken"
                    );
                
                if (!token) {
                    listings[
                        listingIndex
                    ] = previousListing;
                
                    alert(
                        "Сесія недійсна. Увійдіть повторно."
                    );
                
                    return;
                }
                
                try {
                    const response = await fetch(
                        `/api/market/listings/${updatedListing.id}`,
                        {
                            method: "PATCH",
                
                            headers: {
                                "Content-Type":
                                    "application/json",
                
                                Authorization:
                                    `Bearer ${token}`
                            },
                
                            body: JSON.stringify({
                                carId:
                                    updatedListing.carId,
                
                                name:
                                    updatedListing.name,
                
                                year:
                                    updatedListing.year,
                
                                vin:
                                    updatedListing.vin,
                
                                photos:
                                    updatedListing.photos,
                
                                activePhotoIndex:
                                    updatedListing.activePhotoIndex,
                
                                engine:
                                    updatedListing.engine,
                
                                mileage:
                                    updatedListing.mileage,
                
                                fuel:
                                    updatedListing.fuel,
                
                                powerType:
                                    updatedListing.powerType,
                
                                powerValue:
                                    updatedListing.powerValue,
                
                                transmission:
                                    updatedListing.transmission,
                
                                body:
                                    updatedListing.body,
                
                                drive:
                                    updatedListing.drive,
                
                                services:
                                    updatedListing.services,
                
                                priceUsd:
                                    updatedListing.priceUsd,
                
                                priceUah:
                                    updatedListing.priceUah,
                
                                city:
                                    updatedListing.city,
                
                                phone:
                                    updatedListing.phone,
                
                                description:
                                    updatedListing.description
                            })
                        }
                    );
                
                    const data =
                        await response.json();
                
                    if (!response.ok) {
                        listings[
                            listingIndex
                        ] = previousListing;
                
                        alert(
                            data.message ||
                            "Не вдалося зберегти зміни."
                        );
                
                        return;
                    }
                
                    await loadMarketListings();
                
                } catch (error) {
                    listings[
                        listingIndex
                    ] = previousListing;
                
                    console.error(
                        "Market listing update request error:",
                        error
                    );
                
                    alert(
                        "Не вдалося з’єднатися із сервером."
                    );
                
                    return;
                }
                  
                


                alert(
                    "Оголошення успішно оновлено."
                );


                window.location.href =
                    `listing.html?id=${encodeURIComponent(
                        updatedListing.id
                    )}`;


                return;
            
        }

            if (
                !currentUser ||
                !currentUser.id
            ) {
                alert(
                    "Сесія користувача недійсна. Увійдіть повторно."
                );
            
                window.location.href =
                    "index.html";
            
                return;
            }


            const token =
            localStorage.getItem(
                "royalGarageToken"
            );
        
        if (!token) {
            alert(
                "Сесія недійсна. Увійдіть повторно."
            );
        
            window.location.href =
                "index.html";
        
            return;
        }
        
        try {
            const response = await fetch(
                "/api/market/listings",
                {
                    method: "POST",
        
                    headers: {
                        "Content-Type":
                            "application/json",
        
                        Authorization:
                            `Bearer ${token}`
                    },
        
                    body: JSON.stringify({
                        carId:
                            car?.id || null,
        
                        name,
                        year,
                        vin,
        
                        photos:
                            preparedPhotos,
        
                        activePhotoIndex:
                            safeMainPhotoIndex,
        
                        engine:
                            car?.engine || "",
        
                        mileage,
                        fuel,
        
                        powerType:
                            fuel === "Електро"
                                ? "battery"
                                : "engine",
        
                        powerValue,
        
                        transmission,
                        body,
                        drive,
        
                        services:
                            publicServices,
        
                        priceUsd,
                        priceUah,
        
                        city,
                        phone,
                        description
                    })
                }
            );
        
            const data =
                await response.json();
        
            if (!response.ok) {
                alert(
                    data.message ||
                    "Не вдалося створити оголошення."
                );
        
                return;
            }
        
            await loadMarketListings();
        
        } catch (error) {
            console.error(
                "Market listing create request error:",
                error
            );
        
            alert(
                "Не вдалося з’єднатися із сервером."
            );
        
            return;
        }


            alert(
                "Оголошення успішно опубліковано."
            );


            hideListingModal();


            resetListingForm();


            renderListings();
        }
    );
}


/* =====================================================
   ЗАПУСК СТОРІНКИ
===================================================== */

fillBrandSelect();

fillCarSelect();

updatePhotosCounter();

loadUsdRate();

async function initializeMarket() {
    await loadFavoriteListingsFromServer();
    await loadMarketListings();
}

initializeMarket();


/* =====================================================
   АВТОМАТИЧНЕ ВІДКРИТТЯ РЕДАГУВАННЯ
===================================================== */
async function openEditListingIfNeeded() {
    if (!editListingId) {
        return;
    }

    await loadMarketListings();

    editingListing =
        listings.find(
            (listing) =>
                String(listing.id) ===
                String(editListingId)
        ) || null;

        isEditMode =
    Boolean(editingListing);

    if (!editingListing) {
        alert(
            "Оголошення для редагування не знайдено."
        );

        window.location.href =
            "market.html";

        return;
    }

    const currentUserId =
        currentUser?.id ||
        currentUser?.userId ||
        currentUser?.email ||
        "";

    const listingOwnerId =
        editingListing.ownerId ||
        editingListing.userId ||
        editingListing.sellerId ||
        editingListing.ownerEmail ||
        "";

    const isOwner =
        currentUserId &&
        listingOwnerId &&
        String(currentUserId) ===
            String(listingOwnerId);

    if (!isOwner) {
        alert(
            "Ти не можеш редагувати чуже оголошення."
        );

        window.location.href =
            "market.html";

        return;
    }

    fillEditForm(
        editingListing
    );

    showListingModal();
}

openEditListingIfNeeded();

const marketUrlParams =
    new URLSearchParams(
        window.location.search
    );

if (
    marketUrlParams.get("add") === "1" &&
    openListingButton
) {
    openListingButton.click();

    window.history.replaceState(
        null,
        "",
        window.location.pathname
    );
}