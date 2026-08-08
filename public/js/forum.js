"use strict";

/* ===== ЕЛЕМЕНТИ СТОРІНКИ ===== */

const openTopicButton =
    document.getElementById("openTopicButton");

const topicModal =
    document.getElementById("topicModal");

const topicForm =
    document.getElementById("topicForm");

const topicTitle =
    document.getElementById("topicTitle");

const topicCategory =
    document.getElementById("topicCategory");

const topicText =
    document.getElementById("topicText");

const forumSearch =
    document.getElementById("forumSearch");

const forumCategoryFilter =
    document.getElementById("forumCategoryFilter");

const forumTopics =
    document.getElementById("forumTopics");

const FORUM_STORAGE_KEY =
    "royalGarageForumTopics";


/* ===== ПОТОЧНИЙ КОРИСТУВАЧ ===== */

function loadCurrentUser() {
    if (typeof getCurrentUser === "function") {
        return getCurrentUser();
    }

    try {
        return JSON.parse(
            localStorage.getItem(
                "royalGarageCurrentUser"
            )
        );
    } catch (error) {
        console.error(
            "Не вдалося прочитати користувача:",
            error
        );

        return null;
    }
}

function getCurrentForumUser() {
    return loadCurrentUser();
}


/* ===== ЗАВАНТАЖЕННЯ ТЕМ ===== */

let topics = [];

async function loadForumTopics() {
    try {
        const response = await fetch(
            "/api/forum/topics"
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити теми."
            );
        }

        topics = (data.topics || []).map(
            (topic) => ({
                id: topic.id,

                authorId:
                    topic.user_id,

                authorName:
                    topic.author_name,

                title:
                    topic.title,

                category:
                    topic.category,

                text:
                    topic.content,

                createdAt:
                    topic.created_at,

                replies: Array.isArray(topic.replies)
                    ? topic.replies
                    : []
                
            })
        );

        renderForumTopics();

    } catch (error) {
        console.error(
            "Не вдалося завантажити теми:",
            error
        );

        topics = [];
        renderForumTopics();
    }
}
function saveForumTopics() {
    // Тимчасово залишаємо,
    // поки переносимо лайки, відповіді та видалення в PostgreSQL.
} 


/* ===== ДОПОМІЖНІ ФУНКЦІЇ ===== */

function createForumId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

function escapeForumHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatForumDate(value) {
    if (!value) {
        return "Дата не вказана";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Дата не вказана";
    }

    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}

function getUserName(user) {
    return (
        user?.name ||
        user?.email ||
        "Користувач"
    );
}

/* ===== РІВНІ ФОРУМУ ===== */

const FORUM_LEVELS = [
    {
        name: "Новачок",
        minPoints: 0
    },
    {
        name: "Учасник",
        minPoints: 1
    },
    {
        name: "Знавець",
        minPoints: 40
    },
    {
        name: "Профі",
        minPoints: 100
    },
    {
        name: "Експерт",
        minPoints: 250
    },
    {
        name: "Амбасадор",
        minPoints: 500
    }
];


function getForumUserPoints(userId) {
    let points = 0;

    topics.forEach((topic) => {
        const replies =
            Array.isArray(topic.replies)
                ? topic.replies
                : [];

        replies.forEach((reply) => {
            if (
                String(reply.authorId) !==
                String(userId)
            ) {
                return;
            }

            const likesCount =
                Array.isArray(reply.likeUserIds)
                    ? reply.likeUserIds.length
                    : 0;

            points += likesCount;

            if (reply.isHelpful) {
                points += 5;
            }

            if (reply.isExpertConfirmed) {
                points += 10;
            }
        });
    });

    return points;
}


function getForumUserLevel(userId) {
    const points =
        getForumUserPoints(userId);

    return [...FORUM_LEVELS]
        .reverse()
        .find(
            (level) =>
                points >= level.minPoints
        ) || FORUM_LEVELS[0];
}

function openForumModal(modal) {
    if (!modal) {
        return;
    }

    modal.classList.add("modal-open");
}

function closeForumModal(modal) {
    if (!modal) {
        return;
    }

    modal.classList.remove("modal-open");
}


/* ===== МОДАЛЬНЕ ВІКНО ТЕМИ ===== */

const topicViewModal =
    document.createElement("div");

topicViewModal.id = "topicViewModal";
topicViewModal.className = "modal";

topicViewModal.innerHTML = `
    <div class="modal-content">

        <button
            type="button"
            class="modal-close"
            id="closeTopicViewModal"
            aria-label="Закрити">
            ×
        </button>

        <div id="topicViewBody"></div>

    </div>
`;

