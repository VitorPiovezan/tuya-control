import dgram from 'dgram';
import crypto from 'crypto';

const UDP_KEY = Buffer.from('yGAdlopoPVldABfn');

function tryDecrypt(data) {
  const results = [];
  const offsets = [
    [20, -8], [20, -32], [20, -4], [16, -8], [16, -4],
    [12, -8], [12, -4], [0, 0], [4, -4], [20, -20],
    [20, -36], [20, -48]
  ];

  for (const [start, end] of offsets) {
    try {
      const payload = end === 0 ? data.slice(start) : data.slice(start, data.length + end);
      if (payload.length % 16 !== 0 || payload.length === 0) continue;
      const decipher = crypto.createDecipheriv('aes-128-ecb', UDP_KEY, null);
      let decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
      const str = decrypted.toString('utf8');
      if (str.includes('{')) {
        results.push({ offset: `[${start}:${end}]`, data: str });
      }
    } catch (e) {}
  }

  for (const [start, end] of offsets) {
    try {
      const payload = end === 0 ? data.slice(start) : data.slice(start, data.length + end);
      if (payload.length % 16 !== 0 || payload.length === 0) continue;
      const decipher = crypto.createDecipheriv('aes-128-gcm', UDP_KEY, data.slice(0, 12));
      let decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
      const str = decrypted.toString('utf8');
      if (str.includes('{')) {
        results.push({ offset: `gcm[${start}:${end}]`, data: str });
      }
    } catch (e) {}
  }

  return results;
}

const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
let captured = false;
server.on('message', (msg, rinfo) => {
  if (!captured) {
    captured = true;
    console.log(`Raw packet from ${rinfo.address} (${msg.length} bytes):`);
    console.log('Hex:', msg.toString('hex'));
    console.log('\nHeader bytes:', msg.slice(0, 4).toString('hex'));
    console.log('Prefix:', msg.readUInt32BE(0).toString(16));

    if (msg.length > 15) {
      console.log('Bytes 12-15:', msg.slice(12, 16).toString('hex'));
      console.log('Bytes 16-19:', msg.slice(16, 20).toString('hex'));
    }

    console.log('\nTrying all decrypt combinations...');
    const results = tryDecrypt(msg);
    if (results.length > 0) {
      for (const r of results) {
        console.log(`Success at offset ${r.offset}:`, r.data);
      }
    } else {
      console.log('No combination worked with standard UDP key.');

      console.log('\nTrying version 3.4/3.5 format...');
      try {
        const version = msg.slice(48, 51).toString('utf8');
        console.log('Possible version at offset 48:', version);
      } catch(e) {}

      for (let i = 0; i < Math.min(msg.length, 60); i += 4) {
        const slice = msg.slice(i, Math.min(i+20, msg.length));
        const str = slice.toString('utf8').replace(/[^\x20-\x7E]/g, '.');
        if (str.match(/[a-zA-Z0-9]{4,}/)) {
          console.log(`Readable at offset ${i}: "${str}"`);
        }
      }
    }
  }
});

server.bind(6667, () => {
  console.log('Capturing one encrypted packet...\n');
});

setTimeout(() => { server.close(); process.exit(0); }, 10000);
