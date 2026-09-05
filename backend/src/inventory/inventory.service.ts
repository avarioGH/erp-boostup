import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryValuationEvent } from '../events/accounting.events';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface TransactionItemDto {
  productId: string;
  qty: number;
  unitCost: number;
  batchNumber?: string;
  expiredDate?: Date;
  notes?: string;
}

export interface CreateInboundDto {
  companyId: string;
  warehouseId: string;
  transactionNo: string;
  transactionDate: Date;
  notes?: string;
  userId: string;
  items: TransactionItemDto[];
}

export interface CreateOutboundDto {
  companyId: string;
  warehouseId: string;
  transactionNo: string;
  transactionDate: Date;
  notes?: string;
  userId: string;
  items: TransactionItemDto[];
}

export interface CreateTransferDto {
  companyId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  transactionNo: string;
  transactionDate: Date;
  notes?: string;
  userId: string;
  items: TransactionItemDto[];
}

export interface CreateAdjustmentDto {
  companyId: string;
  warehouseId: string;
  transactionNo: string;
  transactionDate: Date;
  notes?: string;
  userId: string;
  items: (TransactionItemDto & { adjustmentType: 'IN' | 'OUT' })[];
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async getCategories(companyId: string) {
    return this.prisma.category.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    });
  }

  async createCategory(data: any) {
    return this.prisma.category.create({
      data: {
        company_id: data.companyId,
        name: data.name,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
  }

  async deleteCategory(id: string) {
    const products = await this.prisma.product.count({ where: { category_id: id } });
    if (products > 0) {
      throw new Error('Kategori tidak dapat dihapus karena sedang digunakan oleh produk.');
    }
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getProducts(companyId: string) {
    return this.prisma.product.findMany({
      where: { company_id: companyId },
      include: { category: true, unit: true, brand: true, warehouse_stocks: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateWarehouse(id: string, data: any) {
    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        address: data.location || data.address
      }
    });
  }

  async deleteWarehouse(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // Delete access records first due to foreign key constraints
      await tx.userWarehouseAccess.deleteMany({
        where: { warehouse_id: id }
      });
      // Delete warehouse stocks
      await tx.warehouseStock.deleteMany({
        where: { warehouse_id: id }
      });
      return tx.warehouse.delete({
        where: { id }
      });
    });
  }

  async getTransactions(companyId: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: { company_id: companyId },
      include: {
        warehouse: true,
        target_warehouse: true,
        items: { include: { product: true } }
      },
      orderBy: { transaction_date: 'desc' }
    });
  }

  async getWarehouseStocks(companyId: string) {
    return this.prisma.warehouseStock.findMany({
      where: { company_id: companyId },
      include: { warehouse: true, product: true }
    });
  }

  async createProduct(data: any) {
    // We need a unit to create a product. Let's find or create a default 'PCS' unit.
    let unit = await this.prisma.unit.findFirst({ where: { company_id: data.companyId, name: 'PCS' }});
    if (!unit) {
      unit = await this.prisma.unit.create({ data: { company_id: data.companyId, name: 'PCS' }});
    }

    const product = await this.prisma.product.create({
      data: {
        company_id: data.companyId,
        code: data.code || `PRD-${Date.now()}`,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description,
        purchase_price: data.purchasePrice !== undefined ? Number(data.purchasePrice) : 0,
        selling_price: data.sellingPrice !== undefined ? Number(data.sellingPrice) : 0,
        unit_id: unit.id,
        category_id: data.categoryId || null
      }
    });

    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const imageRecords = data.images.map((imgUrl: string, idx: number) => ({
        product_id: product.id,
        image_url: imgUrl,
        is_primary: idx === 0
      }));
      await this.prisma.productImage.createMany({
        data: imageRecords
      });
    }

    return product;
  }

  async createWarehouse(data: any) {
    return this.prisma.warehouse.create({
      data: {
        company_id: data.companyId,
        code: data.code || `WH-${Date.now()}`,
        name: data.name,
        address: data.address,
        pic: data.pic
      }
    });
  }

  async createInbound(data: CreateInboundDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Transaction Header
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

      // 2. Loop through items
      for (const item of data.items) {
        const subtotal = item.qty * item.unitCost;

        // a. Create Transaction Item
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost,
            subtotal: subtotal,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            notes: item.notes,
          },
        });

        // b. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            company_id: data.companyId,
            warehouse_id: data.warehouseId,
            product_id: item.productId,
            transaction_type: 'IN',
            transaction_id: transaction.id,
            movement_type: 'IN',
            qty_in: item.qty,
            qty_out: 0,
            unit_cost: item.unitCost,
            total_cost: subtotal,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            created_by: data.userId,
          },
        });

        // c. Update Warehouse Stock (Cache)
        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
            }
          }
        });

        if (currentStock) {
          await tx.warehouseStock.update({
            where: { id: currentStock.id },
            data: {
              current_stock: currentStock.current_stock + item.qty,
              available_stock: currentStock.available_stock + item.qty,
            }
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
              current_stock: item.qty,
              available_stock: item.qty,
              reserved_stock: 0,
            }
          });
        }
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: data.companyId,
          user_id: data.userId,
          action: 'CREATE',
          entity: 'InventoryTransaction_Inbound',
          entity_id: transaction.id,
        }
      });

      return transaction;
    });
  }

  async createOutbound(data: CreateOutboundDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validasi Stok Terlebih Dahulu
      for (const item of data.items) {
        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
            }
          }
        });

        if (!currentStock || currentStock.available_stock < item.qty) {
          throw new BadRequestException(`Stock tidak mencukupi untuk product ${item.productId}`);
        }
      }

      // 2. Create Transaction Header
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

      // 3. Loop through items
      for (const item of data.items) {
        const subtotal = item.qty * item.unitCost;

        // a. Create Transaction Item
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost,
            subtotal: subtotal,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            notes: item.notes,
          },
        });

        // b. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            company_id: data.companyId,
            warehouse_id: data.warehouseId,
            product_id: item.productId,
            transaction_type: 'OUT',
            transaction_id: transaction.id,
            movement_type: 'OUT',
            qty_in: 0,
            qty_out: item.qty,
            unit_cost: item.unitCost,
            total_cost: subtotal,
            batch_number: item.batchNumber,
            expired_date: item.expiredDate,
            created_by: data.userId,
          },
        });

        // c. Update Warehouse Stock (Cache)
        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
            }
          }
        });

        await tx.warehouseStock.update({
          where: { id: currentStock!.id },
          data: {
            current_stock: currentStock!.current_stock - item.qty,
            available_stock: currentStock!.available_stock - item.qty,
          }
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: data.companyId,
          user_id: data.userId,
          action: 'CREATE',
          entity: 'InventoryTransaction_Outbound',
          entity_id: transaction.id,
        }
      });

      return transaction;
    });
  }

  async createTransfer(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.sourceWarehouseId,
          target_warehouse_id: data.targetWarehouseId,
          transaction_no: data.transactionNo || ('TRF-' + Date.now()),
          transaction_type: 'TRANSFER',
          status: 'Draft',
          transaction_date: data.transactionDate || new Date(),
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty, 
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });
      }
      return transaction;
    });
  }

  async validateTransfer(companyId: string, id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Transfer not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft transfers can be validated');

      for (const item of transaction.items) {
        const sourceStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id }
          }
        });
        if (!sourceStock || sourceStock.available_stock < item.qty) {
          throw new BadRequestException('Stock tidak mencukupi di gudang asal untuk product ' + item.product_id);
        }

        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            current_stock: sourceStock.current_stock - item.qty,
            available_stock: sourceStock.available_stock - item.qty,
          }
        });

        let targetStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.target_warehouse_id!, product_id: item.product_id }
          }
        });
        
        if (!targetStock) {
          targetStock = await tx.warehouseStock.create({
            data: {
              company_id: companyId,
              warehouse_id: transaction.target_warehouse_id!,
              product_id: item.product_id,
              current_stock: item.qty,
              available_stock: item.qty,
              reserved_stock: 0
            }
          });
        } else {
          await tx.warehouseStock.update({
            where: { id: targetStock.id },
            data: {
              current_stock: targetStock.current_stock + item.qty,
              available_stock: targetStock.available_stock + item.qty,
            }
          });
        }

        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_OUT',
            qty_in: 0,
            qty_out: item.qty,
            balance_after: sourceStock.current_stock - item.qty,
            created_by: userId,
          }
        });
        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.target_warehouse_id!,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_IN',
            qty_in: item.qty,
            qty_out: 0,
            balance_after: (targetStock ? targetStock.current_stock : 0) + item.qty,
            created_by: userId,
          }
        });
      }

      const updated = await tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
      // Simple valuation logic for adjustments (assuming unit_cost exists, skipping if not)
      let adjustmentValue = 0;
      let type: 'ADJUSTMENT_LOSS' | 'ADJUSTMENT_GAIN' = 'ADJUSTMENT_LOSS';
      for(const item of transaction.items) {
         const diff = item.difference || 0;
         if (diff !== 0) {
            // Fallback to 0 if no unit_cost mapping.
            const val = Math.abs(diff) * (item.unit_cost || 0);
            adjustmentValue += val;
            if (diff > 0) type = 'ADJUSTMENT_GAIN';
            else type = 'ADJUSTMENT_LOSS';
         }
      }
      if (adjustmentValue > 0) {
         await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(companyId, id, 'EVT-' + Date.now(), new Date(), { type, totalValue: adjustmentValue }, tx as any));
      }
      return updated;
    });
  }

  async createAdjustment(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.warehouseId,
          transaction_no: data.transactionNo || ('ADJ-' + Date.now()),
          transaction_type: 'ADJUSTMENT',
          status: 'Draft',
          transaction_date: data.transactionDate || new Date(),
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: 0,
            system_qty: item.systemQty,
            counted_qty: item.countedQty,
            difference: item.countedQty - item.systemQty,
            notes: item.notes,
          },
        });
      }
      return transaction;
    });
  }

  async validateAdjustment(companyId: string, id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Adjustment not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft adjustments can be validated');

      for (const item of transaction.items) {
        const diff = item.difference || 0;
        if (diff === 0) continue;

        let stock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id }
          }
        });

        if (!stock && diff > 0) {
          stock = await tx.warehouseStock.create({
            data: {
              company_id: companyId,
              warehouse_id: transaction.warehouse_id,
              product_id: item.product_id,
              current_stock: diff,
              available_stock: diff
            }
          });
        } else if (stock) {
          if (stock.available_stock + diff < 0) {
             throw new BadRequestException('Cannot adjust stock below 0 for product ' + item.product_id);
          }
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              current_stock: stock.current_stock + diff,
              available_stock: stock.available_stock + diff,
            }
          });
        }

        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'ADJUSTMENT',
            transaction_id: transaction.id,
            movement_type: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            qty_in: diff > 0 ? diff : 0,
            qty_out: diff < 0 ? Math.abs(diff) : 0,
            balance_after: stock ? stock.current_stock + diff : diff,
            created_by: userId,
          }
        });
      }

      return tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
    });
  }

  async createStockOpname(companyId: string, warehouseId: string, userId: string, productIds?: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: companyId,
          warehouse_id: warehouseId,
          transaction_no: 'OPN-' + Date.now(),
          transaction_type: 'OPNAME',
          status: 'Draft',
          transaction_date: new Date(),
          created_by: userId,
        },
      });

      const filter: any = { company_id: companyId, warehouse_id: warehouseId };
      if (productIds && productIds.length > 0) {
         filter.product_id = { in: productIds };
      }

      const stocks = await tx.warehouseStock.findMany({ where: filter });
      
      const itemData = stocks.map(stock => ({
        transaction_id: transaction.id,
        product_id: stock.product_id,
        qty: 0,
        system_qty: stock.current_stock,
        counted_qty: stock.current_stock,
        difference: 0
      }));

      if (itemData.length > 0) {
         await tx.inventoryTransactionItem.createMany({ data: itemData });
      }

      return transaction;
    });
  }

  async approveStockOpname(companyId: string, id: string, userId: string, counts: { productId: string, countedQty: number }[]) {
     return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Opname not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft opname can be approved');

      for (const count of counts) {
         const item = transaction.items.find(i => i.product_id === count.productId);
         if (!item) continue;
         const diff = count.countedQty - (item.system_qty || 0);
         
         await tx.inventoryTransactionItem.update({
            where: { id: item.id },
            data: { counted_qty: count.countedQty, difference: diff }
         });

         if (diff !== 0) {
            const stock = await tx.warehouseStock.findUnique({
               where: { company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id } }
            });
            if (stock) {
               await tx.warehouseStock.update({
                  where: { id: stock.id },
                  data: {
                     current_stock: stock.current_stock + diff,
                     available_stock: stock.available_stock + diff
                  }
               });
               await tx.stockMovement.create({
                  data: {
                     company_id: companyId,
                     warehouse_id: transaction.warehouse_id,
                     product_id: item.product_id,
                     transaction_type: 'OPNAME',
                     transaction_id: transaction.id,
                     movement_type: diff > 0 ? 'STOCK_OPNAME_IN' : 'STOCK_OPNAME_OUT',
                     qty_in: diff > 0 ? diff : 0,
                     qty_out: diff < 0 ? Math.abs(diff) : 0,
                     balance_after: stock.current_stock + diff,
                     created_by: userId
                  }
               });
            }
         }
      }

      return tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
    });
  }
}


