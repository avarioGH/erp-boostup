const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const localFile = 'backend/src/inventory/sawn-timber.service.ts';
const remoteFile = '/root/erp-boostup/backend/src/inventory/sawn-timber.service.ts';
const content = fs.readFileSync(localFile, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream(remoteFile);
    writeStream.on('close', () => {
      console.log('File uploaded successfully');
      conn.end();
    });
    writeStream.write(content);
    writeStream.end();
  });
}).connect(config);
