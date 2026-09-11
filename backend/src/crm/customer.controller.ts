import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
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
  async getCustomers(@Request() req) {
    return this.prisma.customer.findMany({
      where: { company_id: req.user.company_id },
      orderBy: { created_at: 'desc' }
    });
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
