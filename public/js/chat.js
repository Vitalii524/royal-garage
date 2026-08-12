"use strict";


const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 1.5 * 1024 * 1024;

const IMAGE_MAX_WIDTH = 1280;
const IMAGE_MAX_HEIGHT = 1280;
const IMAGE_QUALITY = 0.75;

const CHAT_REFRESH_INTERVAL = 1500;
const BOTTOM_SCROLL_THRESHOLD = 100;

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

let isFirstMessagesRender = true;
let previousConversationSignature = "";
let chatRefreshInterval = null;


/* =========================================================
   ПОМИЛКИ
========================================================= */

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


/* =========================================================
   ДОПОМІЖНІ ФУНКЦІЇ
========================================================= */

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

function formatMessageDate(dateValue) {
    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function isNearChatBottom() {
    if (!chatMessages) {
        return true;
    }

    const distanceFromBottom =
        chatMessages.scrollHeight -
        chatMessages.scrollTop -
        chatMessages.clientHeight;

    return (
        distanceFromBottom <=
        BOTTOM_SCROLL_THRESHOLD
    );
}

function scrollChatToBottom(
    behavior = "auto"
) {
    if (!chatMessages) {
        return;
    }

    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior
    });
}

function createConversationSignature(
    conversation
) {
    return JSON.stringify(
        conversation.map(
            (message) => ({
                id: message.id,
                text: message.text || "",
                createdAt:
                    message.createdAt || "",
                editedAt:
                    message.editedAt || "",
                deletedAt:
                    message.deletedAt || "",
                readAt:
                    message.readAt || "",
                attachmentType:
                    message.attachment?.type || "",
                attachmentData:
                    message.attachment?.data || ""
            })
        )
    );
}

function closeAllMessageMenus() {
    document
        .querySelectorAll(
            ".chat-message-menu.is-open"
        )
        .forEach(
            (menu) => {
                menu.classList.remove(
                    "is-open"
                );
            }
        );
}


/* =========================================================
   ФАЙЛИ
========================================================= */

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


/* =========================================================
   ВКЛАДЕННЯ
========================================================= */

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


/* =========================================================
   ПЕРЕГЛЯД ФОТО
========================================================= */

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
        message.deletedAt ||
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


/* =========================================================
   ОГОЛОШЕННЯ
========================================================= */

async function initializeChat() {

let listing = null;

try {
    const response =
        await fetch(
            `/api/market/listings/${encodeURIComponent(
                listingId
            )}`
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Не вдалося завантажити оголошення."
        );
    }

    const item =
        data.listing;

    listing = {
        ...item,

        ownerId:
            item.owner_id ??
            item.ownerId,

        sellerName:
            item.seller_name ??
            item.sellerName,

        carId:
            item.car_id ??
            item.carId,

        activePhotoIndex:
            item.active_photo_index ??
            item.activePhotoIndex ??
            0,

        powerType:
            item.power_type ??
            item.powerType,

        powerValue:
            item.power_value ??
            item.powerValue,

        priceUsd:
            item.price_usd ??
            item.priceUsd,

        priceUah:
            item.price_uah ??
            item.priceUah,

        createdAt:
            item.created_at ??
            item.createdAt,

        updatedAt:
            item.updated_at ??
            item.updatedAt
    };

} catch (error) {
    console.error(
        "Chat listing load error:",
        error
    );
}

if (chatBackLink) {
    chatBackLink.href = listingId
        ? `listing.html?id=${
            encodeURIComponent(
                listingId
            )
        }`
        : "market.html";
}



