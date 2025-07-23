const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Memuat data user dari memek.json
let users = require('./memek.json');

// Endpoint login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Login gagal.' });
  }

  // Cek tanggal expired
  const now = new Date();
  const expiry = new Date(user.expiry);
  if (expiry < now) {
    return res.status(403).json({ message: 'Akun telah expired.' });
  }

  res.json({
    message: 'Login berhasil!',
    username: user.username,
    conc: user.conc,
    timeLimit: user.timeLimit,
    expiry: user.expiry,
    isAdmin: user.isAdmin || false
  });
});

// Endpoint ambil semua user (khusus admin)
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Tambah user baru (admin)
app.post('/api/add-user', (req, res) => {
  const { username, password, conc, timeLimit, expiry, isAdmin } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User sudah ada.' });
  }

  const newUser = {
    username,
    password,
    conc: Number(conc),
    timeLimit: Number(timeLimit),
    expiry,
    isAdmin: Boolean(isAdmin)
  };

  users.push(newUser);
  fs.writeFileSync('./memek.json', JSON.stringify(users, null, 2));
  res.json({ message: 'User berhasil ditambahkan.' });
});

// Hapus user
app.delete('/api/delete-user/:username', (req, res) => {
  const { username } = req.params;
  users = users.filter(u => u.username !== username);
  fs.writeFileSync('./memek.json', JSON.stringify(users, null, 2));
  res.json({ message: 'User berhasil dihapus.' });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
