const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mailTransporter =
    nodemailer.createTransport({
        service: "gmail",

        auth: {
            user:
                process.env.GMAIL_USER,

            pass:
                process.env.GMAIL_APP_PASSWORD
        }
    });

const app = express();

const LIQPAY_PUBLIC_KEY =
    process.env.LIQPAY_PUBLIC_KEY;

const LIQPAY_PRIVATE_KEY =
    process.env.LIQPAY_PRIVATE_KEY;

    function createLiqPaySignature(data) {
        return crypto
            .createHash("sha3-256")
            .update(
                LIQPAY_PRIVATE_KEY +
                data +
                LIQPAY_PRIVATE_KEY
            )
            .digest("base64");
    }

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
});

function normalizeVin(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function validateVin(value) {
    const vin =
        normalizeVin(value);

    if (!vin) {
        return {
            ok: false,
            message:
                "Вкажіть VIN-код автомобіля."
        };
    }

    if (vin.length !== 17) {
        return {
            ok: false,
            message:
                "VIN-код повинен містити рівно 17 символів."
        };
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        return {
            ok: false,
            message:
                "VIN-код містить недопустимі символи. Літери I, O та Q у VIN не використовуються."
        };
    }

    /*
        Відсікаємо очевидно фейкові VIN,
        де весь код складається
        з одного символу.
    */
    if (/^(.)\1{16}$/.test(vin)) {
        return {
            ok: false,
            message:
                "VIN-код виглядає некоректним."
        };
    }

    return {
        ok: true,
        vin
    };
}

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
    CREATE TABLE IF NOT EXISTS business_types (
        id UUID PRIMARY KEY,
        code VARCHAR(60) UNIQUE NOT NULL,
        name VARCHAR(120) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY,
        business_type_code VARCHAR(60) NOT NULL,
        code VARCHAR(60) NOT NULL,
        name VARCHAR(120) NOT NULL,
        price_uah INTEGER NOT NULL DEFAULT 0,
        car_limit INTEGER,
        has_crm BOOLEAN NOT NULL DEFAULT FALSE,
        has_map BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        UNIQUE (
            business_type_code,
            code
        )
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS business_profiles (
        id UUID PRIMARY KEY,

        owner_id UUID UNIQUE NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        business_type_id UUID
            REFERENCES business_types(id),

        subscription_plan_id UUID
            REFERENCES subscription_plans(id),

        name VARCHAR(160) NOT NULL,
        logo TEXT,

        city VARCHAR(100),
        address VARCHAR(255),

        phone VARCHAR(30),
        telegram VARCHAR(100),
        instagram VARCHAR(255),

        description TEXT,

        photos JSONB NOT NULL
            DEFAULT '[]'::jsonb,

        services JSONB NOT NULL
            DEFAULT '[]'::jsonb,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    )
`);

await pool.query(`
    ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS
        subscription_started_at TIMESTAMPTZ
`);

await pool.query(`
    ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS
        subscription_expires_at TIMESTAMPTZ
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS business_subscription_payments (
        id UUID PRIMARY KEY,

        owner_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        business_profile_id UUID NOT NULL
            REFERENCES business_profiles(id)
            ON DELETE CASCADE,

        plan_id UUID NOT NULL
            REFERENCES subscription_plans(id),

        order_id TEXT UNIQUE NOT NULL,

        amount_uah INTEGER NOT NULL,

        status VARCHAR(30) NOT NULL
            DEFAULT 'pending',

        paid_at TIMESTAMPTZ,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    )
`);

await pool.query(`
    INSERT INTO business_types (
        id,
        code,
        name
    )
    VALUES
        (
            '11111111-1111-1111-1111-111111111111',
            'car_service',
            'СТО / автосервіс'
        ),
        (
            '22222222-2222-2222-2222-222222222222',
            'car_dealer',
            'Автомайданчик / продаж авто'
        ),
        (
            '33333333-3333-3333-3333-333333333333',
            'auto_shop',
            'Магазин автотоварів'
        ),
        (
            '44444444-4444-4444-4444-444444444444',
            'detailing',
            'Детейлінг'
        ),
        (
            '55555555-5555-5555-5555-555555555555',
            'tire_service',
            'Шиномонтаж'
        ),
        (
            '66666666-6666-6666-6666-666666666666',
            'road_assistance',
            'Евакуатор / допомога в дорозі'
        ),
        (
            '77777777-7777-7777-7777-777777777777',
            'other',
            'Інше'
        )
    ON CONFLICT (code)
    DO NOTHING
`);

await pool.query(`
    INSERT INTO subscription_plans (
        id,
        business_type_code,
        code,
        name,
        price_uah,
        car_limit,
        has_crm,
        has_map
    )
    VALUES

        (
            'a1111111-1111-1111-1111-111111111111',
            'car_service',
            'business',
            'Business',
            500,
            NULL,
            FALSE,
            FALSE
        ),

        (
            'a2222222-2222-2222-2222-222222222222',
            'car_service',
            'pro',
            'Pro',
            2500,
            NULL,
            TRUE,
            TRUE
        ),

        (
            'b1111111-1111-1111-1111-111111111111',
            'detailing',
            'business',
            'Business',
            500,
            NULL,
            FALSE,
            FALSE
        ),

        (
            'b2222222-2222-2222-2222-222222222222',
            'detailing',
            'pro',
            'Pro',
            2500,
            NULL,
            TRUE,
            TRUE
        ),

        (
            'c1111111-1111-1111-1111-111111111111',
            'car_dealer',
            'business',
            'Business',
            500,
            10,
            FALSE,
            FALSE
        ),

        (
            'c2222222-2222-2222-2222-222222222222',
            'car_dealer',
            'business_plus',
            'Business Plus',
            1500,
            40,
            FALSE,
            FALSE
        ),

        (
            'c3333333-3333-3333-3333-333333333333',
            'car_dealer',
            'pro',
            'Pro',
            2500,
            100,
            FALSE,
            FALSE
        ),

        (
            'd1111111-1111-1111-1111-111111111111',
            'auto_shop',
            'business',
            'Business',
            500,
            NULL,
            FALSE,
            FALSE
        ),

        (
            'e1111111-1111-1111-1111-111111111111',
            'tire_service',
            'business',
            'Business',
            500,
            NULL,
            FALSE,
            FALSE
        ),

        (
            'f1111111-1111-1111-1111-111111111111',
            'road_assistance',
            'business',
            'Business',
            500,
            NULL,
            FALSE,
            FALSE
        )

    ON CONFLICT (
        business_type_code,
        code
    )
    DO NOTHING
`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY,

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        token_hash TEXT NOT NULL
            UNIQUE,

        expires_at TIMESTAMPTZ NOT NULL,

        used_at TIMESTAMPTZ,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    )
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
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,

        listing_id UUID
            REFERENCES market_listings(id)
            ON DELETE CASCADE,

        sender_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        receiver_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        text TEXT,

        attachment JSONB,

        read_at TIMESTAMPTZ,
        edited_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,

        created_at TIMESTAMPTZ
            NOT NULL DEFAULT NOW()
    );
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

await pool.query(`
    ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS status VARCHAR(30)
        NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS market_favorites (
        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        listing_id UUID NOT NULL
            REFERENCES market_listings(id)
            ON DELETE CASCADE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        PRIMARY KEY (
            user_id,
            listing_id
        )
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS garage_cars (
        id UUID PRIMARY KEY,

        owner_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        name VARCHAR(255) NOT NULL,
        year INTEGER,
        mileage INTEGER,

        engine VARCHAR(100),
        fuel VARCHAR(100),
        transmission VARCHAR(100),
        body VARCHAR(100),
        drive VARCHAR(100),

        vin VARCHAR(50),
        plate VARCHAR(50),

        photo TEXT,

        photos JSONB NOT NULL
            DEFAULT '[]'::jsonb,

        active_photo_index INTEGER NOT NULL
            DEFAULT 0,

        services JSONB NOT NULL
            DEFAULT '[]'::jsonb,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS seller_ratings (
        id UUID PRIMARY KEY,

        seller_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        reviewer_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        rating INTEGER NOT NULL
            CHECK (rating >= 1 AND rating <= 5),

        review TEXT NOT NULL DEFAULT '',

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        UNIQUE (
            seller_id,
            reviewer_id
        )
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS royal_auto_sections (
        id UUID PRIMARY KEY,

        owner_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        name VARCHAR(150) NOT NULL,

        slug VARCHAR(150) NOT NULL,

        description TEXT NOT NULL
            DEFAULT '',

        icon VARCHAR(50) NOT NULL
            DEFAULT '👑',

        active BOOLEAN NOT NULL
            DEFAULT TRUE,

        sort_order INTEGER NOT NULL
            DEFAULT 0,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        UNIQUE (
            owner_id,
            slug
        )
    )
`);


await pool.query(`
    CREATE TABLE IF NOT EXISTS royal_auto_products (
        id UUID PRIMARY KEY,

        owner_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        section_id UUID NOT NULL
            REFERENCES royal_auto_sections(id)
            ON DELETE CASCADE,

        name VARCHAR(200) NOT NULL,

        description TEXT NOT NULL
            DEFAULT '',

        price_uah NUMERIC(12, 2),

        photos JSONB NOT NULL
            DEFAULT '[]'::jsonb,

        active BOOLEAN NOT NULL
            DEFAULT TRUE,

        sort_order INTEGER NOT NULL
            DEFAULT 0,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW()
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS service_history_purchases (
        id UUID PRIMARY KEY,

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        listing_id UUID NOT NULL
            REFERENCES market_listings(id)
            ON DELETE CASCADE,

        order_id TEXT UNIQUE NOT NULL,

        amount_uah NUMERIC(10, 2) NOT NULL,

        status VARCHAR(30) NOT NULL
            DEFAULT 'pending',

        paid_at TIMESTAMPTZ,

        created_at TIMESTAMPTZ NOT NULL
            DEFAULT NOW(),

        UNIQUE (
            user_id,
            listing_id
        )
    )
`);await pool.query(`
CREATE TABLE IF NOT EXISTS service_history_purchases (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    listing_id UUID NOT NULL
        REFERENCES market_listings(id)
        ON DELETE CASCADE,

    order_id TEXT UNIQUE NOT NULL,

    amount_uah NUMERIC(10, 2) NOT NULL,

    status VARCHAR(30) NOT NULL
        DEFAULT 'pending',

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        user_id,
        listing_id
    )
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

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.get(
    "/api/garage/cars",
    requireAuth,
    async (req, res) => {
        try {
            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id AS "ownerId",
                        name,
                        year,
                        mileage,
                        engine,
                        fuel,
                        transmission,
                        body,
                        drive,
                        vin,
                        plate,
                        photo,
                        photos,
                        active_photo_index AS "activePhotoIndex",
                        services,
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"
                    FROM garage_cars
                    WHERE owner_id = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.userId
                    ]
                );

            res.json({
                ok: true,
                cars: result.rows
            });
        } catch (error) {
            console.error(
                "Garage cars load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити гараж."
            });
        }
    }
);

app.post(
    "/api/garage/cars",
    requireAuth,
    async (req, res) => {
        try {
            const {
                name,
                year,
                mileage,
                engine,
                fuel,
                transmission,
                body,
                drive,
                vin,
                plate,
                photo,
                photos,
                activePhotoIndex,
                services
            } = req.body;

            if (!name) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано назву автомобіля."
                });
            }

            const carId =
                crypto.randomUUID();

            const safePhotos =
                Array.isArray(photos)
                    ? photos
                    : photo
                        ? [photo]
                        : [];

            const safeServices =
                Array.isArray(services)
                    ? services
                    : [];

            const result =
                await pool.query(
                    `
                    INSERT INTO garage_cars (
                        id,
                        owner_id,
                        name,
                        year,
                        mileage,
                        engine,
                        fuel,
                        transmission,
                        body,
                        drive,
                        vin,
                        plate,
                        photo,
                        photos,
                        active_photo_index,
                        services
                    )
                    VALUES (
                        $1, $2, $3, $4,
                        $5, $6, $7, $8,
                        $9, $10, $11, $12,
                        $13, $14::jsonb,
                        $15, $16::jsonb
                    )
                    RETURNING
                        id,
                        owner_id AS "ownerId",
                        name,
                        year,
                        mileage,
                        engine,
                        fuel,
                        transmission,
                        body,
                        drive,
                        vin,
                        plate,
                        photo,
                        photos,
                        active_photo_index AS "activePhotoIndex",
                        services,
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"
                    `,
                    [
                        carId,
                        req.user.userId,
                        name,
                        year || null,
                        mileage ?? null,
                        engine || "",
                        fuel || "",
                        transmission || "",
                        body || "",
                        drive || "",
                        vin || "",
                        plate || "",
                        photo || "",
                        JSON.stringify(
                            safePhotos
                        ),
                        Number.isInteger(
                            activePhotoIndex
                        )
                            ? activePhotoIndex
                            : 0,
                        JSON.stringify(
                            safeServices
                        )
                    ]
                );

            res.status(201).json({
                ok: true,
                car: result.rows[0]
            });
        } catch (error) {
            console.error(
                "Garage car create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося додати автомобіль."
            });
        }
    }
);

