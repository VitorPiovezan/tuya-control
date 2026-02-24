import TuyAPI from 'tuyapi';

const device = new TuyAPI({
  id: 'any',
  key: 'any',
  version: '3.4',
});

console.log('Running TuyAPI find()...\n');
device.find({ all: true, timeout: 15 }).then(devices => {
  console.log('Devices found:');
  console.log(JSON.stringify(devices, null, 2));
}).catch(e => {
  console.log('Error:', e.message);
}).finally(() => {
  process.exit(0);
});
