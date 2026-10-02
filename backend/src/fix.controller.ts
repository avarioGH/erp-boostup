import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("fix")
export class FixController {
  constructor(private prisma: PrismaService) {}

  @Get("make-owner")
  async makeOwner() {
    const user = await this.prisma.user.findFirst({ where: { username: "ikan" } });
    if (!user || !user.company_id) return { success: false, message: "User not found or no company" };

    let ownerRole = await this.prisma.role.findFirst({ where: { name: "Owner", company_id: user.company_id } });
    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: {
          name: "Owner",
          company_id: user.company_id
        }
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role_id: ownerRole.id }
    });

    const warehouses = await this.prisma.warehouse.findMany({ where: { company_id: user.company_id } });
    
    for (const w of warehouses) {
      await this.prisma.userWarehouseAccess.upsert({
        where: { user_id_warehouse_id: { user_id: user.id, warehouse_id: w.id } },
        update: {},
        create: { user_id: user.id, warehouse_id: w.id }
      });
    }

    return { success: true, message: "User ikan is now Owner and has all access", warehouses: warehouses.length };
  }
}

