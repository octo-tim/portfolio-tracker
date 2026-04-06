const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// DB setup — Railway volume mount at /data if available, else local
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create table if not exists — simple key-value store
db.exec(`CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
)`);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit:'10mb'}));

// GET /api/data/:key — read a key
app.get('/api/data/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(req.params.key);
  if (row) {
    res.json({ key: req.params.key, value: JSON.parse(row.value) });
  } else {
    res.json({ key: req.params.key, value: null });
  }
});

// PUT /api/data/:key — write a key
app.put('/api/data/:key', (req, res) => {
  const val = JSON.stringify(req.body.value);
  db.prepare('INSERT OR REPLACE INTO kv (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').run(req.params.key, val);
  res.json({ ok: true, key: req.params.key });
});

// GET /api/data — read all keys
app.get('/api/data', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM kv').all();
  const result = {};
  rows.forEach(r => { result[r.key] = JSON.parse(r.value); });
  res.json(result);
});

// POST /api/data/bulk — write multiple keys at once
app.post('/api/data/bulk', (req, res) => {
  const insert = db.prepare('INSERT OR REPLACE INTO kv (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))');
  const tx = db.transaction((entries) => {
    for (const [k, v] of Object.entries(entries)) {
      insert.run(k, JSON.stringify(v));
    }
  });
  tx(req.body);
  res.json({ ok: true, keys: Object.keys(req.body) });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio Tracker running on port ${PORT} (DB: ${DB_PATH})`);
});
