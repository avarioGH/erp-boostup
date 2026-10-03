const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/dashboard/FishDashboard.tsx', 'utf8');

if (!content.includes('AlertTriangle')) {
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/, (match, p1) => {
    return `import {${p1}, AlertTriangle} from "lucide-react"`;
  });
}

const keluarStartIndex = content.indexOf('<Card className="shadow-sm">', content.indexOf('Ikan Keluar Hari Ini') - 200);
const keluarEndIndex = content.indexOf('</Card>', content.indexOf('Ikan Keluar Hari Ini')) + 7;
const keluarCard = content.substring(keluarStartIndex, keluarEndIndex);

const deadstockCard = `
        <Card className="shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = '/inventory/disposals'}>
          <CardHeader className="pb-2 pt-4 px-4 md:px-5">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase flex justify-between">
              Deadstock / Pemusnahan
              <AlertTriangle className="w-4 h-4 text-orange-500 opacity-70" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5">
            <div className="text-xl md:text-3xl font-bold text-orange-500">
              {Number(kpi.deadstock || 0).toLocaleString()} <span className="text-xs md:text-sm font-medium text-muted-foreground">Item</span>
            </div>
          </CardContent>
        </Card>`;

content = content.replace('className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-5 md:mb-6"', 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-5 md:mb-6"');

content = content.replace(keluarCard, keluarCard + '\n' + deadstockCard);

fs.writeFileSync('frontend/src/app/inventory/dashboard/FishDashboard.tsx', content);
