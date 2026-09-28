const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    python3 << 'PYEOF'
import os

# 1. Patch timber-purchase.service.ts
purchase_file = 'src/inventory/purchase/purchase.service.ts'
with open(purchase_file, 'r') as f:
    content = f.read()

purchase_patch = """
    // Validate Source tenant and active status
    if (sourceId) {
      const source = await this.prisma.timberSource.findFirst({
        where: { id: sourceId, company_id: companyId }
      });
      if (!source) throw new BadRequestException('TimberSource not found or does not belong to this company');
      if (!source.isActive) throw new BadRequestException('Cannot use inactive TimberSource for new purchase');
    }

    const purchase = await this.prisma.timberPurchase.create({"""

if 'TimberSource not found or does not belong' not in content:
    content = content.replace('const purchase = await this.prisma.timberPurchase.create({', purchase_patch)
    with open(purchase_file, 'w') as f:
        f.write(content)
    print('Patched purchase.service.ts')

# 2. Patch sawn-timber.service.ts
variant_file = 'src/inventory/sawn-timber.service.ts'
with open(variant_file, 'r') as f:
    content = f.read()

variant_old = """    if (speciesId) {
      const sp = await this.prisma.timberSpecies.findUnique({ where: { id: speciesId } });
      if (sp) actualSpecies = sp.code;
    }"""
variant_new = """    if (speciesId) {
      const sp = await this.prisma.timberSpecies.findFirst({ where: { id: speciesId, company_id: companyId } });
      if (!sp) throw new BadRequestException('TimberSpecies not found or does not belong to this company');
      if (!sp.isActive) throw new BadRequestException('Cannot use inactive TimberSpecies for new production');
      actualSpecies = sp.code;
    }"""

if 'Cannot use inactive TimberSpecies' not in content:
    content = content.replace(variant_old, variant_new)
    with open(variant_file, 'w') as f:
        f.write(content)
    print('Patched sawn-timber.service.ts')

# 3. Patch raw-log.service.ts
rawlog_file = 'src/inventory/raw-log.service.ts'
with open(rawlog_file, 'r') as f:
    content = f.read()

rawlog_old = """    if (data.speciesId) {
      const speciesObj = await this.prisma.timberSpecies.findUnique({ where: { id: data.speciesId } });
      if (speciesObj) {
        speciesStr = speciesObj.code;
      }
    }"""
rawlog_new = """    if (data.speciesId) {
      const speciesObj = await this.prisma.timberSpecies.findUnique({ where: { id: data.speciesId } });
      if (!speciesObj) throw new BadRequestException('TimberSpecies not found');
      if (!speciesObj.isActive) throw new BadRequestException('Cannot use inactive TimberSpecies for new raw log');
      speciesStr = speciesObj.code;
    }"""

if 'Cannot use inactive TimberSpecies' not in content:
    content = content.replace(rawlog_old, rawlog_new)
    with open(rawlog_file, 'w') as f:
        f.write(content)
    print('Patched raw-log.service.ts')

PYEOF
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
