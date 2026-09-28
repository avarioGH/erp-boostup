const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

function sshReadBuf(remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let data = Buffer.alloc(0);
    conn.on('ready', () => {
      conn.exec(`cat "${remotePath}"`, (err, stream) => {
        if (err) return reject(err);
        stream.on('data', d => { data = Buffer.concat([data, d]); });
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
        const ws = sftp.createWriteStream(remotePath);
        ws.write(Buffer.from(content, 'utf8'), () => {
          ws.end();
          ws.on('close', () => { conn.end(); resolve(); });
          ws.on('error', reject);
        });
      });
    }).connect(config);
  });
}

async function main() {
  const SIDEBAR = '/root/erp-boostup/frontend/src/components/app-sidebar.tsx';
  
  const rawBuf = await sshReadBuf(SIDEBAR);
  let content = rawBuf.toString('utf8');
  
  // The excerpt showed: " if (!item.id || user?.role === 'Owner') return true;\n return user..."
  // So the next line starts with just " " (one space) not 12 spaces
  const oldStr = ` if (!item.id || user?.role === 'Owner') return true;\n return user?.accessible_modules?.includes(item.id);`;
  const newStr = ` if (!item.id) return true;\n if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;\n return user?.accessible_modules?.includes(item.id);`;
  
  const count = content.split(oldStr).length - 1;
  console.log('Match count:', count);
  
  if (count > 0) {
    content = content.replaceAll(oldStr, newStr);
    await sshWrite(SIDEBAR, content);
    console.log('Written!');
    
    // Verify
    const verifyBuf = await sshReadBuf(SIDEBAR);
    const ok = verifyBuf.toString('utf8').includes('accessible_modules.length === 0');
    console.log('VERIFY PATCH:', ok);
  }
}

main().catch(console.error);
