const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // --- ADD THIS LINE FOR SSL ---
  ssl: {
    rejectUnauthorized: false, // Required for some cloud providers like Neon without a specific CA cert
  },
  // ----------------------------
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database!"))
  .catch((err) => console.error("Database connection error:", err.stack));

module.exports = pool;
