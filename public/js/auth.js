"use strict";

const USERS_KEY = "royalGarageUsers";
const isPartnerDirectory = /^\/businesses(?:\.html)?$/.test(location.pathname);
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

                <button
                    type="button"
                    class="forgot-password-btn hidden"
                    id="resendVerificationButton"
                >
                    Надіслати лист повторно
                </button>

                <button class="gold-btn" type="submit">
                    Увійти
                </button>
            </form>

            <form id="registerForm" class="auth-form hidden">
                <h2>Реєстрація</h2>
<div id="rgRegistrationOffer" role="note" style="margin:12px 0;padding:12px 14px;border:1px solid rgba(214,160,58,.45);border-radius:10px;background:rgba(214,160,58,.07);line-height:1.5;font-size:14px">
  <strong>🎁 Акція для користувачів Royal Garage</strong>
  <p style="margin:6px 0 0">Перше оголошення безкоштовне для кожного. Перші 100 учасників отримують постійний статус «ПЕРШИЙ» і 3 безкоштовні оголошення загалом.</p>
</div>


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
        placeholder="+380... / +1..."
        required
    >
    <small>Для особистого акаунта підтвердження номера необов’язкове.</small>
</label>

<label>
    Тип акаунта

    <select
        id="registerAccountType"
        required
    >
        <option value="user">
            Звичайний користувач
        </option>

        ${isPartnerDirectory ? `<option value="business">
            Бізнес
        </option>` : ""}
    </select>
</label>
${isPartnerDirectory ? "" : '<p><a href="/businesses.html?register=business" style="display:block;padding:12px 14px;border:1px solid #d6a03a;border-radius:10px;background:#d6a03a;color:#191919;text-align:center;text-decoration:none;font-weight:700;line-height:1.4;white-space:normal">Зареєструвати бізнес у «Партнерах»</a></p>'}


<div
    id="businessRegistrationFields"
    class="hidden"
>
<div id="rgBusinessRegistrationOffer" role="note" style="margin:12px 0;padding:12px 14px;border:1px solid rgba(214,160,58,.45);border-radius:10px;background:rgba(214,160,58,.07);line-height:1.5;font-size:14px">
  <strong>🎁 Акції для автобізнесу</strong>
  <p style="margin:6px 0">Автомайданчики — безкоштовно до 31.12.2027. Перші 50 бізнесів — безкоштовно до 31.12.2027 за умовами акції.</p>
  <p style="margin:6px 0">Для наступних бізнесів передбачено 3 місяці безкоштовного доступу, після чого діє тариф. Наявність акційного місця й остаточні умови необхідно підтвердити під час оформлення.</p>
</div>
    <label>
        Тип бізнесу

        <select
            id="registerBusinessType"
        >
            <option value="">
                Оберіть тип бізнесу
            </option>
        </select>
    </label>

    <fieldset id="registerBusinessContentTypeField" class="hidden" style="margin-top:14px;">
        <legend>Що пропонує ваш бізнес?</legend>
        <label><input type="radio" name="registerBusinessContentType" value="services"> Послуги</label>
        <label><input type="radio" name="registerBusinessContentType" value="products"> Товари</label>
        <label><input type="radio" name="registerBusinessContentType" value="both"> Послуги та товари</label>
    </fieldset>
</div>

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

    const accountTypeSelect =
    document.getElementById(
        "registerAccountType"
    );

const businessFields =
    document.getElementById(
        "businessRegistrationFields"
    );

const businessTypeSelect =
    document.getElementById(
        "registerBusinessType"
    );

const businessContentTypeField =
    document.getElementById(
        "registerBusinessContentTypeField"
    );

async function loadBusinessTypes() {
    try {
        const response =
            await fetch(
                "/api/business/types"
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити типи бізнесу."
            );
        }

        businessTypeSelect.innerHTML = `
            <option value="">
                Оберіть тип бізнесу
            </option>
        `;

        data.types.forEach((type) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value = type.code;
            option.textContent = type.name;

            businessTypeSelect.appendChild(
                option
            );
        });

    } catch (error) {
        console.error(
            "Business types load error:",
            error
        );
    }
}

accountTypeSelect
    ?.addEventListener(
        "change",
        async () => {
            const isBusiness =
                accountTypeSelect.value ===
                "business";

            businessFields
                ?.classList.toggle(
                    "hidden",
                    !isBusiness
                );

            businessTypeSelect.required =
                isBusiness;

            if (isBusiness) {
                await loadBusinessTypes();
            } else {
                businessTypeSelect.value = "";
                businessContentTypeField?.classList.add("hidden");
                document
                    .querySelectorAll('input[name="registerBusinessContentType"]')
                    .forEach((input) => { input.checked = false; input.required = false; });

            }
        }
    );

