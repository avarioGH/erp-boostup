import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan Historical Migration (Phase 53 Approved Blueprint)...');

  // 1. Dapatkan Company Utama
  let company = await prisma.company.findFirst({ where: { name: 'Boostup Kayu' }});
  if (!company) {
    company = await prisma.company.findFirst();
  }
  if (!company) {
    console.error('Company tidak ditemukan!');
    return;
  }
  const company_id = company.id;

  // 2. Siapkan Master Data Dasar
  let warehouse = await prisma.warehouse.findFirst({ where: { company_id } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { company_id, code: 'GDNG01', name: 'Gudang Utama' }
    });
  }

  let supplier = await prisma.timberSource.findFirst({ where: { company_id } });
  if (!supplier) {
    supplier = await prisma.timberSource.create({
      data: { company_id, code: 'SUP01', name: 'Supplier Kalteng', type: 'SUPPLIER' }
    });
  }

  let species = await prisma.timberSpecies.findFirst({ where: { company_id } });
  if (!species) {
    species = await prisma.timberSpecies.create({
      data: { company_id, code: 'MRT', name: 'Meranti' }
    });
  }

  let grade = await prisma.timberGrade.findFirst({ where: { company_id } });
  if (!grade) {
    grade = await prisma.timberGrade.create({
      data: { company_id, code: 'A', name: 'Grade A' }
    });
  }

  // Cari atau buat variant
  let variant = await prisma.timberVariant.findFirst({ where: { company_id } });
  if (!variant) {
    variant = await prisma.timberVariant.create({
      data: {
        company_id,
        speciesId: species.id,
        gradeId: grade.id,
        thickness: 2,
        width: 20,
        length: 400,
        volumePerPiece: (2 * 20 * 400) / 1000000000,
        name: 'Meranti Grade A 2x20x400'
      }
    });
  }

  console.log('? Master data siap.');

  // 3. Masukkan Data Beli Masak (Purchase)
  console.log('Menginjeksi Data Purchase Historis...');
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
            unitPrice: 1000000,
            batch: 'UNKNOWN',
            notes: 'APM'
          }
        ]
      }
    },
    include: { items: true }
  });
  console.log(? Berhasil memasukkan dokumen Purchase: );

  // 4. Masukkan Log Purchase
  console.log('Menginjeksi Data Log Purchase...');
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
      purchaseVolume: 0.528, // Contoh hitungan M3
      status: 'RECEIVED'
    }
  });

  console.log('Membangun Stock Movement untuk Sawn Timber Purchase...');
  // Karena script ini bypass service, kita perlu manual stock movement agar tidak kosong
  const existingStock = await prisma.timberStock.findFirst({
    where: { company_id, warehouseId: warehouse.id, timberVariantId: variant.id, batch: 'UNKNOWN' }
  });

  if (!existingStock) {
    await prisma.timberStock.create({
      data: {
        company_id,
        warehouseId: warehouse.id,
        timberVariantId: variant.id,
        batch: 'UNKNOWN',
        currentPcs: 150,
        currentM3: 150 * variant.volumePerPiece,
      }
    });
  } else {
    await prisma.timberStock.update({
      where: { id: existingStock.id },
      data: {
        currentPcs: existingStock.currentPcs + 150,
        currentM3: existingStock.currentM3 + (150 * variant.volumePerPiece)
      }
    });
  }

  await prisma.timberStockMovement.create({
    data: {
      company_id,
      warehouseId: warehouse.id,
      timberVariantId: variant.id,
      batch: 'UNKNOWN',
      referenceType: 'TIMBER_PURCHASE',
      referenceId: purchase.id,
      movementType: 'IN',
      quantityPcs: 150,
      volumeM3: 150 * variant.volumePerPiece,
      notes: 'Historical Phase 53 Import'
    }
  });

  console.log('==============================================');
  console.log('MIGRATION SEED BERHASIL!');
  console.log('Silakan refresh UI aplikasi Anda sekarang.');
  console.log('==============================================');
}

main()
  .catch(e => {
    console.error('Gagal migrasi:', e);
  })
  .finally(async () => {
    await prisma.();
  });
