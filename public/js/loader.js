"use strict";

function ensureRoyalLoader() {
    let loader =
        document.getElementById(
            "royalLoader"
        );

    if (loader) {
        return loader;
    }

    loader =
        document.createElement(
            "div"
        );

    loader.id = "royalLoader";
    loader.className =
        "royal-loader is-hidden";

    loader.innerHTML = `
        <div class="royal-loader-content">
            <div class="royal-loader-logo-wrap">
                <img
                    class="royal-loader-logo"
                    src="images/royal-garage-logo.png"
                    alt="Royal Garage"
                >
            </div>

            <h1 class="royal-loader-title">
                ROYAL GARAGE
            </h1>

            <p class="royal-loader-text">
                <span data-i18n="loader.text">Завантажуємо ваш автосвіт...</span>
            </p>

            <div class="royal-loader-line"></div>
        </div>
    `;

    document.body.prepend(
        loader
    );

    return loader;
}

/* =========================
   ROYAL GARAGE LOADER
   ========================= */

   const royalLoader =
   ensureRoyalLoader();

function hideRoyalLoader() {
    if (!royalLoader) {
        return;
    }

    royalLoader.classList.add(
        "is-hidden"
    );

  
}

function showRoyalLoader() {
    if (!royalLoader) {
        return;
    }

    royalLoader.classList.remove(
        "is-hidden"
    );
}

window.addEventListener(
    "load",
    () => {
        setTimeout(
            hideRoyalLoader,
            450
        );
    }
);

document.addEventListener(
    "click",
    (event) => {
        const link =
            event.target.closest("a");

        if (!link) {
            return;
        }

        const href =
            link.getAttribute("href");

        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            link.target === "_blank"
        ) {
            return;
        }

        event.preventDefault();

        showRoyalLoader();

        setTimeout(
            () => {
                window.location.href =
                    link.href;
            },
            300
        );
    }
);