businessTypeSelect
    ?.addEventListener(
        "change",
        async () => {
            const businessType =
                businessTypeSelect.value;

            const isOther = businessType === "other";
            businessContentTypeField?.classList.toggle("hidden", !isOther);
            document
                .querySelectorAll('input[name="registerBusinessContentType"]')
                .forEach((input) => {
                    input.required = isOther;
                    if (!isOther) input.checked = false;
                });

            if (!businessType) {
                return;
            }
        }
    );

    const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener(
            "click",
            async () => {
    
                const email =
                    prompt(
                        "Введіть email, який ви використовували під час реєстрації:"
                    );
    
                if (!email) {
                    return;
                }
    
                try {
    
                    const response =
                        await fetch(
                            "/api/forgot-password",
                            {
                                method: "POST",
    
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
    
                                body:
                                    JSON.stringify({
                                        email
                                    })
                            }
                        );
    
                    const data =
                        await response.json();
    
                    alert(
                        data.message ||
                        "Інструкцію для відновлення надіслано на email."
                    );
    
                } catch (error) {
    
                    console.error(
                        "Forgot password error:",
                        error
                    );
    
                    alert(
                        "Не вдалося надіслати лист для відновлення пароля."
                    );
                }
            }
        );
    }

    const resendVerificationButton =
    document.getElementById(
        "resendVerificationButton"
    );

if (resendVerificationButton) {
    resendVerificationButton.addEventListener(
        "click",
        async () => {
            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    ?.value
                    .trim()
                    .toLowerCase();

            if (!email) {
                alert(
                    "Введіть email."
                );
                return;
            }

            resendVerificationButton.disabled =
                true;

            try {
                const response =
                    await fetch(
                        "/api/resend-verification-email",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email
                                })
                        }
                    );

                const data =
                    await response.json();

                alert(
                    data.message ||
                    "Лист для підтвердження надіслано."
                );

            } catch (error) {
                console.error(
                    "Resend verification error:",
                    error
                );

                alert(
                    "Не вдалося повторно надіслати лист."
                );

            } finally {
                resendVerificationButton.disabled =
                    false;
            }
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

function submitRegistrationLiqPay(data) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.checkoutUrl;

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = data.data;

    const signatureInput = document.createElement("input");
    signatureInput.type = "hidden";
    signatureInput.name = "signature";
    signatureInput.value = data.signature;

    form.append(dataInput, signatureInput);
    document.body.appendChild(form);
    form.submit();
}

async function startRegistrationBusinessPayment(registrationPaymentToken) {
    const response = await fetch(
        "/api/payments/liqpay/business-registration",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registrationPaymentToken })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Не вдалося відкрити оплату тарифу.");
    }

    submitRegistrationLiqPay(data);
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

    const resendVerificationButton =
    document.getElementById(
        "resendVerificationButton"
    );

