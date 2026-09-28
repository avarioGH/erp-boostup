const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ping -c 3 erp-boostup.qbaqxyw.mongodb.net || dig +short erp-boostup.qbaqxyw.mongodb.net', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
    }).stderr.on('data', (data) => {
      out += 'STDERR: ' + data.toString();
    });
  });
}).connect({
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 10000
});
