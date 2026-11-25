"use strict";


/* =========================
   ROYALAUTO ADMIN
   ========================= */

const ROYAL_AUTO_OWNER_ID =
    "32ce413e-9eb6-417a-b99a-77d9ca7c144a";

const CURRENT_USER_KEY =
    "royalGarageCurrentUser";

const TOKEN_KEY =
    "royalGarageToken";


let royalAutoSections = [];

let royalAutoProducts = [];

let selectedProductPhotos = [];

let editingProductId = null;

let editingSectionId = null;


/* =========================
   КОРИСТУВАЧ
   ========================= */

function getCurrentUser() {

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
            "RoyalAuto user error:",
            error
        );

        return null;
    }
}






/* =========================
   DOM
   ========================= */

const productForm =
    document.getElementById(
        "royalAutoProductForm"
    );

const productSection =
    document.getElementById(
        "royalAutoProductSection"
    );

const productName =
    document.getElementById(
        "royalAutoProductName"
    );

const productPrice =
    document.getElementById(
        "royalAutoProductPrice"
    );

const productDescription =
    document.getElementById(
        "royalAutoProductDescription"
    );

const productPhotos =
    document.getElementById(
        "royalAutoProductPhotos"
    );

const photoPreview =
    document.getElementById(
        "royalAutoPhotoPreview"
    );

const adminProducts =
    document.getElementById(
        "royalAutoAdminProducts"
    );


const sectionForm =
    document.getElementById(
        "royalAutoSectionForm"
    );

const sectionName =
    document.getElementById(
        "royalAutoSectionName"
    );

const sectionIcon =
    document.getElementById(
        "royalAutoSectionIcon"
    );

const sectionDescription =
    document.getElementById(
        "royalAutoSectionDescription"
    );

const adminSections =
    document.getElementById(
        "royalAutoAdminSections"
    );



/* =========================
   TOKEN
   ========================= */

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );
}



/* =========================
   ФОТО
   ========================= */

let catalogUploading = false;
async function compressProductPhoto(file) {
    return window.RGServiceGallery.upload(file);
}

function renderPhotoPreview() {

    if (!photoPreview) {
        return;
    }


    photoPreview.innerHTML =
        "";


    selectedProductPhotos.forEach(
        (
            photo,
            index
        ) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            const image =
                document.createElement(window.RGServiceGallery.isVideo(photo) ? "video" : "img");


            image.src = photo;
            if (image.tagName === "VIDEO") { image.controls = true; image.preload = "metadata"; image.playsInline = true; }

            image.alt =
                `Фото ${index + 1}`;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";

            removeButton.textContent =
                "×";


            removeButton.addEventListener(
                "click",
                () => {

                    selectedProductPhotos.splice(
                        index,
                        1
                    );


                    renderPhotoPreview();
                }
            );


            wrapper.append(
                image,
                removeButton
            );


            photoPreview.appendChild(
                wrapper
            );
        }
    );
}



