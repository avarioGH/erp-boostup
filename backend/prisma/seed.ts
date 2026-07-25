import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Default Company
  let company = await prisma.company.findFirst({ where: { name: 'Avario Coffee Co.' } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Avario Coffee Co.',
        address: 'Jl. Jenderal Sudirman No. 1, Jakarta',
        phone: '021-555-0199',
        email: 'contact@avario.com',
        tax_number: '01.234.567.8-999.000',
      },
    });
  }

  // 2. Create Owner User
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const ownerRole = await prisma.role.upsert({
    where: { company_id_name: { company_id: company.id, name: 'Owner' } },
    update: {},
    create: {
      company_id: company.id,
      name: 'Owner',
    }
  });

  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      company_id: company.id,
      email: 'owner@avario.com',
      username: 'owner',
      password: hashedPassword,
      name: 'Avario Owner',
      role_id: ownerRole.id,
      status: true,
    },
  });

  // 3. Create Warehouses
  const whA = await prisma.warehouse.upsert({
    where: { company_id_code: { company_id: company.id, code: 'WH-A' } },
    update: {},
    create: {
      company_id: company.id,
      name: 'Gudang Pusat (A)',
      code: 'WH-A',
      address: 'Kawasan Industri Pulogadung',
    }
  });

  const whB = await prisma.warehouse.upsert({
    where: { company_id_code: { company_id: company.id, code: 'WH-B' } },
    update: {},
    create: {
      company_id: company.id,
      name: 'Gudang Cabang (B)',
      code: 'WH-B',
      address: 'Bandung Raya',
    }
  });

  const whC = await prisma.warehouse.upsert({
    where: { company_id_code: { company_id: company.id, code: 'WH-C' } },
    update: {},
    create: {
      company_id: company.id,
      name: 'Gudang Retail (C)',
      code: 'WH-C',
      address: 'Mall Kelapa Gading',
    }
  });

  // 4. Create Category & Unit
  let catCoffee = await prisma.category.findFirst({ where: { company_id: company.id, name: 'Biji Kopi' } });
  if (!catCoffee) {
    catCoffee = await prisma.category.create({ data: { company_id: company.id, name: 'Biji Kopi' } });
  }

  let unitPcs = await prisma.unit.findFirst({ where: { company_id: company.id, name: 'Pcs' } });
  if (!unitPcs) {
    unitPcs = await prisma.unit.create({ data: { company_id: company.id, name: 'Pcs' } });
  }

  // 5. Create Products & Stocks
  const productsData = [
    { code: 'KOP-001', name: 'Kopi Arabica Premium 1Kg', price: 120000, stockA: 120, stockB: 53, stockC: 80 },
    { code: 'KOP-002', name: 'Biji Kopi Robusta 1Kg', price: 90000, stockA: 12, stockB: 45, stockC: 30 },
    { code: 'SYR-001', name: 'Sirup Caramel Monin 700ml', price: 185000, stockA: 24, stockB: 15, stockC: 40 },
    { code: 'PKG-001', name: 'Gelas Kertas 8oz', price: 1500, stockA: 3500, stockB: 1200, stockC: 5000 },
  ];

  for (const pd of productsData) {
    const prod = await prisma.product.upsert({
      where: { company_id_code: { company_id: company.id, code: pd.code } },
      update: {},
      create: {
        company_id: company.id,
        code: pd.code,
        name: pd.name,
        category_id: catCoffee.id,
        unit_id: unitPcs.id,
        selling_price: pd.price,
        purchase_price: pd.price * 0.6,
      }
    });

    // Seed Stocks for A, B, C
    await prisma.warehouseStock.upsert({
      where: { company_id_warehouse_id_product_id: { company_id: company.id, warehouse_id: whA.id, product_id: prod.id } },
      update: { current_stock: pd.stockA },
      create: { company_id: company.id, warehouse_id: whA.id, product_id: prod.id, current_stock: pd.stockA }
    });
    await prisma.warehouseStock.upsert({
      where: { company_id_warehouse_id_product_id: { company_id: company.id, warehouse_id: whB.id, product_id: prod.id } },
      update: { current_stock: pd.stockB },
      create: { company_id: company.id, warehouse_id: whB.id, product_id: prod.id, current_stock: pd.stockB }
    });
    await prisma.warehouseStock.upsert({
      where: { company_id_warehouse_id_product_id: { company_id: company.id, warehouse_id: whC.id, product_id: prod.id } },
      update: { current_stock: pd.stockC },
      create: { company_id: company.id, warehouse_id: whC.id, product_id: prod.id, current_stock: pd.stockC }
    });
  }

  // 6. Create Cash Account
  let cashAccount = await prisma.cashAccount.findFirst({ where: { company_id: company.id, code: '111-001' } });
  if (!cashAccount) {
    cashAccount = await prisma.cashAccount.create({
      data: {
        company_id: company.id,
        code: '111-001',
        name: 'Kas Utama (BCA)',
        account_type: 'Bank',
        current_balance: 185000000,
      }
    });
  }

  // 7. Create Finance Categories
  const categoriesData = [
    { name: 'Pendapatan Penjualan', type: 'Income', color: '#10B981', icon: 'ShoppingCart' },
    { name: 'Pendapatan Lainnya', type: 'Income', color: '#3B82F6', icon: 'TrendingUp' },
    { name: 'Biaya Gaji Karyawan', type: 'Expense', color: '#EF4444', icon: 'Users' },
    { name: 'Biaya Operasional (Listrik, Air, Internet)', type: 'Expense', color: '#F59E0B', icon: 'Zap' },
    { name: 'Biaya Marketing', type: 'Expense', color: '#8B5CF6', icon: 'Megaphone' },
    { name: 'Pajak & Retribusi', type: 'Expense', color: '#6366F1', icon: 'FileText' },
    { name: 'Transfer Kas/Bank', type: 'Transfer', color: '#6B7280', icon: 'Repeat' }
  ];

  for (const cat of categoriesData) {
    const exists = await prisma.financeCategory.findFirst({ where: { company_id: company.id, name: cat.name }});
    if (!exists) {
      await prisma.financeCategory.create({
        data: {
          company_id: company.id,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
        }
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
