import { Test, TestingModule } from '@nestjs/testing';
import {
  BatchReclassificationService,
  EvaluateEligibilityDto,
  ExecuteReclassificationDto,
} from './batch-reclassification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('BatchReclassificationService - Phase 04.3.4 Tests', () => {
  let service: BatchReclassificationService;
  let ledger: InventoryLedgerService;

  const mockPrisma: any = {
    $transaction: jest.fn(async (callback) => callback(mockPrisma)),
    warehouse: {
      findFirst: jest.fn(),
    },
    timberPartai: {
      findFirst: jest.fn(),
    },
    timberStock: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    timberBatchReclassification: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockLedger: any = {
    createMovement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchReclassificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryLedgerService, useValue: mockLedger },
      ],
    }).compile();

    service = module.get<BatchReclassificationService>(
      BatchReclassificationService,
    );
    ledger = module.get<InventoryLedgerService>(InventoryLedgerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. ELIGIBILITY EVALUATION TESTS
  // =========================================================================
  describe('1. Eligibility Evaluation (Unified Decision Table)', () => {
    const defaultDto: EvaluateEligibilityDto = {
      warehouseId: 'wh-1',
      timberVariantId: 'var-1',
      targetPartaiCode: 'PTY-2026-001',
      requestedPcs: 10,
      requestedVolumeM3: 0.25,
      physicalVerificationType: 'PHYSICAL_OPNAME_APPROVED',
      physicalVerificationRef: 'OPN-101',
      hasOutflowHistory: false,
      hasMultiInflowMixed: false,
    };

    it('1.1 - Returns ELIGIBLE when evidence, active Partai, and stock match', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 0.5,
      });

      const res = await service.evaluateEligibility('comp-1', defaultDto);

      expect(res.status).toBe('ELIGIBLE');
      expect(res.maxEligiblePcs).toBe(10);
      expect(res.maxEligibleVolumeM3).toBe(0.25);
    });

    it('1.2 - Returns REJECTED when target Partai is COMPLETED or CANCELLED', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'COMPLETED',
        company_id: 'comp-1',
      });

      const res = await service.evaluateEligibility('comp-1', defaultDto);

      expect(res.status).toBe('REJECTED');
      expect(res.reason).toMatch(/Only ACTIVE Partais are eligible/);
    });

    it('1.3 - Returns REJECTED when UNKNOWN stock is insufficient', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 5,
        currentVolumeM3: 0.1,
      });

      const res = await service.evaluateEligibility('comp-1', defaultDto);

      expect(res.status).toBe('REJECTED');
      expect(res.reason).toMatch(/Insufficient UNKNOWN stock/);
    });

    it('1.4 - Returns MANUAL_REVIEW when no physical evidence is provided', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 0.5,
      });

      const dtoWithoutEvidence: EvaluateEligibilityDto = {
        ...defaultDto,
        physicalVerificationType: 'NONE',
        physicalVerificationRef: undefined,
      };

      const res = await service.evaluateEligibility('comp-1', dtoWithoutEvidence);

      expect(res.status).toBe('MANUAL_REVIEW');
      expect(res.reason).toMatch(/Provenance cannot be proven solely by numerical stock availability/);
    });

    it('1.5 - Returns MANUAL_REVIEW when multi-inflow is mixed', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 0.5,
      });

      const dtoMixed: EvaluateEligibilityDto = {
        ...defaultDto,
        hasMultiInflowMixed: true,
      };

      const res = await service.evaluateEligibility('comp-1', dtoMixed);

      expect(res.status).toBe('MANUAL_REVIEW');
      expect(res.reason).toMatch(/multiple mixed inflow sources/);
    });

    it('1.6 - Outflow history: ELIGIBLE only up to physically verified remaining lot', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 0.5,
      });

      // Physically verified 8 pcs remaining from audited tally
      const dtoWithOutflow: EvaluateEligibilityDto = {
        ...defaultDto,
        hasOutflowHistory: true,
        physicalVerifiedPcs: 8,
        physicalVerifiedVolumeM3: 0.2,
        requestedPcs: 8,
        requestedVolumeM3: 0.2,
      };

      const res = await service.evaluateEligibility('comp-1', dtoWithOutflow);

      expect(res.status).toBe('ELIGIBLE');
      expect(res.maxEligiblePcs).toBe(8);
      expect(res.maxEligibleVolumeM3).toBe(0.2);
    });

    it('1.7 - Outflow history: MANUAL_REVIEW when requested quantity exceeds verified remaining lot', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 0.5,
      });

      const dtoWithOutflowOver: EvaluateEligibilityDto = {
        ...defaultDto,
        hasOutflowHistory: true,
        physicalVerifiedPcs: 8,
        physicalVerifiedVolumeM3: 0.2,
        requestedPcs: 10, // Requesting more than the verified 8 pcs
        requestedVolumeM3: 0.25,
      };

      const res = await service.evaluateEligibility('comp-1', dtoWithOutflowOver);

      expect(res.status).toBe('MANUAL_REVIEW');
      expect(res.reason).toMatch(/Requested reclassification exceeds physically verified remaining quantity/);
    });
  });

  // =========================================================================
  // 2. ZERO-DELTA ATOMIC EXECUTION TESTS
  // =========================================================================
  describe('2. Atomic Zero-Delta Execution', () => {
    const executeDto: ExecuteReclassificationDto = {
      idempotencyKey: 'idem-101',
      warehouseId: 'wh-1',
      timberVariantId: 'var-1',
      targetPartaiCode: 'PTY-2026-001',
      quantityPcs: 15,
      volumeM3: 0.35,
      reason: 'Physical opname verified bundle marks',
      evidenceType: 'PHYSICAL_OPNAME_APPROVED',
      evidenceRef: 'OPN-101',
    };

    it('2.1 - Executes exact dual movements (OUT UNKNOWN and IN Target Partai) preserving delta zero', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue(null);
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 30,
        currentVolumeM3: 0.8,
      });
      mockPrisma.timberBatchReclassification.count.mockResolvedValue(0);
      mockPrisma.timberBatchReclassification.create.mockResolvedValue({
        id: 'rec-1',
        reclassNumber: 'BRC-1001',
        status: 'POSTED',
      });

      const result = await service.executeReclassification('comp-1', 'user-1', executeDto);

      expect(result.isIdempotentReplay).toBe(false);
      expect(result.reclassification.id).toBe('rec-1');

      // Verify Dual Movements with identical quantities
      expect(mockLedger.createMovement).toHaveBeenCalledTimes(2);

      // Movement 1: OUT from UNKNOWN
      expect(mockLedger.createMovement).toHaveBeenNthCalledWith(
        1,
        mockPrisma,
        'wh-1',
        'var-1',
        'OUT',
        'BATCH_RECLASSIFICATION',
        'rec-1',
        15,
        0.35,
        'UNKNOWN',
      );

      // Movement 2: IN to Target Partai
      expect(mockLedger.createMovement).toHaveBeenNthCalledWith(
        2,
        mockPrisma,
        'wh-1',
        'var-1',
        'IN',
        'BATCH_RECLASSIFICATION',
        'rec-1',
        15,
        0.35,
        'PTY-2026-001',
      );
    });

    it('2.2 - Idempotency Replay: Returns existing record without creating extra movements', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue({
        id: 'rec-1',
        idempotencyKey: 'idem-101',
        status: 'POSTED',
      });

      const result = await service.executeReclassification('comp-1', 'user-1', executeDto);

      expect(result.isIdempotentReplay).toBe(true);
      expect(result.reclassification.id).toBe('rec-1');
      expect(mockLedger.createMovement).not.toHaveBeenCalled();
      expect(mockPrisma.timberBatchReclassification.create).not.toHaveBeenCalled();
    });

    it('2.2b - Parallel Race Condition (P2002 on insert): Safely catches P2002 and returns replayed record', async () => {
      // First check returns null (both requests believe key is free)
      mockPrisma.timberBatchReclassification.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'rec-parallel-1',
          idempotencyKey: 'idem-101',
          status: 'POSTED',
        });

      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 30,
        currentVolumeM3: 0.8,
      });

      // Transaction throws P2002 duplicate key error
      mockPrisma.$transaction.mockRejectedValueOnce({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`company_id`,`idempotencyKey`)',
      });

      const result = await service.executeReclassification('comp-1', 'user-1', executeDto);

      expect(result.isIdempotentReplay).toBe(true);
      expect(result.reclassification.id).toBe('rec-parallel-1');
    });

    it('2.2b - Rethrows P2002 error if the collision target is NOT idempotencyKey', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue(null);
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 30,
        currentVolumeM3: 0.8,
      });

      // P2002 on another model or field (e.g. some internal unique index)
      const foreignP2002 = {
        code: 'P2002',
        meta: { target: ['someOtherField_unique'] },
        message: 'Unique constraint failed on the fields: (`someOtherField`)',
      };
      mockPrisma.$transaction.mockRejectedValueOnce(foreignP2002);

      await expect(
        service.executeReclassification('comp-1', 'user-1', executeDto),
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    it('2.3 - Rejects execution if UNKNOWN stock is insufficient', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue(null);
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'ACTIVE',
        company_id: 'comp-1',
      });
      // Only 10 pcs available, requesting 15 pcs
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 10,
        currentVolumeM3: 0.2,
      });

      await expect(
        service.executeReclassification('comp-1', 'user-1', executeDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('2.4 - Rejects execution if Target Partai is COMPLETED or CANCELLED', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue(null);
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', company_id: 'comp-1' });
      mockPrisma.timberPartai.findFirst.mockResolvedValue({
        code: 'PTY-2026-001',
        status: 'COMPLETED',
        company_id: 'comp-1',
      });

      await expect(
        service.executeReclassification('comp-1', 'user-1', executeDto),
      ).rejects.toThrow(/Only ACTIVE Partais can receive reclassified timber/);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. CONTROLLED REVERSAL TESTS
  // =========================================================================
  describe('3. Controlled Reversal', () => {
    const postedRecord = {
      id: 'rec-1',
      company_id: 'comp-1',
      warehouseId: 'wh-1',
      timberVariantId: 'var-1',
      targetBatch: 'PTY-2026-001',
      quantityPcs: 15,
      volumeM3: 0.35,
      status: 'POSTED',
    };

    it('3.1 - Successfully reverses using exact historical snapshot values', async () => {
      mockPrisma.timberBatchReclassification.findFirst.mockResolvedValue(postedRecord);
      mockPrisma.timberBatchReclassification.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue({
        ...postedRecord,
        status: 'REVERSED',
      });

      const res = await service.reverseReclassification(
        'rec-1',
        'comp-1',
        'user-1',
        'Wrong pile tag identified',
      );

      expect(res.status).toBe('REVERSED');
      expect(mockLedger.createMovement).toHaveBeenCalledTimes(2);

      // Movement 1: OUT from Target Partai
      expect(mockLedger.createMovement).toHaveBeenNthCalledWith(
        1,
        mockPrisma,
        'wh-1',
        'var-1',
        'OUT',
        'BATCH_RECLASSIFICATION_REVERSAL',
        'rec-1',
        15,
        0.35,
        'PTY-2026-001',
      );

      // Movement 2: Return IN to UNKNOWN
      expect(mockLedger.createMovement).toHaveBeenNthCalledWith(
        2,
        mockPrisma,
        'wh-1',
        'var-1',
        'IN',
        'BATCH_RECLASSIFICATION_REVERSAL',
        'rec-1',
        15,
        0.35,
        'UNKNOWN',
      );
    });

    it('3.2 - Prevents double reversal (already reversed)', async () => {
      mockPrisma.timberBatchReclassification.findFirst.mockResolvedValue({
        ...postedRecord,
        status: 'REVERSED',
      });

      await expect(
        service.reverseReclassification('rec-1', 'comp-1', 'user-1', 'Retry reversal'),
      ).rejects.toThrow(/already been reversed/);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('3.3 - Atomic status update guard prevents concurrent duplicate reversal', async () => {
      mockPrisma.timberBatchReclassification.findFirst.mockResolvedValue(postedRecord);
      // updateMany returns 0 because another parallel call already updated status to REVERSED
      mockPrisma.timberBatchReclassification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.reverseReclassification('rec-1', 'comp-1', 'user-1', 'Concurrent request'),
      ).rejects.toThrow(ConflictException);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. TENANT ISOLATION TESTS
  // =========================================================================
  describe('4. Tenant Isolation', () => {
    it('4.1 - Cross-company execute is rejected', async () => {
      mockPrisma.timberBatchReclassification.findUnique.mockResolvedValue(null);
      // Warehouse belongs to Company 2, caller is Company 1
      mockPrisma.warehouse.findFirst.mockResolvedValue(null);

      const dto: ExecuteReclassificationDto = {
        idempotencyKey: 'cross-tenant-1',
        warehouseId: 'wh-comp-2',
        timberVariantId: 'var-1',
        targetPartaiCode: 'PTY-1',
        quantityPcs: 10,
        volumeM3: 0.2,
        reason: 'test',
        evidenceType: 'DELIVERY_DOC',
        evidenceRef: 'DOC-1',
      };

      await expect(
        service.executeReclassification('comp-1', 'user-1', dto),
      ).rejects.toThrow(NotFoundException);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('4.2 - Cross-company reverse is rejected', async () => {
      // Record belongs to Company 2
      mockPrisma.timberBatchReclassification.findFirst.mockResolvedValue(null);

      await expect(
        service.reverseReclassification('rec-comp-2', 'comp-1', 'user-1', 'Breach attempt'),
      ).rejects.toThrow(NotFoundException);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });
  });
});
