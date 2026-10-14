import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProcessingTypeService } from '../services/processing-type.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/permissions.guard';
import { Permissions } from '../../../auth/permissions.decorator';

@Controller('inventory/master-data/processing-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProcessingTypeController {
  constructor(private readonly service: ProcessingTypeService) {}

  @Get()
  @Permissions('inventory.view')
  findAll(@Request() req: any) {
    const companyId = req.user?.company_id || '000000000000000000000000';
    return this.service.findAll(companyId);
  }

  @Get(':id')
  @Permissions('inventory.view')
  findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.company_id || '000000000000000000000000';
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions('inventory.create')
  create(@Request() req: any, @Body() data: any) {
    const companyId = req.user?.company_id || '000000000000000000000000';
    return this.service.create(companyId, data);
  }

  @Put(':id')
  @Permissions('inventory.update')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const companyId = req.user?.company_id || '000000000000000000000000';
    return this.service.update(companyId, id, data);
  }

  @Delete(':id')
  @Permissions('inventory.delete')
  delete(@Request() req: any, @Param('id') id: string) {
    const companyId = req.user?.company_id || '000000000000000000000000';
    return this.service.delete(companyId, id);
  }
}
