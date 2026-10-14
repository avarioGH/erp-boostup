import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartaiService {
  private readonly logger = new Logger(PartaiService.name);

  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    if (!data?.code || !data.code.trim()) {
      throw new BadRequestException('Kode Partai wajib diisi.');
    }

    const code = data.code.trim();

    // Check if duplicate code exists
    const existing = await this.prisma.timberPartai.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Kode Partai '${code}' sudah terdaftar di sistem. Mohon gunakan kode partai yang berbeda.`,
      );
    }

    try {
      return await this.prisma.timberPartai.create({
        data: {
          ...data,
          code,
          company_id: targetCompanyId,
        },
      });
    } catch (err: any) {
      if (
        err?.code === 'P2002' ||
        (typeof err?.message === 'string' &&
          err.message.includes('Unique constraint failed'))
      ) {
        throw new BadRequestException(
          `Kode Partai '${code}' sudah terdaftar di sistem. Mohon gunakan kode partai yang berbeda.`,
        );
      }
      throw err;
    }
  }

  async migrateToTesting(companyId?: string) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    let testingPartai = await this.prisma.timberPartai.findFirst({
      where: { code: 'TESTING', ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
    });
    if (!testingPartai) {
      testingPartai = await this.prisma.timberPartai.create({
        data: {
          code: 'TESTING',
          name: 'Partai Testing (Migrasi)',
          company_id: targetCompanyId as string,
          status: 'COMPLETED',
        },
      });
    }

    const pid = testingPartai.id;
    const p1 = await this.prisma.timberPurchase.updateMany({
      where: { partaiId: null, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
      data: { partaiId: pid },
    });
    const p2 = await this.prisma.rawLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p3 = await this.prisma.trimmedLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p4 = await this.prisma.inputLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p5 = await this.prisma.sawnTimberOutput.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    return {
      success: true,
      testingPartaiId: pid,
      updated: {
        purchases: p1.count,
        rawLogs: p2.count,
        trimmedLogs: p3.count,
        inputLogs: p4.count,
        outputs: p5.count,
      },
    };
  }

  async findAll(companyId?: string) {
    const where: any = {};
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    return this.prisma.timberPartai.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId?: string) {
    try {
      // FIX CORRUPT DATA:
      // If there are InputLogs that belong to this Partai's TrimmedLogs but lack partaiId, fix them.
      const corruptInputLogItems = await this.prisma.inputLogItem.findMany({
        where: {
          trimmedLog: { partaiId: id },
          inputLog: { partaiId: null },
        },
        include: { inputLog: true, trimmedLog: true },
      });

      for (const item of corruptInputLogItems) {
        if (item.inputLog) {
          await this.prisma.inputLog.update({
            where: { id: item.inputLogId },
            data: { partaiId: id },
          });
        }
      }

      // FIX MISSING INPUT LOGS:
      // Find TrimmedLogs that think they are in an InputLog, but the InputLog doesn't exist
      const assignedTrimmedLogs = await this.prisma.trimmedLog.findMany({
        where: { partaiId: id, status: 'ASSIGNED_TO_INPUT', inputLogId: { not: null } },
        include: { inputLog: true },
      });
      for (const st of assignedTrimmedLogs) {
        if (!st.inputLog) {
          await this.prisma.trimmedLog.update({
            where: { id: st.id },
            data: { status: 'AVAILABLE', inputLogId: null },
          });
        }
      }

      // FIX CORRUPT TRIMMED LOGS:
      // If there are TrimmedLogs that are ASSIGNED_TO_INPUT but don't have an inputLogId or their inputLog is missing, reset them
      const stuckTrimmedLogs = await this.prisma.trimmedLog.findMany({
        where: { partaiId: id, status: 'ASSIGNED_TO_INPUT', inputLogId: null },
      });
      for (const st of stuckTrimmedLogs) {
        await this.prisma.trimmedLog.update({
          where: { id: st.id },
          data: { status: 'AVAILABLE' },
        });
      }
    } catch (err) {
      this.logger.warn(`Data fix routine skipped for partai ${id}: ${err?.message || err}`);
    }

    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { timberVariant: true } },
            logItems: true,
            source: true,
            warehouse: true,
          },
        },
        rawLogs: { orderBy: { createdAt: 'desc' }, include: { trimmedLogs: true } },
        trimmedLogs: { orderBy: { createdAt: 'desc' }, include: { rawLog: true } },
        inputLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: { trimmedLog: true, rawLog: true },
            },
            sawnOutputs: { orderBy: { createdAt: 'desc' }, include: { items: { include: { timberVariant: true } } } },
          },
        },
        sawnOutputs: { orderBy: { createdAt: 'desc' }, include: { items: { include: { timberVariant: true } } } },
        productionProcesses: {
          orderBy: { createdAt: 'desc' },
          include: {
            inputs: { include: { variant: true } },
            outputs: { include: { variant: true, warehouse: true } },
          },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { timberVariant: true } },
            warehouse: true,
          },
        },
        packings: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            warehouse: true,
          },
        },
      },
    });

    if (!partai) throw new NotFoundException('Partai not found');

    // DEDUPLICATE RAW LOGS IN THIS PARTAI (Clean up duplicate dummies in DB)
    const logGroups = new Map<string, any[]>();
    for (const r of partai.rawLogs || []) {
      const key = (r.logNumber || '').trim();
      if (!key) continue;
      if (!logGroups.has(key)) logGroups.set(key, []);
      logGroups.get(key)!.push(r);
    }

    const dedupedRawLogs: any[] = [];
    for (const [_, logs] of logGroups.entries()) {
      if (logs.length === 1) {
        dedupedRawLogs.push(logs[0]);
        continue;
      }

      logs.sort((a, b) => {
        const aTrimmed = ((a.trimmedLogs && a.trimmedLogs.length > 0) || a.status === 'TRIMMED') ? 1 : 0;
        const bTrimmed = ((b.trimmedLogs && b.trimmedLogs.length > 0) || b.status === 'TRIMMED') ? 1 : 0;
        if (aTrimmed !== bTrimmed) return bTrimmed - aTrimmed;

        const aAvg = Number(a.averageDiameter || 0);
        const bAvg = Number(b.averageDiameter || 0);
        if (aAvg !== bAvg) return bAvg - aAvg;

        const aVol = Number(a.netVolume || a.grossVolume || 0);
        const bVol = Number(b.netVolume || b.grossVolume || 0);
        if (aVol !== bVol) return bVol - aVol;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const keeper = logs[0];
      dedupedRawLogs.push(keeper);

      for (let j = 1; j < logs.length; j++) {
        const dup = logs[j];
        if (!dup.trimmedLogs || dup.trimmedLogs.length === 0) {
          try {
            await this.prisma.rawLog.delete({ where: { id: dup.id } });
          } catch (delErr) {
            this.logger.warn(`Failed to clean up duplicate raw log ${dup.id}: ${delErr}`);
          }
        }
      }
    }
    partai.rawLogs = dedupedRawLogs;

    // Auto-heal: Ensure any logItems from purchases are restored into RawLogs (DUKB) if missing
    if (partai.purchases && partai.purchases.length > 0) {
      const existingPurchaseLogItemIds = new Set(
        (partai.rawLogs || []).map((r: any) => r.purchaseLogItemId).filter(Boolean)
      );

      const existingLogNumbers = new Set(
        (partai.rawLogs || []).map((r: any) => (r.logNumber || '').trim()).filter(Boolean)
      );

      for (const p of partai.purchases) {

        for (let i = 0; i < (p.logItems || []).length; i++) {
          const item = p.logItems[i];
          const itemLogNumber = (item.logNumber || '').trim();
          // If already in partai.rawLogs, skip
          if (existingPurchaseLogItemIds.has(item.id)) continue;
          if (itemLogNumber && existingLogNumbers.has(itemLogNumber)) continue;

          // Automatically restore any log items from purchases attached to this partai into DUKB (RawLog)
          if (item.status !== 'RECEIVED' || p.status !== 'RECEIVED') {
            try {
              await this.prisma.timberPurchaseLogItem.update({
                where: { id: item.id },
                data: { status: 'RECEIVED' },
              });
              if (p.status !== 'RECEIVED') {
                await this.prisma.timberPurchase.update({
                  where: { id: p.id },
                  data: { status: 'RECEIVED' },
                });
              }
            } catch (upErr) {}
          }
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

            const logNum = (item.logNumber && item.logNumber.trim() !== '')
              ? item.logNumber.trim()
              : `LOG-${p.purchaseNumber || 'PUR'}-${i + 1}`;

            const uniqueBarcode = (item as any).barcode || `LOG-${p.purchaseNumber || 'PUR'}-${i + 1}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            const targetReceivingDate = item.receivingDate || p.receivingDate || new Date();

            try {
              const newRawLog = await this.prisma.rawLog.create({
                data: {
                  partaiId: partai.id,
                  locationId: p.warehouseId || null,
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
                  receivingDate: targetReceivingDate,
                  status: 'AVAILABLE',
                },
              });
              partai.rawLogs.push({ ...newRawLog, trimmedLogs: [] } as any);
              existingPurchaseLogItemIds.add(item.id);
            } catch (err) {
              try {
                const retryLog = await this.prisma.rawLog.create({
                  data: {
                    partaiId: partai.id,
                    locationId: p.warehouseId || null,
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
                    receivingDate: targetReceivingDate,
                    status: 'AVAILABLE',
                  },
                });
                partai.rawLogs.push({ ...retryLog, trimmedLogs: [] } as any);
                existingPurchaseLogItemIds.add(item.id);
              } catch (retryErr) {
                console.error('Failed to auto-sync raw log for item:', item.id, retryErr);
              }
            }
        }

        // Auto-heal: Ensure any received sawn timber purchases are linked to SawnTimberOutput
        if (p.status === 'RECEIVED' && p.items && p.items.length > 0) {
          const bundlePrefix = `BUNDLE-${p.purchaseNumber || 'PUR'}`;
          const existingOutput = (partai.sawnOutputs || []).find(
            (o: any) =>
              (o.bundleNumber && o.bundleNumber.startsWith(bundlePrefix)) ||
              (o.notes && o.notes.includes(p.purchaseNumber || p.id))
          );

          if (!existingOutput) {
            try {
              let directInput = await this.prisma.inputLog.findFirst({
                where: {
                  partaiId: partai.id,
                  inputNumber: `DIRECT-PURCHASE-${p.purchaseNumber || p.id.slice(-6)}`,
                },
              });
              if (!directInput) {
                directInput = await this.prisma.inputLog.create({
                  data: {
                    partaiId: partai.id,
                    inputNumber: `DIRECT-PURCHASE-${p.purchaseNumber || p.id.slice(-6)}`,
                    species: p.items[0]?.timberVariant?.species || 'SAWN-TIMBER',
                    shift: '1',
                    date: p.purchaseDate ? new Date(p.purchaseDate) : new Date(),
                    status: 'DONE',
                    totalQty: 0,
                    totalVolume: 0,
                  },
                });
              }

              const validItems = p.items.filter((it: any) => it.quantityPcs > 0 && it.timberVariantId);
              if (validItems.length > 0) {
                const newOutput = await this.prisma.sawnTimberOutput.create({
                  data: {
                    partaiId: partai.id,
                    bundleNumber: `${bundlePrefix}-${Date.now().toString().slice(-4)}`,
                    outputDate: p.purchaseDate ? new Date(p.purchaseDate) : new Date(),
                    shift: '1',
                    locationId: p.warehouseId,
                    inputLogId: directInput.id,
                    status: 'POSTED',
                    notes: `Penerimaan Pembelian Sawn Timber (Beli Masak) ${p.purchaseNumber}`,
                    items: {
                      create: validItems.map((it: any) => ({
                        timberVariantId: it.timberVariantId,
                        grade: it.timberVariant?.grade || 'A',
                        productType: 'BALOK',
                        quantityPcs: it.quantityPcs,
                        thicknessMm: Math.round(Number(it.purchaseThickness || it.timberVariant?.thickness || 0)),
                        widthMm: Math.round(Number(it.purchaseWidth || it.timberVariant?.width || 0)),
                        lengthMm: Math.round(Number(it.purchaseLength || it.timberVariant?.length || 0)),
                        volumeM3: Number(it.volumeM3 || 0),
                        notes: `Dari PO ${p.purchaseNumber}`,
                      })),
                    },
                  },
                  include: { items: { include: { timberVariant: true } } },
                });
                partai.sawnOutputs.push(newOutput);
              }
            } catch (outputErr: any) {
              this.logger.warn(`Failed to auto-sync sawn timber output for purchase ${p.purchaseNumber}: ${outputErr?.message || outputErr}`);
            }
          }
        }
      }
    }

    return partai;
  }

  async update(id: string, companyId?: string, data?: any) {
    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
    });
    if (!partai) throw new NotFoundException('Partai not found');

    if (data?.code && data.code.trim() !== partai.code) {
      const code = data.code.trim();
      const existing = await this.prisma.timberPartai.findFirst({
        where: {
          code: { equals: code, mode: 'insensitive' },
          ...(partai.company_id ? { company_id: partai.company_id } : {}),
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Kode Partai '${code}' sudah digunakan oleh partai lain.`,
        );
      }
      data.code = code;
    }

    try {
      return await this.prisma.timberPartai.update({
        where: { id },
        data,
      });
    } catch (err: any) {
      if (
        err?.code === 'P2002' ||
        (typeof err?.message === 'string' &&
          err.message.includes('Unique constraint failed'))
      ) {
        throw new BadRequestException(
          `Kode Partai '${data?.code || ''}' sudah digunakan.`,
        );
      }
      throw err;
    }
  }

  async delete(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
    });
    if (!partai) throw new NotFoundException('Partai not found');
    return this.prisma.timberPartai.delete({ where: { id } });
  }
}
