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
        const user = JSON.parse(
            localStorage.getItem(SESSION_KEY)
        );

        if (!user) {
            return null;
        }

        return {
            ...user,
            accountType:
                user.accountType || "user",
            role:
                user.role || "user"
        };
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
              
                <div class="password-field">
                  <input
                    type="password"
                    id="loginPassword"
                    autocomplete="current-password"
                    required
                  >
              
                  <button
                    type="button"
                    class="toggle-password"
                    data-target="loginPassword"
                    aria-label="Показати пароль"
                  >
                    👁
                  </button>
                </div>
              </label>
              <button
  type="button"
  class="forgot-password-btn"
  id="forgotPasswordButton"
>
  Забули пароль?
</button>
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
    Номер телефону
    <input
        type="tel"
        id="registerPhone"
        autocomplete="tel"
        placeholder="+380..."
        required
    >
</label>

                <label>
                Пароль
              
                <div class="password-field">
                  <input
                    type="password"
                    id="registerPassword"
                    minlength="6"
                    autocomplete="new-password"
                    required
                  >
              
                  <button
                    type="button"
                    class="toggle-password"
                    data-target="registerPassword"
                    aria-label="Показати пароль"
                  >
                    👁
                  </button>
                </div>
              </label>

              <label>
              Повтори пароль
            
              <div class="password-field">
                <input
                  type="password"
                  id="registerPasswordRepeat"
                  minlength="6"
                  autocomplete="new-password"
                  required
                >
            
                <button
                  type="button"
                  class="toggle-password"
                  data-target="registerPasswordRepeat"
                  aria-label="Показати пароль"
                >
                  👁
                </button>
              </div>
            </label>

                <p class="auth-error" id="registerError"></p>

                <button class="gold-btn" type="submit">
                    Зареєструватися
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener(
            "click",
            () => {
                alert(
                    "Відновлення пароля через email зараз налаштовується."
                );
            }
        );
    }

    document.querySelectorAll(".toggle-password").forEach((button) => {
        button.addEventListener("click", () => {
          const inputId = button.dataset.target;
          const passwordInput = document.getElementById(inputId);
      
          if (!passwordInput) return;
      
          const passwordIsHidden = passwordInput.type === "password";
      
          passwordInput.type = passwordIsHidden ? "text" : "password";
          button.textContent = passwordIsHidden ? "🙈" : "👁";
          button.setAttribute(
            "aria-label",
            passwordIsHidden ? "Приховати пароль" : "Показати пароль"
          );
        });
      });

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

function normalizePhone(value) {
    const digits =
        String(value || "")
            .replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (
        digits.length === 10 &&
        digits.startsWith("0")
    ) {
        return `380${digits.slice(1)}`;
    }

    if (
        digits.length === 12 &&
        digits.startsWith("380")
    ) {
        return digits;
    }

    return digits;
}

async function registerUser(event) {
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

    const phone = normalizePhone(
        document
            .getElementById("registerPhone")
            .value
    );

    const password =
        document.getElementById(
            "registerPassword"
        ).value;

    const passwordRepeat =
        document.getElementById(
            "registerPasswordRepeat"
        ).value;

    const errorElement =
        document.getElementById(
            "registerError"
        );

    errorElement.textContent = "";

    if (name.length < 2) {
        errorElement.textContent =
            "Ім’я повинно містити щонайменше 2 символи.";
        return;
    }

    if (!/^380\d{9}$/.test(phone)) {
        errorElement.textContent =
            "Введи правильний український номер телефону.";
        return;
    }

    if (password.length < 6) {
        errorElement.textContent =
            "Пароль повинен містити щонайменше 6 символів.";
        return;
    }

    if (password !== passwordRepeat) {
        errorElement.textContent =
            "Паролі не збігаються.";
        return;
    }

    try {
        const response = await fetch(
            "/api/register",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            errorElement.textContent =
                data.message ||
                "Не вдалося зареєструватися.";
            return;
        }

        saveCurrentUser(data.user);

        document
            .getElementById(
                "registerForm"
            )
            .reset();

        closeAuthModal();
        renderAuthArea();
    } catch (error) {
        console.error(
            "Registration request error:",
            error
        );

        errorElement.textContent =
            "Не вдалося з’єднатися із сервером.";
    }
}

async function loginUser(event) {
    event.preventDefault();

    const email = document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    const errorElement =
        document.getElementById(
            "loginError"
        );

    errorElement.textContent = "";

    try {
        const response = await fetch(
            "/api/login",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            errorElement.textContent =
                data.message ||
                "Не вдалося увійти.";
            return;
        }

        saveCurrentUser(data.user);

        localStorage.setItem(
            "royalGarageToken",
            data.token
        );

        document
            .getElementById(
                "loginForm"
            )
            .reset();

        closeAuthModal();
        renderAuthArea();
    } catch (error) {
        console.error(
            "Login request error:",
            error
        );

        errorElement.textContent =
            "Не вдалося з’єднатися із сервером.";
    }
}

function logoutUser() {
    removeCurrentUser();
    localStorage.removeItem("royalGarageToken");
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

/* ===== КНОПКА "ВГОРУ" ===== */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        let backToTopButton =
            document.getElementById(
                "backToTopButton"
            );

        if (!backToTopButton) {
            backToTopButton =
                document.createElement(
                    "button"
                );

            backToTopButton.type =
                "button";

            backToTopButton.id =
                "backToTopButton";

            backToTopButton.className =
                "back-to-top-button";

            backToTopButton.setAttribute(
                "aria-label",
                "Повернутися вгору"
            );

            backToTopButton.innerHTML =
                "↑";

            document.body.appendChild(
                backToTopButton
            );
        }

        function updateBackToTopButton() {
            backToTopButton.classList.toggle(
                "is-visible",
                window.scrollY > 350
            );
        }

        backToTopButton.addEventListener(
            "click",
            () => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );

        window.addEventListener(
            "scroll",
            updateBackToTopButton,
            {
                passive: true
            }
        );

        updateBackToTopButton();
    }
);