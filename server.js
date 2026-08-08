const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
});

async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                account_type VARCHAR(30) NOT NULL DEFAULT 'user',
                role VARCHAR(30) NOT NULL DEFAULT 'user',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS city VARCHAR(80),
        ADD COLUMN IF NOT EXISTS telegram VARCHAR(80),
        ADD COLUMN IF NOT EXISTS profile_photo TEXT,
        ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS show_telegram BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS forum_topics (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(80) NOT NULL DEFAULT 'Загальне',
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS forum_replies (
        id UUID PRIMARY KEY,
        topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS forum_reply_likes (
        reply_id UUID NOT NULL
            REFERENCES forum_replies(id)
            ON DELETE CASCADE,

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        created_at TIMESTAMPTZ
            NOT NULL DEFAULT NOW(),

        PRIMARY KEY (reply_id, user_id)
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS market_listings (
        id UUID PRIMARY KEY,

        owner_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        seller_name VARCHAR(255) NOT NULL,

        car_id TEXT,

        name VARCHAR(255) NOT NULL,
        year VARCHAR(20),
        vin VARCHAR(50),

        photos JSONB NOT NULL DEFAULT '[]'::jsonb,

        active_photo_index INTEGER NOT NULL DEFAULT 0,

        engine VARCHAR(100),
        mileage VARCHAR(100),
        fuel VARCHAR(100),

        power_type VARCHAR(30),
        power_value VARCHAR(100),

        transmission VARCHAR(100),
        body VARCHAR(100),
        drive VARCHAR(100),

        services JSONB NOT NULL DEFAULT '[]'::jsonb,

        price_usd NUMERIC,
        price_uah NUMERIC,

        city VARCHAR(150),
        phone VARCHAR(50),

        description TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);

        console.log("Users table ready");
    } catch (error) {
        console.error("Database initialization error:", error);
    }
}

initDatabase();

app.use(
    express.json({
        limit: "50mb"
    })
);
app.use(express.static(path.join(__dirname, "public")));
app.get(
    "/api/market/listings",
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    id,
                    owner_id AS "ownerId",
                    seller_name AS "sellerName",
                    car_id AS "carId",
                    name,
                    year,
                    vin,
                    photos,
                    active_photo_index AS "activePhotoIndex",
                    engine,
                    mileage,
                    fuel,
                    power_type AS "powerType",
                    power_value AS "powerValue",
                    transmission,
                    body,
                    drive,
                    services,
                    price_usd AS "priceUsd",
                    price_uah AS "priceUah",
                    city,
                    phone,
                    description,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
                FROM market_listings
                ORDER BY created_at DESC
            `);

            res.json({
                ok: true,
                listings: result.rows
            });

        } catch (error) {
            console.error(
                "Market listings load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити оголошення."
            });
        }
    }
);

app.get(
    "/api/market/listings/:listingId",
    async (req, res) => {
        try {
            const { listingId } = req.params;

            const result = await pool.query(
                `
                SELECT *
                FROM market_listings
                WHERE id = $1
                LIMIT 1
                `,
                [listingId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Оголошення не знайдено."
                });
            }

            res.json({
                ok: true,
                listing: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Market listing load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити оголошення."
            });
        }
    }
);

app.post(
    "/api/market/listings",
    requireAuth,
    async (req, res) => {
        try {
            const {
                carId,
                name,
                year,
                vin,
                photos,
                activePhotoIndex,
                engine,
                mileage,
                fuel,
                powerType,
                powerValue,
                transmission,
                body,
                drive,
                services,
                priceUsd,
                priceUah,
                city,
                phone,
                description
            } = req.body;

            if (!name) {
                return res.status(400).json({
                    ok: false,
                    message: "Вкажіть назву автомобіля."
                });
            }

            const userResult = await pool.query(
                `
                SELECT name, email
                FROM users
                WHERE id = $1
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Користувача не знайдено."
                });
            }

            const sellerName =
                userResult.rows[0].name ||
                userResult.rows[0].email ||
                "Продавець";

            const id =
                crypto.randomUUID();

            const result = await pool.query(
                `
                INSERT INTO market_listings (
                    id,
                    owner_id,
                    seller_name,
                    car_id,
                    name,
                    year,
                    vin,
                    photos,
                    active_photo_index,
                    engine,
                    mileage,
                    fuel,
                    power_type,
                    power_value,
                    transmission,
                    body,
                    drive,
                    services,
                    price_usd,
                    price_uah,
                    city,
                    phone,
                    description
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23
                )
                RETURNING *
                `,
                [
                    id,
                    req.user.userId,
                    sellerName,
                    carId || null,
                    name,
                    year || null,
                    vin || null,
                    JSON.stringify(
                        Array.isArray(photos)
                            ? photos
                            : []
                    ),
                    Number.isInteger(activePhotoIndex)
                        ? activePhotoIndex
                        : 0,
                    engine || "",
                    mileage || "",
                    fuel || "",
                    powerType || "",
                    powerValue || "",
                    transmission || "",
                    body || "",
                    drive || "",
                    JSON.stringify(
                        Array.isArray(services)
                            ? services
                            : []
                    ),
                    priceUsd || null,
                    priceUah || null,
                    city || "",
                    phone || "",
                    description || ""
                ]
            );

            res.status(201).json({
                ok: true,
                listing: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Market listing create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося створити оголошення."
            });
        }
    }
);

