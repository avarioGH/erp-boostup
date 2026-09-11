import { Module } from "@nestjs/common";
import { TimberSalesService } from "./timber-sales.service";
import { TimberSalesController } from "./timber-sales.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [TimberSalesController],
  providers: [TimberSalesService],
  exports: [TimberSalesService],
})
export class TimberSalesModule {}
