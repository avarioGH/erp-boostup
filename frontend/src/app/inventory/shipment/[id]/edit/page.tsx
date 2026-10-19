"use client";
import React, { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, ShipmentAPI } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, ArrowLeft, Plus, Trash2, Truck, Save, 
  AlertTriangle, CheckCircle2, PackageCheck,
  Warehouse as WarehouseIcon 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TallyItem {
  species: string;
  productCategory: string;
  thicknessCm: number | string;
  widthCm: number | string;
  lengthCm: number | string;
  quantityPcs: number | string;
  volumeM3: number;
  notes?: string;
}

export default function EditShipmentPage({ params }: { params: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unwrappedParams = typeof (params as any)?.then === 'function' ? (React.use(params as Promise<{ id: string }>) as { id: string }) : (params as { id: string });
  const shipmentId = unwrappedParams.id;
  const linkedPartaiId = searchParams.get("partaiId") || "";

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [shipmentPartaiId, setShipmentPartaiId] = useState<string>("");

  const [form, setForm] = useState({
    shipmentNumber: "",
    fusoName: "",
    policeNumber: "",
    driverName: "",
    shipmentDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",             // Gudang Asal
    destinationWarehouseId: "",  // Gudang Tujuan (Pindah Stok)
    destinationName: "",         // Atau Nama Pembeli / Tujuan Eksternal
    destinationAddress: "",
    notes: "",
  });

  const createEmptyRow = (defaultSpecies = "MERANTI", defaultCat = "BALOK"): TallyItem => ({
    species: defaultSpecies,
    productCategory: defaultCat,
    thicknessCm: "",
    widthCm: "",
    lengthCm: "",
    quantityPcs: "",
    volumeM3: 0,
    notes: "",
  });

  const [items, setItems] = useState<TallyItem[]>([]);

  // Load existing shipment data, warehouses & master species
  useEffect(() => {
    setPageLoading(true);
    Promise.all([
      ShipmentAPI.getShipment(shipmentId),
      InventoryAPI.getWarehouses().catch(() => []),
      MasterDataAPI.getSpecies().catch(() => []),
    ]).then(([shipmentRes, whRes, spRes]: any[]) => {
      const data = shipmentRes?.data || shipmentRes;
      const whList = whRes?.data || whRes || [];
      const spList = spRes?.data || (Array.isArray(spRes) ? spRes : []);
      
      setWarehouses(whList);
      setSpeciesList(spList);

      if (data) {
        if (data.status !== "DRAFT" && data.status) {
          setError(`Surat muat berstatus ${data.status} tidak dapat diedit langsung. Hanya status DRAFT yang dapat diedit.`);
        }

        setShipmentPartaiId(data.partaiId || "");
        setForm({
          shipmentNumber: data.shipmentNumber || "",
          fusoName: data.fusoName || "",
          policeNumber: data.policeNumber || "",
          driverName: data.driverName || "",
          shipmentDate: data.shipmentDate ? new Date(data.shipmentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          warehouseId: data.warehouseId || "",
          destinationWarehouseId: data.destinationWarehouseId || "",
          destinationName: data.destinationName || "",
          destinationAddress: data.destinationAddress || "",
          notes: data.notes || "",
        });

        if (data.items && data.items.length > 0) {
          const mappedItems: TallyItem[] = data.items.map((i: any) => {
            const t = i.thicknessMm ? i.thicknessMm / 10 : "";
            const l = i.widthMm ? i.widthMm / 10 : "";
            const p = i.lengthMm ? i.lengthMm / 10 : "";
            const q = i.quantityPcs || 0;
            const vol = i.volumeM3 || (t && l && p && q ? (t * l * p * q) / 1000000 : 0);
            return {
              species: i.species || i.timberVariant?.species || "MERANTI",
              productCategory: i.productCategory || "BALOK",
              thicknessCm: t,
              widthCm: l,
              lengthCm: p,
              quantityPcs: q,
              volumeM3: Number(Number(vol).toFixed(4)),
              notes: i.batch || "",
            };
          });
          setItems(mappedItems);
        } else {
          setItems([createEmptyRow(), createEmptyRow()]);
        }
      }
      setPageLoading(false);
    }).catch((err: any) => {
      setError(err?.response?.data?.message || err.message || "Gagal memuat data surat muat");
      setPageLoading(false);
    });
  }, [params.id]);

  const calculateVolume = (t: number, l: number, p: number, qty: number) => {
    if (!t || !l || !p || !qty) return 0;
    return Number(((t * l * p * qty) / 1000000).toFixed(4));
  };

  const handleItemChange = (index: number, field: keyof TallyItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    const t = parseFloat(String(updated[index].thicknessCm).replace(",", ".")) || 0;
    const l = parseFloat(String(updated[index].widthCm).replace(",", ".")) || 0;
    const p = parseFloat(String(updated[index].lengthCm).replace(",", ".")) || 0;
    const q = parseInt(String(updated[index].quantityPcs)) || 0;

    if (field === 'thicknessCm' || field === 'widthCm') {
      if (t >= 10 || l >= 15) {
        updated[index].productCategory = "BALOK";
      } else if (t > 0 && l > 0 && t < 10 && l < 15) {
        updated[index].productCategory = "RENG";
      }
    }

    updated[index].volumeM3 = calculateVolume(t, l, p, q);
    setItems(updated);
  };

  const fillDown = (index: number, field: keyof TallyItem) => {
    if (index === 0) return;
    const prevValue = items[index - 1][field];
    handleItemChange(index, field, prevValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx === items.length - 1) {
        addItemRow();
      }
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(`input[data-row="${rowIdx + 1}"][data-field="${field}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 50);
    }
  };

  const addItemRow = () => {
    const last = items[items.length - 1];
    const newRow = createEmptyRow(last?.species || "MERANTI", last?.productCategory || "BALOK");
    setItems([...items, newRow]);
  };

  const addMultipleRows = (count: number = 5) => {
    const last = items[items.length - 1];
    const newRows = Array.from({ length: count }, () => 
      createEmptyRow(last?.species || "MERANTI", last?.productCategory || "BALOK")
    );
    setItems([...items, ...newRows]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([createEmptyRow()]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const validItems = items.filter(i => {
    const t = parseFloat(String(i.thicknessCm).replace(",", ".")) || 0;
    const l = parseFloat(String(i.widthCm).replace(",", ".")) || 0;
    const p = parseFloat(String(i.lengthCm).replace(",", ".")) || 0;
    const q = parseInt(String(i.quantityPcs)) || 0;
    return t > 0 && l > 0 && p > 0 && q > 0;
  });

  const totalPcs = validItems.reduce((sum, i) => sum + (parseInt(String(i.quantityPcs)) || 0), 0);
  const totalM3 = validItems.reduce((sum, i) => sum + (Number(i.volumeM3) || 0), 0);

  const selectedOriginWh = warehouses.find(w => w.id === form.warehouseId);
  const selectedDestWh = warehouses.find(w => w.id === form.destinationWarehouseId);

  const handleBack = () => {
    const targetPartai = linkedPartaiId || shipmentPartaiId;
    if (targetPartai) {
      router.push(`/inventory/partai/${targetPartai}?tab=shipment`);
    } else {
      router.push(`/inventory/shipment/${params.id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent, autoConfirm: boolean = false) => {
    e.preventDefault();
    setError("");

    if (!form.shipmentNumber?.trim()) {
      setError("Nomor surat muat / armada wajib diisi");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!form.policeNumber?.trim()) {
      setError("No. Polisi Kendaraan wajib diisi (contoh: L 8355 NA / KH 8916 GO)");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!form.driverName?.trim()) {
      setError("Nama supir / pengemudi wajib diisi");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!form.warehouseId) {
      setError("Pilih gudang asal muat terlebih dahulu");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (validItems.length === 0 || totalPcs <= 0) {
      setError("Tambahkan minimal satu baris muatan kayu dengan ukuran (T × L × P) dan jumlah Pcs > 0");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (form.warehouseId === form.destinationWarehouseId && form.destinationWarehouseId) {
      setError("Gudang asal dan gudang tujuan tidak boleh sama");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const destWhObj = warehouses.find(w => w.id === form.destinationWarehouseId);
      const destName = form.destinationName || (destWhObj ? destWhObj.name : "Tujuan Pengiriman");

      const targetPartai = linkedPartaiId || shipmentPartaiId || undefined;

      const payload = {
        shipmentNumber: form.shipmentNumber,
        fusoName: form.fusoName || form.shipmentNumber,
        policeNumber: form.policeNumber,
        driverName: form.driverName,
        shipmentDate: form.shipmentDate ? new Date(form.shipmentDate).toISOString() : new Date().toISOString(),
        warehouseId: form.warehouseId,
        destinationWarehouseId: form.destinationWarehouseId || undefined,
        destinationName: destName,
        destinationAddress: form.destinationAddress || (destWhObj?.address || ""),
        notes: form.notes,
        partaiId: targetPartai,
        autoConfirm: autoConfirm,
        items: validItems.map(i => {
          const t = parseFloat(String(i.thicknessCm).replace(",", ".")) || 0;
          const l = parseFloat(String(i.widthCm).replace(",", ".")) || 0;
          const p = parseFloat(String(i.lengthCm).replace(",", ".")) || 0;
          const q = parseInt(String(i.quantityPcs)) || 0;
          return {
            species: (i.species || "MERANTI").trim().toUpperCase(),
            productCategory: i.productCategory || "BALOK",
            thicknessMm: t * 10,
            widthMm: l * 10,
            lengthMm: p * 10,
            quantityPcs: q,
            volumeM3: Number(((t * l * p * q) / 1000000).toFixed(4)),
          };
        }),
      };

      await ShipmentAPI.updateShipment(shipmentId, payload);
      if (autoConfirm) {
        alert("Perubahan muatan Fuso berhasil disimpan dan stok otomatis dipindahkan!");
      }
      if (targetPartai) {
        router.push(`/inventory/partai/${targetPartai}?tab=shipment`);
      } else {
        router.push(`/inventory/shipment/${shipmentId}`);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || "Gagal memperbarui surat muat fuso";
      setError(errMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-8 md:p-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-20 px-4 md:px-6 box-border">
      
      {/* Master Species Datalist */}
      <datalist id="species-options">
        {speciesList.map((s, idx) => (
          <option key={s.id || idx} value={s.name || s.code} />
        ))}
        <option value="MERANTI" />
        <option value="BENGKIRAI" />
        <option value="KERUING" />
        <option value="KAPUR" />
        <option value="ULIN" />
        <option value="CAMPURAN" />
      </datalist>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Edit Surat Muat / Fuso: {form.shipmentNumber || form.fusoName}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit data armada, gudang tujuan, dan rincian ukuran batang kayu muatan.
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

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        
        {/* Warehouse Transfer Header Card */}
        <Card className="bg-card rounded-xl border border-border shadow-sm">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> Informasi Armada & Perpindahan Stok
              </span>
              {selectedOriginWh && selectedDestWh && (
                <Badge variant="outline" className="font-mono text-xs bg-amber-50 text-amber-700 border-amber-300">
                  {selectedOriginWh.name} ➔ {selectedDestWh.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">No. Surat Jalan / Muat</Label>
                <Input 
                  value={form.shipmentNumber} 
                  onChange={e => setForm({ ...form, shipmentNumber: e.target.value })} 
                  placeholder="e.g. SJM-2026-001" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Nama Armada / Fuso</Label>
                <Input 
                  value={form.fusoName} 
                  onChange={e => setForm({ ...form, fusoName: e.target.value })} 
                  placeholder="e.g. FUSO 01 / TRUK KALIMANTAN" 
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
                <Label className="text-xs uppercase font-bold text-muted-foreground">Tanggal Muat / Berangkat</Label>
                <Input 
                  type="date" 
                  value={form.shipmentDate} 
                  onChange={e => setForm({ ...form, shipmentDate: e.target.value })} 
                  required 
                />
              </div>

              {/* GUDANG ASAL */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <WarehouseIcon className="w-3.5 h-3.5" /> Gudang Asal (Kayu Berkurang)
                </Label>
                <Select 
                  value={form.warehouseId} 
                  onValueChange={(v: string | null) => setForm(f => ({ ...f, warehouseId: v || "" }))}
                >
                  <SelectTrigger className="font-semibold border-amber-300 dark:border-amber-700 bg-amber-50/20">
                    <SelectValue placeholder="Pilih gudang asal...">
                      {selectedOriginWh ? (selectedOriginWh.name || selectedOriginWh.code) : "Pilih gudang asal..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id} className="font-medium">
                        {w.name || w.code || w.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GUDANG TUJUAN */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <WarehouseIcon className="w-3.5 h-3.5" /> Gudang Tujuan (Kayu Bertambah)
                </Label>
                <Select 
                  value={form.destinationWarehouseId} 
                  onValueChange={(v: string | null) => {
                    const sel = warehouses.find(w => w.id === v);
                    setForm(f => ({ 
                      ...f, 
                      destinationWarehouseId: v || "",
                      destinationName: sel ? sel.name : f.destinationName 
                    }));
                  }}
                >
                  <SelectTrigger className="font-semibold border-emerald-300 dark:border-emerald-700 bg-emerald-50/20">
                    <SelectValue placeholder="Pilih gudang tujuan transfer...">
                      {selectedDestWh ? (selectedDestWh.name || selectedDestWh.code) : "Pilih gudang tujuan transfer..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem 
                        key={w.id} 
                        value={w.id} 
                        disabled={w.id === form.warehouseId}
                        className="font-medium"
                      >
                        {w.name || w.code || w.id} {w.id === form.warehouseId ? "(Gudang Asal)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Keterangan / Tujuan Eksternal</Label>
                <Input 
                  value={form.destinationName} 
                  onChange={e => setForm({ ...form, destinationName: e.target.value })} 
                  placeholder="e.g. Gudang Surabaya / Pembeli" 
                />
              </div>

              <div className="space-y-2 sm:col-span-2 md:col-span-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Catatan Tambahan</Label>
                <Input 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })} 
                  placeholder="e.g. Muatan ex Sampit / Kalteng via Pelabuhan Kumai" 
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Excel Spreadsheet Style Tally Input Table */}
        <Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" /> Rincian Ukuran & Batang Kayu Dimuat
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Ketik ukuran Tebal (T), Lebar (L), Panjang (P), dan Jumlah Pcs. Volume M³ dihitung otomatis sesuai rumus industri kayu: (T × L × P × Pcs) / 1.000.000.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={addItemRow} size="sm" variant="outline" className="font-semibold text-xs h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
              </Button>
              <Button type="button" onClick={() => addMultipleRows(5)} size="sm" variant="secondary" className="font-semibold text-xs h-8">
                +5 Baris
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="min-w-[950px] w-full text-xs sm:text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2.5 text-center w-12 font-semibold">No</th>
                    <th className="p-2.5 text-left w-48 font-semibold">Jenis Kayu</th>
                    <th className="p-2.5 text-left w-36 font-semibold">Kategori</th>
                    <th className="p-2.5 text-center w-24 font-semibold">Tebal (cm)</th>
                    <th className="p-2.5 text-center w-24 font-semibold">Lebar (cm)</th>
                    <th className="p-2.5 text-center w-28 font-semibold">Panjang (cm)</th>
                    <th className="p-2.5 text-center w-28 font-semibold">Pcs (Batang)</th>
                    <th className="p-2.5 text-right w-36 font-semibold">Volume (M³)</th>
                    <th className="p-2.5 text-center w-14 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rowM3 = Number(item.volumeM3 || 0);

                    return (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-2 text-center text-muted-foreground font-semibold">
                          {idx + 1}
                        </td>

                        {/* Jenis Kayu (Species) */}
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Input 
                              list="species-options"
                              data-row={idx}
                              data-field="species"
                              value={item.species} 
                              onChange={e => handleItemChange(idx, 'species', e.target.value.toUpperCase())}
                              onKeyDown={e => handleKeyDown(e, idx, 'species')}
                              className="h-9 text-xs font-semibold uppercase" 
                              placeholder="MERANTI"
                            />
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => fillDown(idx, 'species')} 
                                title="Samakan dengan baris atasnya (Fill Down)"
                                className="h-7 w-6 text-muted-foreground hover:text-foreground text-[11px] p-0 shrink-0 border rounded flex items-center justify-center bg-muted/40"
                              >
                                ↓
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Kategori Kayu */}
                        <td className="p-2">
                          <Select 
                            value={item.productCategory} 
                            onValueChange={(v: string | null) => handleItemChange(idx, 'productCategory', v || 'BALOK')}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BALOK">Balok / Main</SelectItem>
                              <SelectItem value="RENG">Reng / Papan</SelectItem>
                              <SelectItem value="AFKIR_BS">Afkir / BS</SelectItem>
                              <SelectItem value="AIR_DRY">Air Dry (AD)</SelectItem>
                              <SelectItem value="FJL">FJL</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Tebal cm */}
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              step="0.1" 
                              data-row={idx}
                              data-field="thicknessCm"
                              placeholder="T"
                              value={item.thicknessCm} 
                              onChange={e => handleItemChange(idx, 'thicknessCm', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, idx, 'thicknessCm')}
                              className="h-9 text-center text-xs font-mono font-semibold" 
                            />
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => fillDown(idx, 'thicknessCm')} 
                                title="Copy dari atas"
                                className="h-7 w-5 text-muted-foreground text-[10px] shrink-0 border rounded flex items-center justify-center bg-muted/40"
                              >
                                ↓
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Lebar cm */}
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              step="0.1" 
                              data-row={idx}
                              data-field="widthCm"
                              placeholder="L"
                              value={item.widthCm} 
                              onChange={e => handleItemChange(idx, 'widthCm', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, idx, 'widthCm')}
                              className="h-9 text-center text-xs font-mono font-semibold" 
                            />
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => fillDown(idx, 'widthCm')} 
                                title="Copy dari atas"
                                className="h-7 w-5 text-muted-foreground text-[10px] shrink-0 border rounded flex items-center justify-center bg-muted/40"
                              >
                                ↓
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Panjang cm */}
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              step="1" 
                              data-row={idx}
                              data-field="lengthCm"
                              placeholder="P"
                              value={item.lengthCm} 
                              onChange={e => handleItemChange(idx, 'lengthCm', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, idx, 'lengthCm')}
                              className="h-9 text-center text-xs font-mono font-semibold" 
                            />
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => fillDown(idx, 'lengthCm')} 
                                title="Copy dari atas"
                                className="h-7 w-5 text-muted-foreground text-[10px] shrink-0 border rounded flex items-center justify-center bg-muted/40"
                              >
                                ↓
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Pcs Dimuat */}
                        <td className="p-2">
                          <Input 
                            type="number" 
                            min="1" 
                            data-row={idx}
                            data-field="quantityPcs"
                            placeholder="Qty"
                            value={item.quantityPcs} 
                            onChange={e => handleItemChange(idx, 'quantityPcs', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, idx, 'quantityPcs')}
                            className="h-9 text-center font-bold text-xs" 
                          />
                        </td>

                        {/* Volume M3 */}
                        <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {rowM3 > 0 ? rowM3.toFixed(4) : "-"}
                        </td>

                        {/* Aksi Hapus */}
                        <td className="p-2 text-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeItemRow(idx)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t-2 border-border">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-xs">
                      TOTAL HASIL KUBIKASI MUATAN FUSO:
                    </td>
                    <td className="p-3 text-center font-bold text-foreground text-sm">
                      {totalPcs.toLocaleString("id-ID")} Pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      {Number(totalM3.toFixed(4))} M³
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card & Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Truck className="w-6 h-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                Total Muatan: {Number(totalM3.toFixed(4))} M³ ({totalPcs} Batang Kayu)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedOriginWh ? selectedOriginWh.name : "Gudang Asal"} berkurang <strong className="text-amber-600">{Number(totalM3.toFixed(4))} M³</strong> 
                {selectedDestWh ? ` ➔ ${selectedDestWh.name} bertambah ${Number(totalM3.toFixed(4))} M³` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack} 
              className="font-semibold"
            >
              Batal
            </Button>

            {/* Simpan Perubahan */}
            <Button 
              type="submit" 
              disabled={loading} 
              variant="secondary"
              className="font-semibold border shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>

            {/* Simpan & Pindahkan Stok Sekarang */}
            <Button 
              type="button" 
              disabled={loading} 
              onClick={(e) => handleSubmit(e, true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Simpan & Pindahkan Stok Sekarang
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