app.patch(
    "/api/garage/cars/:carId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                carId
            } = req.params;

            const {
                name,
                year,
                mileage,
                engine,
                fuel,
                transmission,
                body,
                drive,
                vin,
                plate,
                photo,
                photos,
                activePhotoIndex,
                services
            } = req.body;

            const existing =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id
                    FROM garage_cars
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        carId
                    ]
                );

            if (
                existing.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Автомобіль не знайдено."
                });
            }

            if (
                String(
                    existing.rows[0]
                        .owner_id
                ) !==
                String(
                    req.user.userId
                )
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Немає доступу до цього автомобіля."
                });
            }

            const safePhotos =
                Array.isArray(photos)
                    ? photos
                    : [];

            const safeServices =
                Array.isArray(services)
                    ? services
                    : [];

            const result =
                await pool.query(
                    `
                    UPDATE garage_cars
                    SET
                        name = $1,
                        year = $2,
                        mileage = $3,
                        engine = $4,
                        fuel = $5,
                        transmission = $6,
                        body = $7,
                        drive = $8,
                        vin = $9,
                        plate = $10,
                        photo = $11,
                        photos = $12::jsonb,
                        active_photo_index = $13,
                        services = $14::jsonb,
                        updated_at = NOW()
                    WHERE id = $15
                    RETURNING
                        id,
                        owner_id AS "ownerId",
                        name,
                        year,
                        mileage,
                        engine,
                        fuel,
                        transmission,
                        body,
                        drive,
                        vin,
                        plate,
                        photo,
                        photos,
                        active_photo_index AS "activePhotoIndex",
                        services,
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"
                    `,
                    [
                        name || "",
                        year || null,
                        mileage ?? null,
                        engine || "",
                        fuel || "",
                        transmission || "",
                        body || "",
                        drive || "",
                        vin || "",
                        plate || "",
                        photo || "",
                        JSON.stringify(
                            safePhotos
                        ),
                        Number.isInteger(
                            activePhotoIndex
                        )
                            ? activePhotoIndex
                            : 0,
                        JSON.stringify(
                            safeServices
                        ),
                        carId
                    ]
                );

            res.json({
                ok: true,
                car: result.rows[0]
            });
        } catch (error) {
            console.error(
                "Garage car update error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити автомобіль."
            });
        }
    }
);

app.delete(
    "/api/garage/cars/:carId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                carId
            } = req.params;

            const existing =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id
                    FROM garage_cars
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        carId
                    ]
                );

            if (
                existing.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Автомобіль не знайдено."
                });
            }

            if (
                String(
                    existing.rows[0]
                        .owner_id
                ) !==
                String(
                    req.user.userId
                )
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Немає доступу до цього автомобіля."
                });
            }

            await pool.query(
                `
                DELETE FROM garage_cars
                WHERE id = $1
                `,
                [
                    carId
                ]
            );

            res.json({
                ok: true,
                message:
                    "Автомобіль успішно видалено."
            });
        } catch (error) {
            console.error(
                "Garage car delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити автомобіль."
            });
        }
    }
);

app.get(
    "/api/sellers/:sellerId/rating",
    async (req, res) => {
        try {
            const { sellerId } =
                req.params;

            const result =
                await pool.query(
                    `
                    SELECT
                        COALESCE(
                            AVG(rating),
                            0
                        ) AS average,
                        COUNT(*)::integer
                            AS count
                    FROM seller_ratings
                    WHERE seller_id = $1
                    `,
                    [
                        sellerId
                    ]
                );

            const row =
                result.rows[0];

            res.json({
                ok: true,
                rating: {
                    average:
                        Number(
                            row.average || 0
                        ),
                    count:
                        Number(
                            row.count || 0
                        )
                }
            });

        } catch (error) {
            console.error(
                "Seller rating load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити рейтинг продавця."
            });
        }
    }
);

app.post(
    "/api/sellers/:sellerId/rating",
    requireAuth,
    async (req, res) => {
        try {
            const { sellerId } =
                req.params;

            const reviewerId =
                req.user.userId;

            const rating =
                Number(
                    req.body.rating
                );

            const reviewProvided =
                Object.prototype
                    .hasOwnProperty.call(
                        req.body,
                        "review"
                    );

            const review =
                reviewProvided
                    ? String(
                        req.body.review || ""
                    )
                        .trim()
                        .slice(0, 1000)
                    : null;

            if (
                String(sellerId) ===
                String(reviewerId)
            ) {
                return res
                    .status(400)
                    .json({
                        ok: false,
                        message:
                            "Не можна оцінювати самого себе."
                    });
            }

            if (
                !Number.isInteger(
                    rating
                ) ||
                rating < 1 ||
                rating > 5
            ) {
                return res
                    .status(400)
                    .json({
                        ok: false,
                        message:
                            "Оцінка має бути від 1 до 5."
                    });
            }

            const result =
                await pool.query(
                    `
                    INSERT INTO seller_ratings (
                        id,
                        seller_id,
                        reviewer_id,
                        rating,
                        review
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        COALESCE(
                            $5,
                            ''
                        )
                    )

                    ON CONFLICT (
                        seller_id,
                        reviewer_id
                    )
                    DO UPDATE SET
                        rating =
                            EXCLUDED.rating,

                        review =
                            CASE
                                WHEN $5::text
                                    IS NULL
                                THEN
                                    seller_ratings.review
                                ELSE
                                    EXCLUDED.review
                            END,

                        updated_at =
                            NOW()

                    RETURNING
                        rating,
                        review,
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"
                    `,
                    [
                        crypto.randomUUID(),
                        sellerId,
                        reviewerId,
                        rating,
                        review
                    ]
                );

            res.json({
                ok: true,
                rating:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Seller rating save error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося зберегти оцінку або відгук."
            });
        }
    }
);

app.get(
    "/api/sellers/:sellerId/profile",
    async (req, res) => {
        try {
            const { sellerId } =
                req.params;

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        city,
                        phone,
                        telegram,
                        profile_photo,
                        show_phone,
                        show_telegram,
                        created_at
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        sellerId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Продавця не знайдено."
                });
            }

            res.json({
                ok: true,
                seller:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Seller public profile load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити профіль продавця."
            });
        }
    }
);

app.get(
    "/api/sellers/:sellerId/reviews",
    async (req, res) => {
        try {
            const { sellerId } =
                req.params;

            const result =
                await pool.query(
                    `
                    SELECT
                    sr.reviewer_id AS "userId",
                    sr.rating,
                    sr.review AS "text",
                    sr.updated_at AS "updatedAt",
                    u.name AS "userName"
                    FROM seller_ratings sr
                    JOIN users u
                        ON u.id = sr.reviewer_id
                    WHERE sr.seller_id = $1
                    AND TRIM(sr.review) <> ''
                    ORDER BY sr.updated_at DESC
                    `,
                    [
                        sellerId
                    ]
                );

            res.json({
                ok: true,
                reviews:
                    result.rows
            });

        } catch (error) {
            console.error(
                "Seller reviews load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити відгуки продавця."
            });
        }
    }
);

