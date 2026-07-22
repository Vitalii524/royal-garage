"use strict";

/* ===== ПЕРЕВІРКА ВХОДУ ===== */

document.documentElement.style.visibility = "hidden";

let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("royalGarageCurrentUser")
    );
} catch (error) {
    console.error("Помилка читання користувача:", error);
}

if (!currentUser || !currentUser.id) {
    window.location.replace("index.html");
} else {
    document.documentElement.style.visibility = "visible";
}


/* ===== ОКРЕМИЙ ГАРАЖ ДЛЯ КОЖНОГО КОРИСТУВАЧА ===== */

const STORAGE_KEY = `royalGarageCars_${currentUser.id}`;
const garageCarsList = document.getElementById("garageCarsList");
const noCarsMessage = document.getElementById("noCarsMessage");
const selectedCarEmpty = document.getElementById("selectedCarEmpty");
const selectedCarContent = document.getElementById("selectedCarContent");
const selectedCarName = document.getElementById("selectedCarName");
const selectedCarInfo = document.getElementById("selectedCarInfo");
const serviceHistory = document.getElementById("serviceHistory");
const noServiceMessage = document.getElementById("noServiceMessage");
const serviceCount = document.getElementById("serviceCount");
const totalServiceCost = document.getElementById("totalServiceCost");
const currentMileage = document.getElementById("currentMileage");
const carModal = document.getElementById("carModal");
const serviceModal = document.getElementById("serviceModal");
const carForm = document.getElementById("carForm");
const serviceForm = document.getElementById("serviceForm");
const openCarButton = document.getElementById("openCarButton");
const openServiceButton = document.getElementById("openServiceButton");
const deleteCarButton = document.getElementById("deleteCarButton");
const editCarButton = document.getElementById("editCarButton");
const selectedCarPhoto = document.getElementById("selectedCarPhoto");
const carPhotoPlaceholder = document.getElementById("carPhotoPlaceholder");
const photoViewer = document.getElementById("photoViewer");
const photoViewerImage = document.getElementById("photoViewerImage");
const previousCarPhoto = document.getElementById("previousCarPhoto");
const nextCarPhoto = document.getElementById("nextCarPhoto");

let photoViewerIndex = 0;

const closePhotoViewer = document.getElementById("closePhotoViewer");
const updateCarPhoto = document.getElementById("updateCarPhoto");
const carPhotoGallery =  document.getElementById("carPhotoGallery");
let cars = loadCars();
let selectedCarId = cars[0]?.id ?? null;
let editingCarId = null;
let editingServiceId = null;

// Видаляємо дублікати автомобілів по VIN
cars = cars.filter((car, index, self) => index === self.findIndex(c => c.vin === car.vin));

saveCars(cars);

