const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 10000
};

conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup || exit 1
    
    echo "=== BEFORE HEAD ==="
    git rev-parse HEAD
    echo "=== BEFORE BRANCH ==="
    git branch --show-current
    echo "=== BEFORE STATUS ==="
    git status --short

    echo "=== VERIFY COMMIT FILES ==="
    git show --name-only --format="" c64a7e692460f0b011e42dc96496aedafb286c69

    echo "=== CHECKING FILE EXISTENCE ==="
    if [ -f backend/src/pre-flight-inventory-integrity-audit.ts ]; then echo "CONFLICT: pre-flight"; fi
    if [ -f backend/src/run-inventory-integrity-audit.ts ]; then echo "CONFLICT: runner"; fi

    echo "=== CHERRY PICK ==="
    git cherry-pick c64a7e692460f0b011e42dc96496aedafb286c69 || echo "CHERRY PICK FAILED"

    echo "=== AFTER HEAD ==="
    git rev-parse HEAD
    echo "=== AFTER BRANCH ==="
    git branch --show-current
    echo "=== AFTER STATUS ==="
    git status --short

    echo "=== DIFF HEAD^ HEAD ==="
    git diff HEAD^ HEAD --name-only
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => conn.end()).on('data', data => process.stdout.write(data.toString()));
  });
}).connect(config);
