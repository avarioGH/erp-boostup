import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReservationReconciliationService } from './reservation-reconciliation.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';

@Controller('inventory/reservation-reconciliation')
@UseGuards(JwtAuthGuard)
export class ReservationReconciliationController {
  constructor(private readonly service: ReservationReconciliationService) {}

  @Get()
  @Permissions('read:inventory')
  async reconcile(
    @Query('companyId') companyId?: string,
    @Query('locationId') locationId?: string,
    @Query('timberVariantId') timberVariantId?: string,
    @Query('status') status?: string
  ) {
    const results = await this.service.reconcile({ companyId, locationId, timberVariantId, status });
    // For summary, we can optionally strip heavy arrays to save bandwidth, but returning them is fine for now
    return { data: results, count: results.length };
  }

  @Get('detail')
  @Permissions('read:inventory')
  async getDetail(
    @Query('companyId') companyId: string,
    @Query('locationId') locationId: string,
    @Query('timberVariantId') timberVariantId: string
  ) {
    // locationId can be 'NULL' string in our filter logic for legacy orders, but let's handle the query
    const results = await this.service.reconcile({ 
      companyId, 
      locationId: locationId === 'NULL' ? null : locationId, 
      timberVariantId 
    });

    if (results.length === 0) {
      return { data: null };
    }

    const row = results[0];
    
    // Format exactly as requested in Phase 37
    return {
      data: {
        companyId: row.companyId,
        locationId: row.locationId,
        timberVariantId: row.timberVariantId,
        physicalPcs: row.physicalPcs,
        physicalM3: row.physicalM3,
        actualReservedPcs: row.actualReservedPcs,
        actualReservedM3: row.actualReservedM3,
        expectedReservedPcs: row.expectedReservedPcs,
        expectedReservedM3: row.expectedReservedM3,
        availablePcs: row.availablePcs,
        availableM3: row.availableM3,
        differencePcs: row.reservationPcsDelta,
        differenceM3: row.reservationM3Delta,
        statusFlags: row.statusFlags,
        stockBatches: row.stockBatches || [],
        openOrders: row.openOrders || [],
        reservationSummary: {
          actualReservedPcs: row.actualReservedPcs,
          expectedReservedPcs: row.expectedReservedPcs,
          differencePcs: row.reservationPcsDelta
        }
      }
    };
  }
}