selectedCarId = cars[0]?.id ?? null;

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reject(new Error("Не вдалося прочитати фото."));
        };

        reader.onload = () => {
            const image = new Image();

            image.onerror = () => {
                reject(new Error("Неправильний формат фото."));
            };

            image.onload = () => {
                const maxSize = 1200;
                let width = image.width;
                let height = image.height;

                if (width > maxSize || height > maxSize) {
                    const scale = Math.min(
                        maxSize / width,
                        maxSize / height
                    );

                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(image, 0, 0, width, height);

                resolve(
                    canvas.toDataURL("image/jpeg", 0.78)
                );
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

/* ===== ЗБЕРЕЖЕННЯ ===== */

function loadCars() {
    try {
        const savedCars = localStorage.getItem(STORAGE_KEY);
        return savedCars ? JSON.parse(savedCars) : [];
    } catch (error) {
        console.error("Не вдалося завантажити авто:", error);
        return [];
    }
}

function saveCars() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}


/* ===== ДОПОМІЖНІ ФУНКЦІЇ ===== */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNumber(value) {
    return new Intl.NumberFormat("uk-UA").format(
        Number(value) || 0
    );
}

function formatDate(value) {
    if (!value) {
        return "Дата не вказана";
    }

    return new Intl.DateTimeFormat("uk-UA").format(
        new Date(`${value}T00:00:00`)
    );
}

function openModal(modal) {
    modal.classList.add("modal-open");
}

function closeModal(modal) {
    modal.classList.remove("modal-open");
}


/* ===== ВІДОБРАЖЕННЯ АВТО ===== */

function renderCars() {
    garageCarsList
        .querySelectorAll(".garage-car-button")
        .forEach((element) => element.remove());

    noCarsMessage.hidden = cars.length > 0;

    cars.forEach((car) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "garage-car-button";

        if (car.id === selectedCarId) {
            button.classList.add("active");
        }

        button.innerHTML = `
            <strong>${escapeHtml(car.name)}</strong>

            <span>
                ${escapeHtml(car.year)} рік ·
                ${formatNumber(car.mileage)} км
            </span>
        `;

        button.addEventListener("click", () => {
            selectedCarId = car.id;
            renderPage();
        });

        garageCarsList.appendChild(button);
    });
}


/* ===== ВІДОБРАЖЕННЯ ОБРАНОГО АВТО ===== */

function getCarPhotos(car) {
    if (!Array.isArray(car.photos)) {
        car.photos = car.photo
            ? [car.photo]
            : [];
    }

    return car.photos;
}

function renderCarGallery(car) {
    const photos = getCarPhotos(car);

    carPhotoGallery.innerHTML = "";

    if (photos.length === 0) {
        selectedCarPhoto.removeAttribute("src");
        selectedCarPhoto.classList.add("hidden");
        carPhotoPlaceholder.classList.remove("hidden");
        return;
    }

    if (
        !Number.isInteger(car.activePhotoIndex) ||
        car.activePhotoIndex >= photos.length
    ) {
        car.activePhotoIndex = 0;
    }

    const activePhoto =
        photos[car.activePhotoIndex];

    selectedCarPhoto.src = activePhoto;
    selectedCarPhoto.classList.remove("hidden");
    carPhotoPlaceholder.classList.add("hidden");

    selectedCarPhoto.onclick = () => {
        photoViewerIndex = car.activePhotoIndex;
    
        showCarPhotoInViewer(photoViewerIndex);
    
        photoViewer.classList.add("open");
    };

    photos.forEach((photo, index) => {
        const thumbnailButton =
            document.createElement("button");

        thumbnailButton.type = "button";
        thumbnailButton.className =
            "car-photo-thumbnail-button";

        if (index === car.activePhotoIndex) {
            thumbnailButton.classList.add("active");
        }

        const thumbnail =
            document.createElement("img");

        thumbnail.src = photo;
        thumbnail.alt =
            `Фото автомобіля ${index + 1}`;

        thumbnailButton.appendChild(thumbnail);

        thumbnailButton.addEventListener(
            "click",
            () => {
                car.activePhotoIndex = index;

                saveCars();
                renderSelectedCar();
            }
        );

        const photoItem = document.createElement("div");
photoItem.className = "car-photo-thumbnail-item";

const deletePhotoButton = document.createElement("button");
deletePhotoButton.type = "button";
deletePhotoButton.className = "delete-car-photo-button";
deletePhotoButton.textContent = "🗑️";
deletePhotoButton.title = "Видалити фото";
deletePhotoButton.setAttribute(
    "aria-label",
    "Видалити фото"
);

const replacePhotoInput = document.createElement("input");
replacePhotoInput.type = "file";
replacePhotoInput.accept = "image/jpeg,image/png,image/webp";
replacePhotoInput.hidden = true;

const replacePhotoButton = document.createElement("button");
replacePhotoButton.type = "button";
replacePhotoButton.className = "replace-car-photo-button";
replacePhotoButton.textContent = "🔄";
replacePhotoButton.title = "Замінити фото";
replacePhotoButton.setAttribute(
    "aria-label",
    "Замінити фото"
);

replacePhotoButton.addEventListener("click", (event) => {
    event.stopPropagation();
    replacePhotoInput.click();
});

const mainPhotoButton = document.createElement("button");
mainPhotoButton.type = "button";
mainPhotoButton.className = "main-car-photo-button";
mainPhotoButton.textContent =
    car.activePhotoIndex === index ? "★" : "☆";
mainPhotoButton.title = "Зробити головним фото";
mainPhotoButton.setAttribute(
    "aria-label",
    "Зробити головним фото"
);

mainPhotoButton.addEventListener("click", (event) => {
    event.stopPropagation();

    car.activePhotoIndex = index;
    car.photo = photos[index];

    saveCars();
    renderSelectedCar();
});

replacePhotoInput.addEventListener("change", async () => {
    const file = replacePhotoInput.files?.[0];

    if (!file) {
        return;
    }

    try {
        const newPhoto = await compressImage(file);

        photos[index] = newPhoto;
        car.photos = photos;
        car.photo = photos[0] || "";

        saveCars();
        renderSelectedCar();
    } catch (error) {
        alert("Не вдалося замінити фото.");
    }
});

deletePhotoButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const confirmed = confirm(
        "Видалити це фото автомобіля?"
    );

    if (!confirmed) {
        return;
    }

    photos.splice(index, 1);

    car.photos = photos;
    car.photo = photos[0] || "";

    if (photos.length === 0) {
        car.activePhotoIndex = 0;
    } else if (car.activePhotoIndex >= photos.length) {
        car.activePhotoIndex = photos.length - 1;
    } else if (index < car.activePhotoIndex) {
        car.activePhotoIndex -= 1;
    }

    saveCars();
    renderSelectedCar();
});

photoItem.appendChild(thumbnailButton);
photoItem.appendChild(replacePhotoInput);
photoItem.appendChild(mainPhotoButton);
photoItem.appendChild(replacePhotoButton);
photoItem.appendChild(deletePhotoButton);

carPhotoGallery.appendChild(photoItem);
    });
}

