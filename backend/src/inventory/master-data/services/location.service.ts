import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from '../dto/master-data.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.location.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Location not found');
    return item;
  }

  async create(data: CreateLocationDto) {
    return this.prisma.location.create({ data });
  }

  async update(id: string, data: Partial<UpdateLocationDto>) {
    await this.findOne(id);
    return this.prisma.location.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.location.update({
      where: { id },
      data: { isActive },
    });
  }
}
