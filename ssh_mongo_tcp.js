const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('nc -zv ac-tobmz8l-shard-00-00.qbaqxyw.mongodb.net 27017', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('TCP:', out);
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
