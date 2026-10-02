import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales/orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService) {}

  @Permissions('quotation.view')
  @Get()
  async findAll(@Request() req) { 
    const compId = req.user.company_id || req.user.companyId;
    const data = await this.prisma.salesOrder.findMany({ 
      where: { company_id: compId }, 
      include: { 
        customer: true,
        allocations: true 
      }, 
      orderBy: { order_date: 'desc'} 
    });
    return { data }; 
  }

  @Permissions('quotation.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { 
    const compId = req.user.company_id || req.user.companyId;
    return this.prisma.salesOrder.findUnique({ 
      where: { id, company_id: compId }, 
      include: { 
        items: { include: { product: true } }, 
        customer: true, 
        allocations: {
          include: { payment: true }
        }
      } 
    }); 
  }
}

