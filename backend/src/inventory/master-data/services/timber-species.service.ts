import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTimberSpeciesDto,
  UpdateTimberSpeciesDto,
} from '../dto/master-data.dto';

@Injectable()
export class TimberSpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(company_id: string) {
    let list = await this.prisma.timberSpecies.findMany({ where: { company_id } });
    if (!list || list.length === 0) {
      // Seed default common Indonesian timber species so user immediately has species options
      const defaultSpecies = [
        { code: 'MRB', name: 'MERBAU', description: 'Kayu Merbau Papua / Maluku' },
        { code: 'MRT', name: 'MERANTI', description: 'Kayu Meranti Merah / Putih' },
        { code: 'BKR', name: 'BENGKIRAI', description: 'Kayu Bengkirai Kalimantan' },
        { code: 'ULN', name: 'ULIN', description: 'Kayu Ulin / Besi Kalimantan' },
        { code: 'KNR', name: 'KENARI', description: 'Kayu Kenari' },
        { code: 'JTI', name: 'JATI', description: 'Kayu Jati Jawa' },
        { code: 'KMP', name: 'KAMPAS', description: 'Kayu Kampas' },
        { code: 'KRW', name: 'KERUING', description: 'Kayu Keruing' },
        { code: 'SNK', name: 'SONOKELING', description: 'Kayu Sonokeling' },
        { code: 'MHG', name: 'MAHONI', description: 'Kayu Mahoni' },
        { code: 'LKL', name: 'LOKAL', description: 'Kayu Campuran Lokal' },
      ];

      for (const item of defaultSpecies) {
        await this.prisma.timberSpecies.create({
          data: {
            company_id,
            code: item.code,
            name: item.name,
            description: item.description,
            isActive: true,
          },
        }).catch(() => null);
      }

      list = await this.prisma.timberSpecies.findMany({ where: { company_id } });
    }
    return list;
  }

  async findOne(id: string, company_id: string) {
    const item = await this.prisma.timberSpecies.findUnique({
      where: { id, company_id },
    });
    if (!item) throw new NotFoundException('TimberSpecies not found');
    return item;
  }

  async create(data: CreateTimberSpeciesDto) {
    const code = (data.code || '').trim() || (data.name ? data.name.substring(0, 4).toUpperCase() + '-' + Math.floor(Math.random() * 1000) : 'SPC-' + Date.now());
    return this.prisma.timberSpecies.create({ data: { ...data, code } as any });
  }

  async update(id: string, data: any, company_id: string) {
    await this.findOne(id, company_id);
    return this.prisma.timberSpecies.update({
      where: { id, company_id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean, company_id: string) {
    await this.findOne(id, company_id);
    return this.prisma.timberSpecies.update({
      where: { id, company_id },
      data: { isActive },
    });
  }
}
