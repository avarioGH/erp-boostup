import { InputLogService } from './input-log.service';
import { BadRequestException } from '@nestjs/common';

describe('InputLog Validation', () => {
  let service: InputLogService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(async (callback) => {
        return callback(prismaMock);
      }),
      inputLog: {
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      trimmedLog: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      inputLogItem: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    auditMock = { createLog: jest.fn() };
    service = new InputLogService(prismaMock, auditMock);
  });

  it('should reject if trimmed logs are missing or consumed', async () => {
    prismaMock.trimmedLog.findMany.mockResolvedValue([
      { id: '1', status: 'CONSUMED' },
    ]);

    await expect(
      service.createInputLog({ trimmedLogIds: ['1'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should process successfully with AVAILABLE trimmed logs and inherit partaiId', async () => {
    prismaMock.trimmedLog.findMany.mockResolvedValue([
      {
        id: '1',
        status: 'AVAILABLE',
        species: 'Ulin',
        length: 4,
        grossVolume: 1,
        netVolume: 0.9,
        partaiId: 'partai-123',
      },
    ]);
    prismaMock.inputLog.count.mockResolvedValue(0);
    prismaMock.inputLog.findUnique.mockResolvedValue(null);
    prismaMock.inputLog.create.mockImplementation(({ data }) => Promise.resolve({ id: 'in1', ...data }));

    const res = await service.createInputLog({ trimmedLogIds: ['1'] });
    expect(res).toBeDefined();
    expect(prismaMock.inputLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          partaiId: 'partai-123',
          status: 'AVAILABLE',
        }),
      }),
    );
    expect(prismaMock.inputLogItem.create).toHaveBeenCalled();
    expect(prismaMock.trimmedLog.update).toHaveBeenCalled();
  });

  it('should reject mixing trimmed logs from different Partais', async () => {
    prismaMock.trimmedLog.findMany.mockResolvedValue([
      { id: '1', status: 'AVAILABLE', species: 'Ulin', partaiId: 'partai-1' },
      { id: '2', status: 'AVAILABLE', species: 'Ulin', partaiId: 'partai-2' },
    ]);

    await expect(
      service.createInputLog({ trimmedLogIds: ['1', '2'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject if explicit partaiId conflicts with source logs partaiId', async () => {
    prismaMock.trimmedLog.findMany.mockResolvedValue([
      { id: '1', status: 'AVAILABLE', species: 'Ulin', partaiId: 'partai-1' },
    ]);

    await expect(
      service.createInputLog({ trimmedLogIds: ['1'], partaiId: 'partai-conflicting' }),
    ).rejects.toThrow(BadRequestException);
  });
});
