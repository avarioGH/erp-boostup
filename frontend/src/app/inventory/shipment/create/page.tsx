"use client";

import { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, ShipmentAPI, TimberAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Plus, Trash2, Truck, Box, Package2, Save, MapPin, UserSquare2, Layers, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TallyItem {
  timberVariantId?: string;
  species: string;
  productCategory: string;
  thicknessCm: number;
  widthCm: number;
  lengthCm: number;
  quantityPcs: number;
  volumeM3: number;
}

export default function CreateShipmentPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    shipmentNumber: `FUSO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(10 + Math.random() * 90)}`,
    fusoName: "FUSO 01",
    policeNumber: "",
    driverName: "",
    shipmentDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",
    vehicleId: "",
    driverId: "",
    destinationName: "",
    destinationAddress: "",
    notes: "",
  });

  const [items, setItems] = useState<TallyItem[]>([
    {
      species: "MERANTI",
      productCategory: "BALOK",
      thicknessCm: 15,
      widthCm: 25,
      lengthCm: 400,
      quantityPcs: 10,
      volumeM3: 0.15,
    },
  ]);

  useEffect(() => {
    InventoryAPI.getWarehouses()
      .then((res: any) => {
        const whList = res?.data || res || [];
        setWarehouses(whList);
        if (whList.length > 0 && !form.warehouseId) {
          setForm(f => ({ ...f, warehouseId: whList[0].id }));
        }
      })
      .catch(() => {});

    MasterDataAPI.getVehicles().then((res: any) => setVehicles(res?.data || res || [])).catch(() => {});
    MasterDataAPI.getDrivers().then((res: any) => setDrivers(res?.data || res || [])).catch(() => {});
    TimberAPI.getTimberStock().then((res: any) => setStocks(res?.data || res || [])).catch(() => {});
  }, []);

  const calculateVolume = (t: number, l: number, p: number, qty: number) => {
    if (!t || !l || !p || !qty) return 0;
    // T, L, P in cm -> vol in m3 = (T * L * P) / 1,000,000 * qty
    return Number(((t * l * p * qty) / 1000000).toFixed(4));
  };

  const handleItemChange = (index: number, field: keyof TallyItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    if (field === 'thicknessCm' || field === 'widthCm' || field === 'lengthCm' || field === 'quantityPcs') {
      const t = Number(updated[index].thicknessCm) || 0;
      const l = Number(updated[index].widthCm) || 0;
      const p = Number(updated[index].lengthCm) || 0;
      const q = Number(updated[index].quantityPcs) || 0;
      updated[index].volumeM3 = calculateVolume(t, l, p, q);
    }

    setItems(updated);
  };

  const handlePickStockVariant = (index: number, variantId: string) => {
    const stock = stocks.find(s => s.variantId === variantId);
    const updated = [...items];
    if (stock && stock.variant) {
      const v = stock.variant;
      updated[index].timberVariantId = variantId;
      updated[index].species = v.species || "MERANTI";
      updated[index].productCategory = "BALOK";
      updated[index].thicknessCm = (v.thicknessMm || 0) / 10;
      updated[index].widthCm = (v.widthMm || 0) / 10;
      updated[index].lengthCm = (v.lengthMm || 0) / 10;
      const q = updated[index].quantityPcs || 1;
      updated[index].volumeM3 = calculateVolume(updated[index].thicknessCm, updated[index].widthCm, updated[index].lengthCm, q);
    } else {
      updated[index].timberVariantId = undefined;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        species: items[items.length - 1]?.species || "MERANTI",
        productCategory: items[items.length - 1]?.productCategory || "BALOK",
        thicknessCm: 10,
        widthCm: 20,
        lengthCm: 400,
        quantityPcs: 10,
        volumeM3: 0.8,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalPcs = items.reduce((sum, i) => sum + (Number(i.quantityPcs) || 0), 0);
  const totalM3 = items.reduce((sum, i) => sum + (Number(i.volumeM3) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.warehouseId) {
      setError("Pilih gudang asal muat terlebih dahulu");
      return;
    }
    if (items.length === 0 || totalPcs <= 0) {
      setError("Tambahkan minimal satu baris muatan dengan jumlah > 0");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        shipmentNumber: form.shipmentNumber,
        fusoName: form.fusoName || form.shipmentNumber,
        policeNumber: form.policeNumber,
        driverName: form.driverName,
        shipmentDate: form.shipmentDate ? new Date(form.shipmentDate).toISOString() : new Date().toISOString(),
        warehouseId: form.warehouseId,
        vehicleId: form.vehicleId || undefined,
        driverId: form.driverId || undefined,
        destinationName: form.destinationName,
        destinationAddress: form.destinationAddress,
        notes: form.notes,
        items: items.map(i => ({
          timberVariantId: i.timberVariantId || undefined,
          species: i.species,
          productCategory: i.productCategory,
          thicknessMm: (Number(i.thicknessCm) || 0) * 10,
          widthMm: (Number(i.widthCm) || 0) * 10,
          lengthMm: (Number(i.lengthCm) || 0) * 10,
          quantityPcs: Number(i.quantityPcs) || 0,
          volumeM3: Number(i.volumeM3) || 0,
        })),
      };

      await ShipmentAPI.createShipment(payload);
      router.push("/inventory/shipment");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal membuat surat muat fuso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-16 px-4 md:px-6 box-border">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Buat Surat Tally Muatan Fuso
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Input data armada truk/fuso dan rincian ukuran kayu yang dimuat (T × L × P cm)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900/50 rounded-xl">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Armada & Destinasi Form */}
        <Card className="bg-card rounded-xl border border-border shadow-sm">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" /> Informasi Armada & Tujuan Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">No. Surat Muat</Label>
                <Input 
                  value={form.shipmentNumber} 
                  onChange={e => setForm({ ...form, shipmentNumber: e.target.value })} 
                  placeholder="e.g. SJM-2026-001" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Nama Fuso / Truk</Label>
                <Input 
                  value={form.fusoName} 
                  onChange={e => setForm({ ...form, fusoName: e.target.value })} 
                  placeholder="e.g. FUSO 01 / TRUK 1" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">No. Polisi Kendaraan</Label>
                <Input 
                  value={form.policeNumber} 
                  onChange={e => setForm({ ...form, policeNumber: e.target.value })} 
                  placeholder="e.g. L 8355 NA / KH 8916 GO" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Nama Supir</Label>
                <Input 
                  value={form.driverName} 
                  onChange={e => setForm({ ...form, driverName: e.target.value })} 
                  placeholder="e.g. Teguh / Rahman" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Tanggal Muat</Label>
                <Input 
                  type="date" 
                  value={form.shipmentDate} 
                  onChange={e => setForm({ ...form, shipmentDate: e.target.value })} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Gudang Asal Muat</Label>
                <Select value={form.warehouseId} onValueChange={(v: string | null) => setForm({ ...form, warehouseId: v || "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Tujuan / Nama Pembeli</Label>
                <Input 
                  value={form.destinationName} 
                  onChange={e => setForm({ ...form, destinationName: e.target.value })} 
                  placeholder="e.g. Pak Heri (Surabaya)" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Catatan / Keterangan</Label>
                <Input 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })} 
                  placeholder="e.g. Muatan ex Sampit / Kalteng" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tally Muat Table */}
        <Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" /> Rincian Tally Muatan (Ukuran T × L × P cm)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Ketik ukuran kayu dalam sentimeter (cm) dan jumlah keping (pcs). Volume M³ akan otomatis dihitung.
              </CardDescription>
            </div>
            <Button type="button" onClick={addItemRow} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Baris
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="min-w-[950px] w-full text-xs sm:text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="p-3 text-center w-12 font-semibold">No</th>
                    <th className="p-3 text-left w-36 font-semibold">Jenis Kayu</th>
                    <th className="p-3 text-left w-36 font-semibold">Kategori</th>
                    <th className="p-3 text-right w-24 font-semibold">Tebal (cm)</th>
                    <th className="p-3 text-right w-24 font-semibold">Lebar (cm)</th>
                    <th className="p-3 text-right w-24 font-semibold">Panjang (cm)</th>
                    <th className="p-3 text-right w-28 font-semibold">Pcs</th>
                    <th className="p-3 text-right w-32 font-semibold">Volume (M³)</th>
                    <th className="p-3 text-center w-16 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-2 text-center text-muted-foreground font-semibold">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <Select 
                          value={item.species} 
                          onValueChange={(v: string | null) => handleItemChange(idx, 'species', v || 'MERANTI')}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MERANTI">Meranti</SelectItem>
                            <SelectItem value="BENGKIRAI">Bengkirai</SelectItem>
                            <SelectItem value="KERUING">Keruing</SelectItem>
                            <SelectItem value="ULIN">Ulin</SelectItem>
                            <SelectItem value="CAMPURAN">Campuran / Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select 
                          value={item.productCategory} 
                          onValueChange={(v: string | null) => handleItemChange(idx, 'productCategory', v || 'BALOK')}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BALOK">Balok / Main Size</SelectItem>
                            <SelectItem value="RENG">Reng / Papan</SelectItem>
                            <SelectItem value="AFKIR_BS">BS / Afkir</SelectItem>
                            <SelectItem value="AIR_DRY">Air Dry (AD)</SelectItem>
                            <SelectItem value="FJL">FJL</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          value={item.thicknessCm} 
                          onChange={e => handleItemChange(idx, 'thicknessCm', parseFloat(e.target.value) || 0)}
                          className="h-9 text-right font-medium" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          value={item.widthCm} 
                          onChange={e => handleItemChange(idx, 'widthCm', parseFloat(e.target.value) || 0)}
                          className="h-9 text-right font-medium" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          step="1" 
                          min="1" 
                          value={item.lengthCm} 
                          onChange={e => handleItemChange(idx, 'lengthCm', parseFloat(e.target.value) || 0)}
                          className="h-9 text-right font-medium" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantityPcs} 
                          onChange={e => handleItemChange(idx, 'quantityPcs', parseInt(e.target.value) || 0)}
                          className="h-9 text-right font-bold" 
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(item.volumeM3.toFixed(4))}
                      </td>
                      <td className="p-2 text-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          disabled={items.length <= 1}
                          onClick={() => removeItemRow(idx)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t-2 border-border">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase tracking-wider">
                      TOTAL MUATAN ARMADA:
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">
                      {totalPcs.toLocaleString("id-ID")} pcs
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      {Number(totalM3.toFixed(4))} m³
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Indicator & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                Estimasi Muatan: {Number(totalM3.toFixed(3))} M³ ({totalPcs} Pcs)
              </p>
              <p className="text-xs text-muted-foreground">
                Kapasitas standar Fuso: ~30 - 35 M³. {totalM3 > 35 ? <span className="text-amber-600 font-bold">⚠️ Perhatian: Muatan melebihi 35 M³</span> : "Muatan dalam batas aman."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              className="w-full sm:w-auto font-semibold"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Surat Muat (Draft)
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
