import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimberSourceDto, UpdateTimberSourceDto } from '../dto/master-data.dto';

@Injectable()
export class TimberSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.timberSource.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.timberSource.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('TimberSource not found');
    return item;
  }

  async create(data: CreateTimberSourceDto) {
    return this.prisma.timberSource.create({ data });
  }

  async update(id: string, data: Partial<UpdateTimberSourceDto>) {
    await this.findOne(id);
    return this.prisma.timberSource.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.timberSource.update({
      where: { id },
      data: { isActive },
    });
  }
}
