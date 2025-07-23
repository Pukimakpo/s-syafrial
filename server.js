const express = require('express');
const cors = require('cors');
const body = require('body-parser');
const db = require('./memek.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(body.json());

// LOGIN
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const result = db.login(user, pass);
  res.json(result);
});

// REGISTER (tunggu approval)
app.post('/api/register', (req, res) => {
  const { user, pass } = req.body;
  const result = db.register(user, pass);
  res.json(result);
});

// ATTACK (jika belum expired dan approved)
app.post('/api/attack', (req, res) => {
  const { target, port, time, method } = req.body;
  const result = db.attack(req.body);
  res.json(result);
});

// ADMIN CREATE USER
app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass, limit, duration, hari } = req.body;
  const result = db.createUser(adminUser, adminPass, newUser, newPass, limit, duration, hari);
  res.json(result);
});

// STATS DASHBOARD
app.get('/api/stats', (req, res) => {
  res.json(db.stats());
});

app.listen(port, () => console.log(`Server running on port ${port}`));
