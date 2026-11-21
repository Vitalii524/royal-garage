"use strict";


/* =========================
   ROYAL AUTO
   ========================= */

const ROYAL_AUTO_CURRENT_USER_KEY =
    "royalGarageCurrentUser";

const ROYAL_AUTO_OWNER_ID =
    "32ce413e-9eb6-417a-b99a-77d9ca7c144a";


function getRoyalAutoCurrentUser() {
    try {
        const value =
            localStorage.getItem(
                ROYAL_AUTO_CURRENT_USER_KEY
            );

        return value
            ? JSON.parse(value)
            : null;

    } catch (error) {
        console.error(
            "Royal Auto current user error:",
            error
        );

        return null;
    }
}


function isRoyalAutoOwner() {
    const currentUser =
        getRoyalAutoCurrentUser();

    if (!currentUser) {
        return false;
    }

    return (
        String(currentUser.id) ===
        String(ROYAL_AUTO_OWNER_ID)
    );
}



/* =========================
   ПАНЕЛЬ ВЛАСНИКА
   ========================= */

const royalAutoOwnerPanel =
    document.getElementById(
        "royalAutoOwnerPanel"
    );


function renderRoyalAutoOwnerPanel() {
    if (!royalAutoOwnerPanel) {
        return;
    }

    royalAutoOwnerPanel.hidden =
        !isRoyalAutoOwner();
}


renderRoyalAutoOwnerPanel();



/* =========================
   КНОПКИ ПАНЕЛІ
   ========================= */

const manageRoyalAutoCarsButton =
    document.getElementById(
        "manageRoyalAutoCarsButton"
    );

const manageSeatCoversButton =
    document.getElementById(
        "manageSeatCoversButton"
    );

const managePillowsButton =
    document.getElementById(
        "managePillowsButton"
    );


function scrollToRoyalAutoSection(
    sectionId
) {
    const section =
        document.getElementById(
            sectionId
        );

    if (!section) {
        return;
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


manageRoyalAutoCarsButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "cars"
            );
        }
    );


manageSeatCoversButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "seat-covers"
            );
        }
    );


managePillowsButton
    ?.addEventListener(
        "click",
        () => {
            scrollToRoyalAutoSection(
                "pillows"
            );
        }
    );



/* =========================
   АВТОМОБІЛІ ROYAL AUTO
   ========================= */

const royalAutoCarsGrid =
    document.getElementById(
        "royalAutoCarsGrid"
    );

const royalAutoCarsLoading =
    document.getElementById(
        "royalAutoCarsLoading"
    );

const royalAutoCarsEmpty =
    document.getElementById(
        "royalAutoCarsEmpty"
    );


function formatRoyalAutoPrice(
    listing
) {

    const priceUsd =
        Number(
            listing.priceUsd ??
            listing.price_usd
        );

    const priceUah =
        Number(
            listing.priceUah ??
            listing.price_uah
        );


    if (
        Number.isFinite(priceUsd) &&
        priceUsd > 0
    ) {
        return (
            new Intl.NumberFormat(
                "uk-UA"
            ).format(priceUsd) +
            " $"
        );
    }


    if (
        Number.isFinite(priceUah) &&
        priceUah > 0
    ) {
        return (
            new Intl.NumberFormat(
                "uk-UA"
            ).format(priceUah) +
            " грн"
        );
    }


    return "Ціна договірна";
}


function getRoyalAutoCarPhoto(
    listing
) {

    const photos =
        Array.isArray(listing.photos)
            ? listing.photos
            : [];


    if (photos.length === 0) {
        return "";
    }


    const activeIndex =
        Number(
            listing.activePhotoIndex ??
            listing.active_photo_index ??
            0
        );


    return (
        photos[activeIndex] ||
        photos[0] ||
        ""
    );
}


