const fs = require('fs');
const path = 'frontend/src/app/sales/orders/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { Printer }')) {
  content = content.replace("import { Loader2, Plus,", "import { Loader2, Plus, Printer,");
}

if (!content.includes('Printer className')) {
  content = content.replace(
    '<Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>',
    '<Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>\n <Link href={`/sales/orders/${details.id}/print`} target="_blank"><Button variant="outline"><Printer className="w-4 h-4 mr-2" /> Cetak Surat Jalan</Button></Link>'
  );
}

fs.writeFileSync(path, content, 'utf8');
