const fs = require('fs');
const file = 'backend/src/inventory/inventory.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const routes = `

  @Post('transfer/:id/validate')
  async validateTransfer(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.validateTransfer(req.user.company_id, id, req.user.id);
  }

  @Post('adjustment/:id/validate')
  async validateAdjustment(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.validateAdjustment(req.user.company_id, id, req.user.id);
  }

  @Post('stock-opname')
  async createStockOpname(@Request() req: any, @Body() data: { warehouseId: string, productIds?: string[] }) {
    return this.inventoryService.createStockOpname(req.user.company_id, data.warehouseId, req.user.id, data.productIds);
  }

  @Post('stock-opname/:id/approve')
  async approveStockOpname(@Request() req: any, @Param('id') id: string, @Body() data: { counts: { productId: string, countedQty: number }[] }) {
    return this.inventoryService.approveStockOpname(req.user.company_id, id, req.user.id, data.counts);
  }

  @Get('movements')
  async getMovements(@Request() req: any) {
    return this.inventoryService['prisma'].stockMovement.findMany({
      where: { company_id: req.user.company_id },
      include: { product: true, warehouse: true },
      orderBy: { created_at: 'desc' }
    });
  }
}
`;

const lastBrace = code.lastIndexOf('}');
if (lastBrace > -1) {
    code = code.substring(0, lastBrace) + routes;
    fs.writeFileSync(file, code);
}
