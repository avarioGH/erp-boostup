const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { SequenceService } = require('./dist/reports/sequence.service.js');

async function test() {
  const company = await prisma.company.findFirst();
  if (!company) return console.log('No company');

  const seqService = new SequenceService();
  try {
    const num = await seqService.generateNumber(prisma, company.id, 'PRODUCT', 'PRD');
    console.log("Generated:", num);
  } catch (e) {
    console.error("Error generating number:", e);
  }
}
test();
