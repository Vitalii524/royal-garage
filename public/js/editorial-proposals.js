(() => {
    const panel = document.getElementById("editorialProposalPanel");
    if (!panel) return;
    const form = document.getElementById("editorialProposalForm");
    const select = form.elements.recipient;
    const preview = document.getElementById("editorialProposalPreview");
    const send = document.getElementById("editorialProposalSend");
    const status = document.getElementById("editorialProposalStatus");
    const history = document.getElementById("editorialProposalHistory");
    let draft;

    async function api(path, body) {
        const response = await fetch(path, {
            method: body ? "POST" : "GET",
            cache: "no-store",
            headers: { Authorization: `Bearer ${localStorage.getItem("royalGarageToken") || ""}`, "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Дія недоступна.");
        return result;
    }

    async function refresh() {
        const [directory, sent] = await Promise.all([api("/api/businesses/featured"), api("/api/editorial/proposals")]);
        const recipients = new Set(sent.proposals.map(item => item.recipientId));
        select.replaceChildren(new Option("Оберіть бізнес", ""), ...directory.businesses
            .filter(business => !recipients.has(business.ownerId))
            .map(business => new Option(business.businessName, business.ownerId)));
        history.replaceChildren(...sent.proposals.map(item => {
            const li = document.createElement("li");
            li.textContent = `${new Date(item.sentAt).toLocaleString("uk-UA")} · ${item.recipientName} · ${item.text}`;
            return li;
        }));
    }

    panel.addEventListener("toggle", () => {
        if (panel.open) refresh().catch(error => { status.textContent = error.message; });
    });
    form.addEventListener("input", () => {
        draft = undefined;
        preview.hidden = true;
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        const text = form.elements.message.value.trim();
        if (!select.value || !text) return;
        draft = { recipientId: select.value, recipientName: select.selectedOptions[0].text, text };
        document.getElementById("editorialProposalRecipient").textContent = draft.recipientName;
        document.getElementById("editorialProposalText").textContent = text;
        preview.hidden = false;
    });
    send.addEventListener("click", async () => {
        if (!draft) return;
        send.disabled = true;
        try {
            await api("/api/editorial/proposals", { ...draft, confirmed: true });
            draft = undefined;
            preview.hidden = true;
            form.reset();
            status.textContent = "Пропозицію надіслано в чат.";
            await refresh();
        } catch (error) {
            status.textContent = error.message;
        } finally {
            send.disabled = false;
        }
    });
})();
