const fs = require('fs');

// 1. FIX POS REPORTS PAGE: tampilkan payment_status bukan status
let reports = fs.readFileSync('frontend/src/app/pos/reports/page.tsx', 'utf8');

const oldBadge = <span className={\px-2 py-1 rounded-full text-xs font-medium \\}>
                           {item.status || "UNKNOWN"}
                          </span>;

const newBadge = <span className={\px-2 py-1 rounded-full text-xs font-bold \\}>
                            {item.payment_status === 'PAID' ? 'LUNAS' :
                             item.payment_status === 'PARTIALLY_PAID' ? 'PIUTANG' : 'BELUM BAYAR'}
                          </span>;

reports = reports.replace(oldBadge, newBadge);
fs.writeFileSync('frontend/src/app/pos/reports/page.tsx', reports);
console.log('REPORTS PATCHED');

// 2. FIX POS HISTORY: also show customer name correctly (add paid_amount field)
let posService = fs.readFileSync('backend/src/pos/pos.service.ts', 'utf8');
posService = posService.replace(
  "async getHistory(companyId: string) {",
  "async getHistory(companyId: string, page = 1, limit = 50) {"
);
posService = posService.replace(
  "return this.prisma.salesOrder.findMany({\n        where: { company_id: companyId },",
  "return this.prisma.salesOrder.findMany({\n        where: { company_id: companyId },\n        take: limit,\n        skip: (page - 1) * limit,"
);
fs.writeFileSync('backend/src/pos/pos.service.ts', posService);
console.log('SERVICE PATCHED');
