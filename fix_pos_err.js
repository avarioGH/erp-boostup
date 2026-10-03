const fs = require("fs");
let posContent = fs.readFileSync("backend/src/pos/pos.service.ts", "utf8");

posContent = posContent.replace("referenceId: salesOrder.id,", "referenceId: salesOrder.id,\n              allowNegative: true,");

fs.writeFileSync("backend/src/pos/pos.service.ts", posContent);

let invContent = fs.readFileSync("backend/src/inventory/inventory.service.ts", "utf8");

const oldLogic = `    const stock = await tx.warehouseStock.findUnique({
      where: { company_id_warehouse_id_product_id: { company_id: params.companyId, warehouse_id: params.warehouseId, product_id: params.productId } }
    });

    if (!stock) throw new BadRequestException('Stock not found for product ' + params.productId);

    const updateRes = await tx.warehouseStock.updateMany({
      where: { 
        id: stock.id,
        company_id: params.companyId,
        ...(params.allowNegative ? {} : { available_stock: { gte: params.quantity } })
      },
      data: {
        current_stock: { decrement: params.quantity },
        available_stock: { decrement: params.quantity }
      }
    });

    if (updateRes.count === 0) {
      throw new BadRequestException('Insufficient stock for product ' + params.productId);
    }`;

const newLogic = `    let stock = await tx.warehouseStock.findUnique({
      where: { company_id_warehouse_id_product_id: { company_id: params.companyId, warehouse_id: params.warehouseId, product_id: params.productId } }
    });

    if (!stock) {
      if (params.allowNegative) {
        stock = await tx.warehouseStock.create({
          data: {
            company_id: params.companyId,
            warehouse_id: params.warehouseId,
            product_id: params.productId,
            current_stock: 0,
            available_stock: 0,
            reserved_stock: 0
          }
        });
      } else {
        throw new BadRequestException('Stock not found for product ' + params.productId);
      }
    }

    const updateRes = await tx.warehouseStock.updateMany({
      where: { 
        id: stock.id,
        company_id: params.companyId,
        ...(params.allowNegative ? {} : { available_stock: { gte: params.quantity } })
      },
      data: {
        current_stock: { decrement: params.quantity },
        available_stock: { decrement: params.quantity }
      }
    });

    if (updateRes.count === 0) {
      throw new BadRequestException('Insufficient stock for product ' + params.productId);
    }`;

invContent = invContent.replace(oldLogic, newLogic);
fs.writeFileSync("backend/src/inventory/inventory.service.ts", invContent);

