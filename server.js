// Backend untuk Sayfraial Stresser
// File: server.js

const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Path file user database
const USER_DB = './memek.js';

// Load atau inisialisasi user list
let users = [];
if (fs.existsSync(USER_DB)) {
  users = JSON.parse(fs.readFileSync(USER_DB));
} else {
  // Buat admin default
  users = [
    {
      user: '1',
      pass: '1',
      isAdmin: true,
      allowed: true,
      conc: 5,
      limit: 60,
      days: 30,
      history: []
    }
  ];
  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
}

function saveUsers() {
  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
}

function findUser(user) {
  return users.find(u => u.user === user);
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const found = users.find(u => u.user === user && u.pass === pass);
  if (!found) return res.status(401).json({ error: 'Invalid login' });
  res.json({
    isAdmin: found.isAdmin,
    allowed: found.allowed
  });
});

// Register endpoint
app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  if (findUser(user)) return res.status(409).json({ error: 'User exists' });
  users.push({
    user,
    pass,
    isAdmin: false,
    allowed: false,
    conc: 0,
    limit: 0,
    days: 0,
    history: []
  });
  saveUsers();
  res.json({ success: true });
});

// Admin create user
app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass } = req.body;
  const admin = users.find(u => u.user === adminUser && u.pass === adminPass && u.isAdmin);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });
  if (findUser(newUser)) return res.status(409).json({ error: 'User exists' });
  users.push({
    user: newUser,
    pass: newPass,
    isAdmin: false,
    allowed: true,
    conc: 3,
    limit: 60,
    days: 7,
    history: []
  });
  saveUsers();
  res.json({ created: true });
});

// Attack endpoint
app.post('/api/attack', (req, res) => {
  const { target, port, time, method, user } = req.body;
  const u = findUser(user);
  if (!u || !u.allowed) return res.status(403).json({ error: 'Unauthorized' });

  // Simulasi request attack ke API
  u.history.push({
    target,
    time,
    method,
    timestamp: Date.now()
  });
  saveUsers();

  res.json({ status: 'attack started', method });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  let now = 0, today = 0, month = 0;
  const nowTime = Date.now();

  users.forEach(u => {
    u.history.forEach(h => {
      const t = nowTime - h.timestamp;
      if (t < h.time * 1000) now++;
      if (t < 86400000) today++;
      if (t < 2629800000) month++;
    });
  });

  res.json({ now, today, month });
});

// Start server
app.listen(PORT, () => console.log(`Server ready at http://localhost:${PORT}`));
