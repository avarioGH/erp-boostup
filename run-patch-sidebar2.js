const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

// Write python script to a temp file locally and scp it
const pythonScript = `
with open('/root/erp-boostup/frontend/src/components/app-sidebar.tsx', 'r') as f:
    content = f.read()

# Patch: Owner with non-empty accessible_modules respects the restriction
old_str = """if (!item.id || user?.role === 'Owner') return true;
            return user?.accessible_modules?.includes(item.id);"""
new_str = """if (!item.id) return true;
            // If user is Owner but has explicit modules set, respect them
            if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;
            return user?.accessible_modules?.includes(item.id);"""

if old_str in content:
    content = content.replace(old_str, new_str)
    with open('/root/erp-boostup/frontend/src/components/app-sidebar.tsx', 'w') as f:
        f.write(content)
    print('PATCHED')
else:
    print('PATTERN NOT FOUND - checking current state:')
    # Find the relevant lines
    lines = content.split('\\n')
    for i, line in enumerate(lines):
        if "accessible_modules" in line and "includes" in line:
            print(f"Line {i+1}: {line}")
        if "Owner" in line and "return true" in line:
            print(f"Line {i+1}: {line}")
`;

fs.writeFileSync('/tmp/sidebar_patch.py', pythonScript);

conn.on('ready', () => {
  // Read the python file and transfer it via stdin
  const cmd = `cat > /tmp/sidebar_patch.py << 'HEREDOC'
${pythonScript}
HEREDOC
python3 /tmp/sidebar_patch.py

echo "=== VERIFY ==="
grep -n "accessible_modules.length\|Owner.*accessible_modules" /root/erp-boostup/frontend/src/components/app-sidebar.tsx | head -n 10
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
