const { Client } = require('ssh2');
const fs = require('fs');

const config = { host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 30000 };

const tsCode = `
import { PrismaService } from './src/prisma/prisma.service';
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
  const product = await prisma.product.findFirst({ where: { company_id: companyId } });

  // Get or Create Variant
  let variant = await prisma.timberVariant.findFirst({ where: { sku: 'UAT-4794-VAR' } });
  if (!variant) {
    variant = await prisma.timberVariant.create({
      data: {
        company_id: companyId,
        productId: product!.id,
        sku: 'UAT-4794-VAR',
        barcode: 'UAT-4794-VAR',
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

  // Inject initial stock directly via Ledger
  await prisma.$transaction(async (tx: any) => {
    await ledger.createMovement(tx, whMain!.id, variant!.id, 'IN', 'ADJUSTMENT_IN', 'UAT-4794-INIT', 100, 0.8, 'UAT-4794-BATCH');
  });

  // Create Sales Order
  const so = await prisma.timberSalesOrder.create({
    data: {
      orderNumber: 'SO-UAT-4794',
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
  const res = await prisma.timberStockReservation.create({
    data: {
      company_id: companyId,
      locationId: whMain!.id,
      timberVariantId: variant!.id,
      referenceType: 'SALES_ORDER',
      referenceId: so.id,
      reservedPcs: 100,
      reservedM3: 0.8
    }
  });

  console.log("== UAT INITIALIZED ==");
  
  const shipPayload = {
    shipmentNumber: 'SHIP-UAT-4794-RACE',
    shipmentDate: new Date(),
    warehouseId: whMain!.id,
    customerId: customer!.id,
    totalPcs: 30, totalVolumeM3: 0.24,
    items: [{
      timberVariantId: variant!.id,
      batch: 'UAT-4794-BATCH',
      quantityPcs: 30,
      volumeM3: 0.24,
      salesOrderItemId: soItem.id
    }],
    salesOrderId: so.id
  };
  const ship = await shipmentService.create(companyId, shipPayload);
  
  // CONCURRENT CONFIRM TEST
  console.log("Testing Concurrent Confirm...");
  const confirmPromises = [
    shipmentService.confirm(ship.id, companyId).catch((e:any) => e.message),
    shipmentService.confirm(ship.id, companyId).catch((e:any) => e.message),
    shipmentService.confirm(ship.id, companyId).catch((e:any) => e.message)
  ];
  
  const confirmResults = await Promise.all(confirmPromises);
  console.log("Confirm Results:");
  console.log(confirmResults);

  let stock = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-4794-BATCH' } });
  let reservation = await prisma.timberStockReservation.findUnique({ where: { id: res.id } });
  let soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });
  
  console.log("After Concurrent Confirm:");
  console.log("Stock PCS (Should be 70):", stock!.currentPcs);
  console.log("Reservation PCS (Should be 70):", reservation!.reservedPcs);
  console.log("SO Realized PCS (Should be 30):", soData!.realizedQty);

  const outMovements = await prisma.timberStockMovement.count({ where: { referenceId: ship.id, type: 'OUT' } });
  console.log("OUT Movements (Should be 1):", outMovements);

  // CONCURRENT CANCEL TEST
  console.log("\\nTesting Concurrent Cancel...");
  const cancelPromises = [
    shipmentService.cancel(ship.id, companyId).catch((e:any) => e.message),
    shipmentService.cancel(ship.id, companyId).catch((e:any) => e.message),
    shipmentService.cancel(ship.id, companyId).catch((e:any) => e.message)
  ];
  const cancelResults = await Promise.all(cancelPromises);
  console.log("Cancel Results:");
  console.log(cancelResults);

  stock = await prisma.timberStock.findFirst({ where: { timberVariantId: variant!.id, batch: 'UAT-4794-BATCH' } });
  reservation = await prisma.timberStockReservation.findUnique({ where: { id: res.id } });
  soData = await prisma.timberSalesOrderItem.findUnique({ where: { id: soItem.id } });

  console.log("After Concurrent Cancel:");
  console.log("Stock PCS (Should be 100):", stock!.currentPcs);
  console.log("Reservation PCS (Should be 100):", reservation!.reservedPcs);
  console.log("SO Realized PCS (Should be 0):", soData!.realizedQty);

  const inMovements = await prisma.timberStockMovement.count({ where: { referenceId: ship.id, type: 'IN' } });
  console.log("IN Movements (Should be 1):", inMovements);

  // CLEANUP
  console.log("\\n== RUNNING CLEANUP ==");
  
  await prisma.timberShipmentItem.deleteMany({ where: { shipment: { shipmentNumber: { startsWith: 'SHIP-UAT-4794' } } } });
  await prisma.timberShipment.deleteMany({ where: { shipmentNumber: { startsWith: 'SHIP-UAT-4794' } } });
  
  await prisma.timberSalesOrderItem.deleteMany({ where: { salesOrderId: so.id } });
  await prisma.timberSalesOrder.delete({ where: { id: so.id } });
  
  await prisma.timberStockReservation.delete({ where: { id: res.id } });

  await prisma.timberStockMovement.deleteMany({ where: { referenceId: { in: ['UAT-4794-INIT', ship.id] } } });
  await prisma.timberStock.deleteMany({ where: { timberVariantId: variant!.id, currentPcs: 0 } });
  try { await prisma.timberVariant.delete({ where: { id: variant!.id } }); } catch(e){}

  console.log("Cleanup finished.");
  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  // Use a string replace trick so we don't need backticks in bash directly, writing to file via node
  const runCmd = `
    cd /root/erp-boostup/backend || exit 1
    node -e "require('fs').writeFileSync('run-4794.ts', Buffer.from('${Buffer.from(tsCode).toString('base64')}', 'base64').toString('utf8'));"
    npx ts-node run-4794.ts
  `;

  conn.exec(runCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
