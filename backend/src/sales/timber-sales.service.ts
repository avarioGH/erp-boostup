import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InventoryLedgerService } from "../inventory/inventory-ledger.service";

@Injectable()
export class TimberSalesService {
  constructor(
    private prisma: PrismaService,
    private ledger: InventoryLedgerService
  ) {}

  async createOrder(dto: any) {
    const orderCount = await this.prisma.timberSalesOrder.count();
    const orderNumber = `TSO-${String(orderCount + 1).padStart(5, "0")}`;
    return this.prisma.timberSalesOrder.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        orderDate: new Date(dto.orderDate),
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        partai: dto.partai || null,
        notes: dto.notes || null,
        status: "DRAFT",
        items: {
          create: (dto.items || []).map((item: any) => ({
            timberVariantId: item.timberVariantId || null,
            thicknessMm: item.thicknessMm,
            widthMm: item.widthMm,
            lengthMm: item.lengthMm,
            grade: item.grade || null,
            species: item.species || null,
            orderQty: item.orderQty,
            orderM3: parseFloat(((item.thicknessMm * item.widthMm * item.lengthMm * item.orderQty) / 1e9).toFixed(4)),
          })),
        },
      },
      include: { items: true, customer: true },
    });
  }

  async findAllOrders(page = 1, limit = 20, status?: string, customerId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    const [data, total] = await Promise.all([
      this.prisma.timberSalesOrder.findMany({
        where, skip, take: limit,
        include: { customer: true, _count: { select: { items: true, deliveries: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.timberSalesOrder.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOneOrder(id: string) {
    const order = await this.prisma.timberSalesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { timberVariant: true } },
        deliveries: { include: { items: { include: { timberVariant: true, location: true } } } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async confirmOrder(id: string) {
    const order = await this.prisma.timberSalesOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    if (order.status !== "DRAFT") throw new BadRequestException("Only DRAFT orders can be confirmed");
    return this.prisma.timberSalesOrder.update({ where: { id }, data: { status: "CONFIRMED" } });
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.timberSalesOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    if (!["DRAFT", "CONFIRMED"].includes(order.status))
      throw new BadRequestException("Only DRAFT or CONFIRMED orders can be cancelled");
    return this.prisma.timberSalesOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  async createDelivery(salesOrderId: string, dto: any) {
    const order = await this.prisma.timberSalesOrder.findUnique({ where: { id: salesOrderId } });
    if (!order) throw new NotFoundException();
    if (!["CONFIRMED", "PARTIALLY_FULFILLED"].includes(order.status))
      throw new BadRequestException("Order must be CONFIRMED or PARTIALLY_FULFILLED to create delivery");
    const deliveryCount = await this.prisma.timberDeliveryNote.count();
    const deliveryNumber = `TDN-${String(deliveryCount + 1).padStart(5, "0")}`;
    return this.prisma.timberDeliveryNote.create({
      data: {
        deliveryNumber,
        salesOrderId,
        deliveryDate: new Date(dto.deliveryDate),
        driverName: dto.driverName || null,
        vehicleNumber: dto.vehicleNumber || null,
        notes: dto.notes || null,
        status: "DRAFT",
        items: {
          create: (dto.items || []).map((item: any) => ({
            salesOrderItemId: item.salesOrderItemId,
            locationId: item.locationId,
            timberVariantId: item.timberVariantId,
            deliveredQty: item.deliveredQty,
            deliveredM3: parseFloat(((item.thicknessMm * item.widthMm * item.lengthMm * item.deliveredQty) / 1e9).toFixed(4)),
          })),
        },
      },
      include: { items: true },
    });
  }

  async postDelivery(deliveryId: string) {
    const delivery = await this.prisma.timberDeliveryNote.findUnique({
      where: { id: deliveryId },
      include: { items: { include: { timberVariant: true, salesOrderItem: true } } },
    });
    if (!delivery) throw new NotFoundException();
    if (delivery.status !== "DRAFT") throw new BadRequestException("Only DRAFT deliveries can be posted");

    await this.prisma.$transaction(async (tx) => {
      // Create OUT movements for each item via InventoryLedgerService
      for (const item of delivery.items) {
        const movement = await this.ledger.createMovement(
          tx,
          item.locationId,
          item.timberVariantId,
          "OUT",
          "SALES_DELIVERY",
          deliveryId,
          item.deliveredQty,
          item.deliveredM3
        );
        // Link movement back to delivery item
        await tx.timberDeliveryNoteItem.update({
          where: { id: item.id },
          data: { stockMovementId: movement.id },
        });
        // Update realization cache on sales order item
        await tx.timberSalesOrderItem.update({
          where: { id: item.salesOrderItemId },
          data: {
            realizedQty: { increment: item.deliveredQty },
            realizedM3: { increment: item.deliveredM3 },
          },
        });
      }
      // Update delivery status
      await tx.timberDeliveryNote.update({ where: { id: deliveryId }, data: { status: "POSTED" } });

      // Recompute order fulfillment status
      const updatedItems = await tx.timberSalesOrderItem.findMany({ where: { salesOrderId: delivery.salesOrderId } });
      const allFulfilled = updatedItems.every((i) => i.realizedQty >= i.orderQty);
      const anyFulfilled = updatedItems.some((i) => i.realizedQty > 0);
      const newStatus = allFulfilled ? "FULFILLED" : anyFulfilled ? "PARTIALLY_FULFILLED" : "CONFIRMED";
      await tx.timberSalesOrder.update({ where: { id: delivery.salesOrderId }, data: { status: newStatus } });
    });

    return this.prisma.timberDeliveryNote.findUnique({ where: { id: deliveryId }, include: { items: true } });
  }

  async cancelDelivery(deliveryId: string) {
    const delivery = await this.prisma.timberDeliveryNote.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException();
    if (delivery.status !== "DRAFT") throw new BadRequestException("Only DRAFT deliveries can be cancelled");
    return this.prisma.timberDeliveryNote.update({ where: { id: deliveryId }, data: { status: "CANCELLED" } });
  }

  async getOrderRealization(salesOrderId: string) {
    const order = await this.findOneOrder(salesOrderId);
    return {
      orderNumber: order.orderNumber,
      customer: order.customer.name,
      status: order.status,
      items: order.items.map((item: any) => ({
        thicknessMm: item.thicknessMm,
        widthMm: item.widthMm,
        lengthMm: item.lengthMm,
        grade: item.grade,
        species: item.species,
        orderQty: item.orderQty,
        orderM3: item.orderM3,
        realizedQty: item.realizedQty,
        realizedM3: item.realizedM3,
        remainingQty: item.orderQty - item.realizedQty,
        remainingM3: parseFloat((item.orderM3 - item.realizedM3).toFixed(4)),
      })),
    };
  }
}
