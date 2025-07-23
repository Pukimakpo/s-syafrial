const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const DB_PATH = path.join(__dirname, 'memek.json');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load database
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB = {
      users: [
        {
          username: "admin",
          password: bcrypt.hashSync("admin123", 10),
          conc: 1000,
          timeLimit: 300,
          expiry: 4102444800000, // Expires in 2100
          isAdmin: true,
          history: []
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

// Save to database
function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Routes
// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.username === username);

  if (!user) return res.status(401).json({ error: 'User not found' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });
  if (user.expiry < Date.now()) return res.status(403).json({ error: 'Account expired' });

  res.json({
    username: user.username,
    isAdmin: user.isAdmin,
    conc: user.conc,
    timeLimit: user.timeLimit,
    expiry: user.expiry
  });
});

// Add user (Admin only)
app.post('/api/add-user', (req, res) => {
  const { adminUsername, username, password, conc, timeLimit, daysActive } = req.body;
  const db = loadDB();
  const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);

  if (!admin) return res.status(403).json({ error: 'Admin only' });
  if (db.users.some(u => u.username === username)) return res.status(400).json({ error: 'Username exists' });

  db.users.push({
    username,
    password: bcrypt.hashSync(password, 10),
    conc: conc || 500,
    timeLimit: timeLimit || 60,
    expiry: Date.now() + (daysActive * 86400000),
    isAdmin: false,
    history: []
  });

  saveDB(db);
  res.json({ success: true });
});

// Delete user (Admin only)
app.post('/api/delete-user', (req, res) => {
  const { adminUsername, targetUsername } = req.body;
  const db = loadDB();
  const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);

  if (!admin) return res.status(403).json({ error: 'Admin only' });
  if (targetUsername === 'admin') return res.status(400).json({ error: 'Cannot delete admin' });

  db.users = db.users.filter(u => u.username !== targetUsername);
  saveDB(db);
  res.json({ success: true });
});

// Get all users (Admin only)
app.get('/api/users', (req, res) => {
  const { username } = req.query;
  const db = loadDB();
  const user = db.users.find(u => u.username === username && u.isAdmin);

  if (!user) return res.status(403).json({ error: 'Admin only' });
  res.json(db.users);
});

// Attack history
app.post('/api/attack', (req, res) => {
  const { username, target, method, duration } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.username === username);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.expiry < Date.now()) return res.status(403).json({ error: 'Account expired' });
  if (duration > user.timeLimit) return res.status(400).json({ error: 'Exceeds time limit' });

  user.history.push({
    target,
    method,
    duration,
    timestamp: Date.now()
  });

  saveDB(db);
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin credentials: admin:admin123`);
});
