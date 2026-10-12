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

    const volume =
      ((data.thickness || 0) * (data.width || 0) * (data.length || 0)) /
      1000000000;

    // Auto-generate SKU if not provided
    const sku =
      data.sku ||
      `${data.species || 'MIX'}-${data.grade || 'PENDING'}-${data.thickness || 0}x${data.width || 0}x${data.length || 0}`;

    return this.prisma.timberVariant.create({
      data: {
        company_id: targetCompanyId as string,
        productId: productId,
        species: data.species || 'UNKNOWN',
        grade: data.grade || 'PENDING',
        thickness: Number(data.thickness || 0),
        width: Number(data.width || 0),
        length: Number(data.length || 0),
        volumePerPiece: volume,
        sku: sku,
      },
    });
  }
}
