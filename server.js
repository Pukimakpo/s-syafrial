const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = "memek.json";

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Gagal membaca file:", err);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// LOGIN
app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const now = new Date();
    const expiry = new Date(user.expiry);
    if (expiry < now) return res.status(403).json({ success: false, message: "Account expired" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET USERS (ADMIN ONLY)
app.get("/api/users", (req, res) => {
  const users = readUsers().map(u => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json(users);
});

// ADD USER (ADMIN ONLY)
app.post("/api/add-user", (req, res) => {
  try {
    const { username, password, conc, timeLimit, expiry, isAdmin } = req.body;
    let users = readUsers();

    if (users.some(u => u.username === username)) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    users.push({
      username,
      password,
      conc,
      timeLimit,
      expiry,
      isAdmin,
      history: []
    });

    writeUsers(users);
    res.json({ success: true });
  } catch (err) {
    console.error("Add user error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// DELETE USER (ADMIN ONLY)
app.post("/api/delete-user", (req, res) => {
  try {
    const { username } = req.body;
    let users = readUsers();
    users = users.filter(u => u.username !== username);
    writeUsers(users);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// UPDATE USER (ADMIN ONLY)
app.post("/api/update-user", (req, res) => {
  try {
    const { username, conc, timeLimit, expiry } = req.body;
    let users = readUsers();

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.conc = conc;
    user.timeLimit = timeLimit;
    user.expiry = expiry;

    writeUsers(users);
    res.json({ success: true });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET HISTORY
app.get("/api/history", (req, res) => {
  const { username } = req.query;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success: false });
  res.json(user.history || []);
});

// ADD TO HISTORY
app.post("/api/history", (req, res) => {
  try {
    const { username, method, target, time } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ success: false });

    user.history = user.history || [];
    user.history.push({
      method,
      target,
      time,
      timestamp: new Date().toISOString()
    });

    writeUsers(users);
    res.json({ success: true });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("Stresser Panel API by Syafrial 🚀");
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
