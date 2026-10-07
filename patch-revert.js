const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the combined Dialog block inside CardHeader back with just the Button
code = code.replace(
  /\{\(finance\.outstandingAmount > 0 && finance\.outstandingAp > 0\) && \(\s*<Dialog open=\{nettingModalOpen\}[\s\S]*?<\/Dialog>\s*\)\}/,
  `{(finance.outstandingAmount > 0 && finance.outstandingAp > 0) && (\n          <Button type="button" size="sm" onClick={() => setNettingModalOpen(true)}>Kompensasi</Button>\n        )}`
);

// Remove DialogTrigger from imports
code = code.replace(
  "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';",
  "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';"
);

// Append the Dialog modal at the end of the return statement before the final closing div
code = code.replace(
  /<\/div>\s*\);\s*\}\s*$/,
  `        {/* NETTING MODAL */}
        <Dialog open={nettingModalOpen} onOpenChange={setNettingModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Kompensasi Hutang/Piutang</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Fitur ini akan memotong silang Piutang (AR) dan Hutang (AP) untuk nelayan/partner ini secara otomatis dari saldo tertua.
              </p>
              <div className="space-y-2">
                <Label>Maksimal Kompensasi yang bisa dilakukan: {formatCurrency(Math.min(finance?.outstandingAmount || 0, finance?.outstandingAp || 0))}</Label>
                <Input
                  type="number"
                  placeholder="Nominal Kompensasi"
                  value={nettingAmount}
                  onChange={(e) => setNettingAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Input
                  type="text"
                  placeholder="Opsional..."
                  value={nettingNotes}
                  onChange={(e) => setNettingNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNettingModalOpen(false)}>Batal</Button>
              <Button onClick={handleNetting} disabled={!nettingAmount}>
                Proses Kompensasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
`
);

fs.writeFileSync(path, code);
console.log('reverted DialogTrigger and placed Dialog at bottom');
