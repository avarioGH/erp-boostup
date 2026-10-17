import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as exceljs from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMovements(filters: any) {
    const {
      warehouseId,
      variantId,
      dateFrom,
      dateTo,
      type,
      referenceType,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (warehouseId || variantId) {
      where.timberStock = {};
      if (warehouseId) where.timberStock.locationId = warehouseId;
      if (variantId) where.timberStock.timberVariantId = variantId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (type) {
      where.type = type;
    }
    if (referenceType) {
      where.referenceType = referenceType;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.timberStockMovement.findMany({
        where,
        include: {
          timberStock: {
            include: {
              location: true,
              timberVariant: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
      }),
      this.prisma.timberStockMovement.count({ where }),
    ]);

    return { data, totalCount };
  }

  async getStockCard(
    warehouseId: string,
    variantId: string,
    dateFrom: string,
    dateTo: string,
  ) {
    const priorMovements = await this.prisma.timberStockMovement.findMany({
      where: {
        timberStock: {
          locationId: warehouseId,
          timberVariantId: variantId,
        },
        date: { lt: new Date(dateFrom) },
      },
    });

    let openingBalancePcs = 0;
    let openingBalanceM3 = 0;

    for (const m of priorMovements) {
      if (m.type === 'IN') {
        openingBalancePcs += m.quantityPcs;
        openingBalanceM3 += m.volumeM3;
      } else if (m.type === 'OUT') {
        openingBalancePcs -= m.quantityPcs;
        openingBalanceM3 -= m.volumeM3;
      } else if (m.type === 'ADJ') {
        openingBalancePcs += m.quantityPcs;
        openingBalanceM3 += m.volumeM3;
      }
    }

    const movements = await this.prisma.timberStockMovement.findMany({
      where: {
        timberStock: {
          locationId: warehouseId,
          timberVariantId: variantId,
        },
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      orderBy: { date: 'asc' },
      include: {
        timberStock: {
          include: {
            location: true,
            timberVariant: true,
          },
        },
      },
    });

    let runningBalancePcs = openingBalancePcs;
    let runningBalanceM3 = openingBalanceM3;

    const formattedMovements = movements.map((m) => {
      if (m.type === 'IN') {
        runningBalancePcs += m.quantityPcs;
        runningBalanceM3 += m.volumeM3;
      } else if (m.type === 'OUT') {
        runningBalancePcs -= m.quantityPcs;
        runningBalanceM3 -= m.volumeM3;
      } else if (m.type === 'ADJ') {
        runningBalancePcs += m.quantityPcs;
        runningBalanceM3 += m.volumeM3;
      }

      return {
        ...m,
        runningBalancePcs,
        runningBalanceM3,
      };
    });

    return {
      openingBalancePcs,
      openingBalanceM3,
      closingBalancePcs: runningBalancePcs,
      closingBalanceM3: runningBalanceM3,
      movements: formattedMovements,
    };
  }

  async getProductionYield(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.processDate = {};
      if (dateFrom) where.processDate.gte = new Date(dateFrom);
      if (dateTo) where.processDate.lte = new Date(dateTo);
    }

    const processes = await this.prisma.productionProcess.findMany({
      where,
    });

    const summary: Record<
      string,
      { inputM3: number; outputM3: number; wasteM3: number }
    > = {};

    for (const p of processes) {
      if (!summary[p.processType]) {
        summary[p.processType] = { inputM3: 0, outputM3: 0, wasteM3: 0 };
      }
      summary[p.processType].inputM3 += p.inputVolumeM3;
      summary[p.processType].outputM3 += p.outputVolumeM3;
      summary[p.processType].wasteM3 += p.wasteVolumeM3;
    }

    const result = Object.keys(summary).map((type) => {
      const s = summary[type];
      const yieldPerc = s.inputM3 > 0 ? (s.outputM3 / s.inputM3) * 100 : 0;
      return {
        processType: type,
        inputM3: s.inputM3,
        outputM3: s.outputM3,
        wasteM3: s.wasteM3,
        yield: yieldPerc,
      };
    });

    return result;
  }

  async getOperationsSummary(dateFrom?: string, dateTo?: string) {
    const purchaseWhere: any = { status: 'CONFIRMED' };
    const shipmentWhere: any = { status: 'CONFIRMED' };
    const opnameWhere: any = { status: 'CONFIRMED' };

    if (dateFrom || dateTo) {
      if (dateFrom) {
        purchaseWhere.purchaseDate = { gte: new Date(dateFrom) };
        shipmentWhere.shipmentDate = { gte: new Date(dateFrom) };
        opnameWhere.opnameDate = { gte: new Date(dateFrom) };
      }
      if (dateTo) {
        purchaseWhere.purchaseDate = purchaseWhere.purchaseDate || {};
        purchaseWhere.purchaseDate.lte = new Date(dateTo);

        shipmentWhere.shipmentDate = shipmentWhere.shipmentDate || {};
        shipmentWhere.shipmentDate.lte = new Date(dateTo);

        opnameWhere.opnameDate = opnameWhere.opnameDate || {};
        opnameWhere.opnameDate.lte = new Date(dateTo);
      }
    }

    const [purchases, shipments, opnames] = await Promise.all([
      this.prisma.timberPurchase.findMany({ where: purchaseWhere }),
      this.prisma.timberShipment.findMany({ where: shipmentWhere }),
      this.prisma.timberStockOpname.findMany({
        where: opnameWhere,
        include: { items: true },
      }),
    ]);

    let totalPurchasePcs = 0;
    let totalPurchaseM3 = 0;
    for (const p of purchases) {
      totalPurchasePcs += p.totalPcs;
      totalPurchaseM3 += p.totalVolumeM3;
    }

    let totalShipmentPcs = 0;
    let totalShipmentM3 = 0;
    for (const s of shipments) {
      totalShipmentPcs += s.totalPcs;
      totalShipmentM3 += s.totalVolumeM3;
    }

    let totalOpnameVariancePcs = 0;
    let totalOpnameVarianceM3 = 0;
    for (const o of opnames) {
      for (const item of o.items) {
        totalOpnameVariancePcs += item.varianceQuantityPcs;
        totalOpnameVarianceM3 += item.varianceVolumeM3;
      }
    }

    return {
      purchases: { pcs: totalPurchasePcs, m3: totalPurchaseM3 },
      shipments: { pcs: totalShipmentPcs, m3: totalShipmentM3 },
      opnames: {
        variancePcs: totalOpnameVariancePcs,
        varianceM3: totalOpnameVarianceM3,
      },
    };
  }

  async exportMovements(filters: any): Promise<exceljs.Workbook> {
    const { data } = await this.getMovements({
      ...filters,
      page: 1,
      limit: 1000000,
    });
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Movements');
    ws.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Reference', key: 'reference', width: 25 },
      { header: 'Pcs', key: 'pcs', width: 10 },
      { header: 'M3', key: 'm3', width: 10 },
    ];
    data.forEach((m) => {
      ws.addRow({
        date: m.date,
        type: m.type,
        reference: m.referenceType + ' ' + m.referenceId,
        pcs: m.quantityPcs,
        m3: m.volumeM3,
      });
    });
    return wb;
  }

  async exportStockCard(
    warehouseId: string,
    variantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<exceljs.Workbook> {
    const data = await this.getStockCard(
      warehouseId,
      variantId,
      dateFrom,
      dateTo,
    );
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Stock Card');

    ws.addRow([
      'Opening Balance Pcs',
      data.openingBalancePcs,
      'Opening Balance M3',
      data.openingBalanceM3,
    ]);
    ws.addRow([]);

    ws.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Reference', key: 'reference', width: 25 },
      { header: 'In/Out/Adj Pcs', key: 'pcs', width: 15 },
      { header: 'In/Out/Adj M3', key: 'm3', width: 15 },
      { header: 'Balance Pcs', key: 'balPcs', width: 15 },
      { header: 'Balance M3', key: 'balM3', width: 15 },
    ];

    data.movements.forEach((m) => {
      ws.addRow({
        date: m.date,
        type: m.type,
        reference: m.referenceType,
        pcs: m.quantityPcs,
        m3: m.volumeM3,
        balPcs: (m as any).runningBalancePcs,
        balM3: (m as any).runningBalanceM3,
      });
    });
    return wb;
  }

  async exportProduction(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<exceljs.Workbook> {
    const data = await this.getProductionYield(dateFrom, dateTo);
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Production');
    ws.columns = [
      { header: 'Process Type', key: 'processType', width: 20 },
      { header: 'Input M3', key: 'inputM3', width: 15 },
      { header: 'Output M3', key: 'outputM3', width: 15 },
      { header: 'Waste M3', key: 'wasteM3', width: 15 },
      { header: 'Yield %', key: 'yield', width: 15 },
    ];
    data.forEach((d) => ws.addRow(d));
    return wb;
  }

  async exportPurchase(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<exceljs.Workbook> {
    const where: any = { status: 'CONFIRMED' };
    if (dateFrom || dateTo) {
      where.purchaseDate = {};
      if (dateFrom) where.purchaseDate.gte = new Date(dateFrom);
      if (dateTo) where.purchaseDate.lte = new Date(dateTo);
    }
    const purchases = await this.prisma.timberPurchase.findMany({ where });
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Purchase');
    ws.columns = [
      { header: 'Purchase No', key: 'purchaseNumber', width: 20 },
      { header: 'Date', key: 'purchaseDate', width: 20 },
      { header: 'Pcs', key: 'totalPcs', width: 10 },
      { header: 'M3', key: 'totalVolumeM3', width: 10 },
    ];
    purchases.forEach((p) => ws.addRow(p));
    return wb;
  }

  async exportShipment(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<exceljs.Workbook> {
    const where: any = { status: 'CONFIRMED' };
    if (dateFrom || dateTo) {
      where.shipmentDate = {};
      if (dateFrom) where.shipmentDate.gte = new Date(dateFrom);
      if (dateTo) where.shipmentDate.lte = new Date(dateTo);
    }
    const shipments = await this.prisma.timberShipment.findMany({ where });
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Shipment');
    ws.columns = [
      { header: 'Shipment No', key: 'shipmentNumber', width: 20 },
      { header: 'Date', key: 'shipmentDate', width: 20 },
      { header: 'Pcs', key: 'totalPcs', width: 10 },
      { header: 'M3', key: 'totalVolumeM3', width: 10 },
    ];
    shipments.forEach((s) => ws.addRow(s));
    return wb;
  }

  async exportOpname(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<exceljs.Workbook> {
    const where: any = { status: 'CONFIRMED' };
    if (dateFrom || dateTo) {
      where.opnameDate = {};
      if (dateFrom) where.opnameDate.gte = new Date(dateFrom);
      if (dateTo) where.opnameDate.lte = new Date(dateTo);
    }
    const opnames = await this.prisma.timberStockOpname.findMany({ where });
    const wb = new exceljs.Workbook();
    const ws = wb.addWorksheet('Opname');
    ws.columns = [
      { header: 'Opname No', key: 'opnameNumber', width: 20 },
      { header: 'Date', key: 'opnameDate', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    opnames.forEach((o) => ws.addRow(o));
    return wb;
  }

  async getTraceabilityAudit(filters: {
    partaiId?: string;
    batch?: string;
    warehouseId?: string;
    timberVariantId?: string;
    classification?: string;
    dateFrom?: string;
    dateTo?: string;
    referenceType?: string;
    referenceId?: string;
    companyId?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    // FAIL-CLOSED TENANT ISOLATION: companyId is strictly mandatory
    if (!filters.companyId) {
      throw new BadRequestException('Tenant company ID is required for traceability audit');
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    // 1. Build TimberStock filter (Current physical stock balances)
    // Note: Stock filter is strictly scoped to tenant and optional physical location/variant,
    // intentionally independent of movement date/reference filters.
    const stockWhere: any = {
      location: { company_id: filters.companyId },
    };
    if (filters.warehouseId) {
      stockWhere.locationId = filters.warehouseId;
    }
    if (filters.timberVariantId) {
      stockWhere.timberVariantId = filters.timberVariantId;
    }
    if (filters.batch) {
      stockWhere.batch = { contains: filters.batch, mode: 'insensitive' };
    }

    // 2. Build TimberStockMovement filter (Historical transactions)
    const movWhere: any = {
      timberStock: {
        location: { company_id: filters.companyId },
      },
    };
    if (filters.warehouseId) {
      movWhere.timberStock.locationId = filters.warehouseId;
    }
    if (filters.timberVariantId) {
      movWhere.timberStock.timberVariantId = filters.timberVariantId;
    }
    if (filters.batch) {
      movWhere.batch = { contains: filters.batch, mode: 'insensitive' };
    }
    if (filters.referenceType) {
      movWhere.referenceType = filters.referenceType;
    }
    if (filters.referenceId) {
      movWhere.referenceId = { contains: filters.referenceId, mode: 'insensitive' };
    }
    if (filters.dateFrom || filters.dateTo) {
      movWhere.date = {};
      if (filters.dateFrom) movWhere.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const dTo = new Date(filters.dateTo);
        dTo.setHours(23, 59, 59, 999);
        movWhere.date.lte = dTo;
      }
    }

    // Filter by partaiId if supplied: find associated reference IDs or batches
    let partaiBatch: string | null = null;
    if (filters.partaiId) {
      const partaiWhere: any = { id: filters.partaiId, company_id: filters.companyId };
      const targetPartai = await this.prisma.timberPartai.findFirst({
        where: partaiWhere,
        select: { id: true, code: true },
      });
      if (targetPartai) {
        partaiBatch = targetPartai.code;
      }
    }

    // Fetch movements for audit
    const [allMovements, totalMovementsCount, currentStocks] = await Promise.all([
      this.prisma.timberStockMovement.findMany({
        where: movWhere,
        include: {
          timberStock: {
            include: {
              location: { select: { id: true, name: true, code: true, company_id: true } },
              timberVariant: {
                select: {
                  id: true,
                  sku: true,
                  species: true,
                  grade: true,
                  thickness: true,
                  width: true,
                  length: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.timberStockMovement.count({ where: movWhere }),
      this.prisma.timberStock.findMany({
        where: stockWhere,
        select: {
          id: true,
          batch: true,
          currentPcs: true,
          currentVolumeM3: true,
          locationId: true,
          timberVariantId: true,
        },
      }),
    ]);

    // Aggregate Current Physical Stock (strictly TimberStock records, preventing double-counting with movements)
    let totalPhysicalStockPcs = 0;
    let totalPhysicalStockM3 = 0;
    for (const cs of currentStocks) {
      totalPhysicalStockPcs += cs.currentPcs || 0;
      totalPhysicalStockM3 += cs.currentVolumeM3 || 0;
    }

    // Extract unique reference IDs per referenceType to resolve in batches
    const sawnOutputIds = new Set<string>();
    const prodProcessIds = new Set<string>();
    const purchaseIds = new Set<string>();
    const shipmentIds = new Set<string>();
    const transferIds = new Set<string>();
    const adjustmentIds = new Set<string>();

    for (const m of allMovements) {
      if (!m.referenceId) continue;
      switch (m.referenceType) {
        case 'PRODUCTION_OUTPUT':
          sawnOutputIds.add(m.referenceId);
          break;
        case 'PRODUCTION_PROCESS_INPUT':
        case 'PRODUCTION_PROCESS_OUTPUT':
        case 'PRODUCTION_PROCESS_REVERSAL':
          prodProcessIds.add(m.referenceId);
          break;
        case 'TIMBER_PURCHASE':
        case 'TIMBER_PURCHASE_REVERSAL':
          purchaseIds.add(m.referenceId);
          break;
        case 'TIMBER_SHIPMENT':
        case 'TIMBER_SHIPMENT_REVERSAL':
          shipmentIds.add(m.referenceId);
          break;
        case 'TRANSFER_IN':
        case 'TRANSFER_OUT':
          transferIds.add(m.referenceId);
          break;
        case 'ADJUSTMENT_IN':
        case 'ADJUSTMENT_OUT':
          adjustmentIds.add(m.referenceId);
          break;
      }
    }

    // Batch resolve upstream documents with strict tenant isolation
    const [
      sawnOutputs,
      prodProcesses,
      purchases,
      shipments,
      transfers,
      adjustments,
    ] = await Promise.all([
      sawnOutputIds.size > 0
        ? this.prisma.sawnTimberOutput.findMany({
            where: {
              id: { in: Array.from(sawnOutputIds) },
              location: { company_id: filters.companyId },
            },
            select: { id: true, bundleNumber: true, batch: true, partaiId: true, partai: { select: { code: true } } },
          })
        : [],
      prodProcessIds.size > 0
        ? this.prisma.productionProcess.findMany({
            where: {
              id: { in: Array.from(prodProcessIds) },
              company_id: filters.companyId,
            },
            select: { id: true, processNo: true, partaiId: true, partai: { select: { code: true } } },
          })
        : [],
      purchaseIds.size > 0
        ? this.prisma.timberPurchase.findMany({
            where: {
              id: { in: Array.from(purchaseIds) },
              company_id: filters.companyId,
            },
            select: {
              id: true,
              purchaseNumber: true,
              partaiId: true,
              partai: { select: { code: true } },
              items: { select: { timberVariantId: true, batch: true, quantityPcs: true, volumeM3: true } },
            },
          })
        : [],
      shipmentIds.size > 0
        ? this.prisma.timberShipment.findMany({
            where: {
              id: { in: Array.from(shipmentIds) },
              company_id: filters.companyId,
            },
            select: {
              id: true,
              shipmentNumber: true,
              partaiId: true,
              partai: { select: { code: true } },
              items: { select: { timberVariantId: true, batch: true, quantityPcs: true, volumeM3: true } },
            },
          })
        : [],
      transferIds.size > 0
        ? this.prisma.stockTransfer.findMany({
            where: {
              id: { in: Array.from(transferIds) },
              OR: [
                { fromLocation: { company_id: filters.companyId } },
                { toLocation: { company_id: filters.companyId } },
              ],
            },
            select: {
              id: true,
              transferNumber: true,
              items: { select: { timberVariantId: true, batch: true, quantityPcs: true, volumeM3: true } },
            },
          })
        : [],
      adjustmentIds.size > 0
        ? this.prisma.stockAdjustment.findMany({
            where: {
              id: { in: Array.from(adjustmentIds) },
              location: { company_id: filters.companyId },
            },
            select: {
              id: true,
              adjustmentNumber: true,
              items: { select: { timberVariantId: true, batch: true, differencePcs: true, differenceM3: true } },
            },
          })
        : [],
    ]);

    const sawnMap = new Map<string, any>((sawnOutputs as any[]).map((d: any) => [d.id, d]));
    const prodMap = new Map<string, any>((prodProcesses as any[]).map((d: any) => [d.id, d]));
    const purchaseMap = new Map<string, any>((purchases as any[]).map((d: any) => [d.id, d]));
    const shipmentMap = new Map<string, any>((shipments as any[]).map((d: any) => [d.id, d]));
    const transferMap = new Map<string, any>((transfers as any[]).map((d: any) => [d.id, d]));
    const adjustmentMap = new Map<string, any>((adjustments as any[]).map((d: any) => [d.id, d]));

    // Perform deterministic classification for every movement
    const classifiedMovements = allMovements.map((m) => {
      const movementBatch = (m.batch || 'UNKNOWN').trim();
      const variantId = m.timberStock?.timberVariantId || null;
      let classification: 'VERIFIED' | 'AMBIGUOUS' | 'UNKNOWN' | 'INCONSISTENT' = 'UNKNOWN';
      let evidence = 'No source document link found.';
      let sourceDocNo: string | null = null;
      let docPartaiCode: string | null = null;

      if (!m.referenceId || m.referenceType === 'OPENING_BALANCE' || movementBatch === 'UNKNOWN') {
        if (movementBatch === 'UNKNOWN' || !m.referenceId) {
          classification = 'UNKNOWN';
          evidence = !m.referenceId
            ? 'Missing reference document; unbatched opening balance or direct mutation.'
            : 'Movement batch identifier is explicitly UNKNOWN.';
        }
      }

      if (m.referenceId) {
        switch (m.referenceType) {
          case 'PRODUCTION_OUTPUT': {
            const doc = sawnMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.bundleNumber;
              docPartaiCode = doc.partai?.code || doc.batch || null;
              if (docPartaiCode) {
                if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() === docPartaiCode.toUpperCase()) {
                  classification = 'VERIFIED';
                  evidence = `Verified against SawnTimberOutput ${doc.bundleNumber} (Partai: ${docPartaiCode}).`;
                } else if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() !== docPartaiCode.toUpperCase()) {
                  classification = 'INCONSISTENT';
                  evidence = `Movement batch "${movementBatch}" conflicts with SawnTimberOutput partai "${docPartaiCode}".`;
                } else {
                  classification = 'AMBIGUOUS';
                  evidence = `Source SawnTimberOutput has partai "${docPartaiCode}" but movement batch is UNKNOWN.`;
                }
              } else {
                classification = 'AMBIGUOUS';
                evidence = `SawnTimberOutput ${doc.bundleNumber} does not specify a partaiId or batch.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced SawnTimberOutput (${m.referenceId}) not found in database.`;
            }
            break;
          }

          case 'PRODUCTION_PROCESS_INPUT':
          case 'PRODUCTION_PROCESS_OUTPUT':
          case 'PRODUCTION_PROCESS_REVERSAL': {
            const doc = prodMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.processNo;
              docPartaiCode = doc.partai?.code || null;
              if (docPartaiCode) {
                if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() === docPartaiCode.toUpperCase()) {
                  classification = 'VERIFIED';
                  evidence = `Verified against ProductionProcess ${doc.processNo} (Partai: ${docPartaiCode}).`;
                } else if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() !== docPartaiCode.toUpperCase()) {
                  classification = 'INCONSISTENT';
                  evidence = `Movement batch "${movementBatch}" conflicts with process partai "${docPartaiCode}".`;
                } else {
                  classification = 'AMBIGUOUS';
                  evidence = `ProductionProcess has partai "${docPartaiCode}" but movement batch is UNKNOWN.`;
                }
              } else {
                classification = 'AMBIGUOUS';
                evidence = `ProductionProcess ${doc.processNo} has no linked partaiId.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced ProductionProcess (${m.referenceId}) not found in database.`;
            }
            break;
          }

          case 'TIMBER_PURCHASE':
          case 'TIMBER_PURCHASE_REVERSAL': {
            const doc = purchaseMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.purchaseNumber;
              docPartaiCode = doc.partai?.code || null;
              if (docPartaiCode) {
                if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() === docPartaiCode.toUpperCase()) {
                  classification = 'VERIFIED';
                  evidence = `Verified against TimberPurchase ${doc.purchaseNumber} (Partai: ${docPartaiCode}).`;
                } else if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() !== docPartaiCode.toUpperCase()) {
                  classification = 'INCONSISTENT';
                  evidence = `Movement batch "${movementBatch}" conflicts with purchase partai "${docPartaiCode}".`;
                } else {
                  classification = 'AMBIGUOUS';
                  evidence = `TimberPurchase has partai "${docPartaiCode}" but movement batch is UNKNOWN.`;
                }
              } else {
                classification = 'AMBIGUOUS';
                evidence = `TimberPurchase ${doc.purchaseNumber} has no linked partaiId.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced TimberPurchase (${m.referenceId}) not found in database.`;
            }
            break;
          }

          case 'TIMBER_SHIPMENT':
          case 'TIMBER_SHIPMENT_REVERSAL': {
            const doc = shipmentMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.shipmentNumber;
              docPartaiCode = doc.partai?.code || null;
              if (docPartaiCode) {
                if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() === docPartaiCode.toUpperCase()) {
                  classification = 'VERIFIED';
                  evidence = `Verified against TimberShipment ${doc.shipmentNumber} (Partai: ${docPartaiCode}).`;
                } else if (movementBatch !== 'UNKNOWN' && movementBatch.toUpperCase() !== docPartaiCode.toUpperCase()) {
                  classification = 'INCONSISTENT';
                  evidence = `Movement batch "${movementBatch}" conflicts with shipment partai "${docPartaiCode}".`;
                } else {
                  classification = 'AMBIGUOUS';
                  evidence = `TimberShipment has partai "${docPartaiCode}" but movement batch is UNKNOWN.`;
                }
              } else {
                classification = 'AMBIGUOUS';
                evidence = `TimberShipment ${doc.shipmentNumber} has no linked partaiId.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced TimberShipment (${m.referenceId}) not found in database.`;
            }
            break;
          }

          case 'TRANSFER_IN':
          case 'TRANSFER_OUT': {
            const doc = transferMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.transferNumber;
              // Disambiguate by timberVariantId if available
              const variantItems = variantId
                ? doc.items.filter((item: any) => item.timberVariantId === variantId)
                : doc.items;
              const itemsToCheck = variantItems.length > 0 ? variantItems : doc.items;

              const matchingItem = itemsToCheck.find(
                (item: any) => (item.batch || 'UNKNOWN').trim().toUpperCase() === movementBatch.toUpperCase(),
              );
              if (matchingItem && movementBatch !== 'UNKNOWN') {
                classification = 'VERIFIED';
                evidence = `Verified against StockTransfer ${doc.transferNumber} line item batch (variant: ${variantId || 'any'}).`;
              } else if (itemsToCheck.length === 1 && itemsToCheck[0].batch && itemsToCheck[0].batch !== 'UNKNOWN') {
                if (movementBatch === 'UNKNOWN') {
                  classification = 'AMBIGUOUS';
                  evidence = `Transfer ${doc.transferNumber} item has batch "${itemsToCheck[0].batch}", but movement batch is UNKNOWN.`;
                } else {
                  classification = 'INCONSISTENT';
                  evidence = `Movement batch "${movementBatch}" conflicts with transfer item batch "${itemsToCheck[0].batch}".`;
                }
              } else {
                classification = 'AMBIGUOUS';
                evidence = `StockTransfer ${doc.transferNumber} contains multiple or conflicting variant items without unique batch match.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced StockTransfer (${m.referenceId}) not found in database.`;
            }
            break;
          }

          case 'ADJUSTMENT_IN':
          case 'ADJUSTMENT_OUT': {
            const doc = adjustmentMap.get(m.referenceId);
            if (doc) {
              sourceDocNo = doc.adjustmentNumber;
              const variantItems = variantId
                ? doc.items.filter((item: any) => item.timberVariantId === variantId)
                : doc.items;
              const itemsToCheck = variantItems.length > 0 ? variantItems : doc.items;

              const matchingItem = itemsToCheck.find(
                (item: any) => (item.batch || 'UNKNOWN').trim().toUpperCase() === movementBatch.toUpperCase(),
              );
              if (matchingItem && movementBatch !== 'UNKNOWN') {
                classification = 'VERIFIED';
                evidence = `Verified against StockAdjustment ${doc.adjustmentNumber} line item batch (variant: ${variantId || 'any'}).`;
              } else {
                classification = 'AMBIGUOUS';
                evidence = `StockAdjustment ${doc.adjustmentNumber} item batch is unconfirmed or multiple variant items exist.`;
              }
            } else {
              classification = 'UNKNOWN';
              evidence = `Referenced StockAdjustment (${m.referenceId}) not found in database.`;
            }
            break;
          }
        }
      }

      return {
        id: m.id,
        date: m.date,
        type: m.type,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        sourceDocNo,
        docPartaiCode,
        batch: movementBatch,
        quantityPcs: m.quantityPcs,
        volumeM3: m.volumeM3,
        warehouse: m.timberStock?.location
          ? {
              id: m.timberStock.location.id,
              name: m.timberStock.location.name,
              code: m.timberStock.location.code,
            }
          : null,
        variant: m.timberStock?.timberVariant
          ? {
              id: m.timberStock.timberVariant.id,
              sku: m.timberStock.timberVariant.sku,
              species: m.timberStock.timberVariant.species,
              grade: m.timberStock.timberVariant.grade,
              thickness: m.timberStock.timberVariant.thickness,
              width: m.timberStock.timberVariant.width,
              length: m.timberStock.timberVariant.length,
            }
          : null,
        classification,
        evidence,
      };
    });

    // Compute complete summary metrics across all classified records (avoiding page-truncation bias)
    let verifiedCount = 0;
    let ambiguousCount = 0;
    let unknownCount = 0;
    let inconsistentCount = 0;

    for (const r of classifiedMovements) {
      if (r.classification === 'VERIFIED') verifiedCount++;
      else if (r.classification === 'AMBIGUOUS') ambiguousCount++;
      else if (r.classification === 'INCONSISTENT') inconsistentCount++;
      else unknownCount++;
    }

    // Apply classification filter if requested
    let filteredRecords = classifiedMovements;
    if (filters.classification && filters.classification !== 'ALL') {
      filteredRecords = classifiedMovements.filter(
        (r) => r.classification === filters.classification,
      );
    }

    // Apply partai filter if requested and partai was resolved
    if (partaiBatch) {
      filteredRecords = filteredRecords.filter(
        (r) =>
          r.batch.toUpperCase() === partaiBatch!.toUpperCase() ||
          (r.docPartaiCode && r.docPartaiCode.toUpperCase() === partaiBatch!.toUpperCase()),
      );
    }

    const filteredTotal = filteredRecords.length;
    const paginatedData = filteredRecords.slice(skip, skip + limit);

    return {
      summary: {
        totalMovements: totalMovementsCount,
        verifiedCount,
        ambiguousCount,
        unknownCount,
        inconsistentCount,
        currentStockPcs: totalPhysicalStockPcs,
        currentStockM3: Number(totalPhysicalStockM3.toFixed(4)),
      },
      pagination: {
        page,
        limit,
        totalRecords: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
      },
      data: paginatedData,
    };
  }

  /**
   * PHASE 04.2: Read-Only Dry-Run Legacy Batch Reconciliation Preview
   * STRICTLY READ-ONLY: Computes identity reallocation preview without mutating database or stocks.
   */
  async getTraceabilityReconciliationPreview(filters: {
    warehouseId?: string;
    timberVariantId?: string;
    partaiId?: string;
    companyId?: string;
  }) {
    // FAIL-CLOSED TENANT ISOLATION: companyId is strictly mandatory
    if (!filters.companyId) {
      throw new BadRequestException('Tenant company ID is required for reconciliation preview');
    }

    // 1. Fetch all movements within scope using getTraceabilityAudit to obtain authoritative classification
    const audit = await this.getTraceabilityAudit({
      warehouseId: filters.warehouseId,
      timberVariantId: filters.timberVariantId,
      partaiId: filters.partaiId,
      companyId: filters.companyId,
      page: 1,
      limit: 100000,
    });

    // 2. Fetch current TimberStock buckets for all affected location/variant combinations
    const stockWhere: any = {
      location: { company_id: filters.companyId },
    };
    if (filters.warehouseId) stockWhere.locationId = filters.warehouseId;
    if (filters.timberVariantId) stockWhere.timberVariantId = filters.timberVariantId;

    const currentStocks = await this.prisma.timberStock.findMany({
      where: stockWhere,
      select: {
        id: true,
        locationId: true,
        timberVariantId: true,
        batch: true,
        currentPcs: true,
        currentVolumeM3: true,
      },
    });

    // Running capacity state for source UNKNOWN buckets
    const runningSourceCapacityMap = new Map<
      string,
      {
        initialPcs: number;
        initialM3: number;
        remainingPcs: number;
        remainingM3: number;
        allocatedPcs: number;
        allocatedM3: number;
      }
    >();

    // Running state for target verified buckets
    const runningTargetBucketMap = new Map<
      string,
      {
        initialPcs: number;
        initialM3: number;
        currentPcs: number;
        currentVolumeM3: number;
      }
    >();

    for (const s of currentStocks) {
      const key = `${s.locationId}:${s.timberVariantId}:${s.batch}`;
      const pcs = s.currentPcs || 0;
      const m3 = s.currentVolumeM3 || 0;
      if (s.batch === 'UNKNOWN') {
        runningSourceCapacityMap.set(key, {
          initialPcs: pcs,
          initialM3: m3,
          remainingPcs: pcs,
          remainingM3: m3,
          allocatedPcs: 0,
          allocatedM3: 0,
        });
      } else {
        runningTargetBucketMap.set(key, {
          initialPcs: pcs,
          initialM3: m3,
          currentPcs: pcs,
          currentVolumeM3: m3,
        });
      }
    }

    // 3. Process each movement record and determine dry-run preview eligibility
    const proposals: any[] = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const record of audit.data) {
      const locationId = record.warehouse?.id;
      const variantId = record.variant?.id;
      const verifiedBatch = record.docPartaiCode || record.batch;

      // Rule: Eligible preview candidate requires:
      // a. Movement must be classified strictly as VERIFIED
      // b. Verified batch must exist and not be 'UNKNOWN'
      // c. Location and Variant must be resolved
      if (record.classification !== 'VERIFIED') {
        proposals.push({
          movementId: record.id,
          classification: record.classification,
          identityVerified: false,
          remainingQuantityProven: false,
          eligible: false,
          rejectionReason: `Record classification is ${record.classification}; reconciliation preview is strictly restricted to VERIFIED records.`,
          evidence: record.evidence,
          proposedReallocation: null,
        });
        ineligibleCount++;
        continue;
      }

      if (!locationId || !variantId || !verifiedBatch || verifiedBatch === 'UNKNOWN') {
        proposals.push({
          movementId: record.id,
          classification: record.classification,
          identityVerified: false,
          remainingQuantityProven: false,
          eligible: false,
          rejectionReason: 'Missing resolved location, variant, or verified target batch identifier.',
          evidence: record.evidence,
          proposedReallocation: null,
        });
        ineligibleCount++;
        continue;
      }

      // Source bucket (UNKNOWN) tracking
      const sourceKey = `${locationId}:${variantId}:UNKNOWN`;
      let sourceRunning = runningSourceCapacityMap.get(sourceKey);
      if (!sourceRunning) {
        sourceRunning = {
          initialPcs: 0,
          initialM3: 0,
          remainingPcs: 0,
          remainingM3: 0,
          allocatedPcs: 0,
          allocatedM3: 0,
        };
        runningSourceCapacityMap.set(sourceKey, sourceRunning);
      }

      // Target bucket (verifiedBatch) tracking
      const targetKey = `${locationId}:${variantId}:${verifiedBatch}`;
      let targetRunning = runningTargetBucketMap.get(targetKey);
      if (!targetRunning) {
        targetRunning = {
          initialPcs: 0,
          initialM3: 0,
          currentPcs: 0,
          currentVolumeM3: 0,
        };
        runningTargetBucketMap.set(targetKey, targetRunning);
      }

      // Quantity to reallocate
      const reallocPcs = record.quantityPcs;
      const reallocM3 = Number((record.volumeM3 || 0).toFixed(4));

      // CONTRACT SEPARATION (Phase 04.2.2):
      // identityVerified: Source document establishes the verified batch identity.
      // remainingQuantityProven: Whether current physical stock can be proven to derive from this specific movement.
      // reconciliationEligible: Both identity and remaining quantity proven, and capacity/invariants pass.
      const identityVerified = record.classification === 'VERIFIED';

      // Rule: Attributable Provenance Check
      // 1. Only positive IN-flows into UNKNOWN stock can legitimately represent physical additions.
      // 2. In a shared UNKNOWN bucket subject to aggregated mutations without lot/bundle serialization,
      // remaining physical quantity attribution cannot be proven.
      const remainingQuantityProven = record.type === 'IN' && reallocPcs > 0;

      if (!remainingQuantityProven) {
        proposals.push({
          movementId: record.id,
          classification: record.classification,
          identityVerified,
          remainingQuantityProven: false,
          eligible: false,
          rejectionReason: `Movement type is ${record.type}; non-inflow records cannot establish remaining physical stock provenance in the UNKNOWN bucket.`,
          evidence: record.evidence,
          proposedReallocation: null,
        });
        ineligibleCount++;
        continue;
      }

      // Cumulative Capacity Check (PCS and M³):
      // Does source UNKNOWN bucket have sufficient remaining physical PCS AND Volume M³ across all accepted proposals?
      if (sourceRunning.remainingPcs < reallocPcs || sourceRunning.remainingM3 < reallocM3) {
        let exhaustedReason = '';
        if (sourceRunning.remainingPcs < reallocPcs) {
          exhaustedReason = sourceRunning.allocatedPcs > 0
            ? `Cumulative capacity exhausted: source UNKNOWN bucket has only ${sourceRunning.remainingPcs} pcs remaining (${sourceRunning.allocatedPcs} pcs already allocated to preceding proposals from initial ${sourceRunning.initialPcs} pcs); cannot fulfill ${reallocPcs} pcs.`
            : `Source UNKNOWN bucket has insufficient balance (${sourceRunning.remainingPcs} pcs) for proposed reallocation of ${reallocPcs} pcs.`;
        } else {
          exhaustedReason = sourceRunning.allocatedM3 > 0
            ? `Cumulative volume exhausted: source UNKNOWN bucket has only ${sourceRunning.remainingM3.toFixed(4)} m³ remaining (${sourceRunning.allocatedM3.toFixed(4)} m³ already allocated to preceding proposals from initial ${sourceRunning.initialM3.toFixed(4)} m³); cannot fulfill ${reallocM3.toFixed(4)} m³.`
            : `Source UNKNOWN bucket has insufficient volume (${sourceRunning.remainingM3.toFixed(4)} m³) for proposed reallocation of ${reallocM3.toFixed(4)} m³.`;
        }

        proposals.push({
          movementId: record.id,
          classification: 'VERIFIED',
          identityVerified: true,
          remainingQuantityProven: true,
          eligible: false,
          rejectionReason: exhaustedReason,
          evidence: record.evidence,
          proposedReallocation: {
            locationId,
            timberVariantId: variantId,
            warehouseName: record.warehouse?.name || record.warehouse?.code,
            variantSku: record.variant?.sku,
            sourceBucket: {
              batch: 'UNKNOWN',
              initialPcs: sourceRunning.initialPcs,
              remainingPcs: sourceRunning.remainingPcs,
              allocatedPcs: sourceRunning.allocatedPcs,
              initialM3: sourceRunning.initialM3,
              remainingM3: sourceRunning.remainingM3,
              allocatedM3: sourceRunning.allocatedM3,
            },
            targetBucket: {
              batch: verifiedBatch,
              currentPcs: targetRunning.currentPcs,
              currentVolumeM3: targetRunning.currentVolumeM3,
            },
            reallocatedPcs: reallocPcs,
            reallocatedVolumeM3: reallocM3,
          },
        });
        ineligibleCount++;
        continue;
      }

      // Compute simulated before / after balances from current running state
      const beforeSourcePcs = sourceRunning.remainingPcs;
      const beforeSourceM3 = Number(sourceRunning.remainingM3.toFixed(4));
      const simulatedSourceAfterPcs = beforeSourcePcs - reallocPcs;
      const simulatedSourceAfterM3 = Number(Math.max(0, beforeSourceM3 - reallocM3).toFixed(4));

      const beforeTargetPcs = targetRunning.currentPcs;
      const beforeTargetM3 = Number(targetRunning.currentVolumeM3.toFixed(4));
      const simulatedTargetAfterPcs = beforeTargetPcs + reallocPcs;
      const simulatedTargetAfterM3 = Number((beforeTargetM3 + reallocM3).toFixed(4));

      // Net physical delta invariant: (sourceDelta + targetDelta) must equal 0
      const netDeltaPcs = (-reallocPcs) + reallocPcs;
      const netDeltaM3 = Number((-reallocM3 + reallocM3).toFixed(4));

      // DYNAMIC RUNNING STATE UPDATE:
      // Deduct from running source bucket to ensure cumulative capacity constraints
      sourceRunning.remainingPcs -= reallocPcs;
      sourceRunning.remainingM3 = Number(Math.max(0, sourceRunning.remainingM3 - reallocM3).toFixed(4));
      sourceRunning.allocatedPcs += reallocPcs;
      sourceRunning.allocatedM3 = Number((sourceRunning.allocatedM3 + reallocM3).toFixed(4));

      // Add to running target bucket
      targetRunning.currentPcs += reallocPcs;
      targetRunning.currentVolumeM3 = Number((targetRunning.currentVolumeM3 + reallocM3).toFixed(4));

      proposals.push({
        movementId: record.id,
        classification: 'VERIFIED',
        identityVerified: true,
        remainingQuantityProven: true,
        eligible: true,
        rejectionReason: null,
        evidence: record.evidence,
        sourceDocument: {
          type: record.referenceType,
          id: record.referenceId,
          docNo: record.sourceDocNo,
        },
        proposedReallocation: {
          locationId,
          timberVariantId: variantId,
          warehouseName: record.warehouse?.name || record.warehouse?.code,
          variantSku: record.variant?.sku,
          targetBatch: verifiedBatch,
          reallocatedPcs: reallocPcs,
          reallocatedVolumeM3: reallocM3,
          sourceBucket: {
            batch: 'UNKNOWN',
            beforePcs: beforeSourcePcs,
            beforeM3: beforeSourceM3,
            afterPcs: simulatedSourceAfterPcs,
            afterM3: simulatedSourceAfterM3,
            deltaPcs: -reallocPcs,
            deltaM3: -reallocM3,
          },
          targetBucket: {
            batch: verifiedBatch,
            beforePcs: beforeTargetPcs,
            beforeM3: beforeTargetM3,
            afterPcs: simulatedTargetAfterPcs,
            afterM3: simulatedTargetAfterM3,
            deltaPcs: reallocPcs,
            deltaM3: reallocM3,
          },
          netPhysicalDelta: {
            pcs: netDeltaPcs,
            volumeM3: netDeltaM3,
            isBalanced: netDeltaPcs === 0 && Math.abs(netDeltaM3) < 0.0001,
          },
        },
      });
      eligibleCount++;
    }

    return {
      mode: 'DRY_RUN_PREVIEW',
      isReadOnly: true,
      summary: {
        totalEvaluated: audit.summary.totalMovements,
        eligibleCount,
        ineligibleCount,
        auditSummary: audit.summary,
      },
      proposals,
    };
  }
}
