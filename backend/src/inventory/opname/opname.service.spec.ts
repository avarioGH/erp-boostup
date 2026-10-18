import { Test, TestingModule } from '@nestjs/testing';
import { OpnameService } from './opname.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OpnameService - Phase 04.3.2 Safety Hardening Tests', () => {
  let service: OpnameService;
  let ledger: InventoryLedgerService;

  const mockPrisma: any = {
    $transaction: jest.fn(async (callback) => callback(mockPrisma)),
    warehouse: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    timberStock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    timberStockMovement: {
      findMany: jest.fn(),
    },
    timberStockOpname: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    timberStockOpnameItem: {
      update: jest.fn(),
    },
  };

  const mockLedger: any = {
    createMovement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpnameService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryLedgerService, useValue: mockLedger },
      ],
    }).compile();

    service = module.get<OpnameService>(OpnameService);
    ledger = module.get<InventoryLedgerService>(InventoryLedgerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // FIX 1: VARIANCE SIGN INTEGRITY
  // =========================================================================
  describe('Fix 1: Variance Sign Integrity', () => {
    const baseOpname = {
      id: 'opn-1',
      company_id: 'comp-A',
      warehouseId: 'wh-1',
      status: 'DRAFT',
      items: [] as any[],
    };

    it('1.1 - Valid: Both Positive (Surplus) -> Calls ledger with type IN and positive values', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-1',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 5,
            varianceVolumeM3: 0.5,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 10,
        currentVolumeM3: 1.0,
      });
      mockPrisma.timberStockOpname.findUnique.mockResolvedValue({
        ...opname,
        status: 'CONFIRMED',
      });

      await service.confirmOpname('opn-1', 'comp-A', 'user-1');

      expect(mockLedger.createMovement).toHaveBeenCalledWith(
        mockPrisma,
        'wh-1',
        'var-1',
        'IN',
        'STOCK_OPNAME_ADJUSTMENT',
        'opn-1',
        5,
        0.5,
        'BATCH-01',
      );
    });

    it('1.2 - Valid: Both Negative (Deficit) -> Calls ledger with type OUT and positive magnitudes', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-2',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: -3,
            varianceVolumeM3: -0.3,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 10,
        currentVolumeM3: 1.0,
      });
      mockPrisma.timberStockOpname.findUnique.mockResolvedValue({
        ...opname,
        status: 'CONFIRMED',
      });

      await service.confirmOpname('opn-1', 'comp-A', 'user-1');

      expect(mockLedger.createMovement).toHaveBeenCalledWith(
        mockPrisma,
        'wh-1',
        'var-1',
        'OUT',
        'STOCK_OPNAME_ADJUSTMENT',
        'opn-1',
        3,
        0.3,
        'BATCH-01',
      );
    });

    it('1.3 - Valid: Both Zero -> No ledger movement called', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-3',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 0,
            varianceVolumeM3: 0,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 10,
        currentVolumeM3: 1.0,
      });
      mockPrisma.timberStockOpname.findUnique.mockResolvedValue({
        ...opname,
        status: 'CONFIRMED',
      });

      await service.confirmOpname('opn-1', 'comp-A', 'user-1');

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('1.4 - Invalid: PCS Positive, M3 Negative -> Throws BadRequestException', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-4',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 5,
            varianceVolumeM3: -0.5,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.confirmOpname('opn-1', 'comp-A', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('1.5 - Invalid: PCS Negative, M3 Positive -> Throws BadRequestException', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-5',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: -5,
            varianceVolumeM3: 0.5,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.confirmOpname('opn-1', 'comp-A', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('1.6 - Invalid: PCS Zero, M3 Non-Zero (Positive or Negative) -> Throws BadRequestException', async () => {
      const opnamePos = {
        ...baseOpname,
        items: [
          {
            id: 'item-6a',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 0,
            varianceVolumeM3: 0.2,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opnamePos);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.confirmOpname('opn-1', 'comp-A', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      const opnameNeg = {
        ...baseOpname,
        items: [
          {
            id: 'item-6b',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 0,
            varianceVolumeM3: -0.2,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opnameNeg);
      await expect(
        service.confirmOpname('opn-1', 'comp-A', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('1.7 - Invalid: PCS Non-Zero, M3 Zero -> Throws BadRequestException', async () => {
      const opname = {
        ...baseOpname,
        items: [
          {
            id: 'item-7',
            timberVariantId: 'var-1',
            batch: 'BATCH-01',
            systemQuantityPcs: 10,
            systemVolumeM3: 1.0,
            varianceQuantityPcs: 2,
            varianceVolumeM3: 0,
          },
        ],
      };

      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(opname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.confirmOpname('opn-1', 'comp-A', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // FIX 2: STALE SNAPSHOT & CONCURRENT STOCK CHANGES
  // =========================================================================
  describe('Fix 2: Stale Snapshot & Concurrency Guards', () => {
    const baseOpname = {
      id: 'opn-concurrency',
      company_id: 'comp-A',
      warehouseId: 'wh-1',
      status: 'DRAFT',
      items: [
        {
          id: 'item-c1',
          timberVariantId: 'var-1',
          batch: 'BATCH-01',
          systemQuantityPcs: 20,
          systemVolumeM3: 2.0,
          varianceQuantityPcs: -5,
          varianceVolumeM3: -0.5,
        },
      ],
    };

    it('2.1 - Unchanged Stock: Baseline matches actual current stock -> Successfully confirms and moves ledger', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(baseOpname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 2.0,
      });
      mockPrisma.timberStockOpname.findUnique.mockResolvedValue({
        ...baseOpname,
        status: 'CONFIRMED',
      });

      const res = await service.confirmOpname('opn-concurrency', 'comp-A', 'user-1');

      expect(res.status).toBe('CONFIRMED');
      expect(mockLedger.createMovement).toHaveBeenCalledTimes(1);
    });

    it('2.2 - Stale Snapshot (PCS changed before confirmation) -> Rejects confirmation with BadRequestException', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(baseOpname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      // Stock was reduced to 18 pcs by a concurrent sale
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 18,
        currentVolumeM3: 2.0,
      });

      await expect(
        service.confirmOpname('opn-concurrency', 'comp-A', 'user-1'),
      ).rejects.toThrow(/Stale stock snapshot detected/);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('2.3 - Stale Snapshot (M3 changed before confirmation) -> Rejects confirmation with BadRequestException', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(baseOpname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      // Volume changed due to concurrent adjustment
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 1.8,
      });

      await expect(
        service.confirmOpname('opn-concurrency', 'comp-A', 'user-1'),
      ).rejects.toThrow(/Stale stock snapshot detected/);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('2.4 - Concurrent double-confirmation (Atomic state transition check) -> Second call rejected', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(baseOpname);
      // updateMany returns count 0 because another worker already updated status from DRAFT to CONFIRMED
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.confirmOpname('opn-concurrency', 'comp-A', 'user-1'),
      ).rejects.toThrow(/Opname is no longer in DRAFT status/);

      expect(mockPrisma.timberStock.findUnique).not.toHaveBeenCalled();
      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('2.5 - Failed ledger movement -> Transaction aborts and error is thrown', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(baseOpname);
      mockPrisma.timberStockOpname.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.timberStock.findUnique.mockResolvedValue({
        currentPcs: 20,
        currentVolumeM3: 2.0,
      });
      mockLedger.createMovement.mockRejectedValue(
        new BadRequestException('Insufficient stock or concurrent modification'),
      );

      await expect(
        service.confirmOpname('opn-concurrency', 'comp-A', 'user-1'),
      ).rejects.toThrow('Insufficient stock or concurrent modification');
    });
  });

  // =========================================================================
  // FIX 3: TENANT ISOLATION
  // =========================================================================
  describe('Fix 3: Tenant Isolation', () => {
    it('3.1 - Missing company context -> Throws BadRequestException on all methods', async () => {
      await expect(service.createDraft('wh-1', '')).rejects.toThrow(
        'Authenticated company context is required',
      );
      await expect(service.updateCounts('opn-1', '', [])).rejects.toThrow(
        'Authenticated company context is required',
      );
      await expect(service.confirmOpname('opn-1', '')).rejects.toThrow(
        'Authenticated company context is required',
      );
      await expect(service.cancelOpname('opn-1', '')).rejects.toThrow(
        'Authenticated company context is required',
      );
    });

    it('3.2 - Cross-company warehouse on draft creation -> Throws NotFoundException', async () => {
      // Warehouse exists but belongs to Company B
      mockPrisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.createDraft('wh-belonging-to-company-b', 'comp-A', 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.timberStockOpname.create).not.toHaveBeenCalled();
    });

    it('3.3 - Cross-company update counts -> Throws NotFoundException', async () => {
      // Opname belongs to Company B, caller is Company A
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCounts('opn-comp-b', 'comp-A', []),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.timberStockOpnameItem.update).not.toHaveBeenCalled();
    });

    it('3.4 - Cross-company confirm opname -> Throws NotFoundException', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmOpname('opn-comp-b', 'comp-A', 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockLedger.createMovement).not.toHaveBeenCalled();
    });

    it('3.5 - Cross-company cancel opname -> Throws NotFoundException', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelOpname('opn-comp-b', 'comp-A'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.timberStockOpname.updateMany).not.toHaveBeenCalled();
    });

    it('3.6 - Cannot cancel already confirmed opname -> Throws BadRequestException', async () => {
      mockPrisma.timberStockOpname.findFirst.mockResolvedValue({
        id: 'opn-1',
        company_id: 'comp-A',
        status: 'CONFIRMED',
      });

      await expect(
        service.cancelOpname('opn-1', 'comp-A'),
      ).rejects.toThrow(/Confirmed opnames cannot be cancelled/);
    });

    it('3.7 - Reconcile is scoped by company warehouses when companyId provided', async () => {
      mockPrisma.warehouse.findMany.mockResolvedValue([
        { id: 'wh-1' },
        { id: 'wh-2' },
      ]);
      mockPrisma.timberStock.findMany.mockResolvedValue([]);

      await service.reconcile('comp-A');

      expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
        where: { company_id: 'comp-A' },
        select: { id: true },
      });
      expect(mockPrisma.timberStock.findMany).toHaveBeenCalledWith({
        where: { locationId: { in: ['wh-1', 'wh-2'] } },
      });
    });
  });
});
