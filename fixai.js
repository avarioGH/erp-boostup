const fs = require('fs');
const content = fs.readFileSync('backend/src/platform/platform.service.ts', 'utf8');

const newLogic = `async generateAiInsight(prompt: string, incomingContextData: any, tenantId: string) {
    this.logger.log(\`Generating AI Insight for Tenant: \${tenantId}\`);
    const q = prompt.toLowerCase();
    let insight = 'Maaf, saya tidak mengerti maksud Anda. Saat ini saya diprogram khusus untuk mengecek **stok barang** dan **total penjualan**. Cobalah bertanya: "berapa stok kayu meranti?" atau "berapa penjualan bulan ini?"';

    if (q.includes('halo') || q.includes('hai') || q.includes('hi')) {
      insight = 'Halo! Saya adalah AI Assistant ERP Anda. Saya terhubung langsung dengan database. Anda bisa bertanya tentang ketersediaan stok barang atau ringkasan penjualan.';
    }

    if (q.includes('stok') || q.includes('sisa') || q.includes('cek')) {
      // Find all products to match
      const products = await this.prisma.product.findMany({
        where: { company_id: tenantId },
        include: { warehouse_stocks: true }
      });
      
      let found = products.filter(p => q.includes(p.name.toLowerCase()) || q.includes(p.code.toLowerCase()));
      if (found.length === 0) {
        // Try rough match
        const words = q.split(' ').filter(w => w.length > 3 && w !== 'stok' && w !== 'berapa' && w !== 'ikan' && w !== 'kayu');
        found = products.filter(p => words.some(w => p.name.toLowerCase().includes(w)));
      }

      if (found.length > 0) {
        insight = 'Berikut adalah informasi stok yang Anda cari:\n';
        found.forEach(p => {
          const totalStock = p.warehouse_stocks.reduce((acc, ws) => acc + (ws.current_stock || 0), 0);
          insight += \`- **\${p.name}** (\${p.code}): Tersedia **\${totalStock}** di semua gudang.\n\`;
        });
      } else if (q.includes('stok')) {
        insight = 'Saya tidak dapat menemukan barang tersebut di database. Pastikan nama barang sudah sesuai.';
      }
    }

    if (q.includes('penjualan') || q.includes('omset') || q.includes('laku')) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todaySales = await this.prisma.salesOrder.aggregate({
        where: { company_id: tenantId, order_date: { gte: today }, status: { notIn: ['CANCELLED'] } },
        _sum: { total_amount: true }
      });
      
      const monthSales = await this.prisma.salesOrder.aggregate({
        where: { company_id: tenantId, order_date: { gte: startOfMonth }, status: { notIn: ['CANCELLED'] } },
        _sum: { total_amount: true }
      });

      const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
      insight = \`Ringkasan penjualan Anda:\n- **Hari ini**: \${rp.format(todaySales._sum.total_amount || 0)}\n- **Bulan ini**: \${rp.format(monthSales._sum.total_amount || 0)}\`;
    }

    return {
      success: true,
      provider: 'Boostup-Internal-AI',
      insight
    };
  }`;

const start = content.indexOf('async generateAiInsight');
const end = content.indexOf('async getSettings', start);
const newContent = content.substring(0, start) + newLogic + '\n\n  // --- Settings ---\n  ' + content.substring(end);

fs.writeFileSync('backend/src/platform/platform.service.ts', newContent);
