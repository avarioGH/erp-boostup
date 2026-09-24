const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  let negativeStock = await prisma.timberStock.count({ where: { currentPcs: { lt: 0 } } });
  let negativeM3 = await prisma.timberStock.count({ where: { currentVolumeM3: { lt: 0 } } });
  
  // Ledger mismatch check (sampled)
  const stocks = await prisma.timberStock.findMany({ include: { movements: true } });
  let mismatches = 0;
  for (const s of stocks) {
    let ledgerPcs = 0;
    for (const m of s.movements) {
      if (m.type === 'IN') ledgerPcs += m.quantityPcs;
      else if (m.type === 'OUT') ledgerPcs -= m.quantityPcs;
    }
    if (ledgerPcs !== s.currentPcs) mismatches++;
  }

  console.log(`Negative Stock (PCS): ${negativeStock}`);
  console.log(`Negative Stock (M3): ${negativeM3}`);
  console.log(`Ledger Mismatches: ${mismatches}`);
  
  process.exit(0);
}

runAudit();