/* =========================================================
   ЗАПУСК ЧАТУ
========================================================= */

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
            `Чат щодо ${
                listing.name || "автомобіля"
            } (${
                listing.year || "рік не вказано"
            })`;
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


    /* =====================================================
       ПРОЧИТАННЯ ПОВІДОМЛЕНЬ
    ===================================================== */

    async function markIncomingMessagesAsRead() {
        if (
            !chatPartnerId ||
            !listing?.id ||
            document.hidden
        ) {
            return;
        }
    
        try {
            const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
    
            const response =
                await fetch(
                    "/api/chat/messages/read",
                    {
                        method: "PATCH",
    
                        headers: {
                            "Content-Type":
                                "application/json",
    
                            Authorization:
                                `Bearer ${token}`
                        },
    
                        body: JSON.stringify({
                            listingId:
                                listing.id,
    
                            partnerId:
                                chatPartnerId
                        })
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося позначити повідомлення прочитаними."
                );
            }
    
        } catch (error) {
            console.error(
                "Chat messages read update error:",
                error
            );
        }
    }


    /* =====================================================
       ОТРИМАННЯ ДІАЛОГУ
    ===================================================== */
    async function getConversationMessages() {
        if (
            !listing?.id ||
            !chatPartnerId
        ) {
            return [];
        }
    
        try {
            const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
    
            const response =
                await fetch(
                    `/api/chat/messages?listingId=${encodeURIComponent(
                        listing.id
                    )}&partnerId=${encodeURIComponent(
                        chatPartnerId
                    )}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося завантажити повідомлення."
                );
            }
    
            return Array.isArray(data.messages)
                ? data.messages.map(
                    (message) => ({
                        ...message,
    
                        listingId:
                            message.listing_id ??
                            message.listingId,
    
                        senderId:
                            message.sender_id ??
                            message.senderId,
    
                        receiverId:
                            message.receiver_id ??
                            message.receiverId,
    
                        readAt:
                            message.read_at ??
                            message.readAt,
    
                        editedAt:
                            message.edited_at ??
                            message.editedAt,
    
                        deletedAt:
                            message.deleted_at ??
                            message.deletedAt,
    
                        createdAt:
                            message.created_at ??
                            message.createdAt
                    })
                )
                : [];
    
        } catch (error) {
            console.error(
                "Chat messages load error:",
                error
            );
    
            return [];
        }
    }

    /* =====================================================
       РЕДАГУВАННЯ
    ===================================================== */
    async function editMessage(messageId) {
        closeAllMessageMenus();
    
        const conversation =
            await getConversationMessages();
    
        const message =
            conversation.find(
                (item) =>
                    String(item.id) ===
                    String(messageId)
            );
    
        if (!message) {
            alert(
                "Повідомлення не знайдено."
            );
    
            return;
        }
    
        if (
            String(message.senderId) !==
            String(currentUserId)
        ) {
            alert(
                "Можна редагувати лише власні повідомлення."
            );
    
            return;
        }
    
        if (message.deletedAt) {
            alert(
                "Видалене повідомлення не можна редагувати."
            );
    
            return;
        }
    
        if (
            !message.text ||
            !message.text.trim()
        ) {
            alert(
                "У повідомленні немає тексту для редагування."
            );
    
            return;
        }
    
        const editedText =
            window.prompt(
                "Редагування повідомлення:",
                message.text
            );
    
        if (editedText === null) {
            return;
        }
    
        const normalizedText =
            editedText.trim();
    
        if (!normalizedText) {
            alert(
                "Повідомлення не може бути порожнім."
            );
    
            return;
        }
    
        if (
            normalizedText ===
            message.text.trim()
        ) {
            return;
        }
    
        try {
            const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
    
            const response =
                await fetch(
                    `/api/chat/messages/${encodeURIComponent(
                        messageId
                    )}`,
                    {
                        method: "PATCH",
    
                        headers: {
                            "Content-Type":
                                "application/json",
    
                            Authorization:
                                `Bearer ${token}`
                        },
    
                        body:
                            JSON.stringify({
                                text:
                                    normalizedText
                            })
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося відредагувати повідомлення."
                );
            }
    
            await renderMessages({
                forceRender: true,
                preservePosition: true
            });
    
        } catch (error) {
            console.error(
                "Chat message edit error:",
                error
            );
    
            alert(
                error.message ||
                "Не вдалося відредагувати повідомлення."
            );
        }
    }
    /* =====================================================
       ВИДАЛЕННЯ
    ===================================================== */

    async function deleteMessage(messageId) {
        closeAllMessageMenus();
    
        const conversation =
            await getConversationMessages();
    
        const message =
            conversation.find(
                (item) =>
                    String(item.id) ===
                    String(messageId)
            );
    
        if (!message) {
            alert(
                "Повідомлення не знайдено."
            );
    
            return;
        }
    
        if (
            String(message.senderId) !==
            String(currentUserId)
        ) {
            alert(
                "Можна видаляти лише власні повідомлення."
            );
    
            return;
        }
    
        if (message.deletedAt) {
            return;
        }
    
        const shouldDelete =
            window.confirm(
                "Видалити це повідомлення?"
            );
    
        if (!shouldDelete) {
            return;
        }
    
        try {
            const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
    
            const response =
                await fetch(
                    `/api/chat/messages/${encodeURIComponent(
                        messageId
                    )}`,
                    {
                        method: "DELETE",
    
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося видалити повідомлення."
                );
            }
    
            await renderMessages({
                forceRender: true,
                preservePosition: true
            });
    
        } catch (error) {
            console.error(
                "Chat message delete error:",
                error
            );
    
            alert(
                error.message ||
                "Не вдалося видалити повідомлення."
            );
        }
    }


    /* =====================================================
       МЕНЮ ДІЙ
    ===================================================== */

    function createMessageActions(
        message
    ) {
        const actions =
            document.createElement("div");

        actions.className =
            "chat-message-actions";

        const menuButton =
            document.createElement("button");

        menuButton.type = "button";

        menuButton.className =
            "chat-message-menu-button";

        menuButton.textContent = "⋮";

        menuButton.setAttribute(
            "aria-label",
            "Дії з повідомленням"
        );

        const menu =
            document.createElement("div");

        menu.className =
            "chat-message-menu";

        if (
            message.text &&
            message.text.trim()
        ) {
            const editButton =
                document.createElement("button");

            editButton.type = "button";

            editButton.className =
                "chat-message-action-button";

            editButton.textContent =
                "Редагувати";

            editButton.addEventListener(
                "click",
                () => {
                    editMessage(
                        message.id
                    );
                }
            );

            menu.appendChild(
                editButton
            );
        }

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "chat-message-action-button chat-message-delete-button";

        deleteButton.textContent =
            "Видалити";

        deleteButton.addEventListener(
            "click",
            () => {
                deleteMessage(
                    message.id
                );
            }
        );

        menu.appendChild(
            deleteButton
        );

        menuButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                const wasOpen =
                    menu.classList.contains(
                        "is-open"
                    );

                closeAllMessageMenus();

                if (!wasOpen) {
                    menu.classList.add(
                        "is-open"
                    );
                }
            }
        );

        actions.append(
            menuButton,
            menu
        );

        return actions;
    }


    /* =====================================================
       ВИВЕДЕННЯ ПОВІДОМЛЕНЬ
    ===================================================== */

    async function renderMessages(
        options = {}
    ) {
        if (
            !chatPartnerId ||
            !chatMessages
        ) {
            return;
        }

        const {
            forceScrollBottom = false,
            forceRender = false,
            preservePosition = true
        } = options;

        const wasNearBottom =
            isNearChatBottom();

        const previousScrollTop =
            chatMessages.scrollTop;

        const previousScrollHeight =
            chatMessages.scrollHeight;

        markIncomingMessagesAsRead();

        const conversation =
           await getConversationMessages();

        const conversationSignature =
            createConversationSignature(
                conversation
            );

        if (
            !forceRender &&
            !isFirstMessagesRender &&
            conversationSignature ===
                previousConversationSignature
        ) {
            return;
        }

        previousConversationSignature =
            conversationSignature;

        chatMessages.innerHTML = "";

        if (
            conversation.length === 0
        ) {
            chatMessages.innerHTML = `
                <p class="chat-empty">
                    Повідомлень поки немає.
                </p>
            `;

            isFirstMessagesRender = false;

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

                messageElement.dataset.messageId =
                    String(message.id);

                if (message.deletedAt) {
                    messageElement.classList.add(
                        "chat-message-deleted"
                    );

                    const deletedText =
                        document.createElement(
                            "p"
                        );

                    deletedText.className =
                        "chat-message-text chat-message-deleted-text";

                    deletedText.textContent =
                        "Повідомлення видалено";

                    messageElement.appendChild(
                        deletedText
                    );
                } else {
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

                messageTime.className =
                    "chat-message-time";

                messageTime.textContent =
                    formatMessageDate(
                        message.createdAt
                    );

                messageFooter.appendChild(
                    messageTime
                );

                if (
                    message.editedAt &&
                    !message.deletedAt
                ) {
                    const editedLabel =
                        document.createElement(
                            "small"
                        );

                    editedLabel.className =
                        "chat-message-edited";

                    editedLabel.textContent =
                        "ред.";

                    messageFooter.appendChild(
                        editedLabel
                    );
                }

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

                if (
                    isOwnMessage &&
                    !message.deletedAt
                ) {
                    const actions =
                        createMessageActions(
                            message
                        );

                    messageElement.appendChild(
                        actions
                    );
                }

                chatMessages.appendChild(
                    messageElement
                );
            }
        );

        const shouldScrollToBottom =
            isFirstMessagesRender ||
            forceScrollBottom ||
            wasNearBottom;

        requestAnimationFrame(
            () => {
                if (shouldScrollToBottom) {
                    scrollChatToBottom(
                        "auto"
                    );
                } else if (
                    preservePosition
                ) {
                    const heightDifference =
                        chatMessages.scrollHeight -
                        previousScrollHeight;

                    chatMessages.scrollTop =
                        previousScrollTop +
                        heightDifference;
                } else {
                    chatMessages.scrollTop =
                        previousScrollTop;
                }
            }
        );

        isFirstMessagesRender = false;
    }


    /* =====================================================
       НАДСИЛАННЯ
    ===================================================== */
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
            const token =
                localStorage.getItem(
                    "royalGarageToken"
                );
    
            const newMessage = {
                id: generateMessageId(),
                listingId: listing.id,
                receiverId: chatPartnerId,
                text,
                attachment: null
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
    
            const response =
                await fetch(
                    "/api/chat/messages",
                    {
                        method: "POST",
    
                        headers: {
                            "Content-Type":
                                "application/json",
    
                            Authorization:
                                `Bearer ${token}`
                        },
    
                        body:
                            JSON.stringify(
                                newMessage
                            )
                    }
                );
    
            const data =
                await response.json();
    
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Не вдалося надіслати повідомлення."
                );
            }
    
            if (chatMessageInput) {
                chatMessageInput.value = "";
    
                chatMessageInput.style.height =
                    "auto";
            }
    
            clearSelectedAttachment();
    
            await renderMessages({
                forceScrollBottom: true,
                forceRender: true
            });
    
        } catch (error) {
            console.error(
                "Помилка надсилання повідомлення:",
                error
            );
    
            showFileError(
                error.message ||
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


    /* =====================================================
       ПОДІЇ
    ===================================================== */

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

        renderMessages({
            forceScrollBottom: true,
            forceRender: true
        });

        chatRefreshInterval =
            window.setInterval(
                () => {
                    if (!document.hidden) {
                        renderMessages();
                    }
                },
                CHAT_REFRESH_INTERVAL
            );

        document.addEventListener(
            "visibilitychange",
            () => {
                if (!document.hidden) {
                    renderMessages({
                        forceRender: true
                    });
                }
            }
        );
    }
}

}

initializeChat();

/* =========================================================
   ЗАКРИТТЯ МЕНЮ ПРИ НАТИСКАННІ ПОЗА НИМ
========================================================= */

document.addEventListener(
    "click",
    (event) => {
        if (
            !event.target.closest(
                ".chat-message-actions"
            )
        ) {
            closeAllMessageMenus();
        }
    }
);


/* =========================================================
   ПОВНОЕКРАННИЙ ПЕРЕГЛЯД
========================================================= */

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


/* =========================================================
   КЛАВІАТУРА
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Escape") {
            closeAllMessageMenus();
            closeImageViewer();
        }
    }
);


/* =========================================================
   ОЧИЩЕННЯ ІНТЕРВАЛУ
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {
        if (chatRefreshInterval) {
            window.clearInterval(
                chatRefreshInterval
            );
        }
    }
);