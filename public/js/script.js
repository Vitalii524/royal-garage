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


function registerUser() {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    if (!name || !email || !password) {
        alert("Заповни всі поля");
        return;
    }

    localStorage.setItem("royalUser", JSON.stringify({
        name: name,
        email: email
    }));

    alert("Реєстрація успішна, " + name + "!");
    closeModal();
}


function loginUser() {
    const user = JSON.parse(localStorage.getItem("royalUser"));

    if (!user) {
        alert("Спочатку зареєструйся");
        return;
    }

    alert("Вітаю, " + user.name + "!");
    closeModal();
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

function renderHomeMarketListings() {
    const container =
        document.getElementById("homeMarketListings");

    if (!container) {
        return;
    }

    let listings = [];

    try {
        listings = JSON.parse(
            localStorage.getItem(
                HOME_MARKET_STORAGE_KEY
            )
        ) || [];
    } catch (error) {
        console.error(
            "Помилка завантаження оголошень:",
            error
        );
    }

    const newestListings = [...listings]
        .sort(
            (first, second) =>
                new Date(second.createdAt) -
                new Date(first.createdAt)
        )
        .slice(0, 3);

    if (newestListings.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                Оголошень поки немає.
            </p>
        `;

        return;
    }

    container.innerHTML = "";

    newestListings.forEach((listing) => {
        const photos = Array.isArray(listing.photos)
            ? listing.photos
            : listing.photo
                ? [listing.photo]
                : [];

        const activePhotoIndex =
            Number.isInteger(listing.activePhotoIndex)
                ? listing.activePhotoIndex
                : 0;

        const photo =
            photos[activePhotoIndex] ||
            photos[0] ||
            "";

        const card = document.createElement("a");

        card.className =
            "home-market-card car-card";

        card.href =
            `listing.html?id=${
                encodeURIComponent(listing.id)
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
                    ${escapeHomeHtml(listing.name)}
                    (${escapeHomeHtml(listing.year)})
                </h3>

                <p class="home-market-price">
                    ${formatHomeNumber(
                        listing.priceUsd
                    )} $
                </p>

                <p>
                    ${formatHomeNumber(
                        listing.mileage
                    )} км
                    •
                    ${escapeHomeHtml(
                        listing.fuel || "Пальне не вказано"
                    )}
                </p>

                <p>
                    📍
                    ${escapeHomeHtml(
                        listing.city || "Місто не вказано"
                    )}
                </p>
            </div>
        `;

        container.appendChild(card);
    });
}

document.addEventListener(
    "DOMContentLoaded",
    renderHomeMarketListings
);

/* ===== ОСТАННІ ТЕМИ ФОРУМУ НА ГОЛОВНІЙ ===== */

function renderHomeForumTopics() {
    const container =
        document.getElementById("homeForumTopics");

    if (!container) {
        return;
    }

    let topics = [];

    try {
        topics = JSON.parse(
            localStorage.getItem(
                "royalGarageForumTopics"
            )
        ) || [];
    } catch (error) {
        console.error(
            "Помилка завантаження тем форуму:",
            error
        );
    }

    const newestTopics = [...topics]
        .sort(
            (first, second) =>
                new Date(second.createdAt || 0) -
                new Date(first.createdAt || 0)
        )
        .slice(0, 3);

    if (newestTopics.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                Тем поки немає.
            </p>
        `;

        return;
    }

    container.innerHTML = "";

    newestTopics.forEach((topic) => {
        const card =
            document.createElement("div");

        card.className = "topic-card";
        card.tabIndex = 0;
        card.setAttribute("role", "link");

        const repliesCount =
            Array.isArray(topic.replies)
                ? topic.replies.length
                : 0;

        card.innerHTML = `
            <h3>
                ${escapeHomeHtml(topic.title)}
            </h3>

            <p>
                ${escapeHomeHtml(topic.category)}
                • ${repliesCount} відповідей
            </p>

            <p>
                ${escapeHomeHtml(
                    topic.text.length > 100
                        ? `${topic.text.slice(0, 100)}…`
                        : topic.text
                )}
            </p>
        `;

        const openForum = () => {
            window.location.href = "forum.html";
        };

        card.addEventListener("click", openForum);

        card.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                openForum();
            }
        });

        container.appendChild(card);
    });
}

document.addEventListener(
    "DOMContentLoaded",
    renderHomeForumTopics
);