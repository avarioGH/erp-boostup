const fs = require('fs');
let code = fs.readFileSync('backend/src/purchasing/purchasing.service.ts', 'utf8');

const target = `      return this.prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId, company_id: companyId },
          include: { items: true },
        });
        if (!po) throw new NotFoundException('PO not found');

        let subtotal = 0;
        let tax = 0;
        let allFullyBilled = true;

        for (const bItem of billData.items) {`;

const replacement = `      return this.prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId, company_id: companyId },
          include: { items: true },
        });
        if (!po) throw new NotFoundException('PO not found');

        // Auto-fill billData if empty (e.g. fast bill)
        if (!billData.items || billData.items.length === 0) {
          billData.items = po.items.map((i: any) => ({
            productId: i.product_id,
            qty: i.qty - (i.billed_qty || 0),
          })).filter((i: any) => i.qty > 0);
        }

        let subtotal = 0;
        let tax = 0;
        let allFullyBilled = true;

        for (const bItem of billData.items) {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('backend/src/purchasing/purchasing.service.ts', code);
  console.log('patched backend createVendorBill');
} else {
  console.log('target not found in backend');
}
