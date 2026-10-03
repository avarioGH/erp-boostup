const fs = require('fs');
let file = 'frontend/src/app/crm/customers/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('PAYMENT MODAL')) {
  const lastDivIndex = content.lastIndexOf('</div>');
  const dialogs = `
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

      {/* ACTIVITY MODAL */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catat Aktivitas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select value={actType} onValueChange={setActType}>
                <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Catatan (Note)</SelectItem>
                  <SelectItem value="CALL">Telepon (Call)</SelectItem>
                  <SelectItem value="MEETING">Pertemuan (Meeting)</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="Cth: Follow up tagihan"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi / Hasil</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                placeholder="Tuliskan detail aktivitas di sini..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveActivity} disabled={isSavingAct || !actTitle}>
              {isSavingAct ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;
  content = content.slice(0, lastDivIndex) + dialogs + content.slice(lastDivIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully injected dialogs!');
} else {
  console.log('Dialogs already injected.');
}
