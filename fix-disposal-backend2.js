const fs = require('fs');

let ctrlFile = 'backend/src/inventory/disposal/disposal.controller.ts';
let ctrlContent = fs.readFileSync(ctrlFile, 'utf8');

// Replace the previous patch with a more robust one
ctrlContent = ctrlContent.replace(
  'dto.companyId = req.user.companyId || req.user.company_id;\n    return this.disposalService.create(dto, req.user.id);',
  'return this.disposalService.create(dto, req.user.id);'
);

ctrlContent = ctrlContent.replace(
  'return this.disposalService.create(dto, req.user.id);',
  'dto.companyId = req.user.companyId || req.user.company_id;\n    dto.reason = dto.reason || dto.notes || "Pemusnahan (Disposal)";\n    return this.disposalService.create(dto, req.user.id);'
);
fs.writeFileSync(ctrlFile, ctrlContent);
