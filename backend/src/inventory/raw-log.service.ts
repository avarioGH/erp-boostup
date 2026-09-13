import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimberCalculationService } from './timber-calculation.service';
import { AuditService } from '../core/audit.service';

@Injectable()
export class RawLogService {
  constructor(
    private prisma: PrismaService,
    private calcService: TimberCalculationService,
    private audit: AuditService
  ) {}

  async listRawLogs(params: {
    skip?: number;
    take?: number;
    search?: string;
    species?: string;
    diameterClass?: string;
    locationId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 50, search, species, diameterClass, locationId, status } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { logNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { batch: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (species) where.species = species;
    if (diameterClass) where.diameterClass = diameterClass;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.rawLog.findMany({
        skip: Number(skip),
        take: Number(take),
        where,
        orderBy: { createdAt: 'desc' },
        include: { location: true }
      }),
      this.prisma.rawLog.count({ where })
    ]);

    return { items, total, skip: Number(skip), take: Number(take) };
  }

  async getRawLog(id: string) {
    const log = await this.prisma.rawLog.findUnique({
      where: { id },
      include: {
        location: true,
        trimmedLogs: true
      }
    });
    if (!log) throw new NotFoundException('Raw log not found');
    return log;
  }

  async createRawLog(data: any) {
    // Validate uniqueness
    const existingLog = await this.prisma.rawLog.findUnique({ where: { logNumber: data.logNumber } });
    if (existingLog) throw new BadRequestException(`Log Number ${data.logNumber} already exists.`);

    if (data.barcode) {
      const existingBarcode = await this.prisma.rawLog.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new BadRequestException(`Barcode ${data.barcode} already exists.`);
    }

    if (data.originalLength <= 0) throw new BadRequestException('Length must be greater than 0.');
    if (data.diameter1 <= 0 || data.diameter2 <= 0 || data.diameter3 <= 0 || data.diameter4 <= 0) {
      throw new BadRequestException('All diameters must be greater than 0.');
    }

    // Calculations
    const avgDia = this.calcService.calculateAverageDiameter(
      Number(data.diameter1), Number(data.diameter2), Number(data.diameter3), Number(data.diameter4)
    );
    const rndDia = this.calcService.calculateRoundedDiameter(avgDia);
    const diaClass = this.calcService.classifyDiameter(rndDia);
    const grossVol = this.calcService.calculateRawLogGrossVolume(rndDia, Number(data.originalLength));
    
    let gerowongVol = 0;
    if (data.gerowong > 0) {
      gerowongVol = this.calcService.calculateGerowongVolume(Number(data.gerowong), Number(data.originalLength), Number(data.trimmingLength || 0));
    }
    
    let trimmingVol = 0;
    if (data.trimmingLength > 0) {
      if (data.trimmingLength > data.originalLength) throw new BadRequestException('Trimming length cannot exceed original length.');
      trimmingVol = this.calcService.calculateTrimmingVolume(rndDia, Number(data.trimmingLength));
    }

    const netVol = this.calcService.calculateRawLogNetVolume(grossVol, gerowongVol, trimmingVol);
    if (netVol < 0) throw new BadRequestException('Calculated net volume cannot be negative.');

    const created = await this.prisma.rawLog.create({
      data: {
        logNumber: data.logNumber,
        sequence: data.sequence ? Number(data.sequence) : null,
        code: data.code,
        species: data.species,
        quantity: 1,
        originalLength: Number(data.originalLength),
        diameter1: Number(data.diameter1),
        diameter2: Number(data.diameter2),
        diameter3: Number(data.diameter3),
        diameter4: Number(data.diameter4),
        averageDiameter: avgDia,
        roundedDiameter: rndDia,
        diameterClass: diaClass,
        grossVolume: grossVol,
        gerowong: data.gerowong ? Number(data.gerowong) : null,
        hollowVolume: gerowongVol || null,
        trimmingLength: data.trimmingLength ? Number(data.trimmingLength) : null,
        trimmingVolume: trimmingVol || null,
        netVolume: netVol,
        barcode: data.barcode || `LOG-${Date.now()}`,
        batch: data.batch,
        receivingDate: data.receivingDate ? new Date(data.receivingDate) : new Date(),
        locationId: data.locationId,
        notes: data.notes
      }
    });
    await this.audit.log({ company_id: data.companyId || '000000000000000000000000', action: 'CREATE', entity: 'RAW_LOG', entity_id: created.id, after_data: { logNumber: created.logNumber } });
    return created;
  }

  async cancelRawLog(id: string) {
    const log = await this.getRawLog(id);
    if (log.status !== 'AVAILABLE') throw new BadRequestException(`Cannot cancel log in status ${log.status}`);
    
    const result = await this.prisma.rawLog.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    await this.audit.log({ company_id: '000000000000000000000000', action: 'CANCEL', entity: 'RAW_LOG', entity_id: id, before_data: { status: log.status }, after_data: { status: 'CANCELLED' } });
    return result;
  }
}




