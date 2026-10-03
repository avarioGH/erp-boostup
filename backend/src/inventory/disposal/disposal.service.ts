import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory.service';
import { CreateDisposalDto } from './disposal.dto';

@Injectable()
export class DisposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async list(companyId: string) {
    return this.prisma.inventoryDisposal.findMany({
      where: { company_id: companyId },
      include: {
        warehouse: true,
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async detail(id: string, companyId: string) {
    const disposal = await this.prisma.inventoryDisposal.findFirst({
      where: { id, company_id: companyId },
      include: {
        items: {
          include: { product: true },
        },
        warehouse: true,
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    if (!disposal) throw new NotFoundException('Disposal not found');
    return disposal;
  }

  async create(dto: CreateDisposalDto, userId: string) {
    const nextNum = await this.prisma.inventoryDisposal.count({
      where: { company_id: dto.companyId },
    });
    const disposalNo = `DSP-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${String(nextNum + 1).padStart(4, '0')}`;

    return this.prisma.inventoryDisposal.create({
      data: {
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        disposal_number: disposalNo,
        disposal_date: new Date(),
        reason: dto.reason,
        notes: dto.notes,
        status: 'DRAFT',
        created_by: userId,
        items: {
          create: dto.items.map((item) => ({
            product_id: item.productId,
            qty: item.quantity,
            notes: item.reason,
          })),
        },
      },
      include: { items: true },
    });
  }

  async submit(id: string, companyId: string) {
    const disposal = await this.detail(id, companyId);
    if (disposal.status !== 'DRAFT')
      throw new BadRequestException('Only DRAFT disposal can be submitted');

    return this.prisma.inventoryDisposal.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  async cancel(id: string, companyId: string) {
    const disposal = await this.detail(id, companyId);
    if (disposal.status !== 'PENDING' && disposal.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only PENDING or DRAFT disposal can be cancelled',
      );
    }

    return this.prisma.inventoryDisposal.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async reject(id: string, companyId: string, userId: string, notes?: string) {
    const disposal = await this.detail(id, companyId);
    if (disposal.status !== 'PENDING')
      throw new BadRequestException('Only PENDING disposal can be rejected');

    return this.prisma.inventoryDisposal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: notes
          ? `${disposal.notes || ''}\nReject Notes: ${notes}`
          : disposal.notes,
      },
    });
  }

  async approve(id: string, companyId: string, userId: string) {
    const disposal = await this.detail(id, companyId);
    if (disposal.status !== 'PENDING')
      throw new BadRequestException('Only PENDING disposal can be approved');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update status
      const updated = await tx.inventoryDisposal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date(),
        },
      });

      // 2. Issue stock
      for (const item of disposal.items) {
        await this.inventoryService.issueStock(tx, {
          companyId,
          warehouseId: disposal.warehouse_id,
          productId: item.product_id,
          quantity: item.qty,
          referenceType: 'DISPOSAL',
          referenceId: id,
          userId,
          description: `Disposal ${disposal.disposal_number}`,
          allowNegative: false,
        });
      }

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          action: 'APPROVE',
          entity: 'InventoryDisposal',
          entity_id: id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          after_data: updated as any,
        },
      });

      return updated;
    });
  }
}
