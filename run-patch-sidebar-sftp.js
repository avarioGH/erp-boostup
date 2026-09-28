const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

function sshRead(remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let data = '';
    conn.on('ready', () => {
      conn.exec(`cat "${remotePath}"`, (err, stream) => {
        if (err) return reject(err);
        stream.on('data', d => { data += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); resolve(data); });
      });
    }).connect(config);
  });
}

function sshWrite(remotePath, content) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.write(content, 'utf8', () => {
          writeStream.end();
          writeStream.on('close', () => { conn.end(); resolve(); });
        });
      });
    }).connect(config);
  });
}

async function main() {
  const SIDEBAR = '/root/erp-boostup/frontend/src/components/app-sidebar.tsx';
  
  console.log('Reading sidebar...');
  let content = await sshRead(SIDEBAR);
  
  const oldStr = ` if (!item.id || user?.role === 'Owner') return true;\n            return user?.accessible_modules?.includes(item.id);`;
  const newStr = ` if (!item.id) return true;\n            // Owner with specific modules: respect accessible_modules; empty array means full access\n            if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;\n            return user?.accessible_modules?.includes(item.id);`;
  
  const count = content.split(oldStr).length - 1;
  console.log(`Pattern found: ${count} times`);
  
  if (count === 0) {
    // Check actual spacing
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes("Owner") && l.includes("return true")) {
        console.log(`Line ${i+1}: |${JSON.stringify(l)}|`);
      }
    });
    return;
  }

  content = content.replaceAll(oldStr, newStr);
  console.log('Writing back...');
  await sshWrite(SIDEBAR, content);
  console.log('Done! Verifying...');
  
  const verify = await sshRead(SIDEBAR);
  const found = verify.includes('accessible_modules.length === 0');
  console.log('PATCH VERIFIED:', found);
}

main().catch(console.error);
