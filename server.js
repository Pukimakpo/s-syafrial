const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
const dbPath = path.join(__dirname, 'memek.json');

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function isExpired(exp) {
  return new Date(exp).getTime() < Date.now();
}

// API: LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadDB();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ error: 'Invalid credentials' });
  if (isExpired(user.expired)) return res.json({ error: 'User expired' });

  res.json({ success: true, admin: user.admin || false });
});

// API: REGISTER
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const users = loadDB();
  if (users.find(u => u.username === username)) {
    return res.json({ error: 'Username already exists' });
  }
  users.push({ username, password, conc: 0, time: 0, expired: '2000-01-01', admin: false });
  saveDB(users);
  res.json({ message: 'User created, waiting admin activation' });
});

// API: CREATE USER (Admin)
app.post('/api/create-user', (req, res) => {
  const { adminUser, adminPass, newUser, newPass, limit, time, expires } = req.body;
  const users = loadDB();
  const admin = users.find(u => u.username === adminUser && u.password === adminPass && u.admin);
  if (!admin) return res.json({ error: 'Unauthorized admin access' });

  const userIndex = users.findIndex(u => u.username === newUser);
  if (userIndex !== -1) {
    // Update existing user
    users[userIndex] = {
      ...users[userIndex],
      password: newPass,
      conc: limit,
      time,
      expired: expires,
    };
  } else {
    users.push({
      username: newUser,
      password: newPass,
      conc: limit,
      time,
      expired: expires,
      admin: false,
    });
  }

  saveDB(users);
  res.json({ message: 'User created/updated' });
});

// API: ATTACK
app.post('/api/attack', (req, res) => {
  const { username, password, target, method, time } = req.body;
  const users = loadDB();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ error: 'Invalid user' });
  if (isExpired(user.expired)) return res.json({ error: 'Account expired' });
  if (time > user.time) return res.json({ error: `Max attack time: ${user.time}s` });

  // Simulate API attack call
  console.log(`User ${username} attacking ${target} via ${method} for ${time}s`);

  res.json({ message: `Attack sent to ${target} for ${time}s` });
});

// Default route
app.get('/', (req, res) => {
  res.send('Backend API Online - Sayfraial');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
