import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto } from '../dto/master-data.dto';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.driver.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.driver.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Driver not found');
    return item;
  }

  async create(data: CreateDriverDto) {
    return this.prisma.driver.create({ data });
  }

  async update(id: string, data: Partial<UpdateDriverDto>) {
    await this.findOne(id);
    return this.prisma.driver.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.driver.update({
      where: { id },
      data: { isActive },
    });
  }
}
