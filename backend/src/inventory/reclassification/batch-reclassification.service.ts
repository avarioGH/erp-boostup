import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

export type ReclassificationEligibilityStatus =
  | 'ELIGIBLE'
  | 'MANUAL_REVIEW'
  | 'REJECTED';

export class EvaluateEligibilityDto {
  warehouseId: string;
  timberVariantId: string;
  targetPartaiCode: string;
  requestedPcs: number;
  requestedVolumeM3: number;
  hasOutflowHistory?: boolean;
  hasMultiInflowMixed?: boolean;
  physicalVerificationType:
    | 'PHYSICAL_OPNAME_APPROVED'
    | 'PHYSICAL_TALLY_AUDITED'
    | 'DELIVERY_DOC'
    | 'NONE';
  physicalVerificationRef?: string;
  physicalVerifiedPcs?: number;
  physicalVerifiedVolumeM3?: number;
}

export class ExecuteReclassificationDto {
  idempotencyKey: string;
  warehouseId: string;
  timberVariantId: string;
  targetPartaiCode: string;
  quantityPcs: number;
  volumeM3: number;
  reason: string;
  evidenceType: 'PHYSICAL_OPNAME_APPROVED' | 'PHYSICAL_TALLY_AUDITED' | 'DELIVERY_DOC';
  evidenceRef: string;
  approvedBy?: string;
}

@Injectable()
export class BatchReclassificationService {
  constructor(
    private prisma: PrismaService,
    private ledger: InventoryLedgerService,
  ) {}