document.body.appendChild(topicViewModal);

const topicViewBody =
    document.getElementById("topicViewBody");

const closeTopicViewModal =
    document.getElementById(
        "closeTopicViewModal"
    );


/* ===== ВІДОБРАЖЕННЯ СПИСКУ ТЕМ ===== */

function renderForumTopics() {
    const searchQuery =
        forumSearch.value
            .trim()
            .toLowerCase();

    const selectedCategory =
        forumCategoryFilter.value;

    const filteredTopics = topics
        .filter((topic) => {
            const searchableText = `
                ${topic.title || ""}
                ${topic.text || ""}
                ${topic.authorName || ""}
                ${topic.category || ""}
            `.toLowerCase();

            const matchesSearch =
                searchableText.includes(
                    searchQuery
                );

            const matchesCategory =
                selectedCategory === "all" ||
                topic.category === selectedCategory;

            return (
                matchesSearch &&
                matchesCategory
            );
        })
        .sort(
            (first, second) =>
                new Date(second.createdAt) -
                new Date(first.createdAt)
        );

    forumTopics.innerHTML = "";

    if (filteredTopics.length === 0) {
        forumTopics.innerHTML = `
            <p class="empty-message">
                Тем за цим запитом немає.
            </p>
        `;

        return;
    }

    const currentUser =
        getCurrentForumUser();

    filteredTopics.forEach((topic) => {
        const card =
            document.createElement("article");

        card.className =
            "forum-topic-card";

        const repliesCount =
            Array.isArray(topic.replies)
                ? topic.replies.length
                : 0;

        const isOwner =
            currentUser &&
            String(currentUser.id) ===
                String(topic.authorId);

        card.innerHTML = `
            <div class="forum-topic-header">

                <h2 class="forum-topic-title">
                    ${escapeForumHtml(topic.title)}
                </h2>

                <span class="forum-topic-category">
                    ${escapeForumHtml(
                        topic.category
                    )}
                </span>

            </div>

            <p class="forum-topic-text">
                ${escapeForumHtml(topic.text)}
            </p>

            <div class="forum-topic-meta">

                <span>
                    👤
                    ${escapeForumHtml(
                        topic.authorName
                    )}
                </span>

                <span>
                    🕒
                    ${formatForumDate(
                        topic.createdAt
                    )}
                </span>

                <span>
                    💬
                    ${repliesCount}
                    ${
                        repliesCount === 1
                            ? "відповідь"
                            : "відповідей"
                    }
                </span>

            </div>

            <div class="forum-topic-actions">

                <button
                    type="button"
                    class="forum-topic-button"
                    data-action="open"
                    data-topic-id="${topic.id}">
                    Відкрити тему
                </button>

                ${
                    isOwner
                        ? `
                            <button
                                type="button"
                                class="forum-topic-button"
                                data-action="delete"
                                data-topic-id="${topic.id}">
                                Видалити тему
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        forumTopics.appendChild(card);
    });
}


/* ===== ВІДКРИТТЯ ОКРЕМОЇ ТЕМИ ===== */

