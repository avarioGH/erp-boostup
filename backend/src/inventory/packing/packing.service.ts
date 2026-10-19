import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    let {
      packingNumber,
      packingDate,
      partaiId,
      ownerName,
      species,
      containerNo,
      warehouseId,
      notes,
      items = [],
    } = data;

    if (!packingNumber) {
      const count = await this.prisma.timberPacking.count({
        where: targetCompanyId ? { company_id: targetCompanyId } : {},
      });
      packingNumber = `PKG-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }

    const existingPkg = await this.prisma.timberPacking.findUnique({
      where: { packingNumber },
    });
    if (existingPkg) {
      packingNumber = `${packingNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // Hitung total M3 Real dan Customer
    let totalRealPcs = 0;
    let totalRealVolume = 0;
    let totalCustPcs = 0;
    let totalCustVolume = 0;

    const palletsSet = new Set<string>();

    const processedItems = items.map((it: any) => {
      const rT = Number(it.realT) || 0;
      const rL = Number(it.realL) || 0;
      const rP = Number(it.realP) || 0;
      const rPcs = Number(it.realPcs) || 0;
      const rM3 = (rT * rL * rP * rPcs) / 1000000;

      const cT = it.custT !== undefined && it.custT !== '' ? Number(it.custT) : rT;
      const cL = it.custL !== undefined && it.custL !== '' ? Number(it.custL) : rL;
      const cP = it.custP !== undefined && it.custP !== '' ? Number(it.custP) : rP;
      const cPcs = it.custPcs !== undefined && it.custPcs !== '' ? Number(it.custPcs) : rPcs;
      const cM3 = (cT * cL * cP * cPcs) / 1000000;

      if (it.palletNo) palletsSet.add(it.palletNo);

      totalRealPcs += rPcs;
      totalRealVolume += rM3;
      totalCustPcs += cPcs;
      totalCustVolume += cM3;

      return {
        palletNo: it.palletNo ? String(it.palletNo).trim() : null,
        realT: rT,
        realL: rL,
        realP: rP,
        realPcs: rPcs,
        realM3: Number(rM3.toFixed(4)),
        custT: cT,
        custL: cL,
        custP: cP,
        custPcs: cPcs,
        custM3: Number(cM3.toFixed(4)),
        notes: it.notes || null,
      };
    });

    return this.prisma.timberPacking.create({
      data: {
        company_id: targetCompanyId as string,
        partaiId: partaiId || undefined,
        packingNumber,
        packingDate: packingDate ? new Date(packingDate) : new Date(),
        ownerName: ownerName || 'PT Daun Emas Multi Perkasa',
        species: species || 'MERBAU',
        containerNo: containerNo || null,
        palletCount: palletsSet.size || 1,
        warehouseId: warehouseId || undefined,
        notes: notes || null,
        totalRealPcs,
        totalRealVolume: Number(totalRealVolume.toFixed(4)),
        totalCustPcs,
        totalCustVolume: Number(totalCustVolume.toFixed(4)),
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
        warehouse: true,
        partai: true,
      },
    });
  }

  async findAll(companyId?: string, partaiId?: string) {
    const where: any = {};
    if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      where.company_id = companyId;
    }
    if (partaiId) {
      where.partaiId = partaiId;
    }

    return this.prisma.timberPacking.findMany({
      where,
      include: {
        items: true,
        warehouse: true,
        partai: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const packing = await this.prisma.timberPacking.findUnique({
      where: { id },
      include: {
        items: true,
        warehouse: true,
        partai: true,
      },
    });
    if (!packing) throw new NotFoundException('Data Packing tidak ditemukan');
    return packing;
  }

  async delete(id: string) {
    const packing = await this.prisma.timberPacking.findUnique({ where: { id } });
    if (!packing) throw new NotFoundException('Data Packing tidak ditemukan');
    return this.prisma.timberPacking.delete({ where: { id } });
  }
}
