"use strict";

(async function loadProfileCommunity() {
    const root = document.querySelector("[data-community-panel]");
    if (!root) return;
    const status = root.querySelector("[role=status]");
    try {
        const response = await fetch("/api/profile/community", {
            headers: {Authorization: `Bearer ${localStorage.getItem("royalGarageToken") || ""}`}
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Увійдіть в акаунт.");
        function section(title, items, renderItem, empty) {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = `${title} · ${items.length}`;
            details.appendChild(summary);
            if (!items.length) {
                const text = document.createElement("p");
                text.textContent = empty;
                details.appendChild(text);
            }
            for (const item of items) details.appendChild(renderItem(item));
            root.appendChild(details);
        }
        function person(item) {
            const text = document.createElement("p");
            text.textContent = item.name || "Користувач";
            return text;
        }
        section("Мої клуби", data.clubs.filter(club => club.owned), club => {
            const link = document.createElement("a");
            link.href = `forum.html?club=${encodeURIComponent(club.id)}`;
            link.textContent = `${club.name} · ${club.members} учасників`;
            return link;
        }, "Ви ще не створили клуб.");
        section("Мої підписки", [...data.following, ...data.clubs.filter(club => !club.owned)], item => {
            if (!Object.hasOwn(item, "members")) return person(item);
            const link = document.createElement("a");
            link.href = `forum.html?club=${encodeURIComponent(item.id)}`;
            link.textContent = "Клуб · " + item.name;
            return link;
        }, "Підписок ще немає.");
        section("Підписники", data.followers, person, "Підписників ще немає.");
        section("Учасники моїх клубів", data.members, item => {
            const text = person(item);
            text.textContent += " · " + item.club_name;
            return text;
        }, "Нові учасники з’являться тут.");
        section("Сповіщення про підписки", data.notifications, item => {
            const text = document.createElement("p");
            text.textContent = (item.actor_name || "Користувач") + " — " + item.message;
            return text;
        }, "Нових сповіщень немає.");
        status.textContent = "";
    } catch (error) {
        status.textContent = error.message;
    }
})();