function renderSelectedCar() {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        selectedCarEmpty.classList.remove("hidden");
        selectedCarContent.classList.add("hidden");
        return;
    }

    selectedCarEmpty.classList.add("hidden");
    selectedCarContent.classList.remove("hidden");

    selectedCarName.textContent = car.name;

    selectedCarInfo.textContent =
    `${car.year} рік • ${formatNumber(car.mileage)} км • ${car.engine}
    
    VIN: ${car.vin || "-"}
    
    Номер: ${car.plate || "-"}`;

    renderCarGallery(car);

    const services = Array.isArray(car.services)
        ? [...car.services]
        : [];

    services.sort((first, second) =>
        second.date.localeCompare(first.date)
    );

    serviceCount.textContent = String(services.length);

    const totalCost = services.reduce(
        (total, service) =>
            total + Number(service.cost || 0),
        0
    );

    totalServiceCost.textContent =
        `${formatNumber(totalCost)} грн`;

    currentMileage.textContent =
        `${formatNumber(car.mileage)} км`;

    serviceHistory
        .querySelectorAll(".service-card")
        .forEach((element) => element.remove());

    noServiceMessage.hidden = services.length > 0;

    services.forEach((service) => {
        const card = document.createElement("article");

        card.className = "service-card";

        card.innerHTML = `
            <div class="service-card-top">

                <div>
                    <p class="service-date">
                        ${formatDate(service.date)}
                    </p>

                    <h3>
                        ${escapeHtml(service.title)}
                    </h3>
                </div>

                <span class="service-visibility">
                    ${
                        service.isPublic
                            ? "Публічний"
                            : "Приватний"
                    }
                </span>

            </div>

            <div class="service-details">

                <span>
                    Пробіг:
                    <strong>
                        ${formatNumber(service.mileage)} км
                    </strong>
                </span>

                <span>
                    Вартість:
                    <strong>
                        ${formatNumber(service.cost)} грн
                    </strong>
                </span>

            </div>

            ${
                service.station
                    ? `
                        <p>
                            <strong>СТО:</strong>
                            ${escapeHtml(service.station)}
                        </p>
                    `
                    : ""
            }

            ${
                service.description
                    ? `
                        <p>
                            ${escapeHtml(
                                service.description
                            )}
                        </p>
                    `
                    : ""
            }

            <div class="service-card-actions">
            <button
                class="edit-service-button"
                type="button"
                data-service-id="${service.id}">
                Редагувати запис
            </button>
        
            <button
                class="delete-service-button"
                type="button"
                data-service-id="${service.id}">
                Видалити запис
            </button>
        </div>
        `;

        card
            .querySelector(".delete-service-button")
            .addEventListener("click", () => {
                deleteService(service.id);
            });

            card
    .querySelector(".edit-service-button")
    .addEventListener("click", () => {
        editingServiceId = service.id;

        document.getElementById("serviceTitle").value =
            service.title || "";

        document.getElementById("serviceDate").value =
            service.date || "";

        document.getElementById("serviceMileage").value =
            service.mileage || "";

        document.getElementById("serviceCost").value =
            service.cost || "";

        document.getElementById("serviceStation").value =
            service.station || "";

        document.getElementById("serviceDescription").value =
            service.description || "";

        document.getElementById("servicePublic").checked =
            Boolean(service.isPublic);

        openModal(serviceModal);
    });
            async function addServicePhotos(serviceId, fileList) {
                const car = cars.find(
                    (item) => item.id === selectedCarId
                );
            
                if (!car) {
                    return;
                }
            
                const service = car.services.find(
                    (item) => item.id === serviceId
                );
            
                if (!service) {
                    return;
                }
            
                const files = Array.from(fileList || []);
            
                if (files.length === 0) {
                    return;
                }
            
                const oldPhotos = Array.isArray(service.photos)
                    ? service.photos
                    : [];
            
                if (oldPhotos.length + files.length > 3) {
                    alert("До одного запису можна додати максимум 3 фото.");
                    return;
                }
            
                try {
                    const newPhotos = await Promise.all(
                        files.map((file) => compressImage(file))
                    );
            
                    service.photos = [
                        ...oldPhotos,
                        ...newPhotos
                    ];
            
                    saveCars();
                    renderPage();
                } catch (error) {
                    alert("Не вдалося додати фотографію.");
                }
            }
            
            async function replaceServicePhoto(
                serviceId,
                photoIndex,
                file
            ) {
                const car = cars.find(
                    (item) => item.id === selectedCarId
                );
            
                if (!car || !file) {
                    return;
                }
            
                const service = car.services.find(
                    (item) => item.id === serviceId
                );
            
                if (!service || !Array.isArray(service.photos)) {
                    return;
                }
            
                try {
                    const newPhoto = await compressImage(file);
            
                    service.photos[photoIndex] = newPhoto;
            
                    saveCars();
                    renderPage();
                } catch (error) {
                    alert("Не вдалося замінити фотографію.");
                }
            }
            function deleteServicePhoto(serviceId, photoIndex) {
                const car = cars.find(
                    (item) => item.id === selectedCarId
                );
            
                if (!car) {
                    return;
                }
            
                const service = car.services.find(
                    (item) => item.id === serviceId
                );
            
                if (!service || !Array.isArray(service.photos)) {
                    return;
                }
            
                const confirmed = confirm(
                    "Видалити цю фотографію?"
                );
            
                if (!confirmed) {
                    return;
                }
            
                service.photos.splice(photoIndex, 1);
            
                saveCars();
                renderPage();
            }

            if (Array.isArray(service.photos) && service.photos.length > 0) {
                const gallery = document.createElement("div");
                gallery.className = "service-photo-gallery";
            
                service.photos.forEach((photo, photoIndex) => {
                    const photoItem = document.createElement("div");
                    photoItem.className = "service-photo-item";
            
                    const image = document.createElement("img");
                    image.src = photo;
                    image.alt = "Фото до запису";
                    image.className = "service-photo";
            
                    image.addEventListener("click", () => {
                        photoViewerPhotos = [...service.photos];
                        photoViewerIndex = photoIndex;
                    
                        showPhotoInViewer(photoViewerIndex);
                        photoViewer.classList.add("open");
                    });
            
                    const deletePhotoButton = document.createElement("button");
                    deletePhotoButton.type = "button";
                    deletePhotoButton.className = "delete-service-photo-button";
                    deletePhotoButton.textContent = "Видалити фото";
            
                    deletePhotoButton.addEventListener("click", () => {
                        deleteServicePhoto(service.id, photoIndex);
                    });

                    const replacePhotoInput =
    document.createElement("input");

replacePhotoInput.type = "file";
replacePhotoInput.accept =
    "image/jpeg,image/png,image/webp";
replacePhotoInput.hidden = true;

const replacePhotoButton =
    document.createElement("button");

replacePhotoButton.type = "button";
replacePhotoButton.className =
    "replace-service-photo-button";

replacePhotoButton.textContent = "Замінити фото";

replacePhotoButton.addEventListener("click", () => {
    replacePhotoInput.click();
});

replacePhotoInput.addEventListener(
    "change",
    async () => {
        const file = replacePhotoInput.files[0];

        if (file) {
            await replaceServicePhoto(
                service.id,
                photoIndex,
                file
            );
        }
    }
);
                    photoItem.appendChild(image);
                    photoItem.appendChild(replacePhotoButton);
                    photoItem.appendChild(deletePhotoButton);
                    photoItem.appendChild(replacePhotoInput);

gallery.appendChild(photoItem);
                });
            
                card.appendChild(gallery);
            }

            const photoCount = Array.isArray(service.photos)
    ? service.photos.length
    : 0;

if (photoCount < 3) {
    const addPhotoInput =
        document.createElement("input");

    addPhotoInput.type = "file";
    addPhotoInput.accept =
        "image/jpeg,image/png,image/webp";
    addPhotoInput.multiple = true;
    addPhotoInput.hidden = true;

    const addPhotoButton =
        document.createElement("button");

    addPhotoButton.type = "button";
    addPhotoButton.className =
        "add-service-photo-button";

    addPhotoButton.textContent =
        photoCount === 0
            ? "Додати фото"
            : "Додати ще фото";

    addPhotoButton.addEventListener("click", () => {
        addPhotoInput.click();
    });

    addPhotoInput.addEventListener(
        "change",
        async () => {
            await addServicePhotos(
                service.id,
                addPhotoInput.files
            );
        }
    );

    card.appendChild(addPhotoButton);
    card.appendChild(addPhotoInput);
}

        serviceHistory.appendChild(card);
    });

    if (car.photo) {
        selectedCarPhoto.src = car.photo;
        selectedCarPhoto.classList.remove("hidden");
        carPhotoPlaceholder.classList.add("hidden");
    } else {
        selectedCarPhoto.removeAttribute("src");
        selectedCarPhoto.classList.add("hidden");
        carPhotoPlaceholder.classList.remove("hidden");
    }

}