resendVerificationButton
    ?.classList.add(
        "hidden"
    );

    if (name.length < 2) {
        errorElement.textContent =
            "Ім’я повинно містити щонайменше 2 символи.";
        return;
    }

    if (!/^\d{8,15}$/.test(phone)) {
        errorElement.textContent =
            "Введіть правильний номер телефону з кодом країни.";
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

    const accountType =
        document.getElementById(
            "registerAccountType"
        )?.value || "user";

    const businessContentType =
        document.querySelector(
            'input[name="registerBusinessContentType"]:checked'
        )?.value || "";

    try {
        const response = await fetch(
            accountType === "business" ? "/api/business/register" : "/api/register",
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
                    password,
                
                    accountType,
                
                    businessType:
                        document.getElementById(
                            "registerBusinessType"
                        )?.value || "",

                    businessContentType
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

        document
        .getElementById(
            "registerForm"
        )
        .reset();
    
    alert(
        data.message ||
        "Реєстрація успішна. Перевірте пошту та підтвердьте email."
    );
    
    switchAuthTab("login");
    
    const loginEmail =
        document.getElementById(
            "loginEmail"
        );
    
    if (loginEmail) {
        loginEmail.value =
            data.user?.email || "";
    }

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
                if (
                    response.status === 402 &&
                    data.code === "BUSINESS_PAYMENT_REQUIRED" &&
                    data.registrationPaymentToken
                ) {
                    errorElement.textContent =
                        "Тариф ще не активний. Відкриваю оплату…";

                    await startRegistrationBusinessPayment(
                        data.registrationPaymentToken
                    );
                    return;
                }

                errorElement.textContent =
                    data.message ||
                    "Не вдалося увійти.";
            
                if (
                    response.status === 403
                ) {
                    resendVerificationButton
                        ?.classList.remove(
                            "hidden"
                        );
                }
            
                return;
            }

        saveCurrentUser(data.user);

        localStorage.setItem(
            "royalGarageToken",
            data.token
        );

        if (data.user?.role === "admin") {
            localStorage.setItem("rgExcludeAnalytics", "1");
            window["ga-disable-G-NS6FGLSFVX"] = true;
        }
        if (typeof gtag === "function" && data.user?.role !== "admin") {
            gtag("event", "login", {
                method: "email"
            });
        }

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
    const accountActions = document.querySelector("[data-rg-account-actions]");

    if (!authArea) {
        return;
    }

    const currentUser = getCurrentUser();
    if (accountActions) accountActions.replaceChildren();

    if (!currentUser) {
        authArea.replaceChildren();
        (accountActions || authArea).innerHTML = `
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

    const profileUrl = String(currentUser.id || currentUser.userId || "") === "32ce413e-9eb6-417a-b99a-77d9ca7c144a"
        ? "royal-auto-admin.html"
        : currentUser.accountType === "business" ||
    currentUser.account_type === "business"
        ? "business-profile.html"
        : "profile.html";

        document
        .querySelectorAll(
            'a[href="profile.html"], #profileNavLink'
        )
        .forEach((link) => {
            link.href =
                profileUrl;
        });

    authArea.innerHTML = `
        <div class="logged-user">
            <a href="${profileUrl}">
                👤 ${escapeHtml(currentUser.name)}
            </a>
        </div>
    `;
    (accountActions || authArea).insertAdjacentHTML("beforeend", `
        ${accountActions ? `
            <a href="/royal-auto-admin.html#platformAdmin" data-rg-admin-link hidden>Адмінпанель</a>
        ` : ""}
        <button
            type="button"
            class="logout-button"
            id="logoutButton">
            ${typeof window.t === "function"
                ? window.t("auth.logout", "Вийти")
                : "Вийти"}
        </button>
    `);

    document
        .getElementById("logoutButton")
        .addEventListener("click", logoutUser);
    refreshHeaderAdminLink();
}

async function refreshHeaderAdminLink() {
    const link = document.querySelector('[data-rg-account-actions] [data-rg-admin-link]');
    const token = localStorage.getItem('royalGarageToken');
    if (!link || !token) return;
    link.hidden = true;
    try {
        const response = await fetch('/api/profile', {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const { user } = await response.json();
        if (link.isConnected && localStorage.getItem('royalGarageToken') === token) {
            link.hidden = user?.role !== 'admin';
        }
    } catch {
        // Keep the administration entry hidden until the server confirms access.
    }
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshHeaderAdminLink();
});
window.addEventListener('storage', event => {
    if (event.key === SESSION_KEY || event.key === 'royalGarageToken') renderAuthArea();
});

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

    const params = new URLSearchParams(window.location.search);
    if (isPartnerDirectory) {
        const registerButton = document.getElementById("partnerRegistration");
        const openBusinessRegistration = () => {
            openAuthModal("register");
            const type = document.getElementById("registerAccountType");
            type.value = "business";
            type.dispatchEvent(new Event("change"));
        };
        if (getCurrentUser() && registerButton) registerButton.hidden = true;
        else if (params.get("register") === "business") openBusinessRegistration();
        registerButton?.addEventListener("click", openBusinessRegistration);
    }
    const syncRegistrationOffer = () => {
        const business = document.getElementById("registerAccountType")?.value === "business";
        const userOffer = document.getElementById("rgRegistrationOffer");
        const businessOffer = document.getElementById("rgBusinessRegistrationOffer");
        if (userOffer) userOffer.hidden = business;
        if (businessOffer) businessOffer.hidden = !business;
    };
    document.getElementById("registerAccountType")?.addEventListener("change", syncRegistrationOffer);
    syncRegistrationOffer();
    const registrationType = params.get("register");
    if (registrationType === "user" || registrationType === "business") {
        openAuthModal("register");
        const accountType = document.getElementById("registerAccountType");
        if (accountType) {
            accountType.value = registrationType;
            accountType.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
    if (params.get("businessPayment") === "return") {
        setTimeout(() => {
            openAuthModal("login");
            const loginError = document.getElementById("loginError");
            if (loginError) {
                loginError.textContent =
                    "Оплату прийнято. Увійдіть у бізнес-профіль та підтвердьте email і номер телефону.";
            }
        }, 0);
    }
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

document.addEventListener(
    "royalGarageLanguageChange",
    () => {
        renderAuthArea();
    }
);
