const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// SQLite setup
const db = new sqlite3.Database("infinity.db", (err) => {
  if (err) console.error(err.message);
  else console.log("Connected to SQLite database 🧠");
});

// Create contacts table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API route to get contact messages
app.get("/admin/messages", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json(rows);
  });
});

// API route to submit a contact message
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  const stmt = db.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)");
  stmt.run(name, email, message, function(err) {
    if (err) return res.json({ error: err.message });
    res.json({ id: this.lastID, name, email, message });
  });
  stmt.finalize();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