app.get(
    "/api/garage/public-history/:listingId",
    async (req, res) => {
        try {
            const {
                listingId
            } = req.params;

            const listingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id,
                        vin
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        listingId
                    ]
                );

            if (
                listingResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            const listing =
                listingResult.rows[0];

            const vin =
                String(
                    listing.vin || ""
                )
                    .trim()
                    .toUpperCase();

            if (!vin) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "VIN автомобіля не вказано."
                });
            }

            const carResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        mileage,
                        services
                    FROM garage_cars
                    WHERE owner_id = $1
                      AND UPPER(TRIM(vin)) = $2
                    LIMIT 1
                    `,
                    [
                        listing.owner_id,
                        vin
                    ]
                );

            if (
                carResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Історія обслуговування цього автомобіля недоступна."
                });
            }

            const car =
                carResult.rows[0];
                const services =
                Array.isArray(
                    car.services
                )
                    ? car.services.filter(
                        (service) => {
                            const isPublic =
                                service.isPublic;
            
                            return (
                                isPublic === true ||
                                isPublic === "true" ||
                                isPublic === 1 ||
                                isPublic === "1"
                            );
                        }
                    )
                    : [];

            res.json({
                ok: true,

                car: {
                    id:
                        car.id,

                    mileage:
                        car.mileage,

                    services
                }
            });

        } catch (error) {
            console.error(
                "Public service history load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити історію обслуговування."
            });
        }
    }
);

app.get(
    "/api/chat/conversations",
    requireAuth,
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const result =
                await pool.query(
                    `
                    SELECT
                        cm.id,
                        cm.listing_id AS "listingId",
                        cm.sender_id AS "senderId",
                        cm.receiver_id AS "receiverId",
                        cm.text,
                        cm.attachment,
                        cm.read_at AS "readAt",
                        cm.edited_at AS "editedAt",
                        cm.deleted_at AS "deletedAt",
                        cm.created_at AS "createdAt",

                        ml.name AS "listingName",
                        ml.year AS "listingYear",
                        ml.photos AS "listingPhotos"

                    FROM chat_messages cm

                    LEFT JOIN market_listings ml
                        ON ml.id = cm.listing_id

                    WHERE
                        cm.sender_id = $1
                        OR cm.receiver_id = $1

                    ORDER BY
                        cm.created_at DESC
                    `,
                    [
                        userId
                    ]
                );

            res.json({
                ok: true,
                messages:
                    result.rows
            });

        } catch (error) {
            console.error(
                "Chat conversations load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити список чатів."
            });
        }
    }
);

app.get(
    "/api/chat/messages",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId,
                partnerId
            } = req.query;

            if (!listingId || !partnerId) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано оголошення або співрозмовника."
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        listing_id,
                        sender_id,
                        receiver_id,
                        text,
                        attachment,
                        read_at,
                        edited_at,
                        deleted_at,
                        created_at
                    FROM chat_messages
                    WHERE listing_id = $1
                      AND (
                            (
                                sender_id = $2
                                AND receiver_id = $3
                            )
                            OR
                            (
                                sender_id = $3
                                AND receiver_id = $2
                            )
                      )
                    ORDER BY created_at ASC
                    `,
                    [
                        listingId,
                        req.user.userId,
                        partnerId
                    ]
                );

            res.json({
                ok: true,
                messages:
                    result.rows
            });

        } catch (error) {
            console.error(
                "Chat messages load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити повідомлення."
            });
        }
    }
);
app.post(
    "/api/chat/messages",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId,
                receiverId,
                text,
                attachment
            } = req.body;

            if (
                !listingId ||
                !receiverId
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Недостатньо даних для повідомлення."
                });
            }

            const messageId =
                crypto.randomUUID();

            const result =
                await pool.query(
                    `
                    INSERT INTO chat_messages (
                        id,
                        listing_id,
                        sender_id,
                        receiver_id,
                        text,
                        attachment
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    RETURNING *
                    `,
                    [
                        messageId,
                        listingId,
                        req.user.userId,
                        receiverId,
                        text || null,
                        attachment || null
                    ]
                );

            res.status(201).json({
                ok: true,
                message:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Chat message create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося надіслати повідомлення."
            });
        }
    }
);
app.patch(
    "/api/chat/messages/read",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId,
                partnerId
            } = req.body;

            if (!listingId || !partnerId) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано оголошення або співрозмовника."
                });
            }

            await pool.query(
                `
                UPDATE chat_messages
                SET read_at = NOW()
                WHERE listing_id = $1
                  AND sender_id = $2
                  AND receiver_id = $3
                  AND read_at IS NULL
                `,
                [
                    listingId,
                    partnerId,
                    req.user.userId
                ]
            );

            res.json({
                ok: true
            });

        } catch (error) {
            console.error(
                "Chat messages read error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити статус повідомлень."
            });
        }
    }
);

app.patch(
    "/api/chat/messages/:messageId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                messageId
            } = req.params;

            const {
                text
            } = req.body;

            if (
                !String(text || "").trim()
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Повідомлення не може бути порожнім."
                });
            }

            const result =
                await pool.query(
                    `
                    UPDATE chat_messages
                    SET
                        text = $1,
                        edited_at = NOW()
                    WHERE id = $2
                      AND sender_id = $3
                      AND deleted_at IS NULL
                    RETURNING *
                    `,
                    [
                        String(text).trim(),
                        messageId,
                        req.user.userId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Повідомлення не знайдено або його не можна редагувати."
                });
            }

            res.json({
                ok: true,
                message:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Chat message edit error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося відредагувати повідомлення."
            });
        }
    }
);

app.delete(
    "/api/chat/messages/:messageId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                messageId
            } = req.params;

            const result =
                await pool.query(
                    `
                    UPDATE chat_messages
                    SET deleted_at = NOW()
                    WHERE id = $1
                      AND sender_id = $2
                      AND deleted_at IS NULL
                    RETURNING id
                    `,
                    [
                        messageId,
                        req.user.userId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Повідомлення не знайдено або його не можна видалити."
                });
            }

            res.json({
                ok: true
            });

        } catch (error) {
            console.error(
                "Chat message delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити повідомлення."
            });
        }
    }
);

app.get(
    "/api/businesses/categories",
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    bt.code,
                    bt.name,
                    COUNT(bp.id)::integer AS "businessCount"

                FROM business_types bt

                JOIN business_profiles bp
                    ON bp.business_type_id = bt.id

                JOIN subscription_plans sp
                    ON sp.id = bp.subscription_plan_id

                WHERE
                    sp.is_active = TRUE
                    AND bp.subscription_expires_at > NOW()

                GROUP BY
                    bt.id,
                    bt.code,
                    bt.name

                HAVING COUNT(bp.id) > 0

                ORDER BY bt.name ASC
            `);

            res.json({
                ok: true,
                categories: result.rows
            });

        } catch (error) {
            console.error(
                "Business categories load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити категорії бізнесів."
            });
        }
    }
);

app.get(
    "/api/businesses",
    async (req, res) => {
        try {
            const type = String(req.query.type || "").trim();

            if (!type) {
                return res.status(400).json({
                    ok: false,
                    message: "Не вказано тип бізнесу."
                });
            }

            const result = await pool.query(
                `
                SELECT
                    bp.id,
                    bp.owner_id AS "ownerId",
                    bp.name AS "businessName",
                    bp.logo AS "logoUrl",
                    bp.city,
                    bp.address,
                    bp.description,

                    bt.code AS "businessTypeCode",
                    bt.name AS "businessTypeName"

                FROM business_profiles bp

                JOIN business_types bt
                    ON bt.id = bp.business_type_id

                JOIN subscription_plans sp
                    ON sp.id = bp.subscription_plan_id

                WHERE
                    bt.code = $1
                    AND sp.is_active = TRUE
                    AND bp.subscription_expires_at > NOW()

                ORDER BY
                    bp.name ASC
                `,
                [type]
            );

            res.json({
                ok: true,
                businesses: result.rows
            });

        } catch (error) {
            console.error(
                "Business list load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити список бізнесів."
            });
        }
    }
);

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
                    WHERE status = 'active'
                      AND (
                          expires_at IS NULL
                          OR expires_at > NOW()
                      )
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

                        const vinValidation =
                validateVin(vin);

            if (!vinValidation.ok) {
                return res.status(400).json({
                    ok: false,
                    message:
                        vinValidation.message
                });
            }

            const normalizedVin =
                vinValidation.vin;

                const duplicateVinResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM market_listings
                        WHERE UPPER(TRIM(vin)) = $1
                        LIMIT 1
                        `,
                        [normalizedVin]
                    );

                if (
                    duplicateVinResult.rows.length > 0
                ) {
                    return res.status(409).json({
                        ok: false,
                        message:
                            "Оголошення з таким VIN-кодом уже існує."
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

                let listingStatus =
    "pending_payment";

let publishedAt =
    null;

let expiresAt =
    null;


const businessPlanResult =
    await pool.query(
        `
        SELECT
            sp.car_limit AS "carLimit"

        FROM business_profiles bp

        JOIN business_types bt
            ON bt.id =
                bp.business_type_id

        JOIN subscription_plans sp
            ON sp.id =
                bp.subscription_plan_id

        WHERE bp.owner_id = $1
          AND bt.code = 'car_dealer'
          AND bp.subscription_expires_at > NOW()
          AND sp.is_active = TRUE
          AND sp.car_limit IS NOT NULL

        LIMIT 1
        `,
        [
            req.user.userId
        ]
    );


if (
    businessPlanResult.rows.length > 0
) {
    const carLimit =
        Number(
            businessPlanResult
                .rows[0]
                .carLimit
        );


    const activeListingsResult =
        await pool.query(
            `
            SELECT
                COUNT(*)::integer
                    AS count

            FROM market_listings

            WHERE owner_id = $1
              AND status = 'active'
              AND (
                    expires_at IS NULL
                    OR expires_at > NOW()
              )
            `,
            [
                req.user.userId
            ]
        );


    const activeListingsCount =
        Number(
            activeListingsResult
                .rows[0]
                .count || 0
        );


    if (
        activeListingsCount <
        carLimit
    ) {
        listingStatus =
            "active";

        publishedAt =
            new Date();

        expiresAt =
            null;
    }
}

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
                    description,
                    status,
                    published_at,
                    expires_at
              )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24, $25, $26
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
                    normalizedVin,
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
                    listingStatus,
                    publishedAt,
                    expiresAt
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

                        const vinValidation =
                validateVin(vin);

            if (!vinValidation.ok) {
                return res.status(400).json({
                    ok: false,
                    message:
                        vinValidation.message
                });
            }

            const normalizedVin =
                vinValidation.vin;

                const duplicateVinResult =
    await pool.query(
        `
        SELECT id
        FROM market_listings
        WHERE UPPER(TRIM(vin)) = $1
          AND id <> $2
        LIMIT 1
        `,
        [
            normalizedVin,
            listingId
        ]
    );

if (
    duplicateVinResult.rows.length > 0
) {
    return res.status(409).json({
        ok: false,
        message:
            "Інше оголошення з таким VIN-кодом уже існує."
    });
}

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
                    normalizedVin,
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

app.delete(
    "/api/market/listings/:listingId",
    requireAuth,
    async (req, res) => {
        try {
            const { listingId } =
                req.params;

            const listingResult =
                await pool.query(
                    `
                    SELECT id, owner_id
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [listingId]
                );

            if (
                listingResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            const listing =
                listingResult.rows[0];

            if (
                String(listing.owner_id) !==
                String(req.user.userId)
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Ви не можете видалити чуже оголошення."
                });
            }

            await pool.query(
                `
                DELETE FROM market_listings
                WHERE id = $1
                `,
                [listingId]
            );

            res.json({
                ok: true,
                message:
                    "Оголошення успішно видалено."
            });

        } catch (error) {
            console.error(
                "Market listing delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити оголошення."
            });
        }
    }
);

/* ===== ОБРАНІ ОГОЛОШЕННЯ ===== */

app.get(
    "/api/market/favorites",
    requireAuth,
    async (req, res) => {
        try {
            const result =
                await pool.query(
                    `
                    SELECT listing_id
                    FROM market_favorites
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.userId
                    ]
                );

            res.json({
                ok: true,
                favoriteIds:
                    result.rows.map(
                        (row) =>
                            String(
                                row.listing_id
                            )
                    )
            });

        } catch (error) {
            console.error(
                "Market favorites load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити обране."
            });
        }
    }
);


