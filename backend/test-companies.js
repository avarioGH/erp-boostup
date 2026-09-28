const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient({datasources: {db: {url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup'}}}); 
async function run() { 
  const companies = await prisma.company.findMany();
  console.log(companies.map(c => c.name)); 
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ email: u.email, role: u.role, company: companies.find(c => c.id === u.company_id)?.name })));
  await prisma.$disconnect(); 
} 
run();
