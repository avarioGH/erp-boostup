import re

with open('src/ecommerce/ecommerce-checkout.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { TripayService } from '../../integrations/tripay/tripay.service';",
    "import { TripayService } from '../../integrations/tripay/tripay.service';\nimport { InventoryService } from '../inventory/inventory.service';"
)

c = c.replace(
    "constructor(private prisma: PrismaService, private tripay: TripayService) {}",
    "constructor(private prisma: PrismaService, private tripay: TripayService, private inventoryService: InventoryService) {}"
)

old_logic = """        for (const item of cart.items) {
          const stocks = await tx.warehouseStock.findMany({
            where: { company_id: companyId, product_id: item.product_id, available_stock: { gte: item.quantity } },
            orderBy: { available_stock: 'desc' }
          });

          if (stocks.length === 0) {
            throw new BadRequestException('Insufficient stock for ' + item.product_name);
          }

          const targetStock = stocks[0];
          
          const updateRes = await tx.warehouseStock.updateMany({
            where: { 
              id: targetStock.id, 
              available_stock: { gte: item.quantity } 
            },
            data: {
              available_stock: { decrement: item.quantity },
              reserved_stock: { increment: item.quantity }
            }
          });

          if (updateRes.count === 0) {
            throw new BadRequestException('Insufficient stock for ' + item.product_name + ' due to concurrent checkout');
          }
        }"""

new_logic = """        for (const item of cart.items) {
          try {
            await this.inventoryService.reserveStock(tx as any, {
              companyId,
              productId: item.product_id,
              quantity: item.quantity
            });
          } catch (e: any) {
             if (e.message.includes('Concurrency conflict')) {
                throw new BadRequestException('Insufficient stock for ' + item.product_name + ' due to concurrent checkout');
             }
             throw new BadRequestException('Insufficient stock for ' + item.product_name);
          }
        }"""

c = c.replace(old_logic, new_logic)

with open('src/ecommerce/ecommerce-checkout.service.ts', 'w') as f:
    f.write(c)
