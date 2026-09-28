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
const path = 'src/app/inventory/logs/create/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /<option value="m">\\(m\\)<\\/option>/g,
  '<option value="m" className="bg-background text-foreground">(m)</option>'
);
code = code.replace(
  /<option value="cm">\\(cm\\)<\\/option>/g,
  '<option value="cm" className="bg-background text-foreground">(cm)</option>'
);
code = code.replace(
  /<option value="mm">\\(mm\\)<\\/option>/g,
  '<option value="mm" className="bg-background text-foreground">(mm)</option>'
);

fs.writeFileSync(path, code);
console.log("Select options patched!");
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/frontend || exit 1
    cat << 'EOF' > patch-select.js
${js}
EOF
    node patch-select.js
    npm run build
    pm2 restart erp-frontend
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
