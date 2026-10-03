import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance/payments')
export class PaymentController {
  constructor(private service: PaymentService) {}

  @Permissions('payment.create')
  @Post()
  create(@Request() req, @Body() data: any) {
    return this.service.create(
      req.user.company_id || req.user.companyId,
      data,
      req.user.id || req.user.userId,
    );
  }

  @Permissions('payment.view')
  @Get()
  async findAll(@Request() req, @Query('type') type?: string) {
    const data = await this.service.findAll(
      req.user.company_id || req.user.companyId,
    );
    return { data };
  }

  @Permissions('payment.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.company_id || req.user.companyId, id);
  }
}
