const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dbUrl = process.env.DATABASE_URL || "unknown";
  console.log("DB_URL:", dbUrl.split('@')[1] || dbUrl); // Hide credentials
  
  const company = await prisma.company.findFirst({ where: { name: { contains: 'kayu', mode: 'insensitive' } } });
  console.log("COMPANY:", company ? company.name : "Not found", company ? company.id : "");
  
  if (company) {
    const purchaseCount = await prisma.timberPurchase.count();
    const purchaseCountCompany = await prisma.timberPurchase.count({ where: { company_id: company.id } });
    const itemCount = await prisma.timberPurchaseItem.count();
    const logItemCount = await prisma.timberPurchaseLogItem.count();
    
    console.log(`TimberPurchase Total: ${purchaseCount} | For Company: ${purchaseCountCompany}`);
    console.log(`TimberPurchaseItem Total: ${itemCount}`);
    console.log(`TimberPurchaseLogItem Total: ${logItemCount}`);
    
    const sample = await prisma.timberPurchase.findMany({ 
      where: { company_id: company.id },
      take: 2,
      include: { source: true, warehouse: true }
    });
    
    console.log("SAMPLE PURCHASES:", JSON.stringify(sample, null, 2));
  }
}
main().finally(() => prisma.$disconnect());