productPhotos
    ?.addEventListener(
        "change",
        async () => {

            const files =
                Array.from(
                    productPhotos.files ||
                    []
                );


            if (
                selectedProductPhotos.length +
                files.length >
                20
            ) {

                alert(
                    "Максимум 20 фото та відео на одну послугу."
                );

                productPhotos.value =
                    "";

                return;
            }


            if (catalogUploading) return;
            catalogUploading = true;
            const save = productForm?.querySelector('[type="submit"]');
            if (save) save.disabled = true;
            const status = document.createElement("p");
            status.setAttribute("role", "status");
            productPhotos.parentElement.append(status);
            // Snapshot every picker file before disabling the input or waiting for network.
            const snapshots = files.map(file => {
                const read = () => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.onabort = () => reject(new Error("Читання перервано"));
                    reader.readAsArrayBuffer(file);
                });
                return read().catch(() => file.arrayBuffer()).then(
                    bytes => ({file: new File([bytes], file.name, {type: file.type, lastModified: file.lastModified})}),
                    () => ({error: "Не вдалося прочитати " + file.name})
                );
            });
            const failures = [];
            try {
                for (let i = 0; i < snapshots.length; i++) {
                    try {
                        status.textContent = `Підготовка файлу ${i + 1} із ${files.length}…`;
                        const result = await snapshots[i];
                        if (result.error) throw new Error(result.error);
                        const photo = await window.RGServiceGallery.upload(result.file, percent => {
                            status.textContent = `Файл ${i + 1} із ${files.length}: ${percent}%`;
                        });
                        selectedProductPhotos.push(photo);
                        renderPhotoPreview();
                    } catch (error) {
                        failures.push(files[i].name + ": " + error.message);
                    }
                }
                status.textContent = failures.length
                    ? "Не завантажено: " + failures.join("; ") + ". Виберіть ці файли повторно."
                    : "Усі вибрані файли завантажено.";
            } finally {
                catalogUploading = false;
                productPhotos.disabled = false;
                if (save) save.disabled = false;
            }
            productPhotos.value =
                "";
        }
    );



/* =========================
   КАТЕГОРІЇ
   ========================= */

async function loadSections() {

    try {

        const response =
            await fetch(
                "/api/royal-auto/sections"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Не вдалося завантажити категорії."
            );
        }


        royalAutoSections =
            Array.isArray(
                data.sections
            )
                ? data.sections
                : [];


        renderSectionSelect();

        renderAdminSections();


    } catch (error) {

        console.error(
            "RoyalAuto sections error:",
            error
        );


        if (adminSections) {

            adminSections.textContent =
                "Не вдалося завантажити категорії.";
        }
    }
}



function renderSectionSelect() {

    if (!productSection) {
        return;
    }


    productSection.innerHTML =
        `
        <option value="">
            Оберіть категорію
        </option>
        `;


    royalAutoSections.forEach(
        (section) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                section.id;


            option.textContent =
                `${section.icon || "👑"} ${section.name}`;


            productSection.appendChild(
                option
            );
        }
    );
}


