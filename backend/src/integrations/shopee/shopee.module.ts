import { Module } from '@nestjs/common';
import { ShopeeController } from './shopee.controller';
import { ShopeeService } from './shopee.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShopeeController],
  providers: [ShopeeService],
})
export class ShopeeModule {}
