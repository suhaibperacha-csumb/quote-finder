import express from "express";
import mysql from "mysql2/promise";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const conn = mysql.createPool({
  host: "ctgplw90pifdso61.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "uc1emkyf9g6a9r2y",
  password: "xvpgg9cfrs4p3qaw",
  database: "agwvcq48m0p3dd4f"
});

// DB TEST
app.get("/dbTest", async (req, res) => {
  let [rows] = await conn.query("SELECT CURDATE()");
  res.send(rows);
});

// HOME PAGE
app.get("/", async (req, res) => {
  let [authors] = await conn.query(`
    SELECT authorId, firstName, lastName 
    FROM q_authors 
    ORDER BY lastName
  `);

  let [categories] = await conn.query(`
    SELECT DISTINCT category 
    FROM q_quotes 
    ORDER BY category
  `);

  res.render("index", { authors, categories });
});

// SEARCH BY KEYWORD
app.get("/searchByKeyword", async (req, res) => {
  let keyword = req.query.keyword || "";

  let [rows] = await conn.query(`
    SELECT q_quotes.quote, q_quotes.authorId, q_quotes.category, q_quotes.likes,
           q_authors.firstName, q_authors.lastName
    FROM q_quotes
    JOIN q_authors ON q_quotes.authorId = q_authors.authorId
    WHERE q_quotes.quote LIKE ?
  `, [`%${keyword}%`]);

  res.render("results", { quotes: rows });
});

// SEARCH BY AUTHOR
app.get("/searchByAuthor", async (req, res) => {
  let id = req.query.authorId;

  let [rows] = await conn.query(`
    SELECT q_quotes.quote, q_quotes.authorId, q_quotes.category, q_quotes.likes,
           q_authors.firstName, q_authors.lastName
    FROM q_quotes
    JOIN q_authors ON q_quotes.authorId = q_authors.authorId
    WHERE q_quotes.authorId = ?
  `, [id]);

  res.render("results", { quotes: rows });
});

// SEARCH BY CATEGORY
app.get("/searchByCategory", async (req, res) => {
  let category = req.query.category;

  let [rows] = await conn.query(`
    SELECT q_quotes.quote, q_quotes.authorId, q_quotes.category, q_quotes.likes,
           q_authors.firstName, q_authors.lastName
    FROM q_quotes
    JOIN q_authors ON q_quotes.authorId = q_authors.authorId
    WHERE q_quotes.category = ?
  `, [category]);

  res.render("results", { quotes: rows });
});

// SEARCH BY LIKES (min - max)
app.get("/searchByLikes", async (req, res) => {
  let min = parseInt(req.query.min) || 0;
  let max = parseInt(req.query.max) || 999999;

  let [rows] = await conn.query(`
    SELECT q_quotes.quote, q_quotes.authorId, q_quotes.category, q_quotes.likes,
           q_authors.firstName, q_authors.lastName
    FROM q_quotes
    JOIN q_authors ON q_quotes.authorId = q_authors.authorId
    WHERE q_quotes.likes BETWEEN ? AND ?
  `, [min, max]);

  res.render("results", { quotes: rows });
});

// AUTHOR API
app.get("/api/author/:id", async (req, res) => {
  let [rows] = await conn.query(`
    SELECT * FROM q_authors WHERE authorId = ?
  `, [req.params.id]);

  res.send(rows);
});

app.listen(3000, () => console.log("Server running on port 3000"));