async function deleteRoyalAutoSection(
    section
) {

    const confirmed =
        confirm(
            `Видалити категорію "${section.name}"?\n\nУсі послуги в цій категорії також буде видалено.`
        );


    if (!confirmed) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        alert(
            "Потрібно увійти в акаунт RoyalAuto."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/api/royal-auto/sections/${
                    encodeURIComponent(
                        section.id
                    )
                }`,
                {
                    method:
                        "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Не вдалося видалити категорію."
            );

            return;
        }


        await loadSections();

        await loadProducts();


        alert(
            "Категорію видалено."
        );


    } catch (error) {

        console.error(
            "RoyalAuto section delete error:",
            error
        );


        alert(
            "Не вдалося з'єднатися із сервером."
        );
    }
}

const sectionSubmitButton = sectionForm?.querySelector('button[type="submit"]');
const sectionCancelButton = document.getElementById("royalAutoCancelSectionEdit");

function editRoyalAutoSection(section) {
    editingSectionId = section.id;
    sectionName.value = section.name;
    sectionIcon.value = section.icon || "";
    sectionDescription.value = section.description || "";
    sectionSubmitButton.textContent = "Зберегти зміни";
    sectionCancelButton.hidden = false;
    sectionName.focus();
}

function resetSectionForm() {
    editingSectionId = null;
    sectionForm.reset();
    sectionSubmitButton.textContent = "+ Додати категорію";
    sectionCancelButton.hidden = true;
}

sectionCancelButton?.addEventListener("click", resetSectionForm);

function renderAdminSections() {

    if (!adminSections) {
        return;
    }


    adminSections.innerHTML =
        "";


    if (
        royalAutoSections.length ===
        0
    ) {

        adminSections.textContent =
            "Категорій поки немає.";

        return;
    }


    royalAutoSections.forEach(
        (section) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "upholstery-service-card";


            const icon =
                document.createElement(
                    "span"
                );


            icon.textContent =
                section.icon ||
                "👑";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                section.name;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                section.description ||
                "";

            const actions = document.createElement("div");
            actions.className = "royal-auto-category-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "upholstery-primary-button";
            editButton.textContent = "✏️ Редагувати";
            editButton.addEventListener("click", () => editRoyalAutoSection(section));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "upholstery-primary-button royal-auto-category-delete";
            deleteButton.textContent = "🗑 Видалити";
            deleteButton.addEventListener("click", () => deleteRoyalAutoSection(section));

            actions.append(editButton, deleteButton);
            card.append(icon, title, description, actions);

            adminSections.appendChild(
                card
            );
        }
    );
}



sectionForm
    ?.addEventListener(
        "submit",
        async (
            event
        ) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                alert(
                    "Потрібно увійти в акаунт RoyalAuto."
                );

                return;
            }


            const name =
                sectionName
                    ?.value
                    .trim();


            if (!name) {
                return;
            }


            try {
const requestUrl =
    editingSectionId
        ? `/api/royal-auto/sections/${
            encodeURIComponent(
                editingSectionId
            )
        }`
        : "/api/royal-auto/sections";


const requestMethod =
    editingSectionId
        ? "PATCH"
        : "POST";


const response =
    await fetch(
        requestUrl,
        {
            method:
                requestMethod,

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    name,

                                    icon:
                                        sectionIcon
                                            ?.value
                                            .trim() ||
                                        "👑",

                                    description:
                                        sectionDescription
                                            ?.value
                                            .trim() ||
                                        ""
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Не вдалося додати категорію."
                    );

                    return;
                }


                const wasEditing = Boolean(editingSectionId);
                resetSectionForm();
                await loadSections();


alert(wasEditing ? "Категорію оновлено." : "Категорію додано.");


            } catch (error) {

                console.error(
                    "RoyalAuto section create error:",
                    error
                );


                alert(
                    "Не вдалося з'єднатися із сервером."
                );
            }
        }
    );



/* =========================
   ТОВАРИ
   ========================= */

function formatPrice(
    price
) {

    const value =
        Number(price);


    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return "Ціна договірна";
    }


    return (
        new Intl.NumberFormat(
            "uk-UA"
        ).format(value) +
        " грн"
    );
}



async function loadProducts() {

    try {

        const response =
            await fetch(
                "/api/royal-auto/products"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Не вдалося завантажити послуги."
            );
        }


        royalAutoProducts =
            Array.isArray(
                data.products
            )
                ? data.products
                : [];


        renderAdminProducts();


    } catch (error) {

        console.error(
            "RoyalAuto products error:",
            error
        );


        if (adminProducts) {

            adminProducts.textContent =
                "Не вдалося завантажити послуги.";
        }
    }
}

async function deleteRoyalAutoProduct(
    productId,
    productName
) {

    const confirmed =
        confirm(
            `Видалити послугу "${productName}"?`
        );


    if (!confirmed) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        alert(
            "Потрібно увійти в акаунт RoyalAuto."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/api/royal-auto/products/${
                    encodeURIComponent(
                        productId
                    )
                }`,
                {
                    method:
                        "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Не вдалося видалити послугу."
            );

            return;
        }


        await loadProducts();


        alert(
            "Послугу видалено."
        );


    } catch (error) {

        console.error(
            "RoyalAuto product delete error:",
            error
        );


        alert(
            "Не вдалося з'єднатися із сервером."
        );
    }
}

function editRoyalAutoProduct(
    product
) {

    if(catalogUploading)return;
    editingProductId =
        product.id;


    if (productSection) {
        productSection.value =
            product.sectionId ??
            product.section_id ??
            "";
    }


    if (productName) {
        productName.value =
            product.name ||
            "";
    }


    if (productPrice) {
        productPrice.value =
            product.priceUah ??
            product.price_uah ??
            "";
    }


    if (productDescription) {
        productDescription.value =
            product.description ||
            "";
    }


    selectedProductPhotos =
        Array.isArray(product.photos)
            ? [...product.photos]
            : [];


    renderPhotoPreview();


    productForm?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    const submitButton =
        productForm?.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {
        submitButton.textContent =
            "💾 Зберегти зміни";
    }
}


