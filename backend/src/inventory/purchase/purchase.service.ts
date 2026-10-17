import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

async function runWithTransactionRetry<T>(
  prisma: PrismaService,
  fn: (tx: any) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: 10000,
        timeout: 20000,
      });
    } catch (err: any) {
      attempt++;
      const isWriteConflict =
        err?.code === 'P2034' ||
        err?.message?.includes('write conflict') ||
        err?.message?.includes('deadlock') ||
        err?.message?.includes('WriteConflict') ||
        err?.message?.includes('TransientTransactionError');

      if (isWriteConflict && attempt < maxRetries) {
        const delay = 50 * Math.pow(2, attempt) + Math.floor(Math.random() * 50);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

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

    const isDirectlyReceived = (data.status === 'RECEIVED' || data.isReceived === true);
    const initialStatus = isDirectlyReceived ? 'RECEIVED' : 'DRAFT';

    const processedItems: any[] = [];
    for (const item of items || []) {
      const tCm = Number(item.purchaseThickness ?? item.thickness ?? item.t ?? 0);
      const wCm = Number(item.purchaseWidth ?? item.width ?? item.l ?? 0);
      const pCm = Number(item.purchaseLength ?? item.length ?? item.p ?? 0);
      const pcs = Number(item.quantityPcs ?? item.pcs ?? 0);
      let vol = Number(item.volumeM3 ?? item.volume ?? 0);

      // Silently ignore empty or zeroed rows from Excel-like input
      if (pcs <= 0 && vol <= 0 && pCm <= 0 && tCm <= 0 && wCm <= 0) {
        continue;
      }
      if (pcs <= 0) {
        continue;
      }

      let variantId = item.timberVariantId;

      // Convert cm to mm for database TimberVariant
      const tMm = Math.round(tCm > 50 ? tCm : tCm * 10);
      const wMm = Math.round(wCm > 100 ? wCm : wCm * 10);
      const lMm = Math.round(pCm > 1000 ? pCm : (pCm >= 50 ? pCm * 10 : pCm * 1000));
      if ((!vol || vol === 0) && tCm > 0 && wCm > 0 && pCm > 0 && pcs > 0) {
        // (Panjang cm * Tebal cm * Lebar cm * PCS) / 1.000.000
        vol = Number(((pCm * tCm * wCm * pcs) / 1000000).toFixed(4));
      }

      const spec = (item.species || item.jenis || 'SAWN-TIMBER').trim().toUpperCase();
      const grd = (item.grade || 'A').trim().toUpperCase();

      if (!variantId && tMm > 0 && wMm > 0 && lMm > 0) {
        try {
          const found = await this.prisma.timberVariant.findFirst({
            where: {
              species: { equals: spec, mode: 'insensitive' },
              thickness: tMm,
              width: wMm,
              length: lMm,
            },
          });
          if (found) {
            variantId = found.id;
          } else {
            let genericProduct = await this.prisma.product.findFirst({
              where: {
                OR: [{ code: 'SAWN-TIMBER' }, { name: 'Sawn Timber' }],
              },
            });
            if (!genericProduct) {
              let defaultUnit = await this.prisma.unit.findFirst({
                where: targetCompanyId ? { company_id: targetCompanyId as string } : {},
              });
              if (!defaultUnit) defaultUnit = await this.prisma.unit.findFirst();
              if (!defaultUnit) {
                defaultUnit = await this.prisma.unit.create({
                  data: { company_id: targetCompanyId as string, name: 'Pieces' },
                });
              }
              genericProduct = await this.prisma.product.create({
                data: {
                  name: 'Kayu Olahan (Sawn Timber)',
                  code: 'SAWN-TIMBER',
                  company_id: targetCompanyId as string,
                  unit_id: defaultUnit.id,
                  purchase_price: 0,
                  selling_price: 0,
                  status: true,
                },
              });
            }
            const skuCode = `${spec}-${grd}-${tMm}X${wMm}X${lMm}`;
            const newVar = await this.prisma.timberVariant.create({
              data: {
                company_id: targetCompanyId as string,
                productId: genericProduct.id,
                species: spec,
                grade: grd,
                thickness: tMm,
                width: wMm,
                length: lMm,
                sku: skuCode,
                barcode: `V-${skuCode}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
                volumePerPiece: (tMm * wMm * lMm) / 1000000000,
              },
            });
            variantId = newVar.id;
          }
        } catch (vErr) {
          this.logger.warn(`Failed to auto-create variant: ${vErr}`);
        }
      }

      if (variantId) {
        processedItems.push({
          timberVariantId: variantId,
          quantityPcs: pcs,
          volumeM3: vol,
          purchaseThickness: tCm,
          purchaseWidth: wCm,
          purchaseLength: pCm,
          unitPrice: Number(item.unitPrice || 0),
          notes: item.notes || item.jenis || spec,
          batch: item.batch || 'UNKNOWN',
        });
      }
    }

    let totalPcs = 0;
    let totalVolumeM3 = 0;

    for (const it of processedItems) {
      totalPcs += Number(it.quantityPcs || 0);
      totalVolumeM3 += Number(it.volumeM3 || 0);
    }

    const validLogItems = (logItems || []).filter((li: any) => {
      const p = Number(li.purchaseLength || 0);
      const d1 = Number(li.purchaseDiameter1 || 0);
      const d2 = Number(li.purchaseDiameter2 || 0);
      const vol = Number(li.purchaseVolume || 0);
      return p > 0 || d1 > 0 || d2 > 0 || vol > 0 || (li.logNumber && li.logNumber.trim() !== '');
    });

    for (const li of validLogItems) {
      totalPcs += 1;
      totalVolumeM3 += Number(li.purchaseVolume || 0);
    }

    const purchaseData = {
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
        create: processedItems,
      },
      logItems: {
        create: validLogItems.map((li: any, idx: number) => ({
          logNumber: li.logNumber?.trim() || `LOG-${purchaseNumber}-${idx + 1}`,
          species: li.species || 'UNKNOWN',
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
    };

    if (!isDirectlyReceived) {
      return this.prisma.timberPurchase.create({
        data: purchaseData,
        include: {
          items: true,
          logItems: true,
        },
      });
    }

    return runWithTransactionRetry(this.prisma, async (tx) => {
      const purchase = await tx.timberPurchase.create({
        data: purchaseData,
        include: {
          items: true,
          logItems: true,
        },
      });

      // If directly received upon creation, immediately stock into warehouse and Output (Sawn Timber)
      if (isDirectlyReceived) {
        // Sawn timber stock mutation & SawnTimberOutput
        if (purchase.items && purchase.items.length > 0) {
          let directOutput: any = null;
          if (purchase.partaiId) {
            try {
              let directInput = await tx.inputLog.findFirst({
                where: {
                  partaiId: purchase.partaiId,
                  inputNumber: `DIRECT-PURCHASE-${purchase.purchaseNumber || purchase.id.slice(-6)}`,
                },
              });
              if (!directInput) {
                directInput = await tx.inputLog.create({
                  data: {
                    partaiId: purchase.partaiId,
                    inputNumber: `DIRECT-PURCHASE-${purchase.purchaseNumber || purchase.id.slice(-6)}`,
                    species: (purchase.items[0] as any)?.species || (purchase.items[0] as any)?.timberVariant?.species || 'SAWN-TIMBER',
                    shift: '1',
                    date: purchase.purchaseDate ? new Date(purchase.purchaseDate) : new Date(),
                    status: 'DONE',
                    totalQty: 0,
                    totalVolume: 0,
                  },
                });
              }

              directOutput = await tx.sawnTimberOutput.create({
                data: {
                  partaiId: purchase.partaiId,
                  bundleNumber: `BUNDLE-${purchase.purchaseNumber || 'PUR'}-${Date.now().toString().slice(-4)}`,
                  outputDate: purchase.purchaseDate ? new Date(purchase.purchaseDate) : new Date(),
                  shift: '1',
                  locationId: purchase.warehouseId,
                  inputLogId: directInput.id,
                  status: 'POSTED',
                  notes: `Penerimaan Pembelian Sawn Timber (Beli Masak) ${purchase.purchaseNumber}`,
                },
              });
            } catch (outErr) {
              this.logger.warn(`Failed to create sawnTimberOutput in direct receive: ${outErr}`);
            }
          }

          for (const item of purchase.items) {
            if (item.quantityPcs > 0 && item.volumeM3 > 0 && item.timberVariantId) {
              if (directOutput) {
                try {
                  await tx.sawnTimberOutputItem.create({
                    data: {
                      outputId: directOutput.id,
                      timberVariantId: item.timberVariantId,
                      grade: 'A',
                      productType: 'BALOK',
                      quantityPcs: item.quantityPcs,
                      thicknessMm: Math.round(Number(item.purchaseThickness || 0) > 50 ? Number(item.purchaseThickness || 0) : Number(item.purchaseThickness || 0) * 10),
                      widthMm: Math.round(Number(item.purchaseWidth || 0) > 100 ? Number(item.purchaseWidth || 0) : Number(item.purchaseWidth || 0) * 10),
                      lengthMm: Math.round(Number(item.purchaseLength || 0) > 1000 ? Number(item.purchaseLength || 0) : (Number(item.purchaseLength || 0) >= 50 ? Number(item.purchaseLength || 0) * 10 : Number(item.purchaseLength || 0) * 1000)),
                      volumeM3: Number(item.volumeM3 || 0),
                      notes: `Dari PO ${purchase.purchaseNumber}`,
                    },
                  });
                } catch (itErr) {
                  this.logger.warn(`Failed to create sawnTimberOutputItem: ${itErr}`);
                }
              }

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
              const lengthCm = len <= 50 ? len * 100 : len;
              let grossVol = 0;
              if (item.purchaseVolume && Number(item.purchaseVolume) > 0) {
                grossVol = Number(item.purchaseVolume);
              } else if (avgDia > 0) {
                grossVol = Number(((0.7854 * lengthCm * avgDia * avgDia) / 1000000).toFixed(4));
              }

              let logNum = (item.logNumber && item.logNumber.trim() !== '')
                ? item.logNumber.trim()
                : `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}`;

              const uniqueBarcode = (item as any).barcode || `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

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
    return runWithTransactionRetry(this.prisma, async (tx) => {
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
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestException('Pembelian yang dibatalkan tidak dapat dikonfirmasi');
      }

      return tx.timberPurchase.update({
        where: { id: purchase.id },
        data: { status: 'CONFIRMED' },
        include: { items: true, logItems: true },
      });
    });
  }

  async markAsReceived(id: string, companyId: string, data?: any) {
    return runWithTransactionRetry(this.prisma, async (tx) => {
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
        include: { items: { include: { timberVariant: true } }, logItems: true },
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestException('Pembelian yang dibatalkan tidak dapat diterima');
      }

      const targetReceivingDate = data?.receivingDate ? new Date(data.receivingDate) : new Date();

      // Update status to RECEIVED and set receivingDate
      const received = await tx.timberPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'RECEIVED',
          receivingDate: targetReceivingDate,
        },
      });

      // 1. Stock mutations & SawnTimberOutput for sawn timber
      if (purchase.items && purchase.items.length > 0) {
        const sawnItemsToProcess =
          (data?.items || data?.sawnItems || []).length > 0
            ? (data?.items || data?.sawnItems)
            : purchase.items;

        let createdOutput: any = null;
        const targetPartaiId = purchase.partaiId || data?.partaiId;

        let effectiveWarehouseId = purchase.warehouseId;
        if (!effectiveWarehouseId) {
          const fallbackWh = await tx.warehouse.findFirst({
            where: { company_id: purchase.company_id },
          });
          if (fallbackWh) effectiveWarehouseId = fallbackWh.id;
        }

        if (targetPartaiId) {
          if (!purchase.partaiId && data?.partaiId) {
            await tx.timberPurchase.update({
              where: { id: purchase.id },
              data: { partaiId: data.partaiId },
            });
          }
          const bundlePrefix = `BUNDLE-${purchase.purchaseNumber || 'PUR'}`;
          let existingOutput = await tx.sawnTimberOutput.findFirst({
            where: {
              partaiId: targetPartaiId,
              bundleNumber: { startsWith: bundlePrefix },
            },
          });

          if (!existingOutput) {
            let directInputLog = await tx.inputLog.findFirst({
              where: {
                partaiId: targetPartaiId,
                inputNumber: `DIRECT-PURCHASE-${purchase.purchaseNumber || purchase.id.slice(-6)}`,
              },
            });
            if (!directInputLog) {
              directInputLog = await tx.inputLog.create({
                data: {
                  partaiId: targetPartaiId,
                  inputNumber: `DIRECT-PURCHASE-${purchase.purchaseNumber || purchase.id.slice(-6)}`,
                  species: purchase.items[0]?.timberVariant?.species || 'SAWN-TIMBER',
                  shift: '1',
                  date: new Date(),
                  status: 'DONE',
                  totalQty: 0,
                  totalVolume: 0,
                },
              });
            }

            createdOutput = await tx.sawnTimberOutput.create({
              data: {
                partaiId: targetPartaiId,
                bundleNumber: `${bundlePrefix}-${Date.now().toString().slice(-4)}`,
                outputDate: new Date(),
                shift: '1',
                locationId: effectiveWarehouseId || purchase.warehouseId,
                inputLogId: directInputLog.id,
                status: 'POSTED',
                notes: `Penerimaan Pembelian Sawn Timber (Beli Masak) ${purchase.purchaseNumber}`,
              },
            });
          } else {
            createdOutput = existingOutput;
          }
        }

        for (const item of sawnItemsToProcess) {
          const qty = Number(item.quantityPcs || item.receivedPcs || 0);
          const rawT = Number(item.thickness || item.purchaseThickness || item.thicknessMm || 0);
          const rawW = Number(item.width || item.purchaseWidth || item.widthMm || 0);
          const rawL = Number(item.length || item.purchaseLength || item.lengthMm || 0);
          
          const tMm = Math.round(rawT > 50 ? rawT : rawT * 10);
          const wMm = Math.round(rawW > 100 ? rawW : rawW * 10);
          const lMm = Math.round(rawL > 1000 ? rawL : (rawL >= 50 ? rawL * 10 : rawL * 1000));
          const tCm = rawT > 50 ? rawT / 10 : rawT;
          const wCm = rawW > 100 ? rawW / 10 : rawW;
          const pCm = rawL > 1000 ? rawL / 10 : (rawL >= 50 ? rawL : rawL * 100);

          let vol = Number(item.volumeM3 || 0);
          if ((!vol || vol === 0) && tMm > 0 && wMm > 0 && lMm > 0 && qty > 0) {
            vol = Number((((tMm * wMm * lMm) / 1000000000) * qty).toFixed(4));
          }

          const variantId = item.timberVariantId || (item as any).variantId;

          if (qty > 0 && vol > 0 && variantId) {
            // Update purchase line item if ID matches
            if (item.id && /^[0-9a-fA-F]{24}$/.test(item.id)) {
              await tx.timberPurchaseItem.updateMany({
                where: { id: item.id, timberPurchaseId: purchase.id },
                data: {
                  quantityPcs: qty,
                  volumeM3: vol,
                  purchaseThickness: tCm || undefined,
                  purchaseWidth: wCm || undefined,
                  purchaseLength: pCm || undefined,
                },
              });
            }

            // Create or update SawnTimberOutputItem if createdOutput exists
            if (createdOutput) {
              const existingItem = await tx.sawnTimberOutputItem.findFirst({
                where: {
                  outputId: createdOutput.id,
                  timberVariantId: variantId,
                },
              });
              if (!existingItem) {
                await tx.sawnTimberOutputItem.create({
                  data: {
                    outputId: createdOutput.id,
                    timberVariantId: variantId,
                    grade: item.grade || 'A',
                    productType: item.productType || 'BALOK',
                    quantityPcs: qty,
                    thicknessMm: tMm,
                    widthMm: wMm,
                    lengthMm: lMm,
                    volumeM3: vol,
                    notes: `Penerimaan Sawn Timber ${purchase.purchaseNumber}`,
                  },
                });
              } else {
                await tx.sawnTimberOutputItem.update({
                  where: { id: existingItem.id },
                  data: {
                    grade: item.grade || existingItem.grade || 'A',
                    productType: item.productType || existingItem.productType || 'BALOK',
                    quantityPcs: qty,
                    thicknessMm: tMm,
                    widthMm: wMm,
                    lengthMm: lMm,
                    volumeM3: vol,
                  },
                });
              }
            }

            // Stock ledger mutation
            if (effectiveWarehouseId) {
              await this.inventoryLedgerService.createMovement(
                tx,
                effectiveWarehouseId,
                variantId,
                'IN',
                'TIMBER_PURCHASE',
                purchase.id,
                qty,
                vol,
                item.batch || purchase.purchaseNumber || 'UNKNOWN',
              );
            }
          }
        }
      }

      // 2. Convert log items to RawLog
      if (purchase.logItems && purchase.logItems.length > 0) {
        for (let i = 0; i < purchase.logItems.length; i++) {
          const item = purchase.logItems[i];
          const incoming = (data?.logItems || data?.items || []).find((x: any) => x.id === item.id || x.purchaseLogItemId === item.id);
          const existing = await tx.rawLog.findFirst({
            where: {
              OR: [
                { purchaseLogItemId: item.id },
                ...(item.logNumber ? [{ partaiId: purchase.partaiId, logNumber: item.logNumber }] : []),
              ],
            },
          });
          const d1 = Number(incoming?.diameter1 || incoming?.d1 || item.purchaseDiameter1 || 0);
          const d2 = Number(incoming?.diameter2 || incoming?.d2 || item.purchaseDiameter2 || 0);
          const d3 = Number(incoming?.diameter3 || incoming?.d3 || item.purchaseDiameter3 || 0);
          const d4 = Number(incoming?.diameter4 || incoming?.d4 || item.purchaseDiameter4 || 0);
          const grw = Number(incoming?.gerowong || 0);
          let diaSum = 0;
          let diaCount = 0;
          if (d1 > 0) { diaSum += d1; diaCount++; }
          if (d2 > 0) { diaSum += d2; diaCount++; }
          if (d3 > 0) { diaSum += d3; diaCount++; }
          if (d4 > 0) { diaSum += d4; diaCount++; }
          const avgDia = diaCount > 0 ? diaSum / diaCount : (incoming?.averageDiameter || d1 || d2 || 0);
          const rndDia = Math.floor(avgDia);
          const len = Number(incoming?.originalLength || incoming?.length || item.purchaseLength || 0);
          const lengthCm = len <= 50 ? len * 100 : len;
          let grossVol = 0;
          if (incoming?.grossVolume) {
            grossVol = Number(incoming.grossVolume);
          } else if (item.purchaseVolume && Number(item.purchaseVolume) > 0) {
            grossVol = Number(item.purchaseVolume);
          } else if (avgDia > 0) {
            grossVol = Number(((0.7854 * lengthCm * avgDia * avgDia) / 1000000).toFixed(4));
          }
          const netVol = incoming?.netVolume ? Number(incoming.netVolume) : grossVol;

          let logNum = (incoming?.logNumber && incoming.logNumber.trim() !== '')
            ? incoming.logNumber.trim()
            : ((item.logNumber && item.logNumber.trim() !== '') ? item.logNumber.trim() : `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}`);

          const uniqueBarcode = (item as any).barcode || `LOG-${purchase.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

          if (!existing) {
            try {
              await tx.rawLog.create({
                data: {
                  partaiId: purchase.partaiId,
                  purchaseLogItemId: item.id,
                  logNumber: logNum,
                  species: item.species || incoming?.species || 'UNKNOWN',
                  speciesId: (incoming?.speciesId && /^[0-9a-fA-F]{24}$/.test(incoming.speciesId)) ? incoming.speciesId : (item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null),
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  gerowong: grw || undefined,
                  grossVolume: grossVol,
                  netVolume: netVol,
                  barcode: uniqueBarcode,
                  receivingDate: targetReceivingDate,
                  status: 'AVAILABLE',
                },
              });
            } catch (createErr: any) {
              await tx.rawLog.create({
                data: {
                  partaiId: purchase.partaiId,
                  purchaseLogItemId: item.id,
                  logNumber: `${logNum}-${Date.now().toString().slice(-4)}`,
                  species: item.species || incoming?.species || 'UNKNOWN',
                  speciesId: (incoming?.speciesId && /^[0-9a-fA-F]{24}$/.test(incoming.speciesId)) ? incoming.speciesId : (item.speciesId && /^[0-9a-fA-F]{24}$/.test(item.speciesId) ? item.speciesId : null),
                  originalLength: len,
                  diameter1: d1,
                  diameter2: d2,
                  diameter3: d3,
                  diameter4: d4,
                  averageDiameter: avgDia,
                  roundedDiameter: rndDia,
                  gerowong: grw || undefined,
                  grossVolume: grossVol,
                  netVolume: netVol,
                  barcode: `${uniqueBarcode}-${Math.floor(Math.random() * 10000)}`,
                  receivingDate: targetReceivingDate,
                  status: 'AVAILABLE',
                },
              });
            }
          } else {
            // Update existing rawLog if needed
            await tx.rawLog.update({
              where: { id: existing.id },
              data: {
                receivingDate: targetReceivingDate,
                originalLength: len || existing.originalLength,
                diameter1: d1 || existing.diameter1,
                diameter2: d2 || existing.diameter2,
                diameter3: d3 || existing.diameter3,
                diameter4: d4 || existing.diameter4,
                averageDiameter: avgDia || existing.averageDiameter,
                roundedDiameter: rndDia || existing.roundedDiameter,
                grossVolume: grossVol || existing.grossVolume,
                netVolume: netVol || existing.netVolume,
              },
            });
          }

          await tx.timberPurchaseLogItem.update({
            where: { id: item.id },
            data: {
              status: 'RECEIVED',
              receivingDate: targetReceivingDate,
              purchaseLength: len,
              purchaseDiameter1: d1,
              purchaseDiameter2: d2,
              purchaseDiameter3: d3,
              purchaseDiameter4: d4,
              purchaseVolume: netVol || grossVol,
            },
          });
        }
      }

      return received;
    });
  }

  async cancel(id: string, companyId: string) {
    return runWithTransactionRetry(this.prisma, async (tx) => {
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
    return runWithTransactionRetry(this.prisma, async (tx) => {
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
          const tCm = Number(item.purchaseThickness ?? item.thickness ?? item.t ?? 0);
          const wCm = Number(item.purchaseWidth ?? item.width ?? item.l ?? 0);
          const pCm = Number(item.purchaseLength ?? item.length ?? item.p ?? 0);
          const pcs = Number(item.quantityPcs || 0);
          let vol = Number(item.volumeM3 || 0);

          if (pcs <= 0 && vol <= 0 && pCm <= 0 && tCm <= 0 && wCm <= 0) {
            continue;
          }
          if (pcs <= 0) {
            continue;
          }

          let variantId = item.timberVariantId || item.variantId;
          const tMm = Math.round(tCm > 50 ? tCm : tCm * 10);
          const wMm = Math.round(wCm > 100 ? wCm : wCm * 10);
          const lMm = Math.round(pCm > 1000 ? pCm : (pCm >= 50 ? pCm * 10 : pCm * 1000));

          if ((!vol || vol === 0) && tCm > 0 && wCm > 0 && pCm > 0 && pcs > 0) {
            vol = Number(((pCm * tCm * wCm * pcs) / 1000000).toFixed(4));
          }

          const spec = (item.species || item.jenis || 'SAWN-TIMBER').trim().toUpperCase();
          const grd = (item.grade || 'A').trim().toUpperCase();

          if (!variantId && tMm > 0 && wMm > 0 && lMm > 0) {
            try {
              const found = await tx.timberVariant.findFirst({
                where: {
                  species: { equals: spec, mode: 'insensitive' },
                  thickness: tMm,
                  width: wMm,
                  length: lMm,
                },
              });
              if (found) {
                variantId = found.id;
              } else {
                let genericProduct = await tx.product.findFirst({
                  where: {
                    OR: [{ code: 'SAWN-TIMBER' }, { name: 'Sawn Timber' }],
                  },
                });
                if (!genericProduct) {
                  let defaultUnit = await tx.unit.findFirst({
                    where: { company_id: purchase.company_id },
                  });
                  if (!defaultUnit) defaultUnit = await tx.unit.findFirst();
                  if (!defaultUnit) {
                    defaultUnit = await tx.unit.create({
                      data: { company_id: purchase.company_id, name: 'Pieces' },
                    });
                  }
                  genericProduct = await tx.product.create({
                    data: {
                      name: 'Kayu Olahan (Sawn Timber)',
                      code: 'SAWN-TIMBER',
                      company_id: purchase.company_id,
                      unit_id: defaultUnit.id,
                      purchase_price: 0,
                      selling_price: 0,
                      status: true,
                    },
                  });
                }
                const skuCode = `${spec}-${grd}-${tMm}X${wMm}X${lMm}`;
                const newVar = await tx.timberVariant.create({
                  data: {
                    company_id: purchase.company_id,
                    productId: genericProduct.id,
                    species: spec,
                    grade: grd,
                    thickness: tMm,
                    width: wMm,
                    length: lMm,
                    sku: skuCode,
                    barcode: `V-${skuCode}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
                    volumePerPiece: (tMm * wMm * lMm) / 1000000000,
                  },
                });
                variantId = newVar.id;
              }
            } catch (vErr) {
              this.logger.warn(`Failed to auto-create variant in update: ${vErr}`);
            }
          }

          if (!variantId) continue;

          totalPcs += pcs;
          totalVolume += vol;

          const createdItem = await tx.timberPurchaseItem.create({
            data: {
              timberPurchaseId: actualId,
              timberVariantId: variantId,
              quantityPcs: pcs,
              volumeM3: vol,
              purchaseThickness: tCm,
              purchaseWidth: wCm,
              purchaseLength: pCm,
              unitPrice: Number(item.unitPrice || 0),
              batch: item.batch || 'UNKNOWN',
              notes: item.notes || item.jenis || spec,
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

        const validLogItems = data.logItems.filter((li: any) => {
          const p = Number(li.purchaseLength || 0);
          const d1 = Number(li.purchaseDiameter1 || 0);
          const d2 = Number(li.purchaseDiameter2 || 0);
          const vol = Number(li.purchaseVolume || 0);
          return p > 0 || d1 > 0 || d2 > 0 || vol > 0 || (li.logNumber && li.logNumber.trim() !== '');
        });

        for (const item of validLogItems) {
          const logNum = item.logNumber?.trim() || `LOG-${purchase.purchaseNumber || 'PUR'}-${logPcs + 1}`;
          logPcs += 1;
          logVolume += Number(item.purchaseVolume || 0);

          const li = await tx.timberPurchaseLogItem.create({
            data: {
              timberPurchaseId: actualId,
              logNumber: logNum,
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
            const lengthCm = len <= 50 ? len * 100 : len;
            let grossVol = 0;
            if (item.purchaseVolume && Number(item.purchaseVolume) > 0) {
              grossVol = Number(item.purchaseVolume);
            } else if (avgDia > 0) {
              grossVol = Number(((0.7854 * lengthCm * avgDia * avgDia) / 1000000).toFixed(4));
            }
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
