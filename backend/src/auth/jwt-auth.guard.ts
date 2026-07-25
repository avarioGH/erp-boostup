import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (e) {
      // DEV/MVP MODE: Bypass Auth and inject the seeded user
      const req = context.switchToHttp().getRequest();
      const user = await this.prisma.user.findFirst();
      if (user) {
        req.user = { 
          id: user.id, 
          userId: user.id, 
          company_id: user.company_id, 
          companyId: user.company_id 
        };
        return true;
      }
      throw new UnauthorizedException('Anda belum login');
    }
  }
}
