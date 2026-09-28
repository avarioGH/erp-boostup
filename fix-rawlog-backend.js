const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const js = `
const fs = require('fs');
const path = 'src/inventory/raw-log.service.ts';
let code = fs.readFileSync(path, 'utf8');

// The buggy code in raw-log.service.ts looks like this:
// speciesId: data.speciesId || null,
// sourceId: data.sourceId || null,
// locationId: data.locationId, // maybe?

// In Prisma MongoDB with relation objects:
// timberSpecies: data.speciesId ? { connect: { id: data.speciesId } } : undefined,
// timberSource: data.sourceId ? { connect: { id: data.sourceId } } : undefined,

code = code.replace(/speciesId: data\\.speciesId \\|\\| null,/g, "timberSpecies: data.speciesId ? { connect: { id: data.speciesId } } : undefined,");
code = code.replace(/sourceId: data\\.sourceId \\|\\| null,/g, "timberSource: data.sourceId ? { connect: { id: data.sourceId } } : undefined,");
// Wait, is locationId also throwing? It's likely relation is location / warehouse
code = code.replace(/locationId: (data\\.locationId[^,]*),/g, "location: { connect: { id: $1 } },");

fs.writeFileSync(path, code);
console.log("RawLogService patched!");
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch-rawlog.js
${js}
EOF
    node patch-rawlog.js
    npx tsc --noEmit
    npm run build
    pm2 restart erp
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
