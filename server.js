const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 8080;

let db = require("./memek");

app.use(cors());
app.use(bodyParser.json());

function saveDB() {
  fs.writeFileSync("./memek.js", `module.exports = ${JSON.stringify(db, null, 2)};`);
}

// LOGIN
app.post("/api/login", (req, res) => {
  const { user, pass } = req.body;
  const found = db.users.find(u => u.user === user && u.pass === pass);
  if (!found) return res.json({ success: false });

  const today = new Date().toISOString().split("T")[0];
  const expired = new Date(found.expired).toISOString().split("T")[0];
  if (today > expired) return res.json({ success: false, expired: true });

  return res.json({
    success: true,
    isAdmin: found.isAdmin,
    allowed: found.allowed,
    conc: found.conc,
    durasi: found.durasi
  });
});

// REGISTER
app.post("/api/register", (req, res) => {
  const { user, pass } = req.body;
  if (db.users.find(u => u.user === user)) return res.json({ error: "User sudah ada" });
  db.users.push({
    user,
    pass,
    allowed: false,
    isAdmin: false,
    conc: 0,
    durasi: 0,
    expired: new Date().toISOString()
  });
  saveDB();
  res.json({ success: true });
});

// CREATE USER (Admin only)
app.post("/api/create-user", (req, res) => {
  const { adminUser, adminPass, newUser, newPass } = req.body;
  const admin = db.users.find(u => u.user === adminUser && u.pass === adminPass && u.isAdmin);
  if (!admin) return res.json({ error: "Bukan admin" });

  db.users.push({
    user: newUser,
    pass: newPass,
    allowed: true,
    isAdmin: false,
    conc: 3,
    durasi: 60,
    expired: "2099-12-31"
  });
  saveDB();
  res.json({ success: true });
});

// ATTACK
app.post("/api/attack", (req, res) => {
  const { target, port, time, method } = req.body;
  db.attacks.push({
    target, port, time, method, date: new Date().toISOString()
  });
  saveDB();
  res.json({ success: true });
});

// STATS
app.get("/api/stats", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const now = db.attacks.length;
  const todayAttacks = db.attacks.filter(a => a.date.startsWith(today)).length;
  const monthAttacks = db.attacks.filter(a => a.date.startsWith(thisMonth)).length;
  res.json({ now, today: todayAttacks, month: monthAttacks });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
