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
  const cmd = `
    cd /root/erp-boostup/frontend || exit 1

    python3 << 'PYEOF'
with open('src/components/app-sidebar.tsx', 'r') as f:
    content = f.read()

# Fix the filter logic:
# OLD: if (!item.id || user?.role === 'Owner') return true;
# NEW: if (!item.id) return true;
#      if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;
#      return user?.accessible_modules?.includes(item.id);

old_filter = "if (!item.id || user?.role === 'Owner') return true;\n            return user?.accessible_modules?.includes(item.id);"
new_filter = """if (!item.id) return true;
            // Owner with no module restrictions = full access
            // Owner with specific modules = respect the restriction
            if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;
            return user?.accessible_modules?.includes(item.id);"""

content = content.replace(old_filter, new_filter)

# Apply the same fix for the settings filter block
# (it appears twice in the file)
with open('src/components/app-sidebar.tsx', 'w') as f:
    f.write(content)

print('SIDEBAR PATCHED')
PYEOF

    echo "=== VERIFY PATCH ==="
    grep -n "Owner.*accessible_modules\|accessible_modules.*length" src/components/app-sidebar.tsx | head -n 10
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
