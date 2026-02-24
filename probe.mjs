import TuyAPI from 'tuyapi';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const CONFIG_PATH = process.env.TUYA_DEVICES_PATH || resolve(process.cwd(), 'devices.json');

function loadDevices() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Arquivo de config nao encontrado: ${CONFIG_PATH}`);
    console.error('Copie devices.example.json para devices.json e preencha com seus dispositivos.');
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

const devices = loadDevices();
const keyPlaceholder = 'a'.repeat(16);

for (const version of ['3.1', '3.3', '3.4', '3.5']) {
  for (const dev of devices) {
    const key = dev.key && dev.key.length === 16 ? dev.key : keyPlaceholder;
    const name = dev.name || dev.id;
    console.log(`Trying ${name} (${dev.ip}) with version ${version}...`);
    const d = new TuyAPI({
      id: dev.id,
      key,
      ip: dev.ip,
      version,
    });

    try {
      d.on('error', () => {});
      await Promise.race([
        d.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      console.log(`  Connected! Version ${version} works.`);
      const status = await d.get();
      console.log(`  Status:`, status);
      d.disconnect();
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      try { d.disconnect(); } catch (x) {}
    }
  }
}

process.exit(0);
