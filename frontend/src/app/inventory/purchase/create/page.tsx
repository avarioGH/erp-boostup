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


  const calculateLogVolume = (length: number, d1: number, d2: number) => {
    if (!length || !d1 || !d2) return 0;
    const avg = (d1 + d2) / 2;
    const rnd = Math.floor(avg);
    return (rnd * rnd * 0.7854 / 10000) * length;
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
      const res = await MasterDataAPI.createTimberVariant(payload)
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
    status: "RECEIVED",
    items: [{ 
      timberVariantId: "", 
      quantityPcs: 1, 
      volumeM3: 0, 
      purchaseThickness: 0, 
      purchaseWidth: 0, 
      purchaseLength: 0, 
      unitPrice: 0 
    }],
    logItems: [{
      logNumber: "",
      species: "",
      purchaseLength: 0,
      purchaseDiameter1: 0,
      purchaseDiameter2: 0,
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
        status: form.status,
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
      const targetTab = form.purchaseType === "raw-log" ? "rawlogs" : "purchase";
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
        <Button variant="ghost" size="icon" onClick={() => form.partaiId ? router.push(`/inventory/partai/${form.partaiId}?tab=purchase`) : router.push('/inventory/partai')}>
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
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-lg">Daftar Sawn Timber</h3>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-muted/10 relative">
                    <div className="absolute top-2 right-2">
                      {form.items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                          setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-2 pr-6">
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Variant / Sku Kayu</Label>
                          <button 
                            type="button" 
                            onClick={() => {
                              setActiveVariantRowIndex(index);
                              setIsVariantModalOpen(true);
                            }} 
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            + Buat Master Baru
                          </button>
                        </div>
                        <Select value={item.timberVariantId} onValueChange={(val: any) => {
                          const newItems = [...form.items];
                          const variant = variants.find(v => v.id === val);
                          newItems[index].timberVariantId = val || "";
                          if (variant) {
                             newItems[index].volumeM3 = variant.volumePerPiece * newItems[index].quantityPcs;
                             newItems[index].purchaseThickness = variant.thickness;
                             newItems[index].purchaseWidth = variant.width;
                             newItems[index].purchaseLength = variant.length;
                          }
                          setForm({ ...form, items: newItems });
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Variant Kayu">
                              {(() => {
                                const v = variants.find(itemVar => itemVar.id === item.timberVariantId);
                                if (v) return v.sku || `${v.species || ''} ${v.grade || ''} ${v.thickness || 0}x${v.width || 0}x${v.length || 0}`.trim();
                                return item.timberVariantId ? "Memuat variant..." : "Pilih Variant Kayu";
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.sku || `${v.species || ''} ${v.grade || ''} ${v.thickness || 0}x${v.width || 0}x${v.length || 0}`.trim() || v.id}
                              </SelectItem>
                            ))}
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
                          if (variant) newItems[index].volumeM3 = pcs * variant.volumePerPiece;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>Net Vol (M3)</Label>
                        <Input type="number" step="0.0001" value={item.volumeM3} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].volumeM3 = parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>P Aktual (m)</Label>
                        <Input type="number" step="0.1" value={item.purchaseLength} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].purchaseLength = parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>L Aktual (cm)</Label>
                        <Input type="number" step="0.1" value={item.purchaseWidth} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].purchaseWidth = parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>T Aktual (cm)</Label>
                        <Input type="number" step="0.1" value={item.purchaseThickness} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].purchaseThickness = parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Satuan</Label>
                        <Input type="number" min="0" value={item.unitPrice} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: newItems });
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setForm({ ...form, items: [...form.items, { timberVariantId: "", quantityPcs: 1, volumeM3: 0, purchaseThickness: 0, purchaseWidth: 0, purchaseLength: 0, unitPrice: 0 }] });
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Sawn Timber
                </Button>

                <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat Master Data Kayu (Sawn Timber)</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateVariant} className="space-y-4">
                      <div>
                        <Label>Species (Jenis Kayu) <span className="text-destructive">*</span></Label>
                        <Select
                          value={newVariant.speciesId || ""}
                          onValueChange={(val) => {
                            const selected = speciesList.find((s: any) => s.id === val);
                            if (selected) {
                              setNewVariant(prev => ({
                                ...prev,
                                speciesId: selected.id,
                                species: selected.name || selected.code || ""
                              }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Jenis Kayu (Species)" />
                          </SelectTrigger>
                          <SelectContent>
                            {speciesList.length === 0 ? (
                              <SelectItem value="__EMPTY__" disabled>Belum ada master species</SelectItem>
                            ) : (
                              speciesList.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} {s.code && s.code !== s.name ? `(${s.code})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Grade (Kualitas) <span className="text-destructive">*</span></Label>
                        <Select
                          value={newVariant.gradeId || ""}
                          onValueChange={(val) => {
                            const selected = gradeList.find((g: any) => g.id === val);
                            if (selected) {
                              setNewVariant(prev => ({
                                ...prev,
                                gradeId: selected.id,
                                grade: selected.code || selected.name || ""
                              }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kualitas (Grade)" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeList.length === 0 ? (
                              <SelectItem value="__EMPTY__" disabled>Belum ada master grade</SelectItem>
                            ) : (
                              gradeList.map((g: any) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.code && g.name && g.code !== g.name ? `${g.code} - ${g.name}` : (g.name || g.code)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>Tebal (mm)</Label>
                          <Input 
                            type="number" 
                            value={newVariant.thickness} 
                            onChange={e => setNewVariant({ ...newVariant, thickness: e.target.value })} 
                            placeholder="cth: 20"
                            required 
                          />
                        </div>
                        <div>
                          <Label>Lebar (mm)</Label>
                          <Input 
                            type="number" 
                            value={newVariant.width} 
                            onChange={e => setNewVariant({ ...newVariant, width: e.target.value })} 
                            placeholder="cth: 200"
                            required 
                          />
                        </div>
                        <div>
                          <Label>Panjang (mm)</Label>
                          <Input 
                            type="number" 
                            value={newVariant.length} 
                            onChange={e => setNewVariant({ ...newVariant, length: e.target.value })} 
                            placeholder="cth: 4000"
                            required 
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={creatingVariant} className="w-full">
                        {creatingVariant ? "Menyimpan..." : "Simpan Master Kayu"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="raw-log" className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-lg">Daftar Raw Logs (DUKB)</h3>
                </div>
                {form.logItems.map((item, index) => (
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
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-2 pr-6">
                      <div className="space-y-2">
                        <Label>No Log</Label>
                        <Input value={item.logNumber} onChange={(e) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].logNumber = e.target.value;
                          setForm({ ...form, logItems: newLogItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>Spesies</Label>
                        <Select value={item.species} onValueChange={(val: any) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].species = val;
                          setForm({ ...form, logItems: newLogItems });
                        }}>
                          <SelectTrigger><SelectValue placeholder="Pilih Spesies" /></SelectTrigger>
                          <SelectContent>
                            {speciesList.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Panjang (m)</Label>
                        <Input type="number" step="0.1" value={item.purchaseLength} onChange={(e) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].purchaseLength = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = Number(calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2).toFixed(4));
                            setForm({ ...form, logItems: newLogItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>&Oslash; Pangkal (cm)</Label>
                        <Input type="number" step="0.1" value={item.purchaseDiameter1} onChange={(e) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].purchaseDiameter1 = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = Number(calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2).toFixed(4));
                            setForm({ ...form, logItems: newLogItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>&Oslash; Ujung (cm)</Label>
                        <Input type="number" step="0.1" value={item.purchaseDiameter2} onChange={(e) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].purchaseDiameter2 = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = Number(calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2).toFixed(4));
                            setForm({ ...form, logItems: newLogItems });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label>Vol (M3)</Label>
                        <Input type="number" step="0.0001" value={item.purchaseVolume} onChange={(e) => {
                          const newLogItems = [...form.logItems];
                          newLogItems[index].purchaseVolume = parseFloat(e.target.value) || 0;
                          setForm({ ...form, logItems: newLogItems });
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setForm({ ...form, logItems: [...form.logItems, { logNumber: "", species: "", purchaseLength: 0, purchaseDiameter1: 0, purchaseDiameter2: 0, purchaseVolume: 0 }] });
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Raw Log
                </Button>
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



