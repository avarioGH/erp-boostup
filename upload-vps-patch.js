const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const localPath = 'backend/src/inventory/raw-log.service.ts';
    const remotePath = '/root/erp-boostup/backend/src/inventory/raw-log.service.ts';
    
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) throw err;
      console.log('Successfully uploaded raw-log.service.ts to VPS');
      
      // Now build and restart
      const cmd = `
        cd /root/erp-boostup/backend || exit 1
        npx tsc --noEmit
        npm run build
        pm2 restart erp
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
          console.log("Build and PM2 restart triggered!");
          conn.end();
        });
      });
    });
  });
}).connect(config);
