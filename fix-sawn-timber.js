const fs = require('fs');
let content = fs.readFileSync('backend/src/inventory/sawn-timber.service.ts', 'utf-8');

// 1. Modify getOrCreateTimberVariant signature and logic
const oldMethod = /async getOrCreateTimberVariant\([\s\S]*?return variant;\s*\}/;
const newMethod = `
  async getOrCreateTimberVariant(companyId: string, species: string, grade: string, thickness: number, width: number, length: number) {
    const sizeStr = this.normalizeDimensions(thickness, width, length);
    const sku = \`\${species.toUpperCase()}-\${grade.toUpperCase()}-\${sizeStr}\`;
    const volumePerPiece = (thickness * width * length) / 1000000000;

    let variant = await this.prisma.timberVariant.findUnique({ where: { sku } });
    if (!variant) {
      let product = await this.prisma.product.findFirst({ where: { company_id: companyId, code: species } });
      
      if (!product) {
        // Auto create master product
        let unit = await this.prisma.unit.findFirst({ where: { company_id: companyId, name: 'M3' } });
        if (!unit) {
          unit = await this.prisma.unit.create({ data: { company_id: companyId, name: 'M3' } });
        }
        product = await this.prisma.product.create({
          data: {
            company_id: companyId,
            unit_id: unit.id,
            code: species,
            name: \`Kayu \${species}\`,
            purchase_price: 0,
            selling_price: 0
          }
        });
      }
      
      variant = await this.prisma.timberVariant.create({
        data: {
          productId: product.id,
          species,
          grade,
          thickness,
          width,
          length,
          sku,
          volumePerPiece
        }
      });
    }
    return variant;
  }
`.trim();

content = content.replace(oldMethod, newMethod);

// 2. Modify the caller in createOutput to pass companyId
// We need to fetch the companyId from the warehouse
// First, find where `const inputLog = await tx.inputLog.findUnique` is, and add location include if not there
const oldFindLog = /const inputLog = await tx\.inputLog\.findUnique\(\{\s*where: \{ id: inputLogId \}\s*\}\);/;
const newFindLog = `
        const inputLog = await tx.inputLog.findUnique({ where: { id: inputLogId }, include: { location: true } });
`.trim();
content = content.replace(oldFindLog, newFindLog);

// 3. Modify the getOrCreateTimberVariant call
const oldCall = /const variant = await this\.getOrCreateTimberVariant\(inputLog\.species, item\.grade \|\| 'A', item\.thickness, item\.width, item\.length\);/;
const newCall = `const variant = await this.getOrCreateTimberVariant(inputLog.location.company_id, inputLog.species, item.grade || 'A', item.thickness, item.width, item.length);`;
content = content.replace(oldCall, newCall);

fs.writeFileSync('backend/src/inventory/sawn-timber.service.ts', content);
console.log('Successfully updated getOrCreateTimberVariant');
