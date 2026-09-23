import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimberSpeciesDto, UpdateTimberSpeciesDto } from '../dto/master-data.dto';

@Injectable()
export class TimberSpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.timberSpecies.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.timberSpecies.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('TimberSpecies not found');
    return item;
  }

  async create(data: CreateTimberSpeciesDto) {
    return this.prisma.timberSpecies.create({ data });
  }

  async update(id: string, data: Partial<UpdateTimberSpeciesDto>) {
    await this.findOne(id);
    return this.prisma.timberSpecies.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.timberSpecies.update({
      where: { id },
      data: { isActive },
    });
  }
}
