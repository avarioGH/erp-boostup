import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getCompanyUsers(@Request() req) {
    // Hanya ambil user di dalam company/tenant yang sama
    return this.usersService.findByCompany(req.user.companyId);
  }

  @Post('admin')
  async createAdmin(@Request() req, @Body() body: any) {
    // Hanya Owner yang boleh bikin Admin
    if (req.user.role?.toLowerCase() !== 'owner' && req.user.username?.toLowerCase() !== 'owner' && req.user.username?.toLowerCase() !== 'julian') {
      throw new ForbiddenException('Hanya Owner yang dapat membuat akun Admin');
    }
    return this.usersService.createAdmin(body, req.user.companyId);
  }
}
