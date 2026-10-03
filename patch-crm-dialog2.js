const fs = require('fs');
let file = 'frontend/src/app/crm/customers/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldEnd = ` </div>
 );
}`;

const newEnd = `      {/* ACTIVITY MODAL */}
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
 </div>
 );
}`;

content = content.replace(oldEnd, newEnd);
fs.writeFileSync(file, content);
console.log('Added activity dialog');