  /**
   * 1. EVALUATE ELIGIBILITY (Unified Decision Table)
   */
  async evaluateEligibility(
    companyId: string,
    dto: EvaluateEligibilityDto,
  ): Promise<{
    status: ReclassificationEligibilityStatus;
    reason: string;
    availableUnknownPcs: number;
    availableUnknownVolumeM3: number;
    maxEligiblePcs: number;
    maxEligibleVolumeM3: number;
  }> {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    // 1. Validate Warehouse ownership
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, company_id: companyId },
    });
    if (!warehouse) {
      return {
        status: 'REJECTED',
        reason: 'Warehouse not found or does not belong to the authenticated company.',
        availableUnknownPcs: 0,
        availableUnknownVolumeM3: 0,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    // 2. Validate Target Partai
    const targetPartai = await this.prisma.timberPartai.findFirst({
      where: { code: dto.targetPartaiCode, company_id: companyId },
    });
    if (!targetPartai) {
      return {
        status: 'REJECTED',
        reason: `Target Partai '${dto.targetPartaiCode}' is not registered under this company.`,
        availableUnknownPcs: 0,
        availableUnknownVolumeM3: 0,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    if (targetPartai.status !== 'ACTIVE') {
      return {
        status: 'REJECTED',
        reason: `Target Partai '${dto.targetPartaiCode}' is status '${targetPartai.status}'. Only ACTIVE Partais are eligible to receive reclassified timber.`,
        availableUnknownPcs: 0,
        availableUnknownVolumeM3: 0,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    // 3. Check current UNKNOWN bucket stock
    const unknownStock = await this.prisma.timberStock.findUnique({
      where: {
        locationId_timberVariantId_batch: {
          locationId: dto.warehouseId,
          timberVariantId: dto.timberVariantId,
          batch: 'UNKNOWN',
        },
      },
    });

    const currentPcs = unknownStock ? unknownStock.currentPcs : 0;
    const currentM3 = unknownStock ? unknownStock.currentVolumeM3 : 0;

    // Reject if balance is insufficient
    if (
      currentPcs < dto.requestedPcs ||
      currentM3 < dto.requestedVolumeM3 - 0.0001
    ) {
      return {
        status: 'REJECTED',
        reason: `Insufficient UNKNOWN stock. Requested: ${dto.requestedPcs} pcs, ${dto.requestedVolumeM3} m3 | Available: ${currentPcs} pcs, ${currentM3} m3.`,
        availableUnknownPcs: currentPcs,
        availableUnknownVolumeM3: currentM3,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    // 4. Evidence check: must have physical evidence
    if (
      !dto.physicalVerificationType ||
      dto.physicalVerificationType === 'NONE' ||
      !dto.physicalVerificationRef
    ) {
      return {
        status: 'MANUAL_REVIEW',
        reason:
          'Provenance cannot be proven solely by numerical stock availability. Physical evidence (approved opname, audited tally, or delivery doc) is required.',
        availableUnknownPcs: currentPcs,
        availableUnknownVolumeM3: currentM3,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    // 5. Outflow / Multi-inflow check
    if (dto.hasMultiInflowMixed) {
      return {
        status: 'MANUAL_REVIEW',
        reason:
          'Stock has multiple mixed inflow sources. Proportional/FIFO assumptions are prohibited. Manual sorting or bundle-level opname required.',
        availableUnknownPcs: currentPcs,
        availableUnknownVolumeM3: currentM3,
        maxEligiblePcs: 0,
        maxEligibleVolumeM3: 0,
      };
    }

    if (dto.hasOutflowHistory) {
      const verifiedPcs = dto.physicalVerifiedPcs ?? 0;
      const verifiedM3 = dto.physicalVerifiedVolumeM3 ?? 0;

      if (verifiedPcs <= 0 || verifiedM3 <= 0) {
        return {
          status: 'MANUAL_REVIEW',
          reason:
            'UNKNOWN bucket has historical outflows. Remaining lot identity must be physically verified via audited tally/opname.',
          availableUnknownPcs: currentPcs,
          availableUnknownVolumeM3: currentM3,
          maxEligiblePcs: 0,
          maxEligibleVolumeM3: 0,
        };
      }

      const maxPcs = Math.min(currentPcs, verifiedPcs);
      const maxM3 = Math.min(currentM3, verifiedM3);

      if (dto.requestedPcs > maxPcs || dto.requestedVolumeM3 > maxM3 + 0.0001) {
        return {
          status: 'MANUAL_REVIEW',
          reason: `Requested reclassification exceeds physically verified remaining quantity (${maxPcs} pcs, ${maxM3} m3).`,
          availableUnknownPcs: currentPcs,
          availableUnknownVolumeM3: currentM3,
          maxEligiblePcs: maxPcs,
          maxEligibleVolumeM3: maxM3,
        };
      }

      return {
        status: 'ELIGIBLE',
        reason: `Physically verified remaining lot matches requested quantity (${dto.requestedPcs} pcs, ${dto.requestedVolumeM3} m3).`,
        availableUnknownPcs: currentPcs,
        availableUnknownVolumeM3: currentM3,
        maxEligiblePcs: maxPcs,
        maxEligibleVolumeM3: maxM3,
      };
    }

    // 6. Clean single lot scenario
    return {
      status: 'ELIGIBLE',
      reason:
        'Authoritative evidence and active target Partai verified. Saldo and physical verification criteria fully met.',
      availableUnknownPcs: currentPcs,
      availableUnknownVolumeM3: currentM3,
      maxEligiblePcs: Math.min(currentPcs, dto.requestedPcs),
      maxEligibleVolumeM3: Math.min(currentM3, dto.requestedVolumeM3),
    };
  }

  /**
   * 2. EXECUTE ZERO-DELTA RECLASSIFICATION
   * Atomically transfers stock UNKNOWN -> Target Partai within a single transaction.
   */
  async executeReclassification(
    companyId: string,
    userId: string,
    dto: ExecuteReclassificationDto,
  ) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }
    if (!dto.idempotencyKey || dto.idempotencyKey.trim() === '') {
      throw new BadRequestException('Idempotency key is strictly required');
    }

    // Safe float precision (4 decimal places)
    const safeVolumeM3 = Math.round(Number(dto.volumeM3) * 10000) / 10000;
    const safeQuantityPcs = Math.floor(Number(dto.quantityPcs));

    if (safeQuantityPcs <= 0 || safeVolumeM3 <= 0) {
      throw new BadRequestException(
        'Quantity PCS and Volume M3 must both be positive non-zero numbers',
      );
    }

    // Check existing transaction by idempotency key (Idempotent replay)
    const existing = await this.prisma.timberBatchReclassification.findUnique({
      where: {
        company_id_idempotencyKey: {
          company_id: companyId,
          idempotencyKey: dto.idempotencyKey,
        },
      },
    });

    if (existing) {
      return {
        reclassification: existing,
        isIdempotentReplay: true,
      };
    }

    // Execute atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Warehouse
      const warehouse = await tx.warehouse.findFirst({
        where: { id: dto.warehouseId, company_id: companyId },
      });
      if (!warehouse) {
        throw new NotFoundException('Warehouse not found or access denied');
      }

      // 2. Validate Target Partai
      const targetPartai = await tx.timberPartai.findFirst({
        where: { code: dto.targetPartaiCode, company_id: companyId },
      });
      if (!targetPartai) {
        throw new NotFoundException(
          `Target Partai '${dto.targetPartaiCode}' not found`,
        );
      }
      if (targetPartai.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Target Partai '${dto.targetPartaiCode}' is ${targetPartai.status}. Only ACTIVE Partais can receive reclassified timber.`,
        );
      }

      // 3. Pre-check source UNKNOWN stock balance
      const sourceStock = await tx.timberStock.findUnique({
        where: {
          locationId_timberVariantId_batch: {
            locationId: dto.warehouseId,
            timberVariantId: dto.timberVariantId,
            batch: 'UNKNOWN',
          },
        },
      });

      if (!sourceStock) {
        throw new BadRequestException(
          'No UNKNOWN stock bucket exists for this variant in this warehouse',
        );
      }

      if (
        sourceStock.currentPcs < safeQuantityPcs ||
        sourceStock.currentVolumeM3 < safeVolumeM3 - 0.000001
      ) {
        throw new BadRequestException(
          `Insufficient UNKNOWN stock. Required: ${safeQuantityPcs} pcs, ${safeVolumeM3} m3 | Available: ${sourceStock.currentPcs} pcs, ${sourceStock.currentVolumeM3} m3`,
        );
      }

      // 4. Generate transaction number (Unique per company)
      const count = await tx.timberBatchReclassification.count({
        where: { company_id: companyId },
      });
      const reclassNumber = `BRC-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

      // 5. Create Audit Record
      const record = await tx.timberBatchReclassification.create({
        data: {
          company_id: companyId,
          reclassNumber,
          idempotencyKey: dto.idempotencyKey,
          warehouseId: dto.warehouseId,
          timberVariantId: dto.timberVariantId,
          sourceBatch: 'UNKNOWN',
          targetBatch: dto.targetPartaiCode,
          quantityPcs: safeQuantityPcs,
          volumeM3: safeVolumeM3,
          status: 'POSTED',
          reason: dto.reason,
          evidenceType: dto.evidenceType,
          evidenceRef: dto.evidenceRef,
          createdBy: userId,
          approvedBy: dto.approvedBy || userId,
        },
      });

      // 6. Zero-Delta Step A: Outflow from UNKNOWN bucket
      await this.ledger.createMovement(
        tx,
        dto.warehouseId,
        dto.timberVariantId,
        'OUT',
        'BATCH_RECLASSIFICATION',
        record.id,
        safeQuantityPcs,
        safeVolumeM3,
        'UNKNOWN',
      );

      // 7. Zero-Delta Step B: Inflow into Target Partai bucket
      await this.ledger.createMovement(
        tx,
        dto.warehouseId,
        dto.timberVariantId,
        'IN',
        'BATCH_RECLASSIFICATION',
        record.id,
        safeQuantityPcs,
        safeVolumeM3,
        dto.targetPartaiCode,
      );

      return {
        reclassification: record,
        isIdempotentReplay: false,
      };
    }).catch(async (error: any) => {
      // Parallel race condition handler:
      // If two identical requests hit the server concurrently, the second one will hit P2002
      // on (company_id, idempotencyKey). Catch P2002 and verify it's the idempotency constraint.
      if (error?.code === 'P2002') {
        const target = Array.isArray(error?.meta?.target)
          ? error.meta.target.join(',')
          : String(error?.meta?.target || '');
        // Strictly verify that the unique collision is on idempotencyKey
        const isIdempotencyKeyError =
          target.includes('idempotencyKey') ||
          (error.message && error.message.includes('idempotencyKey'));

        if (isIdempotencyKeyError) {
          const replay = await this.prisma.timberBatchReclassification.findUnique({
            where: {
              company_id_idempotencyKey: {
                company_id: companyId,
                idempotencyKey: dto.idempotencyKey,
              },
            },
          });
          if (replay && replay.status === 'POSTED') {
            return {
              reclassification: replay,
              isIdempotentReplay: true,
            };
          }
        }
      }
      throw error;
    });
  }

  /**
   * 3. CONTROLLED REVERSAL
   * Atomically reverts a POSTED reclassification using historical snapshot values.
   */
  async reverseReclassification(
    id: string,
    companyId: string,
    userId: string,
    reversalReason: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }
    if (!reversalReason || reversalReason.trim() === '') {
      throw new BadRequestException('Reversal reason must be provided');
    }

    const record = await this.prisma.timberBatchReclassification.findFirst({
      where: { id, company_id: companyId },
    });
    if (!record) {
      throw new NotFoundException('Reclassification record not found or access denied');
    }

    if (record.status === 'REVERSED') {
      throw new BadRequestException(
        'This reclassification transaction has already been reversed',
      );
    }
    if (record.status !== 'POSTED') {
      throw new BadRequestException(
        `Only POSTED reclassifications can be reversed (current status: ${record.status})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Atomic status transition guard (prevent double reversal)
      const updateResult = await tx.timberBatchReclassification.updateMany({
        where: { id, company_id: companyId, status: 'POSTED' },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: userId,
          reversalReason,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Reclassification is no longer in POSTED status or is already reversed',
        );
      }

      // 2. Exact snapshot-based rollback values
      const pcs = record.quantityPcs;
      const m3 = record.volumeM3;

      // 3. Reverse Target Partai (OUT)
      await this.ledger.createMovement(
        tx,
        record.warehouseId,
        record.timberVariantId,
        'OUT',
        'BATCH_RECLASSIFICATION_REVERSAL',
        record.id,
        pcs,
        m3,
        record.targetBatch,
      );

      // 4. Return to UNKNOWN (IN)
      await this.ledger.createMovement(
        tx,
        record.warehouseId,
        record.timberVariantId,
        'IN',
        'BATCH_RECLASSIFICATION_REVERSAL',
        record.id,
        pcs,
        m3,
        'UNKNOWN',
      );

      return tx.timberBatchReclassification.findUnique({
        where: { id },
      });
    });
  }

  /**
   * 4. AUDIT QUERY (List reclassification history)
   */
  async listReclassifications(
    companyId: string,
    params?: {
      warehouseId?: string;
      variantId?: string;
      status?: string;
      skip?: number;
      take?: number;
    },
  ) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    const where: any = { company_id: companyId };
    if (params?.warehouseId) where.warehouseId = params.warehouseId;
    if (params?.variantId) where.timberVariantId = params.variantId;
    if (params?.status) where.status = params.status;

    const skip = Number(params?.skip || 0);
    const take = Number(params?.take || 50);

    const [items, total] = await Promise.all([
      this.prisma.timberBatchReclassification.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          timberVariant: { select: { id: true, sku: true, species: true } },
        },
      }),
      this.prisma.timberBatchReclassification.count({ where }),
    ]);

    return { items, total, skip, take };
  }
}
