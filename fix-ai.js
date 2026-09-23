const fs = require('fs');
let content = fs.readFileSync('backend/src/ai/ai.service.ts', 'utf-8');

const newImpl = `
  private async getInventoryStatus(companyId: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: { company_id: companyId },
      include: { warehouse_stocks: true },
      take: limit || 10
    });
    
    const rawLogs = await this.prisma.rawLog.count({ where: { status: 'AVAILABLE' } });
    const trimmedLogs = await this.prisma.trimmedLog.count({ where: { status: 'AVAILABLE' } });
    const inputLogs = await this.prisma.inputLog.count({ where: { status: { in: ['AVAILABLE', 'IN_PROCESS'] } } });
    const timberStocks = await this.prisma.timberStock.findMany({ include: { timberVariant: true } });
    
    let currentStockM3 = 0;
    let currentStockPcs = 0;
    for (const stock of timberStocks) {
      currentStockPcs += stock.currentPcs;
      currentStockM3 += stock.currentVolumeM3;
    }

    return {
      finished_products: products.map(p => ({
        name: p.name,
        price: p.selling_price,
        stock: p.warehouse_stocks.reduce((sum, s) => sum + s.current_stock, 0)
      })),
      raw_logs_available: rawLogs,
      trimmed_logs_available: trimmedLogs,
      input_logs_in_production: inputLogs,
      sawn_timber_stock: {
        total_pcs: currentStockPcs,
        total_m3: currentStockM3,
        variants_count: timberStocks.length
      }
    };
  }
`;

content = content.replace(/private async getInventoryStatus\([^{]*\{[\s\S]*?return \{[\s\S]*?\};\s*\}/, newImpl.trim());
fs.writeFileSync('backend/src/ai/ai.service.ts', content);
console.log('Done replacing getInventoryStatus');
