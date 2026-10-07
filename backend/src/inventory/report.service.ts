import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryDashboard() {
    return {
      logMasuk: {},
      trimming: {},
      inputProduksi: {},
      hasilProduksi: {},
      stock: {},
      finishedTimber: {
        totalPcs: 0,
        totalM3: 0,
        activeSkus: 0,
        locationsCount: 0,
      },
      rawMaterial: {
        rawLogsCount: 0,
        rawLogNetM3: 0,
        trimmedLogsCount: 0,
        inputLogNetM3: 0,
      },
      movements: { todayIn: 0, todayOut: 0, todayAdj: 0, todayTrf: 0 },
      stockAlerts: {
        lowStockCount: 0,
        zeroStockCount: 0,
        negativeStockCount: 0,
      },
      recentActivity: { outputs: [], transfers: [], adjustments: [] },
    };
  }
  async getDashboardSummary() {
    try {
      const [
        rawLogsCount,
        rawLogsSum,
        trimmedLogsCount,
        trimmedLogsSum,
        inputLogsCount,
        inputLogsSum,
        sawnOutCount,
      ] = await Promise.all([
        this.prisma.rawLog.count().catch(() => 0),
        this.prisma.rawLog
          .aggregate({ _sum: { grossVolume: true, netVolume: true } })
          .catch(() => ({ _sum: { grossVolume: 0, netVolume: 0 } })),
        this.prisma.trimmedLog.count().catch(() => 0),
        this.prisma.trimmedLog
          .aggregate({ _sum: { netVolume: true } })
          .catch(() => ({ _sum: { netVolume: 0 } })),
        this.prisma.inputLog.count().catch(() => 0),
        this.prisma.inputLog
          .aggregate({ _sum: { totalVolume: true } })
          .catch(() => ({ _sum: { totalVolume: 0 } })),
        this.prisma.sawnTimberOutput.count().catch(() => 0),
      ]);
      const sawnOutItemSum = await this.prisma.sawnTimberOutputItem
        .aggregate({ _sum: { quantityPcs: true, volumeM3: true } })
        .catch(() => ({ _sum: { quantityPcs: 0, volumeM3: 0 } }));
      const timberStocksSum = await this.prisma.timberStock
        .aggregate({ _sum: { currentPcs: true, currentVolumeM3: true } })
        .catch(() => ({ _sum: { currentPcs: 0, currentVolumeM3: 0 } }));

      return {
        logMasuk: {
          totalLogs: rawLogsCount || 0,
          grossM3: rawLogsSum._sum.grossVolume || 0,
          netM3: rawLogsSum._sum.netVolume || 0,
        },
        trimming: {
          rawLogs: trimmedLogsCount || 0,
          trimmedPieces: trimmedLogsCount || 0,
          volume: trimmedLogsSum._sum.netVolume || 0,
        },
        inputProduksi: {
          totalLogs: inputLogsCount || 0,
          volume: inputLogsSum._sum.totalVolume || 0,
        },
        hasilProduksi: {
          totalBundles: sawnOutCount || 0,
          totalPCS: sawnOutItemSum._sum?.quantityPcs || 0,
          totalM3: sawnOutItemSum._sum?.volumeM3 || 0,
        },
        currentStock: {
          currentPCS: timberStocksSum._sum?.currentPcs || 0,
          currentM3: timberStocksSum._sum?.currentVolumeM3 || 0,
        },
      };
    } catch (err) {
      console.error('[ReportService] getDashboardSummary error:', err);
      return {
        logMasuk: { totalLogs: 0, grossM3: 0, netM3: 0 },
        trimming: { rawLogs: 0, trimmedPieces: 0, volume: 0 },
        inputProduksi: { totalLogs: 0, volume: 0 },
        hasilProduksi: { totalBundles: 0, totalPCS: 0, totalM3: 0 },
        currentStock: { currentPCS: 0, currentM3: 0 },
      };
    }
  }
  async getDailySawmillMonitoring(params: any) {
    return {};
  }
  async getStockSummary(params: any) {
    const items = await this.prisma.timberStock
      .findMany({
        include: {
          location: true,
          timberVariant: { include: { product: true } },
        },
        orderBy: [
          { location: { name: 'asc' } },
          { timberVariant: { sku: 'asc' } },
        ],
      })
      .catch(() => []);
    return items.map((s: any) => ({
      sku: s.timberVariant?.sku || 'N/A',
      product:
        s.timberVariant?.product?.name || s.timberVariant?.species || 'N/A',
      size: `${s.timberVariant?.thickness || 0}x${s.timberVariant?.width || 0}x${s.timberVariant?.length || 0}`,
      location: s.location?.name || 'N/A',
      qty: s.currentPcs || 0,
      m3: s.currentVolumeM3 || 0,
    }));
  }
  async getStockCard(
    variantId: string,
    locationId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const stock = await this.prisma.timberStock.findFirst({
      where: { timberVariantId: variantId, locationId },
      include: {
        location: true,
        timberVariant: { include: { product: true } },
      },
    });

    const whereMovement: any = {
      timberStock: {
        locationId,
        timberVariantId: variantId,
      },
    };
    if (startDate || endDate) {
      whereMovement.date = {};
      if (startDate) whereMovement.date.gte = startDate;
      if (endDate) whereMovement.date.lte = endDate;
    }

    const movements = await this.prisma.timberStockMovement.findMany({
      where: whereMovement,
      orderBy: { date: 'asc' },
    });

    let runningPcs = 0;
    let runningM3 = 0;
    const card = movements.map((m) => {
      const isOut =
        m.type === 'OUT' ||
        (m.type === 'ADJ' &&
          (m.referenceType === 'ADJUSTMENT_OUT' || m.referenceType === 'REVERSAL'));
      const inQty = !isOut ? m.quantityPcs : 0;
      const outQty = isOut ? m.quantityPcs : 0;
      if (!isOut) {
        runningPcs += m.quantityPcs;
        runningM3 += m.volumeM3;
      } else {
        runningPcs -= m.quantityPcs;
        runningM3 -= m.volumeM3;
      }
      return {
        id: m.id,
        date: m.date || m.createdAt,
        reference: m.referenceId || m.referenceType,
        type: m.referenceType || m.type,
        in: inQty,
        out: outQty,
        balancePcs: runningPcs,
        balanceM3: runningM3,
      };
    });

    return {
      stock: stock || {
        currentPcs: 0,
        currentVolumeM3: 0,
        timberVariant: null,
        location: null,
      },
      card,
    };
  }
  async getYieldReport(params: any) {
    return {
      rows: [],
      summary: { totalInputM3: 0, totalOutputM3: 0, overallYield: 0 },
    };
  }
  async getStockAgingReport() {
    const items = await this.prisma.timberStock
      .findMany({
        where: { currentPcs: { gt: 0 } },
        include: {
          location: true,
          timberVariant: { include: { product: true } },
        },
      })
      .catch(() => []);
    return items.map((s: any) => ({
      sku: s.timberVariant?.sku || 'N/A',
      product:
        s.timberVariant?.product?.name || s.timberVariant?.species || 'N/A',
      size: `${s.timberVariant?.thickness || 0}x${s.timberVariant?.width || 0}x${s.timberVariant?.length || 0}`,
      location: s.location?.name || 'N/A',
      qty: s.currentPcs || 0,
      m3: s.currentVolumeM3 || 0,
      buckets: {
        '0_7': s.currentPcs || 0,
        '8_30': 0,
        '31_60': 0,
        '61_90': 0,
        '91_180': 0,
        '180_plus': 0,
      },
    }));
  }
  async getTraceabilityReport(search?: string) {
    if (search) {
      // Find input log or trimmed log or sawn output matching search
      const inputLog = await this.prisma.inputLog.findUnique({
        where: { inputNumber: search },
      });
      if (inputLog) return { type: 'INPUT_LOG', ...inputLog };

      const trimmedLog = await this.prisma.trimmedLog.findFirst({
          where: { trimNumber: search },
        include: { rawLog: true },
      });
      if (trimmedLog) return { type: 'TRIMMED_LOG', ...trimmedLog };

      return { type: 'NOT_FOUND' };
    }

    const [
      sawnPcsAgg,
      purchases,
      purchaseItemsAgg,
      shipments,
      shipmentItemsAgg,
    ] = await Promise.all([
      this.prisma.sawnTimberOutputItem.aggregate({
        _sum: { quantityPcs: true, volumeM3: true },
      }),
      this.prisma.timberPurchase.count(),
      this.prisma.timberPurchaseItem.aggregate({ _sum: { quantityPcs: true } }),
      this.prisma.exportShipment.count(),
      this.prisma.exportShipmentItem.aggregate({ _sum: { qtyMc: true } }),
    ]);

    return {
      production: {
        totalOutput: sawnPcsAgg._sum.quantityPcs || 0,
        totalInputVol: sawnPcsAgg._sum.volumeM3 || 0,
        avgYield: 75,
      },
      purchases: {
        totalOrders: purchases,
        itemsReceived: purchaseItemsAgg._sum.quantityPcs || 0,
        pendingReceipts: 0,
      },
      shipments: {
        totalShipments: shipments,
        itemsShipped: shipmentItemsAgg._sum.qtyMc || 0,
        pendingShipments: 0,
      },
    };
  }

  async getInflowReport(params: {
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
  }) {
    const where: any = { status: { not: 'CANCELLED' } };
    if (params.startDate || params.endDate) {
      where.tally_date = {};
      if (params.startDate) where.tally_date.gte = new Date(params.startDate);
      if (params.endDate)
        where.tally_date.lte = new Date(params.endDate + 'T23:59:59');
    }
    if (params.warehouseId) where.warehouse_id = params.warehouseId;

    const tallies = await this.prisma.stockInTally.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { tally_date: 'desc' },
    });

    // Summary aggregation
    const totalItems = tallies.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0),
      0,
    );
    const totalTransactions = tallies.length;

    return {
      summary: { totalTransactions, totalItems },
      data: tallies,
    };
  }
}
