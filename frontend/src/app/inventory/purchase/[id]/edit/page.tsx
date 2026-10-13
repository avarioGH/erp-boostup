"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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

const calculateLogVolume = (length: number, d1: number, d2: number, rtManual?: number) => {
  if (!length) return 0;
  let rt = typeof rtManual === "number" && rtManual > 0 ? rtManual : 0;
  if (!rt) {
    if (d1 > 0 && d2 > 0) {
      rt = (d1 + d2) / 2;
    } else {
      rt = d1 || d2 || 0;
    }
  }
  if (rt <= 0) return 0;

  const lengthCm = length <= 50 ? length * 100 : length;
  return Number(((lengthCm * rt * rt) / 1000000).toFixed(4));
};

export default function EditPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    const targetPartaiId = searchParams?.get('partaiId') || form.partaiId;
    const fromTab = searchParams?.get('tab') || 'purchase';
    if (targetPartaiId) {
      router.push(`/inventory/partai/${targetPartaiId}?tab=${fromTab}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/inventory/partai");
    }
  };
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
        species: "BKR",
        grade: "A",
        quantityPcs: 1,
        volumeM3: 0,
        purchaseThickness: 0,
        purchaseWidth: 0,
        purchaseLength: 400,
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
        purchaseDiameterAvg: 0,
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
                  species: i.timberVariant?.species || i.species || i.notes || "BKR",
                  grade: i.timberVariant?.grade || i.grade || "A",
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
                    species: "BKR",
                    grade: "A",
                    quantityPcs: 1,
                    volumeM3: 0,
                    purchaseThickness: 0,
                    purchaseWidth: 0,
                    purchaseLength: 400,
                    unitPrice: 0,
                    batch: "UNKNOWN",
                    notes: "",
                  },
                ],
          logItems:
            p.logItems && p.logItems.length > 0
              ? p.logItems.map((li: any) => {
                  const d1 = Number(li.purchaseDiameter1 || 0);
                  const d2 = Number(li.purchaseDiameter2 || 0);
                  const rt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
                  return {
                    logNumber: li.logNumber || "",
                    species: li.species || "",
                    purchaseLength: Number(li.purchaseLength || 0),
                    purchaseDiameter1: d1,
                    purchaseDiameter2: d2,
                    purchaseDiameterAvg: rt,
                    purchaseVolume: Number(li.purchaseVolume || 0),
                  };
                })
              : [
                  {
                    logNumber: "",
                    species: "",
                    purchaseLength: 0,
                    purchaseDiameter1: 0,
                    purchaseDiameter2: 0,
                    purchaseDiameterAvg: 0,
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
          setForm((prev) => ({ ...prev, items: newItems }));
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
                species: i.species || i.notes || "BKR",
                grade: i.grade || "A",
                quantityPcs: Number(i.quantityPcs || 0),
                volumeM3: Number(i.volumeM3 || 0),
                purchaseThickness: Number(i.purchaseThickness || 0),
                purchaseWidth: Number(i.purchaseWidth || 0),
                purchaseLength: Number(i.purchaseLength || 0),
                unitPrice: Number(i.unitPrice || 0),
                batch: i.batch || "UNKNOWN",
                notes: i.notes || i.species || "",
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
      handleBack();
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
        <Button variant="ghost" size="icon" onClick={handleBack}>
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span>📋 Tally Sheet Pembelian Sawn Timber (Beli Masak)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input langsung data surat jalan fisik dari supplier (Panjang, Tebal, Lebar dlm cm). Tidak perlu pilih/buat Master Variant SKU secara manual.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const last = form.items[form.items.length - 1];
                        setForm((prev) => ({
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
                              batch: "UNKNOWN",
                              notes: "",
                            },
                          ],
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
                          batch: "UNKNOWN",
                          notes: "",
                        }));
                        setForm((prev) => ({
                          ...prev,
                          items: [...prev.items, ...newRows],
                        }));
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> +5 Baris
                    </Button>
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
                        const vol =
                          p > 0 && t > 0 && l > 0 && pcs > 0
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
                          {form.items
                            .reduce((sum, it) => {
                              const p = Number(it.purchaseLength || 0);
                              const t = Number(it.purchaseThickness || 0);
                              const l = Number(it.purchaseWidth || 0);
                              const pcs = Number(it.quantityPcs || 0);
                              const v =
                                it.volumeM3 !== undefined && it.volumeM3 > 0
                                  ? Number(it.volumeM3)
                                  : p > 0 && t > 0 && l > 0 && pcs > 0
                                  ? (p * t * l * pcs) / 1000000
                                  : 0;
                              return sum + v;
                            }, 0)
                            .toFixed(4)}{" "}
                          m³
                        </td>
                        <td colSpan={3} className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          Rp{" "}
                          {form.items
                            .reduce((sum, it) => {
                              const p = Number(it.purchaseLength || 0);
                              const t = Number(it.purchaseThickness || 0);
                              const l = Number(it.purchaseWidth || 0);
                              const pcs = Number(it.quantityPcs || 0);
                              const v =
                                it.volumeM3 !== undefined && it.volumeM3 > 0
                                  ? Number(it.volumeM3)
                                  : p > 0 && t > 0 && l > 0 && pcs > 0
                                  ? (p * t * l * pcs) / 1000000
                                  : 0;
                              const pr = Number(it.unitPrice || 0);
                              return sum + Math.round(v * pr);
                            }, 0)
                            .toLocaleString("id-ID")}
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
                      setForm((prev) => ({
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
                            batch: "UNKNOWN",
                            notes: "",
                          },
                        ],
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
                        batch: "UNKNOWN",
                        notes: "",
                      }));
                      setForm((prev) => ({
                        ...prev,
                        items: [...prev.items, ...newRows],
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
                            purchaseVolume: 0,
                          },
                        ],
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
                          <Select
                            value={item.species}
                            onValueChange={(val: any) => {
                              const newLogItems = [...form.logItems];
                              newLogItems[index].species = val;
                              setForm({ ...form, logItems: newLogItems });
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
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
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
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
                            purchaseVolume: 0,
                          },
                        ],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah 1 Raw Log
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
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
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah 5 Raw Log
                  </Button>
                </div>
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
