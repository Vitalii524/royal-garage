"use strict";


const upholsteryViewer =
    document.getElementById(
        "upholsteryViewer"
    );


const upholsteryViewerImage =
    document.getElementById(
        "upholsteryViewerImage"
    );


const closeUpholsteryViewer =
    document.getElementById(
        "closeUpholsteryViewer"
    );


const upholsteryGalleryItems =
    document.querySelectorAll(
        ".upholstery-gallery-item"
    );


function openUpholsteryViewer(
    imageSource,
    imageAlt
) {
    if (
        !upholsteryViewer ||
        !upholsteryViewerImage ||
        !imageSource
    ) {
        return;
    }

    upholsteryViewerImage.src =
        imageSource;

    upholsteryViewerImage.alt =
        imageAlt ||
        "Робота Royal Auto Atelier";

    upholsteryViewer.classList.add(
        "is-open"
    );

    upholsteryViewer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "upholstery-viewer-open"
    );

    if (closeUpholsteryViewer) {
        closeUpholsteryViewer.focus();
    }
}


function closeViewer() {
    if (!upholsteryViewer) {
        return;
    }

    if (
        document.activeElement &&
        upholsteryViewer.contains(
            document.activeElement
        )
    ) {
        document.activeElement.blur();
    }

    upholsteryViewer.classList.remove(
        "is-open"
    );

    upholsteryViewer.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "upholstery-viewer-open"
    );
}


upholsteryGalleryItems.forEach(
    (item) => {
        item.addEventListener(
            "click",
            () => {
                const imageSource =
                    item.dataset.image;

                const imageAlt =
                    item.textContent.trim();

                openUpholsteryViewer(
                    imageSource,
                    imageAlt
                );
            }
        );
    }
);


if (closeUpholsteryViewer) {
    closeUpholsteryViewer.addEventListener(
        "click",
        closeViewer
    );
}


if (upholsteryViewer) {
    upholsteryViewer.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                upholsteryViewer
            ) {
                closeViewer();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            upholsteryViewer?.classList.contains(
                "is-open"
            )
        ) {
            closeViewer();
        }
    }
);

const copyPhoneButton =
    document.getElementById("copyPhoneButton");

if (copyPhoneButton) {
    copyPhoneButton.addEventListener(
        "click",
        async () => {
            try {
                await navigator.clipboard.writeText(
                    "+380632384348"
                );

                copyPhoneButton.textContent =
                    "Номер скопійовано ✓";

                setTimeout(() => {
                    copyPhoneButton.textContent =
                        "Телефон: +380 63 238 43 48";
                }, 1500);
            } catch (error) {
                alert(
                    "Не вдалося скопіювати номер."
                );
            }
        }
    );
}