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
    let data = Buffer.alloc(0);
    conn.on('ready', () => {
      conn.exec(`cat "${remotePath}"`, (err, stream) => {
        if (err) return reject(err);
        stream.on('data', d => { data = Buffer.concat([data, d]); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); resolve(data.toString('utf8')); });
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
        writeStream.write(Buffer.from(content, 'utf8'), () => {
          writeStream.end();
          writeStream.on('close', () => { conn.end(); resolve(); });
          writeStream.on('error', reject);
        });
      });
    }).connect(config);
  });
}

async function main() {
  const SIDEBAR = '/root/erp-boostup/frontend/src/components/app-sidebar.tsx';
  
  console.log('Reading sidebar...');
  let content = await sshRead(SIDEBAR);
  
  // Check line 246 exact bytes
  const lines = content.split('\n');
  const line246 = lines[245]; // 0-indexed
  console.log('Line 246 exact:', JSON.stringify(line246));
  console.log('Line 247 exact:', JSON.stringify(lines[246]));

  // The pattern uses \r\n or just \n?
  const hasCRLF = content.includes('\r\n');
  console.log('Has CRLF:', hasCRLF);
  
  const lineEnding = hasCRLF ? '\r\n' : '\n';
  const oldStr = ` if (!item.id || user?.role === 'Owner') return true;${lineEnding}            return user?.accessible_modules?.includes(item.id);`;
  
  const count = content.split(oldStr).length - 1;
  console.log(`Pattern found with ${hasCRLF ? 'CRLF' : 'LF'}: ${count} times`);

  const newStr = ` if (!item.id) return true;${lineEnding}            if (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0)) return true;${lineEnding}            return user?.accessible_modules?.includes(item.id);`;

  if (count > 0) {
    content = content.replaceAll(oldStr, newStr);
    console.log('Writing back...');
    await sshWrite(SIDEBAR, content);
    console.log('Done!');
    
    const verify = await sshRead(SIDEBAR);
    console.log('PATCH VERIFIED:', verify.includes('accessible_modules.length === 0'));
  }
}

main().catch(console.error);