function renderPage() {
    renderCars();
    renderSelectedCar();
}


/* ===== ВИДАЛЕННЯ ЗАПИСУ ===== */

function deleteServicePhoto(serviceId, photoIndex) {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        return;
    }

    const service = car.services.find(
        (item) => item.id === serviceId
    );

    if (!service || !Array.isArray(service.photos)) {
        return;
    }

    const confirmed = confirm(
        "Видалити цю фотографію?"
    );

    if (!confirmed) {
        return;
    }

    service.photos.splice(photoIndex, 1);

    saveCars();
    renderPage();
}

function deleteService(serviceId) {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        return;
    }

    const confirmed = confirm(
        "Видалити цей запис обслуговування?"
    );

    if (!confirmed) {
        return;
    }

    car.services = car.services.filter(
        (service) => service.id !== serviceId
    );

    saveCars();
    renderPage();
}


/* ===== ВІДКРИТТЯ ФОРМ ===== */

openCarButton.addEventListener("click", () => {
    editingCarId = null;
    carForm.reset();
    openModal(carModal);
});

editCarButton.addEventListener("click", () => {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        alert("Автомобіль не вибраний.");
        return;
    }

    editingCarId = car.id;

    document.getElementById("carName").value =
        car.name || "";

    document.getElementById("carYear").value =
        car.year || "";

    document.getElementById("carMileage").value =
        car.mileage || 0;

    document.getElementById("carEngine").value =
        car.engine || "";

        document.getElementById("carFuel").value =
    car.fuel || "";

document.getElementById("carTransmission").value =
    car.transmission || "";

document.getElementById("carBody").value =
    car.body || "";

document.getElementById("carDrive").value =
    car.drive || "";

    document.getElementById("carVin").value =
        car.vin || "";

    document.getElementById("carPlate").value =
        car.plate || "";

    document.getElementById("carPhoto").value = "";

    openModal(carModal);
});

