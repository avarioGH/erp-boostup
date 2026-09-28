const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const tsCode = `
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
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
  let variant = await prisma.timberVariant.findFirst({ where: { sku: 'UAT-4791-VAR' } });
  if (!variant) {
    variant = await prisma.timberVariant.create({
      data: {
        company_id: companyId,
        productId: product!.id,
        sku: 'UAT-4791-VAR',
        barcode: 'UAT-4791-VAR',
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
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'IN', 'ADJUSTMENT_IN', 'UAT-4791-INIT', 100, 0.8, 'UAT-BATCH-A');
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'IN', 'ADJUSTMENT_IN', 'UAT-4791-INIT2', 50, 0.4, 'UAT-BATCH-B');
  });

  // Create Sales Order
  const so = await prisma.timberSalesOrder.create({
    data: {
      orderNumber: 'SO-UAT-4791',
      customerId: customer!.id,
      orderDate: new Date(),
      status: 'CONFIRMED',
      items: {
        create: [{
          timberVariantId: variant!.id,
          thicknessMm: 20, widthMm: 100, lengthMm: 4000,
          fulfillmentLocationId: whMain!.id,
          orderQty: 100,
          orderM3: 0.8
        }]
      }
    },
    include: { items: true }
  });
  const soItem = so.items[0];

  // Create Reservation manually
  const res = await prisma.timberStockReservation.create({
    data: {
      company_id: companyId,
      locationId: whMain!.id,
      timberVariantId: variant!.id,
      reservedPcs: 100,
      reservedM3: 0.8
    }
  });

  console.log("== UAT INITIALIZED ==");
  
  // 1. Partial Fulfillment (Shipment A: 30 PCS from Batch A)
  const shipA = await shipmentService.create(companyId, {
    shipmentNumber: 'SHIP-UAT-A',
    shipmentDate: new Date(),
    warehouseId: whMain!.id,
    customerId: customer!.id,
    salesOrderId: so.id,
    totalPcs: 30, totalVolumeM3: 0.24,
    items: [{
      timberVariantId: variant!.id,
      batch: 'UAT-BATCH-A',
      quantityPcs: 30,
      volumeM3: 0.24,
      salesOrderItemId: soItem.id
    }]
  });
  
  await shipmentService.confirm(shipA.id, companyId);
  console.log("Shipment A Confirmed.");

  // Assert SO realizedQty
  let soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after A:", soData!.realizedQty); // Expected: 30

  // 2. Partial Fulfillment (Shipment B: 20 PCS from Batch B)
  const shipB = await shipmentService.create(companyId, {
    shipmentNumber: 'SHIP-UAT-B',
    shipmentDate: new Date(),
    warehouseId: whMain!.id,
    customerId: customer!.id,
    salesOrderId: so.id,
    totalPcs: 20, totalVolumeM3: 0.16,
    items: [{
      timberVariantId: variant!.id,
      batch: 'UAT-BATCH-B',
      quantityPcs: 20,
      volumeM3: 0.16,
      salesOrderItemId: soItem.id
    }]
  });

  await shipmentService.confirm(shipB.id, companyId);
  console.log("Shipment B Confirmed.");

  soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after B:", soData!.realizedQty); // Expected: 50

  // Check Reservation
  let resData = await prisma.timberStockReservation.findUnique({ where: { id: res.id } });
  console.log("Reservation after A and B:", resData!.reservedPcs); // Expected: 50

  // Check Stock
  let stockA = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-A' } });
  let stockB = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-B' } });
  console.log("Stock Batch A:", stockA!.currentPcs); // Expected: 70
  console.log("Stock Batch B:", stockB!.currentPcs); // Expected: 30

  // 3. Double Confirm
  try {
    await shipmentService.confirm(shipA.id, companyId);
    console.log("ERROR: Double confirm allowed!");
  } catch(e: any) {
    console.log("Double confirm blocked correctly:", e.message);
  }

  // 4. Cancel Shipment B
  await shipmentService.cancel(shipB.id, companyId);
  console.log("Shipment B Cancelled.");

  soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after Cancel B:", soData!.realizedQty); // Expected: 30

  resData = await prisma.timberStockReservation.findUnique({ where: { id: res.id } });
  console.log("Reservation after Cancel B:", resData!.reservedPcs); // Expected: 70

  stockB = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-BATCH-B' } });
  console.log("Stock Batch B after Cancel:", stockB!.currentPcs); // Expected: 50

  // 5. Double Cancel
  try {
    await shipmentService.cancel(shipB.id, companyId);
    console.log("ERROR: Double cancel allowed!");
  } catch(e: any) {
    console.log("Double cancel blocked correctly:", e.message);
  }

  // 6. Cancel Shipment A
  await shipmentService.cancel(shipA.id, companyId);
  console.log("Shipment A Cancelled.");

  soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  console.log("SO Realized Qty after Cancel A:", soData!.realizedQty); // Expected: 0

  // 7. Standalone Shipment
  const shipC = await shipmentService.create(companyId, {
    shipmentNumber: 'SHIP-UAT-C',
    shipmentDate: new Date(),
    warehouseId: whMain!.id,
    customerId: customer!.id,
    totalPcs: 10, totalVolumeM3: 0.08,
    items: [{
      timberVariantId: variant!.id,
      batch: 'UAT-BATCH-A',
      quantityPcs: 10,
      volumeM3: 0.08
    }]
  });
  await shipmentService.confirm(shipC.id, companyId);
  console.log("Standalone Shipment Confirmed.");
  await shipmentService.cancel(shipC.id, companyId);
  console.log("Standalone Shipment Cancelled.");

  // CLEANUP
  console.log("== RUNNING CLEANUP ==");
  
  await prisma.timberShipmentItem.deleteMany({ where: { timberShipment: { shipmentNumber: { startsWith: 'SHIP-UAT' } } } });
  await prisma.timberShipment.deleteMany({ where: { shipmentNumber: { startsWith: 'SHIP-UAT' } } });
  
  await prisma.timberSalesOrderItem.deleteMany({ where: { salesOrderId: so.id } });
  await prisma.timberSalesOrder.delete({ where: { id: so.id } });
  
  await prisma.timberStockReservation.delete({ where: { id: res.id } });

  // Reset stock
  await prisma.$transaction(async (tx: any) => {
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'OUT', 'ADJUSTMENT_OUT', 'UAT-4791-INIT', 100, 0.8, 'UAT-BATCH-A');
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'OUT', 'ADJUSTMENT_OUT', 'UAT-4791-INIT2', 50, 0.4, 'UAT-BATCH-B');
  });

  // Delete all UAT ledger rows (clean exact footprint)
  await prisma.timberStockMovement.deleteMany({ where: { referenceId: { in: ['UAT-4791-INIT', 'UAT-4791-INIT2', shipA.id, shipB.id, shipC.id] } } });
  // We can't safely delete stock row easily since variant might be reused, but let's delete stock if currentPcs = 0
  await prisma.timberStock.deleteMany({ where: { timberVariantId: variant!.id, currentPcs: 0 } });
  await prisma.timberVariant.delete({ where: { id: variant!.id } });

  console.log("Cleanup finished.");
  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > run-4791-4.ts
${tsCode}
EOF
    npx ts-node run-4791-4.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
