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
   LOCAL STORAGE
===================================================== */

const CARS_STORAGE_KEY =
    `royalGarageCars_${currentUser.id}`;


const MARKET_STORAGE_KEY =
    "royalGarageMarketListings";
    
    const SELLER_RATINGS_KEY =
    "royalGarageSellerRatings";


function loadSellerRatings() {
    try {
        const storedRatings =
            JSON.parse(
                localStorage.getItem(
                    SELLER_RATINGS_KEY
                )
            ) || {};

        return (
            storedRatings &&
            typeof storedRatings === "object"
        )
            ? storedRatings
            : {};
    } catch (error) {
        console.error(
            "Не вдалося завантажити рейтинги продавців:",
            error
        );

        return {};
    }
}


function getSellerRatingData(
    sellerId
) {
    const ratings =
        loadSellerRatings();

    const sellerData =
        ratings[
            String(sellerId || "")
        ];

    const votes =
        sellerData?.votes &&
        typeof sellerData.votes === "object"
            ? Object.values(
                sellerData.votes
            )
                .map(Number)
                .filter(
                    (rating) =>
                        Number.isFinite(
                            rating
                        ) &&
                        rating >= 1 &&
                        rating <= 5
                )
            : [];

    if (votes.length === 0) {
        return {
            average: 0,
            count: 0
        };
    }

    const total =
        votes.reduce(
            (sum, rating) =>
                sum + rating,
            0
        );

    return {
        average:
            total / votes.length,

        count:
            votes.length
    };
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

const FAVORITES_STORAGE_KEY =
`royalGarageFavoriteListings_${currentUser.id}`;


let favoriteListingIds = [];


try {
    const storedFavorites =
        JSON.parse(
            localStorage.getItem(
                FAVORITES_STORAGE_KEY
            )
        ) || [];


    favoriteListingIds =
        Array.isArray(storedFavorites)
            ? storedFavorites.map(String)
            : [];
} catch (error) {
    console.error(
        "Не вдалося завантажити обране:",
        error
    );

    favoriteListingIds = [];
}


function saveFavoriteListings() {
    try {
        localStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(
                favoriteListingIds
            )
        );

        return true;
    } catch (error) {
        console.error(
            "Не вдалося зберегти обране:",
            error
        );

        alert(
            "Не вдалося зберегти оголошення в обране."
        );

        return false;
    }
}


function isFavoriteListing(listingId) {
    return favoriteListingIds.includes(
        String(listingId)
    );
}


function toggleFavoriteListing(listingId) {
    const normalizedId =
        String(listingId);


    if (
        favoriteListingIds.includes(
            normalizedId
        )
    ) {
        favoriteListingIds =
            favoriteListingIds.filter(
                (id) =>
                    id !== normalizedId
            );
    } else {
        favoriteListingIds.push(
            normalizedId
        );
    }


    if (!saveFavoriteListings()) {
        return;
    }


    renderListings();
}

let cars = [];


let listings = [];


try {
    cars =
        JSON.parse(
            localStorage.getItem(
                CARS_STORAGE_KEY
            )
        ) || [];
} catch (error) {
    console.error(
        "Не вдалося завантажити автомобілі:",
        error
    );

    cars = [];
}


try {
    listings =
        JSON.parse(
            localStorage.getItem(
                MARKET_STORAGE_KEY
            )
        ) || [];
} catch (error) {
    console.error(
        "Не вдалося завантажити оголошення:",
        error
    );

    listings = [];
}


/* =====================================================
   РЕЖИМ РЕДАГУВАННЯ
===================================================== */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const editListingId =
    urlParams.get("edit");


const editingListing =
    editListingId
        ? listings.find(
            (listing) =>
                String(listing.id) ===
                String(editListingId)
        )
        : null;


const isEditMode =
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
   ВІДОБРАЖЕННЯ ОГОЛОШЕНЬ
===================================================== */

function renderListings() {
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


    sortedListings.forEach(
        (listing) => {
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
                getSellerRatingData(
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
    );
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


                try {
                    localStorage.setItem(
                        MARKET_STORAGE_KEY,
                        JSON.stringify(
                            listings
                        )
                    );
                } catch (error) {
                    console.error(
                        "Не вдалося зберегти зміни:",
                        error
                    );


                    listings[
                        listingIndex
                    ] =
                        previousListing;


                    alert(
                        "Не вдалося зберегти зміни. " +
                        "Фотографії можуть займати забагато місця."
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


            const newListing = {
                id:
                    Date.now()
                        .toString(),

                ownerId:
                    currentUser.id,

                carId:
                    car?.id ||
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
                    new Date()
                        .toISOString()
            };


            listings.push(
                newListing
            );


            try {
                localStorage.setItem(
                    MARKET_STORAGE_KEY,
                    JSON.stringify(
                        listings
                    )
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

fillCarSelect();


updatePhotosCounter();


loadUsdRate();


renderListings();


/* =====================================================
   АВТОМАТИЧНЕ ВІДКРИТТЯ РЕДАГУВАННЯ
===================================================== */

if (editListingId) {
    if (!editingListing) {
        alert(
            "Оголошення для редагування не знайдено."
        );


        window.location.href =
            "market.html";
    } else {
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
        } else {
            fillEditForm(
                editingListing
            );


            showListingModal();
        }
    }
}