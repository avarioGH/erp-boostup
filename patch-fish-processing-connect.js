const fs = require('fs');
let c = fs.readFileSync('backend/src/inventory/fish-processing/fish-processing.service.ts', 'utf8');

c = c.replace(
`      const transformation = await tx.stockTransformation.create({
        data: {
          company_id,
          transform_no: transformNo,
          date: new Date(date || new Date()),
          notes,
          created_by,
          status: 'COMPLETED'
        }
      });`,
`      const transformation = await tx.stockTransformation.create({
        data: {
          company: { connect: { id: company_id } },
          transform_no: transformNo,
          date: new Date(date || new Date()),
          notes,
          user: { connect: { id: created_by } },
          status: 'COMPLETED'
        }
      });`
);

c = c.replace(
`            stock = await tx.warehouseStock.create({
              data: {
                company_id,
                warehouse_id: output.warehouse_id,
                product_id: output.product_id,
                current_stock: output.qty,
                available_stock: output.qty
              }
            });`,
`            stock = await tx.warehouseStock.create({
              data: {
                company: { connect: { id: company_id } },
                warehouse: { connect: { id: output.warehouse_id } },
                product: { connect: { id: output.product_id } },
                current_stock: output.qty,
                available_stock: output.qty
              }
            });`
);

c = c.replace(
`          await tx.stockMovement.create({
            data: {
              company_id,
              warehouse_id: input.warehouse_id,
              product_id: input.product_id,
              transaction_type: 'OUT',
              transaction_id: transformation.id,
              movement_type: 'TRANSFORMATION_OUT', // We can use ADJUSTMENT_MINUS if not using enums strictly, or add new enum
              qty: input.qty,
              total_cost: input.total_cost || 0,
              date: new Date(date || new Date())
            }
          });`,
`          await tx.stockMovement.create({
            data: {
              company: { connect: { id: company_id } },
              warehouse: { connect: { id: input.warehouse_id } },
              product: { connect: { id: input.product_id } },
              transaction_type: 'OUT',
              transaction_id: transformation.id,
              movement_type: 'TRANSFORMATION_OUT',
              qty: input.qty,
              total_cost: input.total_cost || 0,
              date: new Date(date || new Date())
            }
          });`
);

c = c.replace(
`          await tx.stockMovement.create({
            data: {
              company_id,
              warehouse_id: output.warehouse_id,
              product_id: output.product_id,
              transaction_type: 'IN',
              transaction_id: transformation.id,
              movement_type: 'TRANSFORMATION_IN',
              qty: output.qty,
              total_cost: outputTotalCost,
              date: new Date(date || new Date())
            }
          });`,
`          await tx.stockMovement.create({
            data: {
              company: { connect: { id: company_id } },
              warehouse: { connect: { id: output.warehouse_id } },
              product: { connect: { id: output.product_id } },
              transaction_type: 'IN',
              transaction_id: transformation.id,
              movement_type: 'TRANSFORMATION_IN',
              qty: output.qty,
              total_cost: outputTotalCost,
              date: new Date(date || new Date())
            }
          });`
);


fs.writeFileSync('backend/src/inventory/fish-processing/fish-processing.service.ts', c);
