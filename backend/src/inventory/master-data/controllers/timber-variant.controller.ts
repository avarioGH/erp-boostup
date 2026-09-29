import { Controller, Get, Post, Body, Put, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory/master-data/timber-variant')
export class TimberVariantController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.prisma.timberVariant.findMany({
      where: { company_id: req.user.companyId },
      include: { product: true }
    });
  }

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    let productId = data.productId;

    // If productId is not provided, create a generic "SAWN TIMBER" product if it doesn't exist
    if (!productId) {
      let genericProduct = await this.prisma.product.findFirst({
        where: { name: 'SAWN TIMBER', company_id: req.user.companyId }
      });
      if (!genericProduct) {
        genericProduct = await this.prisma.product.create({
          data: {
            name: 'SAWN TIMBER',
            company_id: req.user.companyId,
            type: 'GOODS',
            category: 'SAWN_TIMBER'
          }
        });
      }
      productId = genericProduct.id;
    }

    const volume = ((data.thickness || 0) * (data.width || 0) * (data.length || 0)) / 1000000000;
    
    // Auto-generate SKU if not provided
    const sku = data.sku || ${data.species || 'MIX'}--xx;

    return this.prisma.timberVariant.create({
      data: {
        company_id: req.user.companyId,
        productId: productId,
        species: data.species || 'UNKNOWN',
        grade: data.grade || 'PENDING',
        thickness: Number(data.thickness),
        width: Number(data.width),
        length: Number(data.length),
        volumePerPiece: volume,
        sku: sku,
      }
    });
  }
}
