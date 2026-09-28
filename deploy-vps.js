const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'Avario050306',
  readyTimeout: 10000
};

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const cmd = `
    cd /root/erp-boostup || exit 1
    echo "=== FETCHING COMMIT ==="
    git fetch origin feature/audit-only-adjustment-forensics
    
    echo "=== CHECKING COMMIT ==="
    git cat-file -t c64a7e692460f0b011e42dc96496aedafb286c69 2>/dev/null || echo "MISSING"
    
    echo "=== SHOW STAT ==="
    git show --stat --oneline c64a7e692460f0b011e42dc96496aedafb286c69
    
    echo "=== SHOW NAME ONLY ==="
    git show --name-only --format="" c64a7e692460f0b011e42dc96496aedafb286c69
    
    echo "=== CHERRY PICK ==="
    git cherry-pick c64a7e692460f0b011e42dc96496aedafb286c69
    
    echo "=== STATUS AFTER CHERRY PICK ==="
    git status --short
    
    echo "=== LOG AFTER CHERRY PICK ==="
    git log -3 --oneline
    
    echo "=== DIFF ==="
    git diff 3be204e96473b06c71b9749af3814c4d20d179a5..HEAD --stat
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Client :: error :: ' + err);
}).connect(config);
