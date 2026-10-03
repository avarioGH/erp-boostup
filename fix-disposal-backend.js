const fs = require('fs');

// Fix DTO
let dtoFile = 'backend/src/inventory/disposal/disposal.dto.ts';
let dtoContent = fs.readFileSync(dtoFile, 'utf8');
dtoContent = dtoContent.replace(
  /@IsString\(\)\s*@IsNotEmpty\(\)\s*companyId: string;/g,
  '@IsOptional()\n  @IsString()\n  companyId?: string;'
);
dtoContent = dtoContent.replace(
  /@IsString\(\)\s*@IsNotEmpty\(\)\s*reason: string;/g,
  '@IsOptional()\n  @IsString()\n  reason?: string;'
);
fs.writeFileSync(dtoFile, dtoContent);

// Fix Controller
let ctrlFile = 'backend/src/inventory/disposal/disposal.controller.ts';
let ctrlContent = fs.readFileSync(ctrlFile, 'utf8');
ctrlContent = ctrlContent.replace(
  'return this.disposalService.create(dto, req.user.id);',
  'dto.companyId = req.user.companyId || req.user.company_id;\n    return this.disposalService.create(dto, req.user.id);'
);
fs.writeFileSync(ctrlFile, ctrlContent);

// Also check Service to make sure it doesn't break if reason is undefined
// reason is mapped directly to prisma which accepts nullable/optional if schema allows
