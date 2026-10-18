import { Test, TestingModule } from '@nestjs/testing';
import { TimberLedgerController } from './timber-ledger.controller';
import { StockTransferService } from './stock-transfer.service';
import { StockAdjustmentService } from './stock-adjustment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('TimberLedgerController - Tenant Isolation & Movements Guard', () => {
  let controller: TimberLedgerController;
  let mockPrisma: any;
  let mockTransferService: any;
  let mockAdjustmentService: any;

  beforeEach(async () => {
    mockPrisma = {
      timberStockMovement: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockTransferService = {
      listTransfers: jest.fn(),
      getTransfer: jest.fn(),
      createTransfer: jest.fn(),
      postTransfer: jest.fn(),
      cancelTransfer: jest.fn(),
    };

    mockAdjustmentService = {
      listAdjustments: jest.fn(),
      getAdjustment: jest.fn(),
      createAdjustment: jest.fn(),
      postAdjustment: jest.fn(),
      cancelAdjustment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimberLedgerController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StockTransferService, useValue: mockTransferService },
        { provide: StockAdjustmentService, useValue: mockAdjustmentService },
      ],
    }).compile();

    controller = module.get<TimberLedgerController>(TimberLedgerController);
  });

  describe('listMovements - Tenant Isolation Enforcement', () => {
    it('1. should reject request if authenticated user has no company_id context', async () => {
      const unauthReq = { user: { id: 'u1' } }; // Missing company_id
      await expect(
        controller.listMovements({}, unauthReq),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.timberStockMovement.findMany).not.toHaveBeenCalled();
    });

    it('2. should enforce tenant scoping on timberStock.location.company_id for Tenant A', async () => {
      const tenantAReq = { user: { id: 'u1', company_id: 'comp-tenant-a' } };
      mockPrisma.timberStockMovement.findMany.mockResolvedValue([]);
      mockPrisma.timberStockMovement.count.mockResolvedValue(0);

      await controller.listMovements(
        { skip: 0, take: 20, type: 'OUT', referenceType: 'TRANSFER_OUT' },
        tenantAReq,
      );

      // Verify findMany was strictly called with Tenant A company_id
      expect(mockPrisma.timberStockMovement.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          timberStock: {
            location: {
              company_id: 'comp-tenant-a',
            },
          },
          type: 'OUT',
          referenceType: 'TRANSFER_OUT',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          timberStock: { include: { location: true, timberVariant: true } },
        },
      });

      // Verify count was strictly called with the identical tenant filter
      expect(mockPrisma.timberStockMovement.count).toHaveBeenCalledWith({
        where: {
          timberStock: {
            location: {
              company_id: 'comp-tenant-a',
            },
          },
          type: 'OUT',
          referenceType: 'TRANSFER_OUT',
        },
      });
    });

    it('3. should isolate Tenant B and prevent accessing Tenant A movements', async () => {
      const tenantBReq = { user: { id: 'u2', company_id: 'comp-tenant-b' } };
      mockPrisma.timberStockMovement.findMany.mockResolvedValue([]);
      mockPrisma.timberStockMovement.count.mockResolvedValue(0);

      await controller.listMovements({}, tenantBReq);

      expect(mockPrisma.timberStockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timberStock: {
              location: {
                company_id: 'comp-tenant-b',
              },
            },
          }),
        }),
      );
    });
  });
});
