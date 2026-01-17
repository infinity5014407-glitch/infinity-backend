const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // optional if you serve frontend here

// Connect SQLite
const db = new sqlite3.Database('./infinity.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database 🧠');
});

// Create tables if not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default services if table is empty
  db.get(`SELECT COUNT(*) as count FROM services`, (err, row) => {
    if (row.count === 0) {
      const defaultServices = [
        { title: 'Canva Slide Design', description: 'Professional presentation designs that captivate your audience and communicate your message effectively.' },
        { title: 'Data Entry & Typing', description: 'Fast, accurate data entry services with exceptional attention to detail. Fluent typing for all your documentation needs.' },
        { title: 'Handwriting to Text', description: 'Transform handwritten documents into clean, digital text with precision and care for your important materials.' },
        { title: 'C/C++ Development', description: 'Clean, efficient code for simple projects. Reliable programming solutions for your technical requirements.' }
      ];

      const stmt = db.prepare('INSERT INTO services (title, description) VALUES (?, ?)');
      defaultServices.forEach(s => stmt.run(s.title, s.description));
      stmt.finalize();
      console.log('Default services added ✅');
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.send('INFINITY backend running 🚀');
});

// Get services
app.get('/services', (req, res) => {
  db.all('SELECT * FROM services', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Receive contact form
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.json({ success: false, error: 'All fields required' });
  }

  const stmt = db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)');
  stmt.run(name, email, message, (err) => {
    if (err) return res.json({ success: false, error: err.message });
    res.json({ success: true });
  });
  stmt.finalize();
});

// Get all messages (for admin testing)
app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// Admin: get all contact messages
app.get("/admin/messages", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
app.delete('/admin/messages/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM contacts WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
