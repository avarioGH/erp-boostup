import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartaiService {
  private readonly logger = new Logger(PartaiService.name);

  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    if (!data?.code || !data.code.trim()) {
      throw new BadRequestException('Kode Partai wajib diisi.');
    }

    const code = data.code.trim();

    // Check if duplicate code exists
    const existing = await this.prisma.timberPartai.findFirst({
      where: {
        code,
        ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Kode Partai '${code}' sudah terdaftar di sistem. Mohon gunakan kode partai yang berbeda.`,
      );
    }

    try {
      return await this.prisma.timberPartai.create({
        data: {
          ...data,
          code,
          company_id: targetCompanyId,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Kode Partai '${code}' sudah terdaftar di sistem. Mohon gunakan kode partai yang berbeda.`,
        );
      }
      throw err;
    }
  }

  async migrateToTesting(companyId?: string) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    let testingPartai = await this.prisma.timberPartai.findFirst({
      where: { code: 'TESTING', ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
    });
    if (!testingPartai) {
      testingPartai = await this.prisma.timberPartai.create({
        data: {
          code: 'TESTING',
          name: 'Partai Testing (Migrasi)',
          company_id: targetCompanyId as string,
          status: 'COMPLETED',
        },
      });
    }

    const pid = testingPartai.id;
    const p1 = await this.prisma.timberPurchase.updateMany({
      where: { partaiId: null, ...(targetCompanyId ? { company_id: targetCompanyId } : {}) },
      data: { partaiId: pid },
    });
    const p2 = await this.prisma.rawLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p3 = await this.prisma.trimmedLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p4 = await this.prisma.inputLog.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    const p5 = await this.prisma.sawnTimberOutput.updateMany({
      where: { partaiId: null },
      data: { partaiId: pid },
    });
    return {
      success: true,
      testingPartaiId: pid,
      updated: {
        purchases: p1.count,
        rawLogs: p2.count,
        trimmedLogs: p3.count,
        inputLogs: p4.count,
        outputs: p5.count,
      },
    };
  }

  async findAll(companyId?: string) {
    const where: any = {};
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    return this.prisma.timberPartai.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId?: string) {
    try {
      // FIX CORRUPT DATA:
      // If there are InputLogs that belong to this Partai's TrimmedLogs but lack partaiId, fix them.
      const corruptInputLogItems = await this.prisma.inputLogItem.findMany({
        where: {
          trimmedLog: { partaiId: id },
          inputLog: { partaiId: null },
        },
        include: { inputLog: true, trimmedLog: true },
      });

      for (const item of corruptInputLogItems) {
        if (item.inputLog) {
          await this.prisma.inputLog.update({
            where: { id: item.inputLogId },
            data: { partaiId: id },
          });
        }
      }

      // FIX MISSING INPUT LOGS:
      // Find TrimmedLogs that think they are in an InputLog, but the InputLog doesn't exist
      const assignedTrimmedLogs = await this.prisma.trimmedLog.findMany({
        where: { partaiId: id, status: 'ASSIGNED_TO_INPUT', inputLogId: { not: null } },
        include: { inputLog: true },
      });
      for (const st of assignedTrimmedLogs) {
        if (!st.inputLog) {
          await this.prisma.trimmedLog.update({
            where: { id: st.id },
            data: { status: 'AVAILABLE', inputLogId: null },
          });
        }
      }

      // FIX CORRUPT TRIMMED LOGS:
      // If there are TrimmedLogs that are ASSIGNED_TO_INPUT but don't have an inputLogId or their inputLog is missing, reset them
      const stuckTrimmedLogs = await this.prisma.trimmedLog.findMany({
        where: { partaiId: id, status: 'ASSIGNED_TO_INPUT', inputLogId: null },
      });
      for (const st of stuckTrimmedLogs) {
        await this.prisma.trimmedLog.update({
          where: { id: st.id },
          data: { status: 'AVAILABLE' },
        });
      }
    } catch (err) {
      this.logger.warn(`Data fix routine skipped for partai ${id}: ${err?.message || err}`);
    }

    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
      include: {
        purchases: {
          include: { items: true, logItems: true },
        },
        rawLogs: true,
        trimmedLogs: { include: { rawLog: true } },
        inputLogs: {
          include: {
            items: {
              include: { trimmedLog: true, rawLog: true },
            },
            sawnOutputs: { include: { items: { include: { timberVariant: true } } } },
          },
        },
        sawnOutputs: { include: { items: { include: { timberVariant: true } } } },
      },
    });

    if (!partai) throw new NotFoundException('Partai not found');
    return partai;
  }

  async update(id: string, companyId?: string, data?: any) {
    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
    });
    if (!partai) throw new NotFoundException('Partai not found');

    if (data?.code && data.code.trim() !== partai.code) {
      const code = data.code.trim();
      const existing = await this.prisma.timberPartai.findFirst({
        where: {
          code,
          ...(partai.company_id ? { company_id: partai.company_id } : {}),
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Kode Partai '${code}' sudah digunakan oleh partai lain.`,
        );
      }
      data.code = code;
    }

    try {
      return await this.prisma.timberPartai.update({
        where: { id },
        data,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Kode Partai '${data?.code || ''}' sudah digunakan.`,
        );
      }
      throw err;
    }
  }

  async delete(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }

    const partai = await this.prisma.timberPartai.findFirst({
      where,
    });
    if (!partai) throw new NotFoundException('Partai not found');
    return this.prisma.timberPartai.delete({ where: { id } });
  }
}