function openTopicView(topicId) {
    const topic = topics.find(
        (item) =>
            String(item.id) ===
            String(topicId)
    );

    if (!topic) {
        alert("Тему не знайдено.");
        return;
    }

    const currentUser =
        getCurrentForumUser();

    const replies = Array.isArray(topic.replies)
        ? topic.replies
        : [];

    topicViewBody.innerHTML = `
        <p class="forum-label">
            ${escapeForumHtml(topic.category)}
        </p>

        <h2>
            ${escapeForumHtml(topic.title)}
        </h2>

        <div class="forum-topic-meta">

            <span>
                👤
                ${escapeForumHtml(
                    topic.authorName
                )}
            </span>

            <span>
                🕒
                ${formatForumDate(
                    topic.createdAt
                )}
            </span>

        </div>

        <p class="forum-topic-text">
            ${escapeForumHtml(topic.text)}
        </p>

        <hr>

        <h3>
            Відповіді (${replies.length})
        </h3>

        <div id="topicRepliesList">
            ${
                replies.length === 0
                    ? `
                        <p class="empty-message">
                            Відповідей поки немає.
                        </p>
                    `
                    : replies
                        .map(
                            (reply) => `
                                <article
                                    class="forum-topic-card">

                                    <p class="forum-topic-text">
                                        ${escapeForumHtml(
                                            reply.text
                                        )}
                                    </p>

                                    <div
                                        class="forum-topic-meta">

                             <span class="forum-reply-author">
                                        👤
                                    
                                        <span>
                                            ${escapeForumHtml(
                                                reply.authorName
                                            )}
                                        </span>
                                    
                                        <span class="forum-user-level">
                                            ${escapeForumHtml(
                                                getForumUserLevel(
                                                    reply.authorId
                                                ).name
                                            )}
                            </span>
                                    </span>

                                        <span>
                                            🕒
                                            ${formatForumDate(
                                                reply.createdAt
                                            )}
                                        </span>

                                    </div>

                                     <div class="forum-reply-actions">
                                        <button
                                            type="button"
                                            class="forum-like-button ${
                                                Array.isArray(reply.likeUserIds) &&
                                                currentUser?.id &&
                                                reply.likeUserIds.some(
                                                    (userId) =>
                                                        String(userId) ===
                                                        String(currentUser.id)
                                                )
                                                    ? "is-liked"
                                                    : ""
                                            }"
                                            data-action="like-reply"
                                            data-topic-id="${topic.id}"
                                            data-reply-id="${reply.id}"
                                        >
                                            👍
                                            ${
                                                Array.isArray(reply.likeUserIds)
                                                    ? reply.likeUserIds.length
                                                    : 0
                                            }
                                        </button>
                                    </div>

                                </article>
                            `
                        )
                        .join("")
            }
        </div>

        ${
            currentUser
                ? `
                    <form id="replyForm">

                        <label>
                            Твоя відповідь

                            <textarea
                                id="replyText"
                                rows="4"
                                maxlength="1500"
                                placeholder="Напиши відповідь..."
                                required>
                            </textarea>
                        </label>

                        <button
                            type="submit"
                            class="gold-btn">
                            Відповісти
                        </button>

                    </form>
                `
                : `
                    <p class="empty-message">
                        Увійди в акаунт, щоб відповісти.
                    </p>
                `
        }
    `;

    const replyForm =
        document.getElementById("replyForm");

    if (replyForm) {
        replyForm.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                addTopicReply(topic.id);
            }
        );
    }

    openForumModal(topicViewModal);
}

/* ===== ЛАЙК ВІДПОВІДІ ===== */
async function toggleReplyLike(
    topicId,
    replyId
) {
    const currentUser =
        getCurrentForumUser();

    if (!currentUser?.id) {
        alert(
            "Увійди в акаунт, щоб поставити лайк."
        );
        return;
    }

    const topic =
        topics.find(
            (item) =>
                String(item.id) ===
                String(topicId)
        );

    if (!topic) {
        return;
    }

    const reply =
        topic.replies.find(
            (item) =>
                String(item.id) ===
                String(replyId)
        );

    if (!reply) {
        return;
    }

    if (
        String(reply.authorId) ===
        String(currentUser.id)
    ) {
        alert(
            "Не можна лайкати власну відповідь."
        );
        return;
    }

    const token =
        localStorage.getItem(
            "royalGarageToken"
        );

    if (!token) {
        alert(
            "Сесія не знайдена. Увійди ще раз."
        );
        return;
    }

    try {
        const response = await fetch(
            `/api/forum/replies/${replyId}/like`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.message ||
                "Не вдалося змінити лайк."
            );
            return;
        }

        await loadForumTopics();

        openTopicView(topic.id);

    } catch (error) {
        console.error(
            "Forum reply like request error:",
            error
        );

        alert(
            "Не вдалося з’єднатися із сервером."
        );
    }
}
topicViewBody.addEventListener(
    "click",
    (event) => {
        const likeButton =
            event.target.closest(
                '[data-action="like-reply"]'
            );

        if (!likeButton) {
            return;
        }

        toggleReplyLike(
            likeButton.dataset.topicId,
            likeButton.dataset.replyId
        );
    }
);


/* ===== ДОДАВАННЯ ВІДПОВІДІ ===== */

