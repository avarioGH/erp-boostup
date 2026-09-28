const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup'}}});
async function run() {
  const users = await prisma.user.findMany({include:{company:true}});
  console.log(users.map(u => ({ username: u.username, email: u.email, company: u.company?.name })));
  await prisma.$disconnect();
}
run();
