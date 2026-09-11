import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryLedgerService } from './inventory-ledger.service';
import { AuditService } from '../core/audit.service';

@Injectable()
export class SawnTimberService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: InventoryLedgerService,
    private audit: AuditService
  ) {}

  async listOutputs(params: {
    skip?: number; take?: number; search?: string;
    locationId?: string; status?: string;
  }) {
    const { skip = 0, take = 50, search, locationId, status } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { bundleNumber: { contains: search, mode: 'insensitive' } },
        { batch: { contains: search, mode: 'insensitive' } },
        { inputLog: { inputNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.sawnTimberOutput.findMany({
        skip: Number(skip), take: Number(take), where,
        orderBy: { createdAt: 'desc' },
        include: { location: true, inputLog: true, items: { include: { timberVariant: true } } }
      }),
      this.prisma.sawnTimberOutput.count({ where })
    ]);
    return { items, total, skip: Number(skip), take: Number(take) };
  }

  async getOutput(id: string) {
    const output = await this.prisma.sawnTimberOutput.findUnique({
      where: { id },
      include: { 
        location: true, 
        inputLog: { include: { items: { include: { trimmedLog: { include: { rawLog: true } } } } } },
        items: { include: { timberVariant: true } }
      }
    });
    if (!output) throw new NotFoundException('Output not found');
    return output;
  }

  private normalizeDimensions(t: number, w: number, l: number) {
    if (t <= 0 || w <= 0 || l <= 0) throw new BadRequestException('Dimensions must be positive');
    return `${t} \u00d7 ${w} \u00d7 ${l}`;
  }

  async getOrCreateTimberVariant(species: string, grade: string, thickness: number, width: number, length: number) {
    const sizeStr = this.normalizeDimensions(thickness, width, length);
    const sku = `${species.toUpperCase()}-${grade.toUpperCase()}-${sizeStr}`;
    const volumePerPiece = (thickness * width * length) / 1000000000;

    let variant = await this.prisma.timberVariant.findUnique({ where: { sku } });
    if (!variant) {
      const product = await this.prisma.product.findFirst({ where: { code: species } });
      if (!product) throw new BadRequestException(`Master product for species ${species} not found. Please create it first.`);
      
      variant = await this.prisma.timberVariant.create({
        data: {
          productId: product.id,
          species,
          grade,
          thickness,
          width,
          length,
          sku,
          volumePerPiece
        }
      });
    }
    return variant;
  }

  async createOutput(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const { inputLogId, outputDate, shift, locationId, batch, notes, items } = data;
      
      if (!items || items.length === 0) throw new BadRequestException('Output must contain at least one item');

      const inputLog = await tx.inputLog.findUnique({ where: { id: inputLogId } });
      if (!inputLog) throw new NotFoundException('Input log not found');
      if (inputLog.status !== 'AVAILABLE' && inputLog.status !== 'IN_PROCESS') {
         throw new BadRequestException('Input log is not available for production');
      }

      const dateObj = outputDate ? new Date(outputDate) : new Date();
      const YY = String(dateObj.getFullYear()).slice(2);
      const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const machineStr = inputLog.machine || '1';
      
      const count = await tx.sawnTimberOutput.count({
        where: { bundleNumber: { startsWith: `O-MSAW-${machineStr}-${YY}-${MM}` } }
      });
      const seq = String(count + 1).padStart(3, '0');
      const bundleNumber = `O-MSAW-${machineStr}-${YY}-${MM}-${seq}`;

      const output = await tx.sawnTimberOutput.create({
        data: {
          bundleNumber,
          outputDate: dateObj,
          shift,
          locationId,
          inputLogId,
          batch,
          notes,
          status: 'DRAFT'
        }
      });

      for (const item of items) {
        const variant = await this.getOrCreateTimberVariant(inputLog.species, item.grade || 'A', item.thickness, item.width, item.length);
        const volumeM3 = variant.volumePerPiece * item.quantityPcs;
        
        await tx.sawnTimberOutputItem.create({
          data: {
            outputId: output.id,
            timberVariantId: variant.id,
            grade: item.grade || 'A',
            quantityPcs: item.quantityPcs,
            thicknessMm: item.thickness,
            widthMm: item.width,
            lengthMm: item.length,
            volumeM3
          }
        });
      }

      await tx.inputLog.update({
        where: { id: inputLog.id },
        data: { status: 'IN_PROCESS' }
      });

      return output;
    });
  }

  async postOutput(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const output = await tx.sawnTimberOutput.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!output) throw new NotFoundException('Output not found');
      if (output.status !== 'DRAFT') throw new BadRequestException('Only DRAFT outputs can be posted');

      await tx.sawnTimberOutput.update({ where: { id }, data: { status: 'POSTED' } });

      for (const item of output.items) {
        await this.ledgerService.createMovement(
          tx as any,
          output.locationId,
          item.timberVariantId,
          'IN',
          'PRODUCTION_OUTPUT',
          output.id,
          item.quantityPcs,
          item.volumeM3
        );
      }

      return output;
    });
  }

  async cancelOutput(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const output = await tx.sawnTimberOutput.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!output) throw new NotFoundException('Output not found');
      if (output.status === 'CANCELLED') throw new BadRequestException('Output already cancelled');

      if (output.status === 'POSTED') {
        for (const item of output.items) {
          await this.ledgerService.createMovement(
            tx as any,
            output.locationId,
            item.timberVariantId,
            'OUT',
            'REVERSAL',
            output.id,
            item.quantityPcs,
            item.volumeM3
          );
        }
      }

      await tx.sawnTimberOutput.update({ where: { id }, data: { status: 'CANCELLED' } });
      return output;
    });
  }

  async listStock(params: {
    skip?: number; take?: number; search?: string; locationId?: string;
  }) {
    const { skip = 0, take = 50, search, locationId } = params;
    const where: any = {};
    if (search) {
      where.timberVariant = { sku: { contains: search, mode: 'insensitive' } };
    }
    if (locationId) where.locationId = locationId;

    const [items, total] = await Promise.all([
      this.prisma.timberStock.findMany({
        skip: Number(skip), take: Number(take), where,
        include: { location: true, timberVariant: true },
        orderBy: { timberVariant: { sku: 'asc' } }
      }),
      this.prisma.timberStock.count({ where })
    ]);
    return { items, total, skip: Number(skip), take: Number(take) };
  }
}
