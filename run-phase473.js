const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 15000
};

conn.on('ready', () => {
  const tsCode = `
import * as fs from 'fs';

function updateFile() {
  const path = '/root/erp-boostup/frontend/src/lib/api.ts';
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/api\\.put\\('\\/inventory\\/master-data\\/timber-species\\/' \\+ id/g, "api.patch('/inventory/master-data/timber-species/' + id");
  content = content.replace(/api\\.delete\\('\\/inventory\\/master-data\\/timber-species\\/' \\+ id\\)/g, "api.patch('/inventory/master-data/timber-species/' + id + '/status', { isActive: false })");

  content = content.replace(/api\\.put\\('\\/inventory\\/master-data\\/timber-grade\\/' \\+ id/g, "api.patch('/inventory/master-data/timber-grade/' + id");
  content = content.replace(/api\\.delete\\('\\/inventory\\/master-data\\/timber-grade\\/' \\+ id\\)/g, "api.patch('/inventory/master-data/timber-grade/' + id + '/status', { isActive: false })");

  content = content.replace(/api\\.put\\('\\/inventory\\/master-data\\/timber-source\\/' \\+ id/g, "api.patch('/inventory/master-data/timber-source/' + id");
  content = content.replace(/api\\.delete\\('\\/inventory\\/master-data\\/timber-source\\/' \\+ id\\)/g, "api.patch('/inventory/master-data/timber-source/' + id + '/status', { isActive: false })");

  content = content.replace(/api\\.put\\('\\/inventory\\/master-data\\/location\\/' \\+ id/g, "api.patch('/inventory/master-data/location/' + id");
  content = content.replace(/api\\.delete\\('\\/inventory\\/master-data\\/location\\/' \\+ id\\)/g, "api.patch('/inventory/master-data/location/' + id + '/status', { isActive: false })");

  fs.writeFileSync(path, content);
}

function run() {
  updateFile();
  console.log("JSON_FILE=frontend_fixed");
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > frontend-fix.js
${tsCode}
EOF
    node frontend-fix.js > output_473.txt
    
    FILE=$(grep "JSON_FILE=" output_473.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
    else
      echo "FAILED TO GENERATE"
      cat output_473.txt
    fi
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', data => {
      process.stdout.write(data.toString());
    }).stderr.on('data', data => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
