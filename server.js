const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = "./users.json";

// Utility
const loadUsers = () => JSON.parse(fs.readFileSync(DB_FILE));
const saveUsers = (users) => fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
const getToday = () => new Date().toISOString().split("T")[0];

// 🔐 Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ success: false });

  const isActive = new Date(user.expiry) >= new Date();
  res.json({ success: true, user: { ...user, isActive } });
});

// 🆕 Add User
app.post("/api/add-user", (req, res) => {
  const { username, password, days = 7, conc = 1, timeLimit = 60 } = req.body;
  const users = loadUsers();

  if (!username || !password) return res.status(400).json({ success: false, message: "Invalid input" });
  if (users.some(u => u.username === username)) return res.status(409).json({ success: false, message: "Username already exists" });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + Number(days));

  const newUser = {
    username,
    password,
    isAdmin: false,
    conc,
    timeLimit,
    expiry: expiry.toISOString().split("T")[0],
    history: []
  };

  users.push(newUser);
  saveUsers(users);
  res.json({ success: true });
});

// 🗑️ Delete User
app.post("/api/delete-user", (req, res) => {
  const { username } = req.body;
  let users = loadUsers();
  const exists = users.find(u => u.username === username);
  if (!exists) return res.status(404).json({ success: false });

  users = users.filter(u => u.username !== username);
  saveUsers(users);
  res.json({ success: true });
});

// ✏️ Update User (admin → true/false, conc, timeLimit, etc.)
app.post("/api/update-user", (req, res) => {
  const { username, update } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success: false });

  Object.assign(user, update);
  saveUsers(users);
  res.json({ success: true });
});

// 📃 List Users
app.get("/api/list-users", (req, res) => {
  const users = loadUsers();
  const data = users.map(u => ({
    username: u.username,
    expiry: u.expiry,
    isAdmin: u.isAdmin,
    conc: u.conc,
    timeLimit: u.timeLimit
  }));
  res.json(data);
});

// 📊 History
app.get("/api/history/:username", (req, res) => {
  const { username } = req.params;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success: false });

  const history = user.history || [];
  const today = getToday();
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const daily = history.filter(h => h.date === today).length;
  const weekly = history.filter(h => h.date >= last7).length;
  const monthly = history.filter(h => h.date >= last30).length;

  res.json({ daily, weekly, monthly });
});

// 🧠 Simulate Attack
app.post("/api/attack", (req, res) => {
  const { username, target, method } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success: false });

  user.history = user.history || [];
  user.history.push({ date: getToday(), target, method });
  saveUsers(users);

  res.json({ success: true });
});

// 📈 Active User Count
app.get("/api/active-users", (req, res) => {
  const users = loadUsers();
  const today = getToday();
  const active = users.filter(u => u.expiry >= today);
  res.json({ count: active.length });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
