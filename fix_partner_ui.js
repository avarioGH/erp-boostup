
const fs = require("fs");
const content = fs.readFileSync("frontend/src/app/crm/partners/[id]/page.tsx", "utf8");
const updated = content.replace(
  /<CardTitle className="text-sm font-medium text-muted-foreground">Hutang Perusahaan<\/CardTitle>\s*<\/CardHeader>\s*<CardContent>.*?(<\/CardContent>)/s,
  `<CardTitle className="text-sm font-medium text-muted-foreground">Hutang & Kredit Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        {finance.outstandingAp < 0 ? (
          <>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(Math.abs(finance.outstandingAp))} <span className="text-sm font-normal">(Kredit Supplier)</span></div>
            <p className="text-xs text-muted-foreground mt-1">Hutang Pokok: Rp0</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(finance.outstandingAp || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Hutang Pokok</p>
          </>
        )}
      $1`
);
fs.writeFileSync("frontend/src/app/crm/partners/[id]/page.tsx", updated);

