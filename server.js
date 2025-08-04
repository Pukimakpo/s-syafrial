const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Dummy Data (in-memory)
// =======================
let users = [{ id: 1, username: 'admin', password: 'admin123', plan: 'VIP', attacksUsed: 0 }];
let plans = [
  { id: 1, name: 'VIP', duration: '300s', concurrents: 3, price: 'Rp200.000' },
  { id: 2, name: 'PRO', duration: '150s', concurrents: 2, price: 'Rp100.000' }
];
let tickets = [];
let attacks = [];
let tools = [{ id: 1, name: 'Layer7 Bypass' }];
let systemLoad = { cpu: '20%', ram: '40%' };
let news = [{ id: 1, title: 'Welcome!', content: 'System is now live.' }];

// ===============
// Auth Endpoints
// ===============
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Login gagal.' });
  res.json({ success: true, message: 'Login berhasil.', userId: user.id });
});

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Username sudah dipakai.' });
  }
  const newUser = { id: users.length + 1, username, password, plan: 'FREE', attacksUsed: 0 };
  users.push(newUser);
  res.status(201).json({ message: 'Pendaftaran berhasil.', userId: newUser.id });
});

app.post('/api/user/logout', (req, res) => {
  res.json({ message: 'Logout berhasil.' });
});

// ===============
// User Endpoints
// ===============
app.get('/api/user/info', (req, res) => {
  const user = users[0]; // Demo pakai user pertama
  res.json({ username: user.username, plan: user.plan });
});

app.get('/api/user/stats', (req, res) => {
  const user = users[0];
  res.json({ attacksUsed: user.attacksUsed, plan: user.plan });
});

// ===============
// Attack Endpoints
// ===============
app.post('/api/attack/send', (req, res) => {
  const { host, port, method, time } = req.body;
  if (!host || !port || !method || !time) {
    return res.status(400).json({ message: 'Data tidak lengkap.' });
  }
  attacks.push({ host, port, method, time, date: new Date().toISOString() });
  users[0].attacksUsed++;
  res.json({ message: 'Attack sent!' });
});

app.get('/api/attack/history', (req, res) => {
  res.json(attacks);
});

app.post('/api/attack/stop', (req, res) => {
  const { host } = req.body;
  // simulasi stop
  res.json({ message: `Attack to ${host} stopped.` });
});

// ===============
// Admin / Info
// ===============
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length,
    totalAttacks: attacks.length
  });
});

app.get('/api/system/load', (req, res) => {
  res.json(systemLoad);
});

// ===============
// Others
// ===============
app.get('/api/plans/all', (req, res) => {
  res.json(plans);
});

app.get('/api/news/all', (req, res) => {
  res.json(news);
});

app.get('/api/tools/all', (req, res) => {
  res.json(tools);
});

app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { title, message } = req.body;
  tickets.push({ id: tickets.length + 1, title, message, date: new Date() });
  res.json({ message: 'Tiket dikirim.' });
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log(`✅ API Jalan di http://localhost:${PORT}`);
});
