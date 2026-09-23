const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DISTINCT SPECIES ---');
  const rawLogs = await prisma.rawLog.groupBy({ by: ['species'], _count: { id: true } });
  const trimmedLogs = await prisma.trimmedLog.groupBy({ by: ['species'], _count: { id: true } });
  const inputLogs = await prisma.inputLog.groupBy({ by: ['species'], _count: { id: true } });
  const variants = await prisma.timberVariant.groupBy({ by: ['species'], _count: { id: true } });

  console.log('RawLogs:', JSON.stringify(rawLogs, null, 2));
  console.log('TrimmedLogs:', JSON.stringify(trimmedLogs, null, 2));
  console.log('InputLogs:', JSON.stringify(inputLogs, null, 2));
  console.log('Variants:', JSON.stringify(variants, null, 2));

  console.log('--- DISTINCT GRADES ---');
  const variantGrades = await prisma.timberVariant.groupBy({ by: ['grade'], _count: { id: true } });
  console.log('Variant Grades:', JSON.stringify(variantGrades, null, 2));

  console.log('--- DISTINCT SOURCES ---');
  // Wait, does RawLog have 'source' or 'origin'?
  // Let's check existing rawLogs to see if there is any 'supplier' or 'code' field used for source
  const rawLogSample = await prisma.rawLog.findMany({ take: 5, select: { code: true, species: true } });
  console.log('RawLog Sample:', JSON.stringify(rawLogSample, null, 2));

  console.log('--- DUPLICATE VARIANTS ---');
  const allVariants = await prisma.timberVariant.findMany();
  const dupMap = {};
  for (const v of allVariants) {
    const key = `${v.species}/${v.grade}/${v.thickness}/${v.width}/${v.length}`;
    if (!dupMap[key]) dupMap[key] = [];
    dupMap[key].push(v);
  }
  for (const key in dupMap) {
    if (dupMap[key].length > 1) {
      console.log(`Duplicate found for ${key}:`, dupMap[key].map(d => d.sku));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
