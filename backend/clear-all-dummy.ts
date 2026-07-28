import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full dummy data cleanup...');
  
  // 1. Transactions & Finances
  await prisma.financeTransactionItem.deleteMany({});
  await prisma.financeTransaction.deleteMany({});
  await prisma.journalEntryItem.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.inventoryTransactionItem.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  
  // 2. Inventory Stocks & Images
  await prisma.warehouseStock.deleteMany({});
  await prisma.productImage.deleteMany({});
  
  // 3. Master Products
  await prisma.product.deleteMany({});
  
  // 4. Other Master Data (Categories, Units, Brands, Suppliers)
  await prisma.category.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.supplier.deleteMany({});
  
  // 5. Warehouses & Access
  await prisma.userWarehouseAccess.deleteMany({});
  await prisma.warehouse.deleteMany({});
  
  // 6. Finances Categories & Cash Accounts
  // Reset cash account balances instead of deleting to keep the main bank account?
  // Let's delete all cash accounts except the ones the user explicitly created?
  // Actually, we can just delete all cash accounts. The user can create new ones.
  await prisma.cashAccount.deleteMany({});
  await prisma.financeCategory.deleteMany({});

  console.log('All dummy data (including warehouses, categories, units, and products) cleared successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
