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
    
    echo "=== PRE-FLIGHT ==="
    npx --yes ts-node backend/src/pre-flight-inventory-integrity-audit.ts
    
    if [ $? -ne 0 ]; then
      echo "PRE-FLIGHT FAILED"
      exit 1
    fi

    echo "=== RUN AUDIT ==="
    START_TIME=$(date +%s)
    npx --yes ts-node backend/src/run-inventory-integrity-audit.ts 6a987114770e0a54883770b1
    EXIT_CODE=$?
    END_TIME=$(date +%s)
    
    echo "EXIT_CODE=$EXIT_CODE"
    echo "DURATION=$(($END_TIME - $START_TIME)) seconds"
    
    echo "=== STATUS ==="
    git status --short
    
    echo "=== JSON REPORT ==="
    REPORT_FILE=$(ls -t inventory_integrity_report_*.json 2>/dev/null | head -1)
    if [ -z "$REPORT_FILE" ]; then
      REPORT_FILE=$(ls -t backend/inventory_integrity_report_*.json 2>/dev/null | head -1)
    fi
    
    if [ -n "$REPORT_FILE" ]; then
      echo "FILE: $REPORT_FILE"
      echo "SIZE: $(wc -c < $REPORT_FILE | awk '{print $1}') bytes"
      echo "--- CONTENT START ---"
      cat $REPORT_FILE
      echo "--- CONTENT END ---"
    else
      echo "REPORT FILE NOT FOUND"
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
