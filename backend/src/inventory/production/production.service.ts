import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async createProcess(data: any) {
    const {
      company_id,
      processType,
      processDate,
      notes,
      createdBy,
      inputs,
      outputs,
    } = data;

    // Calculate volumes
    let inputVolumeM3 = 0;
    inputs.forEach((input: any) => {
      inputVolumeM3 += input.volumeM3;
    });

    let outputVolumeM3 = 0;
    let wasteVolumeM3 = 0;
    outputs.forEach((output: any) => {
      if (output.outputType === 'WASTE') {
        wasteVolumeM3 += output.volumeM3;
      } else {
        outputVolumeM3 += output.volumeM3;
      }
    });

    const yieldPercentage =
      inputVolumeM3 > 0 ? (outputVolumeM3 / inputVolumeM3) * 100 : 0;

    // Generate processNo if not provided
    let finalProcessNo = data.processNo;
    if (!finalProcessNo) {
      const dateStr = new Date().toISOString().slice(2, 4); // yy
      const count = await this.prisma.productionProcess.count({
        where: { company_id },
      });
      finalProcessNo = `PRD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
    }

    // Process outputs: ensure each output has a valid variantId
    const resolvedOutputs = [];
    for (const output of outputs) {
      let vId = output.variantId;
      if (!vId && output.outputType !== 'WASTE') {
        // Resolve or create generic product based on processType
        const procCode = (processType || 'PROCESSING').trim().toUpperCase();
        let genericProduct = await this.prisma.product.findFirst({
          where: {
            OR: [
              { code: `${procCode}-TIMBER` },
              { code: procCode },
              { name: { contains: procCode, mode: 'insensitive' } },
            ],
          },
        });
        if (!genericProduct) {
          let defaultUnit = await this.prisma.unit.findFirst({
            where: { company_id },
          });
          if (!defaultUnit) defaultUnit = await this.prisma.unit.findFirst();
          if (!defaultUnit) {
            defaultUnit = await this.prisma.unit.create({
              data: { company_id, name: 'Pieces' },
            });
          }
          genericProduct = await this.prisma.product.create({
            data: {
              name: `Kayu Hasil ${procCode}`,
              code: `${procCode}-TIMBER`,
              company_id,
              unit_id: defaultUnit.id,
              purchase_price: 0,
              selling_price: 0,
              status: true,
            },
          });
        }

        const tMm = Math.round(Number(output.thickness || 0) * 10);
        const wMm = Math.round(Number(output.width || 0) * 10);
        const lMm = Math.round(Number(output.length || 0) * 10);
        const spec = output.species || 'KAYU';
        const grd = output.grade || procCode;
        const skuCode = `${spec}-${grd}-${tMm}X${wMm}X${lMm}`;

        let variant = await this.prisma.timberVariant.findFirst({
          where: { sku: skuCode },
        });

        if (!variant) {
          variant = await this.prisma.timberVariant.create({
            data: {
              company_id,
              productId: genericProduct.id,
              species: spec,
              grade: grd,
              thickness: tMm,
              width: wMm,
              length: lMm,
              sku: skuCode,
              barcode: `V-${skuCode}-${Date.now().toString().slice(-4)}`,
              volumePerPiece: (tMm * wMm * lMm) / 1000000000,
            },
          });
        }
        vId = variant.id;
      }

      resolvedOutputs.push({
        warehouseId: output.warehouseId,
        outputType: output.outputType,
        variantId: vId,
        quantityPCS: Number(output.quantityPCS || 0),
        volumeM3: Number(output.volumeM3 || 0),
      });
    }

    // Process inputs: ensure each input has a valid variantId and timberStockId
    const resolvedInputs: any[] = [];
    for (const input of inputs) {
      let vId = input.variantId;
      let sId = input.timberStockId;

      if (!vId) {
        // Resolve or create variant for input timber based on species and dimensions
        const tMm = Math.round(Number(input.thickness || 0) * 10);
        const wMm = Math.round(Number(input.width || 0) * 10);
        const lMm = Math.round(Number(input.length || 0) * 10);
        const spec = (input.species || 'KAYU').trim().toUpperCase();
        const grd = (input.grade || 'STD').trim().toUpperCase();
        const skuCode = `${spec}-${grd}-${tMm}X${wMm}X${lMm}`;

        let genericProduct = await this.prisma.product.findFirst({
          where: {
            OR: [
              { code: 'RAW-SAWN-TIMBER' },
              { code: 'SAWN-TIMBER' },
              { name: { contains: 'Sawn Timber', mode: 'insensitive' } },
            ],
          },
        });
        if (!genericProduct) {
          let defaultUnit = await this.prisma.unit.findFirst({
            where: { company_id },
          });
          if (!defaultUnit) defaultUnit = await this.prisma.unit.findFirst();
          if (!defaultUnit) {
            defaultUnit = await this.prisma.unit.create({
              data: { company_id, name: 'Pieces' },
            });
          }
          genericProduct = await this.prisma.product.create({
            data: {
              name: 'Kayu Sawn Timber Bahan',
              code: 'RAW-SAWN-TIMBER',
              company_id,
              unit_id: defaultUnit.id,
              purchase_price: 0,
              selling_price: 0,
              status: true,
            },
          });
        }

        let variant = await this.prisma.timberVariant.findFirst({
          where: { sku: skuCode },
        });
        if (!variant) {
          variant = await this.prisma.timberVariant.create({
            data: {
              company_id,
              productId: genericProduct.id,
              species: spec,
              grade: grd,
              thickness: tMm,
              width: wMm,
              length: lMm,
              sku: skuCode,
              barcode: `V-${skuCode}-${Date.now().toString().slice(-4)}`,
              volumePerPiece: (tMm * wMm * lMm) / 1000000000,
            },
          });
        }
        vId = variant.id;
      }

      if (!sId) {
        // Find existing timberStock or create one in the default warehouse
        let targetWh = input.warehouseId || data.targetWarehouseId;
        if (!targetWh) {
          const firstWh = await this.prisma.warehouse.findFirst();
          targetWh = firstWh?.id;
        }

        let stock = await this.prisma.timberStock.findFirst({
          where: {
            locationId: targetWh,
            timberVariantId: vId,
          },
        });
        if (!stock) {
          stock = await this.prisma.timberStock.create({
            data: {
              locationId: targetWh,
              timberVariantId: vId,
              currentPcs: Number(input.quantityPCS || 0),
              currentVolumeM3: Number(input.volumeM3 || 0),
              batch: 'AUTO-INPUT',
            },
          });
        }
        sId = stock.id;
      }

      resolvedInputs.push({
        timberStockId: sId,
        variantId: vId,
        quantityPCS: Number(input.quantityPCS || 0),
        volumeM3: Number(input.volumeM3 || 0),
      });
    }

    return this.prisma.productionProcess.create({
      data: {
        company_id,
        processNo: finalProcessNo,
        processType: processType || 'KD',
        processDate: new Date(processDate || new Date()),
        status: data.status || 'DRAFT',
        notes,
        createdBy,
        inputVolumeM3,
        outputVolumeM3,
        wasteVolumeM3,
        yieldPercentage,
        inputs: {
          create: resolvedInputs,
        },
        outputs: {
          create: resolvedOutputs,
        },
      },
      include: {
        inputs: true,
        outputs: true,
      },
    });
  }

  async confirmProcess(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const process = await tx.productionProcess.findUnique({
        where: { id },
        include: { inputs: true, outputs: true },
      });

      if (!process) throw new BadRequestException('Process not found');
      if (process.status !== 'DRAFT')
        throw new BadRequestException('Process must be in DRAFT status');

      // Process inputs
      let defaultWarehouseId: string | null = null;
      for (const input of process.inputs) {
        const stock = await tx.timberStock.findUnique({
          where: { id: input.timberStockId },
        });
        if (!stock)
          throw new BadRequestException(
            `Timber stock ${input.timberStockId} not found`,
          );
        if (!defaultWarehouseId) defaultWarehouseId = stock.locationId;

        await this.inventoryLedgerService.createMovement(
          tx,
          stock.locationId,
          input.variantId,
          'OUT',
          'PRODUCTION_PROCESS_INPUT',
          process.id,
          input.quantityPCS,
          input.volumeM3,
        );
      }

      // Process outputs
      for (const output of process.outputs) {
        if (
          output.outputType === 'PRODUCT' ||
          output.outputType === 'BYPRODUCT'
        ) {
          const targetWarehouseId = output.warehouseId || defaultWarehouseId;
          if (!targetWarehouseId)
            throw new BadRequestException(
              'Warehouse ID is required for outputs',
            );
          if (!output.variantId)
            throw new BadRequestException(
              'Variant ID is required for product outputs',
            );

          await this.inventoryLedgerService.createMovement(
            tx,
            targetWarehouseId,
            output.variantId,
            'IN',
            'PRODUCTION_PROCESS_OUTPUT',
            process.id,
            output.quantityPCS,
            output.volumeM3,
          );
        }
      }

      return tx.productionProcess.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { inputs: true, outputs: true },
      });
    });
  }

  async cancelProcess(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const process = await tx.productionProcess.findUnique({
        where: { id },
        include: { inputs: true, outputs: true },
      });

      if (!process) throw new BadRequestException('Process not found');
      if (process.status !== 'CONFIRMED')
        throw new BadRequestException('Process must be in CONFIRMED status');

      // Determine defaultWarehouseId from inputs
      let defaultWarehouseId: string | null = null;
      for (const input of process.inputs) {
        const stock = await tx.timberStock.findUnique({
          where: { id: input.timberStockId },
        });
        if (stock && !defaultWarehouseId) {
          defaultWarehouseId = stock.locationId;
          break;
        }
      }

      // Cancellation Safety: Check if outputs have been consumed
      for (const output of process.outputs) {
        if (output.outputType === 'PRODUCT') {
          const targetWarehouseId = output.warehouseId || defaultWarehouseId;
          if (!targetWarehouseId)
            throw new BadRequestException(
              'Warehouse ID is required for outputs',
            );
          if (!output.variantId)
            throw new BadRequestException(
              'Variant ID is required for product outputs',
            );

          const stock = await tx.timberStock.findFirst({
            where: {
              locationId: targetWarehouseId,
              timberVariantId: output.variantId,
            },
          });

          const currentPcs = stock ? stock.currentPcs : 0;
          if (currentPcs < output.quantityPCS) {
            throw new BadRequestException(
              `Cannot cancel this production. Output has already been consumed. Variant ID: ${output.variantId}, Produced: ${output.quantityPCS}, Remaining: ${currentPcs}`,
            );
          }
        }
      }

      // Reverse inputs
      for (const input of process.inputs) {
        const stock = await tx.timberStock.findUnique({
          where: { id: input.timberStockId },
        });
        if (!stock)
          throw new BadRequestException(
            `Timber stock ${input.timberStockId} not found`,
          );

        await this.inventoryLedgerService.createMovement(
          tx,
          stock.locationId,
          input.variantId,
          'IN',
          'PRODUCTION_PROCESS_REVERSAL',
          process.id,
          input.quantityPCS,
          input.volumeM3,
        );
      }

      // Reverse outputs
      for (const output of process.outputs) {
        if (
          output.outputType === 'PRODUCT' ||
          output.outputType === 'BYPRODUCT'
        ) {
          const targetWarehouseId = output.warehouseId || defaultWarehouseId;
          if (!targetWarehouseId)
            throw new BadRequestException(
              'Warehouse ID is required for outputs',
            );
          if (!output.variantId)
            throw new BadRequestException(
              'Variant ID is required for product outputs',
            );

          await this.inventoryLedgerService.createMovement(
            tx,
            targetWarehouseId,
            output.variantId,
            'OUT',
            'PRODUCTION_PROCESS_REVERSAL',
            process.id,
            output.quantityPCS,
            output.volumeM3,
          );
        }
      }

      return tx.productionProcess.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });
  }

  async getProcesses(params: {
    companyId?: string;
    processType?: string;
    search?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const { companyId, processType, search, status, skip = 0, take = 50 } = params;
    const where: any = {};
    if (companyId) where.company_id = companyId;
    if (processType) where.processType = processType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { processNo: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.productionProcess.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: { createdAt: 'desc' },
        include: {
          inputs: {
            include: {
              variant: true,
              timberStock: {
                include: { location: true },
              },
            },
          },
          outputs: {
            include: {
              variant: true,
              warehouse: true,
            },
          },
        },
      }),
      this.prisma.productionProcess.count({ where }),
    ]);

    return { items, total, skip: Number(skip), take: Number(take) };
  }

  async getProcess(id: string) {
    const process = await this.prisma.productionProcess.findUnique({
      where: { id },
      include: {
        inputs: {
          include: {
            variant: true,
            timberStock: {
              include: { location: true },
            },
          },
        },
        outputs: {
          include: {
            variant: true,
            warehouse: true,
          },
        },
      },
    });
    if (!process) throw new BadRequestException('Production process not found');
    return process;
  }

  async deleteProcess(id: string) {
    const process = await this.prisma.productionProcess.findUnique({
      where: { id },
    });
    if (!process) throw new BadRequestException('Process not found');
    if (process.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT process can be deleted');
    }
    await this.prisma.productionProcessInput.deleteMany({
      where: { productionProcessId: id },
    });
    await this.prisma.productionProcessOutput.deleteMany({
      where: { productionProcessId: id },
    });
    return this.prisma.productionProcess.delete({
      where: { id },
    });
  }
}
