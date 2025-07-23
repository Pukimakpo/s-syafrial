const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let users = require('./memek.json');

function saveUsers() {
  fs.writeFileSync('./memek.json', JSON.stringify(users, null, 2));
}

function isExpired(user) {
  return new Date(user.expires) < new Date();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (isExpired(user)) return res.status(403).json({ error: 'Account expired' });
  res.json({ success: true, user });
});

app.get('/api/status', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/add-user', (req, res) => {
  const { adminUser, username, password, limit, time, days } = req.body;
  const admin = users.users.find(u => u.username === adminUser && u.admin);
  if (!admin) return res.status(403).json({ error: 'Not authorized' });

  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  users.users.push({ username, password, limit, time, expires: expires.toISOString(), admin: false });
  saveUsers();
  res.json({ success: true });
});

app.post('/api/delete-user', (req, res) => {
  const { adminUser, username } = req.body;
  const admin = users.users.find(u => u.username === adminUser && u.admin);
  if (!admin) return res.status(403).json({ error: 'Not authorized' });
  users.users = users.users.filter(u => u.username !== username);
  saveUsers();
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
