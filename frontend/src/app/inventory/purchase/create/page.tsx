"use client";

import { useEffect, useState } from "react";
import { M3asterDataAPI, InventoryAPI, PurchaseAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X } from "lucide-react";

export default function CreatePurchasePage() {
  const router = useRouter();
  const [sources, setSources] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState({
    purchaseNumber: `PO-${new Date().getTime().toString().slice(-6)}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    warehouseId: "",
    notes: "",
    items: [{ 
      timberVariantId: "", 
      quantityPcs: 1, 
      volumeM33: 0,
      purchaseThickness: 0,
      purchaseWidth: 0,
      purchaseLength: 0,
      unitPrice: 0,
      notes: ""
    }]
  });

  useEffect(() => {
    M3asterDataAPI.getSources().then((res: any) => setSources(res?.data || res || []));
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || []));
    InventoryAPI.getTimberVariants().then((res: any) => setVariants(res?.data || res || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await PurchaseAPI.createPurchase({
        purchaseNumber: form.purchaseNumber,
        purchaseDate: form.purchaseDate,
        sourceId: form.supplierId,
        warehouseId: form.warehouseId,
        notes: form.notes,
        items: form.items
      });
      router.push("/inventory/purchase");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create purchase");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <Card className="shadow-sm border-border">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <CardTitle className="text-xl">Create Purchase (Beli M3asak)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nomor Purchase (PO)</Label>
                <Input value={form.purchaseNumber} onChange={e => setForm({...form, purchaseNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal (Date)</Label>
                <Input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Supplier (Timber Source)</Label>
                <Select value={form.supplierId} onValueChange={(val: any) => setForm({ ...form, supplierId: val || "" })} required>
                  <SelectTrigger><SelectValue placeholder="Pilih Supplier" /></SelectTrigger>
                  <SelectContent>
                    {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gudang Tujuan (Warehouse)</Label>
                <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "" })} required>
                  <SelectTrigger><SelectValue placeholder="Pilih Gudang" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Catatan (Notes)</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Keterangan PO..." />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Daftar Kayu (Items)</h3>
              
              {form.items.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-muted/10 relative">
                  <div className="absolute top-2 right-2">
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Variant / Sku Kayu</Label>
                      <Select value={item.timberVariantId} onValueChange={(val: any) => {
                        const newItems = [...form.items];
                        const variant = variants.find(v => v.id === val);
                        newItems[index].timberVariantId = val || "";
                        if (variant) {
                           newItems[index].volumeM33 = variant.volumePerPiece * newItems[index].quantityPcs;
                           newItems[index].purchaseThickness = variant.thickness;
                           newItems[index].purchaseWidth = variant.width;
                           newItems[index].purchaseLength = variant.length;
                        }
                        setForm({ ...form, items: newItems });
                      }}>
                        <SelectTrigger><SelectValue placeholder="Pilih Variant Kayu" /></SelectTrigger>
                        <SelectContent>
                          {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.sku || `${v.species} ${v.grade} ${v.thickness}x${v.width}x${v.length}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity (PCS)</Label>
                      <Input type="number" min="1" value={item.quantityPcs} onChange={(e) => {
                        const newItems = [...form.items];
                        const pcs = parseInt(e.target.value) || 0;
                        newItems[index].quantityPcs = pcs;
                        const variant = variants.find(v => v.id === newItems[index].timberVariantId);
                        if (variant) newItems[index].volumeM33 = pcs * variant.volumePerPiece;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>

                    <div className="space-y-2">
                      <Label>Net Vol (M3ï¿½)</Label>
                      <Input type="number" step="0.0001" value={item.volumeM33} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].volumeM33 = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>

                    <div className="space-y-2">
                      <Label>Panjang Aktual (P) m</Label>
                      <Input type="number" step="0.1" value={item.purchaseLength} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].purchaseLength = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Lebar Aktual (L) cm</Label>
                      <Input type="number" step="0.1" value={item.purchaseWidth} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].purchaseWidth = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>

                    <div className="space-y-2">
                      <Label>Tebal Aktual (T) cm</Label>
                      <Input type="number" step="0.1" value={item.purchaseThickness} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].purchaseThickness = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>

                    <div className="space-y-2">
                      <Label>Harga Satuan (Rp)</Label>
                      <Input type="number" min="0" value={item.unitPrice} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: newItems });
                      }} />
                    </div>
                    
                    <div className="space-y-2 md:col-span-4">
                      <Label>Keterangan Item (APM3/AF/LKL dsb)</Label>
                      <Input value={item.notes} onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].notes = e.target.value;
                        setForm({ ...form, items: newItems });
                      }} placeholder="Catatan tambahan (opsional)..." />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setForm({ 
                ...form, 
                items: [...form.items, { timberVariantId: "", quantityPcs: 1, volumeM33: 0, purchaseThickness: 0, purchaseWidth: 0, purchaseLength: 0, unitPrice: 0, notes: "" }] 
              })}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item Kayu
              </Button>
            </div>
            
            <div className="pt-6 flex justify-end gap-3 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Batal</Button>
              <Button type="submit" size="lg">Simpan Dokumen</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

