const { Client } = require('ssh2');

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
        stream.stderr.on('data', d => {});
        stream.on('close', () => { conn.end(); resolve(data); });
      });
    }).connect(config);
  });
}

async function main() {
  const SIDEBAR = '/root/erp-boostup/frontend/src/components/app-sidebar.tsx';
  const rawBuffer = await sshRead(SIDEBAR);
  
  // Show the raw bytes around line 246-247
  const content = rawBuffer.toString('utf8');
  const lines = content.split('\n');
  
  const line246 = lines[245];
  const line247 = lines[246];
  
  console.log('Line 246 bytes:', Buffer.from(line246).toString('hex'));
  console.log('Line 247 bytes:', Buffer.from(line247).toString('hex'));
  
  // What is the separator between line 246 and 247 in the raw buffer?
  // Find position of 'Owner' in line 246
  const pos246 = content.indexOf(" if (!item.id || user?.role === 'Owner') return true;");
  if (pos246 >= 0) {
    const excerpt = content.substring(pos246, pos246 + 200);
    console.log('EXCERPT HEX:', Buffer.from(excerpt).toString('hex').substring(0, 100));
    console.log('EXCERPT TEXT:', JSON.stringify(excerpt.substring(0, 100)));
  }
}

main().catch(console.error);
