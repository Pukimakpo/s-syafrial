const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

// Helper: Load users from file
function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
}

// Helper: Save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Endpoint: Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.json({ success: false, message: "Invalid credentials" });

  res.json({ success: true, user });
});

// Endpoint: Add user (admin or signup)
app.post("/api/add-user", (req, res) => {
  const { username, password, days, conc = 1, timeLimit = 60, isAdmin = false } = req.body;
  const users = loadUsers();

  if (users.some(u => u.username === username)) {
    return res.json({ success: false, message: "Username already exists" });
  }

  const expiry = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString().split("T")[0];
  const newUser = { username, password, isAdmin, conc, timeLimit, expiry, history: [] };
  users.push(newUser);
  saveUsers(users);

  res.json({ success: true });
});

// Endpoint: Delete user
app.post("/api/delete-user", (req, res) => {
  const { username } = req.body;
  let users = loadUsers();
  users = users.filter(u => u.username !== username);
  saveUsers(users);
  res.json({ success: true });
});

// Endpoint: Get all users
app.get("/api/users", (req, res) => {
  const users = loadUsers();
  res.json(users);
});

// Optional: Start attack simulation endpoint (log only)
app.post("/api/start-attack", (req, res) => {
  const { target, port, duration, layer, method, username } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user) return res.json({ success: false, message: "User not found" });

  const today = new Date().toISOString().split("T")[0];

  // Log attack to history
  if (!user.history) user.history = [];
  user.history.push({ date: today, target, method });

  saveUsers(users);
  res.json({ success: true });
});

// Endpoint: Get user attack counts
app.get("/api/attack-history/:username", (req, res) => {
  const { username } = req.params;
  const user = loadUsers().find(u => u.username === username);
  if (!user || !user.history) return res.json({ daily: 0, weekly: 0, monthly: 0 });

  const now = new Date();
  const daily = user.history.filter(h => h.date === now.toISOString().split("T")[0]).length;
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekly = user.history.filter(h => new Date(h.date) > weekAgo).length;
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const monthly = user.history.filter(h => new Date(h.date) > monthAgo).length;

  res.json({ daily, weekly, monthly });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
