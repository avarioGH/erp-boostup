import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly prisma: PrismaService) {}

  @Permissions('crm.customer.view')
  @Get()
  async getCustomers(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { company_id: req.user.company_id };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  @Permissions('crm.customer.create')
  @Post()
  async createCustomer(@Request() req, @Body() data: any) {
    return this.prisma.customer.create({
      data: {
        company_id: req.user.company_id,
        code: data.code || `CUST-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address
      }
    });
  }
}
