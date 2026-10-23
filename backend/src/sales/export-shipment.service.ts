import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportShipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.exportShipment.findMany({
      where: { company_id: companyId },
      include: { items: true },
      orderBy: [
        { exportDate: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findOne(id: string, companyId: string) {
    return this.prisma.exportShipment.findFirst({
      where: { id, company_id: companyId },
      include: { items: true },
    });
  }

  async create(companyId: string, dto: any, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.exportShipment.create({
        data: {
          company_id: companyId,
          containerNo: dto.containerNo,
          sealNo: dto.sealNo,
          vehicleNo: dto.vehicleNo,
          exportDate: new Date(dto.exportDate),
          items: {
            create: dto.items.map((i: any) => ({
              groupName: i.groupName,
              productName: i.productName,
              qtyKg: parseFloat(i.qtyKg) || 0,
              qtyMc: parseInt(i.qtyMc) || 0,
              qtySak: parseInt(i.qtySak) || 0,
            })),
          },
        },
        include: { items: true },
      });

      // Deduct stock for exported items
      for (const item of shipment.items) {
        if (!item.qtyKg || item.qtyKg <= 0) continue;

        // Find product by name or code
        const product = await tx.product.findFirst({
          where: {
            company_id: companyId,
            name: { equals: item.productName, mode: 'insensitive' },
          },
        });

        if (product) {
          // Find stock in warehouse (first warehouse or active stock)
          const whStock = await tx.warehouseStock.findFirst({
            where: {
              company_id: companyId,
              product_id: product.id,
            },
            orderBy: { current_stock: 'desc' },
          });

          if (whStock) {
            await tx.warehouseStock.update({
              where: { id: whStock.id },
              data: {
                current_stock: Math.max(0, whStock.current_stock - item.qtyKg),
                available_stock: Math.max(0, whStock.available_stock - item.qtyKg),
              },
            });

            await tx.stockMovement.create({
              data: {
                company_id: companyId,
                warehouse_id: whStock.warehouse_id,
                product_id: product.id,
                transaction_type: 'OUT',
                movement_type: 'EXPORT_OUT',
                transaction_id: shipment.id,
                qty_out: item.qtyKg,
                balance_after: Math.max(0, whStock.current_stock - item.qtyKg),
                created_by: userId,
              },
            });
          }
        }
      }

      return shipment;
    });
  }

  async update(id: string, companyId: string, dto: any) {
    await this.prisma.exportShipmentItem.deleteMany({
      where: { exportId: id },
    });

    return this.prisma.exportShipment.update({
      where: { id },
      data: {
        containerNo: dto.containerNo,
        sealNo: dto.sealNo,
        vehicleNo: dto.vehicleNo,
        exportDate: new Date(dto.exportDate),
        items: {
          create: dto.items.map((i: any) => ({
            groupName: i.groupName,
            productName: i.productName,
            qtyKg: parseFloat(i.qtyKg) || 0,
            qtyMc: parseInt(i.qtyMc) || 0,
            qtySak: parseInt(i.qtySak) || 0,
          })),
        },
      },
    });
  }

  async delete(id: string, companyId: string) {
    return this.prisma.exportShipment.delete({
      where: { id },
    });
  }
}
