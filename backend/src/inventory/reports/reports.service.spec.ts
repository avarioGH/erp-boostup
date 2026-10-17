import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService - Traceability Audit', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      timberStockMovement: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      timberStock: {
        findMany: jest.fn(),
      },
      timberPartai: {
        findUnique: jest.fn(),
      },
      sawnTimberOutput: {
        findMany: jest.fn(),
      },
      productionProcess: {
        findMany: jest.fn(),
      },
      timberPurchase: {
        findMany: jest.fn(),
      },
      timberShipment: {
        findMany: jest.fn(),
      },
      stockTransfer: {
        findMany: jest.fn(),
      },
      stockAdjustment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should throw BadRequestException if companyId is missing in getTraceabilityAudit', async () => {
    await expect(service.getTraceabilityAudit({} as any)).rejects.toThrow(
      'Tenant company ID is required for traceability audit',
    );
  });

  it('should throw BadRequestException if companyId is missing in getTraceabilityReconciliationPreview', async () => {
    await expect(service.getTraceabilityReconciliationPreview({} as any)).rejects.toThrow(
      'Tenant company ID is required for reconciliation preview',
    );
  });

  it('should classify movement as VERIFIED when batch matches referenced SawnTimberOutput partai', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov1',
        date: new Date('2026-03-01'),
        type: 'IN',
        referenceType: 'PRODUCTION_OUTPUT',
        referenceId: 'sawn1',
        batch: 'PARTAI-A',
        quantityPcs: 10,
        volumeM3: 0.5,
        timberStock: {
          location: { id: 'loc1', name: 'Gudang Basah', code: 'GB' },
          timberVariant: { id: 'var1', sku: 'MC-2x10x400' },
        },
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    prisma.timberStock.findMany.mockResolvedValue([
      { id: 'stk1', batch: 'PARTAI-A', currentPcs: 10, currentVolumeM3: 0.5 },
    ]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([
      {
        id: 'sawn1',
        bundleNumber: 'BNDL-001',
        partaiId: 'p1',
        partai: { code: 'PARTAI-A' },
      },
    ]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({ companyId: 'cmp-1' });

    expect(result.summary.verifiedCount).toBe(1);
    expect(result.summary.ambiguousCount).toBe(0);
    expect(result.summary.inconsistentCount).toBe(0);
    expect(result.summary.unknownCount).toBe(0);
    expect(result.summary.currentStockPcs).toBe(10);
    expect(result.summary.currentStockM3).toBe(0.5);

    expect(result.data[0].classification).toBe('VERIFIED');
    expect(result.data[0].sourceDocNo).toBe('BNDL-001');
    expect(result.data[0].evidence).toContain('Verified against SawnTimberOutput');
  });

  it('should classify movement as INCONSISTENT when batch conflicts with referenced document', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov2',
        date: new Date('2026-03-02'),
        type: 'IN',
        referenceType: 'PRODUCTION_PROCESS_OUTPUT',
        referenceId: 'proc1',
        batch: 'BATCH-KD-WRONG',
        quantityPcs: 5,
        volumeM3: 0.25,
        timberStock: null,
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    prisma.timberStock.findMany.mockResolvedValue([]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([
      {
        id: 'proc1',
        processNo: 'PRC-001',
        partaiId: 'p1',
        partai: { code: 'PARTAI-REAL' },
      },
    ]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({ companyId: 'cmp-1' });

    expect(result.summary.inconsistentCount).toBe(1);
    expect(result.data[0].classification).toBe('INCONSISTENT');
    expect(result.data[0].evidence).toContain('conflicts with process partai');
  });

  it('should classify movement as AMBIGUOUS when upstream document exists but lacks partai/batch specification', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov3',
        date: new Date('2026-03-03'),
        type: 'OUT',
        referenceType: 'TIMBER_SHIPMENT',
        referenceId: 'ship1',
        batch: 'PARTAI-X',
        quantityPcs: 8,
        volumeM3: 0.4,
        timberStock: null,
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    prisma.timberStock.findMany.mockResolvedValue([]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([
      {
        id: 'ship1',
        shipmentNumber: 'SJ-001',
        partaiId: null,
        partai: null,
      },
    ]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({ companyId: 'cmp-1' });

    expect(result.summary.ambiguousCount).toBe(1);
    expect(result.data[0].classification).toBe('AMBIGUOUS');
    expect(result.data[0].evidence).toContain('no linked partaiId');
  });

  it('should classify movement as UNKNOWN when referenceId is missing or referenced document does not exist', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov4',
        date: new Date('2026-03-04'),
        type: 'ADJ',
        referenceType: 'OPENING_BALANCE',
        referenceId: '',
        batch: 'UNKNOWN',
        quantityPcs: 100,
        volumeM3: 5.0,
        timberStock: null,
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    prisma.timberStock.findMany.mockResolvedValue([]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({ companyId: 'cmp-1' });

    expect(result.summary.unknownCount).toBe(1);
    expect(result.data[0].classification).toBe('UNKNOWN');
    expect(result.data[0].evidence).toContain('Missing reference document');
  });

  it('should support pagination and classification filtering correctly', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      { id: 'm1', referenceType: 'OPENING_BALANCE', referenceId: '', batch: 'UNKNOWN', quantityPcs: 1, volumeM3: 0.1 },
      { id: 'm2', referenceType: 'OPENING_BALANCE', referenceId: '', batch: 'UNKNOWN', quantityPcs: 2, volumeM3: 0.2 },
      { id: 'm3', referenceType: 'OPENING_BALANCE', referenceId: '', batch: 'UNKNOWN', quantityPcs: 3, volumeM3: 0.3 },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(3);
    prisma.timberStock.findMany.mockResolvedValue([
      { id: 'stk1', batch: 'UNKNOWN', currentPcs: 6, currentVolumeM3: 0.6 },
    ]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const page1 = await service.getTraceabilityAudit({ companyId: 'cmp-1', page: 1, limit: 2, classification: 'UNKNOWN' });
    expect(page1.data.length).toBe(2);
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.totalPages).toBe(2);
    expect(page1.pagination.totalRecords).toBe(3);

    const page2 = await service.getTraceabilityAudit({ companyId: 'cmp-1', page: 2, limit: 2, classification: 'UNKNOWN' });
    expect(page2.data.length).toBe(1);
    expect(page2.pagination.page).toBe(2);
  });

  it('should isolate data by companyId when companyId is provided', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([]);
    prisma.timberStockMovement.count.mockResolvedValue(0);
    prisma.timberStock.findMany.mockResolvedValue([]);
    prisma.timberPartai.findFirst = jest.fn().mockResolvedValue({ id: 'p1', code: 'PARTAI-CMP' });
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    await service.getTraceabilityAudit({ companyId: 'company-123', partaiId: 'p1' });

    expect(prisma.timberStockMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          timberStock: expect.objectContaining({
            location: { company_id: 'company-123' },
          }),
        }),
      }),
    );

    expect(prisma.timberStock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          location: { company_id: 'company-123' },
        }),
      }),
    );

    expect(prisma.timberPartai.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1', company_id: 'company-123' },
      }),
    );
  });

  it('should disambiguate multi-item StockTransfer by timberVariantId', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov-trf-1',
        date: new Date('2026-03-05'),
        type: 'IN',
        referenceType: 'TRANSFER_IN',
        referenceId: 'trf-multi',
        batch: 'BATCH-VAR-A',
        quantityPcs: 10,
        volumeM3: 0.5,
        timberStock: {
          timberVariantId: 'var-A',
          location: { id: 'loc1', name: 'Gudang A' },
          timberVariant: { id: 'var-A', sku: 'SKU-A' },
        },
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    prisma.timberStock.findMany.mockResolvedValue([]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
    prisma.productionProcess.findMany.mockResolvedValue([]);
    prisma.timberPurchase.findMany.mockResolvedValue([]);
    prisma.timberShipment.findMany.mockResolvedValue([]);
    prisma.stockTransfer.findMany.mockResolvedValue([
      {
        id: 'trf-multi',
        transferNumber: 'TRF-001',
        items: [
          { timberVariantId: 'var-A', batch: 'BATCH-VAR-A', quantityPcs: 10, volumeM3: 0.5 },
          { timberVariantId: 'var-B', batch: 'BATCH-VAR-B', quantityPcs: 20, volumeM3: 1.0 },
        ],
      },
    ]);
    prisma.stockAdjustment.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({ companyId: 'cmp-1' });

    expect(result.data[0].classification).toBe('VERIFIED');
    expect(result.data[0].evidence).toContain('Verified against StockTransfer TRF-001 line item batch');
  });

  it('should preserve physical stock totals regardless of movement date or reference filters', async () => {
    prisma.timberStockMovement.findMany.mockResolvedValue([
      {
        id: 'mov-filtered',
        date: new Date('2026-03-01'),
        type: 'IN',
        referenceType: 'PRODUCTION_OUTPUT',
        referenceId: 'sawn-filt',
        batch: 'BATCH-FILTERED',
        quantityPcs: 10,
        volumeM3: 0.5,
      },
    ]);
    prisma.timberStockMovement.count.mockResolvedValue(1);
    // 3 physical stock buckets total 100 pcs and 5.0 m3
    prisma.timberStock.findMany.mockResolvedValue([
      { id: 'stk1', batch: 'BATCH-A', currentPcs: 30, currentVolumeM3: 1.5 },
      { id: 'stk2', batch: 'BATCH-B', currentPcs: 50, currentVolumeM3: 2.5 },
      { id: 'stk3', batch: 'UNKNOWN', currentPcs: 20, currentVolumeM3: 1.0 },
    ]);
    prisma.sawnTimberOutput.findMany.mockResolvedValue([]);

    const result = await service.getTraceabilityAudit({
      companyId: 'company-123',
      dateFrom: '2026-03-01',
      dateTo: '2026-03-02',
      referenceType: 'PRODUCTION_OUTPUT',
    });

    // Physical stock totals must represent total actual TimberStock, NOT movement subset
    expect(result.summary.currentStockPcs).toBe(100);
    expect(result.summary.currentStockM3).toBe(5.0);
    expect(result.summary.totalMovements).toBe(1);
  });

  describe('getTraceabilityReconciliationPreview', () => {
    it('should generate an ELIGIBLE proposal for VERIFIED record when source UNKNOWN bucket has sufficient balance', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-rec-1',
          date: new Date('2026-03-06'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-rec-1',
          batch: 'PARTAI-OK',
          quantityPcs: 15,
          volumeM3: 0.75,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);

      // Current stocks: UNKNOWN bucket has 20 pcs (sufficient for 15), target bucket has 5 pcs
      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 20, currentVolumeM3: 1.0 },
        { id: 'stk-target', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'PARTAI-OK', currentPcs: 5, currentVolumeM3: 0.25 },
      ]);

      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-rec-1', bundleNumber: 'BNDL-REC', partaiId: 'p-rec', partai: { code: 'PARTAI-OK' } },
      ]);
      prisma.productionProcess.findMany.mockResolvedValue([]);
      prisma.timberPurchase.findMany.mockResolvedValue([]);
      prisma.timberShipment.findMany.mockResolvedValue([]);
      prisma.stockTransfer.findMany.mockResolvedValue([]);
      prisma.stockAdjustment.findMany.mockResolvedValue([]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1', warehouseId: 'loc-1' });

      expect(preview.mode).toBe('DRY_RUN_PREVIEW');
      expect(preview.isReadOnly).toBe(true);
      expect(preview.summary.eligibleCount).toBe(1);
      expect(preview.summary.ineligibleCount).toBe(0);

      const prop = preview.proposals[0];
      expect(prop.eligible).toBe(true);
      expect(prop.proposedReallocation.sourceBucket.beforePcs).toBe(20);
      expect(prop.proposedReallocation.sourceBucket.afterPcs).toBe(5);
      expect(prop.proposedReallocation.targetBucket.beforePcs).toBe(5);
      expect(prop.proposedReallocation.targetBucket.afterPcs).toBe(20);
      expect(prop.proposedReallocation.netPhysicalDelta.pcs).toBe(0);
      expect(prop.proposedReallocation.netPhysicalDelta.isBalanced).toBe(true);
    });

    it('should REJECT proposals for AMBIGUOUS, UNKNOWN, or INCONSISTENT records', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-amb-1',
          date: new Date('2026-03-07'),
          type: 'OUT',
          referenceType: 'TIMBER_SHIPMENT',
          referenceId: 'ship-no-partai',
          batch: 'PARTAI-Z',
          quantityPcs: 5,
          volumeM3: 0.25,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);
      prisma.timberStock.findMany.mockResolvedValue([]);
      prisma.sawnTimberOutput.findMany.mockResolvedValue([]);
      prisma.productionProcess.findMany.mockResolvedValue([]);
      prisma.timberPurchase.findMany.mockResolvedValue([]);
      prisma.timberShipment.findMany.mockResolvedValue([
        { id: 'ship-no-partai', shipmentNumber: 'SJ-999', partaiId: null, partai: null, items: [] },
      ]);
      prisma.stockTransfer.findMany.mockResolvedValue([]);
      prisma.stockAdjustment.findMany.mockResolvedValue([]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(0);
      expect(preview.summary.ineligibleCount).toBe(1);
      expect(preview.proposals[0].eligible).toBe(false);
      expect(preview.proposals[0].rejectionReason).toContain('strictly restricted to VERIFIED records');
    });

    it('should REJECT proposal if source UNKNOWN bucket balance is insufficient', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-rec-short',
          date: new Date('2026-03-08'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-rec-short',
          batch: 'PARTAI-OK',
          quantityPcs: 50,
          volumeM3: 2.5,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);

      // UNKNOWN bucket only has 10 pcs, but movement asks for 50
      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 10, currentVolumeM3: 0.5 },
      ]);

      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-rec-short', bundleNumber: 'BNDL-SHORT', partaiId: 'p-ok', partai: { code: 'PARTAI-OK' } },
      ]);
      prisma.productionProcess.findMany.mockResolvedValue([]);
      prisma.timberPurchase.findMany.mockResolvedValue([]);
      prisma.timberShipment.findMany.mockResolvedValue([]);
      prisma.stockTransfer.findMany.mockResolvedValue([]);
      prisma.stockAdjustment.findMany.mockResolvedValue([]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(0);
      expect(preview.summary.ineligibleCount).toBe(1);
      expect(preview.proposals[0].eligible).toBe(false);
      expect(preview.proposals[0].rejectionReason).toContain('insufficient balance');
    });

    it('should REJECT proposal if movement type is OUT (provenance check)', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-out-1',
          date: new Date('2026-03-09'),
          type: 'OUT',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-out-1',
          batch: 'PARTAI-OK',
          quantityPcs: 10,
          volumeM3: 0.5,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);
      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 100, currentVolumeM3: 5.0 },
      ]);
      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-out-1', bundleNumber: 'BNDL-OUT', partaiId: 'p-ok', partai: { code: 'PARTAI-OK' } },
      ]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(0);
      expect(preview.summary.ineligibleCount).toBe(1);
      expect(preview.proposals[0].eligible).toBe(false);
      expect(preview.proposals[0].identityVerified).toBe(true);
      expect(preview.proposals[0].remainingQuantityProven).toBe(false);
      expect(preview.proposals[0].rejectionReason).toContain('non-inflow records cannot establish remaining physical stock provenance');
    });

    it('should evaluate aggregate capacity cumulatively and reject second proposal when shared bucket is exhausted', async () => {
      // Two VERIFIED movements for the same location and variant:
      // Movement 1 demands 15 pcs
      // Movement 2 demands 10 pcs
      // Source UNKNOWN bucket has 20 pcs initially.
      // Expected: Movement 1 succeeds (leaves 5 pcs remaining). Movement 2 is rejected due to cumulative exhaustion.
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-cum-1',
          date: new Date('2026-03-01'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-cum-1',
          batch: 'PARTAI-BATCH-1',
          quantityPcs: 15,
          volumeM3: 0.75,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
        {
          id: 'mov-cum-2',
          date: new Date('2026-03-02'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-cum-2',
          batch: 'PARTAI-BATCH-2',
          quantityPcs: 10,
          volumeM3: 0.5,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(2);

      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 20, currentVolumeM3: 1.0 },
      ]);

      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-cum-1', bundleNumber: 'BNDL-CUM-1', partaiId: 'p1', partai: { code: 'PARTAI-BATCH-1' } },
        { id: 'sawn-cum-2', bundleNumber: 'BNDL-CUM-2', partaiId: 'p2', partai: { code: 'PARTAI-BATCH-2' } },
      ]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.totalEvaluated).toBe(2);
      expect(preview.summary.eligibleCount).toBe(1);
      expect(preview.summary.ineligibleCount).toBe(1);

      // Proposal 1: accepted
      const prop1 = preview.proposals[0];
      expect(prop1.eligible).toBe(true);
      expect(prop1.proposedReallocation.sourceBucket.beforePcs).toBe(20);
      expect(prop1.proposedReallocation.sourceBucket.afterPcs).toBe(5);

      // Proposal 2: rejected due to cumulative capacity exhaustion
      const prop2 = preview.proposals[1];
      expect(prop2.eligible).toBe(false);
      expect(prop2.rejectionReason).toContain('Cumulative capacity exhausted');
      expect(prop2.rejectionReason).toContain('15 pcs already allocated');
      expect(prop2.proposedReallocation.sourceBucket.remainingPcs).toBe(5);
    });

    it('should correctly accumulate target bucket balance across multiple proposals targeting the same batch', async () => {
      // Two VERIFIED movements targeting the same verified batch PARTAI-SHARED:
      // Movement 1: 10 pcs
      // Movement 2: 5 pcs
      // Initial UNKNOWN: 30 pcs. Initial TARGET: 10 pcs.
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-shr-1',
          date: new Date('2026-03-01'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-shr-1',
          batch: 'PARTAI-SHARED',
          quantityPcs: 10,
          volumeM3: 0.5,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
        {
          id: 'mov-shr-2',
          date: new Date('2026-03-02'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-shr-2',
          batch: 'PARTAI-SHARED',
          quantityPcs: 5,
          volumeM3: 0.25,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(2);

      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 30, currentVolumeM3: 1.5 },
        { id: 'stk-target', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'PARTAI-SHARED', currentPcs: 10, currentVolumeM3: 0.5 },
      ]);

      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-shr-1', bundleNumber: 'BNDL-SHR-1', partaiId: 'ps', partai: { code: 'PARTAI-SHARED' } },
        { id: 'sawn-shr-2', bundleNumber: 'BNDL-SHR-2', partaiId: 'ps', partai: { code: 'PARTAI-SHARED' } },
      ]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(2);

      const prop1 = preview.proposals[0];
      expect(prop1.proposedReallocation.targetBucket.beforePcs).toBe(10);
      expect(prop1.proposedReallocation.targetBucket.afterPcs).toBe(20);

      const prop2 = preview.proposals[1];
      // Target beforePcs reflects the running balance updated by prop1
      expect(prop2.proposedReallocation.targetBucket.beforePcs).toBe(20);
      expect(prop2.proposedReallocation.targetBucket.afterPcs).toBe(25);
    });

    it('should be strictly read-only and never call mutation methods on prisma', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([]);
      prisma.timberStockMovement.count.mockResolvedValue(0);
      prisma.timberStock.findMany.mockResolvedValue([]);

      await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      // Verify no write methods exist or were invoked
      expect(prisma.timberStockMovement.create).toBeUndefined();
      expect(prisma.timberStockMovement.update).toBeUndefined();
      expect(prisma.timberStock.update).toBeUndefined();
    });

    it('should REJECT proposal when PCS capacity is sufficient but Volume M3 capacity is exhausted', async () => {
      // Source UNKNOWN bucket has 50 pcs (sufficient for 10 pcs) but only 0.2 m3 (insufficient for 0.5 m3)
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-vol-short',
          date: new Date('2026-03-10'),
          type: 'IN',
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: 'sawn-vol-short',
          batch: 'PARTAI-VOL',
          quantityPcs: 10,
          volumeM3: 0.5,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);

      prisma.timberStock.findMany.mockResolvedValue([
        { id: 'stk-unknown', locationId: 'loc-1', timberVariantId: 'var-1', batch: 'UNKNOWN', currentPcs: 50, currentVolumeM3: 0.2 },
      ]);

      prisma.sawnTimberOutput.findMany.mockResolvedValue([
        { id: 'sawn-vol-short', bundleNumber: 'BNDL-VOL', partaiId: 'p-vol', partai: { code: 'PARTAI-VOL' } },
      ]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(0);
      expect(preview.summary.ineligibleCount).toBe(1);

      const prop = preview.proposals[0];
      expect(prop.eligible).toBe(false);
      expect(prop.identityVerified).toBe(true);
      expect(prop.remainingQuantityProven).toBe(true);
      expect(prop.rejectionReason).toContain('insufficient volume');
      expect(prop.rejectionReason).toContain('0.2000 m³');
    });

    it('should explicitly distinguish identityVerified from remainingQuantityProven on non-verified records', async () => {
      prisma.timberStockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-unver-1',
          date: new Date('2026-03-11'),
          type: 'IN',
          referenceType: 'TIMBER_SHIPMENT',
          referenceId: 'ship-no-match',
          batch: 'UNKNOWN',
          quantityPcs: 20,
          volumeM3: 1.0,
          timberStock: {
            timberVariantId: 'var-1',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Gudang 1' },
            timberVariant: { id: 'var-1', sku: 'SKU-1' },
          },
        },
      ]);
      prisma.timberStockMovement.count.mockResolvedValue(1);
      prisma.timberStock.findMany.mockResolvedValue([]);
      prisma.timberShipment.findMany.mockResolvedValue([]);

      const preview = await service.getTraceabilityReconciliationPreview({ companyId: 'cmp-1' });

      expect(preview.summary.eligibleCount).toBe(0);
      expect(preview.summary.ineligibleCount).toBe(1);

      const prop = preview.proposals[0];
      expect(prop.eligible).toBe(false);
      expect(prop.identityVerified).toBe(false);
      expect(prop.remainingQuantityProven).toBe(false);
      expect(prop.classification).toBe('UNKNOWN');
    });
  });
});
