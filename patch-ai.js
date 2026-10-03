const fs = require('fs');
let file = 'backend/src/ai/ai.service.ts';
let content = fs.readFileSync(file, 'utf8');

const chatStart = content.indexOf('async handleChat(user: any, prompt: string, chatHistory: any[]) {');
if (chatStart > -1) {
  const insertIndex = content.indexOf('const messages: any[] = [', chatStart);
  
  const injection = `
      const companyId = user.company_id || user.companyId || user.id;
      const stocks = await this.prisma.warehouseStock.findMany({
        where: { company_id: companyId },
        include: { product: true, warehouse: true }
      });
      let stockInfo = stocks.map(s => \`- \${s.product?.name || 'Ikan'} (\${s.product?.sku || ''}): \${s.current_stock} pcs (Gudang: \${s.warehouse?.name || '-'}) \`).join('\\n');
      if (!stockInfo) stockInfo = 'Belum ada stok barang.';

      const today = new Date();
      today.setHours(0,0,0,0);
      const inflows = await this.prisma.stockInTally.findMany({
        where: { company_id: companyId, tally_date: { gte: today } },
        include: { items: { include: { product: true } } }
      });
      let inflowInfo = inflows.map(t => \`- Teli \${t.tally_number}: \${t.items.map(i => i.qty + ' ' + (i.product?.name || 'Ikan')).join(', ')}\`).join('\\n');
      if (!inflowInfo) inflowInfo = 'Belum ada ikan masuk hari ini.';

`;
  
  content = content.slice(0, insertIndex) + injection + content.slice(insertIndex);
  
  const sysPromptStart = content.indexOf('content: `You are Avario AI', insertIndex);
  const sysPromptEnd = content.indexOf('`,', sysPromptStart);
  
  const newPrompt = `content: \`Anda adalah AI Assistant cerdas untuk sistem ERP. 
Jawablah pertanyaan user dengan sangat singkat, jelas, dan luwes (seperti chat biasa), tanpa template atau basa-basi robot.
Jika ditanya tentang data, baca langsung dari DATABASE LIVE berikut:

-- DATA STOK SAAT INI --
\${stockInfo}

-- DATA IKAN MASUK (TELI) HARI INI --
\${inflowInfo}

HANYA jawab sesuai dengan pertanyaan yang diajukan. Jangan menawarkan hal lain. Jangan bilang tidak menemukan data jika datanya ada di atas.\``;

  content = content.slice(0, sysPromptStart) + newPrompt + content.slice(sysPromptEnd + 2);
  
  fs.writeFileSync(file, content);
  console.log('Service patched');
}