app.post(
    "/api/market/favorites/:listingId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId
            } = req.params;

            const listingResult =
                await pool.query(
                    `
                    SELECT id
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        listingId
                    ]
                );

            if (
                listingResult.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            await pool.query(
                `
                INSERT INTO market_favorites (
                    user_id,
                    listing_id
                )
                VALUES ($1, $2)
                ON CONFLICT (
                    user_id,
                    listing_id
                )
                DO NOTHING
                `,
                [
                    req.user.userId,
                    listingId
                ]
            );

            res.json({
                ok: true,
                listingId
            });

        } catch (error) {
            console.error(
                "Market favorite add error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося додати оголошення в обране."
            });
        }
    }
);


app.delete(
    "/api/market/favorites/:listingId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId
            } = req.params;

            await pool.query(
                `
                DELETE FROM market_favorites
                WHERE user_id = $1
                  AND listing_id = $2
                `,
                [
                    req.user.userId,
                    listingId
                ]
            );

            res.json({
                ok: true,
                listingId
            });

        } catch (error) {
            console.error(
                "Market favorite delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити оголошення з обраного."
            });
        }
    }
);

app.get(
    "/api/debug/users",
    async (req, res) => {
        try {
            const result =
                await pool.query(`
                    SELECT
                        id,
                        name,
                        email,
                        phone,
                        account_type,
                        role
                    FROM users
                    ORDER BY created_at ASC
                `);

            res.json({
                ok: true,
                users: result.rows
            });

        } catch (error) {
            console.error(
                "Debug users load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити користувачів."
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

app.get(
    "/api/business/types",
    async (req, res) => {
        try {
            const result =
                await pool.query(`
                    SELECT
                        id,
                        code,
                        name
                    FROM business_types
                    ORDER BY name ASC
                `);

            res.json({
                ok: true,
                types: result.rows
            });

        } catch (error) {
            console.error(
                "Business types load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити типи бізнесу."
            });
        }
    }
);

app.get(
    "/api/business/plans",
    async (req, res) => {
        try {
            const type =
                String(
                    req.query.type || ""
                ).trim();

            if (!type) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано тип бізнесу."
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        business_type_code AS "businessTypeCode",
                        code,
                        name,
                        price_uah AS "priceUah",
                        car_limit AS "carLimit",
                        has_crm AS "hasCrm",
                        has_map AS "hasMap"
                    FROM subscription_plans
                    WHERE business_type_code = $1
                      AND is_active = TRUE
                    ORDER BY price_uah ASC
                    `,
                    [
                        type
                    ]
                );

            res.json({
                ok: true,
                plans: result.rows
            });

        } catch (error) {
            console.error(
                "Business plans load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити тарифи."
            });
        }
    }
);

/* =========================
   LIQPAY — СТВОРЕННЯ ПЛАТЕЖУ
   ========================= */

   app.post(
    "/api/payments/liqpay/create",
    requireAuth,
    async (req, res) => {
        try {
            if (
                !LIQPAY_PUBLIC_KEY ||
                !LIQPAY_PRIVATE_KEY
            ) {
                return res.status(500).json({
                    ok: false,
                    message:
                        "LiqPay не налаштований на сервері."
                });
            }

            const planId =
                String(
                    req.body.planId || ""
                ).trim();

            if (!planId) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вибрано тариф."
                });
            }

            const planResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        code,
                        name,
                        price_uah AS "priceUah"
                    FROM subscription_plans
                    WHERE id = $1
                      AND is_active = TRUE
                    LIMIT 1
                    `,
                    [
                        planId
                    ]
                );

            if (
                planResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Тариф не знайдено."
                });
            }

            const plan =
                planResult.rows[0];

            const amount =
                Number(
                    plan.priceUah
                );

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Для тарифу вказана неправильна ціна."
                });
            }

            const orderId =
                `rg_${req.user.userId}_${Date.now()}`;

                const businessProfileResult =
    await pool.query(
        `
        SELECT
            id,
            owner_id
        FROM business_profiles
        WHERE owner_id = $1
        LIMIT 1
        `,
        [
            req.user.userId
        ]
    );

if (
    businessProfileResult.rows.length === 0
) {
    return res.status(404).json({
        ok: false,
        message:
            "Бізнес-профіль не знайдено."
    });
}

const businessProfile =
    businessProfileResult.rows[0];


await pool.query(
    `
    INSERT INTO business_subscription_payments (
        id,
        owner_id,
        business_profile_id,
        plan_id,
        order_id,
        amount_uah,
        status
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'pending'
    )
    `,
    [
        crypto.randomUUID(),
        req.user.userId,
        businessProfile.id,
        plan.id,
        orderId,
        Math.round(amount)
    ]
);

            const paymentParams = {
                public_key:
                    LIQPAY_PUBLIC_KEY,

                version: 7,

                action: "pay",

                amount:
                    amount.toFixed(2),

                currency: "UAH",

                description:
                    `Royal Garage — ${plan.name}`,

                    order_id:
                    orderId,
                
                language:
                    "uk",
                
                sandbox:
                    1,
                
                server_url:
                    "https://royal-garage.onrender.com/api/payments/liqpay/callback",
                
                result_url:
                    "https://royal-garage.onrender.com/business-profile.html?payment=return"
            };

            const data =
                Buffer
                    .from(
                        JSON.stringify(
                            paymentParams
                        )
                    )
                    .toString(
                        "base64"
                    );

            const signature =
                createLiqPaySignature(
                    data
                );

            res.json({
                ok: true,

                checkoutUrl:
                    "https://www.liqpay.ua/api/3/checkout",

                data,
                signature,
                orderId,

                plan: {
                    id:
                        plan.id,

                    name:
                        plan.name,

                    priceUah:
                        amount
                }
            });

        } catch (error) {
            console.error(
                "LiqPay payment create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося створити платіж."
            });
        }
    }
);

/* =========================
   LIQPAY — ОПЛАТА ІСТОРІЇ АВТО
   ========================= */

   app.post(
    "/api/payments/liqpay/history",
    requireAuth,
    async (req, res) => {
        try {
            if (
                !LIQPAY_PUBLIC_KEY ||
                !LIQPAY_PRIVATE_KEY
            ) {
                return res.status(500).json({
                    ok: false,
                    message:
                        "LiqPay не налаштований на сервері."
                });
            }

            const listingId =
                String(
                    req.body.listingId || ""
                ).trim();

            if (!listingId) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано автомобіль."
                });
            }

            const listingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id,
                        name,
                        year
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        listingId
                    ]
                );

            if (
                listingResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            const listing =
                listingResult.rows[0];

            if (
                String(listing.owner_id) ===
                String(req.user.userId)
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Власнику автомобіля оплата не потрібна."
                });
            }

            const amount = 50;

            const orderId =
                `history_${listingId}_${req.user.userId}_${Date.now()}`;

                await pool.query(
                    `
                    INSERT INTO service_history_purchases (
                        id,
                        user_id,
                        listing_id,
                        order_id,
                        amount_uah,
                        status
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        'pending'
                    )
                    ON CONFLICT (
                        user_id,
                        listing_id
                    )
                    DO UPDATE SET
                        order_id = EXCLUDED.order_id,
                        amount_uah = EXCLUDED.amount_uah,
                        status = 'pending',
                        paid_at = NULL
                    `,
                    [
                        crypto.randomUUID(),
                        req.user.userId,
                        listingId,
                        orderId,
                        amount
                    ]
                );

            const baseUrl =
                "https://royal-garage.onrender.com";

            const paymentParams = {
                public_key:
                    LIQPAY_PUBLIC_KEY,

                version: 7,

                action: "pay",

                amount:
                    amount.toFixed(2),

                currency:
                    "UAH",

                description:
                    `Royal Garage — історія ${listing.name || "автомобіля"} ${listing.year || ""}`,

                order_id:
                    orderId,

                language:
                    "uk",

                    result_url:
                    `${baseUrl}/seller.html?sellerId=${encodeURIComponent(
                        listing.owner_id
                    )}&listingId=${encodeURIComponent(
                        listingId
                    )}#service-history`,

                server_url:
                    `${baseUrl}/api/payments/liqpay/callback`
            };

            const data =
                Buffer
                    .from(
                        JSON.stringify(
                            paymentParams
                        )
                    )
                    .toString(
                        "base64"
                    );

            const signature =
                createLiqPaySignature(
                    data
                );

            res.json({
                ok: true,

                checkoutUrl:
                    "https://www.liqpay.ua/api/3/checkout",

                data,
                signature,

                orderId,

                purchase: {
                    type:
                        "service_history",

                    listingId,

                    priceUah:
                        amount
                }
            });

        } catch (error) {
            console.error(
                "LiqPay history payment create error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося створити оплату історії."
            });
        }
    }
);

