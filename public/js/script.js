function openAuth(type) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    if (type === "login") {
        modalBody.innerHTML = `
            <h2>Вхід</h2>
            <input type="email" id="loginEmail" placeholder="Email">
            <input type="password" id="loginPassword" placeholder="Пароль">
            <button class="gold-btn" onclick="loginUser()">Увійти</button>
        `;
    }

    if (type === "register") {
        modalBody.innerHTML = `
            <h2>Реєстрація</h2>
            <input type="text" id="regName" placeholder="Ваше ім'я">
            <input type="email" id="regEmail" placeholder="Email">
            <input type="password" id="regPassword" placeholder="Пароль">
            <button class="gold-btn" onclick="registerUser()">Зареєструватися</button>
        `;
    }

    modal.style.display = "flex";
}


function closeModal() {
    document.getElementById("modal").style.display = "none";
}


async function registerUser() {
    const name =
        document.getElementById(
            "regName"
        ).value.trim();

    const email =
        document.getElementById(
            "regEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "regPassword"
        ).value;

    if (
        !name ||
        !email ||
        !password
    ) {
        alert(
            "Заповни всі поля"
        );

        return;
    }

    try {
        const response =
            await fetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            name,
                            email,
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося зареєструватися."
            );
        }

        alert(
            `Реєстрація успішна, ${name}!`
        );

        closeModal();

    } catch (error) {
        console.error(
            "Register error:",
            error
        );

        alert(
            error.message ||
            "Не вдалося зареєструватися."
        );
    }
}


async function loginUser() {
    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    if (
        !email ||
        !password
    ) {
        alert(
            "Введи email і пароль"
        );

        return;
    }

    try {
        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося увійти."
            );
        }

        if (data.token) {
            localStorage.setItem(
                "royalGarageToken",
                data.token
            );
        }

        alert(
            `Вітаю, ${
                data.user?.name ||
                email
            }!`
        );

        closeModal();

        window.location.reload();

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        alert(
            error.message ||
            "Не вдалося увійти."
        );
    }
}


function openTopicForm() {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    modalBody.innerHTML = `
        <h2>Створити тему</h2>
        <input type="text" id="topicTitle" placeholder="Назва теми">
        <textarea id="topicText" placeholder="Опис теми"></textarea>
        <button class="gold-btn" onclick="addTopic()">Додати тему</button>
    `;

    modal.style.display = "flex";
}


function addTopic() {
    const title = document.getElementById("topicTitle").value;
    const text = document.getElementById("topicText").value;

    if (!title || !text) {
        alert("Заповни назву і опис теми");
        return;
    }

    const topicsList = document.getElementById("topicsList");

    const card = document.createElement("div");
    card.className = "topic-card";
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${text}</p>
    `;

    topicsList.prepend(card);

    closeModal();
}


function openCarForm() {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    modalBody.innerHTML = `
        <h2>Додати авто</h2>
        <input type="text" id="carName" placeholder="Марка і модель">
        <input type="text" id="carInfo" placeholder="Рік • пробіг • ціна">
        <button class="gold-btn" onclick="addCar()">Додати оголошення</button>
    `;

    modal.style.display = "flex";
}


function addCar() {
    const name = document.getElementById("carName").value;
    const info = document.getElementById("carInfo").value;

    if (!name || !info) {
        alert("Заповни всі поля");
        return;
    }

    const carsList = document.getElementById("carsList");

    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
        <h3>${name}</h3>
        <p>${info}</p>
    `;

    carsList.prepend(card);

    closeModal();
}


