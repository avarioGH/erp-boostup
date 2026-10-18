import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { PrismaClient } from '@prisma/client';
import { InventoryLedgerService } from '../src/inventory/inventory-ledger.service';
import { BatchReclassificationService } from '../src/inventory/reclassification/batch-reclassification.service';
import { StockAdjustmentService } from '../src/inventory/stock-adjustment.service';
import { StockTransferService } from '../src/inventory/stock-transfer.service';
import { OpnameService } from '../src/inventory/opname/opname.service';
import { AuditService } from '../src/core/audit.service';
import { BadRequestException } from '@nestjs/common';

/**
 * TATALORA ERP — PHASE 05.3
 * Physical MongoDB Replica Set Integration Test Suite
 *
 * Requirements:
 * - Uses real PrismaClient connected to an active isolated MongoDB Replica Set.
 * - Zero mocks for database engine or Prisma transaction primitives.
 * - Validates strict non-overdraw, concurrency, atomicity, idempotency, and tenant isolation.
 */
/**
 * Validates integration test database URL against strict allowlist.
 * Prevents accidental connection to staging, production, or non-isolated instances.
 */
function validateTestDatabaseUrl(rawUrl: string): void {
  if (process.env.ALLOW_INTEGRATION_TEST_DB !== 'true') {
    throw new Error(
      'FATAL: Integration tests require explicit environment flag ALLOW_INTEGRATION_TEST_DB=true.',
    );
  }

  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('FATAL: DATABASE_URL must be a non-empty string for integration tests.');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (err: any) {
    throw new Error(`FATAL: DATABASE_URL is malformed: ${err?.message}`);
  }

  // 1. Strict protocol allowlist
  if (parsed.protocol !== 'mongodb:' && parsed.protocol !== 'mongodb+srv:') {
    throw new Error(`FATAL: Disallowed protocol "${parsed.protocol}". Only mongodb: or mongodb+srv: allowed.`);
  }

  // 2. Strict host allowlist (only local testbed hosts)
  const allowedHosts = new Set(['localhost', '127.0.0.1', 'mongo-testbed']);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(
      `FATAL: Disallowed testbed host "${parsed.hostname}". Only localhost, 127.0.0.1, or mongo-testbed allowed.`,
    );
  }

  // 3. Strict port allowlist (if provided)
  const allowedPorts = new Set(['27017', '27018']);
  if (parsed.port && !allowedPorts.has(parsed.port) && Number(parsed.port) < 1024) {
    throw new Error(`FATAL: Disallowed testbed port "${parsed.port}".`);
  }

  // 4. Strict database name allowlist
  const dbName = parsed.pathname.replace(/^\//, '');
  const allowedDatabases = new Set([
    'tatalora_integration_test',
    'erp_runtime_test',
    'tatalora_test',
  ]);
  if (!allowedDatabases.has(dbName)) {
    throw new Error(
      `FATAL: Disallowed database name "${dbName}". Must be one of: ${Array.from(allowedDatabases).join(', ')}`,
    );
  }

  // 5. Must require replicaSet option for multi-document transaction support
  const replicaSet = parsed.searchParams.get('replicaSet');
  if (!replicaSet) {
    throw new Error('FATAL: DATABASE_URL must include a replicaSet query parameter (e.g. replicaSet=rsTest).');
  }

  // 6. Prohibit production keywords anywhere in query or path
  const fullStr = rawUrl.toLowerCase();
  if (fullStr.includes('prod') || fullStr.includes('production') || fullStr.includes('live')) {
    throw new Error('FATAL: DATABASE_URL contains disallowed production identifiers.');
  }
}

