const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';

// Helper untuk baca data user
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

// Helper untuk tulis data user
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false });
  }
});

// Tambah user
app.post('/api/add-user', (req, res) => {
  const { username, password, days, conc, timeLimit } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username sudah ada" });
  }

  const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
  users.push({ username, password, expiry, conc, timeLimit, isAdmin: false });
  writeUsers(users);
  res.json({ success: true });
});

// Hapus user
app.post('/api/delete-user', (req, res) => {
  const { username } = req.body;
  let users = readUsers();
  users = users.filter(u => u.username !== username);
  writeUsers(users);
  res.json({ success: true });
});

// Jadikan admin
app.post('/api/make-admin', (req, res) => {
  const { username } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.isAdmin = true;
    writeUsers(users);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'User tidak ditemukan' });
  }
});

// Get semua user
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users.map(u => ({
    username: u.username,
    isAdmin: u.isAdmin,
    expiry: u.expiry,
    conc: u.conc,
    timeLimit: u.timeLimit
  })));
});

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
