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
    
    # REVERT previous cherry-pick to align with user's strict step-by-step
    CURRENT_HEAD=$(git rev-parse HEAD)
    if [ "$CURRENT_HEAD" != "3be204e96473b06c71b9749af3814c4d20d179a5" ]; then
      git reset --hard 3be204e96473b06c71b9749af3814c4d20d179a5
    fi

    echo "=== BEFORE (Expected: 3be204e...) ==="
    git rev-parse HEAD
    git branch --show-current
    git status --short

    echo "=== REMOTE ==="
    git remote -v

    echo "=== FETCH EXACT COMMIT ==="
    git fetch origin c64a7e692460f0b011e42dc96496aedafb286c69

    echo "=== VERIFY OBJECT ==="
    git cat-file -t c64a7e692460f0b011e42dc96496aedafb286c69
    git show --no-patch --format=fuller c64a7e692460f0b011e42dc96496aedafb286c69
    git show --stat --oneline c64a7e692460f0b011e42dc96496aedafb286c69
    git show --name-only --format="" c64a7e692460f0b011e42dc96496aedafb286c69

    echo "=== AFTER ==="
    git rev-parse HEAD
    git branch --show-current
    git status --short
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => conn.end()).on('data', data => process.stdout.write(data.toString()));
  });
}).connect(config);
