const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const db = require('./memek');

app.use(cors());
app.use(bodyParser.json());

const saveDB = () => {
  fs.writeFileSync('./memek.js', 'module.exports = ' + JSON.stringify(db, null, 2));
};

const isExpired = (user) => {
  const created = new Date(user.created);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diffDays > user.days;
};

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const found = db.users.find(u => u.username === user && u.password === pass);
  if (!found) return res.json({ error: true });
  if (isExpired(found)) return res.json({ expired: true });
  res.json({
    allowed: found.allowed,
    isAdmin: found.isAdmin
  });
});

app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  if (db.users.find(u => u.username === user)) return res.json({ exists: true });
  db.users.push({
    username: user,
    password: pass,
    isAdmin: false,
    allowed: false,
    conc: 1,
    time: 60,
    days: 1,
    created: new Date().toISOString()
  });
  saveDB();
  res.json({ success: true });
});

app.post('/api/attack', (req, res) => {
  const { target, port, time, method } = req.body;
  if (!target || !method || !time) return res.json({ error: true });
  const now = Date.now();
  db.history.push({ target, port, method, time, at: now });
  saveDB();
  res.json({ success: true });
});

app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass } = req.body;
  const admin = db.users.find(u => u.username === adminUser && u.password === adminPass && u.isAdmin);
  if (!admin) return res.status(403).json({ error: 'Unauthorized' });

  if (db.users.find(u => u.username === newUser)) return res.json({ exists: true });

  db.users.push({
    username: newUser,
    password: newPass,
    isAdmin: false,
    allowed: true,
    conc: 1,
    time: 60,
    days: 7,
    created: new Date().toISOString()
  });
  saveDB();
  res.json({ success: true });
});

app.post('/api/update-user', (req, res) => {
  const { adminUser, adminPass, username, conc, time, days } = req.body;
  const admin = db.users.find(u => u.username === adminUser && u.password === adminPass && u.isAdmin);
  if (!admin) return res.status(403).json({ error: 'Unauthorized' });

  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (conc !== undefined) user.conc = conc;
  if (time !== undefined) user.time = time;
  if (days !== undefined) user.days = days;
  saveDB();
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const active = db.history.filter(h => now - h.at < h.time * 1000).length;
  const todayCount = db.history.filter(h => new Date(h.at).toISOString().startsWith(today)).length;
  const monthCount = db.history.filter(h => new Date(h.at).toISOString().startsWith(month)).length;
  res.json({ now: active, today: todayCount, month: monthCount });
});

app.listen(3000, () => console.log('Server jalan di port 3000'));