openServiceButton.addEventListener("click", () => {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        alert("Спочатку додай автомобіль.");
        return;
    }

    document.getElementById("serviceMileage").value =
        car.mileage;

    document.getElementById("serviceDate").value =
        new Date().toISOString().slice(0, 10);

    openModal(serviceModal);
});


/* ===== ЗАКРИТТЯ ВІКОН ===== */

document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {
        button.addEventListener("click", () => {
            closeModal(button.closest(".modal"));
        });
    });

document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});
/*===========*/

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reject(new Error("Не вдалося прочитати фото."));
        };

        reader.onload = () => {
            const image = new Image();

            image.onerror = () => {
                reject(new Error("Неправильний формат фото."));
            };

            image.onload = () => {
                const maxSize = 1200;
                let width = image.width;
                let height = image.height;

                if (width > maxSize || height > maxSize) {
                    const scale = Math.min(
                        maxSize / width,
                        maxSize / height
                    );

                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(image, 0, 0, width, height);

                resolve(
                    canvas.toDataURL("image/jpeg", 0.78)
                );
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

/* ===== ДОДАВАННЯ АВТО ===== */

carForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document
        .getElementById("carName")
        .value
        .trim();

    const year = Number(
        document.getElementById("carYear").value
    );

    const mileage = Number(
        document.getElementById("carMileage").value
    );

    const engine = document
        .getElementById("carEngine")
        .value
        .trim();

        const fuel =
    document.getElementById("carFuel").value;

const transmission =
    document.getElementById("carTransmission").value;

const body =
    document.getElementById("carBody").value;

const drive =
    document.getElementById("carDrive").value;



    if (!name || !year || mileage < 0) {
        alert("Перевір дані автомобіля.");
        return;
    }
    
    const photoFile =
    document.getElementById("carPhoto").files[0];

let photo = "";

if (photoFile) {
    try {
        photo = await compressImage(photoFile);
    } catch (error) {
        alert(error.message);
        return;
    }
}

const vin = document
    .getElementById("carVin")
    .value
    .trim()
    .toUpperCase();

const plate = document
    .getElementById("carPlate")
    .value
    .trim()
    .toUpperCase();

const exists = vin && cars.some(
    (car) =>
        car.id !== editingCarId &&
        (car.vin || "").trim().toUpperCase() === vin
);

if (exists) {
    alert("Автомобіль з таким VIN вже є.");
    return;
}

if (editingCarId) {
    const car = cars.find(
        (item) => item.id === editingCarId
    );

    if (!car) {
        alert("Автомобіль не знайдений.");
        return;
    }

    car.name = name;
    car.year = year;
    car.mileage = mileage;
    car.engine = engine;
    car.fuel = fuel;
    car.transmission = transmission;
    car.body = body;
    car.drive = drive;
    car.vin = vin;
    car.plate = plate;

    if (photoFile) {
        car.photo = photo;

        if (
            Array.isArray(car.photos) &&
            car.photos.length > 0
        ) {
            const photoIndex =
                Number.isInteger(car.activePhotoIndex)
                    ? car.activePhotoIndex
                    : 0;

            car.photos[photoIndex] = photo;
        }
    }

    selectedCarId = car.id;
} else {
    const newCar = {
        id: createId(),
        ownerId: currentUser.id,
        name,
        year,
        mileage,
        engine,
        fuel,
        transmission,
        body,
        drive,
        vin,
        plate,
        photo,
        photos: photo ? [photo] : [],
        activePhotoIndex: 0,
        createdAt: new Date().toISOString(),
        services: []
    };

    cars.push(newCar);
    selectedCarId = newCar.id;
}

saveCars();
renderPage();

editingCarId = null;
carForm.reset();
closeModal(carModal);

});


/* ===== ДОДАВАННЯ ОБСЛУГОВУВАННЯ ===== */

serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        alert("Автомобіль не знайдено.");
        return;
    }

    const servicePhotoInput =
    document.getElementById("servicePhotos");

