const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient({datasources: {db: {url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup'}}}); 
async function run() { 
  const sources = await prisma.timberSource.findMany();
  console.log("Sources:", sources);
  const warehouses = await prisma.warehouse.findMany();
  console.log("Warehouses:", warehouses);
  await prisma.$disconnect(); 
} 
run();
