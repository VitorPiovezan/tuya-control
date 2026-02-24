import TuyAPI from 'tuyapi';

const device = new TuyAPI({
  id: 'xxxxxxxxxxxxxxxxxxxx',
  key: 'xxxxxxxxxxxxxxxx',
  version: '3.4',
});

console.log('Running TuyAPI find({ all: true })...\n');

device.find({ all: true, timeout: 15 }).then(devices => {
  if (devices && devices.length > 0) {
    console.log(`Found ${devices.length} device(s):\n`);
    devices.forEach((d, i) => {
      console.log(`Device ${i + 1}:`);
      console.log(`  ID: ${d.gwId || d.id || 'unknown'}`);
      console.log(`  IP: ${d.ip}`);
      console.log(`  Version: ${d.version || 'unknown'}`);
      console.log(`  Product Key: ${d.productKey || 'unknown'}`);
      console.log('');
    });
  } else {
    console.log('No devices found via TuyAPI.');
  }
}).catch(e => {
  console.log('TuyAPI find error:', e.message);
}).finally(() => {
  process.exit(0);
});
