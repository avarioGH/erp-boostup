const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runUAT() {
  console.log("=== PHASE 14 UAT START ===");
  try {
    // 1. Setup Data
    console.log("[1] Setting up master data...");
    
    // Find or create customer
    let customer = await prisma.customer.findFirst();
    if (!customer) {
      // Need a company first
      let company = await prisma.company.findFirst();
      if (!company) {
         company = await prisma.company.create({ data: { code: 'UAT-COMP', name: 'UAT Company' } });
      }
      customer = await prisma.customer.create({
        data: {
          code: 'CUST-UAT',
          name: 'UAT Customer',
          company_id: company.id
        }
      });
    }

    // Find a TimberVariant
    let variant = await prisma.timberVariant.findFirst();
    if (!variant) {
       console.log("No TimberVariant found. Ensure basic master data exists. Aborting.");
       return;
    }

    // Find a Warehouse
    let warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
       console.log("No Warehouse found. Aborting.");
       return;
    }

    // Inject stock via raw ledger access just for UAT
    console.log("[2] Injecting dummy stock for UAT via direct stock update...");
    await prisma.timberStock.upsert({
      where: {
        locationId_timberVariantId: {
          locationId: warehouse.id,
          timberVariantId: variant.id
        }
      },
      update: {
        currentPcs: { increment: 100 },
        currentVolumeM3: { increment: 10.0 }
      },
      create: {
        locationId: warehouse.id,
        timberVariantId: variant.id,
        currentPcs: 100,
        currentVolumeM3: 10.0
      }
    });

    let stockBefore = await prisma.timberStock.findUnique({
      where: { locationId_timberVariantId: { locationId: warehouse.id, timberVariantId: variant.id } }
    });
    console.log(`Stock before order: ${stockBefore.currentPcs} PCS`);

    // 2. Create Order
    console.log("[3] Creating TimberSalesOrder...");
    const order = await prisma.timberSalesOrder.create({
      data: {
        orderNumber: `SO-UAT-${Date.now()}`,
        customerId: customer.id,
        orderDate: new Date(),
        status: 'CONFIRMED',
        items: {
          create: [{
            timberVariantId: variant.id,
            thicknessMm: variant.thickness,
            widthMm: variant.width,
            lengthMm: variant.length,
            orderQty: 50,
            orderM3: 5.0
          }]
        }
      },
      include: { items: true }
    });
    console.log(`Order created: ${order.orderNumber}`);

    // 3. Create Delivery
    console.log("[4] Creating Delivery Note...");
    const delivery = await prisma.timberDeliveryNote.create({
      data: {
        deliveryNumber: `DO-UAT-${Date.now()}`,
        salesOrderId: order.id,
        deliveryDate: new Date(),
        status: 'DRAFT',
        items: {
          create: [{
            salesOrderItemId: order.items[0].id,
            locationId: warehouse.id,
            timberVariantId: variant.id,
            deliveredQty: 20,
            deliveredM3: 2.0
          }]
        }
      },
      include: { items: true }
    });
    console.log(`Delivery created: ${delivery.deliveryNumber}`);

    // 4. Simulate Delivery Post (Ledger Interaction)
    console.log("[5] Simulating Post Delivery (Inventory Integration)...");
    
    await prisma.$transaction(async (tx) => {
      for (const item of delivery.items) {
        // Find stock
        let stock = await tx.timberStock.findUnique({
          where: { locationId_timberVariantId: { locationId: item.locationId, timberVariantId: item.timberVariantId } }
        });
        
        if (!stock || stock.currentPcs < item.deliveredQty) {
          throw new Error("Insufficient stock during UAT!");
        }

        // Create movement
        const movement = await tx.timberStockMovement.create({
          data: {
            timberStockId: stock.id,
            type: 'OUT',
            referenceType: 'SALES_DELIVERY',
            referenceId: delivery.id,
            quantityPcs: item.deliveredQty,
            volumeM3: item.deliveredM3
          }
        });

        // Update Stock
        await tx.timberStock.update({
          where: { id: stock.id },
          data: {
            stockOutPcs: { increment: item.deliveredQty },
            currentPcs: { decrement: item.deliveredQty },
            currentVolumeM3: { decrement: item.deliveredM3 }
          }
        });

        // Link movement
        await tx.timberDeliveryNoteItem.update({
          where: { id: item.id },
          data: { stockMovementId: movement.id }
        });

        // Update Realization
        await tx.timberSalesOrderItem.update({
          where: { id: item.salesOrderItemId },
          data: {
            realizedQty: { increment: item.deliveredQty },
            realizedM3: { increment: item.deliveredM3 }
          }
        });
      }

      await tx.timberDeliveryNote.update({
        where: { id: delivery.id },
        data: { status: 'POSTED' }
      });
    });

    // 5. Verification
    let stockAfter = await prisma.timberStock.findUnique({
      where: { locationId_timberVariantId: { locationId: warehouse.id, timberVariantId: variant.id } }
    });
    console.log(`Stock after delivery: ${stockAfter.currentPcs} PCS (Expected: ${stockBefore.currentPcs - 20})`);
    
    let orderItemAfter = await prisma.timberSalesOrderItem.findUnique({
      where: { id: order.items[0].id }
    });
    console.log(`Order Realization: ${orderItemAfter.realizedQty} / ${orderItemAfter.orderQty} PCS`);

    if (stockAfter.currentPcs === stockBefore.currentPcs - 20 && orderItemAfter.realizedQty === 20) {
      console.log("UAT WORKFLOW SUCCESS!");
    } else {
      console.error("UAT WORKFLOW FAILED: Balances incorrect.");
    }

  } catch (err) {
    console.error("UAT FAILED with exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runUAT();
