"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api, MasterDataAPI, PartaiAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


  const calculateLogVolume = (length: number, d1: number, d2: number, rtManual?: number) => {
    if (!length) return 0;
    // Calculate average diameter (RT) if not explicitly provided
    let rt = typeof rtManual === "number" && rtManual > 0 ? rtManual : 0;
    if (!rt) {
      if (d1 > 0 && d2 > 0) {
        rt = (d1 + d2) / 2;
      } else {
        rt = d1 || d2 || 0;
      }
    }
    if (rt <= 0) return 0;

    // Length in cm (if <= 50, assumed in meters so convert to cm)
    const lengthCm = length <= 50 ? length * 100 : length;
    // User formula: (Panjang cm * RT * RT) / 1.000.000
    return Number(((lengthCm * rt * rt) / 1000000).toFixed(4));
  };


const SearchableSelect = ({ value, onChange, options, placeholder, onAdd }: any) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((o: any) => o.value === value)

  return (
    <div className="flex gap-2 w-full">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-10 flex-1 justify-between items-center px-3 py-2 bg-background border border-input rounded-md text-sm font-normal hover:bg-accent hover:text-accent-foreground">
          {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={"Cari..."} />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {options.map((option: any) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    {onAdd && (
      <Button type="button" variant="outline" onClick={onAdd} title="Tambah Baru" className="px-3"><Plus className="w-4 h-4" /></Button>
    )}
    </div>
  )
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partaiIdFromUrl = searchParams.get('partaiId') || '';
  const typeFromUrl = searchParams.get('type') || '';
  const initialPurchaseType = (typeFromUrl === 'raw-log' || typeFromUrl === 'log') ? 'raw-log' : 'sawn-timber';

  const [partais, setPartais] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [speciesList, setSpeciesList] = useState<any[]>([])
  const [gradeList, setGradeList] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (partaiIdFromUrl) {
      setForm(prev => ({ ...prev, partaiId: partaiIdFromUrl }));
    }
    if (typeFromUrl === 'raw-log' || typeFromUrl === 'log') {
      setForm(prev => ({ ...prev, purchaseType: 'raw-log' }));
    } else if (typeFromUrl === 'sawn-timber') {
      setForm(prev => ({ ...prev, purchaseType: 'sawn-timber' }));
    }
  }, [partaiIdFromUrl, typeFromUrl]);

  const handleBack = () => {
    const targetPartaiId = searchParams.get('partaiId') || form.partaiId;
    const fromTab = searchParams.get('tab') || (form.purchaseType === 'raw-log' ? 'rawlogs' : 'purchase');
    if (targetPartaiId) {
      router.push(`/inventory/partai/${targetPartaiId}?tab=${fromTab}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push('/inventory/partai');
    }
  };
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [activeVariantRowIndex, setActiveVariantRowIndex] = useState<number>(0)
  const [newVariant, setNewVariant] = useState({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" })
  const [creatingVariant, setCreatingVariant] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
  const [creatingSupplier, setCreatingSupplier] = useState(false)

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplierName) return;
    setCreatingSupplier(true)
    try {
      const res = await api.post('/inventory/master-data/timber-source', { name: newSupplierName, code: "SUP-" + Math.floor(Math.random() * 10000), type: "SUPPLIER" })
      setSources([res.data, ...sources])
      setForm({...form, sourceId: res.data.id})
      setIsSupplierModalOpen(false)
      setNewSupplierName("")
    } catch (err: any) {
      console.error(err)
    } finally {
      setCreatingSupplier(false)
    }
  }

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVariant.species) {
      alert("Silakan pilih Species (Jenis Kayu)")
      return
    }
    if (!newVariant.grade) {
      alert("Silakan pilih Grade (Kualitas)")
      return
    }
    setCreatingVariant(true)
    try {
      const payload = {
        species: (newVariant.species || "").trim().toUpperCase(),
        speciesId: newVariant.speciesId || undefined,
        grade: (newVariant.grade || "").trim().toUpperCase(),
        gradeId: newVariant.gradeId || undefined,
        thickness: Number(newVariant.thickness || 0),
        width: Number(newVariant.width || 0),
        length: Number(newVariant.length || 0),
      }

      // Check if this variant already exists in local list
      const existingLocal = variants.find(v =>
        (v.species || "").trim().toUpperCase() === payload.species &&
        (v.grade || "").trim().toUpperCase() === payload.grade &&
        Number(v.thickness || 0) === payload.thickness &&
        Number(v.width || 0) === payload.width &&
        Number(v.length || 0) === payload.length
      );

      if (existingLocal) {
        const newItems = [...form.items];
        const targetIdx = activeVariantRowIndex >= 0 && activeVariantRowIndex < newItems.length ? activeVariantRowIndex : 0;
        if (newItems[targetIdx]) {
          newItems[targetIdx].timberVariantId = existingLocal.id;
          newItems[targetIdx].purchaseThickness = existingLocal.thickness || payload.thickness;
          newItems[targetIdx].purchaseWidth = existingLocal.width || payload.width;
          newItems[targetIdx].purchaseLength = existingLocal.length || payload.length;
          newItems[targetIdx].volumeM3 = (existingLocal.volumePerPiece || 0) * (newItems[targetIdx].quantityPcs || 1);
          setForm(prev => ({ ...prev, items: newItems }));
        }
        setIsVariantModalOpen(false);
        setNewVariant({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" });
        return;
      }

      let res: any = null;
      try {
        res = await MasterDataAPI.createTimberVariant(payload);
      } catch (apiErr: any) {
        const errMsg = apiErr?.response?.data?.message || apiErr.message || "";
        if (errMsg.includes("duplikat") || errMsg.includes("DUPLICATE_ENTRY") || errMsg.includes("terdaftar")) {
          const freshData = await MasterDataAPI.getTimberVariants().catch(() => []);
          const freshList = Array.isArray(freshData) ? freshData : freshData?.data || [];
          setVariants(freshList);

          const found = freshList.find((v: any) =>
            (v.species || "").trim().toUpperCase() === payload.species &&
            (v.grade || "").trim().toUpperCase() === payload.grade &&
            Number(v.thickness || 0) === payload.thickness &&
            Number(v.width || 0) === payload.width &&
            Number(v.length || 0) === payload.length
          ) || freshList.find((v: any) =>
            (v.sku || "").toUpperCase().includes(payload.species) &&
            Number(v.thickness || 0) === payload.thickness &&
            Number(v.width || 0) === payload.width &&
            Number(v.length || 0) === payload.length
          ) || freshList.find((v: any) => (v.sku || "").toUpperCase() === `${payload.species}-${payload.grade}-${payload.thickness}X${payload.width}X${payload.length}`)
          || freshList.find((v: any) => (v.sku || "").toUpperCase() === `${payload.species}-${payload.grade}-${payload.thickness}x${payload.width}x${payload.length}`);

          if (found) {
            res = found;
          } else {
            alert("Master produk kayu dengan ukuran ini sudah ada di database, silakan pilih langsung dari dropdown.");
            return;
          }
        } else {
          alert("Gagal menyimpan master kayu: " + errMsg);
          return;
        }
      }

      if (res && res.id) {
        setVariants(prev => {
          const exists = prev.some(v => v.id === res.id);
          return exists ? prev.map(v => v.id === res.id ? res : v) : [res, ...prev];
        });

        const newItems = [...form.items];
        const targetIdx = activeVariantRowIndex >= 0 && activeVariantRowIndex < newItems.length ? activeVariantRowIndex : 0;
        if (newItems[targetIdx]) {
          newItems[targetIdx].timberVariantId = res.id;
          newItems[targetIdx].purchaseThickness = res.thickness || payload.thickness;
          newItems[targetIdx].purchaseWidth = res.width || payload.width;
          newItems[targetIdx].purchaseLength = res.length || payload.length;
          newItems[targetIdx].volumeM3 = (res.volumePerPiece || 0) * (newItems[targetIdx].quantityPcs || 1);
          setForm(prev => ({ ...prev, items: newItems }));
        }

        setIsVariantModalOpen(false)
        setNewVariant({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" })
      }
    } catch (err: any) {
      console.error("Failed to create variant", err)
      alert("Gagal menyimpan master kayu: " + (err?.response?.data?.message || err.message || "Pastikan koneksi server tersedia"));
    } finally {
      setCreatingVariant(false)
    }
  }
  
  const [form, setForm] = useState({
    partaiId: partaiIdFromUrl,
    purchaseNumber: "PO-" + Date.now().toString().slice(-6),
    purchaseDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    sourceId: "",
    warehouseId: "",
    notes: "",
    purchaseType: initialPurchaseType,
    status: "DRAFT",
    items: [{ 
      species: "BKR",
      grade: "A",
      timberVariantId: "", 
      quantityPcs: 1, 
      volumeM3: 0, 
      purchaseThickness: 0, 
      purchaseWidth: 0, 
      purchaseLength: 400, 
      unitPrice: 0 
    }],
    logItems: [{
      logNumber: "",
      species: "",
      purchaseLength: 0,
      purchaseDiameter1: 0,
      purchaseDiameter2: 0,
      purchaseDiameterAvg: 0,
      purchaseVolume: 0
    }]
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [srcRes, whRes, varRes, specRes, gradeRes, partaisRes] = await Promise.all([
          api.get("/inventory/master-data/timber-source").catch(() => ({ data: [] })),
          api.get("/inventory/warehouses").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-variant").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-species").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-grade").catch(() => ({ data: [] })),
          PartaiAPI.getPartais().catch(() => [])
        ]);

        const rawSrc = srcRes?.data?.data || srcRes?.data || [];
        const rawWh = whRes?.data?.data || whRes?.data || [];
        const rawVar = varRes?.data?.data || varRes?.data || [];
        const rawSpec = specRes?.data?.data || specRes?.data || [];
        const rawGrade = gradeRes?.data?.data || gradeRes?.data || [];
        const rawPartais = Array.isArray(partaisRes) ? partaisRes : partaisRes?.data || [];

        setSources(Array.isArray(rawSrc) ? rawSrc : []);
        setWarehouses(Array.isArray(rawWh) ? rawWh : []);
        setVariants(Array.isArray(rawVar) ? rawVar : []);
        setSpeciesList(Array.isArray(rawSpec) ? rawSpec : []);
        setGradeList(Array.isArray(rawGrade) ? rawGrade : []);
        setPartais(rawPartais);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!form.partaiId) {
      setError("Silakan pilih Partai / Project terlebih dahulu agar pembelian tercatat di manajemen partai.")
      setLoading(false)
      return
    }
    
    try {
      await api.post("/inventory/timber-purchase", {
        purchaseNumber: form.purchaseNumber,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        sourceId: form.sourceId,
        warehouseId: form.warehouseId,
        notes: form.notes,
        partaiId: form.partaiId,
        status: form.purchaseType === "raw-log" ? "RECEIVED" : form.status,
        isReceived: form.purchaseType === "raw-log" ? true : undefined,
        items: form.purchaseType === "sawn-timber" ? form.items : [],
        logItems: form.purchaseType === "raw-log" ? form.logItems.map((li, idx) => ({
          ...li,
          logNumber: li.logNumber?.trim() || `LOG-${form.purchaseNumber}-${idx + 1}`,
          species: li.species || 'UNKNOWN',
          purchaseLength: Number(li.purchaseLength || 0),
          purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
          purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
          purchaseDiameter3: Number((li as any).purchaseDiameter3 || 0),
          purchaseDiameter4: Number((li as any).purchaseDiameter4 || 0),
          purchaseVolume: Number(li.purchaseVolume || 0)
        })) : []
      })
      const targetTab = searchParams.get('tab') || (form.purchaseType === "raw-log" ? "rawlogs" : "purchase");
      router.push(`/inventory/partai/${form.partaiId}?tab=${targetTab}`)
      router.refresh()
    } catch (err: any) {
      setError((err.response?.data?.error?.message || err.response?.data?.message) || "Failed to create purchase")
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Buat Purchase (Pembelian Kayu)</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold text-foreground flex items-center justify-between">
                <span>Partai / Project *</span>
                {form.partaiId && (
                  <span className="text-xs text-primary font-normal">
                    Pembelian otomatis tercatat di partai ini
                  </span>
                )}
              </Label>
              <Select value={form.partaiId} onValueChange={val => setForm({...form, partaiId: val || ""})} required>
                <SelectTrigger className="font-medium h-10 border-primary/40">
                  <SelectValue placeholder="Pilih Partai / Project">
                    {(() => {
                      const p = partais.find(item => item.id === form.partaiId);
                      if (p) return `${p.code} - ${p.name || 'Tanpa Nama'}`;
                      return form.partaiId ? "Memuat data partai..." : "Pilih Partai / Project";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {partais.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name || 'Tanpa Nama'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.partaiId && (
                <p className="text-[12px] text-destructive font-medium">
                  Wajib memilih Partai agar pembelian otomatis tercatat di Manajemen Partai.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor PO</Label>
                <Input value={form.purchaseNumber} onChange={e => setForm({...form, purchaseNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pembelian</Label>
                <Input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Supplier / Sumber Kayu</Label>
                <Select value={form.sourceId} onValueChange={val => setForm({...form, sourceId: val || ""})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Supplier">
                      {(() => {
                        const s = sources.find(item => item.id === form.sourceId);
                        if (s) return s.name ? `${s.name}${s.code ? ` (${s.code})` : ''}` : (s.code || s.id);
                        return form.sourceId ? "Memuat supplier..." : "Pilih Supplier";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name ? `${s.name}${s.code ? ` (${s.code})` : ''}` : (s.code || s.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gudang Penerima</Label>
                <Select value={form.warehouseId} onValueChange={val => setForm({...form, warehouseId: val || ""})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gudang">
                      {(() => {
                        const w = warehouses.find(item => item.id === form.warehouseId);
                        if (w) return w.name ? `${w.name}${w.code ? ` (${w.code})` : ''}` : (w.code || w.id);
                        return form.warehouseId ? "Memuat gudang..." : "Pilih Gudang";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name ? `${w.name}${w.code ? ` (${w.code})` : ''}` : (w.code || w.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Status Penerimaan Barang *</Label>
                <Select value={form.status} onValueChange={val => setForm({...form, status: val || "RECEIVED"})}>
                  <SelectTrigger className="font-medium h-10 border-emerald-300 dark:border-emerald-800">
                    <SelectValue placeholder="Pilih Status Penerimaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Sudah Diterima (Langsung Masuk Stok)
                      </span>
                    </SelectItem>
                    <SelectItem value="DRAFT">
                      <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        Belum Diterima (Draft / Pending)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-muted-foreground">
                  {form.purchaseType === 'raw-log' ? (
                    form.status === 'RECEIVED' 
                      ? "✓ Data log bulat akan langsung tercatat dan masuk ke DUKB partai saat disimpan." 
                      : "⏳ Log disimpan sebagai DRAFT (dapat diukur ulang / diverifikasi di tab DUKB)."
                  ) : (
                    form.status === 'RECEIVED' 
                      ? "✓ Stok sawn timber akan langsung otomatis bertambah ke gudang saat disimpan." 
                      : "⏳ Stok belum bertambah. Dapat diterima nanti via tombol 'Terima Barang'."
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Catatan (Notes)</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan pembelian..." className="h-10" />
              </div>
            </div>

            <Tabs value={form.purchaseType} onValueChange={(v) => setForm({...form, purchaseType: v})} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/70 border border-border">
                <TabsTrigger 
                  value="raw-log" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-base">🪵</span>
                  <span>Beli Log Bulat (Raw Log / DUKB)</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sawn-timber" 
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-base">🌲</span>
                  <span>Beli Kayu Olahan (Sawn Timber)</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sawn-timber" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span>📋 Tally Sheet Pembelian Sawn Timber (Beli Masak)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input langsung ukuran fisik surat jalan supplier (Panjang, Tebal, Lebar dlm cm). Volume m³ dihitung otomatis dengan rumus sawmill: (P × T × L × PCS) / 1.000.000.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const last = form.items[form.items.length - 1];
                        setForm(prev => ({
                          ...prev,
                          items: [
                            ...prev.items,
                            {
                              species: last?.species || "BKR",
                              grade: last?.grade || "A",
                              timberVariantId: "",
                              quantityPcs: 1,
                              volumeM3: 0,
                              purchaseThickness: last?.purchaseThickness || 0,
                              purchaseWidth: last?.purchaseWidth || 0,
                              purchaseLength: last?.purchaseLength || 400,
                              unitPrice: last?.unitPrice || 0,
                            }
                          ]
                        }));
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> +1 Baris
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const last = form.items[form.items.length - 1];
                        const newRows = Array.from({ length: 5 }).map(() => ({
                          species: last?.species || "BKR",
                          grade: last?.grade || "A",
                          timberVariantId: "",
                          quantityPcs: 1,
                          volumeM3: 0,
                          purchaseThickness: last?.purchaseThickness || 0,
                          purchaseWidth: last?.purchaseWidth || 0,
                          purchaseLength: last?.purchaseLength || 400,
                          unitPrice: last?.unitPrice || 0,
                        }));
                        setForm(prev => ({
                          ...prev,
                          items: [...prev.items, ...newRows]
                        }));
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> +5 Baris
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <strong>Pencatatan Surat Jalan Supplier:</strong> Data pembelian sawn timber ini tersimpan sebagai draft pemesanan/surat jalan. 
                    <strong> Stok fisik sawn timber belum bertambah</strong> sebelum barang tiba di pabrik dan dihitung ulang (tally kedatangan).
                  </div>
                </div>

                {/* TALLY SHEET GRID TABLE */}
                <div className="overflow-x-auto border rounded-xl shadow-sm bg-card">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60 border-b text-muted-foreground font-semibold">
                        <th className="py-2.5 px-2 text-center w-10">No</th>
                        <th className="py-2.5 px-2 text-left w-24">Jenis</th>
                        <th className="py-2.5 px-2 text-center w-24">P (cm)</th>
                        <th className="py-2.5 px-2 text-center w-24">T (cm)</th>
                        <th className="py-2.5 px-2 text-center w-24">L (cm)</th>
                        <th className="py-2.5 px-2 text-center w-20">Pcs</th>
                        <th className="py-2.5 px-2 text-right w-28 text-emerald-700 dark:text-emerald-400 font-bold">Vol (m³)</th>
                        <th className="py-2.5 px-2 text-right w-28">Harga / m³</th>
                        <th className="py-2.5 px-2 text-right w-28">Subtotal</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {form.items.map((item: any, index: number) => {
                        const p = Number(item.purchaseLength || 0);
                        const t = Number(item.purchaseThickness || 0);
                        const l = Number(item.purchaseWidth || 0);
                        const pcs = Number(item.quantityPcs || 0);
                        const vol = (p > 0 && t > 0 && l > 0 && pcs > 0)
                          ? Number(((p * t * l * pcs) / 1000000).toFixed(4))
                          : Number(item.volumeM3 || 0);
                        const subtotal = item.unitPrice ? Math.round(vol * Number(item.unitPrice)) : 0;

                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="py-1 px-2 text-center font-mono text-muted-foreground font-medium">
                              {index + 1}
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                value={item.species || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  newItems[index].species = e.target.value.toUpperCase();
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="cth: BKR"
                                className="h-8 text-xs font-bold uppercase"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                step="any"
                                value={item.purchaseLength || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  const val = parseFloat(e.target.value) || 0;
                                  newItems[index].purchaseLength = val;
                                  const thick = Number(newItems[index].purchaseThickness || 0);
                                  const wid = Number(newItems[index].purchaseWidth || 0);
                                  const count = Number(newItems[index].quantityPcs || 0);
                                  if (val > 0 && thick > 0 && wid > 0 && count > 0) {
                                    newItems[index].volumeM3 = Number(((val * thick * wid * count) / 1000000).toFixed(4));
                                  }
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="cth: 400"
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                step="any"
                                value={item.purchaseThickness || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  const val = parseFloat(e.target.value) || 0;
                                  newItems[index].purchaseThickness = val;
                                  const len = Number(newItems[index].purchaseLength || 0);
                                  const wid = Number(newItems[index].purchaseWidth || 0);
                                  const count = Number(newItems[index].quantityPcs || 0);
                                  if (len > 0 && val > 0 && wid > 0 && count > 0) {
                                    newItems[index].volumeM3 = Number(((len * val * wid * count) / 1000000).toFixed(4));
                                  }
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="cth: 12"
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                step="any"
                                value={item.purchaseWidth || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  const val = parseFloat(e.target.value) || 0;
                                  newItems[index].purchaseWidth = val;
                                  const len = Number(newItems[index].purchaseLength || 0);
                                  const thick = Number(newItems[index].purchaseThickness || 0);
                                  const count = Number(newItems[index].quantityPcs || 0);
                                  if (len > 0 && thick > 0 && val > 0 && count > 0) {
                                    newItems[index].volumeM3 = Number(((len * thick * val * count) / 1000000).toFixed(4));
                                  }
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="cth: 25"
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantityPcs || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  const val = parseInt(e.target.value) || 0;
                                  newItems[index].quantityPcs = val;
                                  const len = Number(newItems[index].purchaseLength || 0);
                                  const thick = Number(newItems[index].purchaseThickness || 0);
                                  const wid = Number(newItems[index].purchaseWidth || 0);
                                  if (len > 0 && thick > 0 && wid > 0 && val > 0) {
                                    newItems[index].volumeM3 = Number(((len * thick * wid * val) / 1000000).toFixed(4));
                                  }
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="Pcs"
                                className="h-8 text-xs text-center font-bold"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                step="0.0001"
                                value={item.volumeM3 !== undefined ? item.volumeM3 : vol}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  newItems[index].volumeM3 = parseFloat(e.target.value) || 0;
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="0.0000"
                                className="h-8 text-xs text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                type="number"
                                min="0"
                                value={item.unitPrice || ""}
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                  setForm({ ...form, items: newItems });
                                }}
                                placeholder="Rp / m³"
                                className="h-8 text-xs text-right font-mono"
                              />
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-semibold text-foreground">
                              {subtotal > 0 ? `Rp ${subtotal.toLocaleString("id-ID")}` : "-"}
                            </td>
                            <td className="py-1 px-2 text-center">
                              {form.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                                  }}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                  title="Hapus Baris"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-right">TOTAL KESELURUHAN:</td>
                        <td className="py-2.5 px-2 text-center font-bold text-foreground">
                          {form.items.reduce((sum, it) => sum + (Number(it.quantityPcs) || 0), 0)} Pcs
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {form.items.reduce((sum, it) => {
                            const p = Number(it.purchaseLength || 0);
                            const t = Number(it.purchaseThickness || 0);
                            const l = Number(it.purchaseWidth || 0);
                            const pcs = Number(it.quantityPcs || 0);
                            const v = (it.volumeM3 !== undefined && it.volumeM3 > 0)
                              ? Number(it.volumeM3)
                              : ((p > 0 && t > 0 && l > 0 && pcs > 0) ? (p * t * l * pcs) / 1000000 : 0);
                            return sum + v;
                          }, 0).toFixed(4)} m³
                        </td>
                        <td colSpan={3} className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          Rp {form.items.reduce((sum, it) => {
                            const p = Number(it.purchaseLength || 0);
                            const t = Number(it.purchaseThickness || 0);
                            const l = Number(it.purchaseWidth || 0);
                            const pcs = Number(it.quantityPcs || 0);
                            const v = (it.volumeM3 !== undefined && it.volumeM3 > 0)
                              ? Number(it.volumeM3)
                              : ((p > 0 && t > 0 && l > 0 && pcs > 0) ? (p * t * l * pcs) / 1000000 : 0);
                            const pr = Number(it.unitPrice || 0);
                            return sum + Math.round(v * pr);
                          }, 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const last = form.items[form.items.length - 1];
                      setForm(prev => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          {
                            species: last?.species || "BKR",
                            grade: last?.grade || "A",
                            timberVariantId: "",
                            quantityPcs: 1,
                            volumeM3: 0,
                            purchaseThickness: last?.purchaseThickness || 0,
                            purchaseWidth: last?.purchaseWidth || 0,
                            purchaseLength: last?.purchaseLength || 400,
                            unitPrice: last?.unitPrice || 0,
                          }
                        ]
                      }));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah 1 Baris Tally
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => {
                      const last = form.items[form.items.length - 1];
                      const newRows = Array.from({ length: 5 }).map(() => ({
                        species: last?.species || "BKR",
                        grade: last?.grade || "A",
                        timberVariantId: "",
                        quantityPcs: 1,
                        volumeM3: 0,
                        purchaseThickness: last?.purchaseThickness || 0,
                        purchaseWidth: last?.purchaseWidth || 0,
                        purchaseLength: last?.purchaseLength || 400,
                        unitPrice: last?.unitPrice || 0,
                      }));
                      setForm(prev => ({
                        ...prev,
                        items: [...prev.items, ...newRows]
                      }));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah 5 Baris Tally
                  </Button>
                </div>

              </TabsContent>

              <TabsContent value="raw-log" className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3 className="font-bold text-lg">Daftar Raw Logs (DUKB)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input ukuran log bulat: Panjang, Ø Pangkal (D1), Ø Ujung (D2), dan Diameter Rata-rata <strong>(RT)</strong>. Rumus Volume m³: (Panjang × RT × RT) / 1.000.000.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const last = form.logItems[form.logItems.length - 1];
                      setForm({ 
                        ...form, 
                        logItems: [
                          ...form.logItems, 
                          { 
                            logNumber: "", 
                            species: last?.species || (speciesList[0]?.name || ""), 
                            purchaseLength: last?.purchaseLength || 400, 
                            purchaseDiameter1: 0, 
                            purchaseDiameter2: 0, 
                            purchaseDiameterAvg: 0,
                            purchaseVolume: 0 
                          }
                        ] 
                      });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> +1 Log
                  </Button>
                </div>
                {form.logItems.map((item, index) => {
                  const currentRt = item.purchaseDiameterAvg || ((item.purchaseDiameter1 > 0 && item.purchaseDiameter2 > 0) ? Math.round(((item.purchaseDiameter1 + item.purchaseDiameter2) / 2) * 10) / 10 : (item.purchaseDiameter1 || item.purchaseDiameter2 || 0));
                  return (
                    <div key={index} className="border border-border rounded-lg p-4 bg-muted/10 relative">
                      <div className="absolute top-2 right-2">
                        {form.logItems.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                            setForm({ ...form, logItems: form.logItems.filter((_, i) => i !== index) });
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-2 pr-6">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">No Log</Label>
                          <Input 
                            value={item.logNumber} 
                            placeholder={`LOG-${index + 1}`}
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              newLogItems[index].logNumber = e.target.value;
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Spesies</Label>
                          <Select value={item.species} onValueChange={(val: any) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].species = val;
                            setForm({ ...form, logItems: newLogItems });
                          }}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih Spesies" /></SelectTrigger>
                            <SelectContent>
                              {speciesList.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Panjang (cm / m)</Label>
                          <Input 
                            type="number" 
                            step="any" 
                            value={item.purchaseLength || ""} 
                            placeholder="cth: 400 cm / 4 m"
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              const len = parseFloat(e.target.value) || 0;
                              newLogItems[index].purchaseLength = len;
                              const d1 = newLogItems[index].purchaseDiameter1 || 0;
                              const d2 = newLogItems[index].purchaseDiameter2 || 0;
                              const rt = newLogItems[index].purchaseDiameterAvg || ((d1 > 0 && d2 > 0) ? (d1 + d2) / 2 : (d1 || d2 || 0));
                              newLogItems[index].purchaseVolume = calculateLogVolume(len, d1, d2, rt);
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">&Oslash; Pangkal D1 (cm)</Label>
                          <Input 
                            type="number" 
                            step="any" 
                            value={item.purchaseDiameter1 || ""} 
                            placeholder="D1 cm"
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              const d1 = parseFloat(e.target.value) || 0;
                              newLogItems[index].purchaseDiameter1 = d1;
                              const d2 = newLogItems[index].purchaseDiameter2 || 0;
                              const calcRt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
                              newLogItems[index].purchaseDiameterAvg = calcRt;
                              newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, d1, d2, calcRt);
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">&Oslash; Ujung D2 (cm)</Label>
                          <Input 
                            type="number" 
                            step="any" 
                            value={item.purchaseDiameter2 || ""} 
                            placeholder="D2 cm"
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              const d2 = parseFloat(e.target.value) || 0;
                              newLogItems[index].purchaseDiameter2 = d2;
                              const d1 = newLogItems[index].purchaseDiameter1 || 0;
                              const calcRt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
                              newLogItems[index].purchaseDiameterAvg = calcRt;
                              newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, d1, d2, calcRt);
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5 bg-blue-50/50 dark:bg-blue-950/20 p-1 rounded-md border border-blue-200/50 dark:border-blue-800/40">
                          <Label className="text-xs font-bold text-blue-700 dark:text-blue-300">RT (cm)</Label>
                          <Input 
                            type="number" 
                            step="any" 
                            value={item.purchaseDiameterAvg || (currentRt > 0 ? currentRt : "")} 
                            placeholder="Rata2 cm"
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              const customRt = parseFloat(e.target.value) || 0;
                              newLogItems[index].purchaseDiameterAvg = customRt;
                              newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2, customRt);
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-background"
                            title="Diameter Rata-rata (RT)"
                          />
                        </div>
                        <div className="space-y-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 p-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                          <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Vol (m³)</Label>
                          <Input 
                            type="number" 
                            step="0.0001" 
                            value={item.purchaseVolume || ""} 
                            placeholder="m³"
                            onChange={(e) => {
                              const newLogItems = [...form.logItems];
                              newLogItems[index].purchaseVolume = parseFloat(e.target.value) || 0;
                              setForm({ ...form, logItems: newLogItems });
                            }} 
                            className="h-9 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => {
                    const last = form.logItems[form.logItems.length - 1];
                    setForm({ 
                      ...form, 
                      logItems: [
                        ...form.logItems, 
                        { 
                          logNumber: "", 
                          species: last?.species || (speciesList[0]?.name || ""), 
                          purchaseLength: last?.purchaseLength || 400, 
                          purchaseDiameter1: 0, 
                          purchaseDiameter2: 0, 
                          purchaseDiameterAvg: 0,
                          purchaseVolume: 0 
                        }
                      ] 
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah 1 Raw Log
                  </Button>
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => {
                    const last = form.logItems[form.logItems.length - 1];
                    const newRows = Array.from({ length: 5 }).map(() => ({
                      logNumber: "",
                      species: last?.species || (speciesList[0]?.name || ""),
                      purchaseLength: last?.purchaseLength || 400,
                      purchaseDiameter1: 0,
                      purchaseDiameter2: 0,
                      purchaseDiameterAvg: 0,
                      purchaseVolume: 0,
                    }));
                    setForm({ ...form, logItems: [...form.logItems, ...newRows] });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah 5 Raw Log
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Pembelian"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



