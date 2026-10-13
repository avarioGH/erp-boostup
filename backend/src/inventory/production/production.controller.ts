import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';

@Controller('inventory/production')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  @Permissions('production:read')
  async getProcesses(@Query() query: any, @Request() req: any) {
    const user = req.user;
    return this.productionService.getProcesses({
      ...query,
      companyId: user.company_id,
    });
  }

  @Get(':id')
  @Permissions('production:read')
  async getProcess(@Param('id') id: string) {
    return this.productionService.getProcess(id);
  }

  @Post()
  @Permissions('production:create')
  async createProcess(@Body() data: any, @Request() req: any) {
    const user = req.user;
    return this.productionService.createProcess({
      ...data,
      company_id: user.company_id,
      createdBy: user.id,
    });
  }

  @Put(':id/confirm')
  @Permissions('production:confirm')
  async confirmProcess(@Param('id') id: string) {
    return this.productionService.confirmProcess(id);
  }

  @Put(':id/cancel')
  @Permissions('production:cancel')
  async cancelProcess(@Param('id') id: string) {
    return this.productionService.cancelProcess(id);
  }

  @Delete(':id')
  @Permissions('production:delete')
  async deleteProcess(@Param('id') id: string) {
    return this.productionService.deleteProcess(id);
  }
}