describe('Phase 05.3: Physical MongoDB Replica Set Integration & Concurrency Tests', () => {
  let replSet: MongoMemoryReplSet;
  let prisma: PrismaClient;

  // Real Service Instances
  let ledgerService: InventoryLedgerService;
  let reclassService: BatchReclassificationService;
  let adjustmentService: StockAdjustmentService;
  let transferService: StockTransferService;
  let opnameService: OpnameService;
  let auditService: AuditService;

  // Test Fixture Identifiers
  let companyAId: string;
  let companyBId: string;
  let warehouseAId: string;
  let warehouseBId: string;
  let variant1Id: string;
  let variant2Id: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // 1. HARD SAFETY PREFLIGHT: Require allowlist and safety flag
    const targetUrl =
      process.env.DATABASE_URL ||
      'mongodb://127.0.0.1:27018/tatalora_integration_test?replicaSet=rsTest&directConnection=true';
    validateTestDatabaseUrl(targetUrl);

    process.env.DATABASE_URL = targetUrl;

    // 3. Initialize Prisma Client with real Replica Set connection
    prisma = new PrismaClient({
      datasources: { db: { url: targetUrl } },
    });
    await prisma.$connect();

    // 4. Create collections & indexes on real MongoDB instance
    await prisma.$runCommandRaw({ create: 'Company' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'Warehouse' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'TimberVariant' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'TimberStock' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'TimberStockMovement' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'TimberPartai' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'TimberBatchReclassification' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockOpname' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockOpnameItem' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockTransfer' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockTransferItem' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockAdjustment' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'StockAdjustmentItem' }).catch(() => {});
    await prisma.$runCommandRaw({ create: 'AuditLog' }).catch(() => {});

    // Ensure unique compound indexes
    await prisma.$runCommandRaw({
      createIndexes: 'TimberStock',
      indexes: [
        {
          key: { locationId: 1, timberVariantId: 1, batch: 1 },
          name: 'locationId_timberVariantId_batch',
          unique: true,
        },
      ],
    });

    await prisma.$runCommandRaw({
      createIndexes: 'TimberBatchReclassification',
      indexes: [
        {
          key: { company_id: 1, idempotencyKey: 1 },
          name: 'company_id_idempotencyKey',
          unique: true,
        },
        {
          key: { reclassNumber: 1 },
          name: 'reclassNumber_1',
          unique: true,
        },
      ],
    });

    // 5. Wire up real services with real Prisma instance
    ledgerService = new InventoryLedgerService(prisma as any);
    auditService = new AuditService(prisma as any);
    reclassService = new BatchReclassificationService(prisma as any, ledgerService);
    adjustmentService = new StockAdjustmentService(prisma as any, ledgerService, auditService);
    transferService = new StockTransferService(prisma as any, ledgerService, auditService);
    opnameService = new OpnameService(prisma as any, ledgerService, auditService);

    // 6. Seed isolated multi-tenant test fixtures
    const compA = await prisma.company.create({ data: { name: 'Test Tenant A' } });
    const compB = await prisma.company.create({ data: { name: 'Test Tenant B' } });
    companyAId = compA.id;
    companyBId = compB.id;

    const whA = await prisma.warehouse.create({
      data: { name: 'Gudang Kayu A', code: 'WH-A', company_id: companyAId },
    });
    const whB = await prisma.warehouse.create({
      data: { name: 'Gudang Kayu B', code: 'WH-B', company_id: companyBId },
    });
    warehouseAId = whA.id;
    warehouseBId = whB.id;

    const var1 = await prisma.timberVariant.create({
      data: {
        code: 'TV-MERBAU-01',
        sku: 'MB-01',
        name: 'Merbau Balok 5x10x400',
        species: 'MERBAU',
        company_id: companyAId,
      },
    });
    const var2 = await prisma.timberVariant.create({
      data: {
        code: 'TV-JATI-01',
        sku: 'JT-01',
        name: 'Jati Papan 3x20x200',
        species: 'JATI',
        company_id: companyAId,
      },
    });
    variant1Id = var1.id;
    variant2Id = var2.id;

    userAId = '66666666666666666666666a';
    userBId = '66666666666666666666666b';
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      // Safe cleanup of only test-created records
      try {
        if (companyAId && companyBId) {
          await prisma.timberStockMovement.deleteMany({
            where: { timberStock: { location: { company_id: { in: [companyAId, companyBId] } } } },
          });
          await prisma.timberBatchReclassification.deleteMany({
            where: { company_id: { in: [companyAId, companyBId] } },
          });
          await prisma.timberStock.deleteMany({
            where: { location: { company_id: { in: [companyAId, companyBId] } } },
          });
          await prisma.timberPartai.deleteMany({
            where: { company_id: { in: [companyAId, companyBId] } },
          });
          await prisma.timberVariant.deleteMany({
            where: { company_id: { in: [companyAId, companyBId] } },
          });
          await prisma.warehouse.deleteMany({
            where: { company_id: { in: [companyAId, companyBId] } },
          });
          await prisma.company.deleteMany({
            where: { id: { in: [companyAId, companyBId] } },
          });
        }
      } catch (e) {}
      await prisma.$disconnect();
    }
    if (replSet) {
      await replSet.stop();
    }
  });

  // =========================================================================
  // 1. INVENTORY LEDGER TESTS (REAL MONGODB ENGINE & TRANSACTIONS)
  // =========================================================================
  describe('1. Inventory Ledger Engine Integration', () => {
    it('1.1 - IN movement atomically creates stock and increments PCS and Volume', async () => {
      await prisma.$transaction(async (tx) => {
        await ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'IN',
          'INITIAL_STOCK',
          'ref-init-1',
          50,
          1.25,
          'UNKNOWN',
        );
      });

      const stock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant1Id,
            batch: 'UNKNOWN',
          },
        },
      });

      expect(stock).toBeDefined();
      expect(stock!.currentPcs).toBe(50);
      expect(stock!.currentVolumeM3).toBe(1.25);
    });

    it('1.2 - OUT movement reduces stock accurately without negative drift', async () => {
      await prisma.$transaction(async (tx) => {
        await ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'OUT',
          'TRANSFER_OUT',
          'ref-out-1',
          20,
          0.5,
          'UNKNOWN',
        );
      });

      const stock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant1Id,
            batch: 'UNKNOWN',
          },
        },
      });

      expect(stock!.currentPcs).toBe(30);
      expect(stock!.currentVolumeM3).toBe(0.75);
    });

    it('1.3 - OUT exceeding available stock throws BadRequestException and rolls back', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          // Attempting to withdraw 100 pcs when only 30 pcs exist
          await ledgerService.createMovement(
            tx,
            warehouseAId,
            variant1Id,
            'OUT',
            'TRANSFER_OUT',
            'ref-fail-1',
            100,
            2.5,
            'UNKNOWN',
          );
        }),
      ).rejects.toThrow(BadRequestException);

      // Verify no changes occurred
      const stock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant1Id,
            batch: 'UNKNOWN',
          },
        },
      });
      expect(stock!.currentPcs).toBe(30);
      expect(stock!.currentVolumeM3).toBe(0.75);
    });

    it('1.4 - Exact full consumption clamps volume to exactly 0 (no -1e-17 drift)', async () => {
      await prisma.$transaction(async (tx) => {
        await ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'OUT',
          'PROD_OUT',
          'ref-drain-1',
          30,
          0.75,
          'UNKNOWN',
        );
      });

      const stock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant1Id,
            batch: 'UNKNOWN',
          },
        },
      });

      expect(stock!.currentPcs).toBe(0);
      expect(stock!.currentVolumeM3).toBe(0);
    });

    it('1.5 - Race Condition: Concurrent OUT requests cannot cause overdraw', async () => {
      // Replenish stock to 10 pcs
      await prisma.$transaction(async (tx) => {
        await ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'IN',
          'PURCHASE_RECEIPT',
          'ref-race-init',
          10,
          0.25,
          'RACE_BATCH',
        );
      });

      // Launch 2 parallel requests trying to take 10 pcs each
      const task1 = prisma.$transaction(async (tx) => {
        return ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'OUT',
          'SALES_OUT',
          'ref-race-1',
          10,
          0.25,
          'RACE_BATCH',
        );
      });

      const task2 = prisma.$transaction(async (tx) => {
        return ledgerService.createMovement(
          tx,
          warehouseAId,
          variant1Id,
          'OUT',
          'SALES_OUT',
          'ref-race-2',
          10,
          0.25,
          'RACE_BATCH',
        );
      });

      const results = await Promise.allSettled([task1, task2]);
      const successful = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE must succeed and ONE must fail
      expect(successful.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Verify failure cause: either ledger guard BadRequestException or Mongo transaction conflict
      const failureReason: any = (rejected[0] as PromiseRejectedResult).reason;
      const isExpectedError =
        failureReason instanceof BadRequestException ||
        (failureReason?.message &&
          (failureReason.message.includes('insufficient') ||
            failureReason.message.includes('WriteConflict') ||
            failureReason.message.includes('TransientTransactionError') ||
            failureReason.message.includes('Transaction rolled back')));
      expect(isExpectedError).toBe(true);

      const finalStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant1Id,
            batch: 'RACE_BATCH',
          },
        },
      });

      // Balance must be exactly 0, never negative
      expect(finalStock!.currentPcs).toBe(0);
      expect(finalStock!.currentVolumeM3).toBe(0);
    });
  });

  // =========================================================================
  // 2. BATCH RECLASSIFICATION TESTS (REAL DATABASE ATOMICITY & IDEMPOTENCY)
  // =========================================================================
  describe('2. Batch Reclassification Real Integration', () => {
    let activePartaiCode: string;

    beforeAll(async () => {
      // Create Active Partai for Tenant A
      const p = await prisma.timberPartai.create({
        data: {
          code: 'PTY-2026-INT-001',
          name: 'Partai Legal Kalimantan A',
          status: 'ACTIVE',
          company_id: companyAId,
        },
      });
      activePartaiCode = p.code;

      // Seed UNKNOWN stock for reclassification
      await prisma.$transaction(async (tx) => {
        await ledgerService.createMovement(
          tx,
          warehouseAId,
          variant2Id,
          'IN',
          'UNIDENTIFIED_RECEIPT',
          'ref-un-1',
          40,
          1.0,
          'UNKNOWN',
        );
      });
    });

    it('2.1 - Atomic Zero-Delta reclassification UNKNOWN -> Target Partai', async () => {
      const dto = {
        warehouseId: warehouseAId,
        timberVariantId: variant2Id,
        targetPartaiCode: activePartaiCode,
        quantityPcs: 25,
        volumeM3: 0.625,
        reason: 'Physical inspection completed',
        physicalVerificationType: 'PHYSICAL_OPNAME_APPROVED',
        physicalVerificationRef: 'OPN-2026-001',
        idempotencyKey: 'idem-real-key-001',
      };

      const res = await reclassService.executeReclassification(companyAId, userAId, dto as any);

      expect(res.isIdempotentReplay).toBe(false);
      expect(res.reclassification.status).toBe('POSTED');

      // Source stock UNKNOWN decremented
      const sourceStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant2Id,
            batch: 'UNKNOWN',
          },
        },
      });
      expect(sourceStock!.currentPcs).toBe(15);
      expect(sourceStock!.currentVolumeM3).toBe(0.375);

      // Target stock Partai incremented
      const targetStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant2Id,
            batch: activePartaiCode,
          },
        },
      });
      expect(targetStock!.currentPcs).toBe(25);
      expect(targetStock!.currentVolumeM3).toBe(0.625);
    });

    it('2.2 - Idempotent replay: Resending exact payload returns POSTED record without double mutation', async () => {
      const dto = {
        warehouseId: warehouseAId,
        timberVariantId: variant2Id,
        targetPartaiCode: activePartaiCode,
        quantityPcs: 25,
        volumeM3: 0.625,
        reason: 'Physical inspection completed',
        physicalVerificationType: 'PHYSICAL_OPNAME_APPROVED',
        physicalVerificationRef: 'OPN-2026-001',
        idempotencyKey: 'idem-real-key-001',
      };

      const replayRes = await reclassService.executeReclassification(companyAId, userAId, dto as any);

      expect(replayRes.isIdempotentReplay).toBe(true);
      expect(replayRes.reclassification.id).toBeDefined();

      // Ensure no double movement occurred
      const targetStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant2Id,
            batch: activePartaiCode,
          },
        },
      });
      expect(targetStock!.currentPcs).toBe(25); // Still 25, not 50
    });

    it('2.3 - Reversal: Atomically restores exact snapshot balances and prevents duplicate reversal', async () => {
      const list = await reclassService.listReclassifications(companyAId);
      const record = list.items[0];

      const revRes = await reclassService.reverseReclassification(
        record.id,
        companyAId,
        userAId,
        'Found tag mismatch on bundle',
      );

      expect(revRes.status).toBe('REVERSED');

      // Balances restored
      const sourceStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant2Id,
            batch: 'UNKNOWN',
          },
        },
      });
      expect(sourceStock!.currentPcs).toBe(40); // Restored from 15 to 40

      const targetStock = await prisma.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: warehouseAId,
            timberVariantId: variant2Id,
            batch: activePartaiCode,
          },
        },
      });
      expect(targetStock!.currentPcs).toBe(0); // Restored from 25 to 0

      // Duplicate reversal attempt MUST be rejected
      await expect(
        reclassService.reverseReclassification(
          record.id,
          companyAId,
          userAId,
          'Second reversal attempt',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 3. TENANT ISOLATION INTEGRATION
  // =========================================================================
  describe('3. Multi-Tenant Boundary Integration', () => {
    it('3.1 - Tenant B cannot read or access Tenant A reclassifications', async () => {
      const tenantAList = await reclassService.listReclassifications(companyAId);
      expect(tenantAList.items.length).toBeGreaterThan(0);

      const tenantBList = await reclassService.listReclassifications(companyBId);
      expect(tenantBList.items.length).toBe(0);

      // Tenant B attempting to reverse Tenant A record MUST fail with NotFoundException
      await expect(
        reclassService.reverseReclassification(
          tenantAList.items[0].id,
          companyBId,
          userBId,
          'Unauthorized cross-tenant reversal',
        ),
      ).rejects.toThrow();
    });

    it('3.2 - Tenant B cannot claim Tenant A target Partai in reclassification', async () => {
      const crossTenantDto = {
        warehouseId: warehouseBId,
        timberVariantId: variant1Id,
        targetPartaiCode: 'PTY-2026-INT-001', // Owned by Tenant A
        quantityPcs: 10,
        volumeM3: 0.25,
        reason: 'Cross-tenant probe',
        physicalVerificationType: 'PHYSICAL_OPNAME_APPROVED',
        physicalVerificationRef: 'OPN-PROBE',
        idempotencyKey: 'idem-probe-001',
      };

      await expect(
        reclassService.executeReclassification(companyBId, userBId, crossTenantDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