/* =========================
   LIQPAY — ОПЛАТА ОГОЛОШЕННЯ
   150 грн / 28 днів
   ========================= */

   app.post(
    "/api/payments/liqpay/listing",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId
            } = req.body;

            if (!listingId) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Не вказано оголошення."
                });
            }

            const listingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id,
                        name,
                        year,
                        status
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        listingId
                    ]
                );

            if (
                listingResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            const listing =
                listingResult.rows[0];

            if (
                String(listing.owner_id) !==
                String(req.user.userId)
            ) {
                return res.status(403).json({
                    ok: false,
                    message:
                        "Немає доступу до цього оголошення."
                });
            }

            const amount = 150;

            const orderId =
                `listing_${listingId}_${Date.now()}`;

            const baseUrl =
                "https://royal-garage.onrender.com";

            const paymentData = {
                public_key:
                    LIQPAY_PUBLIC_KEY,

                version:
                    "7",

                action:
                    "pay",

                amount,

                currency:
                    "UAH",

                description:
                    `Royal Garage — оголошення ${
                        listing.name || ""
                    } ${
                        listing.year || ""
                    }`.trim(),

                order_id:
                    orderId,

                sandbox:
                    1,

                server_url:
                    `${baseUrl}/api/payments/liqpay/callback`,

                result_url:
                    `${baseUrl}/market.html?listingPayment=return&listingId=${encodeURIComponent(
                        listingId
                    )}`
            };

            const data =
                Buffer
                    .from(
                        JSON.stringify(
                            paymentData
                        )
                    )
                    .toString(
                        "base64"
                    );

            const signature =
                createLiqPaySignature(
                    data
                );

            return res.json({
                ok: true,

                checkoutUrl:
                    "https://www.liqpay.ua/api/3/checkout",

                data,
                signature,
                listingId
            });

        } catch (error) {
            console.error(
                "Listing LiqPay create error:",
                error
            );

            return res.status(500).json({
                ok: false,
                message:
                    "Не вдалося створити оплату оголошення."
            });
        }
    }
);

/* =========================
   LIQPAY — CALLBACK
   ========================= */

   app.post(
    "/api/payments/liqpay/callback",
    async (req, res) => {
        try {
            const data =
                String(
                    req.body.data || ""
                );

            const signature =
                String(
                    req.body.signature || ""
                );

            if (!data || !signature) {
                return res
                    .status(400)
                    .send("Missing data");
            }

            const expectedSignature =
                createLiqPaySignature(
                    data
                );

            if (
                signature !==
                expectedSignature
            ) {
                console.error(
                    "LiqPay callback: invalid signature"
                );

                return res
                    .status(400)
                    .send("Invalid signature");
            }

            let payment;

            try {
                payment =
                    JSON.parse(
                        Buffer
                            .from(
                                data,
                                "base64"
                            )
                            .toString(
                                "utf8"
                            )
                    );
            } catch (error) {
                console.error(
                    "LiqPay callback decode error:",
                    error
                );

                return res
                    .status(400)
                    .send("Invalid data");
            }

            const orderId =
                String(
                    payment.order_id || ""
                );

            const status =
                String(
                    payment.status || ""
                );

            const amount =
                Number(
                    payment.amount
                );

            const currency =
                String(
                    payment.currency || ""
                ).toUpperCase();

            if (!orderId) {
                return res
                    .status(400)
                    .send("Missing order_id");
            }

            /*
                У бойовому режимі:
                success = успішна оплата.

                У тестовому режимі:
                sandbox = успішна тестова оплата.
            */

            const isPaid =
                status === "success" ||
                status === "sandbox";

                if (
                    orderId.startsWith("rg_")
                ) {
                    const paymentResult =
                        await pool.query(
                            `
                            SELECT
                                bsp.id,
                                bsp.owner_id,
                                bsp.business_profile_id,
                                bsp.plan_id,
                                bsp.amount_uah,
                                bsp.status
                
                            FROM business_subscription_payments bsp
                
                            WHERE bsp.order_id = $1
                
                            LIMIT 1
                            `,
                            [
                                orderId
                            ]
                        );
                
                    if (
                        paymentResult.rows.length === 0
                    ) {
                        console.error(
                            "Business payment not found:",
                            orderId
                        );
                
                        return res
                            .status(404)
                            .send(
                                "Business payment not found"
                            );
                    }
                
                    const businessPayment =
                        paymentResult.rows[0];
                
                
                    if (!isPaid) {
                        await pool.query(
                            `
                            UPDATE business_subscription_payments
                
                            SET status = $1
                
                            WHERE order_id = $2
                            `,
                            [
                                status || "unknown",
                                orderId
                            ]
                        );
                
                        return res.send("OK");
                    }
                
                
                    if (
                        currency !== "UAH" ||
                        Number(
                            businessPayment.amount_uah
                        ) !== amount
                    ) {
                        console.error(
                            "Business payment amount mismatch:",
                            {
                                orderId,
                                expected:
                                    businessPayment.amount_uah,
                                received:
                                    amount,
                                currency
                            }
                        );
                
                        return res
                            .status(400)
                            .send(
                                "Invalid business payment amount"
                            );
                    }
                
                
                    const client =
                        await pool.connect();
                
                    try {
                        await client.query(
                            "BEGIN"
                        );
                
                
                        await client.query(
                            `
                            UPDATE business_subscription_payments
                
                            SET
                                status = 'paid',
                                paid_at = NOW()
                
                            WHERE order_id = $1
                            `,
                            [
                                orderId
                            ]
                        );
                
                
                        await client.query(
                            `
                            UPDATE business_profiles
                
                            SET
                                subscription_plan_id = $1,
                
                                subscription_started_at =
                                    CASE
                                        WHEN subscription_expires_at > NOW()
                                        THEN subscription_started_at
                                        ELSE NOW()
                                    END,
                
                                subscription_expires_at =
                                    CASE
                                        WHEN subscription_expires_at > NOW()
                                        THEN
                                            subscription_expires_at +
                                            INTERVAL '30 days'
                                        ELSE
                                            NOW() +
                                            INTERVAL '30 days'
                                    END,
                
                                updated_at = NOW()
                
                            WHERE id = $2
                              AND owner_id = $3
                            `,
                            [
                                businessPayment.plan_id,
                                businessPayment.business_profile_id,
                                businessPayment.owner_id
                            ]
                        );
                
                
                        await client.query(
                            "COMMIT"
                        );
                
                    } catch (error) {
                        await client.query(
                            "ROLLBACK"
                        );
                
                        throw error;
                
                    } finally {
                        client.release();
                    }
                
                
                    console.log(
                        "Business subscription activated:",
                        {
                            orderId,
                            ownerId:
                                businessPayment.owner_id,
                            planId:
                                businessPayment.plan_id
                        }
                    );
                
                
                    return res.send("OK");
                }

            if (!isPaid) {
                await pool.query(
                    `
                    UPDATE service_history_purchases
                    SET status = $1
                    WHERE order_id = $2
                    `,
                    [
                        status || "unknown",
                        orderId
                    ]
                );

                return res.send("OK");
            }

            /*
    Оплата оголошення:
    150 грн / 28 днів.
*/

if (
    orderId.startsWith("listing_")
) {
    if (
        amount !== 150 ||
        currency !== "UAH"
    ) {
        console.error(
            "LiqPay listing callback: invalid amount or currency",
            {
                orderId,
                amount,
                currency
            }
        );

        return res
            .status(400)
            .send("Invalid amount");
    }

    const match =
        orderId.match(
            /^listing_([0-9a-f-]{36})_\d+$/i
        );

    if (!match) {
        console.error(
            "LiqPay listing callback: invalid order id",
            orderId
        );

        return res
            .status(400)
            .send("Invalid order_id");
    }

    const listingId =
        match[1];

    const result =
        await pool.query(
            `
            UPDATE market_listings
            SET
                status = 'active',

                published_at =
                    COALESCE(
                        published_at,
                        NOW()
                    ),

                expires_at =
                    CASE
                        WHEN expires_at > NOW()
                        THEN
                            expires_at +
                            INTERVAL '28 days'
                        ELSE
                            NOW() +
                            INTERVAL '28 days'
                    END,

                updated_at = NOW()

            WHERE id = $1

            RETURNING
                id,
                status,
                published_at,
                expires_at
            `,
            [
                listingId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        console.error(
            "LiqPay listing callback: listing not found",
            listingId
        );

        return res
            .status(404)
            .send("Listing not found");
    }

    console.log(
        "LiqPay listing payment confirmed:",
        listingId
    );

    return res.send("OK");
}

            /*
                Додаткова перевірка:
                історія коштує саме 50 грн.
            */

            if (
                amount !== 50 ||
                currency !== "UAH"
            ) {
                console.error(
                    "LiqPay callback: invalid amount or currency",
                    {
                        orderId,
                        amount,
                        currency
                    }
                );

                return res
                    .status(400)
                    .send(
                        "Invalid amount"
                    );
            }

            const result =
                await pool.query(
                    `
                    UPDATE service_history_purchases
                    SET
                        status = 'paid',
                        paid_at = NOW()
                    WHERE order_id = $1
                    RETURNING
                        id,
                        user_id,
                        listing_id
                    `,
                    [
                        orderId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                console.error(
                    "LiqPay callback: order not found",
                    orderId
                );

                return res
                    .status(404)
                    .send(
                        "Order not found"
                    );
            }

            console.log(
                "LiqPay history payment confirmed:",
                orderId
            );

            return res.send("OK");

        } catch (error) {
            console.error(
                "LiqPay callback error:",
                error
            );

            return res
                .status(500)
                .send(
                    "Callback error"
                );
        }
    }
);

/* =========================
   ІСТОРІЯ — ПЕРЕВІРКА ДОСТУПУ
   ========================= */

   app.get(
    "/api/garage/history-access/:listingId",
    requireAuth,
    async (req, res) => {
        try {
            const {
                listingId
            } = req.params;

            const userId =
                req.user.userId;

            const listingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id
                    FROM market_listings
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        listingId
                    ]
                );

            if (
                listingResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Оголошення не знайдено."
                });
            }

            const listing =
                listingResult.rows[0];

            /*
                Власник автомобіля
                має безкоштовний доступ.
            */

            if (
                String(listing.owner_id) ===
                String(userId)
            ) {
                return res.json({
                    ok: true,
                    hasAccess: true,
                    reason: "owner"
                });
            }

            const purchaseResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        paid_at
                    FROM service_history_purchases
                    WHERE user_id = $1
                      AND listing_id = $2
                      AND status = 'paid'
                    LIMIT 1
                    `,
                    [
                        userId,
                        listingId
                    ]
                );

            const hasAccess =
                purchaseResult.rows.length > 0;

            return res.json({
                ok: true,
                hasAccess,
                reason:
                    hasAccess
                        ? "paid"
                        : "payment_required"
            });

        } catch (error) {
            console.error(
                "History access check error:",
                error
            );

            return res.status(500).json({
                ok: false,
                message:
                    "Не вдалося перевірити доступ до історії."
            });
        }
    }
);

app.get(
    "/api/business/profiles/:ownerId",
    async (req, res) => {
        try {
            const {
                ownerId
            } = req.params;

            const result =
                await pool.query(
                    `
                    SELECT
                        bp.id,
                        bp.owner_id AS "ownerId",
                        bp.name,
                        bp.logo,
                        bp.city,
                        bp.address,
                        bp.phone,
                        bp.telegram,
                        bp.instagram,
                        bp.description,
                        bp.photos,
                        bp.services,

                        bt.id AS "businessTypeId",
                        bt.code AS "businessTypeCode",
                        bt.name AS "businessTypeName",

                        sp.id AS "planId",
                        sp.code AS "planCode",
                        sp.name AS "planName",
                        sp.price_uah AS "priceUah",
                        sp.car_limit AS "carLimit",
                        sp.has_crm AS "hasCrm",
                        sp.has_map AS "hasMap",

                        bp.subscription_started_at AS "subscriptionStartedAt",
                        bp.subscription_expires_at AS "subscriptionExpiresAt"

                    FROM business_profiles bp

                    LEFT JOIN business_types bt
                        ON bt.id =
                            bp.business_type_id

                    LEFT JOIN subscription_plans sp
                        ON sp.id =
                            bp.subscription_plan_id

                    WHERE bp.owner_id = $1

                    LIMIT 1
                    `,
                    [
                        ownerId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Бізнес-профіль не знайдено."
                });
            }

            res.json({
                ok: true,
                profile:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Public business profile load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити бізнес-профіль."
            });
        }
    }
);

app.get(
    "/api/business/profile",
    requireAuth,
    async (req, res) => {
        try {
            const ownerId =
                req.user.userId;

            const result =
                await pool.query(
                    `
                    SELECT
                        bp.id,
                        bp.owner_id AS "ownerId",
                        bp.name,
                        bp.logo,
                        bp.city,
                        bp.address,
                        bp.phone,
                        bp.telegram,
                        bp.instagram,
                        bp.description,
                        bp.photos,
                        bp.services,

                        bt.id AS "businessTypeId",
                        bt.code AS "businessTypeCode",
                        bt.name AS "businessTypeName",

                        sp.id AS "planId",
                        sp.code AS "planCode",
                        sp.name AS "planName",
                        sp.price_uah AS "priceUah",
                        sp.car_limit AS "carLimit",
                        sp.has_crm AS "hasCrm",
                        sp.has_map AS "hasMap",

                        bp.subscription_started_at AS "subscriptionStartedAt",
                        bp.subscription_expires_at AS "subscriptionExpiresAt"

                    FROM business_profiles bp

                    LEFT JOIN business_types bt
                        ON bt.id =
                            bp.business_type_id

                    LEFT JOIN subscription_plans sp
                        ON sp.id =
                            bp.subscription_plan_id

                    WHERE bp.owner_id = $1

                    LIMIT 1
                    `,
                    [
                        ownerId
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Бізнес-профіль не знайдено."
                });
            }

            res.json({
                ok: true,
                profile:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Business profile load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити бізнес-профіль."
            });
        }
    }
);

app.patch(
    "/api/business/profile",
    requireAuth,
    async (req, res) => {
        try {
            const ownerId =
                req.user.userId;

            const {
                name,
                logo,
                city,
                address,
                phone,
                telegram,
                instagram,
                description,
                photos,
                services
            } = req.body;

            const currentResult =
                await pool.query(
                    `
                    SELECT id
                    FROM business_profiles
                    WHERE owner_id = $1
                    LIMIT 1
                    `,
                    [
                        ownerId
                    ]
                );

            if (
                currentResult.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Бізнес-профіль не знайдено."
                });
            }

            const result =
                await pool.query(
                    `
                    UPDATE business_profiles
                    SET
                        name =
                            COALESCE(
                                $2,
                                name
                            ),

                        logo =
                            COALESCE(
                                $3,
                                logo
                            ),

                        city =
                            COALESCE(
                                $4,
                                city
                            ),

                        address =
                            COALESCE(
                                $5,
                                address
                            ),

                        phone =
                            COALESCE(
                                $6,
                                phone
                            ),

                        telegram =
                            COALESCE(
                                $7,
                                telegram
                            ),

                        instagram =
                            COALESCE(
                                $8,
                                instagram
                            ),

                        description =
                            COALESCE(
                                $9,
                                description
                            ),

                        photos =
                            COALESCE(
                                $10::jsonb,
                                photos
                            ),

                        services =
                            COALESCE(
                                $11::jsonb,
                                services
                            ),

                        updated_at =
                            NOW()

                    WHERE owner_id = $1

                    RETURNING
                        id,
                        owner_id AS "ownerId",
                        name,
                        logo,
                        city,
                        address,
                        phone,
                        telegram,
                        instagram,
                        description,
                        photos,
                        services,
                        updated_at AS "updatedAt"
                    `,
                    [
                        ownerId,
                        name ?? null,
                        logo ?? null,
                        city ?? null,
                        address ?? null,
                        phone ?? null,
                        telegram ?? null,
                        instagram ?? null,
                        description ?? null,

                        Array.isArray(photos)
                            ? JSON.stringify(
                                photos
                            )
                            : null,

                        Array.isArray(services)
                            ? JSON.stringify(
                                services
                            )
                            : null
                    ]
                );

            res.json({
                ok: true,
                profile:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Business profile update error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити бізнес-профіль."
            });
        }
    }
);

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            accountType,
            businessType,
            businessPlanId
        } = req.body;

        const normalizedAccountType =
    accountType === "business"
        ? "business"
        : "user";

if (
    normalizedAccountType === "business" &&
    (
        !businessType ||
        !businessPlanId
    )
) {
    return res.status(400).json({
        ok: false,
        message:
            "Оберіть тип бізнесу та тариф."
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
                    $6,
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
                    passwordHash,
                    normalizedAccountType
                ]
            );

            if (normalizedAccountType === "business") {
                const businessTypeResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM business_types
                        WHERE code = $1
                        LIMIT 1
                        `,
                        [
                            businessType
                        ]
                    );
            
                if (
                    businessTypeResult.rows.length === 0
                ) {
                    return res.status(400).json({
                        ok: false,
                        message:
                            "Невідомий тип бізнесу."
                    });
                }
            
                const planResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM subscription_plans
                        WHERE id = $1
                          AND business_type_code = $2
                          AND is_active = TRUE
                        LIMIT 1
                        `,
                        [
                            businessPlanId,
                            businessType
                        ]
                    );
            
                if (
                    planResult.rows.length === 0
                ) {
                    return res.status(400).json({
                        ok: false,
                        message:
                            "Невірний тариф для цього типу бізнесу."
                    });
                }
            
                await pool.query(
                    `
                    INSERT INTO business_profiles (
                        id,
                        owner_id,
                        business_type_id,
                        subscription_plan_id,
                        name,
                        phone
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    `,
                    [
                        crypto.randomUUID(),
                        userId,
                        businessTypeResult.rows[0].id,
                        planResult.rows[0].id,
                        name.trim(),
                        normalizedPhone
                    ]
                );
            }

            const newUser =
            result.rows[0];
        
        const token =
            jwt.sign(
                {
                    userId: newUser.id,
                    role:
                        newUser.role || "user"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            res.status(201).json({
                ok: true,
                token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone:
                        newUser.phone || "",
                    accountType:
                        newUser.account_type ||
                        "user",
                    role:
                        newUser.role || "user"
                }
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

/* =========================
   ВІДНОВЛЕННЯ ПАРОЛЯ
   ========================= */

   app.post(
    "/api/forgot-password",
    async (req, res) => {
        try {
            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();

            if (!email) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Введи email."
                });
            }


            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE email = $1
                    LIMIT 1
                    `,
                    [email]
                );


            /*
             * Не повідомляємо сторонній людині,
             * чи існує такий email.
             */
            if (
                result.rows.length ===
                0
            ) {
                return res.json({
                    ok: true,
                    message:
                        "Якщо такий акаунт існує, інструкцію для відновлення створено."
                });
            }


            const user =
                result.rows[0];


            const resetToken =
                crypto
                    .randomBytes(32)
                    .toString("hex");


            const tokenHash =
                crypto
                    .createHash("sha256")
                    .update(resetToken)
                    .digest("hex");


            const expiresAt =
                new Date(
                    Date.now() +
                    30 * 60 * 1000
                );


            await pool.query(
                `
                DELETE FROM password_reset_tokens
                WHERE
                    user_id = $1
                    AND used_at IS NULL
                `,
                [user.id]
            );


            await pool.query(
                `
                INSERT INTO password_reset_tokens (
                    id,
                    user_id,
                    token_hash,
                    expires_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                `,
                [
                    crypto.randomUUID(),
                    user.id,
                    tokenHash,
                    expiresAt
                ]
            );

            const appBaseUrl =
    (
        process.env.APP_BASE_URL ||
        "https://royal-garage.onrender.com"
    ).replace(/\/+$/, "");


