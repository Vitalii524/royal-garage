(() => {
    const form = document.getElementById("aboutContactForm");

    if (!form) {
        return;
    }

    const submitButton = document.getElementById("contactSubmitButton");
    const statusElement = document.getElementById("contactFormStatus");

    const setStatus = (message, type = "") => {
        statusElement.textContent = message;

        statusElement.classList.remove(
            "is-success",
            "is-error"
        );

        if (type) {
            statusElement.classList.add(type);
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        setStatus("");

        if (!form.reportValidity()) {
            return;
        }

        const formData = new FormData(form);

        const payload = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            subject: String(formData.get("subject") || "").trim(),
            message: String(formData.get("message") || "").trim(),
            website: String(formData.get("website") || "").trim()
        };

        if (
            !payload.name ||
            !payload.email ||
            !payload.subject ||
            !payload.message
        ) {
            setStatus(
                "Заповніть усі обов’язкові поля.",
                "is-error"
            );

            return;
        }

        submitButton.disabled = true;

        const originalButtonHtml = submitButton.innerHTML;

        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Надсилаємо...</span>
        `;

        try {
            const response = await fetch("/api/contact", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            });

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося надіслати повідомлення."
                );
            }

            form.reset();

            setStatus(
                data.message ||
                "Повідомлення надіслано. Дякуємо!",
                "is-success"
            );

        } catch (error) {

            setStatus(
                error.message ||
                "Не вдалося надіслати повідомлення. Спробуйте ще раз.",
                "is-error"
            );

        } finally {

            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    });
})();