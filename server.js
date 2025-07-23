const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8080;
const DB_FILE = 'memek.json';

app.use(cors());
app.use(express.json());

function loadUsers() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUsers(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function isExpired(user) {
  return new Date(user.expires) < new Date();
}

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const users = loadUsers();
  const found = users.find(u => u.user === user && u.pass === pass);
  if (!found) return res.json({ success: false });
  if (isExpired(found)) return res.json({ success: false, expired: true });
  res.json({
    success: true,
    isAdmin: found.isAdmin || false,
    allowed: found.allowed || false,
    concurrent: found.concurrent || 0
  });
});

app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  const users = loadUsers();
  if (users.find(u => u.user === user)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({
    user, pass,
    isAdmin: false,
    allowed: false,
    concurrent: 0,
    expires: new Date().toISOString()
  });
  saveUsers(users);
  res.json({ success: true });
});

app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass } = req.body;
  const users = loadUsers();
  const admin = users.find(u => u.user === adminUser && u.pass === adminPass && u.isAdmin);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  if (users.find(u => u.user === newUser)) return res.status(400).json({ error: 'User exists' });

  users.push({
    user: newUser,
    pass: newPass,
    isAdmin: false,
    allowed: true,
    concurrent: 10,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  saveUsers(users);
  res.json({ success: true });
});

app.post('/api/set-limit', (req, res) => {
  const { adminUser, adminPass, targetUser, concurrent, days } = req.body;
  const users = loadUsers();
  const admin = users.find(u => u.user === adminUser && u.pass === adminPass && u.isAdmin);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const target = users.find(u => u.user === targetUser);
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.concurrent = concurrent;
  target.expires = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString();
  saveUsers(users);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send('Sayfraial Stresser Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
