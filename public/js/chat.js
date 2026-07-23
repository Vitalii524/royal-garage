"use strict";

const MESSAGES_STORAGE_KEY = "royalGarageMessages";
const LISTINGS_STORAGE_KEY = "royalGarageMarketListings";

const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatMessageInput = document.getElementById("chatMessageInput");
const backToListing = document.getElementById("backToListing");
const currentUser = getCurrentUser();
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get("listingId");

function readStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        console.error("Помилка читання даних:", error);
        return [];
    }
}

const listings = readStorage(LISTINGS_STORAGE_KEY);

const listing = listings.find(
    (item) => String(item.id) === String(listingId)
);

if (!currentUser) {
    chatMessages.innerHTML = `
        <p>Спочатку увійдіть у свій профіль.</p>
    `;

    chatForm.hidden = true;
} else if (!listing) {
    chatMessages.innerHTML = `
        <p>Оголошення не знайдено.</p>
    `;

    chatForm.hidden = true;
} else {
    const sellerId = String(
        listing.ownerId || listing.userId || ""
    );

    chatTitle.textContent =
        `Чат щодо ${listing.name} (${listing.year})`;
        
        backToListing.href =
        `listing.html?id=${encodeURIComponent(listing.id)}`;
    function renderMessages() {
        const messages =
            readStorage(MESSAGES_STORAGE_KEY);

        const conversation = messages
            .filter((message) => {
                const sameListing =
                    String(message.listingId) ===
                    String(listing.id);

                const currentUserId =
                    String(currentUser.id);

                const senderId =
                    String(message.senderId);

                const receiverId =
                    String(message.receiverId);

                const betweenUsers =
                    (
                        senderId === currentUserId &&
                        receiverId === sellerId
                    ) ||
                    (
                        senderId === sellerId &&
                        receiverId === currentUserId
                    );

                return sameListing && betweenUsers;
            })
            .sort(
                (a, b) =>
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
            );

        chatMessages.innerHTML = "";

        if (conversation.length === 0) {
            chatMessages.innerHTML = `
                <p class="chat-empty">
                    Повідомлень поки немає.
                </p>
            `;
            return;
        }

        conversation.forEach((message) => {
            const messageElement =
                document.createElement("div");

            const isOwnMessage =
                String(message.senderId) ===
                String(currentUser.id);

            messageElement.className =
                isOwnMessage
                    ? "chat-message chat-message-own"
                    : "chat-message chat-message-other";

            const messageText =
                document.createElement("p");

            messageText.textContent = message.text;

            const messageTime =
                document.createElement("small");

            messageTime.textContent =
                new Date(message.createdAt)
                    .toLocaleString("uk-UA");

            messageElement.append(
                messageText,
                messageTime
            );

            chatMessages.appendChild(messageElement);
        });

        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const text =
            chatMessageInput.value.trim();

        if (!text) {
            return;
        }

        const messages =
            readStorage(MESSAGES_STORAGE_KEY);

        messages.push({
            id: Date.now().toString(),
            listingId: listing.id,
            senderId: currentUser.id,
            receiverId: sellerId,
            text: text,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem(
            MESSAGES_STORAGE_KEY,
            JSON.stringify(messages)
        );

        chatMessageInput.value = "";
        renderMessages();
    });

    renderMessages();
}