app.patch(
    "/api/market/listings/:listingId",
    requireAuth,
    async (req, res) => {
        try {
            const { listingId } = req.params;

            const listingResult = await pool.query(
                `
                SELECT id, owner_id
                FROM market_listings
                WHERE id = $1
                LIMIT 1
                `,
                [listingId]
            );

            if (listingResult.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Оголошення не знайдено."
                });
            }

            if (
                String(listingResult.rows[0].owner_id) !==
                String(req.user.userId)
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Редагувати оголошення може лише його власник."
                });
            }

            const {
                carId,
                name,
                year,
                vin,
                photos,
                activePhotoIndex,
                engine,
                mileage,
                fuel,
                powerType,
                powerValue,
                transmission,
                body,
                drive,
                services,
                priceUsd,
                priceUah,
                city,
                phone,
                description
            } = req.body;

            const result = await pool.query(
                `
                UPDATE market_listings
                SET
                    car_id = $1,
                    name = $2,
                    year = $3,
                    vin = $4,
                    photos = $5,
                    active_photo_index = $6,
                    engine = $7,
                    mileage = $8,
                    fuel = $9,
                    power_type = $10,
                    power_value = $11,
                    transmission = $12,
                    body = $13,
                    drive = $14,
                    services = $15,
                    price_usd = $16,
                    price_uah = $17,
                    city = $18,
                    phone = $19,
                    description = $20,
                    updated_at = NOW()
                WHERE id = $21
                RETURNING *
                `,
                [
                    carId || null,
                    name || "",
                    year || null,
                    vin || null,
                    JSON.stringify(
                        Array.isArray(photos)
                            ? photos
                            : []
                    ),
                    Number.isInteger(activePhotoIndex)
                        ? activePhotoIndex
                        : 0,
                    engine || "",
                    mileage || "",
                    fuel || "",
                    powerType || "",
                    powerValue || "",
                    transmission || "",
                    body || "",
                    drive || "",
                    JSON.stringify(
                        Array.isArray(services)
                            ? services
                            : []
                    ),
                    priceUsd || null,
                    priceUah || null,
                    city || "",
                    phone || "",
                    description || "",
                    listingId
                ]
            );

            res.json({
                ok: true,
                listing: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Market listing update error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити оголошення."
            });
        }
    }
);

