import { Injectable } from '@nestjs/common';
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
  async getDashboardSummary() {
    const rawLogsCount = await this.prisma.rawLog.count();
    const rawLogsSum = await this.prisma.rawLog.aggregate({ _sum: { grossVolume: true, netVolume: true } });

    const trimmedLogsCount = await this.prisma.trimmedLog.count();
    const trimmedLogsSum = await this.prisma.trimmedLog.aggregate({ _sum: { netVolume: true } });

    const inputLogsCount = await this.prisma.inputLog.count();
    const inputLogsSum = await this.prisma.inputLog.aggregate({ _sum: { totalVolume: true } });

    const sawnOutCount = await this.prisma.sawnTimberOutput.count();
    const sawnOutItemSum = await this.prisma.sawnTimberOutputItem.aggregate({ _sum: { quantityPcs: true, volumeM3: true } }).catch(() => ({ _sum: { quantityPcs: 0, volumeM3: 0 } }));

    const timberStocksSum = await this.prisma.timberStock.aggregate({ _sum: { currentPcs: true, currentVolumeM3: true } }).catch(() => ({ _sum: { currentPcs: 0, currentVolumeM3: 0 } }));

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
  }
  async getDailySawmillMonitoring(params: any) { return {}; }
  async getStockSummary(params: any) { return []; }
  async getStockCard(variantId: string, locationId: string, startDate?: Date, endDate?: Date) {
    return { stock: {}, card: [] };
  }
  async getYieldReport(params: any) {
    return { rows: [], summary: { totalInputM3: 0, totalOutputM3: 0, overallYield: 0 } };
  }
  async getStockAgingReport() { return []; }
  async getTraceabilityReport(search: string) { return null; }
}
