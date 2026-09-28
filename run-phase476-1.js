const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const pyCode = `
import asyncio
from prisma import Prisma

async def main():
    pass # Will use ts-node instead
`;

const tsCode = `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  if (!user) {
    console.log("User kayu@boostup.id not found!");
    process.exit(1);
  }
  
  const companyId = user.company_id;
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  
  console.log("=== TARGET COMPANY ===");
  console.log(company.name, "ID:", companyId);
  
  const counts = {
    Company: await prisma.company.count(),
    Warehouse: await prisma.warehouse.count({ where: { company_id: companyId } }),
    Location: await prisma.location.count({ where: { warehouse: { company_id: companyId } } }),
    TimberSpecies: await prisma.timberSpecies.count({ where: { company_id: companyId } }),
    TimberGrade: await prisma.timberGrade.count({ where: { company_id: companyId } }),
    TimberSource: await prisma.timberSource.count({ where: { company_id: companyId } }),
    Category: await prisma.category.count({ where: { company_id: companyId } }),
    Product: await prisma.product.count({ where: { company_id: companyId } }),
    TimberVariant: await prisma.timberVariant.count({ where: { company_id: companyId } }),
    TimberStock: await prisma.timberStock.count({ where: { warehouse: { company_id: companyId } } }),
    TimberStockMovement: await prisma.timberStockMovement.count({ where: { warehouse: { company_id: companyId } } })
  };
  
  console.log("=== COUNTS ===");
  console.table(counts);
  
  console.log("=== WAREHOUSES ===");
  const warehouses = await prisma.warehouse.findMany({ where: { company_id: companyId } });
  console.table(warehouses);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > run-phase476-audit.ts
${tsCode}
EOF
    npx ts-node run-phase476-audit.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
