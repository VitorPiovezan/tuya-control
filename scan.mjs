import dgram from 'dgram';

const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });

const devices = new Map();

server.on('message', (msg, rinfo) => {
  try {
    const data = msg.toString();
    if (data.includes('{')) {
      const json = JSON.parse(data.substring(data.indexOf('{')));
      const key = json.gwId || json.devId || rinfo.address;
      if (!devices.has(key)) {
        devices.set(key, { ...json, ip: rinfo.address, port: rinfo.port });
        console.log(`Found: ${rinfo.address} - ID: ${json.gwId || json.devId || 'unknown'} - Product: ${json.productKey || 'unknown'} - Version: ${json.version || 'unknown'}`);
      }
    }
  } catch (e) {}
});

server.on('error', (err) => {
  console.log('UDP error:', err.message);
});

server.bind(6666, () => {
  console.log('Listening for Tuya broadcasts on port 6666...');
});

const server2 = dgram.createSocket({ type: 'udp4', reuseAddr: true });
server2.on('message', (msg, rinfo) => {
  try {
    const key = rinfo.address;
    if (!devices.has(key + '_enc')) {
      devices.set(key + '_enc', { ip: rinfo.address, port: rinfo.port, encrypted: true, rawLength: msg.length });
      console.log(`Found (encrypted): ${rinfo.address} - port: ${rinfo.port} - size: ${msg.length}`);
    }
  } catch (e) {}
});

server2.bind(6667, () => {
  console.log('Listening for Tuya encrypted broadcasts on port 6667...');
});

setTimeout(() => {
  console.log(`\nScan complete. Found ${devices.size} device(s).`);
  console.log('\nAll devices:', JSON.stringify([...devices.values()], null, 2));
  server.close();
  server2.close();
  process.exit(0);
}, 15000);