const resetUrl =
    `${appBaseUrl}/reset-password.html?token=` +
    encodeURIComponent(resetToken);


await mailTransporter.sendMail({
    from:
        `"Royal Garage" <${process.env.GMAIL_USER}>`,

    to:
        user.email,

    subject:
        "Відновлення пароля — Royal Garage",

    text:
        `Ви запросили відновлення пароля Royal Garage.\n\n` +
        `Перейдіть за посиланням:\n${resetUrl}\n\n` +
        `Посилання діє 30 хвилин.\n` +
        `Якщо це були не ви — просто проігноруйте цей лист.`,

    html:
        `
        <h2>Royal Garage</h2>

        <p>
            Ви запросили відновлення пароля.
        </p>

        <p>
            <a href="${resetUrl}">
                Встановити новий пароль
            </a>
        </p>

        <p>
            Посилання діє 30 хвилин.
        </p>

        <p>
            Якщо це були не ви —
            просто проігноруйте цей лист.
        </p>
        `
});


            res.json({
                ok: true,
                message:
                    "Якщо такий акаунт існує, інструкцію для відновлення створено."
            });

        } catch (error) {
            console.error(
                "Forgot password error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося створити запит на відновлення пароля."
            });
        }
    }
);

/* =========================
   ВСТАНОВЛЕННЯ НОВОГО ПАРОЛЯ
   ========================= */

   app.post(
    "/api/reset-password",
    async (req, res) => {
        const client =
            await pool.connect();

        try {
            const token =
                String(
                    req.body.token || ""
                ).trim();

            const newPassword =
                String(
                    req.body.newPassword || ""
                );


            if (
                !token ||
                newPassword.length < 6
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Недійсні дані для зміни пароля."
                });
            }


            const tokenHash =
                crypto
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");


            await client.query(
                "BEGIN"
            );


            const tokenResult =
                await client.query(
                    `
                    SELECT
                        id,
                        user_id,
                        expires_at,
                        used_at
                    FROM password_reset_tokens
                    WHERE token_hash = $1
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [
                        tokenHash
                    ]
                );


            if (
                tokenResult.rows.length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    message:
                        "Посилання недійсне або вже не працює."
                });
            }


            const resetData =
                tokenResult.rows[0];


            if (
                resetData.used_at ||
                new Date(
                    resetData.expires_at
                ).getTime() <
                    Date.now()
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    message:
                        "Посилання прострочене або вже використане."
                });
            }


            const passwordHash =
                await bcrypt.hash(
                    newPassword,
                    12
                );


                const userResult =
                await client.query(
                    `
                    UPDATE users
                    SET
                        password_hash = $1,
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING
                        id,
                        name,
                        email,
                        phone,
                        account_type,
                        role
                    `,
                    [
                        passwordHash,
                        resetData.user_id
                    ]
                );
            
            const updatedUser =
                userResult.rows[0];


            await client.query(
                `
                UPDATE password_reset_tokens
                SET used_at = NOW()
                WHERE id = $1
                `,
                [
                    resetData.id
                ]
            );


            await client.query(
                `
                DELETE FROM password_reset_tokens
                WHERE
                    user_id = $1
                    AND id <> $2
                `,
                [
                    resetData.user_id,
                    resetData.id
                ]
            );


            await client.query(
                "COMMIT"
            );

            const loginToken =
    jwt.sign(
        {
            userId:
                updatedUser.id,

            role:
                updatedUser.role ||
                "user"
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );

            res.json({
                ok: true,
            
                message:
                    "Пароль успішно змінено.",
            
                token:
                    loginToken,
            
                user: {
                    id:
                        updatedUser.id,
            
                    name:
                        updatedUser.name,
            
                    email:
                        updatedUser.email,
            
                    phone:
                        updatedUser.phone || "",
            
                    accountType:
                        updatedUser.account_type ||
                        "user",
            
                    role:
                        updatedUser.role ||
                        "user"
                }
            });


        } catch (error) {

            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Reset password error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося змінити пароль."
            });

        } finally {

            client.release();
        }
    }
);

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

/* =========================
   ROYAL AUTO — ДОСТУП ВЛАСНИКА
   ========================= */

   const ROYAL_AUTO_OWNER_ID =
   "32ce413e-9eb6-417a-b99a-77d9ca7c144a";


function requireRoyalAutoOwner(
   req,
   res,
   next
) {
   if (
       !req.user ||
       String(req.user.userId) !==
       String(ROYAL_AUTO_OWNER_ID)
   ) {
       return res.status(403).json({
           ok: false,
           message:
               "Немає доступу до керування Royal Auto."
       });
   }

   next();
}

/* =========================
   ROYAL AUTO — НАПРЯМКИ
   ========================= */


   async function ensureRoyalAutoDefaultSections() {

    const ownerResult =
        await pool.query(
            `
            SELECT id
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [
                ROYAL_AUTO_OWNER_ID
            ]
        );


    if (
        ownerResult.rows.length === 0
    ) {
        return;
    }


    const defaultSections = [
        {
            name:
                "Накидки на сидіння",
            slug:
                "seat-covers",
            description:
                "Накидки та аксесуари для салону автомобіля.",
            icon:
                "🪡",
            sortOrder:
                10
        },
        {
            name:
                "Подушечки",
            slug:
                "pillows",
            description:
                "Автомобільні подушечки Royal Auto.",
            icon:
                "👑",
            sortOrder:
                20
        }
    ];


    for (
        const section
        of defaultSections
    ) {

        await pool.query(
            `
            INSERT INTO royal_auto_sections (
                id,
                owner_id,
                name,
                slug,
                description,
                icon,
                active,
                sort_order
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                TRUE,
                $7
            )
            ON CONFLICT (
                owner_id,
                slug
            )
            DO NOTHING
            `,
            [
                crypto.randomUUID(),
                ROYAL_AUTO_OWNER_ID,
                section.name,
                section.slug,
                section.description,
                section.icon,
                section.sortOrder
            ]
        );
    }
}



