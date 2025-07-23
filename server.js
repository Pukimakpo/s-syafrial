// server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8080;

let users = require("./memek.json");

app.use(cors());
app.use(express.json());

function saveUsers() {
  fs.writeFileSync("memek.json", JSON.stringify(users, null, 2));
}

app.post("/api/login", (req, res) => {
  const { user, pass } = req.body;
  const u = users.find(u => u.user === user && u.pass === pass);
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  if (!u.allowed) return res.json({ allowed: false });
  res.json({ allowed: true, isAdmin: u.admin });
});

app.post("/api/register", (req, res) => {
  const { user, pass } = req.body;
  if (users.find(u => u.user === user)) return res.status(400).json({ error: "User exists" });
  users.push({ user, pass, allowed: false, admin: false, limit: 0, expire: Date.now() });
  saveUsers();
  res.json({ success: true });
});

app.post("/api/create-user", (req, res) => {
  const { adminUser, adminPass, newUser, newPass, limit, days } = req.body;
  const admin = users.find(u => u.user === adminUser && u.pass === adminPass && u.admin);
  if (!admin) return res.status(403).json({ error: "Not admin" });
  const existing = users.find(u => u.user === newUser);
  if (existing) return res.status(400).json({ error: "User exists" });
  users.push({ user: newUser, pass: newPass, allowed: true, admin: false, limit: limit || 10, expire: Date.now() + ((days || 1) * 86400000) });
  saveUsers();
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  const now = Math.floor(Math.random() * 10);
  const today = Math.floor(Math.random() * 50);
  const month = Math.floor(Math.random() * 300);
  res.json({ now, today, month });
});

app.post("/api/attack", (req, res) => {
  const { user, pass, target, port, time, method } = req.body;
  const u = users.find(u => u.user === user && u.pass === pass);
  if (!u || !u.allowed) return res.status(403).json({ error: "Unauthorized" });
  if (Date.now() > u.expire) return res.status(403).json({ error: "Expired" });
  if (time > u.limit) return res.status(403).json({ error: "Over time limit" });
  // Simulasi attack
  res.json({ success: true, sent: true, method, target });
});

app.listen(PORT, () => console.log("Server running on port " + PORT));

