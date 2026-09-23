import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async create(companyId: string, data: any) {
    const { shipmentNumber, shipmentDate, warehouseId, vehicleId, driverId, customerId, notes, items } = data;

    // Validate if shipmentNumber exists
    const existing = await this.prisma.timberShipment.findUnique({
      where: { shipmentNumber }
    });
    if (existing) {
      throw new BadRequestException(`Shipment with number ${shipmentNumber} already exists`);
    }

    let totalPcs = 0;
    let totalVolumeM3 = 0;
    
    for (const item of items) {
      totalPcs += item.quantityPcs;
      totalVolumeM3 += item.volumeM3;
    }

    const shipment = await this.prisma.timberShipment.create({
      data: {
        company_id: companyId,
        shipmentNumber,
        shipmentDate: shipmentDate ? new Date(shipmentDate) : undefined,
        warehouseId,
        vehicleId,
        driverId,
        customerId,
        notes,
        status: 'DRAFT',
        totalPcs,
        totalVolumeM3,
        items: {
          create: items.map(item => ({
            timberVariantId: item.timberVariantId,
            quantityPcs: item.quantityPcs,
            volumeM3: item.volumeM3
          }))
        }
      },
      include: {
        items: true
      }
    });

    return shipment;
  }

  async confirm(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.timberShipment.findFirst({
        where: { id, company_id: companyId },
        include: { items: true }
      });

      if (!shipment) {
        throw new NotFoundException('Timber shipment not found');
      }

      if (shipment.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT shipment can be confirmed');
      }

      // Update status
      const confirmed = await tx.timberShipment.update({
        where: { id },
        data: { status: 'CONFIRMED' }
      });

      // Stock mutations
      for (const item of shipment.items) {
        await this.inventoryLedgerService.createMovement(
          tx,
          shipment.warehouseId,
          item.timberVariantId,
          'OUT',
          'TIMBER_SHIPMENT',
          shipment.id,
          item.quantityPcs,
          item.volumeM3
        );
      }

      return confirmed;
    });
  }

  async cancel(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.timberShipment.findFirst({
        where: { id, company_id: companyId },
        include: { items: true }
      });

      if (!shipment) {
        throw new NotFoundException('Timber shipment not found');
      }

      if (shipment.status !== 'CONFIRMED') {
        throw new BadRequestException('Only CONFIRMED shipment can be cancelled');
      }

      // Update status
      const cancelled = await tx.timberShipment.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // Stock mutations (reversal)
      for (const item of shipment.items) {
        await this.inventoryLedgerService.createMovement(
          tx,
          shipment.warehouseId,
          item.timberVariantId,
          'IN',
          'TIMBER_SHIPMENT_REVERSAL',
          shipment.id,
          item.quantityPcs,
          item.volumeM3
        );
      }

      return cancelled;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.timberShipment.findMany({
      where: { company_id: companyId },
      include: {
        warehouse: true,
        vehicle: true,
        driver: true,
        customer: true,
        items: {
          include: {
            timberVariant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, companyId: string) {
    const shipment = await this.prisma.timberShipment.findFirst({
      where: { id, company_id: companyId },
      include: {
        warehouse: true,
        vehicle: true,
        driver: true,
        customer: true,
        items: {
          include: {
            timberVariant: true
          }
        }
      }
    });

    if (!shipment) {
      throw new NotFoundException('Timber shipment not found');
    }

    return shipment;
  }
}
