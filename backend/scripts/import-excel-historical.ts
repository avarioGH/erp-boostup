import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan Historical Migration (Phase 53 Approved Blueprint)...');

  let company = await prisma.company.findFirst({ where: { name: 'Boostup Kayu' }});
  if (!company) company = await prisma.company.findFirst();
  if (!company) { console.error('Company tidak ditemukan!'); return; }
  const company_id = company.id;

  let warehouse = await prisma.warehouse.findFirst({ where: { company_id } });
  if (!warehouse) warehouse = await prisma.warehouse.create({ data: { company_id, code: 'GDNG01', name: 'Gudang Utama' } });

  let supplier = await prisma.timberSource.findFirst({ where: { company_id } });
  if (!supplier) supplier = await prisma.timberSource.create({ data: { company_id, code: 'SUP01', name: 'Supplier Kalteng', type: 'SUPPLIER' } });

  let species = await prisma.timberSpecies.findFirst({ where: { company_id } });
  if (!species) species = await prisma.timberSpecies.create({ data: { company_id, code: 'MRT', name: 'Meranti' } });

  let grade = await prisma.timberGrade.findFirst({ where: { company_id } });
  if (!grade) grade = await prisma.timberGrade.create({ data: { company_id, code: 'A', name: 'Grade A' } });

  let category = await prisma.category.findFirst({ where: { company_id, name: 'Timber' } });
  if (!category) category = await prisma.category.create({ data: { company_id, name: 'Timber' } });

  let unit = await prisma.unit.findFirst({ where: { company_id } });
  if (!unit) unit = await prisma.unit.create({ data: { company_id, name: 'Pieces' } });

  let product = await prisma.product.findFirst({ where: { company_id } });
  if (!product) product = await prisma.product.create({ data: { company_id, category_id: category.id, unit_id: unit.id, code: 'PRD-TIMBER', name: 'Sawn Timber', purchase_price: 0, selling_price: 0 } });

  let variant = await prisma.timberVariant.findFirst({ where: { company_id } });
  if (!variant) {
    variant = await prisma.timberVariant.create({
      data: {
        company_id,
        productId: product.id,
        speciesId: species.id,
        gradeId: grade.id,
        species: 'Meranti',
        grade: 'A',
        thickness: 2,
        width: 20,
        length: 400,
        volumePerPiece: (2 * 20 * 400) / 1000000000,
        sku: 'MRT-A-2-20-400'
      }
    });
  }

  console.log('Master data siap.');

  const purchase = await prisma.timberPurchase.create({
    data: {
      company_id,
      purchaseNumber: 'PO-HIST-001',
      sourceId: supplier.id,
      warehouseId: warehouse.id,
      status: 'CONFIRMED',
      totalPcs: 150,
      totalVolumeM3: 150 * variant.volumePerPiece,
      notes: 'Historical Import Phase 53',
      items: {
        create: [
          {
            timberVariantId: variant.id,
            quantityPcs: 150,
            volumeM3: 150 * variant.volumePerPiece,
            batch: 'UNKNOWN',
            notes: 'APM'
          }
        ]
      }
    }
  });
  console.log('Berhasil memasukkan dokumen Purchase:', purchase.purchaseNumber);

  await prisma.timberPurchaseLogItem.create({
    data: {
      timberPurchaseId: purchase.id,
      logNumber: 'LOG-HIST-001',
      species: 'Meranti',
      speciesId: species.id,
      purchaseLength: 400,
      purchaseDiameter1: 40,
      purchaseDiameter2: 42,
      purchaseDiameter3: 40,
      purchaseDiameter4: 42,
      purchaseVolume: 0.528,
      status: 'RECEIVED'
    }
  });

  let existingStock = await prisma.timberStock.findFirst({
    where: { locationId: warehouse.id, timberVariantId: variant.id, batch: 'UNKNOWN' }
  });

  if (!existingStock) {
    existingStock = await prisma.timberStock.create({
      data: {
        locationId: warehouse.id,
        timberVariantId: variant.id,
        batch: 'UNKNOWN',
        currentPcs: 150,
        currentVolumeM3: 150 * variant.volumePerPiece,
      }
    });
  } else {
    existingStock = await prisma.timberStock.update({
      where: { id: existingStock.id },
      data: {
        currentPcs: existingStock.currentPcs + 150,
        currentVolumeM3: existingStock.currentVolumeM3 + (150 * variant.volumePerPiece)
      }
    });
  }

  await prisma.timberStockMovement.create({
    data: {
      timberStockId: existingStock.id,
      batch: 'UNKNOWN',
      referenceType: 'TIMBER_PURCHASE',
      referenceId: purchase.id,
      type: 'IN',
      quantityPcs: 150,
      volumeM3: 150 * variant.volumePerPiece
    }
  });

  console.log('==============================================');
  console.log('MIGRATION SEED BERHASIL!');
  console.log('Silakan refresh UI aplikasi Anda sekarang.');
  console.log('==============================================');
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); });