/* =========================
   ОТРИМАТИ НАПРЯМКИ
   ========================= */

app.get(
    "/api/royal-auto/sections",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        slug,
                        description,
                        icon,
                        active,
                        sort_order AS "sortOrder",
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"

                    FROM royal_auto_sections

                    WHERE owner_id = $1
                      AND active = TRUE

                    ORDER BY
                        sort_order ASC,
                        created_at ASC
                    `,
                    [
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            res.json({
                ok: true,
                sections:
                    result.rows
            });

        } catch (error) {

            console.error(
                "Royal Auto sections load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити напрямки Royal Auto."
            });
        }
    }
);



/* =========================
   ДОДАТИ НОВИЙ НАПРЯМОК
   ========================= */

app.post(
    "/api/royal-auto/sections",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                name,
                description,
                icon
            } = req.body;


            if (
                !name ||
                !String(name).trim()
            ) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Вкажіть назву напрямку."
                });
            }


            let slug =
                String(name)
                    .trim()
                    .toLowerCase()
                    .normalize("NFKD")
                    .replace(
                        /[^\p{L}\p{N}]+/gu,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        ""
                    );


            if (!slug) {
                slug =
                    `section-${Date.now()}`;
            }


            const id =
                crypto.randomUUID();


            const result =
                await pool.query(
                    `
                    INSERT INTO royal_auto_sections (
                        id,
                        owner_id,
                        name,
                        slug,
                        description,
                        icon,
                        active,
                        sort_order
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        TRUE,
                        (
                            SELECT
                                COALESCE(
                                    MAX(sort_order),
                                    0
                                ) + 10

                            FROM royal_auto_sections

                            WHERE owner_id = $2
                        )
                    )

                    RETURNING
                        id,
                        name,
                        slug,
                        description,
                        icon,
                        active,
                        sort_order AS "sortOrder",
                        created_at AS "createdAt"
                    `,
                    [
                        id,
                        ROYAL_AUTO_OWNER_ID,
                        String(name).trim(),
                        slug,
                        String(
                            description || ""
                        ).trim(),
                        String(
                            icon || "👑"
                        ).trim()
                    ]
                );


            res.status(201).json({
                ok: true,
                section:
                    result.rows[0]
            });

        } catch (error) {

            if (
                error.code ===
                "23505"
            ) {
                return res.status(409).json({
                    ok: false,
                    message:
                        "Такий напрямок уже існує."
                });
            }


            console.error(
                "Royal Auto section create error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося додати напрямок."
            });
        }
    }
);

/* =========================
   ROYAL AUTO — РЕДАГУВАТИ НАПРЯМОК
   ========================= */

   app.patch(
    "/api/royal-auto/sections/:sectionId",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                sectionId
            } = req.params;


            const currentResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        description,
                        icon,
                        active,
                        sort_order

                    FROM royal_auto_sections

                    WHERE
                        id = $1
                        AND owner_id = $2

                    LIMIT 1
                    `,
                    [
                        sectionId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            if (
                currentResult.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Напрямок Royal Auto не знайдено."
                });
            }


            const current =
                currentResult.rows[0];


            const {
                name,
                description,
                icon,
                active,
                sortOrder
            } = req.body;


            const nextName =
                name !== undefined
                    ? String(name).trim()
                    : current.name;


            if (!nextName) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Назва напрямку не може бути порожньою."
                });
            }


            const nextDescription =
                description !== undefined
                    ? String(description).trim()
                    : current.description;


            const nextIcon =
                icon !== undefined
                    ? String(icon).trim() || "👑"
                    : current.icon;


            const nextActive =
                active !== undefined
                    ? Boolean(active)
                    : current.active;


            let nextSortOrder =
                current.sort_order;


            if (
                sortOrder !== undefined
            ) {

                const parsedSortOrder =
                    Number(sortOrder);


                if (
                    !Number.isInteger(
                        parsedSortOrder
                    )
                ) {
                    return res.status(400).json({
                        ok: false,
                        message:
                            "Неправильний порядок напрямку."
                    });
                }


                nextSortOrder =
                    parsedSortOrder;
            }


            const result =
                await pool.query(
                    `
                    UPDATE royal_auto_sections

                    SET
                        name = $1,
                        description = $2,
                        icon = $3,
                        active = $4,
                        sort_order = $5,
                        updated_at = NOW()

                    WHERE
                        id = $6
                        AND owner_id = $7

                    RETURNING
                        id,
                        name,
                        slug,
                        description,
                        icon,
                        active,

                        sort_order
                            AS "sortOrder",

                        updated_at
                            AS "updatedAt"
                    `,
                    [
                        nextName,
                        nextDescription,
                        nextIcon,
                        nextActive,
                        nextSortOrder,
                        sectionId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            res.json({
                ok: true,
                section:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Royal Auto section update error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити напрямок Royal Auto."
            });
        }
    }
);

/* =========================
   ROYAL AUTO — ВИДАЛИТИ НАПРЯМОК
   ========================= */

   app.delete(
    "/api/royal-auto/sections/:sectionId",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                sectionId
            } = req.params;


            const result =
                await pool.query(
                    `
                    DELETE FROM royal_auto_sections

                    WHERE
                        id = $1
                        AND owner_id = $2

                    RETURNING
                        id,
                        name
                    `,
                    [
                        sectionId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Напрямок Royal Auto не знайдено."
                });
            }


            res.json({
                ok: true,
                message:
                    "Напрямок та його товари успішно видалено.",
                section:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Royal Auto section delete error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити напрямок Royal Auto."
            });
        }
    }
);

/* =========================
   ROYAL AUTO — ТОВАРИ
   ========================= */


/* =========================
   ОТРИМАТИ ТОВАРИ
   ========================= */

   app.get(
    "/api/royal-auto/products",
    async (req, res) => {

        try {

            const {
                sectionId
            } = req.query;


            const params = [
                ROYAL_AUTO_OWNER_ID
            ];


            let sectionFilter = "";


            if (sectionId) {
                params.push(
                    sectionId
                );

                sectionFilter =
                    `
                    AND rap.section_id = $2
                    `;
            }


            const result =
                await pool.query(
                    `
                    SELECT
                        rap.id,

                        rap.section_id
                            AS "sectionId",

                        ras.name
                            AS "sectionName",

                        ras.slug
                            AS "sectionSlug",

                        rap.name,

                        rap.description,

                        rap.price_uah
                            AS "priceUah",

                        rap.photos,

                        rap.active,

                        rap.sort_order
                            AS "sortOrder",

                        rap.created_at
                            AS "createdAt",

                        rap.updated_at
                            AS "updatedAt"

                    FROM royal_auto_products rap

                    INNER JOIN royal_auto_sections ras
                        ON ras.id =
                            rap.section_id

                    WHERE
                        rap.owner_id = $1

                        AND rap.active = TRUE

                        AND ras.active = TRUE

                        ${sectionFilter}

                    ORDER BY
                        ras.sort_order ASC,
                        rap.sort_order ASC,
                        rap.created_at DESC
                    `,
                    params
                );


            res.json({
                ok: true,
                products:
                    result.rows
            });

        } catch (error) {

            console.error(
                "Royal Auto products load error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити товари Royal Auto."
            });
        }
    }
);



