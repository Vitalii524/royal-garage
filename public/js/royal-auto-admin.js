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


function checkRoyalAutoAccess() {

    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        String(currentUser.id) !==
        String(ROYAL_AUTO_OWNER_ID)
    ) {

        alert(
            "Ця сторінка доступна тільки власнику RoyalAuto."
        );

        window.location.href =
            "handmade.html";

        return false;
    }


    return true;
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

function compressProductPhoto(
    file
) {

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
                                1200;


                            let width =
                                image.width;

                            let height =
                                image.height;


                            if (
                                width >
                                maxSize ||
                                height >
                                maxSize
                            ) {

                                const scale =
                                    Math.min(
                                        maxSize /
                                            width,
                                        maxSize /
                                            height
                                    );

                                width =
                                    Math.round(
                                        width *
                                        scale
                                    );

                                height =
                                    Math.round(
                                        height *
                                        scale
                                    );
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
                                        "Canvas недоступний."
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


                            const result =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.82
                                );


                            resolve(
                                result
                            );
                        };


                    image.onerror =
                        reject;


                    image.src =
                        reader.result;
                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );
        }
    );
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
                document.createElement(
                    "img"
                );


            image.src =
                photo;

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
                    "Максимум 20 фото на один товар."
                );

                productPhotos.value =
                    "";

                return;
            }


            try {

                for (
                    const file
                    of files
                ) {

                    const photo =
                        await compressProductPhoto(
                            file
                        );


                    selectedProductPhotos.push(
                        photo
                    );
                }


                renderPhotoPreview();


            } catch (error) {

                console.error(
                    "RoyalAuto photo error:",
                    error
                );


                alert(
                    "Не вдалося обробити одне з фото."
                );
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
            `Видалити категорію "${section.name}"?\n\nУсі товари в цій категорії також буде видалено.`
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
                const editButton =
                document.createElement(
                    "button"
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
    "🗑 Видалити";


deleteButton.addEventListener(
    "click",
    () => {

        deleteRoyalAutoSection(
            section
        );
    }
);
            
            
            editButton.type =
                "button";
            
            editButton.textContent =
                "✏️ Редагувати";
            
            
            editButton.addEventListener(
                "click",
                () => {
            
                    editRoyalAutoSection(
                        section
                    );
                }
            );

            card.append(
                icon,
                title,
                description,
                editButton,
                deleteButton
            );


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


                const wasEditing =
    Boolean(
        editingSectionId
    );


sectionForm.reset();


editingSectionId =
    null;


const submitButton =
    sectionForm.querySelector(
        'button[type="submit"]'
    );


if (submitButton) {
    submitButton.textContent =
        "+ Додати категорію";
}


await loadSections();


alert(
    wasEditing
        ? "Категорію оновлено."
        : "Категорію додано."
);


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
                "Не вдалося завантажити товари."
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
                "Не вдалося завантажити товари.";
        }
    }
}

async function deleteRoyalAutoProduct(
    productId,
    productName
) {

    const confirmed =
        confirm(
            `Видалити товар "${productName}"?`
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
                "Не вдалося видалити товар."
            );

            return;
        }


        await loadProducts();


        alert(
            "Товар видалено."
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
            "Товарів поки немає.";

        return;
    }


    royalAutoProducts.forEach(
        (product) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "royal-auto-car-card";


            const photos =
                Array.isArray(
                    product.photos
                )
                    ? product.photos
                    : [];


            if (photos[0]) {

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
                    photos[0];

                image.alt =
                    product.name;


                photoBox.appendChild(
                    image
                );


                card.appendChild(
                    photoBox
                );
            }


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "royal-auto-car-info";


            const section =
                document.createElement(
                    "small"
                );


            section.textContent =
                product.sectionName ||
                "";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                product.name;


            const price =
                document.createElement(
                    "strong"
                );


            price.className =
                "royal-auto-car-price";


            price.textContent =
                formatPrice(
                    product.priceUah ??
                    product.price_uah
                );


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                product.description ||
                "";

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
            "🗑 Видалити товар";
        
        
        deleteButton.addEventListener(
            "click",
            () => {
        
                deleteRoyalAutoProduct(
                    product.id,
                    product.name
                );
            }
        );
        
        
        info.append(
            section,
            title,
            price,
            description,
            editButton,
            deleteButton
        );


            card.appendChild(
                info
            );


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
                    "Вкажи категорію та назву товару."
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
                        "Не вдалося додати товар."
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
                    "Зберегти товар";
            }
            
            
            await loadProducts();
            
            
            alert(
                wasEditing
                    ? "Зміни успішно збережено."
                    : "Товар успішно додано."
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

    if (
        !checkRoyalAutoAccess()
    ) {
        return;
    }


    await loadSections();

    await loadProducts();
}


initializeRoyalAutoAdmin();