import re

with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix movement_type logic in receiveStock and issueStock
c = re.sub(r"movement_type: params\.referenceType \+ '_IN'", "movement_type: params.referenceType === 'IN' ? 'IN' : params.referenceType + '_IN'", c)
c = re.sub(r"movement_type: params\.referenceType \+ '_OUT'", "movement_type: params.referenceType === 'OUT' ? 'OUT' : params.referenceType + '_OUT'", c)

# Replace createInbound
idx1 = c.find("async createInbound(")
idx2 = c.find("async createOutbound(")
inbound_old = c[idx1:idx2]

inbound_new = """async createInbound(data: CreateInboundDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.warehouseId,
          transaction_no: data.transactionNo,
          transaction_type: 'IN',
          status: 'Approved',
          transaction_date: data.transactionDate,
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        if (item.qty <= 0) throw new BadRequestException('Quantity must be greater than 0');
        const subtotal = item.qty * (item.unitCost || 0);

        await tx.inventoryTransactionItem.create({
          data: {
            transaction: { connect: { id: transaction.id } },
            product: { connect: { id: item.productId } },
            qty: item.qty,
            unit_cost: item.unitCost,
            subtotal: subtotal,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            notes: item.notes,
          },
        });

        await this.receiveStock(tx as any, {
          companyId: data.companyId,
          warehouseId: data.warehouseId,
          productId: item.productId,
          quantity: item.qty,
          unitCost: item.unitCost || 0,
          referenceType: 'IN',
          referenceId: transaction.id,
          description: data.notes,
          userId: data.userId,
        });
      }
      return transaction;
    });
  }

  """
c = c.replace(inbound_old, inbound_new)

# Replace createOutbound
idx1 = c.find("async createOutbound(")
idx2 = c.find("async createTransfer(")
outbound_old = c[idx1:idx2]

outbound_new = """async createOutbound(data: CreateOutboundDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.warehouseId,
          transaction_no: data.transactionNo,
          transaction_type: 'OUT',
          status: 'Approved',
          transaction_date: data.transactionDate,
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        if (item.qty <= 0) throw new BadRequestException('Quantity must be greater than 0');

        const { consumedCost } = await this.issueStock(tx as any, {
          companyId: data.companyId,
          warehouseId: data.warehouseId,
          productId: item.productId,
          quantity: item.qty,
          referenceType: 'OUT',
          referenceId: transaction.id,
          description: data.notes,
          userId: data.userId,
        });

        await tx.inventoryTransactionItem.create({
          data: {
            transaction: { connect: { id: transaction.id } },
            product: { connect: { id: item.productId } },
            qty: item.qty,
            unit_cost: consumedCost / item.qty,
            subtotal: consumedCost,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            notes: item.notes,
          },
        });
      }
      return transaction;
    });
  }

  """
c = c.replace(outbound_old, outbound_new)

# Replace validateTransfer
idx1 = c.find("async validateTransfer(companyId: string, id: string, userId: string)")
idx2 = c.find("async createAdjustment(")
transfer_old = c[idx1:idx2]

transfer_new = """async validateTransfer(companyId: string, id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Transfer not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft transfers can be validated');

      for (const item of transaction.items) {
        if (item.qty <= 0) throw new BadRequestException('Quantity must be greater than 0');

        await this.transferStock(tx as any, {
          companyId: companyId,
          productId: item.product_id,
          sourceWarehouseId: transaction.warehouse_id,
          targetWarehouseId: transaction.target_warehouse_id!,
          quantity: item.qty,
          referenceType: 'TRANSFER',
          referenceId: transaction.id,
          description: transaction.notes || undefined,
          userId: userId,
        });
      }

      await tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Approved' }
      });

      return transaction;
    });
  }

  """
c = c.replace(transfer_old, transfer_new)

with open("backend/src/inventory/inventory.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
