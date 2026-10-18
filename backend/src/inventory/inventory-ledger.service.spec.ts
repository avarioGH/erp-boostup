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

  describe('Dual-Dimension Guard Regression Tests', () => {
    it('should succeed OUT movement when PCS and Volume M3 are both sufficient', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.5 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
      txMock.timberStockMovement.create.mockResolvedValue({ id: 'm1' });

      await service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        5,
        0.25,
      );

      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's1',
          currentPcs: { gte: 5 },
          currentVolumeM3: { gte: 0.25 },
        },
        data: {
          stockOutPcs: { increment: 5 },
          currentPcs: { decrement: 5 },
          currentVolumeM3: { decrement: 0.25 },
        },
      });
    });

    it('should succeed when Volume M3 matches exactly (floating point equality)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.25 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
      txMock.timberStockMovement.create.mockResolvedValue({ id: 'm1' });

      await service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        10,
        0.25,
      );

      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 's1',
            currentPcs: { gte: 10 },
            currentVolumeM3: { gte: 0.25 },
          },
        }),
      );
    });

    it('should throw BadRequestException when Volume M3 is insufficient even if PCS is sufficient', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.2 });
      // updateMany returns 0 because currentVolumeM3 check failed in where condition
      txMock.timberStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMovement(
          txMock,
          'loc1',
          'tv1',
          'OUT',
          'TRANSFER_OUT',
          'ref1',
          10,
          0.5, // 0.5 requested > 0.2 available
        ),
      ).rejects.toThrow(/Insufficient stock \(PCS or Volume M3\)/);
    });

    it('3. should reject when volume is slightly below requirement even within 1e-6 (no silent overdraw)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      // 0.2499999 is slightly below 0.25: MUST be rejected under strict conservation
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.2499999 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMovement(
          txMock,
          'loc1',
          'tv1',
          'OUT',
          'TRANSFER_OUT',
          'ref1',
          10,
          0.25,
        ),
      ).rejects.toThrow(/Insufficient stock \(PCS or Volume M3\)/);

      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 's1',
            currentPcs: { gte: 10 },
            currentVolumeM3: { gte: 0.25 }, // strictly gte requested volume
          },
        }),
      );
    });

    it('4. should reject when volume is below requirement outside tolerance (0.249990 vs 0.25)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.249990 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMovement(
          txMock,
          'loc1',
          'tv1',
          'OUT',
          'TRANSFER_OUT',
          'ref1',
          10,
          0.25,
        ),
      ).rejects.toThrow(/Insufficient stock \(PCS or Volume M3\)/);

      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 's1',
            currentPcs: { gte: 10 },
            currentVolumeM3: { gte: 0.25 },
          },
        }),
      );
    });

    it('5. should fail cleanly without partial state when updateMany returns 0 (concurrency collision)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.25 });
      // updateMany fails because another concurrent transaction already consumed the stock
      txMock.timberStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMovement(
          txMock,
          'loc1',
          'tv1',
          'OUT',
          'TRANSFER_OUT',
          'ref1',
          10,
          0.25,
        ),
      ).rejects.toThrow(/Insufficient stock \(PCS or Volume M3\) or concurrent modification/);

      // Verify that the caller receives an error and the transaction rollback is triggered
    });

    it('6. should clamp volume to 0 with set: 0 when volume is exactly consumed (preventing negative float drift)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.25 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
      txMock.timberStockMovement.create.mockResolvedValue({
        id: 'm1',
        quantityPcs: 10,
        volumeM3: 0.25,
      });

      const mov = await service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        10,
        0.25,
      );

      // Movement record matches exact requested deduction
      expect(mov.volumeM3).toBe(0.25);
      expect(mov.quantityPcs).toBe(10);

      // Stock update atomically sets volume to 0
      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's1',
          currentPcs: { gte: 10 },
          currentVolumeM3: { gte: 0.25 },
        },
        data: {
          stockOutPcs: { increment: 10 },
          currentPcs: { decrement: 10 },
          currentVolumeM3: { set: 0 },
        },
      });
    });

    it('7. should decrement normally when volume is slightly above requirement', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.26 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
      txMock.timberStockMovement.create.mockResolvedValue({
        id: 'm1',
        quantityPcs: 10,
        volumeM3: 0.25,
      });

      const mov = await service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        10,
        0.25,
      );

      expect(mov.volumeM3).toBe(0.25);
      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's1',
          currentPcs: { gte: 10 },
          currentVolumeM3: { gte: 0.25 },
        },
        data: {
          stockOutPcs: { increment: 10 },
          currentPcs: { decrement: 10 },
          currentVolumeM3: { decrement: 0.25 },
        },
      });
    });

    it('8. should preserve positive residual volume and NOT clamp to 0 when stock is slightly greater than volume (delta < 1e-6)', async () => {
      txMock.timberStock.findMany.mockResolvedValue([{ currentPcs: 10 }]);
      txMock.timberStockReservation.findMany.mockResolvedValue([]);
      // Saldo 0.2500005 m³, diminta 0.25 m³ -> selisih positif 0.0000005 (< 1e-6)
      // Wajib di-decrement normal, TIDAK boleh di-set 0 (residu positif wajib dipertahankan)
      txMock.timberStock.findUnique.mockResolvedValue({ id: 's1', currentPcs: 10, currentVolumeM3: 0.2500005 });
      txMock.timberStock.updateMany.mockResolvedValue({ count: 1 });
      txMock.timberStockMovement.create.mockResolvedValue({
        id: 'm1',
        quantityPcs: 10,
        volumeM3: 0.25,
      });

      const mov = await service.createMovement(
        txMock,
        'loc1',
        'tv1',
        'OUT',
        'TRANSFER_OUT',
        'ref1',
        10,
        0.25,
      );

      // Ledger movement mencatat pengurangan yang diminta
      expect(mov.volumeM3).toBe(0.25);
      expect(mov.quantityPcs).toBe(10);

      // updateData menggunakan decrement, BUKAN { set: 0 }
      expect(txMock.timberStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's1',
          currentPcs: { gte: 10 },
          currentVolumeM3: { gte: 0.25 },
        },
        data: {
          stockOutPcs: { increment: 10 },
          currentPcs: { decrement: 10 },
          currentVolumeM3: { decrement: 0.25 },
        },
      });
    });
  });
});
