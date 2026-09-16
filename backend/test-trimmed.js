const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.trimmedLog.findMany({
        where: { status: 'AVAILABLE' }
    });
    console.log(logs.map(l => ({ id: l.id, status: l.status, trimNumber: l.trimNumber, inputLogId: l.inputLogId, locationId: l.locationId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