app.get("/api", (req, res) => {
    res.json({
        message: "Royal Garage API працює 🚗"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json({
            ok: true,
            database: "connected",
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error(
            "Database connection error:",
            error
        );

        res.status(500).json({
            ok: false,
            database: "connection failed"
        });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                ok: false,
                message: "Заповни всі поля."
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const normalizedPhone =
            String(phone)
                .replace(/\D/g, "");

        if (!/^380\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({
                ok: false,
                message:
                    "Введи правильний український номер телефону."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                ok: false,
                message:
                    "Пароль повинен містити щонайменше 6 символів."
            });
        }

        const existingUser =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                   OR phone = $2
                LIMIT 1
                `,
                [
                    normalizedEmail,
                    normalizedPhone
                ]
            );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                ok: false,
                message:
                    "Користувач із таким email або номером телефону вже зареєстрований."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        const userId =
            crypto.randomUUID();

        const result =
            await pool.query(
                `
                INSERT INTO users (
                    id,
                    name,
                    email,
                    phone,
                    password_hash,
                    account_type,
                    role
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    'user',
                    'user'
                )
                RETURNING
                    id,
                    name,
                    email,
                    phone,
                    account_type,
                    role,
                    created_at
                `,
                [
                    userId,
                    name.trim(),
                    normalizedEmail,
                    normalizedPhone,
                    passwordHash
                ]
            );

        res.status(201).json({
            ok: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            ok: false,
            message:
                "Не вдалося створити користувача."
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                message: "Введи email і пароль."
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    password_hash,
                    account_type,
                    role,
                    created_at
                FROM users
                WHERE email = $1
                LIMIT 1
                `,
                [normalizedEmail]
            );

        if (result.rows.length === 0) {
            return res.status(401).json({
                ok: false,
                message:
                    "Неправильний email або пароль."
            });
        }

        const user = result.rows[0];

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                ok: false,
                message:
                    "Неправильний email або пароль."
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role || "user"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            ok: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                accountType:
                    user.account_type || "user",
                role:
                    user.role || "user"
            }
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            ok: false,
            message:
                "Не вдалося виконати вхід."
        });
    }
});

app.get("/api/forum/topics", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.title,
                t.category,
                t.content,
                t.created_at,
                t.updated_at,
                u.id AS user_id,
                u.name AS author_name,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                            'id', r.id,
                            'authorId', r.user_id,
                            'authorName', ru.name,
                            'text', r.content,
                            'createdAt', r.created_at,

                            'likeUserIds',
                            COALESCE(
                                (
                                    SELECT json_agg(l.user_id)
                                    FROM forum_reply_likes l
                                    WHERE l.reply_id = r.id
                                ),
                                '[]'::json
                            )
                            )
                            ORDER BY r.created_at ASC
                        )
                        FROM forum_replies r
                        JOIN users ru
                            ON ru.id = r.user_id
                        WHERE r.topic_id = t.id
                    ),
                    '[]'::json
                ) AS replies

            FROM forum_topics t
            JOIN users u
                ON u.id = t.user_id

            ORDER BY t.created_at DESC
        `);

        res.json({
            ok: true,
            topics: result.rows
        });

    } catch (error) {
        console.error(
            "Forum topics load error:",
            error
        );

        res.status(500).json({
            ok: false,
            message:
                "Не вдалося завантажити теми форуму."
        });
    }
});

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            ok: false,
            message: "Потрібно увійти."
        });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: "Сесія недійсна або завершилась."
        });
    }
}

app.post(
    "/api/forum/topics",
    requireAuth,
    async (req, res) => {
        try {
            const { title, category, content } = req.body;

            if (!title || !content) {
                return res.status(400).json({
                    ok: false,
                    message: "Вкажи назву та текст теми."
                });
            }

            const topicId = crypto.randomUUID();

            const result = await pool.query(
                `
                INSERT INTO forum_topics (
                    id,
                    user_id,
                    title,
                    category,
                    content
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                `,
                [
                    topicId,
                    req.user.userId,
                    String(title).trim(),
                    String(category || "Загальне").trim(),
                    String(content).trim()
                ]
            );

            res.status(201).json({
                ok: true,
                topic: result.rows[0]
            });
        } catch (error) {
            console.error(
                "Forum topic create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message: "Не вдалося створити тему."
            });
        }
    }
);

app.post(
    "/api/forum/topics/:topicId/replies",
    requireAuth,
    async (req, res) => {
        try {
            const { topicId } = req.params;
            const { content } = req.body;

            if (!content || !String(content).trim()) {
                return res.status(400).json({
                    ok: false,
                    message: "Введи текст відповіді."
                });
            }

            const replyId = crypto.randomUUID();

            const result = await pool.query(
                `
                INSERT INTO forum_replies (
                    id,
                    topic_id,
                    user_id,
                    content
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    replyId,
                    topicId,
                    req.user.userId,
                    String(content).trim()
                ]
            );

            res.status(201).json({
                ok: true,
                reply: result.rows[0]
            });
        } catch (error) {
            console.error(
                "Forum reply create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message: "Не вдалося додати відповідь."
            });
        }
    }
);




