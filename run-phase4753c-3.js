const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
  const pyCode = `
import os

# 1. Update controller
ctrl_file = 'src/inventory/import/import.controller.ts'
with open(ctrl_file, 'r') as f:
    ctrl = f.read()

if '@Req() req: any' not in ctrl:
    ctrl = ctrl.replace('import { Controller, Post, Get, Body, Param, UploadedFile, UseInterceptors, UseGuards } from \\'@nestjs/common\\';',
                        'import { Controller, Post, Get, Body, Param, UploadedFile, UseInterceptors, UseGuards, Req } from \\'@nestjs/common\\';')
    
    ctrl = ctrl.replace('async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: any)',
                        'async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any)')
    ctrl = ctrl.replace('body.userId || \\'SYSTEM\\'',
                        'req.user?.id || body.userId || \\'SYSTEM\\', req.user?.company_id')
                        
    ctrl = ctrl.replace('async executeImport(@Param(\\'id\\') id: string, @Body() body: { sheet: string, importType: string })',
                        'async executeImport(@Param(\\'id\\') id: string, @Body() body: { sheet: string, importType: string }, @Req() req: any)')
    ctrl = ctrl.replace('return this.importService.executeImport(id, body.sheet, body.importType);',
                        'return this.importService.executeImport(id, body.sheet, body.importType, req.user?.company_id);')

    ctrl = ctrl.replace('async previewImport(@Param(\\'id\\') id: string, @Body() body: { sheet: string, importType: string })',
                        'async previewImport(@Param(\\'id\\') id: string, @Body() body: { sheet: string, importType: string }, @Req() req: any)')
    ctrl = ctrl.replace('return this.importService.previewImport(id, body.sheet, body.importType);',
                        'return this.importService.previewImport(id, body.sheet, body.importType, req.user?.company_id);')
                        
    with open(ctrl_file, 'w') as f:
        f.write(ctrl)
    print('Patched controller')

# 2. Update service
svc_file = 'src/inventory/import/import.service.ts'
with open(svc_file, 'r') as f:
    svc = f.read()

# createSession
if 'createdBy: string, companyId?: string' not in svc:
    svc = svc.replace('async createSession(fileName: string, originalName: string, createdBy: string)',
                      'async createSession(fileName: string, originalName: string, createdBy: string, companyId?: string)')
    svc = svc.replace('createdBy }', 'createdBy, companyId }') # Wait, schema might not have companyId on ImportSession. Let's not add to DB, just pass.
    # actually let's skip session companyId if it's not in schema, just rely on executeImport.

# I will just replace executeImport signature and dummyCompany
if 'executeImport(id: string, sheetName: string, importType: string, companyId: string)' not in svc:
    svc = svc.replace('async executeImport(id: string, sheetName: string, importType: string)',
                      'async executeImport(id: string, sheetName: string, importType: string, companyId: string)')
    
    # previewImport
    svc = svc.replace('async previewImport(id: string, sheetName: string, importType: string)',
                      'async previewImport(id: string, sheetName: string, importType: string, companyId: string)')
    
    # replace dummyCompany entirely
    svc = svc.replace('let dummyCompany = await this.prisma.company.findFirst();',
                      'if (!companyId) throw new BadRequestException(\\'Missing companyId context\\');')
    svc = svc.replace('if (!dummyCompany) dummyCompany = await this.prisma.company.create({ data: { name: \\'DUMMY\\' } });', '')
    
    # now replace all dummyCompany.id with companyId
    svc = svc.replace('dummyCompany.id', 'companyId')
    
    with open(svc_file, 'w') as f:
        f.write(svc)
    print('Patched service')

`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch_import.py
${pyCode}
EOF
    python3 patch_import.py
    npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
