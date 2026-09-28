const { Client } = require('ssh2');
const fs = require('fs');

const config = { host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 30000 };

const tsCode = `
import { PrismaClient } from '@prisma/client';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ShipmentService } from './src/inventory/shipment/shipment.service';
import { InventoryLedgerService } from './src/inventory/inventory-ledger.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const shipmentService = app.get(ShipmentService);
  const ledger = app.get(InventoryLedgerService);

  const email = 'kayu@boostup.id';
  const user = await prisma.user.findFirst({ where: { email } });
  const companyId = user!.company_id as string;

  const whMain = await prisma.warehouse.findFirst({ where: { company_id: companyId, code: 'WH-MAIN' } });
  const meranti = await prisma.timberSpecies.findFirst({ where: { company_id: companyId, code: 'MERANTI' } });
  const gradeA = await prisma.timberGrade.findFirst({ where: { company_id: companyId, code: 'A' } });
  let customer = await prisma.customer.findFirst({ where: { company_id: companyId } });
  if (!customer) customer = await prisma.customer.create({ data: { company_id: companyId, code: 'CUST-UAT', name: 'UAT Customer', email: 'cust@uat.com' } });
  const product = await prisma.product.findFirst({ where: { company_id: companyId } });

  // Get or Create Variant
  let variant = await prisma.timberVariant.findFirst({ where: { sku: 'UAT-4792-VAR' } });
  if (!variant) {
    variant = await prisma.timberVariant.create({
      data: {
        company_id: companyId,
        productId: product!.id,
        sku: 'UAT-4792-VAR',
        barcode: 'UAT-4792-VAR',
        speciesId: meranti!.id,
        gradeId: gradeA!.id,
        thickness: 20, width: 100, length: 4000,
        volumePerPiece: 0.008,
        grade: 'A',
        species: 'MERANTI',
        isActive: true
      }
    });
  }

  // Inject initial stock directly via Ledger to bypass production steps for UAT
  await prisma.$transaction(async (tx: any) => {
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'IN', 'ADJUSTMENT_IN', 'UAT-4792-INIT', 100, 0.8, 'UAT-BATCH-A');
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'IN', 'ADJUSTMENT_IN', 'UAT-4792-INIT2', 50, 0.4, 'UAT-BATCH-B');
  });

  // Create Sales Order
  const so = await prisma.timberSalesOrder.create({
    data: {
      orderNumber: 'SO-UAT-4792',
      customerId: customer!.id,
      orderDate: new Date(),
      status: 'CONFIRMED',
      company_id: companyId,
      items: {
        create: {
          timberVariantId: variant!.id,
          thicknessMm: 20, widthMm: 100, lengthMm: 4000, grade: 'A', species: 'MERANTI',
          orderQty: 100, orderM3: 0.8, realizedQty: 0, realizedM3: 0
        }
      }
    },
    include: { items: true }
  });
  const soItem = so.items[0];

  // Reservation for 100 PCS
  await prisma.timberStockReservation.create({
    data: {
      locationId: whMain!.id,
      timberVariantId: variant!.id,
      referenceType: 'SALES_ORDER',
      referenceId: so.id,
      quantityPcs: 100,
      volumeM3: 0.8,
      company_id: companyId
    }
  });

  console.log("== UAT INITIALIZED ==");
  
  // TEST G: Invalid Stock (Over-shipment)
  try {
    const shipFailPayload = {
      shipmentNumber: 'SHIP-UAT-FAIL',
      warehouseId: whMain!.id,
      customerId: customer!.id,
      items: [{ timberVariantId: variant!.id, batch: 'UAT-BATCH-A', quantityPcs: 150, volumeM3: 1.2, salesOrderItemId: soItem.id }],
      salesOrderId: so.id
    };
    const shipFail = await shipmentService.create(companyId, shipFailPayload);
    await shipmentService.confirm(shipFail.id, companyId);
    console.log("ERROR: Over-shipment should have failed!");
  } catch (err: any) {
    console.log("TEST G PASS: Invalid stock blocked correctly (" + err.message + ")");
  }

  // TEST B & C: Partial Fulfillment (Shipment A & B)
  const shipAPayload = {
    shipmentNumber: 'SHIP-UAT-4792-A',
    warehouseId: whMain!.id,
    customerId: customer!.id,
    items: [{ timberVariantId: variant!.id, batch: 'UAT-BATCH-A', quantityPcs: 30, volumeM3: 0.24, salesOrderItemId: soItem.id }],
    salesOrderId: so.id
  };
  const shipA = await shipmentService.create(companyId, shipAPayload);
  await shipmentService.confirm(shipA.id, companyId);
  console.log("Shipment A Confirmed.");

  const soAfterA = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after A:", soAfterA!.realizedQty);

  const shipBPayload = {
    shipmentNumber: 'SHIP-UAT-4792-B',
    warehouseId: whMain!.id,
    customerId: customer!.id,
    items: [{ timberVariantId: variant!.id, batch: 'UAT-BATCH-B', quantityPcs: 20, volumeM3: 0.16, salesOrderItemId: soItem.id }],
    salesOrderId: so.id
  };
  const shipB = await shipmentService.create(companyId, shipBPayload);
  await shipmentService.confirm(shipB.id, companyId);
  console.log("Shipment B Confirmed.");

  const soAfterB = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after B:", soAfterB!.realizedQty);

  const resv = await prisma.timberStockReservation.findFirst({ where: { referenceId: so.id } });
  console.log("Reservation after A and B:", resv!.quantityPcs);

  // TEST F: Batch isolation Check
  const stockA = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-A' } });
  const stockB = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-B' } });
  console.log("Stock Batch A:", stockA!.currentPcs); // Should be 70
  console.log("Stock Batch B:", stockB!.currentPcs); // Should be 30

  // Double Confirm Check
  try {
    await shipmentService.confirm(shipB.id, companyId);
    console.log("ERROR: Double confirm worked");
  } catch(e: any) {
    console.log("Double confirm blocked correctly:", e.message);
  }

  // TEST D: Cancel second shipment
  await shipmentService.cancel(shipB.id, companyId);
  console.log("Shipment B Cancelled.");
  
  const soAfterCancelB = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after Cancel B:", soAfterCancelB!.realizedQty);
  
  const resvAfterCancel = await prisma.timberStockReservation.findFirst({ where: { referenceId: so.id } });
  console.log("Reservation after Cancel B:", resvAfterCancel!.quantityPcs);

  const stockBAfter = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-B' } });
  console.log("Stock Batch B after Cancel:", stockBAfter!.currentPcs); // Should be 50

  // TEST E: Cancel first shipment
  await shipmentService.cancel(shipA.id, companyId);
  console.log("Shipment A Cancelled.");
  const soAfterCancelA = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after Cancel A:", soAfterCancelA!.realizedQty);

  // TEST A: Standalone Shipment
  const shipCPayload = {
    shipmentNumber: 'SHIP-UAT-4792-C',
    warehouseId: whMain!.id,
    customerId: customer!.id,
    items: [{ timberVariantId: variant!.id, batch: 'UAT-BATCH-A', quantityPcs: 10, volumeM3: 0.08 }]
  };
  const shipC = await shipmentService.create(companyId, shipCPayload);
  await shipmentService.confirm(shipC.id, companyId);
  console.log("Standalone Shipment Confirmed.");
  await shipmentService.cancel(shipC.id, companyId);
  console.log("Standalone Shipment Cancelled.");

  // CLEANUP 4792
  console.log("== RUNNING CLEANUP ==");
  await prisma.timberShipmentItem.deleteMany({ where: { shipment: { shipmentNumber: { startsWith: 'SHIP-UAT' } } } });
  await prisma.timberShipment.deleteMany({ where: { shipmentNumber: { startsWith: 'SHIP-UAT' } } });
  await prisma.timberStockReservation.deleteMany({ where: { referenceId: so.id } });
  await prisma.timberSalesOrderItem.deleteMany({ where: { salesOrderId: so.id } });
  await prisma.timberSalesOrder.delete({ where: { id: so.id } });

  // Delete injected ledger movements (reversals first, then INs)
  await prisma.timberStockMovement.deleteMany({ where: { referenceId: { in: ['UAT-4792-INIT', 'UAT-4792-INIT2', shipA.id, shipB.id, shipC.id] } } });
  await prisma.timberStock.deleteMany({ where: { timberVariantId: variant!.id, currentPcs: 0 } });
  
  try {
    await prisma.timberVariant.delete({ where: { id: variant!.id } });
  } catch (e) {
    // Ignored, variant might have leftover stock from UAT-4791 which was not 0
  }

  console.log("Cleanup finished.");
  await app.close();
}

main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > run-4792.ts
\${tsCode}
EOF
    npx ts-node run-4792.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
