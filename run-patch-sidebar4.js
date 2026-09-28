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

conn.on('ready', () => {
  // Read the sidebar file contents via SSH and patch it here
  conn.exec(`cat /root/erp-boostup/frontend/src/components/app-sidebar.tsx`, (err, stream) => {
    if (err) throw err;
    let sidebarContent = '';
    stream.on('data', d => { sidebarContent += d.toString(); });
    stream.on('close', () => {
      // Now patch the content
      const oldPattern = ` if (!item.id || user?.role === 'Owner') return true;\n            return user?.accessible_modules?.includes(item.id);`;
      const newPattern = ` if (!item.id) return true;\n            if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;\n            return user?.accessible_modules?.includes(item.id);`;

      const count = (sidebarContent.split(oldPattern).length - 1);
      console.log(`Found ${count} occurrences of pattern`);

      if (count === 0) {
        // Try to find what the actual pattern looks like
        const lines = sidebarContent.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('accessible_modules') || (line.includes('Owner') && line.includes('return true'))) {
            console.log(`Line ${i+1}: [${line}]`);
          }
        });
        conn.end();
        return;
      }

      const patchedContent = sidebarContent.replaceAll(oldPattern, newPattern);

      // Write patched content back via ssh
      conn2 = new (require('ssh2').Client)();
      conn2.on('ready', () => {
        conn2.exec(`cat > /root/erp-boostup/frontend/src/components/app-sidebar.tsx`, (err2, stream2) => {
          if (err2) throw err2;
          stream2.write(patchedContent);
          stream2.end();
          stream2.on('close', () => {
            console.log('WRITTEN OK');
            // Verify
            conn2.exec(`grep -n "accessible_modules.length" /root/erp-boostup/frontend/src/components/app-sidebar.tsx | head`, (err3, stream3) => {
              if (err3) throw err3;
              stream3.on('data', d => process.stdout.write(d.toString()));
              stream3.on('close', () => conn2.end());
            });
          });
        });
      }).connect(config);

      conn.end();
    });
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
