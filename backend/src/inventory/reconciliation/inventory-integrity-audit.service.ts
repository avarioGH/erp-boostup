import { PrismaClient } from '@prisma/client';

export const AuditClassifiers = {
  classifyStockLedger(stockPcs: number, ledgerPcs: number, hasHistory: boolean, hasStock: boolean) {
    if (!hasStock && hasHistory) return 'LEDGER_WITHOUT_STOCK';
    if (hasStock && !hasHistory) return 'NO_LEDGER_HISTORY';
    if (stockPcs === ledgerPcs) return 'MATCH';
    return 'STOCK_LEDGER_MISMATCH';
  },

  classifyMovement(referenceType: string) {
    const known = [
      'TIMBER_PURCHASE', 'TIMBER_PURCHASE_REVERSAL', 
      'TIMBER_SHIPMENT', 'TIMBER_SHIPMENT_REVERSAL',
      'TRANSFER_IN', 'TRANSFER_OUT',
      'ADJUSTMENT_IN', 'ADJUSTMENT_OUT',
      'STOCK_OPNAME_ADJUSTMENT',
      'PRODUCTION_PROCESS_INPUT', 'PRODUCTION_PROCESS_OUTPUT', 'PRODUCTION_PROCESS_REVERSAL',
      'PRODUCTION_OUTPUT', 'REVERSAL'
    ];
    return known.includes(referenceType) ? 'KNOWN_SEMANTICS' : 'UNKNOWN_MOVEMENT_SEMANTICS';
  },

  classifyBatch(stockBatch: string, normalizedBatch: string) {
    if (!stockBatch) return 'MISSING_BATCH';
    if (stockBatch === normalizedBatch) return 'NORMAL';
    return 'FORMAT_VARIANT';
  },
  
  classifyReservation(stockReserved: number, expectedReserved: number) {
    if (stockReserved === expectedReserved) return 'MATCH';
    if (stockReserved > expectedReserved) return 'OVER_RESERVED';
    if (stockReserved < expectedReserved && stockReserved === 0) return 'MISSING_RESERVATION';
    if (stockReserved < expectedReserved && stockReserved > 0) return 'RESERVATION_MISMATCH';
    if (expectedReserved === 0 && stockReserved > 0) return 'UNEXPECTED_RESERVATION';
    return 'RESERVATION_MISMATCH';
  },

  classifyShipment(shipmentQty: number, relatedMovementQty: number) {
    if (shipmentQty === relatedMovementQty) return 'MATCH';
    return 'SHIPMENT_REFERENCE_MISMATCH';
  },

  classifyDuplicate(isDuplicate: boolean, isMultiItem: boolean) {
    if (isMultiItem) return 'EXPECTED_MULTI_ITEM_MOVEMENT';
    if (isDuplicate) return 'EXACT_DUPLICATE_REFERENCE';
    return 'NORMAL';
  }
};

export class InventoryIntegrityAuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async runAudit(companyId: string) {
    const report: any = {
      audit: {
        phase: '45.9A',
        mode: 'READ_ONLY',
        companyId,
        startedAt: new Date().toISOString()
      },
      summary: {},
      stockLedger: [],
      movementSemantics: [],
      negativeStock: [],
      batchIntegrity: [],
      reservationIntegrity: [],
      shipmentIntegrity: [],
      salesOrderIntegrity: [],
      purchaseIntegrity: [],
      productionIntegrity: [],
      secondaryProductionIntegrity: [],
      transferIntegrity: [],
      opnameIntegrity: [],
      adjustmentIntegrity: [],
      referenceIntegrity: [],
      duplicateMovementIntegrity: [],
      m3Reconciliation: [],
      aggregateImpact: {}
    };

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error(`Target company ${companyId} not found`);
    report.audit.companyName = company.name;

    const warehouses = await this.prisma.warehouse.findMany({ where: { company_id: companyId } });
    const locationIds = warehouses.map(w => w.id);

    // B. Negative Stock
    const stocks = await this.prisma.timberStock.findMany({
      where: { locationId: { in: locationIds } }
    });

    for (const s of stocks) {
      if (s.currentPcs < 0) {
        report.negativeStock.push({
          companyId,
          locationId: s.locationId,
          timberVariantId: s.timberVariantId,
          batch: s.batch,
          quantityPcs: s.currentPcs
        });
      }

      // D. Batch Integrity
      const normalized = s.batch ? s.batch.trim().toUpperCase() : '';
      const batchClass = AuditClassifiers.classifyBatch(s.batch || '', normalized);
      if (batchClass !== 'NORMAL') {
        report.batchIntegrity.push({
          companyId,
          locationId: s.locationId,
          timberVariantId: s.timberVariantId,
          batch: s.batch,
          classification: batchClass
        });
      }
    }

    // A. Stock ↔ Ledger
    const chunkLimit = 1000;
    const movements = await this.prisma.timberStockMovement.findMany({
      where: { timberStock: { locationId: { in: locationIds } } },
      take: chunkLimit
    });
    
    // C. Movement Semantics
    for (const m of movements) {
      if (m.referenceType) {
        const cls = AuditClassifiers.classifyMovement(m.referenceType);
        if (cls === 'UNKNOWN_MOVEMENT_SEMANTICS') {
          report.movementSemantics.push({
            id: m.id,
            referenceType: m.referenceType,
            classification: cls
          });
        }
      }
    }

    report.audit.completedAt = new Date().toISOString();
    return report;
  }
}
