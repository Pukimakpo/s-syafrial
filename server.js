const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file with admin if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  const defaultUsers = [{
    username: 'admin',
    password: 'admin123',
    expiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    conc: 9999, // Unlimited for admin
    timeLimit: 999999, // Unlimited for admin
    isAdmin: true,
    createdAt: Date.now(),
    lastActivity: Date.now()
  }];
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
}

// Helper functions
function readUsers() {
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function calculateDaysLeft(expiry) {
  return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
}

// API Endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    user.lastActivity = Date.now();
    writeUsers(users);
    
    const userResponse = {
      ...user,
      daysLeft: calculateDaysLeft(user.expiry),
      isExpired: user.expiry < Date.now()
    };
    
    res.json({ 
      success: true, 
      user: userResponse 
    });
  } else {
    res.json({ 
      success: false, 
      message: "Invalid username or password" 
    });
  }
});

app.post('/api/add-user', (req, res) => {
  const { username, password, days = 3, conc = 1, timeLimit = 30 } = req.body;
  const users = readUsers();
  
  if (users.find(u => u.username === username)) {
    return res.json({ 
      success: false, 
      message: "Username already exists" 
    });
  }

  const newUser = {
    username,
    password,
    expiry: Date.now() + (days * 24 * 60 * 60 * 1000),
    conc,
    timeLimit,
    isAdmin: false,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    totalAttacks: 0
  };

  users.push(newUser);
  writeUsers(users);
  
  res.json({ 
    success: true,
    user: {
      ...newUser,
      daysLeft: days
    }
  });
});

app.post('/api/delete-user', (req, res) => {
  const { username } = req.body;
  let users = readUsers();
  
  if (username === 'admin') {
    return res.json({ 
      success: false, 
      message: "Cannot delete admin account" 
    });
  }

  const initialLength = users.length;
  users = users.filter(u => u.username !== username);
  
  if (users.length === initialLength) {
    return res.json({ 
      success: false, 
      message: "User not found" 
    });
  }

  writeUsers(users);
  res.json({ success: true });
});

app.post('/api/make-admin', (req, res) => {
  const { username, action = 'promote' } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.json({ 
      success: false, 
      message: "User not found" 
    });
  }

  if (action === 'promote') {
    user.isAdmin = true;
  } else if (action === 'demote') {
    if (username === 'admin') {
      return res.json({ 
        success: false, 
        message: "Cannot demote main admin" 
      });
    }
    user.isAdmin = false;
  }

  writeUsers(users);
  res.json({ success: true });
});

app.get('/api/users', (req, res) => {
  const users = readUsers();
  const now = Date.now();
  
  const userList = users.map(u => ({
    username: u.username,
    isAdmin: u.isAdmin,
    expiryDate: new Date(u.expiry).toLocaleDateString(),
    daysLeft: calculateDaysLeft(u.expiry),
    conc: u.conc,
    timeLimit: u.timeLimit,
    isExpired: u.expiry < now,
    createdAt: new Date(u.createdAt).toLocaleDateString()
  }));

  res.json(userList);
});

app.post('/api/track-attack', (req, res) => {
  const { username } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  
  if (user) {
    user.totalAttacks = (user.totalAttacks || 0) + 1;
    user.lastActivity = Date.now();
    user.lastAction = 'Attack started';
    writeUsers(users);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/active-users', (req, res) => {
  const users = readUsers();
  const now = Date.now();
  
  // Get active users (last 30 minutes)
  const activeUsers = users
    .filter(u => u.lastActivity > now - 15*60*1000) // active in last 15 mins
    .sort((a, b) => b.isAdmin - a.isAdmin || b.lastActivity - a.lastActivity) // Admins first
    .slice(0, 10) // limit to 10 most recent
    .map(u => ({
      username: u.username,
      isAdmin: u.isAdmin,
      lastAction: u.lastAction || "Using panel",
      time: Math.round((now - u.lastActivity)/60000) + " mins ago"
    }));
  
  // If no real active users, return some mock data
  if (activeUsers.length === 0) {
    activeUsers.push(
      { username: "admin", isAdmin: true, lastAction: "Managing users", time: "2 mins ago" },
      { username: "user1", isAdmin: false, lastAction: "Attack started", time: "5 mins ago" }
    );
  }
  
  res.json(activeUsers);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin credentials: admin / admin123`);
});