function renderAdminProducts() {

    if (!adminProducts) {
        return;
    }


    adminProducts.innerHTML =
        "";


    if (
        royalAutoProducts.length ===
        0
    ) {

        adminProducts.textContent =
            "Послуг поки немає.";

        return;
    }


    royalAutoProducts.forEach(
        (product) => {

            // Use the same bounded, original-preserving media gallery as the public profile.
            const card = window.RGServiceGallery.card(product, product.sectionName);
            const info = card.querySelector('.rg-service-info');
            const actions = document.createElement('div');
            actions.className = 'rg-service-admin-actions';

                const editButton =
                document.createElement(
                    "button"
                );
            
            
            editButton.type =
                "button";
            
            editButton.textContent =
                "✏️ Редагувати";
            
            
            editButton.addEventListener(
                "click",
                () => {
            
                    editRoyalAutoProduct(
                        product
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
            "btn-danger";
        
        deleteButton.textContent =
            "🗑 Видалити послугу";
        
        
        deleteButton.addEventListener(
            "click",
            () => {
        
                deleteRoyalAutoProduct(
                    product.id,
                    product.name
                );
            }
        );
        
        
            actions.append(editButton, deleteButton);
            info.append(actions);

            adminProducts.appendChild(
                card
            );
        }
    );
}



productForm
    ?.addEventListener(
        "submit",
        async (
            event
        ) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                alert(
                    "Потрібно увійти в акаунт RoyalAuto."
                );

                return;
            }


            if (catalogUploading) { alert("Зачекайте завершення завантаження файлів."); return; }

            const sectionId =
                productSection
                    ?.value;


            const name =
                productName
                    ?.value
                    .trim();


            if (
                !sectionId ||
                !name
            ) {

                alert(
                    "Вкажи категорію та назву послуги."
                );

                return;
            }


            try {

                const requestUrl =
    editingProductId
        ? `/api/royal-auto/products/${
            encodeURIComponent(
                editingProductId
            )
        }`
        : "/api/royal-auto/products";


const requestMethod =
    editingProductId
        ? "PATCH"
        : "POST";


const response =
    await fetch(
        requestUrl,
        {
            method:
                requestMethod,

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    sectionId,

                                    name,

                                    description:
                                        productDescription
                                            ?.value
                                            .trim() ||
                                        "",

                                    priceUah:
                                        productPrice
                                            ?.value ||
                                        null,

                                    photos:
                                        selectedProductPhotos
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Не вдалося додати послугу."
                    );

                    return;
                }


                const wasEditing =
                Boolean(
                    editingProductId
                );
            
            
            productForm.reset();
            
            
            selectedProductPhotos =
                [];
            
            
            editingProductId =
                null;
            
            
            renderPhotoPreview();
            
            
            const submitButton =
                productForm.querySelector(
                    'button[type="submit"]'
                );
            
            
            if (submitButton) {
            
                submitButton.textContent =
                    "Зберегти послугу";
            }
            
            
            await loadProducts();
            
            
            alert(
                wasEditing
                    ? "Зміни успішно збережено."
                    : "Послугу успішно додано."
            );

            } catch (error) {

                console.error(
                    "RoyalAuto product create error:",
                    error
                );


                alert(
                    "Не вдалося з'єднатися із сервером."
                );
            }
        }
    );



/* =========================
   START
   ========================= */

async function initializeRoyalAutoAdmin() {

    if (String(getCurrentUser()?.id) !== ROYAL_AUTO_OWNER_ID) return;
    document.getElementById("royalAutoCatalogAdmin").hidden = false;

    await loadSections();

    await loadProducts();
}


initializeRoyalAutoAdmin();
