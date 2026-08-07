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

        console.log("Users table ready");
    } catch (error) {
        console.error("Database initialization error:", error);
    }
}

initDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});