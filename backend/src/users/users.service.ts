import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(data: any, creatorCompanyId: string) {
    const roleName = data.role_name || 'Admin';
    let targetRole = await this.prisma.role.findFirst({
      where: { name: roleName, company_id: creatorCompanyId },
    });

    if (!targetRole) {
      targetRole = await this.prisma.role.create({
        data: {
          name: roleName,
          company_id: creatorCompanyId,
          description: roleName === 'Kasir' ? 'Staff Kasir Operasional' : 'Administrator with elevated privileges',
        },
      });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Username atau Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          name: data.name,
          password: hashedPassword,
          company_id: creatorCompanyId,
          role_id: targetRole.id,
          status: true,
          accessible_modules: data.modules || [],
        },
      });

      if (data.warehouse_ids && Array.isArray(data.warehouse_ids)) {
        const accessData = data.warehouse_ids.map((wId: string) => ({
          user_id: newUser.id,
          warehouse_id: wId,
        }));
        await tx.userWarehouseAccess.createMany({
          data: accessData,
        });
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: { select: { name: true } },
          accessible_modules: true,
          warehouse_accesses: { select: { warehouse_id: true } },
          created_at: true,
        },
      });
    });
  }

  async updateUser(userId: string, data: any, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, company_id: companyId },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException('Pengguna tidak ditemukan.');
    }

    if (user.role?.name === 'Owner') {
      throw new BadRequestException('Akun Owner utama tidak dapat diubah dari menu ini.');
    }

    return this.prisma.$transaction(async (tx) => {
      let roleId = user.role_id;
      if (data.role_name && data.role_name !== user.role?.name) {
        let role = await tx.role.findFirst({
          where: { name: data.role_name, company_id: companyId },
        });
        if (!role) {
          role = await tx.role.create({
            data: {
              name: data.role_name,
              company_id: companyId,
              description: data.role_name === 'Kasir' ? 'Staff Kasir Operasional' : 'Administrator with elevated privileges',
            },
          });
        }
        roleId = role.id;
      }

      const updateData: any = {
        name: data.name ?? user.name,
        role_id: roleId,
        accessible_modules: data.modules ?? user.accessible_modules,
      };

      if (data.password && data.password.trim() !== '') {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (data.warehouse_ids && Array.isArray(data.warehouse_ids)) {
        await tx.userWarehouseAccess.deleteMany({
          where: { user_id: userId },
        });

        const accessData = data.warehouse_ids.map((wId: string) => ({
          user_id: userId,
          warehouse_id: wId,
        }));
        await tx.userWarehouseAccess.createMany({
          data: accessData,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: { select: { name: true } },
          accessible_modules: true,
          warehouse_accesses: {
            select: {
              warehouse: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
    });
  }

  async deleteUser(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, company_id: companyId },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException('Pengguna tidak ditemukan.');
    }

    if (user.role?.name === 'Owner') {
      throw new BadRequestException('Akun Owner utama tidak dapat dihapus.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.userWarehouseAccess.deleteMany({
        where: { user_id: userId },
      });
      return tx.user.delete({
        where: { id: userId },
      });
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        status: true,
        accessible_modules: true,
        role: { select: { name: true } },
        warehouse_accesses: {
          select: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
