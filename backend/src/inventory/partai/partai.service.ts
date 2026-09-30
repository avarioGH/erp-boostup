import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartaiService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.timberPartai.create({
      data: {
        ...data,
        company_id: companyId
      }
    });
  }

  async findAll(companyId: string) {
    return this.prisma.timberPartai.findMany({
      where: { company_id: companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, companyId: string) {
    const partai = await this.prisma.timberPartai.findFirst({
      where: { id, company_id: companyId },
      include: {
        purchases: {
          include: { items: true, logItems: true }
        },
        rawLogs: true,
        trimmedLogs: true,
        inputLogs: true,
        sawnOutputs: {
          include: { items: true }
        }
      }
    });

    if (!partai) throw new NotFoundException('Partai not found');
    return partai;
  }

  async update(id: string, companyId: string, data: any) {
    const partai = await this.prisma.timberPartai.findFirst({ where: { id, company_id: companyId } });
    if (!partai) throw new NotFoundException('Partai not found');
    return this.prisma.timberPartai.update({
      where: { id },
      data
    });
  }

  async delete(id: string, companyId: string) {
    const partai = await this.prisma.timberPartai.findFirst({ where: { id, company_id: companyId } });
    if (!partai) throw new NotFoundException('Partai not found');
    return this.prisma.timberPartai.delete({ where: { id } });
  }
}
