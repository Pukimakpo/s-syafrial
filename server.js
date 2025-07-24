const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

// Load or init DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Endpoint: Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { username: user.username, isAdmin: user.isAdmin } });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// Endpoint: Add user
app.post("/api/add-user", (req, res) => {
  const { username, password, days, conc, timeLimit } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Missing fields" });

  const db = loadDB();
  const exists = db.users.find(u => u.username === username);
  if (exists) return res.json({ success: false, message: "User already exists" });

  const expires = Date.now() + (days || 7) * 86400000;
  db.users.push({
    username,
    password,
    isAdmin: false,
    expires,
    conc: conc || 1,
    timeLimit: timeLimit || 60
  });

  saveDB(db);
  res.json({ success: true });
});

// Endpoint: Delete user
app.post("/api/delete-user", (req, res) => {
  const { username } = req.body;
  const db = loadDB();
  db.users = db.users.filter(u => u.username !== username);
  saveDB(db);
  res.json({ success: true });
});

// Endpoint: Promote to admin
app.post("/api/make-admin", (req, res) => {
  const { username } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.username === username);
  if (!user) return res.json({ success: false });

  user.isAdmin = true;
  saveDB(db);
  res.json({ success: true });
});

// Endpoint: Get all users
app.get("/api/users", (req, res) => {
  const db = loadDB();
  const users = db.users.map(u => ({
    username: u.username,
    isAdmin: u.isAdmin,
    conc: u.conc,
    expires: u.expires,
    timeLimit: u.timeLimit
  }));
  res.json(users);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