function createRoyalAutoCarCard(
    listing
) {

    const link =
        document.createElement("a");

    link.className =
        "royal-auto-car-card";

    link.href =
        `listing.html?id=${
            encodeURIComponent(
                listing.id
            )
        }`;


    const photoBox =
        document.createElement("div");

    photoBox.className =
        "royal-auto-car-photo";


    const photo =
        getRoyalAutoCarPhoto(
            listing
        );


    if (photo) {

        const image =
            document.createElement("img");

        image.src =
            photo;

        image.alt =
            listing.name ||
            "Автомобіль Royal Auto";

        image.loading =
            "lazy";

        photoBox.appendChild(
            image
        );

    } else {

        const placeholder =
            document.createElement("div");

        placeholder.className =
            "royal-auto-car-placeholder";

        placeholder.textContent =
            "🚘";

        photoBox.appendChild(
            placeholder
        );
    }


    const info =
        document.createElement("div");

    info.className =
        "royal-auto-car-info";


    const title =
        document.createElement("h3");

    title.textContent =
        listing.name ||
        "Автомобіль";


    if (listing.year) {
        title.textContent +=
            ` ${listing.year}`;
    }


    const price =
        document.createElement("strong");

    price.className =
        "royal-auto-car-price";

    price.textContent =
        formatRoyalAutoPrice(
            listing
        );


    const button =
        document.createElement("span");

    button.className =
        "royal-auto-car-more";

    button.textContent =
        "Детальніше";


    info.append(
        title,
        price,
        button
    );


    link.append(
        photoBox,
        info
    );


    return link;
}


async function loadRoyalAutoCars() {

    if (!royalAutoCarsGrid) {
        return;
    }


    try {

        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                false;
        }


        if (royalAutoCarsEmpty) {
            royalAutoCarsEmpty.hidden =
                true;
        }


        royalAutoCarsGrid.innerHTML =
            "";


        const response =
            await fetch(
                "/api/market/listings"
            );


        if (!response.ok) {
            throw new Error(
                "Не вдалося отримати оголошення."
            );
        }


        const data =
            await response.json();


        const listings =
            Array.isArray(data.listings)
                ? data.listings
                : [];


        const royalAutoListings =
            listings.filter(
                (listing) => {

                    const ownerId =
                        listing.ownerId ??
                        listing.owner_id;

                    return (
                        String(ownerId) ===
                        String(
                            ROYAL_AUTO_OWNER_ID
                        )
                    );
                }
            );


        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                true;
        }


        if (
            royalAutoListings.length ===
            0
        ) {

            if (royalAutoCarsEmpty) {
                royalAutoCarsEmpty.hidden =
                    false;
            }

            return;
        }


        royalAutoListings.forEach(
            (listing) => {

                royalAutoCarsGrid.appendChild(
                    createRoyalAutoCarCard(
                        listing
                    )
                );
            }
        );


    } catch (error) {

        console.error(
            "Royal Auto cars load error:",
            error
        );


        if (royalAutoCarsLoading) {
            royalAutoCarsLoading.hidden =
                true;
        }


        if (royalAutoCarsEmpty) {

            royalAutoCarsEmpty.hidden =
                false;

            royalAutoCarsEmpty.textContent =
                "Не вдалося завантажити автомобілі.";
        }
    }
}


loadRoyalAutoCars();

/* =========================
   КАТЕГОРІЇ ТА ТОВАРИ
   ROYALAUTO
   ========================= */

   const royalAutoDirectionsGrid =
   document.getElementById(
       "royalAutoDirectionsGrid"
   );

const royalAutoProductSections =
   document.getElementById(
       "royalAutoProductSections"
   );


function getRoyalAutoSectionAnchor(
   section
) {

   const value =
       section.slug ||
       section.id ||
       "category";

   return (
       "royal-auto-" +
       String(value)
           .replace(
               /[^a-zA-Z0-9_-]/g,
               "-"
           )
   );
}


function formatRoyalAutoProductPrice(
   product
) {

   const price =
       Number(
           product.priceUah ??
           product.price_uah
       );


   if (
       Number.isFinite(price) &&
       price > 0
   ) {

       return (
           new Intl.NumberFormat(
               "uk-UA"
           ).format(price) +
           " грн"
       );
   }


   return "Ціна договірна";
}