function searchSite() {
    const query = document.getElementById("searchInput").value.toLowerCase();

    if (!query) {
        alert("Введи слово для пошуку");
        return;
    }

    const cards = document.querySelectorAll(".topic-card, .car-card");

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();

        if (text.includes(query)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}


function quickSearch(text) {
    document.getElementById("searchInput").value = text;
    searchSite();
}

/* ===== ОСТАННІ ОГОЛОШЕННЯ НА ГОЛОВНІЙ ===== */

const HOME_MARKET_STORAGE_KEY =
    "royalGarageMarketListings";

function escapeHomeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatHomeNumber(value) {
    return new Intl.NumberFormat("uk-UA").format(
        Number(value) || 0
    );
}
async function renderHomeMarketListings() {
    const container =
        document.getElementById(
            "homeMarketListings"
        );

    if (!container) {
        return;
    }

    try {
        const response =
            await fetch(
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

        const listings =
            Array.isArray(
                data.listings
            )
                ? data.listings
                : [];

        const newestListings =
            [...listings]
                .sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            second.createdAt ||
                            second.created_at ||
                            0
                        ) -
                        new Date(
                            first.createdAt ||
                            first.created_at ||
                            0
                        )
                )
                .slice(0, 3);

        if (
            newestListings.length === 0
        ) {
            container.innerHTML = `
                <p class="empty-message">
                    Оголошень поки немає.
                </p>
            `;

            return;
        }

        container.innerHTML = "";

        newestListings.forEach(
            (listing) => {
                const photos =
                    Array.isArray(
                        listing.photos
                    )
                        ? listing.photos
                        : listing.photo
                            ? [
                                listing.photo
                            ]
                            : [];

                const activePhotoIndex =
                    Number.isInteger(
                        listing.activePhotoIndex
                    )
                        ? listing.activePhotoIndex
                        : Number.isInteger(
                            listing.active_photo_index
                        )
                            ? listing.active_photo_index
                            : 0;

                const photo =
                    photos[
                        activePhotoIndex
                    ] ||
                    photos[0] ||
                    "";

                const priceUsd =
                    listing.priceUsd ??
                    listing.price_usd ??
                    0;

                const card =
                    document.createElement(
                        "a"
                    );

                card.className =
                    "home-market-card car-card";

                card.href =
                    `listing.html?id=${
                        encodeURIComponent(
                            listing.id
                        )
                    }`;

                card.innerHTML = `
                    ${
                        photo
                            ? `
                                <img
                                    class="home-market-photo"
                                    src="${photo}"
                                    alt="${escapeHomeHtml(
                                        listing.name
                                    )}"
                                >
                            `
                            : `
                                <div class="home-market-no-photo">
                                    🚗
                                </div>
                            `
                    }

                    <div class="home-market-card-content">
                        <h3>
                            ${escapeHomeHtml(
                                listing.name
                            )}
                            (${escapeHomeHtml(
                                listing.year
                            )})
                        </h3>

                        <p class="home-market-price">
                            ${formatHomeNumber(
                                priceUsd
                            )} $
                        </p>

                        <p>
                            ${formatHomeNumber(
                                listing.mileage
                            )} км
                            •
                            ${escapeHomeHtml(
                                listing.fuel ||
                                "Пальне не вказано"
                            )}
                        </p>

                        <p>
                            📍
                            ${escapeHomeHtml(
                                listing.city ||
                                "Місто не вказано"
                            )}
                        </p>
                    </div>
                `;

                container.appendChild(
                    card
                );
            }
        );

    } catch (error) {
        console.error(
            "Home market listings load error:",
            error
        );

        container.innerHTML = `
            <p class="empty-message">
                Не вдалося завантажити оголошення.
            </p>
        `;
    }
}
document.addEventListener(
    "DOMContentLoaded",
    renderHomeMarketListings
);

/* ===== ОСТАННІ ТЕМИ ФОРУМУ НА ГОЛОВНІЙ ===== */

async function renderHomeForumTopics() {
    const container =
        document.getElementById(
            "homeForumTopics"
        );

    if (!container) {
        return;
    }

    try {
        const response =
            await fetch(
                "/api/forum/topics"
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити теми."
            );
        }

        const topics =
        (data.topics || []).map(
            (topic) => ({
                id:
                    topic.id,
    
                authorId:
                    topic.user_id,
    
                authorName:
                    topic.author_name,
    
                title:
                    topic.title,
    
                category:
                    topic.category,
    
                text:
                    topic.content,
    
                createdAt:
                    topic.created_at,
    
                replies:
                    Array.isArray(
                        topic.replies
                    )
                        ? topic.replies
                        : []
            })
        );
        const newestTopics =
        [...topics]
            .sort(
                (first, second) =>
                    new Date(
                        second.createdAt
                    ) -
                    new Date(
                        first.createdAt
                    )
            )
            .slice(0, 3);

        if (
            newestTopics.length === 0
        ) {
            container.innerHTML = `
                <p class="empty-message">
                    Тем форуму поки немає.
                </p>
            `;

            return;
        }

        container.innerHTML = "";

        newestTopics.forEach(
            (topic) => {
                const card =
                    document.createElement(
                        "a"
                    );

                    card.className =
                    "home-forum-topic car-card";

                card.href =
                    `forum.html?topicId=${
                        encodeURIComponent(
                            topic.id
                        )
                    }`;

                card.innerHTML = `
                    <h3>
                        ${escapeHomeHtml(
                            topic.title ||
                            "Без назви"
                        )}
                    </h3>

                    <p>
                        ${escapeHomeHtml(
                            topic.authorName ||
                            topic.author_name ||
                            topic.userName ||
                            topic.user_name ||
                            "Користувач"
                        )}
                    </p>
                `;

                container.appendChild(
                    card
                );
            }
        );

    } catch (error) {
        console.error(
            "Home forum topics load error:",
            error
        );

        container.innerHTML = `
            <p class="empty-message">
                Не вдалося завантажити теми форуму.
            </p>
        `;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    renderHomeForumTopics
);