app.post(
    "/api/forum/replies/:replyId/like",
    requireAuth,
    async (req, res) => {
        try {
            const { replyId } = req.params;

            const replyResult = await pool.query(
                `
                SELECT id, user_id
                FROM forum_replies
                WHERE id = $1
                LIMIT 1
                `,
                [replyId]
            );

            if (replyResult.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Відповідь не знайдено."
                });
            }

            if (
                String(replyResult.rows[0].user_id) ===
                String(req.user.userId)
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не можна лайкати власну відповідь."
                });
            }

            const existingLike = await pool.query(
                `
                SELECT 1
                FROM forum_reply_likes
                WHERE reply_id = $1
                  AND user_id = $2
                LIMIT 1
                `,
                [
                    replyId,
                    req.user.userId
                ]
            );

            let liked;

            if (existingLike.rows.length > 0) {
                await pool.query(
                    `
                    DELETE FROM forum_reply_likes
                    WHERE reply_id = $1
                      AND user_id = $2
                    `,
                    [
                        replyId,
                        req.user.userId
                    ]
                );

                liked = false;
            } else {
                await pool.query(
                    `
                    INSERT INTO forum_reply_likes (
                        reply_id,
                        user_id
                    )
                    VALUES ($1, $2)
                    `,
                    [
                        replyId,
                        req.user.userId
                    ]
                );

                liked = true;
            }

            const countResult = await pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM forum_reply_likes
                WHERE reply_id = $1
                `,
                [replyId]
            );

            res.json({
                ok: true,
                liked,
                likesCount:
                    countResult.rows[0].count
            });

        } catch (error) {
            console.error(
                "Forum reply like error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося змінити лайк."
            });
        }
    }
);


app.delete(
    "/api/forum/replies/:replyId",
    requireAuth,
    async (req, res) => {
        try {
            const { replyId } = req.params;

            const replyResult = await pool.query(
                `
                SELECT id, user_id
                FROM forum_replies
                WHERE id = $1
                LIMIT 1
                `,
                [replyId]
            );

            if (replyResult.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Відповідь не знайдено."
                });
            }

            if (
                String(replyResult.rows[0].user_id) !==
                String(req.user.userId)
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Видалити відповідь може лише її автор."
                });
            }

            await pool.query(
                `
                DELETE FROM forum_replies
                WHERE id = $1
                `,
                [replyId]
            );

            res.json({
                ok: true,
                message: "Відповідь видалено."
            });

        } catch (error) {
            console.error(
                "Forum reply delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити відповідь."
            });
        }
    }
);

app.patch(
    "/api/forum/replies/:replyId",
    requireAuth,
    async (req, res) => {
        try {
            const { replyId } = req.params;

            const content =
                String(
                    req.body?.content || ""
                ).trim();

            if (!content) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Відповідь не може бути порожньою."
                });
            }

            const replyResult =
                await pool.query(
                    `
                    SELECT id, user_id
                    FROM forum_replies
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [replyId]
                );

            if (
                replyResult.rows.length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        ok: false,
                        message:
                            "Відповідь не знайдено."
                    });
            }

            if (
                String(
                    replyResult.rows[0]
                        .user_id
                ) !==
                String(req.user.userId)
            ) {
                return res
                    .status(403)
                    .json({
                        ok: false,
                        message:
                            "Редагувати відповідь може лише її автор."
                    });
            }

            const result =
                await pool.query(
                    `
                    UPDATE forum_replies
                    SET content = $1
                    WHERE id = $2
                    RETURNING *
                    `,
                    [
                        content,
                        replyId
                    ]
                );

            res.json({
                ok: true,
                reply:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Forum reply edit error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося відредагувати відповідь."
            });
        }
    }
);

app.delete(
    "/api/forum/topics/:topicId",
    requireAuth,
    async (req, res) => {
        try {
            const { topicId } = req.params;

            const topicResult = await pool.query(
                `
                SELECT id, user_id
                FROM forum_topics
                WHERE id = $1
                LIMIT 1
                `,
                [topicId]
            );

            if (topicResult.rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    message: "Тему не знайдено."
                });
            }

            if (
                String(topicResult.rows[0].user_id) !==
                String(req.user.userId)
            ) {
                return res.status(403).json({
                    ok: false,
                    message: "Можна видаляти лише власну тему."
                });
            }

            await pool.query(
                `
                DELETE FROM forum_topics
                WHERE id = $1
                `,
                [topicId]
            );

            res.json({
                ok: true,
                message: "Тему видалено."
            });

        } catch (error) {
            console.error(
                "Forum topic delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message: "Не вдалося видалити тему."
            });
        }
    }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});