      {/* NETTING MODAL */}
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
              <Label>Maksimal Kompensasi yang bisa dilakukan: {formatCurrency(Math.min(data?.summary?.outstanding || 0, data?.summary?.outstanding_ap || 0))}</Label>
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
            <Button variant="outline" onClick={() => setNettingModalOpen(false)}>Batal</Button>
            <Button onClick={handleNetting} disabled={!nettingAmount}>
              Proses Kompensasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
