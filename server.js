// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let users = require('./memek.js');

const saveUsers = () => {
  fs.writeFileSync('./memek.js', 'module.exports = ' + JSON.stringify(users, null, 2));
};

// Login
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const u = users.find(u => u.user === user && u.pass === pass);
  if (!u) return res.json({ success: false });
  res.json({ success: true, isAdmin: u.admin, allowed: u.allowed });
});

// Register
app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  if (users.find(u => u.user === user)) return res.json({ error: 'User exists' });
  users.push({ user, pass, allowed: false, admin: false, conc: 0, limit: 0, expires: null });
  saveUsers();
  res.json({ success: true });
});

// Admin create user
app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass } = req.body;
  const admin = users.find(u => u.user === adminUser && u.pass === adminPass && u.admin);
  if (!admin) return res.status(403).json({ error: 'Unauthorized' });
  users.push({ user: newUser, pass: newPass, allowed: true, admin: false, conc: 1, limit: 300, expires: Date.now() + 7 * 86400000 });
  saveUsers();
  res.json({ success: true });
});

// Attack
let attackLog = [];

app.post('/api/attack', (req, res) => {
  const { target, port, time, method } = req.body;
  // Simulasi API
  attackLog.push({ target, port, time, method, timestamp: Date.now() });
  res.json({ message: 'Attack sent', target, method });
});

// Stats
app.get('/api/stats', (req, res) => {
  const now = attackLog.length;
  const today = attackLog.filter(a => Date.now() - a.timestamp < 86400000).length;
  const month = attackLog.filter(a => Date.now() - a.timestamp < 30 * 86400000).length;
  res.json({ now, today, month });
});

app.listen(PORT, () => console.log('Server running on port', PORT));
