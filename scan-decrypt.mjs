import dgram from 'dgram';
import crypto from 'crypto';

const UDP_KEY = Buffer.from('yGAdlopoPVldABfn');

function decrypt(data) {
  try {
    const payload = data.slice(20, data.length - 8);
    const decipher = crypto.createDecipheriv('aes-128-ecb', UDP_KEY, null);
    let decrypted = decipher.update(payload);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (e) {
    try {
      const payload = data.slice(20, data.length - 32);
      const decipher = crypto.createDecipheriv('aes-128-ecb', UDP_KEY, null);
      let decrypted = decipher.update(payload);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString('utf8'));
    } catch (e2) {
      return null;
    }
  }
}

const devices = new Map();

const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
server.on('message', (msg, rinfo) => {
  const result = decrypt(msg);
  if (result && !devices.has(result.gwId || result.devId)) {
    const id = result.gwId || result.devId;
    devices.set(id, { ...result, ip: rinfo.address });
    console.log(`\nDevice found at ${rinfo.address}:`);
    console.log(JSON.stringify(result, null, 2));
  }
});

server.bind(6667, () => {
  console.log('Listening for encrypted Tuya broadcasts on port 6667...');
  console.log('Waiting 15 seconds...\n');
});

const server2 = dgram.createSocket({ type: 'udp4', reuseAddr: true });
server2.on('message', (msg, rinfo) => {
  try {
    const data = msg.toString();
    if (data.includes('{')) {
      const json = JSON.parse(data.substring(data.indexOf('{')));
      const id = json.gwId || json.devId;
      if (id && !devices.has(id)) {
        devices.set(id, { ...json, ip: rinfo.address });
        console.log(`\nDevice found (unencrypted) at ${rinfo.address}:`);
        console.log(JSON.stringify(json, null, 2));
      }
    }
  } catch (e) {}
});

server2.bind(6666, () => {
  console.log('Also listening on port 6666 (unencrypted)...\n');
});

setTimeout(() => {
  console.log(`\n=== SCAN COMPLETE ===`);
  console.log(`Found ${devices.size} device(s)\n`);
  for (const [id, dev] of devices) {
    console.log(`  Device ID: ${id}`);
    console.log(`  IP: ${dev.ip}`);
    console.log(`  Version: ${dev.version || 'unknown'}`);
    console.log(`  Product Key: ${dev.productKey || 'unknown'}`);
    console.log('');
  }
  server.close();
  server2.close();
  process.exit(0);
}, 15000);
