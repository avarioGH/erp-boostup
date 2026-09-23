import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    // Current server time and timezone boundaries
    const now = new Date();
    // Using simple local start/end of day since it runs on the server timezone
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. stock: { totalPcs, totalM3 }
    const stockAgg = await this.prisma.timberStock.aggregate({
      _sum: { currentPcs: true, currentVolumeM3: true },
    });
    const stock = {
      totalPcs: stockAgg._sum.currentPcs || 0,
      totalM3: stockAgg._sum.currentVolumeM3 || 0,
    };

    // 2. warehouseSummary: Array of { warehouseName, pcs, m3 }
    const warehouseData = await this.prisma.timberStock.groupBy({
      by: ['locationId'],
      _sum: { currentPcs: true, currentVolumeM3: true },
    });
    
    const warehouseSummary = await Promise.all(
      warehouseData.map(async (w) => {
        const loc = await this.prisma.warehouse.findUnique({ where: { id: w.locationId } });
        return {
          warehouseName: loc?.name || 'Unknown',
          pcs: w._sum.currentPcs || 0,
          m3: w._sum.currentVolumeM3 || 0,
        };
      })
    );

    // 3. today: { inflowM3, outflowM3, productionM3, shipmentM3, purchaseM3 }
    const todayMovements = await this.prisma.timberStockMovement.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { type: true, referenceType: true, volumeM3: true },
    });

    const today = {
      inflowM3: 0,
      outflowM3: 0,
      productionM3: 0,
      shipmentM3: 0,
      purchaseM3: 0,
    };

    for (const mov of todayMovements) {
      if (mov.type === 'IN') today.inflowM3 += mov.volumeM3;
      if (mov.type === 'OUT') today.outflowM3 += mov.volumeM3;
      
      if (['PRODUCTION_OUTPUT', 'PRODUCTION_PROCESS_OUTPUT'].includes(mov.referenceType)) {
        today.productionM3 += mov.volumeM3;
      }
      if (mov.referenceType === 'TIMBER_SHIPMENT') {
        today.shipmentM3 += mov.volumeM3;
      }
      if (mov.referenceType === 'TIMBER_PURCHASE') {
        today.purchaseM3 += mov.volumeM3;
      }
    }

    // 4. recentMovements: Last 10 from TimberStockMovement
    const recentMovements = await this.prisma.timberStockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        timberStock: {
          include: {
            timberVariant: {
              include: { timberSpecies: true, timberGrade: true }
            },
            location: true,
          }
        }
      }
    });

    // 5. ledgerHealth: "BALANCED" or "MISMATCH DETECTED"
    // Run a quick DB sum on movements vs stock to check if they match.
    const allMovementsAgg = await this.prisma.timberStockMovement.groupBy({
      by: ['type'],
      _sum: { quantityPcs: true },
    });
    
    let movementPcs = 0;
    for (const agg of allMovementsAgg) {
      if (agg.type === 'IN') movementPcs += (agg._sum.quantityPcs || 0);
      else if (agg.type === 'OUT') movementPcs -= (agg._sum.quantityPcs || 0);
      else if (agg.type === 'ADJ') movementPcs += (agg._sum.quantityPcs || 0); 
    }
    
    const stockSums = await this.prisma.timberStock.aggregate({
      _sum: {
        openingPcs: true,
        currentPcs: true,
      }
    });
    
    const expectedCurrentPcs = (stockSums._sum.openingPcs || 0) + movementPcs;
    const actualCurrentPcs = stockSums._sum.currentPcs || 0;
    
    const ledgerHealth = expectedCurrentPcs === actualCurrentPcs ? 'BALANCED' : 'MISMATCH DETECTED';

    return {
      stock,
      warehouseSummary,
      today,
      recentMovements,
      ledgerHealth,
    };
  }
}
