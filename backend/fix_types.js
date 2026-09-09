const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

// fix product type
code = code.replace(/ type: 'GOODS',/g, "");

// fix warehouse code
code = code.replace(/name: 'Main A'/g, "name: 'Main A', code: 'WA'");
code = code.replace(/name: 'Sub A'/g, "name: 'Sub A', code: 'WB'");
code = code.replace(/name: 'Main B'/g, "name: 'Main B', code: 'WC'");

// fix accounting period month, year
code = code.replace(/status: 'OPEN' \},/g, "status: 'OPEN', month: 1, year: 2024 },");

// fix journalEntryLine
code = code.replace(/await prisma\.journalEntryLine\.deleteMany\(\{\}\);/g, "await prisma.journalEntryItem.deleteMany({});");

// fix total_cost
code = code.replace(/ total_cost: [0-9]+,/g, "");

// fix totalCogs
code = code.replace(/const \{ totalCogs \} = await prisma\.\$transaction/g, "const res: any = await prisma.$transaction");
code = code.replace(/totalCogs ===/g, "res.totalCogs ===");
code = code.replace(/\+ totalCogs/g, "+ res.totalCogs");

// fix layer_date -> created_at
code = code.replace(/layer_date/g, "created_at");

// fix ix.cursor
code = code.replace(/const hasIdx = ix\.cursor\.firstBatch\.find/g, "const hasIdx = (ix as any).cursor.firstBatch.find");

// fix null checks
code = code.replace(/layer\.remaining/g, "layer?.remaining");
code = code.replace(/layer\.unit_cost/g, "layer?.unit_cost");
code = code.replace(/mo2\.items/g, "mo2?.items");
code = code.replace(/ws\.current_stock/g, "ws?.current_stock");
code = code.replace(/wsB\.current_stock/g, "wsB?.current_stock");
code = code.replace(/wsA\.current_stock/g, "wsA?.current_stock");
code = code.replace(/je\.items/g, "je?.items");
code = code.replace(/debitItem\.debit/g, "debitItem?.debit");
code = code.replace(/creditItem\.credit/g, "creditItem?.credit");
code = code.replace(/\(await prisma\.warehouseStock\.findFirst/g, "(await prisma.warehouseStock.findFirst({ where: { product_id: p1, warehouse_id: w1 }}))?.current_stock === 50");

fs.writeFileSync('test/final.certification.ts', code);
