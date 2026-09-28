const fs = require('fs');

const svcPath = 'backend/src/inventory/trimmed-log.service.ts';
let svc = fs.readFileSync(svcPath, 'utf8');

if (!svc.includes('async deleteTrimmedLog')) {
  const insertIndex = svc.lastIndexOf('}');
  const deleteFunc = `
  async deleteTrimmedLog(id: string) {
    const log = await this.prisma.trimmedLog.findUnique({ where: { id } });
    if (!log) throw new Error('Trimmed Log not found');
    
    // Kembalikan status RawLog ke AVAILABLE
    if (log.rawLogId) {
      await this.prisma.rawLog.update({
        where: { id: log.rawLogId },
        data: { status: 'AVAILABLE' }
      });
    }

    return this.prisma.trimmedLog.delete({ where: { id } });
  }
`;
  svc = svc.substring(0, insertIndex) + deleteFunc + svc.substring(insertIndex);
  fs.writeFileSync(svcPath, svc, 'utf8');
}
console.log("Patched Trimming Service");
