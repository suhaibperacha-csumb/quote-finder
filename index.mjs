import express from "express";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// --------------------------------------------------
// HARDCODED DB CONNECTION
// --------------------------------------------------
const conn = mysql.createPool({
  host: "ctgplw90pifdso61.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "uc1emkyf9g6a9r2y",
  password: "xvpgg9cfrs4p3qaw",
  database: "agwvcq48m0p3dd4f"
});

// --------------------------------------------------
// HOME PAGE
// --------------------------------------------------
app.get("/", async (req, res) => {
  let [authors] = await conn.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
  let [categories] = await conn.query("SELECT DISTINCT category FROM q_quotes ORDER BY category");
  res.render("index", { authors, categories });
});

// --------------------------------------------------
// SEARCH ROUTES
// --------------------------------------------------
app.get("/searchByKeyword", async (req, res) => {
  let keyword = req.query.keyword || "";
  let [rows] = await conn.query(
    `SELECT q_quotes.*, q_authors.firstName, q_authors.lastName
     FROM q_quotes
     JOIN q_authors ON q_quotes.authorId = q_authors.authorId
     WHERE quote LIKE ?`,
    [`%${keyword}%`]
  );
  res.render("results", { quotes: rows });
});

app.get("/searchByAuthor", async (req, res) => {
  let id = req.query.authorId;
  let [rows] = await conn.query(
    `SELECT q_quotes.*, q_authors.firstName, q_authors.lastName
     FROM q_quotes
     JOIN q_authors ON q_quotes.authorId = q_authors.authorId
     WHERE q_quotes.authorId = ?`,
    [id]
  );
  res.render("results", { quotes: rows });
});

app.get("/searchByCategory", async (req, res) => {
  let c = req.query.category;
  let [rows] = await conn.query(
    `SELECT q_quotes.*, q_authors.firstName, q_authors.lastName
     FROM q_quotes
     JOIN q_authors ON q_quotes.authorId = q_authors.authorId
     WHERE q_quotes.category = ?`,
    [c]
  );
  res.render("results", { quotes: rows });
});

app.get("/searchByLikes", async (req, res) => {
  let min = parseInt(req.query.min) || 0;
  let max = parseInt(req.query.max) || 999999;

  let [rows] = await conn.query(
    `SELECT q_quotes.*, q_authors.firstName, q_authors.lastName
     FROM q_quotes
     JOIN q_authors ON q_quotes.authorId = q_authors.authorId
     WHERE likes BETWEEN ? AND ?`,
    [min, max]
  );
  res.render("results", { quotes: rows });
});

// --------------------------------------------------
// API AUTHOR MODAL
// --------------------------------------------------
app.get("/api/author/:id", async (req, res) => {
  let [rows] = await conn.query("SELECT * FROM q_authors WHERE authorId = ?", [req.params.id]);
  res.send(rows);
});

// --------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------
app.get("/admin", async (req, res) => {
  let [authors] = await conn.query("SELECT * FROM q_authors ORDER BY lastName");
  let [quotes] = await conn.query(`
    SELECT q_quotes.*, q_authors.firstName, q_authors.lastName
    FROM q_quotes
    JOIN q_authors ON q_quotes.authorId = q_authors.authorId
  `);

  res.render("admin", { authors, quotes });
});

// --------------------------------------------------
// ADD AUTHOR
// --------------------------------------------------
app.get("/admin/addAuthor", (req, res) => {
  res.render("addAuthor")
})

app.post("/admin/addAuthor", async (req, res) => {
  let { firstName, lastName, dob, dod, profession, country, bio, picture } = req.body;

  await conn.query(
    `INSERT INTO q_authors (firstName, lastName, dob, dod, profession, country, bio, picture)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, dob, dod, profession, country, bio, picture]
  );

  res.redirect("/admin");
});

// --------------------------------------------------
// ADD QUOTE
// --------------------------------------------------
app.get("/admin/addQuote", async (req, res) => {
  let [authors] = await conn.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
  let [categories] = await conn.query("SELECT DISTINCT category FROM q_quotes ORDER BY category");

  res.render("addQuote", { authors, categories });
});

app.post("/admin/addQuote", async (req, res) => {
  let { quote, authorId, category, likes } = req.body;

  await conn.query(
    `INSERT INTO q_quotes (quote, authorId, category, likes)
     VALUES (?, ?, ?, ?)`,
    [quote, authorId, category, likes]
  );

  res.redirect("/admin");
});

// --------------------------------------------------
// EDIT AUTHOR
// --------------------------------------------------
app.get("/admin/editAuthor/:id", async (req, res) => {
  let [rows] = await conn.query("SELECT * FROM q_authors WHERE authorId = ?", [req.params.id]);
  res.render("editAuthorForm", { author: rows[0] });
});

app.post("/admin/editAuthor/:id", async (req, res) => {
  let { firstName, lastName, dob, dod, profession, country, bio, picture } = req.body;

  await conn.query(
    `UPDATE q_authors
     SET firstName=?, lastName=?, dob=?, dod=?, profession=?, country=?, bio=?, picture=?
     WHERE authorId=?`,
    [firstName, lastName, dob, dod, profession, country, bio, picture, req.params.id]
  );

  res.redirect("/admin");
});

// --------------------------------------------------
// EDIT QUOTE
// --------------------------------------------------
app.get("/admin/editQuote/:id", async (req, res) => {
  let [rows] = await conn.query("SELECT * FROM q_quotes WHERE quoteId = ?", [req.params.id]);
  let [authors] = await conn.query("SELECT * FROM q_authors ORDER BY lastName");
  let [categories] = await conn.query("SELECT DISTINCT category FROM q_quotes ORDER BY category");

  res.render("editQuoteForm", { quote: rows[0], authors, categories });
});

app.post("/admin/editQuote/:id", async (req, res) => {
  let { quote, authorId, category, likes } = req.body;

  await conn.query(
    `UPDATE q_quotes 
     SET quote=?, authorId=?, category=?, likes=?
     WHERE quoteId=?`,
    [quote, authorId, category, likes, req.params.id]
  );

  res.redirect("/admin");
});

// --------------------------------------------------
// DELETE AUTHOR
// --------------------------------------------------
// show delete confirmation
app.get("/admin/deleteAuthor/:id", async (req, res) => {
  let [rows] = await conn.query("SELECT * FROM q_authors WHERE authorId = ?", [req.params.id])
  res.render("deleteAuthor", { author: rows[0] })
})

// perform deletion
app.post("/admin/deleteAuthor/:id", async (req, res) => {
  await conn.query("DELETE FROM q_authors WHERE authorId = ?", [req.params.id])
  res.redirect("/admin")
})


// --------------------------------------------------
// DELETE QUOTE
// --------------------------------------------------
// show delete confirmation
app.get("/admin/deleteQuote/:id", async (req, res) => {
  let [rows] = await conn.query("SELECT * FROM q_quotes WHERE quoteId = ?", [req.params.id])
  res.render("deleteQuote", { quote: rows[0] })
})

// perform deletion
app.post("/admin/deleteQuote/:id", async (req, res) => {
  await conn.query("DELETE FROM q_quotes WHERE quoteId = ?", [req.params.id])
  res.redirect("/admin")
})


// --------------------------------------------------
app.listen(3000, () => console.log("Server running on port 3000"));
