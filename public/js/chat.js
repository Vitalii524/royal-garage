"use strict";

const MESSAGES_STORAGE_KEY = "royalGarageMessages";
const LISTINGS_STORAGE_KEY = "royalGarageMarketListings";

const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 1.5 * 1024 * 1024;

const IMAGE_MAX_WIDTH = 1280;
const IMAGE_MAX_HEIGHT = 1280;
const IMAGE_QUALITY = 0.75;

const chatTitle =
    document.getElementById("chatTitle");

const chatMessages =
    document.getElementById("chatMessages");

const chatForm =
    document.getElementById("chatForm");

const chatMessageInput =
    document.getElementById("chatMessageInput");

const chatBackLink =
    document.getElementById("chatBackLink");

const chatAttachmentInput =
    document.getElementById("chatAttachmentInput");

const chatAttachmentPreview =
    document.getElementById("chatAttachmentPreview");

const chatAttachmentContent =
    document.getElementById("chatAttachmentContent");

const removeChatAttachment =
    document.getElementById("removeChatAttachment");

const chatFileError =
    document.getElementById("chatFileError");

const chatSubmitButton =
    document.getElementById("chatSubmitButton");

const chatImageViewer =
    document.getElementById("chatImageViewer");

const chatImageViewerPhoto =
    document.getElementById("chatImageViewerPhoto");

const closeChatImageViewer =
    document.getElementById("closeChatImageViewer");

const currentUser = getCurrentUser();

const urlParams =
    new URLSearchParams(window.location.search);

const listingId =
    urlParams.get("listingId");

const withUserId =
    urlParams.get("withUserId");

let selectedAttachment = null;
let isSendingMessage = false;

function readStorage(key) {
    try {
        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : [];
    } catch (error) {
        console.error(
            "Помилка читання даних:",
            error
        );

        return [];
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            "Помилка збереження даних:",
            error
        );

        showFileError(
            "У браузері недостатньо місця. " +
            "Видаліть частину старих повідомлень " +
            "або виберіть менший файл."
        );

        return false;
    }
}

function showFileError(message) {
    if (!chatFileError) {
        return;
    }

    chatFileError.textContent = message;
    chatFileError.hidden = false;
}

function clearFileError() {
    if (!chatFileError) {
        return;
    }

    chatFileError.textContent = "";
    chatFileError.hidden = true;
}

