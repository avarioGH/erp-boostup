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
  // Use sed to directly replace the specific lines (246, 247, 314, 315)
  // The pattern uses single-space indent (not tab)
  const cmd = `
    FILE=/root/erp-boostup/frontend/src/components/app-sidebar.tsx
    
    # Replace line 246 - the Owner bypass check
    sed -i '246s|.*if (!item.id || user?.role === .Owner.) return true;.*| if (!item.id) return true;\\n            if (user?.role === '"'"'Owner'"'"' \\&\\& (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;|' "$FILE"
    
    # Replace line 314 (now shifted by +1 after above insertion, so line 315)
    # Find and replace the second occurrence
    LINENUM=$(grep -n "if (!item.id || user?.role === " "$FILE" | tail -n 1 | cut -d: -f1)
    echo "SECOND_OCCURRENCE_LINE: $LINENUM"
    if [ ! -z "$LINENUM" ]; then
      sed -i "${LINENUM}s|.*if (!item.id || user?.role === .Owner.) return true;.*| if (!item.id) return true;\\n            if (user?.role === 'Owner' \\&\\& (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;|" "$FILE"
    fi
    
    echo "=== RESULT ==="
    grep -n "accessible_modules.length\|Owner\|accessible_modules.includes" "$FILE" | head -n 15
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
