const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.trimmedLog.findMany({
        where: { status: 'AVAILABLE' }
    });
    console.log("Raw logs:", logs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
