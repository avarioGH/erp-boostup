import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/master-data.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Vehicle not found');
    return item;
  }

  async create(data: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data });
  }

  async update(id: string, data: Partial<UpdateVehicleDto>) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive },
    });
  }
}
