with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re

# We need to inject InventoryService into EcommerceCheckoutService
if "import { InventoryService }" not in c:
    c = "import { InventoryService } from '../inventory/inventory.service';\n" + c
    c = c.replace("private tripayService: TripayService", "private tripayService: TripayService,\n    private inventoryService: InventoryService")

# Now reorder the salesOrder creation BEFORE the loop, and replace the manual stock update with issueStock
# First, extract the SalesOrder block
so_match = re.search(r"const orderNumber = 'SO-EC-' \+ Date\.now\(\);.*?const salesOrder = await tx\.salesOrder\.create\(\{.*?\n\s+\}\);\n\n\s+if \(fail_at === 'SALES_ORDER'\) throw new Error\('Test Failure: SALES_ORDER'\);", c, re.DOTALL)
if so_match:
    so_code = so_match.group(0)
    c = c.replace(so_code, "")
    
    # insert so_code right before the loop
    loop_idx = c.find("for (const item of cart.items) {")
    if loop_idx != -1:
        c = c[:loop_idx] + so_code + "\n\n        " + c[loop_idx:]

# Replace the loop's WarehouseStock mutation with issueStock
manual_mutation = r"""const stocks = await tx\.warehouseStock\.findMany\(\{.*?\}\);\n\n\s*if \(stocks\.length === 0\) \{.*?throw new BadRequestException\('Insufficient stock.*?\n\s*\}\n\n\s*const targetStock = stocks\[0\];\n\s*const updateRes = await tx\.warehouseStock\.updateMany\(\{.*?\n\s*data: \{.*?available_stock: \{ decrement: item\.quantity \},.*?\}\n\s*\}\);\n\n\s*if \(updateRes\.count === 0\) \{.*?throw new BadRequestException\('Insufficient stock.*?due to concurrent checkout'\).*?\}"""

issue_stock_code = """const stocks = await tx.warehouseStock.findMany({
            where: { company_id: companyId, product_id: item.product_id, available_stock: { gte: item.quantity } },
            orderBy: { available_stock: 'desc' }
          });
          if (stocks.length === 0) throw new BadRequestException('Insufficient stock for ' + item.product_name);
          const targetStock = stocks[0];
          
          await this.inventoryService.issueStock(tx as any, {
             companyId,
             warehouseId: targetStock.warehouse_id,
             productId: item.product_id,
             quantity: item.quantity,
             referenceType: 'ECOMMERCE',
             referenceId: salesOrder.id,
             userId: 'SYSTEM'
          });"""

c = re.sub(manual_mutation, issue_stock_code, c, flags=re.DOTALL)

with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