const photoFiles = Array.from(
    servicePhotoInput?.files || []
);

if (photoFiles.length > 3) {
    alert("Можна додати не більше 3 фотографій до одного запису.");
    return;
}

let photos = [];

try {
    photos = await Promise.all(
        photoFiles.map((file) => compressImage(file))
    );

} catch (error) {
    alert("Не вдалося обробити фотографії.");
    return;
}

    const mileage = Number(
        document.getElementById("serviceMileage").value
    );

    const newService = {
        id: createId(),

        title: document
            .getElementById("serviceTitle")
            .value
            .trim(),

        date: document.getElementById(
            "serviceDate"
        ).value,

        mileage,

        cost: Number(
            document.getElementById(
                "serviceCost"
            ).value
        ),

        station: document
            .getElementById("serviceStation")
            .value
            .trim(),

        description: document
            .getElementById("serviceDescription")
            .value
            .trim(),

            photos,

        isPublic:
            document.getElementById(
                "servicePublic"
            ).checked
    };

    if (!newService.title || !newService.date) {
        alert("Вкажи назву роботи та дату.");
        return;
    }

    if (editingServiceId) {
        const serviceIndex = car.services.findIndex(
            (item) => item.id === editingServiceId
        );
    
        if (serviceIndex !== -1) {
            const oldService = car.services[serviceIndex];
            const oldPhotos = Array.isArray(oldService.photos)
                ? oldService.photos
                : [];
    
            car.services[serviceIndex] = {
                ...oldService,
                ...newService,
    
                id: oldService.id,
                createdAt: oldService.createdAt,
    
                photos:
                    photos.length > 0
                        ? [...oldPhotos, ...photos].slice(0, 3)
                        : oldPhotos
            };
        }
    
        editingServiceId = null;
    } else {
        car.services.push(newService);
    }

    if (mileage > car.mileage) {
        car.mileage = mileage;
    }

    saveCars();
    renderPage();

    serviceForm.reset();
    closeModal(serviceModal);
});


