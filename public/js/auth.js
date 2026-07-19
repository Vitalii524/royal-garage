"use strict";

const USERS_KEY = "royalGarageUsers";
const SESSION_KEY = "royalGarageCurrentUser";

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function saveCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function removeCurrentUser() {
    localStorage.removeItem(SESSION_KEY);
}

function createAuthModal() {
    if (document.getElementById("authModal")) {
        return;
    }

    const modal = document.createElement("div");
    modal.id = "authModal";
    modal.className = "auth-modal";

    modal.innerHTML = `
        <div class="auth-window">
            <button
                type="button"
                class="auth-close"
                id="closeAuthModal"
                aria-label="Закрити">
                ×
            </button>

            <div class="auth-tabs">
                <button
                    type="button"
                    class="auth-tab active"
                    data-auth-tab="login">
                    Увійти
                </button>

                <button
                    type="button"
                    class="auth-tab"
                    data-auth-tab="register">
                    Реєстрація
                </button>
            </div>

            <form id="loginForm" class="auth-form">
                <h2>Вхід</h2>

                <label>
                    Email
                    <input
                        type="email"
                        id="loginEmail"
                        autocomplete="email"
                        required>
                </label>

                <label>
                    Пароль
                    <input
                        type="password"
                        id="loginPassword"
                        autocomplete="current-password"
                        required>
                </label>

                <p class="auth-error" id="loginError"></p>

                <button class="gold-btn" type="submit">
                    Увійти
                </button>
            </form>

            <form id="registerForm" class="auth-form hidden">
                <h2>Реєстрація</h2>

                <label>
                    Ім’я
                    <input
                        type="text"
                        id="registerName"
                        minlength="2"
                        autocomplete="name"
                        required>
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        id="registerEmail"
                        autocomplete="email"
                        required>
                </label>

                <label>
                    Пароль
                    <input
                        type="password"
                        id="registerPassword"
                        minlength="6"
                        autocomplete="new-password"
                        required>
                </label>

                <label>
                    Повтори пароль
                    <input
                        type="password"
                        id="registerPasswordRepeat"
                        minlength="6"
                        autocomplete="new-password"
                        required>
                </label>

                <p class="auth-error" id="registerError"></p>

                <button class="gold-btn" type="submit">
                    Зареєструватися
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("closeAuthModal")
        .addEventListener("click", closeAuthModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeAuthModal();
        }
    });

    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            switchAuthTab(button.dataset.authTab);
        });
    });

    document
        .getElementById("registerForm")
        .addEventListener("submit", registerUser);

    document
        .getElementById("loginForm")
        .addEventListener("submit", loginUser);
}

function openAuthModal(tab = "login") {
    createAuthModal();
    switchAuthTab(tab);

    document
        .getElementById("authModal")
        .classList.add("auth-modal-open");
}

function closeAuthModal() {
    document
        .getElementById("authModal")
        ?.classList.remove("auth-modal-open");
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.authTab === tab
        );
    });

    loginForm.classList.toggle("hidden", tab !== "login");
    registerForm.classList.toggle("hidden", tab !== "register");
}

function registerUser(event) {
    event.preventDefault();

    const name = document
        .getElementById("registerName")
        .value
        .trim();

    const email = document
        .getElementById("registerEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
        document.getElementById("registerPassword").value;

    const passwordRepeat =
        document.getElementById("registerPasswordRepeat").value;

    const errorElement =
        document.getElementById("registerError");

    errorElement.textContent = "";

    if (name.length < 2) {
        errorElement.textContent =
            "Ім’я повинно містити щонайменше 2 символи.";
        return;
    }

    if (password.length < 6) {
        errorElement.textContent =
            "Пароль повинен містити щонайменше 6 символів.";
        return;
    }

    if (password !== passwordRepeat) {
        errorElement.textContent = "Паролі не збігаються.";
        return;
    }

    const users = getUsers();

    const userExists = users.some(
        (user) => user.email === email
    );

    if (userExists) {
        errorElement.textContent =
            "Користувач із таким email вже зареєстрований.";
        return;
    }

    const newUser = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    saveCurrentUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    });

    document.getElementById("registerForm").reset();

    closeAuthModal();
    renderAuthArea();

    alert(`Вітаємо, ${name}! Реєстрація успішна.`);
}

function loginUser(event) {
    event.preventDefault();

    const email = document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
        document.getElementById("loginPassword").value;

    const errorElement =
        document.getElementById("loginError");

    errorElement.textContent = "";

    const users = getUsers();

    const user = users.find(
        (item) =>
            item.email === email &&
            item.password === password
    );

    if (!user) {
        errorElement.textContent =
            "Неправильний email або пароль.";
        return;
    }

    saveCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email
    });

    document.getElementById("loginForm").reset();

    closeAuthModal();
    renderAuthArea();
}

function logoutUser() {
    removeCurrentUser();
    renderAuthArea();
}

function renderAuthArea() {
    const authArea = document.getElementById("authArea");

    if (!authArea) {
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
        authArea.innerHTML = `
            <button
                type="button"
                class="auth-header-button"
                id="loginButton">
                Увійти
            </button>

            <button
                type="button"
                class="auth-header-button auth-register-button"
                id="registerButton">
                Реєстрація
            </button>
        `;

        document
            .getElementById("loginButton")
            .addEventListener("click", () => {
                openAuthModal("login");
            });

        document
            .getElementById("registerButton")
            .addEventListener("click", () => {
                openAuthModal("register");
            });

        return;
    }

    authArea.innerHTML = `
        <div class="logged-user">
            <a href="profile.html">
                👤 ${escapeHtml(currentUser.name)}
            </a>

            <button
                type="button"
                class="logout-button"
                id="logoutButton">
                Вийти
            </button>
        </div>
    `;

    document
        .getElementById("logoutButton")
        .addEventListener("click", logoutUser);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    createAuthModal();
    renderAuthArea();
});