/* =========================
   ДОДАТИ ТОВАР
   ========================= */

app.post(
    "/api/royal-auto/products",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                sectionId,
                name,
                description,
                priceUah,
                photos
            } = req.body;


            if (!sectionId) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "Оберіть напрямок."
                });
            }


            if (
                !name ||
                !String(name).trim()
            ) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "Вкажіть назву товару."
                });
            }


            /* Перевіряємо напрямок */

            const sectionResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        name

                    FROM royal_auto_sections

                    WHERE
                        id = $1
                        AND owner_id = $2

                    LIMIT 1
                    `,
                    [
                        sectionId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            if (
                sectionResult.rows.length ===
                0
            ) {

                return res.status(404).json({
                    ok: false,
                    message:
                        "Напрямок Royal Auto не знайдено."
                });
            }


            /* Ціна */

            let normalizedPrice =
                null;


            if (
                priceUah !== undefined &&
                priceUah !== null &&
                String(priceUah).trim() !== ""
            ) {

                normalizedPrice =
                    Number(priceUah);


                if (
                    !Number.isFinite(
                        normalizedPrice
                    ) ||
                    normalizedPrice < 0
                ) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            "Вкажіть правильну ціну."
                    });
                }
            }


            /* Фото */

            const safePhotos =
                Array.isArray(photos)
                    ? photos
                        .filter(Boolean)
                        .slice(0, 20)
                    : [];


            const productId =
                crypto.randomUUID();


            const result =
                await pool.query(
                    `
                    INSERT INTO royal_auto_products (
                        id,
                        owner_id,
                        section_id,
                        name,
                        description,
                        price_uah,
                        photos,
                        active,
                        sort_order
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        TRUE,
                        (
                            SELECT
                                COALESCE(
                                    MAX(sort_order),
                                    0
                                ) + 10

                            FROM royal_auto_products

                            WHERE
                                owner_id = $2
                                AND section_id = $3
                        )
                    )

                    RETURNING
                        id,

                        section_id
                            AS "sectionId",

                        name,

                        description,

                        price_uah
                            AS "priceUah",

                        photos,

                        active,

                        sort_order
                            AS "sortOrder",

                        created_at
                            AS "createdAt",

                        updated_at
                            AS "updatedAt"
                    `,
                    [
                        productId,
                        ROYAL_AUTO_OWNER_ID,
                        sectionId,
                        String(name).trim(),
                        String(
                            description || ""
                        ).trim(),
                        normalizedPrice,
                        JSON.stringify(
                            safePhotos
                        )
                    ]
                );


            res.status(201).json({
                ok: true,
                product:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Royal Auto product create error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося додати товар Royal Auto."
            });
        }
    }
);

/* =========================
   ROYAL AUTO — РЕДАГУВАТИ ТОВАР
   ========================= */

   app.patch(
    "/api/royal-auto/products/:productId",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                productId
            } = req.params;


            const currentResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        section_id,
                        name,
                        description,
                        price_uah,
                        photos,
                        active

                    FROM royal_auto_products

                    WHERE
                        id = $1
                        AND owner_id = $2

                    LIMIT 1
                    `,
                    [
                        productId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            if (
                currentResult.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Товар Royal Auto не знайдено."
                });
            }


            const current =
                currentResult.rows[0];


            const {
                sectionId,
                name,
                description,
                priceUah,
                photos,
                active
            } = req.body;


            const nextSectionId =
                sectionId !== undefined
                    ? sectionId
                    : current.section_id;


            if (
                sectionId !== undefined
            ) {

                const sectionResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM royal_auto_sections

                        WHERE
                            id = $1
                            AND owner_id = $2

                        LIMIT 1
                        `,
                        [
                            nextSectionId,
                            ROYAL_AUTO_OWNER_ID
                        ]
                    );


                if (
                    sectionResult.rows.length ===
                    0
                ) {
                    return res.status(404).json({
                        ok: false,
                        message:
                            "Напрямок Royal Auto не знайдено."
                    });
                }
            }


            const nextName =
                name !== undefined
                    ? String(name).trim()
                    : current.name;


            if (!nextName) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Назва товару не може бути порожньою."
                });
            }


            const nextDescription =
                description !== undefined
                    ? String(description).trim()
                    : current.description;


            let nextPrice =
                current.price_uah;


            if (
                priceUah !== undefined
            ) {

                if (
                    priceUah === null ||
                    String(priceUah).trim() === ""
                ) {
                    nextPrice = null;

                } else {

                    nextPrice =
                        Number(priceUah);


                    if (
                        !Number.isFinite(
                            nextPrice
                        ) ||
                        nextPrice < 0
                    ) {
                        return res.status(400).json({
                            ok: false,
                            message:
                                "Вкажіть правильну ціну."
                        });
                    }
                }
            }


            const nextPhotos =
                photos !== undefined
                    ? (
                        Array.isArray(photos)
                            ? photos
                                .filter(Boolean)
                                .slice(0, 20)
                            : []
                    )
                    : current.photos;


            const nextActive =
                active !== undefined
                    ? Boolean(active)
                    : current.active;


            const result =
                await pool.query(
                    `
                    UPDATE royal_auto_products

                    SET
                        section_id = $1,
                        name = $2,
                        description = $3,
                        price_uah = $4,
                        photos = $5,
                        active = $6,
                        updated_at = NOW()

                    WHERE
                        id = $7
                        AND owner_id = $8

                    RETURNING
                        id,

                        section_id
                            AS "sectionId",

                        name,

                        description,

                        price_uah
                            AS "priceUah",

                        photos,

                        active,

                        sort_order
                            AS "sortOrder",

                        created_at
                            AS "createdAt",

                        updated_at
                            AS "updatedAt"
                    `,
                    [
                        nextSectionId,
                        nextName,
                        nextDescription,
                        nextPrice,
                        JSON.stringify(
                            nextPhotos
                        ),
                        nextActive,
                        productId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            res.json({
                ok: true,
                product:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Royal Auto product update error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити товар Royal Auto."
            });
        }
    }
);

/* =========================
   ROYAL AUTO — ВИДАЛИТИ ТОВАР
   ========================= */

   app.delete(
    "/api/royal-auto/products/:productId",
    requireAuth,
    requireRoyalAutoOwner,
    async (req, res) => {

        try {

            const {
                productId
            } = req.params;


            const result =
                await pool.query(
                    `
                    DELETE FROM royal_auto_products

                    WHERE
                        id = $1
                        AND owner_id = $2

                    RETURNING
                        id,
                        name
                    `,
                    [
                        productId,
                        ROYAL_AUTO_OWNER_ID
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Товар Royal Auto не знайдено."
                });
            }


            res.json({
                ok: true,
                message:
                    "Товар успішно видалено.",
                product:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Royal Auto product delete error:",
                error
            );


            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити товар Royal Auto."
            });
        }
    }
);

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

app.patch(
    "/api/profile",
    requireAuth,
    async (req, res) => {
        try {
            const {
                phone,
                city,
                telegram,
                profilePhoto,
                showPhone,
                showTelegram
            } = req.body;

            if (phone) {
                const normalizedPhone =
                    String(phone).replace(
                        /\D/g,
                        ""
                    );

                if (
                    !/^380\d{9}$/.test(
                        normalizedPhone
                    )
                ) {
                    return res.status(400).json({
                        ok: false,
                        message:
                            "Введіть правильний український номер телефону."
                    });
                }

                const duplicateResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE phone = $1
                          AND id <> $2
                        LIMIT 1
                        `,
                        [
                            normalizedPhone,
                            req.user.userId
                        ]
                    );

                if (
                    duplicateResult.rows.length >
                    0
                ) {
                    return res.status(409).json({
                        ok: false,
                        message:
                            "Цей номер телефону вже використовується іншим акаунтом."
                    });
                }
            }

            const result =
                await pool.query(
                    `
                    UPDATE users
                    SET
                        phone =
                            COALESCE(
                                $1,
                                phone
                            ),

                        city =
                            COALESCE(
                                $2,
                                city
                            ),

                        telegram =
                            COALESCE(
                                $3,
                                telegram
                            ),

                        profile_photo =
                            COALESCE(
                                $4,
                                profile_photo
                            ),

                        show_phone =
                            COALESCE(
                                $5,
                                show_phone
                            ),

                        show_telegram =
                            COALESCE(
                                $6,
                                show_telegram
                            ),

                        updated_at =
                            NOW()

                    WHERE id = $7

                    RETURNING
                        id,
                        name,
                        email,
                        phone,
                        city,
                        telegram,
                        profile_photo,
                        show_phone,
                        show_telegram,
                        account_type,
                        role
                    `,
                    [
                        phone ?? null,
                        city ?? null,
                        telegram ?? null,
                        profilePhoto ?? null,
                        typeof showPhone ===
                        "boolean"
                            ? showPhone
                            : null,
                        typeof showTelegram ===
                        "boolean"
                            ? showTelegram
                            : null,
                        req.user.userId
                    ]
                );

            if (
                result.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Користувача не знайдено."
                });
            }

            res.json({
                ok: true,
                user:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Profile update error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося оновити профіль."
            });
        }
    }
);

app.get(
    "/api/profile",
    requireAuth,
    async (req, res) => {
        try {
            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        phone,
                        city,
                        telegram,
                        profile_photo,
                        show_phone,
                        show_telegram,
                        account_type,
                        role
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        req.user.userId
                    ]
                );

            if (
                result.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Користувача не знайдено."
                });
            }

            res.json({
                ok: true,
                user:
                    result.rows[0]
            });

        } catch (error) {
            console.error(
                "Profile load error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося завантажити профіль."
            });
        }
    }
);

app.delete(
    "/api/account",
    requireAuth,
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const result =
                await pool.query(
                    `
                    DELETE FROM users
                    WHERE id = $1
                    RETURNING
                        id,
                        name,
                        email
                    `,
                    [
                        userId
                    ]
                );

            if (
                result.rows.length ===
                0
            ) {
                return res.status(404).json({
                    ok: false,
                    message:
                        "Акаунт не знайдено."
                });
            }

            res.json({
                ok: true,
                message:
                    "Акаунт успішно видалено."
            });

        } catch (error) {
            console.error(
                "Account delete error:",
                error
            );

            res.status(500).json({
                ok: false,
                message:
                    "Не вдалося видалити акаунт."
            });
        }
    }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});