async function addTopicReply(topicId) {
    const currentUser =
        getCurrentForumUser();

    if (!currentUser?.id) {
        alert(
            "Увійди в акаунт, щоб відповісти."
        );

        return;
    }

    const replyInput =
        document.getElementById("replyText");

    const text =
        replyInput.value.trim();

    if (!text) {
        alert("Напиши текст відповіді.");
        return;
    }

    const topic = topics.find(
        (item) =>
            String(item.id) ===
            String(topicId)
    );

    if (!topic) {
        alert("Тему не знайдено.");
        return;
    }

    if (!Array.isArray(topic.replies)) {
        topic.replies = [];
    }

    const token =
    localStorage.getItem(
        "royalGarageToken"
    );

if (!token) {
    alert(
        "Сесія не знайдена. Увійди ще раз."
    );
    return;
}

try {
    const response = await fetch(
        `/api/forum/topics/${topic.id}/replies`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`
            },
            body: JSON.stringify({
                content: text
            })
        }
    );

    const data =
        await response.json();

    if (!response.ok) {
        alert(
            data.message ||
            "Не вдалося додати відповідь."
        );
        return;
    }

    replyInput.value = "";

    await loadForumTopics();

    openTopicView(topic.id);

} catch (error) {
    console.error(
        "Create forum reply error:",
        error
    );

    alert(
        "Не вдалося з’єднатися із сервером."
    );
  }

}


/* ===== СТВОРЕННЯ ТЕМИ ===== */

openTopicButton.addEventListener(
    "click",
    () => {
        const currentUser =
            getCurrentForumUser();

        if (!currentUser?.id) {
            alert(
                "Увійди в акаунт, щоб створити тему."
            );

            return;
        }

        topicForm.reset();
        openForumModal(topicModal);
    }
);

topicForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const currentUser =
            getCurrentForumUser();

        if (!currentUser?.id) {
            alert(
                "Увійди в акаунт, щоб створити тему."
            );

            return;
        }

        const title =
            topicTitle.value.trim();

        const category =
            topicCategory.value;

        const text =
            topicText.value.trim();

        if (!title || !category || !text) {
            alert("Заповни всі поля.");
            return;
        }

        const token =
            localStorage.getItem(
                "royalGarageToken"
            );

        if (!token) {
            alert(
                "Сесія не знайдена. Увійди ще раз."
            );

            return;
        }

        try {
            const response = await fetch(
                "/api/forum/topics",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        title,
                        category,
                        content: text
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                    "Не вдалося створити тему."
                );

                return;
            }

            topicForm.reset();
            closeForumModal(topicModal);

            await loadForumTopics();

            alert(
                "Тему збережено в базі."
            );

        } catch (error) {
            console.error(
                "Create forum topic error:",
                error
            );

            alert(
                "Не вдалося з’єднатися із сервером."
            );
        }
    }
);


/* ===== ВИДАЛЕННЯ ТЕМИ ===== */

async function deleteForumTopic(topicId) {
    const currentUser =
        getCurrentForumUser();

    const topic = topics.find(
        (item) =>
            String(item.id) ===
            String(topicId)
    );

    if (!topic) {
        return;
    }

    if (
        !currentUser ||
        String(currentUser.id) !==
            String(topic.authorId)
    ) {
        alert(
            "Видалити тему може лише її автор."
        );

        return;
    }

    const confirmed = confirm(
        `Видалити тему "${topic.title}"?`
    );

    const token =
    localStorage.getItem(
        "royalGarageToken"
    );

if (!token) {
    alert(
        "Сесія не знайдена. Увійди ще раз."
    );
    return;
}

try {
    const response = await fetch(
        `/api/forum/topics/${topicId}`,
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
        alert(
            data.message ||
            "Не вдалося видалити тему."
        );
        return;
    }

    await loadForumTopics();

} catch (error) {
    console.error(
        "Forum topic delete error:",
        error
    );

    alert(
        "Не вдалося з’єднатися із сервером."
    );
}

    topics = topics.filter(
        (item) =>
            String(item.id) !==
            String(topicId)
    );

    saveForumTopics();
    renderForumTopics();
}


/* ===== КНОПКИ В СПИСКУ ТЕМ ===== */

forumTopics.addEventListener(
    "click",
    (event) => {
        const button = event.target.closest(
            "[data-action][data-topic-id]"
        );

        if (!button) {
            return;
        }

        const topicId =
            button.dataset.topicId;

        if (button.dataset.action === "open") {
            openTopicView(topicId);
        }

        if (button.dataset.action === "delete") {
            deleteForumTopic(topicId);
        }
    }
);


/* ===== ПОШУК І ФІЛЬТР ===== */

forumSearch.addEventListener(
    "input",
    renderForumTopics
);

forumCategoryFilter.addEventListener(
    "change",
    renderForumTopics
);


/* ===== ЗАКРИТТЯ МОДАЛЬНИХ ВІКОН ===== */

document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                closeForumModal(
                    button.closest(".modal")
                );
            }
        );
    });

closeTopicViewModal.addEventListener(
    "click",
    () => {
        closeForumModal(topicViewModal);
    }
);

document
    .querySelectorAll(".modal")
    .forEach((modal) => {
        modal.addEventListener(
            "click",
            (event) => {
                if (event.target === modal) {
                    closeForumModal(modal);
                }
            }
        );
    });

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key !== "Escape") {
            return;
        }

        closeForumModal(topicModal);
        closeForumModal(topicViewModal);
    }
);


/* ===== ЗАПУСК ===== */

loadForumTopics();