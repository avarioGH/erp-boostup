import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryDashboard() {
    return {
      logMasuk: {}, trimming: {}, inputProduksi: {}, hasilProduksi: {}, stock: {},
      finishedTimber: { totalPcs: 0, totalM3: 0, activeSkus: 0, locationsCount: 0 },
      rawMaterial: { rawLogsCount: 0, rawLogNetM3: 0, trimmedLogsCount: 0, inputLogNetM3: 0 },
      movements: { todayIn: 0, todayOut: 0, todayAdj: 0, todayTrf: 0 },
      stockAlerts: { lowStockCount: 0, zeroStockCount: 0, negativeStockCount: 0 },
      recentActivity: { outputs: [], transfers: [], adjustments: [] }
    };
  }
  async getDashboardSummary(companyId: string) {
    try {
      const locFilter = { location: { company_id: companyId } };
      
      const [rawLogsCount, rawLogsSum, trimmedLogsCount, trimmedLogsSum, inputLogsCount, inputLogsSum, sawnOutCount] = await Promise.all([
        this.prisma.rawLog.count({ where: locFilter }).catch(() => 0),
        this.prisma.rawLog.aggregate({ _sum: { grossVolume: true, netVolume: true }, where: locFilter }).catch(() => ({ _sum: { grossVolume: 0, netVolume: 0 } })),
        this.prisma.trimmedLog.count({ where: locFilter }).catch(() => 0),
        this.prisma.trimmedLog.aggregate({ _sum: { netVolume: true }, where: locFilter }).catch(() => ({ _sum: { netVolume: 0 } })),
        this.prisma.inputLog.count({ where: locFilter }).catch(() => 0),
        this.prisma.inputLog.aggregate({ _sum: { totalVolume: true }, where: locFilter }).catch(() => ({ _sum: { totalVolume: 0 } })),
        this.prisma.sawnTimberOutput.count({ where: locFilter }).catch(() => 0),
      ]);
      const sawnOutItemSum = await this.prisma.sawnTimberOutputItem.aggregate({ _sum: { quantityPcs: true, volumeM3: true }, where: { output: locFilter } }).catch(() => ({ _sum: { quantityPcs: 0, volumeM3: 0 } }));
      const timberStocksSum = await this.prisma.timberStock.aggregate({ _sum: { currentPcs: true, currentVolumeM3: true }, where: locFilter }).catch(() => ({ _sum: { currentPcs: 0, currentVolumeM3: 0 } }));

      return {
        logMasuk: {
          totalLogs: rawLogsCount || 0,
          grossM3: rawLogsSum._sum.grossVolume || 0,
          netM3: rawLogsSum._sum.netVolume || 0
        },
        trimming: {
          rawLogs: trimmedLogsCount || 0,
          trimmedPieces: trimmedLogsCount || 0,
          volume: trimmedLogsSum._sum.netVolume || 0
        },
        inputProduksi: {
          totalLogs: inputLogsCount || 0,
          volume: inputLogsSum._sum.totalVolume || 0
        },
        hasilProduksi: {
          totalBundles: sawnOutCount || 0,
          totalPCS: sawnOutItemSum._sum?.quantityPcs || 0,
          totalM3: sawnOutItemSum._sum?.volumeM3 || 0
        },
        currentStock: {
          currentPCS: timberStocksSum._sum?.currentPcs || 0,
          currentM3: timberStocksSum._sum?.currentVolumeM3 || 0
        }
      };
    } catch (err) {
      console.error('[ReportService] getDashboardSummary error:', err);
      return {
        logMasuk: { totalLogs: 0, grossM3: 0, netM3: 0 },
        trimming: { rawLogs: 0, trimmedPieces: 0, volume: 0 },
        inputProduksi: { totalLogs: 0, volume: 0 },
        hasilProduksi: { totalBundles: 0, totalPCS: 0, totalM3: 0 },
        currentStock: { currentPCS: 0, currentM3: 0 }
      };
    }
  }
  async getDailySawmillMonitoring(params: any) { return {}; }
  async getStockSummary(params: any) {
    const items = await this.prisma.timberStock.findMany({
      include: { location: true, timberVariant: { include: { product: true } } },
      orderBy: [{ location: { name: 'asc' } }, { timberVariant: { sku: 'asc' } }]
    }).catch(() => []);
    return items.map((s: any) => ({
      sku: s.timberVariant?.sku || 'N/A',
      product: s.timberVariant?.product?.name || s.timberVariant?.species || 'N/A',
      size: `${s.timberVariant?.thickness || 0}x${s.timberVariant?.width || 0}x${s.timberVariant?.length || 0}`,
      location: s.location?.name || 'N/A',
      qty: s.currentPcs || 0,
      m3: s.currentVolumeM3 || 0,
    }));
  }
  async getStockCard(companyId: string, variantId: string, locationId: string, batch?: string, startDate?: Date, endDate?: Date) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: locationId, company_id: companyId }
    });
    if (!warehouse) throw new BadRequestException('Location not found or access denied');

    const stockWhere: any = {
      locationId,
      timberVariantId: variantId,
      location: { company_id: companyId }
    };
    if (batch) stockWhere.batch = batch;

    const stocks = await this.prisma.timberStock.findMany({
      where: stockWhere,
      include: { timberVariant: true }
    });

    if (stocks.length === 0) {
      return {
        summary: {
          warehouseName: warehouse.name,
          variantId,
          batch: batch || 'ALL',
          openingPcs: 0,
          openingM3: 0,
          currentStockPcs: 0,
          currentStockM3: 0,
          ledgerCalculatedPcs: 0,
          ledgerCalculatedM3: 0,
          reconciliationStatus: 'NOT_AVAILABLE'
        },
        movements: []
      };
    }

    const stockIds = stocks.map(s => s.id);
    const currentStockPcs = stocks.reduce((sum, s) => sum + (s.currentPcs || 0), 0);
    const currentStockM3 = stocks.reduce((sum, s) => sum + (s.currentVolumeM3 || 0), 0);

    const isDecreasing = (type: string, refType: string) => {
      return type === 'OUT' || (type === 'ADJ' && (refType === 'ADJUSTMENT_OUT' || refType === 'REVERSAL'));
    };

    let openingPcs = 0;
    let openingM3 = 0;

    const openingMovementsWhere: any = { timberStockId: { in: stockIds } };
    if (startDate) openingMovementsWhere.createdAt = { lt: startDate };

    const openingAgg = await this.prisma.timberStockMovement.groupBy({
      by: ['type', 'referenceType'],
      where: openingMovementsWhere,
      _sum: { quantityPcs: true, volumeM3: true }
    });

    for (const agg of openingAgg) {
      const dec = isDecreasing(agg.type, agg.referenceType);
      const qty = agg._sum.quantityPcs || 0;
      const vol = agg._sum.volumeM3 || 0;
      if (dec) {
        openingPcs -= qty;
        openingM3 -= vol;
      } else {
        openingPcs += qty;
        openingM3 += vol;
      }
    }

    const periodWhere: any = { timberStockId: { in: stockIds } };
    if (startDate || endDate) {
      periodWhere.createdAt = {};
      if (startDate) periodWhere.createdAt.gte = startDate;
      if (endDate) periodWhere.createdAt.lte = endDate;
    }

    const periodMovements = await this.prisma.timberStockMovement.findMany({
      where: periodWhere,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: { timberStock: true }
    });

    let runningPcs = openingPcs;
    let runningM3 = openingM3;
    const movementRows: any[] = [];

    for (const mov of periodMovements) {
      const dec = isDecreasing(mov.type, mov.referenceType);
      const sign = dec ? -1 : 1;
      
      runningPcs += (mov.quantityPcs * sign);
      runningM3 += (mov.volumeM3 * sign);

      movementRows.push({
        id: mov.id,
        createdAt: mov.createdAt,
        type: mov.type,
        referenceType: mov.referenceType,
        referenceId: mov.referenceId,
        direction: dec ? 'OUT' : 'IN',
        batch: mov.batch,
        inPcs: !dec ? mov.quantityPcs : 0,
        outPcs: dec ? mov.quantityPcs : 0,
        inM3: !dec ? mov.volumeM3 : 0,
        outM3: dec ? mov.volumeM3 : 0,
        runningPcs,
        runningM3,
        timberStockId: mov.timberStockId,
      });
    }

    const absoluteAgg = await this.prisma.timberStockMovement.groupBy({
      by: ['type', 'referenceType'],
      where: { timberStockId: { in: stockIds } },
      _sum: { quantityPcs: true, volumeM3: true }
    });
    
    let ledgerPcs = 0;
    let ledgerM3 = 0;
    for (const agg of absoluteAgg) {
      const dec = isDecreasing(agg.type, agg.referenceType);
      const qty = agg._sum.quantityPcs || 0;
      const vol = agg._sum.volumeM3 || 0;
      if (dec) {
        ledgerPcs -= qty;
        ledgerM3 -= vol;
      } else {
        ledgerPcs += qty;
        ledgerM3 += vol;
      }
    }

    let reconciliationStatus = 'MATCH';
    if (ledgerPcs !== currentStockPcs || Math.abs(ledgerM3 - currentStockM3) > 0.0001) {
      reconciliationStatus = 'MISMATCH';
    }

    const variant = stocks[0].timberVariant;

    return {
      summary: {
        warehouseName: warehouse.name,
        variant: {
          sku: variant.sku,
          grade: variant.grade,
          dimensions: `${variant.thickness}x${variant.width}x${variant.length}`
        },
        batch: batch || 'ALL',
        openingPcs,
        openingM3,
        currentStockPcs,
        currentStockM3,
        ledgerCalculatedPcs: ledgerPcs,
        ledgerCalculatedM3: ledgerM3,
        pcsDifference: ledgerPcs - currentStockPcs,
        m3Difference: ledgerM3 - currentStockM3,
        reconciliationStatus
      },
      movements: movementRows
    };
  }
  async getYieldReport(companyId: string, params: any) {
    const { startDate, endDate, shift } = params;

    const where: any = {
      location: { company_id: companyId }
    };
    if (startDate || endDate) {
      where.outputDate = {};
      if (startDate) where.outputDate.gte = startDate;
      if (endDate) where.outputDate.lte = endDate;
    }
    if (shift) where.shift = shift;

    // Fetch POSTED outputs only — only those which have actually affected stock
    const outputs = await this.prisma.sawnTimberOutput.findMany({
      where: { ...where, status: 'POSTED' },
      include: {
        inputLog: { select: { inputNumber: true, totalVolume: true, species: true, batch: true } },
        items: { select: { volumeM3: true, grade: true } },
        location: { select: { name: true, company_id: true } }
      },
      orderBy: { outputDate: 'desc' },
      take: 200
    });

    const rows = outputs.map((o: any) => {
      const inputM3: number = o.inputLog?.totalVolume || 0;
      const outputM3: number = o.items.reduce((s: number, i: any) => {
        if (i.grade && i.grade.toUpperCase() === 'WASTE') return s;
        return s + (i.volumeM3 || 0);
      }, 0);
      const yieldPercent: number = inputM3 > 0 ? (outputM3 / inputM3) * 100 : 0;
      return {
        outputNumber: o.bundleNumber,
        inputNumber: o.inputLog?.inputNumber || '-',
        outputDate: o.outputDate,
        shift: o.shift || '-',
        warehouse: o.location?.name || '-',
        species: o.inputLog?.species || '-',
        batch: o.batch || '-',
        inputM3,
        outputM3,
        yieldPercent
      };
    });

    const uniqueInputs = new Map();
    rows.forEach(r => uniqueInputs.set(r.inputNumber, r.inputM3));
    const totalInputM3 = Array.from(uniqueInputs.values()).reduce((s: number, v: number) => s + v, 0);

    const totalOutputM3 = rows.reduce((s, r) => s + r.outputM3, 0);
    const overallYield = totalInputM3 > 0 ? (totalOutputM3 / totalInputM3) * 100 : 0;

    return {
      rows,
      summary: { totalInputM3, totalOutputM3, overallYield }
    };
  }
  async getStockAgingReport() {
    const items = await this.prisma.timberStock.findMany({
      where: { currentPcs: { gt: 0 } },
      include: { location: true, timberVariant: { include: { product: true } } }
    }).catch(() => []);
    return items.map((s: any) => ({
      sku: s.timberVariant?.sku || 'N/A',
      product: s.timberVariant?.product?.name || s.timberVariant?.species || 'N/A',
      size: `${s.timberVariant?.thickness || 0}x${s.timberVariant?.width || 0}x${s.timberVariant?.length || 0}`,
      location: s.location?.name || 'N/A',
      qty: s.currentPcs || 0,
      m3: s.currentVolumeM3 || 0,
      buckets: { '0_7': s.currentPcs || 0, '8_30': 0, '31_60': 0, '61_90': 0, '91_180': 0, '180_plus': 0 }
    }));
  }
  async getTraceabilityReport(search: string) { return null; }
}