/* ===== МОДАЛЬНЕ ВІКНО ROYAL AUTO ATELIER ===== */

function openAtelierModal() {
    window.location.href =
    "handmade.html";

return;
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    if (!modal || !modalBody) {
        console.error("Модальне вікно не знайдено");
        return;
    }

    modalBody.innerHTML = `
        <section class="atelier-modal">

            <p class="atelier-modal-label">
                ROYAL AUTO ATELIER
            </p>

            <h2>Послуги для вашого автомобіля</h2>

            <p class="atelier-modal-intro">
                Індивідуальні роботи з салоном, деталями
                та декоративними елементами автомобіля.
            </p>

            <div class="atelier-services">

            <a
            href="upholstery.html"
            class="atelier-service atelier-service-link"
        >
            <span class="atelier-service-icon">🪡</span>
        
            <h3>Перетяжка салону</h3>
        
            <p>
                Сидіння, дверні карти, стеля,
                кермо та інші елементи інтер’єру.
            </p>
        </a>

        <a
        href="cleaning.html"
        class="atelier-service atelier-service-link"
    >
        <span class="atelier-service-icon">
            🧼
        </span>
    
        <h3>
            Хімчистка салону
        </h3>
    
        <p>
            Глибоке очищення сидінь,
            підлоги, стелі, дверних карт
            та інших елементів салону.
        </p>
    </a>

    <a
    href="design.html"
    class="atelier-service atelier-service-link"
>
    <span class="atelier-service-icon">
        👑
    </span>

    <h3>
        Індивідуальний дизайн
    </h3>

    <p>
        Підбір матеріалів, кольорів,
        швів та авторського оформлення
        спеціально під ваш автомобіль.
    </p>
</a>

                <a
                href="handmade.html"
                class="atelier-service atelier-service-link"
            >
                <span class="atelier-service-icon">
                    ✋
                </span>
            
                <h3>
                    Ручна робота
                </h3>
            
                <p>
                    Ексклюзивні вироби, декоративні
                    елементи та авторське оформлення
                    для автомобіля.
                </p>
            </a>

            </div>
            <div class="atelier-contact-section">

            <h3 class="atelier-contact-title">
                Наші контакти
            </h3>
            <div class="atelier-social-links">

            <a
                class="atelier-social-card tiktok"
                href="https://www.tiktok.com/@royalauto73"
                target="_blank"
                rel="noopener noreferrer"
            >
                <i class="fa-brands fa-tiktok"></i>
        
                <span>
                    <strong>TikTok</strong>
                    <small>@royalauto73</small>
                </span>
            </a>
        
            <a
                class="atelier-social-card instagram"
                href="https://www.instagram.com/royalauto0077"
                target="_blank"
                rel="noopener noreferrer"
            >
                <i class="fa-brands fa-instagram"></i>
        
                <span>
                    <strong>Instagram</strong>
                    <small>@royalauto0077</small>
                </span>
            </a>
        
            <a
                class="atelier-social-card telegram"
                href="https://t.me/Vitalik25675"
                target="_blank"
                rel="noopener noreferrer"
            >
                <i class="fa-brands fa-telegram"></i>
        
                <span>
                    <strong>Telegram</strong>
                    <small>@Vitalik25675</small>
                </span>
            </a>
        
            <a
                class="atelier-social-card viber"
                href="viber://chat?number=%2B380632384348"
            >
                <i class="fa-brands fa-viber"></i>
        
                <span>
                    <strong>Viber</strong>
                    <small>+380 63 238 43 48</small>
                </span>
            </a>
        
            <a
                class="atelier-social-card viber"
                href="viber://chat?number=%2B380631974788"
            >
                <i class="fa-brands fa-viber"></i>
        
                <span>
                    <strong>Viber</strong>
                    <small>+380 63 197 47 88</small>
                </span>
            </a>
        
        </div>
        
            <img
                class="atelier-modal-logo"
                src="images/royal-auto-atelier-logo.webp"
                alt="Royal Auto Atelier"
            >
        
        </div>

        </section>
    `;

    modal.style.display = "flex";
}

