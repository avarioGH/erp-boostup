import { StockTransferService } from './stock-transfer.service';
import { BadRequestException } from '@nestjs/common';

describe('StockTransferService Batch Lineage & Concurrency Validation', () => {
  let service: StockTransferService;
  let prismaMock: any;
  let ledgerMock: any;
  let auditMock: any;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(async (cb) => cb(prismaMock)),
      stockTransfer: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockTransferItem: {
        create: jest.fn(),
      },
      timberStock: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    ledgerMock = {
      createMovement: jest.fn(),
    };
    auditMock = {
      createLog: jest.fn(),
    };
    service = new StockTransferService(prismaMock, ledgerMock, auditMock);
  });

  it('should create transfer and preserve exact batch for line items', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([]);
    prismaMock.timberStock.findUnique.mockResolvedValue({
      id: 'stk-1',
      currentPcs: 100,
      currentVolumeM3: 2.5,
      batch: 'PARTAI-MERBAU-01',
    });

    const res = await service.createTransfer({
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        {
          timberVariantId: 'tv-1',
          batch: 'PARTAI-MERBAU-01',
          quantityPcs: 25,
          volumeM3: 0.625,
        },
      ],
    });

    expect(res).toBeDefined();
    expect(prismaMock.stockTransferItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        batch: 'PARTAI-MERBAU-01',
        quantityPcs: 25,
        volumeM3: 0.625,
      }),
    });
  });

  it('should reject transfer when stock has known batch but UNKNOWN was submitted', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([
      { batch: 'PARTAI-MERBAU-01', currentPcs: 100 },
    ]);

    await expect(
      service.createTransfer({
        fromLocationId: 'wh-source',
        toLocationId: 'wh-dest',
        items: [
          {
            timberVariantId: 'tv-1',
            batch: 'UNKNOWN',
            quantityPcs: 10,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject transfer if requested quantity exceeds source batch currentPcs', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([]);
    prismaMock.timberStock.findUnique.mockResolvedValue({
      id: 'stk-1',
      currentPcs: 15,
      currentVolumeM3: 0.5,
      batch: 'PARTAI-MERBAU-01',
    });

    await expect(
      service.createTransfer({
        fromLocationId: 'wh-source',
        toLocationId: 'wh-dest',
        items: [
          {
            timberVariantId: 'tv-1',
            batch: 'PARTAI-MERBAU-01',
            quantityPcs: 20, // Exceeds 15
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should keep two batches of the same variant distinct in separate items', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([]);
    prismaMock.timberStock.findUnique.mockImplementation(({ where }) => {
      const b = where.locationId_timberVariantId_batch.batch;
      if (b === 'BATCH-A') return Promise.resolve({ id: 'stk-a', currentPcs: 50, currentVolumeM3: 1.0, batch: 'BATCH-A' });
      if (b === 'BATCH-B') return Promise.resolve({ id: 'stk-b', currentPcs: 30, currentVolumeM3: 0.6, batch: 'BATCH-B' });
      return Promise.resolve(null);
    });

    await service.createTransfer({
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        { timberVariantId: 'tv-1', batch: 'BATCH-A', quantityPcs: 10 },
        { timberVariantId: 'tv-1', batch: 'BATCH-B', quantityPcs: 15 },
      ],
    });

    expect(prismaMock.stockTransferItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ batch: 'BATCH-A', quantityPcs: 10 }),
    });
    expect(prismaMock.stockTransferItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ batch: 'BATCH-B', quantityPcs: 15 }),
    });
  });

  it('should post transfer by emitting TRANSFER_OUT and TRANSFER_IN with identical batch', async () => {
    prismaMock.stockTransfer.findUnique.mockResolvedValue({
      id: 'trf-1',
      status: 'DRAFT',
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        {
          id: 'item-1',
          timberVariantId: 'tv-1',
          batch: 'PARTAI-MERBAU-01',
          quantityPcs: 20,
          volumeM3: 0.5,
        },
      ],
    });
    prismaMock.timberStock.findUnique.mockResolvedValue({
      id: 'stk-1',
      currentPcs: 100,
      batch: 'PARTAI-MERBAU-01',
    });

    await service.postTransfer('trf-1');

    expect(ledgerMock.createMovement).toHaveBeenCalledWith(
      expect.anything(),
      'wh-source',
      'tv-1',
      'OUT',
      'TRANSFER_OUT',
      'trf-1',
      20,
      0.5,
      'PARTAI-MERBAU-01',
    );

    expect(ledgerMock.createMovement).toHaveBeenCalledWith(
      expect.anything(),
      'wh-dest',
      'tv-1',
      'IN',
      'TRANSFER_IN',
      'trf-1',
      20,
      0.5,
      'PARTAI-MERBAU-01',
    );
  });

  it('should cancel posted transfer by reversing movements with exact batch and locations', async () => {
    prismaMock.stockTransfer.findUnique.mockResolvedValue({
      id: 'trf-1',
      status: 'POSTED',
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        {
          id: 'item-1',
          timberVariantId: 'tv-1',
          batch: 'PARTAI-MERBAU-01',
          quantityPcs: 20,
          volumeM3: 0.5,
        },
      ],
    });

    await service.cancelTransfer('trf-1');

    // 1. OUT from destination
    expect(ledgerMock.createMovement).toHaveBeenCalledWith(
      expect.anything(),
      'wh-dest',
      'tv-1',
      'OUT',
      'REVERSAL',
      'trf-1',
      20,
      0.5,
      'PARTAI-MERBAU-01',
    );

    // 2. IN back to source
    expect(ledgerMock.createMovement).toHaveBeenCalledWith(
      expect.anything(),
      'wh-source',
      'tv-1',
      'IN',
      'REVERSAL',
      'trf-1',
      20,
      0.5,
      'PARTAI-MERBAU-01',
    );
  });

  it('should reject transfer when duplicate items for the same variant & batch exceed aggregate available stock', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([]);
    // Available: 60 PCS
    prismaMock.timberStock.findUnique.mockResolvedValue({
      id: 'stk-1',
      currentPcs: 60,
      currentVolumeM3: 1.5,
      batch: 'PARTAI-MERBAU-01',
    });

    // Requesting 40 PCS in Row 1 + 40 PCS in Row 2 = 80 PCS (exceeds 60)
    await expect(
      service.createTransfer({
        fromLocationId: 'wh-source',
        toLocationId: 'wh-dest',
        items: [
          { timberVariantId: 'tv-1', batch: 'PARTAI-MERBAU-01', quantityPcs: 40 },
          { timberVariantId: 'tv-1', batch: 'PARTAI-MERBAU-01', quantityPcs: 40 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow duplicate items if their aggregate sum is within available stock', async () => {
    prismaMock.stockTransfer.create.mockResolvedValue({ id: 'trf-1', status: 'DRAFT' });
    prismaMock.timberStock.findMany.mockResolvedValue([]);
    // Available: 60 PCS
    prismaMock.timberStock.findUnique.mockResolvedValue({
      id: 'stk-1',
      currentPcs: 60,
      currentVolumeM3: 1.5,
      batch: 'PARTAI-MERBAU-01',
    });

    // Requesting 25 PCS in Row 1 + 25 PCS in Row 2 = 50 PCS <= 60 PCS
    await service.createTransfer({
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        { timberVariantId: 'tv-1', batch: 'PARTAI-MERBAU-01', quantityPcs: 25 },
        { timberVariantId: 'tv-1', batch: 'PARTAI-MERBAU-01', quantityPcs: 25 },
      ],
    });

    expect(prismaMock.stockTransferItem.create).toHaveBeenCalledTimes(2);
  });

  it('should rollback transaction and not modify status if any item posting fails due to concurrent modification', async () => {
    prismaMock.stockTransfer.findUnique.mockResolvedValue({
      id: 'trf-1',
      status: 'DRAFT',
      fromLocationId: 'wh-source',
      toLocationId: 'wh-dest',
      items: [
        { id: 'it-1', timberVariantId: 'tv-1', batch: 'BATCH-A', quantityPcs: 10, volumeM3: 0.2 },
        { id: 'it-2', timberVariantId: 'tv-2', batch: 'BATCH-B', quantityPcs: 10, volumeM3: 0.2 },
      ],
    });

    // In postTransfer pre-validation check, simulate insufficient stock on 2nd item
    prismaMock.timberStock.findUnique.mockImplementation(({ where }) => {
      const b = where.locationId_timberVariantId_batch.batch;
      if (b === 'BATCH-A') return Promise.resolve({ id: 'stk-a', currentPcs: 50, batch: 'BATCH-A' });
      if (b === 'BATCH-B') return Promise.resolve({ id: 'stk-b', currentPcs: 5, batch: 'BATCH-B' }); // Only 5, requires 10
      return Promise.resolve(null);
    });

    await expect(service.postTransfer('trf-1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.stockTransfer.update).not.toHaveBeenCalled();
    expect(ledgerMock.createMovement).not.toHaveBeenCalled();
  });
});
