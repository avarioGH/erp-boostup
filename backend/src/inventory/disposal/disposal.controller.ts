import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DisposalService } from './disposal.service';
import { CreateDisposalDto } from './disposal.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('inventory/disposals')
@UseGuards(JwtAuthGuard)
export class DisposalController {
  constructor(private readonly disposalService: DisposalService) {}

  @Get()
  async list(@Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.list(companyId);
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.detail(id, companyId);
  }

  @Post()
  async create(@Body() dto: CreateDisposalDto, @Request() req: any) {
    dto.companyId = req.user.company_id || req.user.companyId;
    dto.reason = dto.reason || dto.notes || "Pemusnahan (Disposal)";
    const userId = req.user.id || req.user.userId;
    return this.disposalService.create(dto, userId);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.submit(id, companyId);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    const userId = req.user.id || req.user.userId;
    return this.disposalService.approve(id, companyId, userId);
  }

  @Post(':id/reverse')
  async reverse(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    const userId = req.user.id || req.user.userId;
    return this.disposalService.reverse(id, companyId, userId);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    const companyId = req.user.company_id || req.user.companyId;
    const userId = req.user.id || req.user.userId;
    return this.disposalService.reject(
      id,
      companyId,
      userId,
      notes,
    );
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.cancel(id, companyId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDisposalDto>,
    @Request() req: any,
  ) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.update(id, dto, companyId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id || req.user.companyId;
    return this.disposalService.delete(id, companyId);
  }
}