function createRoyalAutoDirectionCard(
   section
) {

   const link =
       document.createElement(
           "a"
       );


   link.href =
       `#${getRoyalAutoSectionAnchor(
           section
       )}`;

   link.className =
       "upholstery-service-card upholstery-service-link";


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


   link.append(
       icon,
       title
   );


   return link;
}


function createRoyalAutoProductCard(product) {
    return window.RGServiceGallery.card(product, product.sectionName);
}


function createRoyalAutoProductSection(
   section,
   products
) {

   const article =
       document.createElement(
           "article"
       );


   article.id =
       getRoyalAutoSectionAnchor(
           section
       );

   article.className =
       "upholstery-detail-card royal-auto-cars-section";


   const icon =
       document.createElement(
           "div"
       );

   icon.className =
       "upholstery-detail-icon";

   icon.textContent =
       section.icon ||
       "👑";


   const content =
       document.createElement(
           "div"
       );

   content.className =
       "royal-auto-cars-content";


   const label =
       document.createElement(
           "p"
       );

   label.className =
       "upholstery-label";

   label.textContent =
       "RoyalAuto";


   const title =
       document.createElement(
           "h2"
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


   const grid =
       document.createElement(
           "div"
       );

   grid.className =
       "royal-auto-cars-grid";


   if (products.length === 0) {

       const empty =
           document.createElement(
               "div"
           );

       empty.className =
           "royal-auto-empty";

       empty.textContent =
           "У цій категорії поки немає послуг.";


       content.append(
           label,
           title,
           description,
           empty
       );

   } else {

       products.forEach(
           (product) => {

               grid.appendChild(
                   createRoyalAutoProductCard(
                       product
                   )
               );
           }
       );


       content.append(
           label,
           title,
           description,
           grid
       );
   }


   article.append(
       icon,
       content
   );


   return article;
}


async function loadRoyalAutoCatalog() {

   if (
       !royalAutoDirectionsGrid ||
       !royalAutoProductSections
   ) {
       return;
   }


   try {

       const [
           sectionsResponse,
           productsResponse
       ] =
           await Promise.all([
               fetch(
                   "/api/royal-auto/sections"
               ),

               fetch(
                   "/api/royal-auto/products"
               )
           ]);


       if (
           !sectionsResponse.ok ||
           !productsResponse.ok
       ) {

           throw new Error(
               "Не вдалося завантажити каталог RoyalAuto."
           );
       }


       const sectionsData =
           await sectionsResponse.json();

       const productsData =
           await productsResponse.json();


       const sections =
           Array.isArray(
               sectionsData.sections
           )
               ? sectionsData.sections
               : [];


       const products =
           Array.isArray(
               productsData.products
           )
               ? productsData.products
               : [];


       royalAutoProductSections.innerHTML =
           "";


       sections.forEach(
           (section) => {

               royalAutoDirectionsGrid.appendChild(
                   createRoyalAutoDirectionCard(
                       section
                   )
               );


               const sectionProducts =
                   products.filter(
                       (product) => {

                           const productSectionId =
                               product.sectionId ??
                               product.section_id;

                           return (
                               String(
                                   productSectionId
                               ) ===
                               String(
                                   section.id
                               )
                           );
                       }
                   );


               royalAutoProductSections.appendChild(
                   createRoyalAutoProductSection(
                       section,
                       sectionProducts
                   )
               );
           }
       );


   } catch (error) {

       console.error(
           "RoyalAuto catalog load error:",
           error
       );
   }
}


loadRoyalAutoCatalog();

/* =========================
   КОПІЮВАННЯ ТЕЛЕФОНУ
   ========================= */

const copyPhoneButton =
    document.getElementById(
        "copyPhoneButton"
    );


if (copyPhoneButton) {

    copyPhoneButton.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard
                    .writeText(
                        "+380632384348"
                    );


                copyPhoneButton.textContent =
                    "Номер скопійовано ✓";


                setTimeout(
                    () => {

                        copyPhoneButton.textContent =
                            "Телефон: +380 63 238 43 48";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Phone copy error:",
                    error
                );


                alert(
                    "Не вдалося скопіювати номер."
                );
            }
        }
    );
}

