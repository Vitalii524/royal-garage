"use strict";

/* =========================
   ROYAL GARAGE LOADER
   ========================= */

const royalLoader =
    document.getElementById(
        "royalLoader"
    );

function hideRoyalLoader() {
    if (!royalLoader) {
        return;
    }

    royalLoader.classList.add(
        "is-hidden"
    );

    setTimeout(
        () => {
            royalLoader.remove();
        },
        500
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