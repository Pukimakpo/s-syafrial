// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = './memek.json';
const ATTACK_LOG_FILE = './attackLogs.json';

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function loadLogs() {
  if (!fs.existsSync(ATTACK_LOG_FILE)) fs.writeFileSync(ATTACK_LOG_FILE, '[]');
  return JSON.parse(fs.readFileSync(ATTACK_LOG_FILE));
}

function saveLogs(data) {
  fs.writeFileSync(ATTACK_LOG_FILE, JSON.stringify(data, null, 2));
}

function cleanExpiredUsers() {
  const data = loadUsers();
  const now = Date.now();
  data.users = data.users.filter(u => u.isAdmin || u.expiredAt > now);
  saveUsers(data);
}

setInterval(cleanExpiredUsers, 5 * 60 * 1000); // 5 menit sekali

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const data = loadUsers();
  const found = data.users.find(u => u.user === user && u.pass === pass);
  if (!found) return res.status(401).json({ error: 'Login gagal' });

  const allowed = found.allowed && Date.now() < found.expiredAt;
  return res.json({
    allowed,
    isAdmin: found.isAdmin
  });
});

app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  const data = loadUsers();
  if (data.users.some(u => u.user === user)) {
    return res.status(400).json({ error: 'User sudah ada' });
  }

  data.users.push({
    user,
    pass,
    allowed: false,
    isAdmin: false,
    max_conc: 0,
    time_limit: 0,
    expiredAt: 0
  });

  saveUsers(data);
  return res.json({ success: true });
});

app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass, max_conc, time_limit, days } = req.body;
  const data = loadUsers();
  const admin = data.users.find(u => u.user === adminUser && u.pass === adminPass && u.isAdmin);
  if (!admin) return res.status(403).json({ error: 'Not admin' });

  const target = data.users.find(u => u.user === newUser);
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.pass = newPass || target.pass;
  target.allowed = true;
  target.max_conc = parseInt(max_conc);
  target.time_limit = parseInt(time_limit);
  target.expiredAt = Date.now() + parseInt(days) * 86400000;

  saveUsers(data);
  return res.json({ success: true });
});

const activeAttacks = {};

app.post('/api/attack', (req, res) => {
  const { user, target, port, time, method } = req.body;
  const data = loadUsers();
  const u = data.users.find(x => x.user === user);

  if (!u || !u.allowed || Date.now() > u.expiredAt) return res.status(403).json({ error: 'Expired or not allowed' });
  if (parseInt(time) > u.time_limit) return res.status(400).json({ error: 'Over time limit' });
  if ((activeAttacks[user] || 0) >= u.max_conc) return res.status(400).json({ error: 'Over conc limit' });

  // Simulate attack
  console.log(`ATTACK: ${method} ${target}:${port} (${time}s)`);

  activeAttacks[user] = (activeAttacks[user] || 0) + 1;
  setTimeout(() => activeAttacks[user]--, time * 1000);

  const logs = loadLogs();
  logs.push({ user, target, time, method, date: new Date().toISOString() });
  saveLogs(logs);

  res.json({ sent: true });
});

app.get('/api/stats', (req, res) => {
  const logs = loadLogs();
  const now = Date.now();
  const today = logs.filter(l => new Date(l.date).toDateString() === new Date().toDateString()).length;
  const month = logs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length;
  const nowCount = Object.values(activeAttacks).reduce((a, b) => a + b, 0);

  res.json({ now: nowCount, today, month });
});

app.listen(PORT, () => console.log('Server running on ' + PORT));