/* =========================
   ПЛАВАЮЧА КНОПКА ЗВ'ЯЗКУ
   ========================= */

   const royalAutoContactFloat =
   document.querySelector(
       ".royal-auto-contact-float"
   );


   function updateRoyalAutoContactFloat() {

    if (!royalAutoContactFloat) {
        return;
    }


    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    const modal = document.querySelector('dialog[open]');
    const box = royalAutoContactFloat.getBoundingClientRect();
    const overlapsAction = [...document.querySelectorAll('button, .royal-auto-car-info, input, select, textarea')].some(el => {
        if (royalAutoContactFloat.contains(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top;
    });
    const contacts =
        document.getElementById(
            "contacts"
        );


    const contactsVisible =
        contacts &&
        contacts.getBoundingClientRect().top <
            window.innerHeight;


    royalAutoContactFloat.classList.toggle(
        "is-visible",
        window.scrollY > 350 &&
        !contactsVisible && !editing && !modal && !overlapsAction
    );
}

window.addEventListener(
   "scroll",
   updateRoyalAutoContactFloat,
   {
       passive: true
   }
);


updateRoyalAutoContactFloat();

// Royal Auto uses the existing participant-scoped chat, without a parallel inbox.
(() => {
    const current = getRoyalAutoCurrentUser();
    const owner = String(current?.id || current?.userId || '') === ROYAL_AUTO_OWNER_ID;
    for (const id of ['royalAutoChatLink', 'royalAutoChatFloat']) {
        const link = document.getElementById(id);
        if (!link) continue;
        link.href = owner ? 'profile.html?section=chats'
            : 'chat.html?withUserId=' + encodeURIComponent(ROYAL_AUTO_OWNER_ID);
        const label = owner ? 'Повідомлення клієнтів' : 'Написати Royal Auto';
        if (id === 'royalAutoChatFloat') {
            link.setAttribute('aria-label', label);
            link.title = label;
        } else link.textContent = '💬 ' + label;
    }
})();

// Read-only unread indicator. Conversation storage and permissions remain on the server.
(() => {
    const link = document.getElementById('royalAutoChatFloat');
    const badge = link?.querySelector('.royal-auto-chat-badge');
    if (!badge) return;
    async function refresh() {
        if (document.hidden) return;
        const user = getRoyalAutoCurrentUser();
        const id = String(user?.id || user?.userId || '');
        const token = localStorage.getItem('royalGarageToken');
        badge.hidden = true;
        if (!id || !token) return;
        try {
            const response = await fetch('/api/chat/conversations', {headers:{Authorization:'Bearer ' + token}});
            if (!response.ok) return;
            const data = await response.json();
            const count = (data.messages || []).filter(m =>
                String(m.receiverId) === id && !m.readAt && !m.deletedAt &&
                (id === ROYAL_AUTO_OWNER_ID || (String(m.senderId) === ROYAL_AUTO_OWNER_ID && !m.listingId))
            ).length;
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.hidden = count === 0;
            const label = id === ROYAL_AUTO_OWNER_ID ? 'Повідомлення клієнтів' : 'Написати Royal Auto';
            link.setAttribute('aria-label', label + (count ? ': непрочитаних ' + count : ''));
        } catch { /* A network failure must not invent an unread count. */ }
    }
    refresh();
    window.setInterval(refresh,60000);
    document.addEventListener('visibilitychange',refresh);
})();

window.addEventListener('resize',updateRoyalAutoContactFloat,{passive:true});
document.addEventListener('focusin',updateRoyalAutoContactFloat);
document.addEventListener('focusout',()=>requestAnimationFrame(updateRoyalAutoContactFloat));
