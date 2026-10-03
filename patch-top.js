const fs = require('fs');
let file = 'backend/src/analytics/analytics.service.ts';
let content = fs.readFileSync(file, 'utf8');

const topProdLogic = \
    const topProdAgg = await this.prisma.salesOrderItem.groupBy({
      by: ['product_id'],
      where: { sales_order: whereBase },
      _sum: { qty: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topProdAgg.map(async (p) => {
        if (!p.product_id) return null;
        const prod = await this.prisma.product.findUnique({
          where: { id: p.product_id },
        });
        return {
          name: prod?.name || 'Unknown',
          qty: p._sum.qty || 0,
          revenue: p._sum.subtotal || 0,
        };
      })
    ).then((res) => res.filter((x) => x !== null));

    // Chart Data (Last 7 days)
\;

content = content.replace('    // Chart Data (Last 7 days)', topProdLogic);

// Ensure topCustomers returns 'spent' instead of 'revenue' because frontend uses item.spent
content = content.replace('revenue: tc._sum.total_amount || 0,', 'spent: tc._sum.total_amount || 0,');

fs.writeFileSync(file, content);

