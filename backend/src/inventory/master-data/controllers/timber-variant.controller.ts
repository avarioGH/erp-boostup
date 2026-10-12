import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory/master-data/timber-variant')
export class TimberVariantController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Request() req: any) {
    let targetCompanyId = req.user?.company_id || req.user?.companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }
    return this.prisma.timberVariant.findMany({
      where: targetCompanyId ? { company_id: targetCompanyId } : {},
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    let targetCompanyId = req.user?.company_id || req.user?.companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    let productId = data.productId;

    if (!productId) {
      let genericProduct = await this.prisma.product.findFirst({
        where: {
          name: 'SAWN TIMBER',
          ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
        },
      });
      if (!genericProduct) {
        // We need a default unit
        let defaultUnit = await this.prisma.unit.findFirst({
          where: targetCompanyId ? { company_id: targetCompanyId } : {},
        });
        if (!defaultUnit) {
          defaultUnit = await this.prisma.unit.create({
            data: { company_id: targetCompanyId as string, name: 'Pieces' },
          });
        }

        genericProduct = await this.prisma.product.create({
          data: {
            name: 'SAWN TIMBER',
            company_id: targetCompanyId as string,

            unit_id: defaultUnit.id,
            code: 'SAWN-TIMBER',
            barcode: `GENERIC-SAWN-${Date.now()}`,
            purchase_price: 0,
            selling_price: 0,
          },
        });
      }
      productId = genericProduct.id;
    }

    const species = String(data.species || 'UNKNOWN').trim().toUpperCase();
    const grade = String(data.grade || 'PENDING').trim().toUpperCase();
    const thickness = Math.round(Number(data.thickness || 0));
    const width = Math.round(Number(data.width || 0));
    const length = Math.round(Number(data.length || 0));

    const volume = (thickness * width * length) / 1000000000;

    // Auto-generate SKU if not provided
    const sku = (
      data.sku ||
      `${species}-${grade}-${thickness}x${width}x${length}`
    ).trim().toUpperCase();

    // Check if variant with SKU or exact specs already exists
    const existing = await this.prisma.timberVariant.findFirst({
      where: {
        OR: [
          { sku: sku },
          {
            species: species,
            grade: grade,
            thickness: thickness,
            width: width,
            length: length,
          },
        ],
        ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
      },
      include: { product: true },
    });

    if (existing) {
      return existing;
    }

    // Attempt to link speciesId
    let speciesId = data.speciesId;
    if (!speciesId && species) {
      const sp = await this.prisma.timberSpecies.findFirst({
        where: {
          OR: [
            { name: { equals: species, mode: 'insensitive' } },
            { code: { equals: species, mode: 'insensitive' } },
          ],
          ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
        },
      });
      if (sp) speciesId = sp.id;
    }

    // Attempt to link gradeId
    let gradeId = data.gradeId;
    if (!gradeId && grade) {
      const gr = await this.prisma.timberGrade.findFirst({
        where: {
          OR: [
            { code: { equals: grade, mode: 'insensitive' } },
            { name: { equals: grade, mode: 'insensitive' } },
          ],
          ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
        },
      });
      if (gr) gradeId = gr.id;
    }

    return this.prisma.timberVariant.create({
      data: {
        company_id: targetCompanyId as string,
        productId: productId,
        species: species,
        grade: grade,
        speciesId: speciesId || undefined,
        gradeId: gradeId || undefined,
        thickness: thickness,
        width: width,
        length: length,
        volumePerPiece: volume,
        sku: sku,
      },
      include: { product: true },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const updateData: any = {};
    if (data.species) updateData.species = String(data.species).trim().toUpperCase();
    if (data.grade) updateData.grade = String(data.grade).trim().toUpperCase();
    if (data.thickness !== undefined) updateData.thickness = Math.round(Number(data.thickness));
    if (data.width !== undefined) updateData.width = Math.round(Number(data.width));
    if (data.length !== undefined) updateData.length = Math.round(Number(data.length));
    if (data.sku) updateData.sku = String(data.sku).trim().toUpperCase();

    if (updateData.thickness !== undefined && updateData.width !== undefined && updateData.length !== undefined) {
      updateData.volumePerPiece = (updateData.thickness * updateData.width * updateData.length) / 1000000000;
    }

    return this.prisma.timberVariant.update({
      where: { id },
      data: updateData,
      include: { product: true },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.timberVariant.delete({ where: { id } });
  }
}
