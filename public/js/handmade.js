"use strict";


const copyPhoneButton =
    document.getElementById(
        "copyPhoneButton"
    );


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