const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = './memek.json';

app.use(cors());
app.use(express.json());

// Fungsi bantu: baca database
function readDB() {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

// Fungsi bantu: tulis database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Fungsi bantu: cari user
function findUser(username) {
  const db = readDB();
  return db.find(u => u.username === username);
}

// 🔐 Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const now = new Date();
  const expiry = new Date(user.expiry);

  if (now > expiry) {
    return res.status(403).json({ error: 'Account expired' });
  }

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ➕ Add user (admin only)
app.post('/api/add-user', (req, res) => {
  const newUser = req.body;
  const db = readDB();

  if (db.find(u => u.username === newUser.username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  newUser.history = newUser.history || [];
  db.push(newUser);
  writeDB(db);

  res.json({ success: true });
});

// ❌ Delete user (admin only)
app.post('/api/delete-user', (req, res) => {
  const { username } = req.body;
  let db = readDB();

  db = db.filter(u => u.username !== username);
  writeDB(db);

  res.json({ success: true });
});

// ✏️ Update user (admin only)
app.post('/api/update-user', (req, res) => {
  const { username, ...updates } = req.body;
  const db = readDB();
  const user = db.find(u => u.username === username);

  if (!user) return res.status(404).json({ error: 'User not found' });

  Object.assign(user, updates);
  writeDB(db);

  res.json({ success: true });
});

// 📋 Get all users (admin only)
app.get('/api/users', (req, res) => {
  const db = readDB();
  const safeUsers = db.map(({ password, history, ...u }) => u);
  res.json(safeUsers);
});

// 🕓 Attack history (GET for current user, POST to add)
app.get('/api/history', (req, res) => {
  const { username } = req.query;
  const user = findUser(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user.history || []);
});

app.post('/api/history', (req, res) => {
  const { username, attack } = req.body;
  const db = readDB();
  const user = db.find(u => u.username === username);

  if (!user) return res.status(404).json({ error: 'User not found' });

  user.history = user.history || [];
  user.history.push({
    ...attack,
    time: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true });
});

// ✅ Tes server
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
