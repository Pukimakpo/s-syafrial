const fs = require('fs');
const path = './users.json';

function load() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '[]');
  return JSON.parse(fs.readFileSync(path));
}

function save(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function login(user, pass) {
  const db = load();
  const u = db.find(x => x.user === user && x.pass === pass);
  if (!u) return { success: false };
  const now = Date.now();
  if (!u.allowed || u.expired < now) return { allowed: false };
  return { success: true, allowed: true, isAdmin: u.admin || false };
}

function register(user, pass) {
  const db = load();
  if (db.find(x => x.user === user)) return { error: 'User exists' };
  db.push({ user, pass, allowed: false, expired: Date.now(), admin: false });
  save(db);
  return { success: true };
}

function createUser(adminUser, adminPass, newUser, newPass, limit = 1, duration = 60, hari = 3) {
  const db = load();
  const admin = db.find(x => x.user === adminUser && x.pass === adminPass && x.admin);
  if (!admin) return { error: 'Bukan admin' };
  const expired = Date.now() + hari * 24 * 60 * 60 * 1000;
  db.push({ user: newUser, pass: newPass, allowed: true, expired, conc: limit, maxTime: duration, admin: false });
  save(db);
  return { success: true };
}

function attack({ user, pass, target, port, time, method }) {
  const db = load();
  const u = db.find(x => x.user === user && x.pass === pass);
  if (!u || !u.allowed || u.expired < Date.now()) return { error: 'Unauthorized' };
  if (time > u.maxTime) return { error: 'Max time exceeded' };

  // Fake attack log
  return { success: true, attack: { target, port, time, method } };
}

function stats() {
  return {
    now: Math.floor(Math.random() * 10),
    today: Math.floor(Math.random() * 50),
    month: Math.floor(Math.random() * 300)
  };
}

module.exports = { login, register, createUser, attack, stats };
