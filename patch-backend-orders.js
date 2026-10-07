const fs = require('fs');
let content = fs.readFileSync('backend/src/crm/order.controller.ts', 'utf8');

// Add Query import
if(!content.includes('Query,')) {
    content = content.replace('Get,', 'Get, Query,');
}

// Modify getOrders
let oldMethod = /async getOrders\(@Request\(\) req\) \{\s*return this\.prisma\.salesOrder\.findMany\(\{\s*where: \{ company_id: req\.user\.company_id \},\s*include: \{\s*customer: true,\s*items: \{\s*include: \{ product: true \},\s*\},\s*\},\s*orderBy: \{ order_date: 'desc' \},\s*\}\);\s*\}/m;

let newMethod = `async getOrders(@Request() req, @Query() query: any) {
    const whereParams: any = { company_id: req.user.company_id };
    if (query.warehouse_id) {
      whereParams.warehouse_id = query.warehouse_id;
    }
    return this.prisma.salesOrder.findMany({
      where: whereParams,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { order_date: 'desc' },
    });
  }`;

content = content.replace(oldMethod, newMethod);
fs.writeFileSync('backend/src/crm/order.controller.ts', content);
console.log('Patched backend');
