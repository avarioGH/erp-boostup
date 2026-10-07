const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove the standalone netting modal at the end
code = code.replace(/\{\/\* NETTING MODAL \*\/\}\s*<Dialog open=\{nettingModalOpen\}[\s\S]*?<\/DialogContent>\s*<\/Dialog>/, '');

// Replace the Button with the Dialog and Button
const triggerReplacement = `{/* NETTING MODAL */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Kompensasi</Button>
          </DialogTrigger>
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
              <Button onClick={handleNetting} disabled={!nettingAmount}>
                Proses Kompensasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>`;

// I will replace the Button inside the CardHeader
code = code.replace(
  /\{\(finance\.outstandingAmount > 0 && finance\.outstandingAp > 0\) && \([\s\S]*?<\/Button>\s*\)\}/,
  `{(finance.outstandingAmount > 0 && finance.outstandingAp > 0) && (\n${triggerReplacement}\n)}`
);

fs.writeFileSync(path, code);
console.log('patched to use DialogTrigger');