/* ===== ЗАПУСК ===== */

deleteCarButton.addEventListener("click", () => {
    const car = cars.find(
        (item) => item.id === selectedCarId);

    if (!car) {
        alert("Спочатку вибери автомобіль.");
        return;
    }

    const confirmed = confirm(
        `Видалити автомобіль "${car.name}" разом з усією історією обслуговування?`);

    if (!confirmed) {
        return;
    }

    cars = cars.filter(
        (item) => item.id !== selectedCarId);

    selectedCarId = cars[0]?.id ?? null;
    saveCars();
    renderPage();
    alert("Автомобіль видалено з гаража.");
});

/*===== Додавання фото авто =====*/
let photoViewerPhotos = [];

function showPhotoInViewer(index) {
    if (photoViewerPhotos.length === 0) {
        return;
    }

    photoViewerIndex =
        (index + photoViewerPhotos.length) %
        photoViewerPhotos.length;

    photoViewerImage.src =
        photoViewerPhotos[photoViewerIndex];

    const onlyOnePhoto =
        photoViewerPhotos.length <= 1;

    previousCarPhoto.hidden = onlyOnePhoto;
    nextCarPhoto.hidden = onlyOnePhoto;
}

previousCarPhoto.addEventListener("click", (event) => {
    event.stopPropagation();
    showPhotoInViewer(photoViewerIndex - 1);
});

nextCarPhoto.addEventListener("click", (event) => {
    event.stopPropagation();
    showPhotoInViewer(photoViewerIndex + 1);
});

selectedCarPhoto.addEventListener("click", () => {
    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        return;
    }

    photoViewerPhotos = getCarPhotos(car);

    if (photoViewerPhotos.length === 0) {
        return;
    }

    photoViewerIndex = Number.isInteger(car.activePhotoIndex)
        ? car.activePhotoIndex
        : 0;

    showPhotoInViewer(photoViewerIndex);
    photoViewer.classList.add("open");
});
closePhotoViewer.addEventListener("click", () => {
    photoViewer.classList.remove("open");
});

photoViewer.addEventListener("click", (event) => {
    if (event.target === photoViewer) {
        photoViewer.classList.remove("open");
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        photoViewer.classList.remove("open");
    }
});

updateCarPhoto.addEventListener("change", async () => {
    const files = Array.from(updateCarPhoto.files || []);

    if (files.length === 0) {
        return;
    }

    const car = cars.find(
        (item) => item.id === selectedCarId
    );

    if (!car) {
        alert("Автомобіль не знайдено.");
        updateCarPhoto.value = "";
        return;
    }

    const currentPhotos = getCarPhotos(car);

    if (currentPhotos.length + files.length > 6) {
        alert("Можна додати максимум 6 фото автомобіля.");
        updateCarPhoto.value = "";
        return;
    }

    try {
        const newPhotos = await Promise.all(
            files.map((file) => compressImage(file))
        );

        car.photos = [
            ...currentPhotos,
            ...newPhotos
        ];

        car.photo = car.photos[0];
        car.activePhotoIndex = currentPhotos.length;

        saveCars();
        renderPage();
    } catch (error) {
        alert("Не вдалося додати фотографію.");
    }

    updateCarPhoto.value = "";
});

renderPage();
deleteCarButton.addEventListener("click", () => {

    if (!selectedCar) {
        alert("Автомобіль не вибраний.");
        return;
    }

    if (!confirm("Видалити цей автомобіль?")) {
        return;
    }

    let cars = getCars();

    cars = cars.filter(car => car.id !== selectedCar.id);

    saveCars(cars);

    selectedCar = null;

    renderCars();

    renderSelectedCar();

    alert("Автомобіль видалено.");
});