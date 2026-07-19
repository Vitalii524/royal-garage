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