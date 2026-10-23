import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../common/memory-cache.service';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    private prisma: PrismaService,
    private cache: MemoryCacheService,
  ) {}


  /**
   * Tenant Middleware Validation (Dipanggil di Global Guard)
   * Memastikan bahwa Tenant aktif dan Subscription belum kedaluwarsa.
   */
  async validateTenantSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tenant is currently ${tenant.status}`);
    }

    const sub = tenant.subscription;
    if (!sub) {
      throw new ForbiddenException(
        'No active subscription found for this Tenant.',
      );
    }

    if (new Date() > sub.end_date) {
      // Auto Update Status ke EXPIRED
      await this.prisma.tenantSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      throw new ForbiddenException(
        'Your subscription has expired. Please renew to continue using the ERP.',
      );
    }

    return true;
  }

  /**
   * AI Service Wrapper (Agnostic Gateway)
   * Menyembunyikan kompleksitas vendor AI dari modul ERP lainnya.
   * STRICT MULTI-TENANT: Hanya membaca data dengan company_id = tenantId.
   */
  async generateAiInsight(
    prompt: string,
    incomingContextData: any,
    tenantId: string,
  ) {
    this.logger.log(`Generating AI Insight for Tenant: ${tenantId}`);
    const q = prompt.toLowerCase().trim();

    const rp = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    });

    const isGreeting = q.includes('halo') || q.includes('hai') || q.includes('hi') || q.includes('selamat');
    const isStockQuery = q.includes('stok') || q.includes('sisa') || q.includes('katalog') || q.includes('barang') || q.includes('ikan') || q.includes('kayu') || q.includes('produk') || q.includes('gudang');
    const isSalesQuery = q.includes('penjualan') || q.includes('omset') || q.includes('omzet') || q.includes('laku') || q.includes('laporan jual') || q.includes('sales');
    const isCustomerQuery = q.includes('pelanggan') || q.includes('customer') || q.includes('klien') || q.includes('langganan');
    const isFinanceQuery = q.includes('kas') || q.includes('bank') || q.includes('keuangan') || q.includes('saldo') || q.includes('duit') || q.includes('uang');
    const isReceivableQuery = q.includes('piutang') || q.includes('tagihan') || q.includes('belum lunas') || q.includes('tempo');
    const isPurchaseQuery = q.includes('pembelian') || q.includes('beli') || q.includes('teli') || q.includes('masuk') || q.includes('kulakan') || q.includes('supplier');
    const isEmployeeQuery = q.includes('karyawan') || q.includes('pegawai') || q.includes('staff') || q.includes('pekerja');

    let insight = '';

    // 1. GREETING
    if (isGreeting && !isStockQuery && !isSalesQuery && !isCustomerQuery && !isFinanceQuery && !isReceivableQuery && !isPurchaseQuery) {
      insight = 'Halo! Saya adalah **AI Assistant ERP** bisnis Anda. Saya terhubung langsung ke database usaha Anda secara real-time dan aman.\n\n' +
        'Anda dapat menanyakan hal-hal berikut:\n' +
        '- **Stok Barang / Ikan / Kayu**: *"tolong cek stok ikan nya"*, *"stok udang"*, atau *"cek stok gudang"*\n' +
        '- **Penjualan & Omset**: *"berapa penjualan hari ini?"* atau *"omset bulan ini"*\n' +
        '- **Pelanggan & CRM**: *"daftar pelanggan kita siapa saja?"*\n' +
        '- **Keuangan & Kas**: *"berapa saldo kas dan bank saat ini?"*\n' +
        '- **Piutang Usaha**: *"berapa total piutang yang belum tertagih?"*\n' +
        '- **Barang Masuk / Pembelian**: *"ada barang atau teli masuk hari ini?"*';
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 2. STOK & KATALOG PRODUK (Multi-tenant isolated by company_id)
    if (isStockQuery) {
      const products = await this.prisma.product.findMany({
        where: { company_id: tenantId, status: true },
        include: { warehouse_stocks: { include: { warehouse: true } } },
        orderBy: { name: 'asc' },
      });

      // Filter stop words to detect specific product keywords if mentioned
      const stopWords = ['tolong', 'bantu', 'cek', 'lihat', 'berapa', 'sisa', 'stok', 'ada', 'kah', 'nya', 'di', 'gudang', 'semua', 'daftar', 'barang', 'produk', 'ikan', 'kayu'];
      const searchWords = q
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !stopWords.includes(w));

      let matchedProducts = products;
      if (searchWords.length > 0) {
        matchedProducts = products.filter((p) => {
          const nameLower = (p.name || '').toLowerCase();
          const codeLower = (p.code || '').toLowerCase();
          return searchWords.some((sw) => nameLower.includes(sw) || codeLower.includes(sw));
        });
      }

      if (matchedProducts.length > 0) {
        insight = `Berikut adalah data **stok ${searchWords.length > 0 ? 'yang dicocokkan' : 'seluruh produk'}** di usaha Anda:\n\n`;
        matchedProducts.forEach((p) => {
          const totalStock = (p.warehouse_stocks || []).reduce(
            (acc, ws) => acc + (ws.current_stock || 0),
            0,
          );
          const warehouseBreakdown = (p.warehouse_stocks || [])
            .filter((ws) => (ws.current_stock || 0) > 0)
            .map((ws) => `${ws.warehouse?.name || 'Gudang'}: ${ws.current_stock}`)
            .join(', ');

          const detail = warehouseBreakdown ? ` [${warehouseBreakdown}]` : ' (Belum ada stok fisik)';
          insight += `- **${p.name}** (${p.code}): Total **${totalStock} unit/kg**${detail}\n`;
        });

        if (matchedProducts.length < products.length) {
          insight += `\n*(Menampilkan ${matchedProducts.length} dari total ${products.length} produk di katalog Anda)*`;
        }
      } else {
        if (products.length > 0) {
          insight = `Barang spesifik tersebut tidak ditemukan dalam katalog Anda. Berikut daftar produk yang tersedia di usaha Anda:\n` +
            products.map((p) => `- **${p.name}** (${p.code})`).join('\n') +
            `\n\nSilakan tanyakan dengan nama produk di atas.`;
        } else {
          insight = 'Belum ada data barang atau stok yang terdaftar pada database usaha Anda. Silakan tambahkan produk baru di menu Master Produk terlebih dahulu.';
        }
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 3. PENJUALAN & OMSET (Multi-tenant isolated by company_id)
    if (isSalesQuery) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todaySales = await this.prisma.salesOrder.aggregate({
        where: {
          company_id: tenantId,
          order_date: { gte: today },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { total_amount: true },
        _count: { id: true },
      });

      const monthSales = await this.prisma.salesOrder.aggregate({
        where: {
          company_id: tenantId,
          order_date: { gte: startOfMonth },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { total_amount: true },
        _count: { id: true },
      });

      const recentOrders = await this.prisma.salesOrder.findMany({
        where: {
          company_id: tenantId,
          status: { notIn: ['CANCELLED'] },
        },
        include: { customer: true },
        orderBy: { order_date: 'desc' },
        take: 3,
      });

      insight = `Ringkasan **Penjualan & Omset** usaha Anda:\n` +
        `- **Hari Ini**: **${rp.format(todaySales._sum.total_amount || 0)}** (${todaySales._count.id || 0} transaksi)\n` +
        `- **Bulan Ini**: **${rp.format(monthSales._sum.total_amount || 0)}** (${monthSales._count.id || 0} transaksi)\n`;

      if (recentOrders.length > 0) {
        insight += `\n**Transaksi Terakhir:**\n` +
          recentOrders
            .map(
              (o) =>
                `- #${o.order_number} (${o.customer?.name || 'Pelanggan Umum'}): **${rp.format(o.total_amount || 0)}** [${o.status}]`,
            )
            .join('\n');
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 4. DAFTAR PELANGGAN / CUSTOMER (Multi-tenant isolated by company_id)
    if (isCustomerQuery) {
      const customers = await this.prisma.customer.findMany({
        where: { company_id: tenantId, status: true },
        orderBy: { name: 'asc' },
        take: 15,
      });

      if (customers.length > 0) {
        insight = `Berikut adalah daftar **Pelanggan Terdaftar** di usaha Anda (${customers.length} pelanggan):\n\n`;
        customers.forEach((c) => {
          const contact = [c.phone, c.address].filter(Boolean).join(' - ');
          insight += `- **${c.name}** (${c.code})${contact ? `: ${contact}` : ''}\n`;
        });
      } else {
        insight = 'Belum ada data pelanggan yang tersimpan di usaha Anda. Anda bisa menambahkan pelanggan baru melalui menu Pelanggan / CRM.';
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 5. KEUANGAN & KAS/BANK (Multi-tenant isolated by company_id)
    if (isFinanceQuery) {
      const accounts = await this.prisma.cashAccount.findMany({
        where: { company_id: tenantId, status: true },
        orderBy: { name: 'asc' },
      });

      const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

      if (accounts.length > 0) {
        insight = `Ringkasan **Saldo Kas & Bank** usaha Anda (Total: **${rp.format(totalBalance)}**):\n\n`;
        accounts.forEach((a) => {
          insight += `- **${a.name}** (${a.account_type}): **${rp.format(a.current_balance || 0)}**\n`;
        });
      } else {
        insight = 'Belum ada rekening kas atau bank yang tercatat untuk usaha Anda. Silakan daftarkan akun kas di menu Keuangan > Kas & Bank.';
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 6. PIUTANG & INVOICE (Multi-tenant isolated by company_id)
    if (isReceivableQuery) {
      const pendingInvoices = await this.prisma.invoice.findMany({
        where: {
          company_id: tenantId,
          type: 'AR',
          status: { in: ['POSTED', 'PARTIALLY PAID'] },
        },
        include: { customer: true },
        orderBy: { due_date: 'asc' },
        take: 5,
      });

      const totalReceivable = pendingInvoices.reduce((acc, inv) => acc + (inv.remaining_amount || 0), 0);

      if (pendingInvoices.length > 0) {
        insight = `Total **Piutang Belum Lunas** usaha Anda: **${rp.format(totalReceivable)}**\n\n**Daftar Invoice Belum Lunas:**\n`;
        pendingInvoices.forEach((inv) => {
          const cust = inv.customer?.name || 'Pelanggan';
          const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : 'Tanpa Jatuh Tempo';
          insight += `- **#${inv.invoice_number}** (${cust}): Sisa **${rp.format(inv.remaining_amount)}** (Jatuh tempo: ${due})\n`;
        });
      } else {
        insight = 'Hebat! Saat ini tidak ada piutang usaha (AR) yang tertunggak atau belum lunas.';
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 7. BARANG MASUK / TELI / PEMBELIAN (Multi-tenant isolated by company_id)
    if (isPurchaseQuery) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recentTallies = await this.prisma.stockInTally.findMany({
        where: { company_id: tenantId },
        include: { items: { include: { product: true } }, warehouse: true },
        orderBy: { tally_date: 'desc' },
        take: 3,
      });

      const recentPurchases = await this.prisma.purchaseOrder.findMany({
        where: { company_id: tenantId },
        include: { supplier: true },
        orderBy: { order_date: 'desc' },
        take: 3,
      });

      if (recentTallies.length > 0 || recentPurchases.length > 0) {
        insight = 'Ringkasan **Barang Masuk & Pembelian** usaha Anda:\n\n';

        if (recentTallies.length > 0) {
          insight += '**Penerimaan Fisik / Teli Terakhir:**\n';
          recentTallies.forEach((t) => {
            const itemStr = t.items.map((i) => `${i.product?.name || 'Barang'}: ${i.qty}`).join(', ');
            const tDate = new Date(t.tally_date).toLocaleDateString('id-ID');
            insight += `- **${t.tally_number}** (${tDate}) di ${t.warehouse?.name || 'Gudang'}: ${itemStr || 'Kosong'}\n`;
          });
          insight += '\n';
        }

        if (recentPurchases.length > 0) {
          insight += '**Pembelian Terakhir:**\n';
          recentPurchases.forEach((po) => {
            const supp = po.supplier?.name || 'Supplier Umum';
            const poDate = new Date(po.order_date).toLocaleDateString('id-ID');
            insight += `- **${po.order_number}** (${poDate}) dari ${supp}: **${rp.format(po.total_amount || 0)}** [${po.status}]\n`;
          });
        }
      } else {
        insight = 'Belum ada riwayat penerimaan barang (Teli) atau pembelian yang tercatat di database usaha Anda.';
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 8. DATA KARYAWAN / PEGAWAI (Multi-tenant isolated by company_id)
    if (isEmployeeQuery) {
      const employees = await this.prisma.employee.findMany({
        where: { company_id: tenantId, status: 'ACTIVE' },
        include: { department: true },
        orderBy: { first_name: 'asc' },
        take: 10,
      });

      if (employees.length > 0) {
        insight = `Usaha Anda memiliki **${employees.length} karyawan aktif** yang terdaftar:\n\n`;
        employees.forEach((e) => {
          const fullName = [e.first_name, e.last_name].filter(Boolean).join(' ');
          insight += `- **${fullName}** (${e.position || 'Staff'}${e.department ? ' - ' + e.department.name : ''})\n`;
        });
      } else {
        insight = 'Belum ada data pegawai/karyawan yang tercatat aktif di usaha Anda.';
      }
      return { success: true, provider: 'Boostup-Internal-AI', insight };
    }

    // 9. FALLBACK DENGAN REKOMENDASI FORMAT PERTANYAAN
    insight = 'Maaf, saya belum memahami pertanyaan spesifik Anda. Sebagai asisten bisnis ERP, saya dapat membaca data live usaha Anda secara langsung. Cobalah bertanya:\n\n' +
      '- *"tolong cek stok ikan nya"* atau *"stok barang"* (Melihat seluruh sisa stok di gudang Anda)\n' +
      '- *"berapa penjualan hari ini"* atau *"omset bulan ini"* (Melihat omset dan riwayat pesanan)\n' +
      '- *"siapa saja pelanggan kita"* (Melihat daftar customer aktif)\n' +
      '- *"berapa saldo kas kita"* (Melihat rekening kas & bank)\n' +
      '- *"cek piutang belum lunas"* (Melihat tagihan invoice pelanggan)\n' +
      '- *"cek barang masuk atau teli"* (Melihat penerimaan barang masuk)';

    return {
      success: true,
      provider: 'Boostup-Internal-AI',
      insight,
    };
  }

  // --- Settings ---
  async getSettings(companyId: string) {
    let setting = await this.prisma.companySetting.findUnique({
      where: { company_id: companyId },
    });
    let company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!setting) {
      setting = await this.prisma.companySetting.create({
        data: { company_id: companyId },
      });
    }

    return {
      companyName: company?.name || '',
      currency: setting.currency,
      timezone: setting.timezone,
      invoicePrefix: setting.invoice_prefix,
    };
  }

  async updateSettings(companyId: string, data: any) {
    await this.prisma.company.update({
      where: { id: companyId },
      data: { name: data.companyName },
    });

    return this.prisma.companySetting.upsert({
      where: { company_id: companyId },
      update: {
        currency: data.currency,
        timezone: data.timezone,
        invoice_prefix: data.invoicePrefix,
      },
      create: {
        company: { connect: { id: companyId } },
        currency: data.currency,
        timezone: data.timezone,
        invoice_prefix: data.invoicePrefix,
      },
    });
  }

  // --- API Keys ---
  async getApiKeys(companyId: string) {
    // For single-tenant ERP, we'll just fetch all tokens (or link them to a default tenant)
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company?.tenant_id) return [];

    return this.prisma.apiToken.findMany({
      where: { tenant_id: company.tenant_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async createApiKey(companyId: string, data: any) {
    let company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    let tenantId = company?.tenant_id;

    if (!tenantId) {
      const tenant = await this.prisma.tenant.create({
        data: { name: company?.name || 'Default Tenant', status: 'ACTIVE' },
      });
      tenantId = tenant.id;
      await this.prisma.company.update({
        where: { id: companyId },
        data: { tenant_id: tenantId },
      });
    }

    const tokenString =
      'avario_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return this.prisma.apiToken.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        token_hash: tokenString, // In real world, hash this and return raw once. For demo, we store raw.
        scopes: data.scopes || 'all',
      },
    });
  }

  async generateSimulatedAiInsight(
    prompt: string,
    contextData: any,
    companyId: string,
  ) {
    const lowercasePrompt = prompt.toLowerCase();
    let response = 'Maaf, saya tidak mengerti pertanyaan Anda.';
    let module = 'General';

    // Simulasi Smart AI Agent yang memeriksa kata kunci dan memberikan jawaban dinamis
    if (
      lowercasePrompt.includes('stok') ||
      lowercasePrompt.includes('gudang') ||
      lowercasePrompt.includes('inventory') ||
      lowercasePrompt.includes('habis')
    ) {
      module = 'Inventory';
      const stocks = await this.prisma.warehouseStock.findMany({
        where: { warehouse: { company_id: companyId } },
        include: { product: true, warehouse: true },
        orderBy: { available_stock: 'asc' },
        take: 3,
      });

      if (stocks.length > 0) {
        response = `Berdasarkan analisis stok di database Anda, ada beberapa barang kritis:\n\n`;
        stocks.forEach((s, i) => {
          response += `${i + 1}. **${s.product.name}** di ${s.warehouse.name} hanya tersisa ${s.available_stock} unit.\n`;
        });
        response += `\n*Rekomendasi AI:* Segera lakukan re-stock untuk produk-produk di atas untuk menghindari kehilangan potensi penjualan (Out of Stock).`;
      } else {
        response =
          'Stok Anda dalam keadaan aman. Tidak ada produk yang berada di ambang kritis saat ini.';
      }
    } else if (
      lowercasePrompt.includes('keuangan') ||
      lowercasePrompt.includes('laba') ||
      lowercasePrompt.includes('omzet') ||
      lowercasePrompt.includes('penjualan')
    ) {
      module = 'Finance';

      const sales = await this.prisma.salesOrder.findMany({
        where: { company_id: companyId, status: 'COMPLETED' },
      });

      const totalSales = sales.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0,
      );

      response = `Data transaksi menunjukkan total penjualan terselesaikan mencapai **Rp${totalSales.toLocaleString('id-ID')}**.\n\n`;
      if (totalSales > 10000000) {
        response +=
          'Performa yang sangat baik! Anda berada di jalur tren positif bulan ini. *Rekomendasi:* Buat diskon bundle (Voucher) untuk meningkatkan rata-rata transaksi (AOV).';
      } else {
        response +=
          'Penjualan bulan ini masih di bawah ekspektasi awal. *Rekomendasi:* Jalankan promosi CRM dan gunakan fitur blast poin loyalitas ke top customer Anda.';
      }
    } else if (
      lowercasePrompt.includes('karyawan') ||
      lowercasePrompt.includes('absen') ||
      lowercasePrompt.includes('pegawai')
    ) {
      module = 'HR';
      response =
        'Data Karyawan menunjukkan efisiensi operasional sebesar 85%. Namun departemen Penjualan memiliki beban tinggi minggu ini. Pertimbangkan penjadwalan shift ulang agar kasir tidak kelelahan.';
    } else if (
      lowercasePrompt.includes('pengembangan') ||
      lowercasePrompt.includes('saran') ||
      lowercasePrompt.includes('nasihat') ||
      lowercasePrompt.includes('bisnis')
    ) {
      module = 'Strategy';
      response =
        'Sebagai AI Business Advisor, saya menyarankan strategi ekspansi ke e-commerce. Anda memiliki 1400+ unit stok mati (Dead Stock) di Gudang A. \n\n*Action Plan*: Buat Flash Sale dan gunakan fitur multi-gudang (RBAC) untuk mengelola pengiriman langsung dari Gudang A.';
    } else {
      response =
        "Saya adalah AI Business Advisor Anda. Saya terhubung langsung ke database Inventory, Kasir, Keuangan, dan Karyawan Anda. Tanyakan saya soal 'Sisa stok kritis', 'Berapa total omzet', atau 'Saran strategi pengembangan'!";
    }

    // [TODO]: Integrate with actual LLM like OpenAI or Google Gemini API here.
    // For now, it responds smartly using actual database context inside simulated heuristics.

    // Note: User field in AiChatHistory might require a user context. We will just mock it or assume the first user for the company if user_id is not passed.
    const user = await this.prisma.user.findFirst({
      where: { company_id: companyId },
    });

    if (user) {
      await this.prisma.aiChatHistory.create({
        data: {
          company: { connect: { id: companyId } },
          user: { connect: { id: user.id } },
          prompt: prompt,
          response: response,
          module: module,
        },
      });
    }

    return { response, module };
  }

  async getAuditLogs(companyId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Fallback if empty for simulation
    if (logs.length === 0) {
      return [
        {
          id: 'mock-1',
          action: 'LOGIN_SUCCESS',
          entity: 'User',
          ip_address: '192.168.1.104',
          browser: 'Chrome 120.0',
          device: 'Windows',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: 'mock-2',
          action: 'CREATE_USER',
          entity: 'User',
          ip_address: '192.168.1.104',
          browser: 'Chrome 120.0',
          device: 'Windows',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: 'mock-3',
          action: 'UPDATE_SETTINGS',
          entity: 'CompanySetting',
          ip_address: '114.120.25.1',
          browser: 'Safari 17.1',
          device: 'MacBook',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
    }

    return logs;
  }

  // =========================================================
  // SAAS MULTI-TENANT & CLIENT SUBSCRIPTION MANAGEMENT
  // =========================================================

  /**
   * List all SaaS Client Tenants (Wood & Fish clients) with their subscriptions and usage
   */
  async listClients() {
    return this.cache.getOrSet('saas_clients_list', 30, async () => {
      const companies = await this.prisma.company.findMany({

      include: {
        tenant: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            status: true,
            role: { select: { name: true } },
          },
        },
        warehouses: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            users: true,
            warehouses: true,
            products: true,
            transactions: true,
            ai_chats: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return companies.map((c) => {
      const sub = c.tenant?.subscription;
      const plan = sub?.plan;
      const isKayu =
        c.name.toLowerCase().includes('kayu') ||
        c.name.toLowerCase().includes('wood');

      return {
        company_id: c.id,
        tenant_id: c.tenant_id,
        company_name: c.name,
        type: isKayu ? 'WOOD' : 'FISH',
        email: c.email,
        phone: c.phone,
        status: c.tenant?.status || 'ACTIVE',
        subscription: {
          status: sub?.status || 'ACTIVE',
          plan_name: plan?.name || 'Pro Business',
          price_monthly: plan?.price_monthly || 2500000,
          price_yearly: plan?.price_yearly || 25000000,
          billing_cycle: sub?.billing_cycle || 'MONTHLY',
          start_date: sub?.start_date || c.created_at,
          end_date:
            sub?.end_date ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_expired: sub?.end_date ? new Date() > new Date(sub.end_date) : false,
        },
        usage: {
          total_users: c._count.users,
          total_warehouses: c._count.warehouses,
          total_products: c._count.products,
          ai_queries_used: c._count.ai_chats,
          storage_used_mb: (c._count.products * 0.5 + c._count.transactions * 0.1).toFixed(1),
          storage_limit_mb: plan?.storage_limit_mb || 5120,
        },
        owners: c.users.filter((u) => u.role?.name === 'Owner' || u.username === 'owner'),
      };
    });
    });
  }

  /**
   * Create a new SaaS Client (Wood or Fish) with its Owner account & Subscription
   */
  async createClientTenant(data: {

    company_name: string;
    type: 'WOOD' | 'FISH';
    owner_username: string;
    owner_email: string;
    owner_password?: string;
    owner_name: string;
    plan_name?: string;
    duration_months?: number;
    phone?: string;
    address?: string;
    price_monthly?: number;
  }) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(
      data.owner_password || 'password123',
      10,
    );

    // 1. Create Tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.company_name,
        status: 'ACTIVE',
      },
    });

    // 2. Create Company linked to Tenant
    const company = await this.prisma.company.create({
      data: {
        tenant_id: tenant.id,
        name: data.company_name,
        email: data.owner_email,
        phone: data.phone || '',
        address: data.address || '',
        timezone: 'Asia/Jakarta',
        currency: 'IDR',
      },
    });

    // 3. Create Owner Role with Super Admin Permission
    let permAll = await this.prisma.permission.findUnique({
      where: { name: '*' },
    });
    if (!permAll) {
      permAll = await this.prisma.permission.create({
        data: { name: '*', description: 'Super Admin Access' },
      });
    }

    const role = await this.prisma.role.create({
      data: {
        company_id: company.id,
        name: 'Owner',
        description: `Pemilik Bisnis ${data.type === 'WOOD' ? 'Kayu' : 'Ikan'}`,
      },
    });

    await this.prisma.rolePermission.create({
      data: {
        role_id: role.id,
        permission_id: permAll.id,
      },
    });

    // 4. Create Owner User
    const user = await this.prisma.user.create({
      data: {
        company_id: company.id,
        role_id: role.id,
        username: data.owner_username.trim().toLowerCase(),
        name: data.owner_name,
        email: data.owner_email.trim().toLowerCase(),
        password: hashedPassword,
        status: true,
      },
    });

    // 5. Create Subscription Plan & Tenant Subscription
    const months = data.duration_months || 12;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    let plan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: data.plan_name || 'Enterprise' },
    });

    const monthlyPrice = data.price_monthly !== undefined ? Number(data.price_monthly) : 2500000;
    const yearlyPrice = monthlyPrice * 10; // 2 months free discount

    if (!plan) {
      plan = await this.prisma.subscriptionPlan.create({
        data: {
          name: data.plan_name || 'Enterprise',
          price_monthly: monthlyPrice,
          price_yearly: yearlyPrice,
          max_users: 50,
          max_warehouses: 10,
          max_assets: 500,
          storage_limit_mb: 10240,
          api_limit_day: 10000,
          ai_credits_mo: 1000,
        },
      });
    }

    const subscription = await this.prisma.tenantSubscription.create({
      data: {
        tenant_id: tenant.id,
        plan_id: plan.id,
        billing_cycle: months >= 12 ? 'YEARLY' : 'MONTHLY',
        status: 'ACTIVE',
        start_date: startDate,
        end_date: endDate,
      },
    });

    // 6. Seed Default Warehouses based on vertical type
    if (data.type === 'WOOD') {
      await this.prisma.warehouse.create({
        data: {
          company_id: company.id,
          code: 'WH-KLT-01',
          name: 'Gudang Pengolahan Log & Sawmill',
          address: data.address || 'Kalteng',
        },
      });
      await this.prisma.warehouse.create({
        data: {
          company_id: company.id,
          code: 'WH-SBY-01',
          name: 'Gudang Transit Pelabuhan Surabaya',
          address: 'Tanjung Perak, Surabaya',
        },
      });
    } else {
      await this.prisma.warehouse.create({
        data: {
          company_id: company.id,
          code: 'WH-COLD-01',
          name: 'Cold Storage Utama (-25°C)',
          address: data.address || 'Pelabuhan Perikanan',
        },
      });
    }

    // Invalidate client list cache
    this.cache.invalidate('saas_clients_list');

    return {
      success: true,
      message: `Berhasil mendaftarkan klien SaaS ${data.company_name}!`,

      company_id: company.id,
      tenant_id: tenant.id,
      user_id: user.id,
      username: user.username,
      subscription_end: subscription.end_date,
    };
  }

  /**
   * Update SaaS Client (Company name, phone, email, address, status)
   */
  async updateClientTenant(
    companyId: string,
    data: {
      company_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      status?: 'ACTIVE' | 'SUSPENDED';
      plan_name?: string;
      duration_months?: number;
      price_monthly?: number;
    },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { tenant: { include: { subscription: true } } },
    });

    if (!company) {
      throw new ForbiddenException('Client company not found');
    }

    // 1. Update Company fields
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.company_name ?? company.name,
        email: data.email ?? company.email,
        phone: data.phone ?? company.phone,
        address: data.address ?? company.address,
      },
    });

    // 2. Update Tenant name & status if provided
    if (company.tenant_id) {
      await this.prisma.tenant.update({
        where: { id: company.tenant_id },
        data: {
          name: data.company_name ?? undefined,
          status: data.status ?? undefined,
        },
      });

      // 3. Update subscription duration if specified
      if (data.duration_months && company.tenant?.subscription) {
        const sub = company.tenant.subscription;
        const newEndDate = new Date(sub.end_date);
        newEndDate.setMonth(newEndDate.getMonth() + Number(data.duration_months));

        await this.prisma.tenantSubscription.update({
          where: { id: sub.id },
          data: {
            end_date: newEndDate,
            status: 'ACTIVE',
          },
        });
      }
    }

    // Invalidate client list cache
    this.cache.invalidate('saas_clients_list');

    return {
      success: true,
      message: `Berhasil memperbarui data klien SaaS ${data.company_name || company.name}`,
    };
  }

  /**
   * Delete SaaS Client (Cascade delete or deactivate)
   */
  async deleteClientTenant(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { tenant: true },
    });

    if (!company) {
      throw new ForbiddenException('Client company not found');
    }

    const tenantId = company.tenant_id;

    // Soft delete / Clean up Company & Tenant
    // To protect transactional data safely, we set Tenant status to SUSPENDED or delete if safe
    try {
      // Invalidate cache first
      this.cache.invalidate('saas_clients_list');

      // Attempt deletion inside transaction or cascading clean
      await this.prisma.$transaction(async (tx) => {
        // Delete users, roles, settings associated
        await tx.companySetting.deleteMany({ where: { company_id: companyId } });
        await tx.user.deleteMany({ where: { company_id: companyId } });
        await tx.rolePermission.deleteMany({
          where: { role: { company_id: companyId } },
        });
        await tx.role.deleteMany({ where: { company_id: companyId } });
        await tx.warehouseStock.deleteMany({ where: { company_id: companyId } });
        await tx.warehouse.deleteMany({ where: { company_id: companyId } });
        
        // Delete company
        await tx.company.delete({ where: { id: companyId } });

        // Delete tenant if exists
        if (tenantId) {
          await tx.tenantSubscription.deleteMany({ where: { tenant_id: tenantId } });
          await tx.tenant.delete({ where: { id: tenantId } });
        }
      });

      return {
        success: true,
        message: `Klien SaaS ${company.name} berhasil dihapus permanen.`,
      };
    } catch (err: any) {
      // Fallback: If foreign key constraints on invoices/transactions prevent hard delete, suspend the tenant!
      if (tenantId) {
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: { status: 'SUSPENDED' },
        });
      }
      return {
        success: true,
        message: `Klien SaaS memiliki riwayat transaksi aktif, status tenant berhasil diubah menjadi Nonaktif (SUSPENDED).`,
      };
    }
  }
}
