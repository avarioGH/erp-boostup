import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async create(companyId: string, data: any) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    const { logItems = [] } = data;
    const {
      purchaseNumber,
      purchaseDate,
      sourceId,
      warehouseId,
      notes,
      items,
      partaiId,
    } = data;

    // Validate if purchaseNumber exists
    const existing = await this.prisma.timberPurchase.findUnique({
      where: { purchaseNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Purchase with number ${purchaseNumber} already exists`,
      );
    }

    let totalPcs = 0;
    let totalVolumeM3 = 0;

    for (const item of items || []) {
      totalPcs += Number(item.quantityPcs || 0);
      totalVolumeM3 += Number(item.volumeM3 || 0);
    }

    for (const li of logItems || []) {
      totalPcs += 1;
      totalVolumeM3 += Number(li.purchaseVolume || 0);
    }

    const isDirectlyReceived = data.status === 'RECEIVED' || data.isReceived === true;
    const initialStatus = isDirectlyReceived ? 'RECEIVED' : 'DRAFT';

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.timberPurchase.create({
        data: {
          company_id: targetCompanyId as string,
          partaiId: partaiId || null,
          purchaseNumber,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          sourceId,
          warehouseId,
          notes,
          status: initialStatus,
          totalPcs,
          totalVolumeM3,
          items: {
            create: (items || []).map((item: any) => ({
              timberVariantId: item.timberVariantId,
              quantityPcs: Number(item.quantityPcs || 0),
              volumeM3: Number(item.volumeM3 || 0),
              purchaseThickness: Number(item.purchaseThickness || 0),
              purchaseWidth: Number(item.purchaseWidth || 0),
              purchaseLength: Number(item.purchaseLength || 0),
              unitPrice: Number(item.unitPrice || 0),
              notes: item.notes,
              batch: item.batch || 'UNKNOWN',
            })),
          },
          logItems: {
            create: (logItems || []).map((li: any) => ({
              logNumber: li.logNumber,
              species: li.species,
              speciesId: li.speciesId,
              purchaseLength: Number(li.purchaseLength || 0),
              purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
              purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
              purchaseDiameter3: Number(li.purchaseDiameter3 || 0),
              purchaseDiameter4: Number(li.purchaseDiameter4 || 0),
              purchaseVolume: Number(li.purchaseVolume || 0),
              status: isDirectlyReceived ? 'RECEIVED' : 'PENDING',
            })),
          },
        },
        include: {
          items: true,
          logItems: true,
        },
      });

      // If directly received upon creation, immediately stock into warehouse
      if (isDirectlyReceived) {
        // Sawn timber stock mutation
        if (purchase.items && purchase.items.length > 0) {
          for (const item of purchase.items) {
            if (item.quantityPcs > 0 && item.volumeM3 > 0 && item.timberVariantId) {
              await this.inventoryLedgerService.createMovement(
                tx,
                purchase.warehouseId,
                item.timberVariantId,
                'IN',
                'TIMBER_PURCHASE',
                purchase.id,
                item.quantityPcs,
                item.volumeM3,
                item.batch || 'UNKNOWN',
              );
            }
          }
        }

        // Raw log conversion
        if (purchase.logItems && purchase.logItems.length > 0) {
          for (let i = 0; i < purchase.logItems.length; i++) {
            const item = purchase.logItems[i];
            const existingLog = await tx.rawLog.findFirst({
              where: {
                OR: [
                  { purchaseLogItemId: item.id },
                  ...(item.logNumber ? [{ partaiId: purchase.partaiId, logNumber: item.logNumber }] : []),
                ],
              },
            });
            if (!existingLog) {
              const d1 = Number(item.purchaseDiameter1 || 0);
              const d2 = Number(item.purchaseDiameter2 || 0);
              const d3 = Number(item.purchaseDiameter3 || 0);
              const d4 = Number(item.purchaseDiameter4 || 0);
              let diaSum = 0;
              let diaCount = 0;
              if (d1 > 0) { diaSum += d1; diaCount++; }
              if (d2 > 0) { diaSum += d2; diaCount++; }
              if (d3 > 0) { diaSum += d3; diaCount++; }
              if (d4 > 0) { diaSum += d4; diaCount++; }
              const avgDia = diaCount > 0 ? diaSum / diaCount : (d1 || d2 || 0);
              const rndDia = Math.floor(avgDia);
              const len = Number(item.purchaseLength || 0);
              const grossVol = item.purchaseVolume ? Number(item.purchaseVolume) : Number((((rndDia * rndDia * 0.7854) / 10000) * len).toFixed(4));

              let logNum = (item.logNumber && item.logNumber.trim() !== '')
                ? item.logNumber.trim()
                : `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}`;

              const uniqueBarcode = item.barcode || `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

              try {
                await tx.rawLog.create({
                  data: {
                    partaiId: purchase.partaiId,
                    purchaseLogItemId: item.id,
                    logNumber: logNum,
                    species: item.species || 'UNKNOWN',
                    speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                    originalLength: len,
                    diameter1: d1,
                    diameter2: d2,
                    diameter3: d3,
                    diameter4: d4,
                    averageDiameter: avgDia,
                    roundedDiameter: rndDia,
                    grossVolume: grossVol,
                    netVolume: grossVol,
                    barcode: uniqueBarcode,
                    status: 'AVAILABLE',
                  },
                });
              } catch (createErr: any) {
                await tx.rawLog.create({
                  data: {
                    partaiId: purchase.partaiId,
                    purchaseLogItemId: item.id,
                    logNumber: `${logNum}-${Date.now().toString().slice(-4)}`,
                    species: item.species || 'UNKNOWN',
                    speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                    originalLength: len,
                    diameter1: d1,
                    diameter2: d2,
                    diameter3: d3,
                    diameter4: d4,
                    averageDiameter: avgDia,
                    roundedDiameter: rndDia,
                    grossVolume: grossVol,
                    netVolume: grossVol,
                    barcode: `${uniqueBarcode}-${Math.floor(Math.random() * 10000)}`,
                    status: 'AVAILABLE',
                  },
                });
              }
            }
          }
        }
      }

      return purchase;
    });
  }

  async confirm(id: string, companyId: string) {
    return this.markAsReceived(id, companyId);
  }

  async markAsReceived(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      let targetCompanyId = companyId;
      if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
        const firstCompany = await this.prisma.company.findFirst();
        if (firstCompany) targetCompanyId = firstCompany.id;
      }

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const purchase = await tx.timberPurchase.findFirst({
        where: isObjectId
          ? { id, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) }
          : { purchaseNumber: id, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
        include: { items: true, logItems: true },
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status === 'RECEIVED' || purchase.status === 'CONFIRMED') {
        const rawLogsCount = await tx.rawLog.count({
          where: {
            purchaseLogItemId: { in: (purchase.logItems || []).map((li: any) => li.id) },
          },
        });
        if (rawLogsCount >= (purchase.logItems || []).length) {
          throw new BadRequestException('Pembelian ini sudah diterima dan masuk ke stok');
        }
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestException('Pembelian yang dibatalkan tidak dapat diterima');
      }

      // Update status to RECEIVED
      const received = await tx.timberPurchase.update({
        where: { id: purchase.id },
        data: { status: 'RECEIVED' },
      });

      // 1. Stock mutations for sawn timber
      if (purchase.items && purchase.items.length > 0) {
        for (const item of purchase.items) {
          if (item.quantityPcs > 0 && item.volumeM3 > 0 && item.timberVariantId) {
            await this.inventoryLedgerService.createMovement(
              tx,
              purchase.warehouseId,
              item.timberVariantId,
              'IN',
              'TIMBER_PURCHASE',
              purchase.id,
              item.quantityPcs,
              item.volumeM3,
              item.batch || 'UNKNOWN',
            );
          }
        }
      }

      // 2. Convert log items to RawLog
      if (purchase.logItems && purchase.logItems.length > 0) {
        for (let i = 0; i < purchase.logItems.length; i++) {
          const item = purchase.logItems[i];
          const existing = await tx.rawLog.findFirst({
            where: {
              OR: [
                { purchaseLogItemId: item.id },
                ...(item.logNumber ? [{ partaiId: purchase.partaiId, logNumber: item.logNumber }] : []),
              ],
            },
          });
          if (!existing) {
            const d1 = Number(item.purchaseDiameter1 || 0);
            const d2 = Number(item.purchaseDiameter2 || 0);
            const d3 = Number(item.purchaseDiameter3 || 0);
            const d4 = Number(item.purchaseDiameter4 || 0);
            let diaSum = 0;
            let diaCount = 0;
            if (d1 > 0) { diaSum += d1; diaCount++; }
            if (d2 > 0) { diaSum += d2; diaCount++; }
            if (d3 > 0) { diaSum += d3; diaCount++; }
            if (d4 > 0) { diaSum += d4; diaCount++; }
            const avgDia = diaCount > 0 ? diaSum / diaCount : (d1 || d2 || 0);
            const rndDia = Math.floor(avgDia);
            const len = Number(item.purchaseLength || 0);
            const grossVol = item.purchaseVolume ? Number(item.purchaseVolume) : Number((((rndDia * rndDia * 0.7854) / 10000) * len).toFixed(4));

            let logNum = (item.logNumber && item.logNumber.trim() !== '')
              ? item.logNumber.trim()
              : `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}`;

            const uniqueBarcode = item.barcode || `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            try {
              await tx.rawLog.create({
                data: {
                  partaiId: purchase.partaiId,
                  purchaseLogItemId: item.id,
                  logNumber: logNum,
                  species: item.species || 'UNKNOWN',
                  speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  grossVolume: grossVol,
                  netVolume: grossVol,
                  barcode: uniqueBarcode,
                  status: 'AVAILABLE',
                },
              });
            } catch (createErr: any) {
              await tx.rawLog.create({
                data: {
                  partaiId: purchase.partaiId,
                  purchaseLogItemId: item.id,
                  logNumber: `${logNum}-${Date.now().toString().slice(-4)}`,
                  species: item.species || 'UNKNOWN',
                  speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  grossVolume: grossVol,
                  netVolume: grossVol,
                  barcode: `${uniqueBarcode}-${Math.floor(Math.random() * 10000)}`,
                  status: 'AVAILABLE',
                },
              });
            }
          }
          await tx.timberPurchaseLogItem.update({
            where: { id: item.id },
            data: { status: 'RECEIVED' },
          });
        }
      }

      return received;
    });
  }

  async cancel(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      let targetCompanyId = companyId;
      if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
        const firstCompany = await this.prisma.company.findFirst();
        if (firstCompany) targetCompanyId = firstCompany.id;
      }

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const purchase = await tx.timberPurchase.findFirst({
        where: isObjectId
          ? { id, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) }
          : { purchaseNumber: id, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
        include: { items: true, logItems: true },
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestException('Pembelian ini sudah dibatalkan sebelumnya');
      }

      const wasStocked = purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED';

      // Update status
      const cancelled = await tx.timberPurchase.update({
        where: { id: purchase.id },
        data: { status: 'CANCELLED' },
      });

      // Reversal for sawn timber stock
      if (wasStocked && purchase.items && purchase.items.length > 0) {
        for (const item of purchase.items) {
          const stock = await tx.timberStock.findUnique({
            where: {
              locationId_timberVariantId_batch: {
                locationId: purchase.warehouseId,
                timberVariantId: item.timberVariantId,
                batch: item.batch || 'UNKNOWN',
              },
            },
          });

          if (!stock || stock.currentPcs < item.quantityPcs) {
            throw new BadRequestException(
              `Stok tidak mencukupi untuk membatalkan pembelian varian ${item.timberVariantId}. Stok saat ini: ${stock?.currentPcs || 0}, dibutuhkan: ${item.quantityPcs}`,
            );
          }

          await this.inventoryLedgerService.createMovement(
            tx,
            purchase.warehouseId,
            item.timberVariantId,
            'OUT',
            'TIMBER_PURCHASE_REVERSAL',
            purchase.id,
            item.quantityPcs,
            item.volumeM3,
            item.batch || 'UNKNOWN',
          );
        }
      }

      // Reversal for raw logs
      if (wasStocked && purchase.logItems && purchase.logItems.length > 0) {
        for (const item of purchase.logItems) {
          await tx.rawLog.deleteMany({
            where: { purchaseLogItemId: item.id, status: 'AVAILABLE' },
          });
          await tx.timberPurchaseLogItem.update({
            where: { id: item.id },
            data: { status: 'CANCELLED' },
          });
        }
      }

      return cancelled;
    });
  }

  async findAll(companyId?: string) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    return this.prisma.timberPurchase.findMany({
      where: {
        ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
      },
      include: {
        source: true,
        warehouse: true,
        items: { include: { timberVariant: true } },
        logItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId?: string) {
    if (id === 'undefined' || !id)
      throw new NotFoundException('Purchase not found');

    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const purchase = await this.prisma.timberPurchase.findFirst({
      where: isObjectId
        ? { id }
        : {
            OR: [
              { id },
              { purchaseNumber: id },
            ],
          },
      include: {
        source: true,
        warehouse: true,
        items: { include: { timberVariant: true } },
        logItems: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException('Timber purchase not found');
    }

    return purchase;
  }

  // ==========================================
  // PHASE 26.1: PURCHASE LOG ITEMS
  // ==========================================
  async addLogItem(purchaseId: string, companyId: string, data: any) {
    const purchase = await this.prisma.timberPurchase.findFirst({
      where: { id: purchaseId, company_id: companyId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    return this.prisma.timberPurchaseLogItem.create({
      data: {
        timberPurchaseId: purchaseId,
        logNumber: data.logNumber,
        species: data.species,
        speciesId: data.speciesId,
        purchaseLength: data.purchaseLength || 0,
        purchaseDiameter1: data.purchaseDiameter1 || 0,
        purchaseDiameter2: data.purchaseDiameter2 || 0,
        purchaseDiameter3: data.purchaseDiameter3 || 0,
        purchaseDiameter4: data.purchaseDiameter4 || 0,
        purchaseVolume: data.purchaseVolume,
      },
    });
  }

  async updateLogItem(
    purchaseId: string,
    itemId: string,
    companyId: string,
    data: any,
  ) {
    const item = await this.prisma.timberPurchaseLogItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.timberPurchaseId !== purchaseId)
      throw new NotFoundException('Log Item not found');
    if (item.status === 'RECEIVED')
      throw new BadRequestException('Cannot edit received log item');

    return this.prisma.timberPurchaseLogItem.update({
      where: { id: itemId },
      data: {
        logNumber: data.logNumber,
        species: data.species,
        speciesId: data.speciesId,
        purchaseLength: data.purchaseLength || 0,
        purchaseDiameter1: data.purchaseDiameter1 || 0,
        purchaseDiameter2: data.purchaseDiameter2 || 0,
        purchaseDiameter3: data.purchaseDiameter3 || 0,
        purchaseDiameter4: data.purchaseDiameter4 || 0,
        purchaseVolume: data.purchaseVolume,
      },
    });
  }

  async updatePurchase(id: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const purchase = await tx.timberPurchase.findFirst({
        where: isObjectId ? { id } : { purchaseNumber: id },
        include: { items: true, logItems: true },
      });
      if (!purchase) throw new NotFoundException('Purchase not found');
      if (purchase.status !== 'DRAFT') {
        throw new BadRequestException('Hanya pembelian berstatus DRAFT yang dapat diedit');
      }
      const actualId = purchase.id;
      const targetWarehouseId = data.warehouseId || purchase.warehouseId;
      const willBeReceived = data.status === 'RECEIVED';

      // 1. Update main purchase header
      await tx.timberPurchase.update({
        where: { id: actualId },
        data: {
          purchaseNumber: data.purchaseNumber || purchase.purchaseNumber,
          warehouseId: targetWarehouseId,
          sourceId: data.sourceId || purchase.sourceId,
          notes: data.notes !== undefined ? data.notes : purchase.notes,
          status: willBeReceived ? 'RECEIVED' : 'DRAFT',
          purchaseDate: data.purchaseDate
            ? new Date(data.purchaseDate)
            : purchase.purchaseDate,
        },
      });

      // 2. Recreate sawn timber items if provided
      let finalItems: any[] = [];
      if (data.items && Array.isArray(data.items)) {
        await tx.timberPurchaseItem.deleteMany({
          where: { timberPurchaseId: actualId },
        });

        let totalPcs = 0;
        let totalVolume = 0;

        for (const item of data.items) {
          const variantId = item.timberVariantId || item.variantId;
          if (!variantId) continue;

          const pcs = Number(item.quantityPcs || 0);
          const vol = Number(item.volumeM3 || 0);
          totalPcs += pcs;
          totalVolume += vol;

          const createdItem = await tx.timberPurchaseItem.create({
            data: {
              timberPurchaseId: actualId,
              timberVariantId: variantId,
              quantityPcs: pcs,
              volumeM3: vol,
              purchaseThickness: Number(item.purchaseThickness || 0),
              purchaseWidth: Number(item.purchaseWidth || 0),
              purchaseLength: Number(item.purchaseLength || 0),
              unitPrice: Number(item.unitPrice || 0),
              batch: item.batch || 'UNKNOWN',
              notes: item.notes,
            },
          });
          finalItems.push(createdItem);
        }

        await tx.timberPurchase.update({
          where: { id: actualId },
          data: { totalPcs, totalVolumeM3: totalVolume },
        });
      }

      // 3. Recreate log items if provided
      let createdLogItems: any[] = [];
      if (data.logItems && Array.isArray(data.logItems)) {
        await tx.timberPurchaseLogItem.deleteMany({
          where: { timberPurchaseId: actualId },
        });

        let logPcs = 0;
        let logVolume = 0;

        for (const item of data.logItems) {
          if (!item.logNumber) continue;
          logPcs += 1;
          logVolume += Number(item.purchaseVolume || 0);

          const li = await tx.timberPurchaseLogItem.create({
            data: {
              timberPurchaseId: actualId,
              logNumber: item.logNumber,
              species: item.species || 'UNKNOWN',
              speciesId: item.speciesId,
              purchaseLength: Number(item.purchaseLength || 0),
              purchaseDiameter1: Number(item.purchaseDiameter1 || 0),
              purchaseDiameter2: Number(item.purchaseDiameter2 || 0),
              purchaseDiameter3: Number(item.purchaseDiameter3 || 0),
              purchaseDiameter4: Number(item.purchaseDiameter4 || 0),
              purchaseVolume: Number(item.purchaseVolume || 0),
              status: willBeReceived ? 'RECEIVED' : 'PENDING',
            },
          });
          createdLogItems.push(li);
        }

        if (!data.items || data.items.length === 0) {
          await tx.timberPurchase.update({
            where: { id: actualId },
            data: { totalPcs: logPcs, totalVolumeM3: logVolume },
          });
        }
      }

      // 4. If status changed to RECEIVED, execute stock mutations and log conversions
      if (willBeReceived) {
        for (const item of finalItems) {
          if (item.quantityPcs > 0 && item.volumeM3 > 0 && item.timberVariantId) {
            await this.inventoryLedgerService.createMovement(
              tx,
              targetWarehouseId,
              item.timberVariantId,
              'IN',
              'TIMBER_PURCHASE',
              actualId,
              item.quantityPcs,
              item.volumeM3,
              item.batch || 'UNKNOWN',
            );
          }
        }

        // Convert log items to RawLog if not yet converted
        const targetPartaiId = purchase.partaiId || data.partaiId;
        if (targetPartaiId && createdLogItems.length > 0) {
          for (let i = 0; i < createdLogItems.length; i++) {
            const item = createdLogItems[i];
            const d1 = Number(item.purchaseDiameter1 || 0);
            const d2 = Number(item.purchaseDiameter2 || 0);
            const d3 = Number(item.purchaseDiameter3 || 0);
            const d4 = Number(item.purchaseDiameter4 || 0);
            let diaSum = 0;
            let diaCount = 0;
            if (d1 > 0) { diaSum += d1; diaCount++; }
            if (d2 > 0) { diaSum += d2; diaCount++; }
            if (d3 > 0) { diaSum += d3; diaCount++; }
            if (d4 > 0) { diaSum += d4; diaCount++; }
            const avgDia = diaCount > 0 ? diaSum / diaCount : (d1 || d2 || 0);
            const rndDia = Math.floor(avgDia);
            const len = Number(item.purchaseLength || 0);
            const grossVol = item.purchaseVolume ? Number(item.purchaseVolume) : Number((((rndDia * rndDia * 0.7854) / 10000) * len).toFixed(4));
            const logNum = item.logNumber || `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}`;
            const uniqueBarcode = `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            try {
              await tx.rawLog.create({
                data: {
                  partaiId: targetPartaiId,
                  purchaseLogItemId: item.id,
                  logNumber: logNum,
                  species: item.species || 'UNKNOWN',
                  speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  grossVolume: grossVol,
                  netVolume: grossVol,
                  barcode: uniqueBarcode,
                  status: 'AVAILABLE',
                },
              });
            } catch (err) {
              await tx.rawLog.create({
                data: {
                  partaiId: targetPartaiId,
                  purchaseLogItemId: item.id,
                  logNumber: `${logNum}-${Date.now().toString().slice(-4)}`,
                  species: item.species || 'UNKNOWN',
                  speciesId: item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null,
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  grossVolume: grossVol,
                  netVolume: grossVol,
                  barcode: `${uniqueBarcode}-${Math.floor(Math.random() * 10000)}`,
                  status: 'AVAILABLE',
                },
              });
            }
          }
        }
      }

      return tx.timberPurchase.findUnique({
        where: { id: actualId },
        include: { items: true, logItems: true, source: true, warehouse: true },
      });
    });
  }

  async deletePurchase(id: string) {
    const purchase = await this.prisma.timberPurchase.findUnique({
      where: { id },
      include: {
        items: true,
        logItems: true,
      },
    });
    if (!purchase) throw new Error('Purchase not found');

    // Check if any RawLog has been processed (status != AVAILABLE)
    const logItemIds = purchase.logItems.map((li) => li.id);
    if (logItemIds.length > 0) {
      const rawLogs = await this.prisma.rawLog.findMany({
        where: { purchaseLogItemId: { in: logItemIds } },
      });
      for (const rawLog of rawLogs) {
        if (rawLog.status !== 'AVAILABLE') {
          throw new Error(
            'Cannot delete purchase because some logs have already been processed (Trimming/Input).',
          );
        }
      }

      // Delete RawLogs
      await this.prisma.rawLog.deleteMany({
        where: { purchaseLogItemId: { in: logItemIds } },
      });
    }

    // Delete Log Items
    await this.prisma.timberPurchaseLogItem.deleteMany({
      where: { timberPurchaseId: id },
    });

    // Delete Items
    await this.prisma.timberPurchaseItem.deleteMany({
      where: { timberPurchaseId: id },
    });

    // Delete Purchase
    return this.prisma.timberPurchase.delete({ where: { id } });
  }
}
