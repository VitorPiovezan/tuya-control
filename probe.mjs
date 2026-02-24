import TuyAPI from 'tuyapi';

const devices = [
  { id: 'eb0f6b37d7653aede5syao', ip: '192.168.1.3', name: 'Device 1' },
  { id: 'ebab51210152699957xekt', ip: '192.168.1.2', name: 'Device 2' },
  { id: 'ebc7c9667f6383fa97epw1', ip: '192.168.1.4', name: 'Device 3' },
];

for (const versions of ['3.1', '3.3', '3.4', '3.5']) {
  for (const dev of devices) {
    console.log(`Trying ${dev.name} (${dev.ip}) with version ${versions}...`);
    const d = new TuyAPI({
      id: dev.id,
      key: 'aaaaaaaaaaaaaaaa',
      ip: dev.ip,
      version: versions,
    });

    try {
      d.on('error', (err) => {});
      await Promise.race([
        d.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      console.log(`  Connected! Version ${versions} works.`);
      const status = await d.get();
      console.log(`  Status:`, status);
      d.disconnect();
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      try { d.disconnect(); } catch(x) {}
    }
  }
}

process.exit(0);
