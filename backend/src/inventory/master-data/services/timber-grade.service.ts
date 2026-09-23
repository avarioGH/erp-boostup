import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimberGradeDto, UpdateTimberGradeDto } from '../dto/master-data.dto';

@Injectable()
export class TimberGradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.timberGrade.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.timberGrade.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('TimberGrade not found');
    return item;
  }

  async create(data: CreateTimberGradeDto) {
    return this.prisma.timberGrade.create({ data });
  }

  async update(id: string, data: Partial<UpdateTimberGradeDto>) {
    await this.findOne(id);
    return this.prisma.timberGrade.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.timberGrade.update({
      where: { id },
      data: { isActive },
    });
  }
}
