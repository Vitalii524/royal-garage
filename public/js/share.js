(() => {
    async function copy(button, url) {
        try {
            await navigator.clipboard.writeText(url);
            const label = button.textContent;
            button.disabled = true;
            button.textContent = "✓ Посилання скопійовано";
            setTimeout(() => {
                button.textContent = label;
                button.disabled = false;
            }, 2000);
        } catch {
            window.prompt("Скопіюйте посилання", url);
        }
    }

    window.RGShare = {
        bind(button, getData, copyButton) {
            if (!button) return;
            button.onclick = async () => {
                const data = getData();
                if (typeof navigator.share === "function") {
                    try {
                        await navigator.share(data);
                        return;
                    } catch (error) {
                        if (error.name === "AbortError") return;
                    }
                }
                await copy(copyButton || button, data.url);
            };
            if (copyButton) copyButton.onclick = () => copy(copyButton, getData().url);
        }
    };

    const business = document.querySelector("[data-share-business]");
    if (business) {
        const meta = property => document.querySelector(`meta[property="og:${property}"]`)?.content;
        window.RGShare.bind(business, () => ({
            title: meta("title") || document.title,
            text: meta("description") || "",
            url: new URL(location.pathname, location.origin).href
        }), document.getElementById("copyBusinessLink"));
    }
})();
