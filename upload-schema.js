const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const schemaContent = fs.readFileSync('C:\\Users\\Billion\\downloads\\workspace\\keuangan\\backend\\prisma\\schema.prisma', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const remotePath = '/root/erp-boostup/backend/prisma/schema.prisma';
    
    sftp.writeFile(remotePath, schemaContent, (err) => {
      if (err) throw err;
      console.log('Schema uploaded successfully!');
      
      const cmd = 'cd /root/erp-boostup/backend && npx prisma generate';
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
          console.log('Prisma generate completed.');
          conn.end();
        });
      });
    });
  });
}).connect(config);
