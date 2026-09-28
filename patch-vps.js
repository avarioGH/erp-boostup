const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const tsCode = `
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  const roles = await prisma.role.findMany();
  const ownerRole = roles.find(r => r.name === 'Owner');
  
  if (ownerRole) {
    await prisma.user.updateMany({
      where: { email: 'kayu@boostup.id' },
      data: { 
        role_id: ownerRole.id,
        accessible_modules: ['inventory', 'settings', 'pos'] // let's give them inventory and settings so they can manage
      }
    });
    console.log("Kayu restored to Owner with restricted modules.");
  }

  await app.close();
}
main().catch(console.error);
`;

const js = `
const fs = require('fs');
const path = 'src/components/app-sidebar.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \\(!item\\.id \\|\\| user\\?\\.role === 'Owner'\\) return true;/g, 
  "if (!item.id || (user?.role === 'Owner' && (!user?.accessible_modules || user.accessible_modules.length === 0 || user.accessible_modules.includes('all')))) return true;");

fs.writeFileSync(path, code);
console.log("Sidebar patched.");
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > fix-kayu.ts
${tsCode}
EOF
    npx ts-node fix-kayu.ts

    cd /root/erp-boostup/frontend || exit 1
    cat << 'EOF' > patch-sidebar.js
${js}
EOF
    node patch-sidebar.js
    npm run build
    pm2 restart erp-frontend
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
