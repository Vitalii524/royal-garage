const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
});

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});