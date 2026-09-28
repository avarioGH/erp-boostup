const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

conn.on('ready', () => {
  // Use sed line-based replacement on specific lines
  const cmd = `
    FILE=/root/erp-boostup/frontend/src/components/app-sidebar.tsx
    
    # Show indentation exactly
    cat -A "$FILE" | sed -n '244,250p'
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
