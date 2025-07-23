const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let users = require("./memek.json");

// Login endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Login berhasil!",
    username: user.username,
    conc: user.conc,
    timeLimit: user.timeLimit,
    expiry: user.expiry,
    isAdmin: user.isAdmin
  });
});

// Get all users (Admin only)
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Add user (Admin only)
app.post("/api/add-user", (req, res) => {
  const { username, password, conc, timeLimit, expiry, isAdmin } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  const newUser = { username, password, conc, timeLimit, expiry, isAdmin };
  users.push(newUser);
  fs.writeFileSync("memek.json", JSON.stringify(users, null, 2));
  res.json({ message: "User added", user: newUser });
});

// Delete user
app.post("/api/delete-user", (req, res) => {
  const { username } = req.body;
  users = users.filter((u) => u.username !== username);
  fs.writeFileSync("memek.json", JSON.stringify(users, null, 2));
  res.json({ message: `User ${username} deleted.` });
});

app.get("/", (req, res) => {
  res.send("Sayfraial Backend API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
