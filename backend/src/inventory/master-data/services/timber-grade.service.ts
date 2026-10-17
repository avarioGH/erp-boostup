import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTimberGradeDto,
  UpdateTimberGradeDto,
} from '../dto/master-data.dto';

@Injectable()
export class TimberGradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(company_id: string) {
    let list = await this.prisma.timberGrade.findMany({ where: { company_id } });
    if (!list || list.length === 0) {
      const defaultGrades = [
        { code: 'A', name: 'Grade A (Ekspor / Super)', description: 'Kualitas tertinggi tanpa cacat' },
        { code: 'B', name: 'Grade B (Lokal Bagus)', description: 'Mata kayu minimal / standar ekspor lokal' },
        { code: 'C', name: 'Grade C (Standard)', description: 'Kualitas standar proyek bangunan' },
        { code: 'AFKIR', name: 'Afkir (Reject / Sipot)', description: 'Sisa potongan atau kayu afkir' },
      ];

      for (const item of defaultGrades) {
        await this.prisma.timberGrade.create({
          data: {
            company_id,
            code: item.code,
            name: item.name,
            description: item.description,
            isActive: true,
          },
        }).catch(() => null);
      }

      list = await this.prisma.timberGrade.findMany({ where: { company_id } });
    }
    return list;
  }

  async findOne(id: string, company_id: string) {
    const item = await this.prisma.timberGrade.findUnique({
      where: { id, company_id },
    });
    if (!item) throw new NotFoundException('TimberGrade not found');
    return item;
  }

  async create(data: CreateTimberGradeDto) {
    return this.prisma.timberGrade.create({ data: data as any });
  }

  async update(id: string, data: any, company_id: string) {
    await this.findOne(id, company_id);
    return this.prisma.timberGrade.update({
      where: { id, company_id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean, company_id: string) {
    await this.findOne(id, company_id);
    return this.prisma.timberGrade.update({
      where: { id, company_id },
      data: { isActive },
    });
  }
}
