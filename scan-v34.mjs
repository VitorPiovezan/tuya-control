import dgram from 'dgram';
import crypto from 'crypto';

const UDP_KEY = Buffer.from('yGAdlopoPVldABfn');

function decryptV34(data) {
  try {
    const header = data.slice(0, 20);
    const payload = data.slice(20, data.length - 4);
    const footer = data.slice(data.length - 4);

    const tag = payload.slice(payload.length - 16);
    const encData = payload.slice(0, payload.length - 16);
    const nonce = payload.slice(0, 12);
    const ciphertext = payload.slice(12, payload.length - 16);

    const decipher = crypto.createDecipheriv('aes-128-gcm', UDP_KEY, nonce);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (e) {
    return null;
  }
}

function decryptV34Alt(data) {
  const offsets = [
    { start: 20, tagSize: 16 },
    { start: 20, tagSize: 32 },
    { start: 16, tagSize: 16 },
  ];

  for (const { start, tagSize } of offsets) {
    for (let nonceSize = 4; nonceSize <= 16; nonceSize++) {
      try {
        const payload = data.slice(start, data.length - 4);
        const nonce = payload.slice(0, nonceSize);
        const tag = payload.slice(payload.length - tagSize, payload.length - tagSize + 16);
        const ciphertext = payload.slice(nonceSize, payload.length - tagSize);

        if (ciphertext.length === 0) continue;

        const decipher = crypto.createDecipheriv('aes-128-gcm', UDP_KEY, nonce);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const str = decrypted.toString('utf8');
        if (str.includes('{')) return JSON.parse(str);
      } catch (e) {}
    }
  }

  try {
    const payload = data.slice(20, data.length - 4);
    for (let i = 0; i <= 4; i++) {
      try {
        const encData = payload.slice(i);
        if (encData.length % 16 !== 0) continue;
        const decipher = crypto.createDecipheriv('aes-128-ecb', UDP_KEY, null);
        const decrypted = Buffer.concat([decipher.update(encData), decipher.final()]);
        const str = decrypted.toString('utf8');
        if (str.includes('{')) return JSON.parse(str);
      } catch(e) {}
    }
  } catch(e) {}

  return null;
}

const devices = new Map();

for (const port of [6666, 6667]) {
  const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  server.on('message', (msg, rinfo) => {
    const key = `${rinfo.address}:${port}`;
    if (devices.has(key)) return;

    let result = decryptV34(msg) || decryptV34Alt(msg);

    if (!result) {
      try {
        const str = msg.toString('utf8');
        if (str.includes('{')) {
          result = JSON.parse(str.substring(str.indexOf('{')));
        }
      } catch(e) {}
    }

    if (result) {
      devices.set(key, { ...result, ip: rinfo.address });
      console.log(`[port ${port}] Device at ${rinfo.address}: ${JSON.stringify(result, null, 2)}`);
    } else {
      devices.set(key, { ip: rinfo.address, raw: true });
      console.log(`[port ${port}] Encrypted device at ${rinfo.address} (${msg.length} bytes) - could not decrypt`);
    }
  });

  server.bind(port, () => {
    console.log(`Listening on port ${port}...`);
  });

  setTimeout(() => server.close(), 12000);
}

setTimeout(() => {
  console.log(`\n=== RESULTS ===`);
  console.log(`Total entries: ${devices.size}`);
  process.exit(0);
}, 13000);
