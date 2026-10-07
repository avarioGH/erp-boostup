const fs = require('fs');
let code = fs.readFileSync('backend/src/reports/report.controller.ts', 'utf8');

code = code.replace(
  `      if (type === 'invoices')
        docDef = await this.documentService.getInvoicePdfDefinition(
          req.user.company_id,
          id,
        );
      else throw new BadRequestException('Document type not supported');`,
  `      if (type === 'invoices')
        docDef = await this.documentService.getInvoicePdfDefinition(
          req.user.companyId || req.user.company_id,
          id,
        );
      else if (type === 'purchase-orders')
        docDef = await this.documentService.getPurchaseOrderPdfDefinition(
          req.user.companyId || req.user.company_id,
          id,
        );
      else throw new BadRequestException('Document type not supported');`
);

fs.writeFileSync('backend/src/reports/report.controller.ts', code);
console.log('patched report.controller.ts');
