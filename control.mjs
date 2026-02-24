import TuyAPI from 'tuyapi';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const CONFIG_PATH = process.env.TUYA_DEVICES_PATH || resolve(process.cwd(), 'devices.json');

function loadDevices() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Arquivo de config nao encontrado: ${CONFIG_PATH}`);
    console.error(`Copie devices.example.json para devices.json e preencha com seus dispositivos.`);
    process.exit(1);
  }
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) {
    console.error('devices.json deve ser um array com pelo menos um dispositivo.');
    process.exit(1);
  }
  return list;
}

function findDevice(devices, name) {
  if (!name) return devices[0];
  const byName = devices.find(d => d.name && d.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName;
  const byId = devices.find(d => d.id === name);
  if (byId) return byId;
  console.error(`Dispositivo nao encontrado: ${name}`);
  process.exit(1);
}

const action = process.argv[2];
const deviceName = process.argv[3];

if (!action || !['on', 'off', 'toggle', 'status'].includes(action)) {
  console.log('Usage: node control.mjs <on|off|toggle|status> [device-name-or-id]');
  process.exit(1);
}

const devices = loadDevices();
const dev = findDevice(devices, deviceName);

const device = new TuyAPI({
  id: dev.id,
  key: dev.key,
  ip: dev.ip,
  version: dev.version || '3.3',
});

try {
  await device.find();
  await device.connect();

  const data = await device.get({ dps: 1 });
  const currentState = data;

  if (action === 'status') {
    console.log(currentState ? 'ON' : 'OFF');
    device.disconnect();
    process.exit(0);
  }

  let newState;
  if (action === 'on') newState = true;
  else if (action === 'off') newState = false;
  else newState = !currentState;

  await device.set({ dps: 1, set: newState });
  console.log(newState ? 'ON' : 'OFF');

  setTimeout(() => {
    device.disconnect();
    process.exit(0);
  }, 1000);
} catch (e) {
  console.error('Error:', e.message);
  try { device.disconnect(); } catch (x) {}
  process.exit(1);
}
