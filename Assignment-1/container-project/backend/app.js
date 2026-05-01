const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: "postgres",
  user: "admin",
  password: "secret",
  database: "mydb",
  port: 5432
});

app.get("/health", (req, res) => {
  res.send("Backend running");
});

app.post("/add", async (req, res) => {
  try {
    const { name } = req.body;

    const result = await pool.query(
      "INSERT INTO users(name) VALUES($1) RETURNING *",
      [name]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});