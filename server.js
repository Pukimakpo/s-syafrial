const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_PATH = "./users.json";

// Helper: load & save users
const loadUsers = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveUsers = (users) => fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));

// Helper: check if user is admin
function isAdmin(user) {
  return user && user.isAdmin === true;
}

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Sign Up / Add User
app.post("/api/add-user", (req, res) => {
  const { username, password, days, conc, timeLimit } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "Missing fields" });

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ success: false, message: "User already exists" });
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (days || 7));

  const newUser = {
    username,
    password,
    isAdmin: false,
    conc: conc || 1,
    timeLimit: timeLimit || 60,
    expiry: expiry.toISOString().split("T")[0],
    history: []
  };

  users.push(newUser);
  saveUsers(users);
  res.json({ success: true, user: newUser });
});

// Update User
app.post("/api/update-user", (req, res) => {
  const { username, updateUsername, update } = req.body;
  const users = loadUsers();
  const admin = users.find(u => u.username === username);
  const target = users.find(u => u.username === updateUsername);

  if (!isAdmin(admin)) return res.status(403).json({ success: false, message: "Not authorized" });
  if (!target) return res.status(404).json({ success: false, message: "User not found" });

  Object.assign(target, update);
  saveUsers(users);
  res.json({ success: true, user: target });
});

// Delete User
app.post("/api/delete-user", (req, res) => {
  const { username, deleteUsername } = req.body;
  let users = loadUsers();
  const admin = users.find(u => u.username === username);

  if (!isAdmin(admin)) return res.status(403).json({ success: false, message: "Not authorized" });

  const before = users.length;
  users = users.filter(u => u.username !== deleteUsername);
  if (users.length === before) return res.status(404).json({ success: false, message: "User not found" });

  saveUsers(users);
  res.json({ success: true });
});

// Get Active User Count
app.get("/api/active-users", (req, res) => {
  const users = loadUsers();
  const today = new Date().toISOString().split("T")[0];
  const active = users.filter(u => u.expiry >= today);
  res.json({ count: active.length });
});

// Dummy endpoint for attack (simulasi)
app.post("/api/attack", (req, res) => {
  const { username, target, method } = req.body;
  if (!username || !target || !method) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.history.push({
    time: new Date().toISOString(),
    target,
    method
  });

  saveUsers(users);
  res.json({ success: true, message: "Attack simulated" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
