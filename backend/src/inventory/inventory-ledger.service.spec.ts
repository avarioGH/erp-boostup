import { InventoryLedgerService } from './inventory-ledger.service';
import { BadRequestException } from '@nestjs/common';

describe('InventoryLedger Validation & Concurrency Check', () => {
  let service: InventoryLedgerService;
  let txMock: any;

  beforeEach(() => {
    txMock = {
      timberStock: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      timberStockReservation: {
        findMany: jest.fn(),
      },
      timberStockMovement: {
        create: jest.fn(),
      },
    };
    service = new InventoryLedgerService({} as any);
  });

  it('should create stock if it does not exist for IN movement', async () => {
    txMock.timberStock.findUnique.mockResolvedValue(null);
    txMock.timberStock.create.mockResolvedValue({ id: 's1', currentPcs: 0 });
    txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
    txMock.timberStockMovement.create.mockResolvedValue({ id: 'm1' });

    await service.createMovement(
      txMock,
      'loc1',
      'tv1',
      'IN',
      'OPENING_BALANCE',
      'ref1',
      10,
      0.5,
    );

    expect(txMock.timberStock.create).toHaveBeenCalled();
    expect(txMock.timberStock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ currentPcs: { increment: 10 } }),
      }),
    );
  });

  it('should reject OUT movement if stock is missing', async () => {
    txMock.timberStock.findMany.mockResolvedValue([]);
    txMock.timberStockReservation.findMany.mockResolvedValue([]);
    txMock.timberStock.findUnique.mockResolvedValue(null);
    await expect(
      service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        10,
        0.5,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should preserve batch tag on stock creation and movement', async () => {
    txMock.timberStock.findUnique.mockResolvedValue(null);
    txMock.timberStock.create.mockImplementation(({ data }) => Promise.resolve({ id: 's-batch', ...data }));
    txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
    txMock.timberStockMovement.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm-batch', ...data }));

    await service.createMovement(
      txMock,
      'loc1',
      'tv1',
      'IN',
      'PRODUCTION_PROCESS_OUTPUT',
      'ref1',
      20,
      1.2,
      'PARTAI-MERBAU-01',
    );

    expect(txMock.timberStock.findUnique).toHaveBeenCalledWith({
      where: {
        locationId_timberVariantId_batch: {
          locationId: 'loc1',
          timberVariantId: 'tv1',
          batch: 'PARTAI-MERBAU-01',
        },
      },
    });
    expect(txMock.timberStockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          batch: 'PARTAI-MERBAU-01',
          quantityPcs: 20,
        }),
      }),
    );
  });

  it('should default to UNKNOWN batch when batch is not provided (legacy compatibility)', async () => {
    txMock.timberStock.findUnique.mockResolvedValue(null);
    txMock.timberStock.create.mockImplementation(({ data }) => Promise.resolve({ id: 's-legacy', ...data }));
    txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
    txMock.timberStockMovement.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm-legacy', ...data }));

    await service.createMovement(
      txMock,
      'loc1',
      'tv1',
      'IN',
      'PRODUCTION_OUTPUT',
      'ref1',
      10,
      0.5,
    );

    expect(txMock.timberStock.findUnique).toHaveBeenCalledWith({
      where: {
        locationId_timberVariantId_batch: {
          locationId: 'loc1',
          timberVariantId: 'tv1',
          batch: 'UNKNOWN',
        },
      },
    });
  });
});
