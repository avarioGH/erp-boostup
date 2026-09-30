const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const company = await prisma.company.findFirst();
  if (!company) return console.log('No company');

  try {
    const res = await fetch('http://localhost:3001/inventory/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test' // Might fail auth
        },
        body: JSON.stringify({
            name: 'Test Product',
            companyId: company.id
        })
    });
    console.log(await res.text());
  } catch(e) { console.error(e); }
}
test();
