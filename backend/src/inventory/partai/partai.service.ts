import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

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
            destinationWarehouse: true,
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
            const lengthCm = len <= 50 ? len * 100 : len;

            let grossVol = 0;
            if (item.purchaseVolume && Number(item.purchaseVolume) > 0) {
              grossVol = Number(item.purchaseVolume);
            } else if (avgDia > 0) {
              grossVol = Number(((0.7854 * lengthCm * avgDia * avgDia) / 1000000).toFixed(4));
            }

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

  async exportExcel(id: string, companyId: string, options: any, res: Response) {
    const partai = await this.findOne(id, companyId);
    if (!partai) throw new NotFoundException('Partai tidak ditemukan');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ERP Boostup Wood';
    workbook.lastModifiedBy = 'ERP Boostup Wood';
    workbook.created = new Date();
    workbook.modified = new Date();

    const selectedSheets: string[] = Array.isArray(options?.sheets) && options.sheets.length > 0
      ? options.sheets
      : ['dukb', 'trimming', 'input', 'output'];

    const filterSpecies = options?.species ? String(options.species).trim().toUpperCase() : null;
    const filterStartDate = options?.startDate ? new Date(options.startDate) : null;
    const filterEndDate = options?.endDate ? new Date(options.endDate) : null;

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri' };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };

    // 1. SHEET: DUKB (Raw Logs)
    if (selectedSheets.includes('dukb')) {
      const ws = workbook.addWorksheet('DUKB');
      ws.addRow(['KODE PARTAI', ':', partai.code || '-']);
      ws.addRow(['NAMA PARTAI', ':', partai.name || '-']);
      ws.addRow(['TANGGAL EXPORT', ':', new Date().toLocaleDateString('id-ID')]);
      ws.addRow([]);

      const headers = [
        'No. Urut', 'No. Log', 'Kode', 'Jenis Kayu', 'Qty', 'Panjang (m)',
        'D1 (cm)', 'D2 (cm)', 'D3 (cm)', 'D4 (cm)', 'Ø Rata (cm)',
        'Vol Bruto (m³)', 'Gerowong (cm)', 'Vol Gerowong (m³)', 'Vol Netto (m³)', 'Status'
      ];
      const hRow = ws.addRow(headers);
      hRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle;
      });

      let rawLogs = partai.rawLogs || [];
      if (filterSpecies && filterSpecies !== 'ALL') {
        rawLogs = rawLogs.filter((r: any) => (r.species || '').toUpperCase().includes(filterSpecies));
      }
      if (filterStartDate) {
        rawLogs = rawLogs.filter((r: any) => new Date(r.createdAt) >= filterStartDate);
      }
      if (filterEndDate) {
        rawLogs = rawLogs.filter((r: any) => new Date(r.createdAt) <= filterEndDate);
      }

      rawLogs.forEach((r: any, idx: number) => {
        const d1 = r.d1 || 0;
        const d2 = r.d2 || 0;
        const d3 = r.d3 || 0;
        const d4 = r.d4 || 0;
        const avgD = (d1 || d2 || d3 || d4)
          ? Number(((d1 + d2 + d3 + d4) / ([d1, d2, d3, d4].filter(x => x > 0).length || 1)).toFixed(2))
          : (r.diameter || 0);

        const row = ws.addRow([
          idx + 1,
          r.logNumber || '-',
          r.code || '-',
          r.species || '-',
          1,
          Number(r.length || 0),
          d1 || '-',
          d2 || '-',
          d3 || '-',
          d4 || '-',
          avgD,
          Number(r.grossVolume || 0),
          r.hollowDiameter || 0,
          Number(r.hollowVolume || 0),
          Number(r.netVolume || r.grossVolume || 0),
          r.status || 'AVAILABLE'
        ]);
        row.eachCell((cell) => { cell.border = borderStyle; cell.font = { size: 9, name: 'Calibri' }; });
      });

      ws.columns = [
        { width: 10 }, { width: 14 }, { width: 10 }, { width: 16 }, { width: 8 },
        { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 14 }
      ];
    }

    // 2. SHEET: Trimming log
    if (selectedSheets.includes('trimming')) {
      const ws = workbook.addWorksheet('Trimming log');
      ws.addRow(['KODE PARTAI', ':', partai.code || '-']);
      ws.addRow(['NAMA PARTAI', ':', partai.name || '-']);
      ws.addRow(['LAPORAN', ':', 'TRIMMING LOG BULAT']);
      ws.addRow([]);

      const headers = [
        'No', 'Tanggal', 'No. Log Asal', 'No. TRM', 'Kode', 'Jenis Kayu',
        'Panjang (m)', 'D1 (cm)', 'D2 (cm)', 'D3 (cm)', 'D4 (cm)',
        'Ø Rata (cm)', 'Vol Netto (m³)', 'Status'
      ];
      const hRow = ws.addRow(headers);
      hRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle;
      });

      let trimmedLogs = partai.trimmedLogs || [];
      if (filterSpecies && filterSpecies !== 'ALL') {
        trimmedLogs = trimmedLogs.filter((t: any) => (t.species || t.rawLog?.species || '').toUpperCase().includes(filterSpecies));
      }
      if (filterStartDate) {
        trimmedLogs = trimmedLogs.filter((t: any) => new Date(t.createdAt) >= filterStartDate);
      }
      if (filterEndDate) {
        trimmedLogs = trimmedLogs.filter((t: any) => new Date(t.createdAt) <= filterEndDate);
      }

      trimmedLogs.forEach((t: any, idx: number) => {
        const d1 = t.d1 || 0;
        const d2 = t.d2 || 0;
        const d3 = t.d3 || 0;
        const d4 = t.d4 || 0;
        const avgD = (d1 || d2 || d3 || d4)
          ? Number(((d1 + d2 + d3 + d4) / ([d1, d2, d3, d4].filter(x => x > 0).length || 1)).toFixed(2))
          : 0;

        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-';
        const row = ws.addRow([
          idx + 1,
          dateStr,
          t.rawLog?.logNumber || t.rawLogId || '-',
          t.trimNumber || '-',
          t.code || '-',
          t.species || t.rawLog?.species || '-',
          Number(t.length || 0),
          d1 || '-',
          d2 || '-',
          d3 || '-',
          d4 || '-',
          avgD,
          Number(t.netVolume || 0),
          t.status || 'AVAILABLE'
        ]);
        row.eachCell((cell) => { cell.border = borderStyle; cell.font = { size: 9, name: 'Calibri' }; });
      });

      ws.columns = [
        { width: 8 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 10 }, { width: 16 },
        { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 14 }, { width: 14 }
      ];
    }

    // 3. SHEET: Input Log (Bahan Gesek Sawmill)
    if (selectedSheets.includes('input')) {
      const ws = workbook.addWorksheet('Input Log');
      ws.addRow(['KODE PARTAI', ':', partai.code || '-']);
      ws.addRow(['NAMA PARTAI', ':', partai.name || '-']);
      ws.addRow(['LAPORAN', ':', 'INPUT LOG (GESEK SAWMILL)']);
      ws.addRow([]);

      const headers = [
        'No', 'Tanggal Input', 'No. Dokumen / Batch', 'No. Log / TRM', 'Kode', 'Jenis Kayu',
        'Panjang (m)', 'D1 (cm)', 'D2 (cm)', 'D3 (cm)', 'D4 (cm)', 'Ø Rata (cm)', 'Volume (m³)'
      ];
      const hRow = ws.addRow(headers);
      hRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle;
      });

      let rowCounter = 1;
      (partai.inputLogs || []).forEach((inLog: any) => {
        const inDate = inLog.date ? new Date(inLog.date).toLocaleDateString('id-ID') : (inLog.createdAt ? new Date(inLog.createdAt).toLocaleDateString('id-ID') : '-');
        (inLog.items || []).forEach((item: any) => {
          const logRef = item.trimmedLog || item.rawLog || {};
          const spec = logRef.species || inLog.species || '-';
          if (filterSpecies && filterSpecies !== 'ALL' && !spec.toUpperCase().includes(filterSpecies)) return;
          if (filterStartDate && inLog.date && new Date(inLog.date) < filterStartDate) return;
          if (filterEndDate && inLog.date && new Date(inLog.date) > filterEndDate) return;

          const d1 = logRef.d1 || 0;
          const d2 = logRef.d2 || 0;
          const d3 = logRef.d3 || 0;
          const d4 = logRef.d4 || 0;
          const avgD = (d1 || d2 || d3 || d4)
            ? Number(((d1 + d2 + d3 + d4) / ([d1, d2, d3, d4].filter(x => x > 0).length || 1)).toFixed(2))
            : (logRef.diameter || 0);

          const row = ws.addRow([
            rowCounter++,
            inDate,
            inLog.inputNumber || inLog.code || inLog.id.slice(-6),
            logRef.trimNumber || logRef.logNumber || '-',
            logRef.code || '-',
            spec,
            Number(logRef.length || 0),
            d1 || '-',
            d2 || '-',
            d3 || '-',
            d4 || '-',
            avgD,
            Number(logRef.netVolume || logRef.grossVolume || 0)
          ]);
          row.eachCell((cell) => { cell.border = borderStyle; cell.font = { size: 9, name: 'Calibri' }; });
        });
      });

      ws.columns = [
        { width: 8 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 10 }, { width: 16 },
        { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 14 }
      ];
    }

    // 4. SHEET: Output Sawn timber
    if (selectedSheets.includes('output')) {
      const ws = workbook.addWorksheet('Output Sawn timber');
      ws.addRow(['KODE PARTAI', ':', partai.code || '-']);
      ws.addRow(['NAMA PARTAI', ':', partai.name || '-']);
      ws.addRow(['LAPORAN', ':', 'OUTPUT SAWN TIMBER']);
      ws.addRow([]);

      const headers = [
        'Tanggal', 'Shift / Operator', 'Gudang Lokasi', 'Bundel / Palet',
        'No. Input Reff', 'Produk / Jenis', 'T (cm/mm)', 'L (cm/mm)', 'P (cm/mm)',
        'Ukuran Dimensi', 'Qty (Pcs)', 'Volume (m³)', 'Partai', 'Keterangan'
      ];
      const hRow = ws.addRow(headers);
      hRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle;
      });

      (partai.sawnOutputs || []).forEach((out: any) => {
        const outDate = out.outputDate ? new Date(out.outputDate).toLocaleDateString('id-ID') : (out.createdAt ? new Date(out.createdAt).toLocaleDateString('id-ID') : '-');
        if (filterStartDate && out.outputDate && new Date(out.outputDate) < filterStartDate) return;
        if (filterEndDate && out.outputDate && new Date(out.outputDate) > filterEndDate) return;

        (out.items || []).forEach((item: any) => {
          const spec = item.timberVariant?.species || item.productType || '-';
          if (filterSpecies && filterSpecies !== 'ALL' && !spec.toUpperCase().includes(filterSpecies)) return;

          const t = item.thickness || 0;
          const w = item.width || 0;
          const l = item.length || 0;
          const dimStr = `${t} x ${w} x ${l}`;

          const row = ws.addRow([
            outDate,
            out.operator || out.shift || '-',
            out.location?.name || 'Gudang Sawmill',
            out.bundleNumber || item.bundleNumber || '-',
            out.inputLog?.inputNumber || out.inputLogId || '-',
            spec,
            t,
            w,
            l,
            dimStr,
            Number(item.quantityPcs || 0),
            Number(item.volumeM3 || 0),
            partai.code || '-',
            item.notes || out.notes || '-'
          ]);
          row.eachCell((cell) => { cell.border = borderStyle; cell.font = { size: 9, name: 'Calibri' }; });
        });
      });

      ws.columns = [
        { width: 14 }, { width: 16 }, { width: 18 }, { width: 18 },
        { width: 18 }, { width: 22 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 20 }, { width: 12 }, { width: 14 }, { width: 16 }, { width: 20 }
      ];
    }

    const safeFilename = `Partai_${(partai.code || id).replace(/[^a-zA-Z0-9_-]/g, '_')}_Export_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
