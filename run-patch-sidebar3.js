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
  // Use sed to fix lines 246-247 and 314-315
  const cmd = `
    FILE=/root/erp-boostup/frontend/src/components/app-sidebar.tsx
    
    # Show lines around 244-250
    sed -n '244,250p' "$FILE"
    echo "---"
    
    # Replace with sed - use a Python inline script with no heredoc quoting issues
    python3 -c "
f = open('$FILE', 'r')
c = f.read()
f.close()

old = \\"  if (!item.id || user?.role === 'Owner') return true;\\\\n              return user?.accessible_modules?.includes(item.id);\\"
new = \\"  if (!item.id) return true;\\\\n              if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;\\\\n              return user?.accessible_modules?.includes(item.id);\\"

count = c.count(old)
print('MATCHES:', count)
c = c.replace(old, new)

f = open('$FILE', 'w')
f.write(c)
f.close()
print('DONE')
"
    
    echo "=== VERIFY ==="
    grep -n "accessible_modules.length\|Owner.*accessible_modules" "$FILE" | head -n 10
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
