import { PrismaClient } from '@prisma/client';

async function preFlight() {
  console.log('--- PRE-FLIGHT INVENTORY INTEGRITY AUDIT ---');
  
  if (!process.env.DATABASE_URL) {
    console.error('FAILED: DATABASE_URL is not set.');
    process.exit(1);
  }
  
  console.log('DATABASE_URL is set (value masked).');

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Prisma connection succeeded.');

    // Simple read query
    const companyId = '6a987114770e0a54883770b1';
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      console.error(`FAILED: Target company ${companyId} not found.`);
      process.exit(1);
    }

    if (company.name !== 'Boostup ERP') {
      console.error(`FAILED: Target company name mismatch. Expected "Boostup ERP", got "${company.name}".`);
      process.exit(1);
    }

    console.log(`Target company "${company.name}" verified.`);
    console.log('Pre-flight check PASSED.');
  } catch (error) {
    console.error('FAILED: Pre-flight encountered an error.', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

preFlight();
