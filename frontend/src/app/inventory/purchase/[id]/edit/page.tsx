"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { api, MasterDataAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const calculateLogVolume = (length: number, d1: number, d2: number) => {
  if (!length || !d1 || !d2) return 0;
  const avg = (d1 + d2) / 2;
  const rnd = Math.floor(avg);
  return Number(((rnd * rnd * 0.7854 / 10000) * length).toFixed(4));
};

export default function EditPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = typeof params?.id === "string" ? params.id : "";

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [gradeList, setGradeList] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [activeVariantRowIndex, setActiveVariantRowIndex] = useState<number>(0);
  const [newVariant, setNewVariant] = useState({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" });
  const [creatingVariant, setCreatingVariant] = useState(false);

  const [form, setForm] = useState({
    partaiId: "",
    purchaseNumber: "",
    purchaseDate: "",
    sourceId: "",
    warehouseId: "",
    notes: "",
    purchaseType: "sawn-timber",
    status: "DRAFT",
    items: [
      {
        timberVariantId: "",
        quantityPcs: 1,
        volumeM3: 0,
        purchaseThickness: 0,
        purchaseWidth: 0,
        purchaseLength: 0,
        unitPrice: 0,
        batch: "UNKNOWN",
        notes: "",
      },
    ],
    logItems: [
      {
        logNumber: "",
        species: "",
        purchaseLength: 0,
        purchaseDiameter1: 0,
        purchaseDiameter2: 0,
        purchaseVolume: 0,
      },
    ],
  });

  useEffect(() => {
    if (!purchaseId || purchaseId === "undefined") {
      setError("ID Pembelian tidak valid.");
      setPageLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setPageLoading(true);
      setError("");

      try {
        const [srcRes, whRes, varRes, specRes, gradeRes, purchaseRes] = await Promise.all([
          api.get("/inventory/master-data/timber-source").catch(() => ({ data: [] })),
          api.get("/inventory/warehouses").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-variant").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-species").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-grade").catch(() => ({ data: [] })),
          api.get(`/inventory/timber-purchase/${purchaseId}`).catch((err) => {
            console.error("Gagal mengambil data purchase:", err);
            return { data: null };
          }),
        ]);

        if (!isMounted) return;

        const rawSrc = srcRes?.data?.data || srcRes?.data || [];
        const rawWh = whRes?.data?.data || whRes?.data || [];
        const rawVar = varRes?.data?.data || varRes?.data || [];
        const rawSpec = specRes?.data?.data || specRes?.data || [];
        const rawGrade = gradeRes?.data?.data || gradeRes?.data || [];
        const p = purchaseRes?.data?.data || purchaseRes?.data;

        if (!p) {
          setError("Data pembelian tidak ditemukan di sistem.");
          setPageLoading(false);
          return;
        }

        // Merge sources
        const mergedSources = Array.isArray(rawSrc) ? [...rawSrc] : [];
        if (p.source && !mergedSources.some((s: any) => s.id === p.source.id)) {
          mergedSources.push(p.source);
        }

        // Merge warehouses
        const mergedWarehouses = Array.isArray(rawWh) ? [...rawWh] : [];
        if (p.warehouse && !mergedWarehouses.some((w: any) => w.id === p.warehouse.id)) {
          mergedWarehouses.push(p.warehouse);
        }

        // Merge variants
        const mergedVariants = Array.isArray(rawVar) ? [...rawVar] : [];
        if (p.items && Array.isArray(p.items)) {
          for (const it of p.items) {
            if (it.timberVariant && !mergedVariants.some((v: any) => v.id === it.timberVariant.id)) {
              mergedVariants.push(it.timberVariant);
            }
          }
        }

        setSources(mergedSources);
        setWarehouses(mergedWarehouses);
        setVariants(mergedVariants);
        setSpeciesList(Array.isArray(rawSpec) ? rawSpec : []);
        setGradeList(Array.isArray(rawGrade) ? rawGrade : []);

        const isRawLog = p.logItems && p.logItems.length > 0 && (!p.items || p.items.length === 0);

        setForm({
          partaiId: p.partaiId || "",
          purchaseNumber: p.purchaseNumber || p.code || "",
          purchaseDate: p.purchaseDate ? p.purchaseDate.substring(0, 10) : new Date().toISOString().split("T")[0],
          sourceId: p.sourceId || p.source?.id || "",
          warehouseId: p.warehouseId || p.warehouse?.id || "",
          notes: p.notes || "",
          purchaseType: isRawLog ? "raw-log" : "sawn-timber",
          status: p.status || "DRAFT",
          items:
            p.items && p.items.length > 0
              ? p.items.map((i: any) => ({
                  timberVariantId: i.timberVariantId || i.variantId || "",
                  quantityPcs: Number(i.quantityPcs || 0),
                  volumeM3: Number(i.volumeM3 || 0),
                  purchaseThickness: Number(i.purchaseThickness || i.timberVariant?.thickness || 0),
                  purchaseWidth: Number(i.purchaseWidth || i.timberVariant?.width || 0),
                  purchaseLength: Number(i.purchaseLength || i.timberVariant?.length || 0),
                  unitPrice: Number(i.unitPrice || 0),
                  batch: i.batch || "UNKNOWN",
                  notes: i.notes || "",
                }))
              : [
                  {
                    timberVariantId: "",
                    quantityPcs: 1,
                    volumeM3: 0,
                    purchaseThickness: 0,
                    purchaseWidth: 0,
                    purchaseLength: 0,
                    unitPrice: 0,
                    batch: "UNKNOWN",
                    notes: "",
                  },
                ],
          logItems:
            p.logItems && p.logItems.length > 0
              ? p.logItems.map((li: any) => ({
                  logNumber: li.logNumber || "",
                  species: li.species || "",
                  purchaseLength: Number(li.purchaseLength || 0),
                  purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
                  purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
                  purchaseVolume: Number(li.purchaseVolume || 0),
                }))
              : [
                  {
                    logNumber: "",
                    species: "",
                    purchaseLength: 0,
                    purchaseDiameter1: 0,
                    purchaseDiameter2: 0,
                    purchaseVolume: 0,
                  },
                ],
        });
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data pembelian untuk diedit.");
      } finally {
        if (isMounted) setPageLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [purchaseId]);

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.species) {
      alert("Silakan pilih Species (Jenis Kayu)");
      return;
    }
    if (!newVariant.grade) {
      alert("Silakan pilih Grade (Kualitas)");
      return;
    }
    setCreatingVariant(true);
    try {
      const payload = {
        species: (newVariant.species || "").trim().toUpperCase(),
        speciesId: newVariant.speciesId || undefined,
        grade: (newVariant.grade || "").trim().toUpperCase(),
        gradeId: newVariant.gradeId || undefined,
        thickness: Number(newVariant.thickness || 0),
        width: Number(newVariant.width || 0),
        length: Number(newVariant.length || 0),
      };
      const res = await MasterDataAPI.createTimberVariant(payload);
      if (res && res.id) {
        setVariants((prev) => {
          const exists = prev.some((v) => v.id === res.id);
          return exists ? prev.map((v) => (v.id === res.id ? res : v)) : [res, ...prev];
        });

        const newItems = [...form.items];
        const targetIdx = activeVariantRowIndex >= 0 && activeVariantRowIndex < newItems.length ? activeVariantRowIndex : 0;
        if (newItems[targetIdx]) {
          newItems[targetIdx].timberVariantId = res.id;
          newItems[targetIdx].purchaseThickness = res.thickness || payload.thickness;
          newItems[targetIdx].purchaseWidth = res.width || payload.width;
          newItems[targetIdx].purchaseLength = res.length || payload.length;
          newItems[targetIdx].volumeM3 = (res.volumePerPiece || 0) * (newItems[targetIdx].quantityPcs || 1);
          setForm((prev) => ({ ...prev, items: newItems }));
        }

        setIsVariantModalOpen(false);
        setNewVariant({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" });
      }
    } catch (err: any) {
      console.error("Gagal membuat master varian:", err);
      alert("Gagal menyimpan master kayu: " + (err?.response?.data?.message || err.message || "Periksa server"));
    } finally {
      setCreatingVariant(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.put(`/inventory/timber-purchase/${purchaseId}`, {
        purchaseNumber: form.purchaseNumber,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        sourceId: form.sourceId,
        warehouseId: form.warehouseId,
        notes: form.notes,
        partaiId: form.partaiId,
        status: form.status,
        items:
          form.purchaseType === "sawn-timber"
            ? form.items.map((i: any) => ({
                timberVariantId: i.timberVariantId,
                variantId: i.timberVariantId,
                quantityPcs: Number(i.quantityPcs || 0),
                volumeM3: Number(i.volumeM3 || 0),
                purchaseThickness: Number(i.purchaseThickness || 0),
                purchaseWidth: Number(i.purchaseWidth || 0),
                purchaseLength: Number(i.purchaseLength || 0),
                unitPrice: Number(i.unitPrice || 0),
                batch: i.batch || "UNKNOWN",
                notes: i.notes || "",
              }))
            : [],
        logItems:
          form.purchaseType === "raw-log"
            ? form.logItems.map((li: any) => ({
                logNumber: li.logNumber,
                species: li.species,
                purchaseLength: Number(li.purchaseLength || 0),
                purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
                purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
                purchaseVolume: Number(li.purchaseVolume || 0),
              }))
            : [],
      });
      if (form.partaiId) {
        router.push(`/inventory/partai/${form.partaiId}?tab=purchase`);
      } else {
        router.back();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Gagal menyimpan perubahan pembelian"
      );
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat data pembelian untuk diedit...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => form.partaiId ? router.push(`/inventory/partai/${form.partaiId}?tab=purchase`) : router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Pembelian Kayu</h1>
          <p className="text-xs text-muted-foreground">Perbarui data pembelian kayu (Sawn Timber / Raw Log)</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor PO</Label>
                <Input value={form.purchaseNumber} onChange={(e) => setForm({ ...form, purchaseNumber: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pembelian</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Supplier / Sumber Kayu</Label>
                <Select value={form.sourceId} onValueChange={(val) => setForm({ ...form, sourceId: val || "" })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Supplier">
                      {(() => {
                        const s = sources.find((item) => item.id === form.sourceId);
                        if (s) return s.name ? `${s.name}${s.code ? ` (${s.code})` : ""}` : s.code || s.id;
                        return form.sourceId ? "Memuat supplier..." : "Pilih Supplier";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name ? `${s.name}${s.code ? ` (${s.code})` : ""}` : s.code || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gudang Penerima</Label>
                <Select value={form.warehouseId} onValueChange={(val) => setForm({ ...form, warehouseId: val || "" })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gudang">
                      {(() => {
                        const w = warehouses.find((item) => item.id === form.warehouseId);
                        if (w) return w.name ? `${w.name}${w.code ? ` (${w.code})` : ""}` : w.code || w.id;
                        return form.warehouseId ? "Memuat gudang..." : "Pilih Gudang";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name ? `${w.name}${w.code ? ` (${w.code})` : ""}` : w.code || w.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Status Penerimaan Barang *</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val || "DRAFT" })}>
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
              </div>
              <div className="space-y-2">
                <Label>Catatan (Notes)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan pembelian kayu..." />
              </div>
            </div>

            <Tabs value={form.purchaseType} onValueChange={(v) => setForm({ ...form, purchaseType: v })} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="sawn-timber">Beli Kayu Gergajian (Sawn Timber)</TabsTrigger>
                <TabsTrigger value="raw-log">Beli Log Bulat (Raw Log / DUKB)</TabsTrigger>
              </TabsList>

              <TabsContent value="sawn-timber" className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-lg">Daftar Sawn Timber</h3>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-muted/10 relative">
                    <div className="absolute top-2 right-2">
                      {form.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                          }}
                        >
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
                        <Select
                          value={item.timberVariantId}
                          onValueChange={(val: any) => {
                            const newItems = [...form.items];
                            const variant = variants.find((v) => v.id === val);
                            newItems[index].timberVariantId = val || "";
                            if (variant) {
                              newItems[index].volumeM3 = variant.volumePerPiece * newItems[index].quantityPcs;
                              newItems[index].purchaseThickness = variant.thickness;
                              newItems[index].purchaseWidth = variant.width;
                              newItems[index].purchaseLength = variant.length;
                            }
                            setForm({ ...form, items: newItems });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Variant Kayu">
                              {(() => {
                                const v = variants.find((itemVar) => itemVar.id === item.timberVariantId);
                                if (v) return v.sku || `${v.species || ""} ${v.grade || ""} ${v.thickness || 0}x${v.width || 0}x${v.length || 0}`.trim();
                                return item.timberVariantId ? "Memuat variant..." : "Pilih Variant Kayu";
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.sku || `${v.species || ""} ${v.grade || ""} ${v.thickness || 0}x${v.width || 0}x${v.length || 0}`.trim() || v.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity (PCS)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantityPcs}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            const pcs = parseInt(e.target.value) || 0;
                            newItems[index].quantityPcs = pcs;
                            const variant = variants.find((v) => v.id === newItems[index].timberVariantId);
                            if (variant) {
                              newItems[index].volumeM3 = Number((pcs * (variant.volumePerPiece || 0)).toFixed(4));
                            }
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Net Vol (M3)</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={item.volumeM3}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].volumeM3 = parseFloat(e.target.value) || 0;
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>T Tebal (mm)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={item.purchaseThickness}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].purchaseThickness = parseFloat(e.target.value) || 0;
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>L Lebar (mm)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={item.purchaseWidth}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].purchaseWidth = parseFloat(e.target.value) || 0;
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>P Panjang (mm)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={item.purchaseLength}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].purchaseLength = parseFloat(e.target.value) || 0;
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Satuan (Rp)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...form.items];
                            newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                            setForm({ ...form, items: newItems });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setForm({
                      ...form,
                      items: [
                        ...form.items,
                        {
                          timberVariantId: "",
                          quantityPcs: 1,
                          volumeM3: 0,
                          purchaseThickness: 0,
                          purchaseWidth: 0,
                          purchaseLength: 0,
                          unitPrice: 0,
                          batch: "UNKNOWN",
                          notes: "",
                        },
                      ],
                    });
                  }}
                >
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
                              setNewVariant((prev) => ({
                                ...prev,
                                speciesId: selected.id,
                                species: selected.name || selected.code || "",
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
                              setNewVariant((prev) => ({
                                ...prev,
                                gradeId: selected.id,
                                grade: selected.code || selected.name || "",
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
                            onChange={(e) => setNewVariant({ ...newVariant, thickness: e.target.value })}
                            placeholder="cth: 20"
                            required
                          />
                        </div>
                        <div>
                          <Label>Lebar (mm)</Label>
                          <Input
                            type="number"
                            value={newVariant.width}
                            onChange={(e) => setNewVariant({ ...newVariant, width: e.target.value })}
                            placeholder="cth: 200"
                            required
                          />
                        </div>
                        <div>
                          <Label>Panjang (mm)</Label>
                          <Input
                            type="number"
                            value={newVariant.length}
                            onChange={(e) => setNewVariant({ ...newVariant, length: e.target.value })}
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setForm({ ...form, logItems: form.logItems.filter((_, i) => i !== index) });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-2 pr-6">
                      <div className="space-y-2">
                        <Label>No Log</Label>
                        <Input
                          value={item.logNumber}
                          onChange={(e) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].logNumber = e.target.value;
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Spesies</Label>
                        <Select
                          value={item.species}
                          onValueChange={(val: any) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].species = val;
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Spesies" />
                          </SelectTrigger>
                          <SelectContent>
                            {speciesList.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Panjang (m)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.purchaseLength}
                          onChange={(e) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].purchaseLength = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = calculateLogVolume(
                              newLogItems[index].purchaseLength,
                              newLogItems[index].purchaseDiameter1,
                              newLogItems[index].purchaseDiameter2
                            );
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>&Oslash; Pangkal (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.purchaseDiameter1}
                          onChange={(e) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].purchaseDiameter1 = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = calculateLogVolume(
                              newLogItems[index].purchaseLength,
                              newLogItems[index].purchaseDiameter1,
                              newLogItems[index].purchaseDiameter2
                            );
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>&Oslash; Ujung (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.purchaseDiameter2}
                          onChange={(e) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].purchaseDiameter2 = parseFloat(e.target.value) || 0;
                            newLogItems[index].purchaseVolume = calculateLogVolume(
                              newLogItems[index].purchaseLength,
                              newLogItems[index].purchaseDiameter1,
                              newLogItems[index].purchaseDiameter2
                            );
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vol (M3)</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={item.purchaseVolume}
                          onChange={(e) => {
                            const newLogItems = [...form.logItems];
                            newLogItems[index].purchaseVolume = parseFloat(e.target.value) || 0;
                            setForm({ ...form, logItems: newLogItems });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setForm({
                      ...form,
                      logItems: [
                        ...form.logItems,
                        { logNumber: "", species: "", purchaseLength: 0, purchaseDiameter1: 0, purchaseDiameter2: 0, purchaseVolume: 0 },
                      ],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Raw Log
                </Button>
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Pembelian"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
