import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      stockAgg,
      skuCount,
      locCount,
      rawLogsCount,
      rawLogNetM3Agg,
      trimmedLogsCount,
      inputLogNetM3Agg,
      todayMovements,
      lowStockCount,
      zeroStockCount,
      negativeStockCount,
      recentOutputs,
      recentTransfers,
      recentAdjustments
    ] = await Promise.all([
      this.prisma.timberStock.aggregate({ _sum: { currentPcs: true, currentVolumeM3: true } }),
      this.prisma.timberStock.groupBy({ by: ['timberVariantId'] }),
      this.prisma.timberStock.groupBy({ by: ['locationId'] }),
      this.prisma.rawLog.count(),
      this.prisma.rawLog.aggregate({ _sum: { netVolume: true } }),
      this.prisma.trimmedLog.count(),
      this.prisma.inputLog.aggregate({ _sum: { totalVolume: true } }),
      this.prisma.timberStockMovement.findMany({ where: { date: { gte: today } } }),
      this.prisma.timberStock.count({ where: { currentPcs: { gt: 0, lte: 10 } } }), // hardcoded low stock threshold for summary
      this.prisma.timberStock.count({ where: { currentPcs: 0 } }),
      this.prisma.timberStock.count({ where: { currentPcs: { lt: 0 } } }),
      this.prisma.sawnTimberOutput.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { location: true } }),
      this.prisma.stockTransfer.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      this.prisma.stockAdjustment.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    ]);

    let todayIn = 0, todayOut = 0, todayAdj = 0, todayTrf = 0;
    todayMovements.forEach(m => {
      if (m.type === 'IN') todayIn += m.quantityPcs;
      if (m.type === 'OUT') todayOut += m.quantityPcs;
      if (m.referenceType.includes('ADJUSTMENT')) todayAdj++;
      if (m.referenceType.includes('TRANSFER')) todayTrf++;
    });

        const logMasuk = {
      totalLogs: rawLogsCount,
      grossM3: 0, // Needs aggregation, defaulting to 0 for now unless added
      netM3: rawLogNetM3Agg._sum.netVolume || 0
    };
    
    const trimming = {
      rawLogs: 0, // Placeholder
      trimmedPieces: trimmedLogsCount,
      volume: 0 // Placeholder
    };
    
    const inputProduksi = {
      totalLogs: 0, // Placeholder
      volume: inputLogNetM3Agg._sum.totalVolume || 0
    };
    
    const hasilProduksi = {
      totalBundles: recentOutputs.length,
      totalPcs: stockAgg._sum.currentPcs || 0,
      totalM3: stockAgg._sum.currentVolumeM3 || 0
    };

    const stock = {
      currentPcs: stockAgg._sum.currentPcs || 0,
      currentM3: stockAgg._sum.currentVolumeM3 || 0
    };

    return {
      logMasuk,
      trimming,
      inputProduksi,
      hasilProduksi,
      stock,
      finishedTimber: {
        totalPcs: stockAgg._sum.currentPcs || 0,
        totalM3: stockAgg._sum.currentVolumeM3 || 0,
        activeSkus: skuCount.length,
        locationsCount: locCount.length
      },
        totalPcs: stockAgg._sum.currentPcs || 0,
        totalM3: stockAgg._sum.currentVolumeM3 || 0,
        activeSkus: skuCount.length,
        locationsCount: locCount.length
      },
      rawMaterial: {
        rawLogsCount,
        rawLogNetM3: rawLogNetM3Agg._sum.netVolume || 0,
        trimmedLogsCount,
        inputLogNetM3: inputLogNetM3Agg._sum.totalVolume || 0
      },
      movements: {
        todayIn,
        todayOut,
        todayAdj,
        todayTrf
      },
      stockAlerts: { lowStockCount, zeroStockCount, negativeStockCount },
      recentActivity: {
        outputs: recentOutputs,
        transfers: recentTransfers,
        adjustments: recentAdjustments
      }
    };
  }

  async getStockSummary(params: { locationId?: string; productId?: string; search?: string }) {
    const where: any = {};
    if (params.locationId) where.locationId = params.locationId;
    if (params.productId) where.timberVariant = { productId: params.productId };
    if (params.search) {
      where.timberVariant = { ...where.timberVariant, sku: { contains: params.search, mode: 'insensitive' } };
    }

    const items = await this.prisma.timberStock.findMany({
      where,
      include: { location: true, timberVariant: { include: { product: true } } },
      orderBy: [{ location: { name: 'asc' } }, { timberVariant: { sku: 'asc' } }]
    });

    return items;
  }

  async getStockCard(variantId: string, locationId: string, startDate?: Date, endDate?: Date) {
    const stock = await this.prisma.timberStock.findUnique({
      where: { locationId_timberVariantId: { locationId, timberVariantId: variantId } },
      include: { location: true, timberVariant: { include: { product: true } } }
    });

    if (!stock) throw new Error('Stock not found');

    const start = startDate ? new Date(startDate) : new Date(0); // far past if no start
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Calculate opening balance (all movements before start date)
    const prevMovements = await this.prisma.timberStockMovement.findMany({
      where: { timberStockId: stock.id, date: { lt: start } }
    });

    let openPcs = 0;
    prevMovements.forEach(m => {
      if (m.type === 'IN') openPcs += m.quantityPcs;
      else if (m.type === 'OUT') openPcs -= m.quantityPcs;
      else if (m.type === 'ADJ') openPcs += m.quantityPcs; // ADJ is diff
    });

    // 2. Get movements in period
    const movements = await this.prisma.timberStockMovement.findMany({
      where: { timberStockId: stock.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' }
    });

    const card: any[] = [];
    // Push opening balance
    card.push({
      date: start,
      reference: 'OPENING',
      type: 'Opening Balance',
      in: 0,
      out: 0,
      balancePcs: openPcs,
      balanceM3: (openPcs * stock.timberVariant.volumePerPiece)
    });

    let currentBal = openPcs;
    movements.forEach(m => {
      let inQty = 0, outQty = 0;
      if (m.type === 'IN') { inQty = m.quantityPcs; currentBal += inQty; }
      else if (m.type === 'OUT') { outQty = m.quantityPcs; currentBal -= outQty; }
      else if (m.type === 'ADJ') {
        if (m.quantityPcs > 0) { inQty = m.quantityPcs; currentBal += inQty; }
        else { outQty = Math.abs(m.quantityPcs); currentBal -= outQty; }
      }

      card.push({
        id: m.id,
        date: m.date,
        reference: m.referenceId,
        type: m.referenceType,
        in: inQty,
        out: outQty,
        balancePcs: currentBal,
        balanceM3: (currentBal * stock.timberVariant.volumePerPiece)
      });
    });

    return { stock, card };
  }

  async getYieldReport(params: { startDate?: Date; endDate?: Date; shift?: string }) {
    // Input M3 vs Output M3
    const whereOut: any = { status: 'POSTED' };
    if (params.startDate && params.endDate) {
      whereOut.outputDate = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
    }
    if (params.shift) whereOut.shift = params.shift;

    const outputs = await this.prisma.sawnTimberOutput.findMany({
      where: whereOut,
      include: {
        inputLog: true,
        items: true
      }
    });

    const yieldMap = new Map();
    let totalInputM3 = 0;
    let totalOutputM3 = 0;

    outputs.forEach(out => {
      const input = out.inputLog;
      const key = input ? input.inputNumber : 'UNLINKED';
      if (!yieldMap.has(key)) {
        yieldMap.set(key, {
          inputNumber: key,
          shift: out.shift,
          species: input ? input.species : 'N/A',
          inputM3: input ? input.totalVolume : 0,
          outputM3: 0
        });
        if (input) totalInputM3 += input.totalVolume;
      }
      
      const outSum = out.items.reduce((sum, it) => sum + it.volumeM3, 0);
      yieldMap.get(key).outputM3 += outSum;
      totalOutputM3 += outSum;
    });

    const rows = Array.from(yieldMap.values()).map(r => ({
      ...r,
      yieldPercent: r.inputM3 > 0 ? (r.outputM3 / r.inputM3) * 100 : 0
    }));

    return {
      rows,
      summary: {
        totalInputM3,
        totalOutputM3,
        overallYield: totalInputM3 > 0 ? (totalOutputM3 / totalInputM3) * 100 : 0
      }
    };
  }

  async getStockAgingReport() {
    // FIFO Estimation Strategy
    // 1. Get current stock > 0
    // 2. Fetch IN movements ordered by date desc
    // 3. Fill buckets until stock is covered

    const stocks = await this.prisma.timberStock.findMany({
      where: { currentPcs: { gt: 0 } },
      include: { location: true, timberVariant: { include: { product: true } } }
    });

    const now = new Date();
    const rows: any[] = [];

    for (const s of stocks) {
      let remainingToAge = s.currentPcs;
      const buckets = { '0_7': 0, '8_30': 0, '31_60': 0, '61_90': 0, '91_180': 0, '180_plus': 0 };

      // We only want IN movements to see when stock arrived
      const inMovements = await this.prisma.timberStockMovement.findMany({
        where: { timberStockId: s.id, OR: [{ type: 'IN' }, { type: 'ADJ', quantityPcs: { gt: 0 } }] },
        orderBy: { date: 'desc' }
      });

      for (const m of inMovements) {
        if (remainingToAge <= 0) break;
        const alloc = Math.min(remainingToAge, m.quantityPcs);
        remainingToAge -= alloc;

        const daysOld = Math.floor((now.getTime() - m.date.getTime()) / (1000 * 3600 * 24));
        if (daysOld <= 7) buckets['0_7'] += alloc;
        else if (daysOld <= 30) buckets['8_30'] += alloc;
        else if (daysOld <= 60) buckets['31_60'] += alloc;
        else if (daysOld <= 90) buckets['61_90'] += alloc;
        else if (daysOld <= 180) buckets['91_180'] += alloc;
        else buckets['180_plus'] += alloc;
      }

      // If there's still remaining (e.g. data anomaly or opening balance before tracking), put in oldest
      if (remainingToAge > 0) {
        buckets['180_plus'] += remainingToAge;
      }

      rows.push({
        sku: s.timberVariant.sku,
        product: s.timberVariant.product?.name || s.timberVariant.species,
        size: `${s.timberVariant.thickness}x${s.timberVariant.width}x${s.timberVariant.length}`,
        location: s.location.name,
        qty: s.currentPcs,
        m3: s.currentVolumeM3,
        buckets
      });
    }

    return rows;
  }
  async getTraceabilityReport(search: string) {
    if (!search) return null;
    
    // Attempt to find by bundleNumber first (SawnTimberOutput)
    let output = await this.prisma.sawnTimberOutput.findFirst({
      where: { bundleNumber: search },
      include: {
        inputLog: {
          include: { items: { include: { trimmedLog: { include: { rawLog: true } } } } }
        },
        items: { include: { timberVariant: true } }
      }
    });

    if (output) {
      return { type: 'SAWN_OUTPUT', output };
    }

    // Attempt to find by inputNumber (InputLog)
    let input = await this.prisma.inputLog.findFirst({
      where: { inputNumber: search },
      include: {
        items: { include: { trimmedLog: { include: { rawLog: true } } } },
        sawnOutputs: { include: { items: { include: { timberVariant: true } } } }
      }
    });

    if (input) {
      return { type: 'INPUT_LOG', input };
    }

    // Attempt to find by trimNumber (TrimmedLog)
    let trimmed = await this.prisma.trimmedLog.findFirst({
      where: { OR: [{ trimNumber: search }, { barcode: search }] },
      include: {
        rawLog: true,
        inputLogItem: { include: { inputLog: { include: { sawnOutputs: true } } } }
      }
    });

    if (trimmed) {
      return { type: 'TRIMMED_LOG', trimmed };
    }

    // Attempt to find by RawLog
    let raw = await this.prisma.rawLog.findFirst({
      where: { OR: [{ logNumber: search }, { barcode: search }] },
      include: {
        trimmedLogs: { include: { inputLogItem: { include: { inputLog: true } } } }
      }
    });

    if (raw) {
      return { type: 'RAW_LOG', raw };
    }

    // Default to sku search
    let variant = await this.prisma.timberVariant.findFirst({ where: { sku: search } });
    if (variant) {
      return { type: 'SKU', variant };
    }

    return null;
  }
}




