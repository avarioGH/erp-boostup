const fs = require('fs');
let file = 'frontend/src/app/crm/customers/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldEnd = ` </Tabs>
 </div>
 );
}`;

const newEnd = ` </Tabs>

      {/* PAYMENT MODAL */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Piutang</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Total Sisa Piutang</Label>
              <div className="text-xl font-bold text-destructive">
                {formatCurrency(data?.finance?.outstandingAmount || 0)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nominal Pembayaran (Rp)</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Masukkan nominal"
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue placeholder="Pilih Metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer">Transfer Bank</SelectItem>
                  <SelectItem value="Giro">Bilyet Giro / Cek</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referensi / Catatan (Opsional)</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Cth: Transfer BCA a/n Budi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Batal</Button>
            <Button onClick={handlePay} disabled={isPaying || !payAmount}>
              {isPaying ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 </div>
 );
}`;

content = content.replace(oldEnd, newEnd);
fs.writeFileSync(file, content);
console.log('Added payment dialog');
