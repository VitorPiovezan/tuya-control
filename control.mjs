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

function findBooleanDps(data) {
  if (!data || typeof data !== 'object') return null;
  const dps = data.dps || data;
  for (const [id, val] of Object.entries(dps)) {
    if (typeof val === 'boolean') return id;
  }
  return null;
}

function parseCurrentState(data, dpsId) {
  if (data === undefined || data === null) return undefined;
  if (typeof data === 'boolean') return data;
  if (typeof data === 'object' && data.dps) {
    const d = data.dps;
    return d[dpsId] ?? d['1'] ?? d['20'] ?? Object.values(d).find(v => typeof v === 'boolean');
  }
  return undefined;
}

const action = process.argv[2];
const deviceName = process.argv[3];

if (!action || !['on', 'off', 'toggle', 'status'].includes(action)) {
  console.log('Usage: node control.mjs <on|off|toggle|status> [device-name-or-id]');
  process.exit(1);
}

const devices = loadDevices();
const dev = findDevice(devices, deviceName);

const version = dev.version || '3.3';
const device = new TuyAPI({
  id: dev.id,
  key: dev.key,
  ip: dev.ip,
  version,
  issueGetOnConnect: false,
});

try {
  if (dev.ip) {
    await device.find();
  }
  await device.connect();

  let switchDps = '1';
  try {
    const fullState = await device.get({ schema: true });
    const detected = findBooleanDps(fullState);
    if (detected) switchDps = detected;
  } catch (_) {
    try {
      await device.get({ dps: 1 });
      switchDps = '1';
    } catch (_) {
      try {
        await device.get({ dps: 20 });
        switchDps = '20';
      } catch (_) {}
    }
  }

  const rawData = await device.get({ dps: switchDps });
  const currentState = parseCurrentState(rawData, switchDps);

  if (action === 'status') {
    console.log(currentState ? 'ON' : 'OFF');
    device.disconnect();
    process.exit(0);
  }

  let newState;
  if (action === 'on') newState = true;
  else if (action === 'off') newState = false;
  else newState = currentState === undefined ? true : !currentState;

  const dpsNum = typeof switchDps === 'string' ? switchDps : String(switchDps);
  await device.set({ dps: dpsNum, set: newState });

  await new Promise(r => setTimeout(r, 300));
  console.log(newState ? 'ON' : 'OFF');
  device.disconnect();
  process.exit(0);
} catch (e) {
  console.error('Error:', e.message);
  try {
    device.disconnect();
  } catch (x) {}
  process.exit(1);
}