function generateMessageId() {
    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} Б`;
    }

    if (bytes < 1024 * 1024) {
        return `${
            (bytes / 1024).toFixed(1)
        } КБ`;
    }

    return `${
        (
            bytes /
            (1024 * 1024)
        ).toFixed(1)
    } МБ`;
}

function fileToDataUrl(file) {
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(
                    new Error(
                        "Не вдалося прочитати файл."
                    )
                );
            };

            reader.readAsDataURL(file);
        }
    );
}

function loadImage(dataUrl) {
    return new Promise(
        (resolve, reject) => {
            const image =
                new Image();

            image.onload = () => {
                resolve(image);
            };

            image.onerror = () => {
                reject(
                    new Error(
                        "Не вдалося завантажити зображення."
                    )
                );
            };

            image.src = dataUrl;
        }
    );
}

async function compressImage(file) {
    const originalDataUrl =
        await fileToDataUrl(file);

    const image =
        await loadImage(originalDataUrl);

    let width =
        image.naturalWidth;

    let height =
        image.naturalHeight;

    const scale = Math.min(
        1,
        IMAGE_MAX_WIDTH / width,
        IMAGE_MAX_HEIGHT / height
    );

    width =
        Math.round(width * scale);

    height =
        Math.round(height * scale);

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
        canvas.getContext("2d");

    if (!context) {
        throw new Error(
            "Ваш браузер не підтримує обробку фото."
        );
    }

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    return canvas.toDataURL(
        "image/jpeg",
        IMAGE_QUALITY
    );
}

function clearSelectedAttachment() {
    selectedAttachment = null;

    if (chatAttachmentInput) {
        chatAttachmentInput.value = "";
    }

    if (chatAttachmentContent) {
        chatAttachmentContent.innerHTML = "";
    }

    if (chatAttachmentPreview) {
        chatAttachmentPreview.hidden = true;
    }

    clearFileError();
}

function renderAttachmentPreview() {
    if (
        !selectedAttachment ||
        !chatAttachmentPreview ||
        !chatAttachmentContent
    ) {
        return;
    }

    chatAttachmentContent.innerHTML = "";

    if (
        selectedAttachment.type ===
        "image"
    ) {
        const image =
            document.createElement("img");

        image.src =
            selectedAttachment.data;

        image.alt =
            "Попередній перегляд фото";

        image.className =
            "chat-preview-image";

        chatAttachmentContent.appendChild(
            image
        );
    }

    if (
        selectedAttachment.type ===
        "video"
    ) {
        const video =
            document.createElement("video");

        video.src =
            selectedAttachment.data;

        video.controls = true;
        video.preload = "metadata";

        video.className =
            "chat-preview-video";

        chatAttachmentContent.appendChild(
            video
        );
    }

    const fileInformation =
        document.createElement("span");

    fileInformation.className =
        "chat-preview-file-info";

    fileInformation.textContent =
        `${selectedAttachment.name} · ` +
        formatFileSize(
            selectedAttachment.originalSize
        );

    chatAttachmentContent.appendChild(
        fileInformation
    );

    chatAttachmentPreview.hidden = false;
}

async function handleAttachmentSelection(
    event
) {
    clearFileError();

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const isImage =
        file.type.startsWith("image/");

    const isVideo =
        file.type.startsWith("video/");

    if (!isImage && !isVideo) {
        showFileError(
            "Можна додавати лише фото або відео."
        );

        if (chatAttachmentInput) {
            chatAttachmentInput.value = "";
        }

        return;
    }

    try {
        if (isImage) {
            if (
                file.size >
                MAX_IMAGE_FILE_SIZE
            ) {
                showFileError(
                    "Фото надто велике. " +
                    "Максимальний початковий розмір — 20 МБ."
                );

                if (chatAttachmentInput) {
                    chatAttachmentInput.value = "";
                }

                return;
            }

            const compressedData =
                await compressImage(file);

            selectedAttachment = {
                type: "image",
                mimeType: "image/jpeg",
                name: file.name,
                originalSize: file.size,
                data: compressedData
            };
        }

        if (isVideo) {
            if (
                file.size >
                MAX_VIDEO_FILE_SIZE
            ) {
                showFileError(
                    "Поки що відео має бути меншим за 1,5 МБ. " +
                    "Більші файли додамо після переходу " +
                    "на Firebase Storage."
                );

                if (chatAttachmentInput) {
                    chatAttachmentInput.value = "";
                }

                return;
            }

            const videoData =
                await fileToDataUrl(file);

            selectedAttachment = {
                type: "video",
                mimeType: file.type,
                name: file.name,
                originalSize: file.size,
                data: videoData
            };
        }

        renderAttachmentPreview();
    } catch (error) {
        console.error(error);

        showFileError(
            error.message ||
            "Не вдалося підготувати файл."
        );

        clearSelectedAttachment();
    }
}

function openImageViewer(
    imageSource
) {
    if (
        !chatImageViewer ||
        !chatImageViewerPhoto
    ) {
        return;
    }

    chatImageViewerPhoto.src =
        imageSource;

    chatImageViewer.hidden = false;

    document.body.classList.add(
        "chat-viewer-open"
    );
}

function closeImageViewer() {
    if (
        !chatImageViewer ||
        !chatImageViewerPhoto
    ) {
        return;
    }

    chatImageViewer.hidden = true;
    chatImageViewerPhoto.src = "";

    document.body.classList.remove(
        "chat-viewer-open"
    );
}

function createMessageAttachment(
    message
) {
    if (
        !message.attachment ||
        !message.attachment.data
    ) {
        return null;
    }

    const attachmentWrapper =
        document.createElement("div");

    attachmentWrapper.className =
        "chat-message-attachment";

    if (
        message.attachment.type ===
        "image"
    ) {
        const image =
            document.createElement("img");

        image.src =
            message.attachment.data;

        image.alt =
            message.attachment.name ||
            "Фото з чату";

        image.loading = "lazy";

        image.className =
            "chat-message-image";

        image.addEventListener(
            "click",
            () => {
                openImageViewer(
                    message.attachment.data
                );
            }
        );

        attachmentWrapper.appendChild(
            image
        );
    }

    if (
        message.attachment.type ===
        "video"
    ) {
        const video =
            document.createElement("video");

        video.src =
            message.attachment.data;

        video.controls = true;
        video.preload = "metadata";

        video.className =
            "chat-message-video";

        attachmentWrapper.appendChild(
            video
        );
    }

    return attachmentWrapper;
}

const listings =
    readStorage(
        LISTINGS_STORAGE_KEY
    );

const listing =
    listings.find(
        (item) =>
            String(item.id) ===
            String(listingId)
    );

if (chatBackLink) {
    chatBackLink.href = listingId
        ? `listing.html?id=${
            encodeURIComponent(
                listingId
            )
        }`
        : "market.html";
}

if (!currentUser) {
    if (chatMessages) {
        chatMessages.innerHTML = `
            <p>
                Спочатку увійдіть у свій профіль.
            </p>
        `;
    }

    if (chatForm) {
        chatForm.hidden = true;
    }
} else if (!listing) {
    if (chatMessages) {
        chatMessages.innerHTML = `
            <p>
                Оголошення не знайдено.
            </p>
        `;
    }

    if (chatForm) {
        chatForm.hidden = true;
    }
} else {
    const sellerId =
        String(
            listing.ownerId ||
            listing.userId ||
            ""
        );

    const currentUserId =
        String(currentUser.id);

    const isCurrentUserSeller =
        currentUserId === sellerId;

    const chatPartnerId =
        isCurrentUserSeller
            ? String(withUserId || "")
            : sellerId;

    if (chatTitle) {
        chatTitle.textContent =
            `Чат щодо ${listing.name} (${listing.year})`;
    }

    if (!chatPartnerId) {
        if (chatMessages) {
            chatMessages.innerHTML = `
                <p>
                    Не вдалося визначити співрозмовника.
                </p>
            `;
        }

        if (chatForm) {
            chatForm.hidden = true;
        }

        console.error(
            "Не вказаний користувач для чату."
        );
    }

    function markIncomingMessagesAsRead() {
        if (!chatPartnerId) {
            return;
        }

        const messages =
            readStorage(
                MESSAGES_STORAGE_KEY
            );

        let wasChanged = false;

        const readAt =
            new Date().toISOString();

        messages.forEach(
            (message) => {
                const belongsToConversation =
                    String(
                        message.listingId
                    ) ===
                        String(listing.id) &&
                    String(
                        message.senderId
                    ) ===
                        String(chatPartnerId) &&
                    String(
                        message.receiverId
                    ) ===
                        String(currentUserId);

                if (
                    belongsToConversation &&
                    !message.readAt
                ) {
                    message.readAt = readAt;
                    wasChanged = true;
                }
            }
        );

        if (wasChanged) {
            saveStorage(
                MESSAGES_STORAGE_KEY,
                messages
            );
        }
    }

    function getConversationMessages() {
        const messages =
            readStorage(
                MESSAGES_STORAGE_KEY
            );

        return messages
            .filter((message) => {
                const sameListing =
                    String(
                        message.listingId
                    ) ===
                    String(listing.id);

                const senderId =
                    String(
                        message.senderId
                    );

                const receiverId =
                    String(
                        message.receiverId
                    );

                const betweenUsers =
                    (
                        senderId ===
                            currentUserId &&
                        receiverId ===
                            chatPartnerId
                    ) ||
                    (
                        senderId ===
                            chatPartnerId &&
                        receiverId ===
                            currentUserId
                    );

                return (
                    sameListing &&
                    betweenUsers
                );
            })
            .sort(
                (
                    firstMessage,
                    secondMessage
                ) =>
                    new Date(
                        firstMessage.createdAt
                    ) -
                    new Date(
                        secondMessage.createdAt
                    )
            );
    }

    function renderMessages() {
        if (
            !chatPartnerId ||
            !chatMessages
        ) {
            return;
        }

        markIncomingMessagesAsRead();

        const conversation =
            getConversationMessages();

        chatMessages.innerHTML = "";

        if (
            conversation.length === 0
        ) {
            chatMessages.innerHTML = `
                <p class="chat-empty">
                    Повідомлень поки немає.
                </p>
            `;

            return;
        }

        conversation.forEach(
            (message) => {
                const messageElement =
                    document.createElement(
                        "div"
                    );

                const isOwnMessage =
                    String(
                        message.senderId
                    ) === currentUserId;

                messageElement.className =
                    isOwnMessage
                        ? "chat-message chat-message-own"
                        : "chat-message chat-message-other";

                if (
                    message.text &&
                    message.text.trim()
                ) {
                    const messageText =
                        document.createElement(
                            "p"
                        );

                    messageText.className =
                        "chat-message-text";

                    messageText.textContent =
                        message.text;

                    messageElement.appendChild(
                        messageText
                    );
                }

                const attachmentElement =
                    createMessageAttachment(
                        message
                    );

                if (attachmentElement) {
                    messageElement.appendChild(
                        attachmentElement
                    );
                }

                const messageFooter =
                    document.createElement(
                        "div"
                    );

                messageFooter.className =
                    "chat-message-footer";

                const messageTime =
                    document.createElement(
                        "small"
                    );

                const createdAtDate =
                    new Date(
                        message.createdAt
                    );

                if (
                    Number.isNaN(
                        createdAtDate.getTime()
                    )
                ) {
                    messageTime.textContent =
                        "";
                } else {
                    messageTime.textContent =
                        createdAtDate
                            .toLocaleString(
                                "uk-UA",
                                {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );
                }

                messageFooter.appendChild(
                    messageTime
                );

                if (isOwnMessage) {
                    const messageStatus =
                        document.createElement(
                            "small"
                        );

                    messageStatus.className =
                        message.readAt
                            ? "chat-message-status chat-message-read"
                            : "chat-message-status";

                    messageStatus.textContent =
                        message.readAt
                            ? "✓✓ Прочитано"
                            : "✓ Надіслано";

                    messageFooter.appendChild(
                        messageStatus
                    );
                }

                messageElement.appendChild(
                    messageFooter
                );

                chatMessages.appendChild(
                    messageElement
                );
            }
        );

        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }

    async function sendMessage(
        event
    ) {
        event.preventDefault();

        if (
            isSendingMessage ||
            !chatPartnerId
        ) {
            return;
        }

        clearFileError();

        const text =
            chatMessageInput
                ? chatMessageInput
                    .value
                    .trim()
                : "";

        if (
            !text &&
            !selectedAttachment
        ) {
            showFileError(
                "Напишіть повідомлення або додайте файл."
            );

            return;
        }

        isSendingMessage = true;

        if (chatSubmitButton) {
            chatSubmitButton.disabled = true;
            chatSubmitButton.textContent =
                "Надсилання...";
        }

        try {
            const messages =
                readStorage(
                    MESSAGES_STORAGE_KEY
                );

            const newMessage = {
                id: generateMessageId(),
                listingId: listing.id,
                senderId: currentUser.id,
                receiverId: chatPartnerId,
                text,
                readAt: null,
                createdAt:
                    new Date().toISOString()
            };

            if (selectedAttachment) {
                newMessage.attachment = {
                    type:
                        selectedAttachment.type,

                    mimeType:
                        selectedAttachment.mimeType,

                    name:
                        selectedAttachment.name,

                    data:
                        selectedAttachment.data
                };
            }

            messages.push(newMessage);

            const wasSaved =
                saveStorage(
                    MESSAGES_STORAGE_KEY,
                    messages
                );

            if (wasSaved) {
                if (chatMessageInput) {
                    chatMessageInput.value = "";
                    chatMessageInput.style.height =
                        "auto";
                }

                clearSelectedAttachment();
                renderMessages();
            }
        } catch (error) {
            console.error(
                "Помилка надсилання повідомлення:",
                error
            );

            showFileError(
                "Не вдалося надіслати повідомлення."
            );
        } finally {
            isSendingMessage = false;

            if (chatSubmitButton) {
                chatSubmitButton.disabled = false;
                chatSubmitButton.textContent =
                    "Надіслати";
            }
        }
    }

    if (chatPartnerId) {
        if (chatForm) {
            chatForm.addEventListener(
                "submit",
                sendMessage
            );
        }

        if (chatAttachmentInput) {
            chatAttachmentInput.addEventListener(
                "change",
                handleAttachmentSelection
            );
        }

        if (removeChatAttachment) {
            removeChatAttachment.addEventListener(
                "click",
                clearSelectedAttachment
            );
        }

        if (chatMessageInput) {
            chatMessageInput.addEventListener(
                "input",
                () => {
                    chatMessageInput.style.height =
                        "auto";

                    chatMessageInput.style.height =
                        `${
                            Math.min(
                                chatMessageInput
                                    .scrollHeight,
                                140
                            )
                        }px`;
                }
            );
        }

        renderMessages();

        const chatRefreshInterval =
            window.setInterval(
                () => {
                    if (
                        !document.hidden
                    ) {
                        renderMessages();
                    }
                },
                1500
            );

        window.addEventListener(
            "storage",
            (event) => {
                if (
                    event.key ===
                    MESSAGES_STORAGE_KEY
                ) {
                    renderMessages();
                }
            }
        );

        document.addEventListener(
            "visibilitychange",
            () => {
                if (!document.hidden) {
                    renderMessages();
                }
            }
        );

        window.addEventListener(
            "beforeunload",
            () => {
                window.clearInterval(
                    chatRefreshInterval
                );
            }
        );
    }
}

if (closeChatImageViewer) {
    closeChatImageViewer.addEventListener(
        "click",
        closeImageViewer
    );
}

if (chatImageViewer) {
    chatImageViewer.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                chatImageViewer
            ) {
                closeImageViewer();
            }
        }
    );
}

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Escape") {
            closeImageViewer();
        }
    }
);