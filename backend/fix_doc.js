const fs = require('fs');
let content = fs.readFileSync('src/document/document.service.ts', 'utf8');

content = content.replace(
  /async generateShareLink\(documentMasterId: string, userId: string, validDays: number, password\?: string\) \{/,
  "async generateShareLink(companyId: string, documentMasterId: string, userId: string, validDays: number, password?: string) {\n    const doc = await this.prisma.documentMaster.findUnique({ where: { id: documentMasterId } });\n    if (!doc || doc.company_id !== companyId) throw new BadRequestException('Document not found');"
);

content = content.replace(
  /data: \{\s*user_id: userId,\s*action: 'SHARE_LINK_GENERATED',/m,
  "data: {\n        company_id: companyId,\n        user_id: userId,\n        action: 'SHARE_LINK_GENERATED',"
);

fs.writeFileSync('src/document/document.service.ts', content);
