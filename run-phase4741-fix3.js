const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 15000
};

conn.on('ready', () => {
  const tsCode = `
import * as fs from 'fs';

function updateService(name, modelName) {
  const path = \`/root/erp-boostup/backend/src/inventory/master-data/services/\${name}.service.ts\`;
  
  let content = \`import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class \${modelName}Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.findMany({ 
      where: \${modelName === 'Location' ? '{ warehouse: { company_id: companyId } }' : '{ company_id: companyId }'} 
    });
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.findFirst({ 
      where: { 
        id, 
        \${modelName === 'Location' ? 'warehouse: { company_id: companyId }' : 'company_id: companyId'} 
      } 
    });
    if (!item) throw new NotFoundException('\${modelName} not found');
    return item;
  }

  async create(companyId: string, data: any) {
    if (data.code) {
      const existing = await this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.findFirst({ 
        where: { 
          code: data.code, 
          \${modelName === 'Location' ? 'warehouse: { company_id: companyId }' : 'company_id: companyId'} 
        } 
      });
      if (existing) throw new ConflictException('Code already exists');
    }
\`;

  if (modelName === 'Location') {
    content += \`    if (data.warehouseId) {
      const wh = await this.prisma.warehouse.findFirst({ where: { id: data.warehouseId, company_id: companyId } });
      if (!wh) throw new ForbiddenException('Warehouse does not belong to company');
    }
\`;
  }

  content += \`    const payload = { ...data };
    delete payload.company_id;
    delete payload.companyId;
\`;

  if (modelName !== 'Location') {
    content += \`    payload.company_id = companyId;\n\`;
  }

  content += \`    return this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.create({ data: payload });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    delete data.company_id;
    delete data.companyId;
\`;

  if (modelName === 'Location') {
    content += \`    if (data.warehouseId) {
      const wh = await this.prisma.warehouse.findFirst({ where: { id: data.warehouseId, company_id: companyId } });
      if (!wh) throw new ForbiddenException('Warehouse does not belong to company');
    }
\`;
  }

  content += \`    return this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.update({
      where: { id },
      data,
    });
  }

  async updateStatus(companyId: string, id: string, isActive: boolean) {
    await this.findOne(companyId, id);
    return this.prisma.\${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.update({
      where: { id },
      data: { isActive },
    });
  }
}
\`;
  fs.writeFileSync(path, content);
}

function run() {
  updateService('timber-species', 'TimberSpecies');
  updateService('timber-grade', 'TimberGrade');
  updateService('timber-source', 'TimberSource');
  updateService('location', 'Location');
  console.log("FIX_APPLIED");
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/phase4741-fix3.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/phase4741-fix3.ts
    
    echo "=== TSC CHECK ==="
    cd backend && npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', data => {
      process.stdout.write(data.toString());
    }).stderr.on('data', data => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
