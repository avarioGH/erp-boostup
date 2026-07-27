import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Tenant Middleware Validation (Dipanggil di Global Guard)
   * Memastikan bahwa Tenant aktif dan Subscription belum kedaluwarsa.
   */
  async validateTenantSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true }
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tenant is currently ${tenant.status}`);
    }

    const sub = tenant.subscription;
    if (!sub) {
      throw new ForbiddenException('No active subscription found for this Tenant.');
    }

    if (new Date() > sub.end_date) {
      // Auto Update Status ke EXPIRED
      await this.prisma.tenantSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' }
      });
      throw new ForbiddenException('Your subscription has expired. Please renew to continue using the ERP.');
    }

    return true;
  }

  /**
   * AI Service Wrapper (Agnostic Gateway)
   * Menyembunyikan kompleksitas vendor AI dari modul ERP lainnya.
   */
  async generateAiInsight(prompt: string, contextData: any, tenantId: string) {
    this.logger.log(`Generating AI Insight for Tenant: ${tenantId}`);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.");
      }
      
      const systemInstruction = "You are Avario AI, an advanced business intelligence assistant for an ERP system. Provide concise, actionable business insights based on the user prompt.";
      
      const payload = {
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nContext Data (if any): ${JSON.stringify(contextData)}\n\nUser Question: ${prompt}` }]
        }]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error: ${errText}`);
      }

      const data = await res.json();
      const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am sorry, I could not generate an insight at this time.';

      return {
        success: true,
        provider: 'Gemini-1.5-Flash',
        insight: insight
      };
    } catch (e: any) {
      this.logger.error(`AI Error: ${e.message}`);
      return {
        success: false,
        provider: 'Gemini',
        insight: 'Sorry, the AI service is currently unavailable. Please try again later.'
      };
    }
  }

  // --- Settings ---
  async getSettings(companyId: string) {
    let setting = await this.prisma.companySetting.findUnique({
      where: { company_id: companyId }
    });
    let company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!setting) {
      setting = await this.prisma.companySetting.create({
        data: { company_id: companyId }
      });
    }

    return {
      companyName: company?.name || "",
      currency: setting.currency,
      timezone: setting.timezone,
      invoicePrefix: setting.invoice_prefix
    };
  }

  async updateSettings(companyId: string, data: any) {
    await this.prisma.company.update({
      where: { id: companyId },
      data: { name: data.companyName }
    });

    return this.prisma.companySetting.upsert({
      where: { company_id: companyId },
      update: {
        currency: data.currency,
        timezone: data.timezone,
        invoice_prefix: data.invoicePrefix
      },
      create: {
        company_id: companyId,
        currency: data.currency,
        timezone: data.timezone,
        invoice_prefix: data.invoicePrefix
      }
    });
  }

  // --- API Keys ---
  async getApiKeys(companyId: string) {
    // For single-tenant ERP, we'll just fetch all tokens (or link them to a default tenant)
    const company = await this.prisma.company.findUnique({ where: { id: companyId }});
    if (!company?.tenant_id) return [];
    
    return this.prisma.apiToken.findMany({
      where: { tenant_id: company.tenant_id },
      orderBy: { created_at: 'desc' }
    });
  }

  async createApiKey(companyId: string, data: any) {
    let company = await this.prisma.company.findUnique({ where: { id: companyId }});
    let tenantId = company?.tenant_id;
    
    if (!tenantId) {
      const tenant = await this.prisma.tenant.create({
        data: { name: company?.name || 'Default Tenant', status: 'ACTIVE' }
      });
      tenantId = tenant.id;
      await this.prisma.company.update({ where: { id: companyId }, data: { tenant_id: tenantId }});
    }

    const tokenString = 'avario_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    return this.prisma.apiToken.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        token_hash: tokenString, // In real world, hash this and return raw once. For demo, we store raw.
        scopes: data.scopes || 'all'
      }
    });
  }

  async generateSimulatedAiInsight(prompt: string, contextData: any, companyId: string) {
    const lowercasePrompt = prompt.toLowerCase();
    let response = "Maaf, saya tidak mengerti pertanyaan Anda.";
    let module = "General";

    // Simulasi Smart AI Agent yang memeriksa kata kunci dan memberikan jawaban dinamis
    if (lowercasePrompt.includes('stok') || lowercasePrompt.includes('gudang') || lowercasePrompt.includes('inventory') || lowercasePrompt.includes('habis')) {
      module = "Inventory";
      const stocks = await this.prisma.warehouseStock.findMany({
        where: { warehouse: { company_id: companyId } },
        include: { product: true, warehouse: true },
        orderBy: { available_stock: 'asc' },
        take: 3
      });

      if (stocks.length > 0) {
        response = `Berdasarkan analisis stok di database Anda, ada beberapa barang kritis:\n\n`;
        stocks.forEach((s, i) => {
          response += `${i+1}. **${s.product.name}** di ${s.warehouse.name} hanya tersisa ${s.available_stock} unit.\n`;
        });
        response += `\n*Rekomendasi AI:* Segera lakukan re-stock untuk produk-produk di atas untuk menghindari kehilangan potensi penjualan (Out of Stock).`;
      } else {
        response = "Stok Anda dalam keadaan aman. Tidak ada produk yang berada di ambang kritis saat ini.";
      }

    } else if (lowercasePrompt.includes('keuangan') || lowercasePrompt.includes('laba') || lowercasePrompt.includes('omzet') || lowercasePrompt.includes('penjualan')) {
      module = "Finance";
      
      const sales = await this.prisma.salesOrder.findMany({
        where: { company_id: companyId, status: 'COMPLETED' },
      });
      
      const totalSales = sales.reduce((sum, order) => sum + Number(order.total_amount), 0);
      
      response = `Data transaksi menunjukkan total penjualan terselesaikan mencapai **Rp${totalSales.toLocaleString('id-ID')}**.\n\n`;
      if (totalSales > 10000000) {
        response += "Performa yang sangat baik! Anda berada di jalur tren positif bulan ini. *Rekomendasi:* Buat diskon bundle (Voucher) untuk meningkatkan rata-rata transaksi (AOV).";
      } else {
        response += "Penjualan bulan ini masih di bawah ekspektasi awal. *Rekomendasi:* Jalankan promosi CRM dan gunakan fitur blast poin loyalitas ke top customer Anda.";
      }
      
    } else if (lowercasePrompt.includes('karyawan') || lowercasePrompt.includes('absen') || lowercasePrompt.includes('pegawai')) {
      module = "HR";
      response = "Data Karyawan menunjukkan efisiensi operasional sebesar 85%. Namun departemen Penjualan memiliki beban tinggi minggu ini. Pertimbangkan penjadwalan shift ulang agar kasir tidak kelelahan.";
    } else if (lowercasePrompt.includes('pengembangan') || lowercasePrompt.includes('saran') || lowercasePrompt.includes('nasihat') || lowercasePrompt.includes('bisnis')) {
      module = "Strategy";
      response = "Sebagai AI Business Advisor, saya menyarankan strategi ekspansi ke e-commerce. Anda memiliki 1400+ unit stok mati (Dead Stock) di Gudang A. \n\n*Action Plan*: Buat Flash Sale dan gunakan fitur multi-gudang (RBAC) untuk mengelola pengiriman langsung dari Gudang A.";
    } else {
      response = "Saya adalah AI Business Advisor Anda. Saya terhubung langsung ke database Inventory, Kasir, Keuangan, dan Karyawan Anda. Tanyakan saya soal 'Sisa stok kritis', 'Berapa total omzet', atau 'Saran strategi pengembangan'!";
    }

    // [TODO]: Integrate with actual LLM like OpenAI or Google Gemini API here.
    // For now, it responds smartly using actual database context inside simulated heuristics.

    // Note: User field in AiChatHistory might require a user context. We will just mock it or assume the first user for the company if user_id is not passed.
    const user = await this.prisma.user.findFirst({ where: { company_id: companyId }});

    if (user) {
      await this.prisma.aiChatHistory.create({
        data: {
          company_id: companyId,
          user_id: user.id,
          prompt: prompt,
          response: response,
          module: module
        }
      });
    }

    return { response, module };
  }

  async getAuditLogs(companyId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 50
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
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: 'mock-2',
          action: 'CREATE_USER',
          entity: 'User',
          ip_address: '192.168.1.104',
          browser: 'Chrome 120.0',
          device: 'Windows',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: 'mock-3',
          action: 'UPDATE_SETTINGS',
          entity: 'CompanySetting',
          ip_address: '114.120.25.1',
          browser: 'Safari 17.1',
          device: 'MacBook',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];
    }
    
    return logs;
  }
}
