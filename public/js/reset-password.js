"use strict";


const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );

const newPasswordInput =
    document.getElementById(
        "newPassword"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

const resetPasswordMessage =
    document.getElementById(
        "resetPasswordMessage"
    );


const params =
    new URLSearchParams(
        window.location.search
    );

const resetToken =
    params.get("token");


function showResetMessage(
    message,
    isError = false
) {
    if (!resetPasswordMessage) {
        return;
    }

    resetPasswordMessage.textContent =
        message;

    resetPasswordMessage.style.color =
        isError
            ? "#ff8b8b"
            : "#e8c56a";
}


if (!resetToken) {
    showResetMessage(
        "Посилання для відновлення пароля недійсне.",
        true
    );

    if (resetPasswordForm) {
        resetPasswordForm.hidden =
            true;
    }
}


resetPasswordForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const newPassword =
            newPasswordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (newPassword.length < 6) {
            showResetMessage(
                "Пароль має містити щонайменше 6 символів.",
                true
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {
            showResetMessage(
                "Паролі не співпадають.",
                true
            );

            return;
        }


        try {
            showResetMessage(
                "Змінюємо пароль..."
            );


            const response =
                await fetch(
                    "/api/reset-password",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                token:
                                    resetToken,

                                newPassword
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося змінити пароль."
                );
            }


            if (
                !data.token ||
                !data.user
            ) {
                throw new Error(
                    "Пароль змінено, але не вдалося створити сесію."
                );
            }


            localStorage.setItem(
                "royalGarageToken",
                data.token
            );

            localStorage.setItem(
                "royalGarageCurrentUser",
                JSON.stringify(
                    data.user
                )
            );


            showResetMessage(
                "Пароль успішно змінено."
            );


            resetPasswordForm.reset();


            setTimeout(
                () => {
                    window.location.href =
                        "profile.html";
                },
                1200
            );


        } catch (error) {
            console.error(
                "Reset password error:",
                error
            );


            showResetMessage(
                error.message ||
                "Не вдалося змінити пароль.",
                true
            );
        }
    }
);