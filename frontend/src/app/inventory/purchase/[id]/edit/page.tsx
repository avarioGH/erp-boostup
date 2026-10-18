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
import { SawnTimberSpreadsheet, SawnTallyRow } from "@/components/timber/sawn-timber-spreadsheet"

const calculateLogVolume = (length: number, d1: number, d2: number, rtManual?: number) => {
  if (!length) return 0;
  const pkl = Number(d1) || 0;
  const ujung = Number(d2) || 0;
  let rt = typeof rtManual === "number" && rtManual > 0 ? rtManual : 0;
  if (!rt) {
    if (pkl > 0 && ujung > 0) {
      rt = (pkl + ujung) / 2;
    } else {
      rt = pkl || ujung || 0;
    }
  }

  const lengthCm = length <= 50 ? length * 100 : length;

  if (rt > 0) {
    return Number(((0.7854 * lengthCm * rt * rt) / 1000000).toFixed(4));
  }
  return 0;
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
        species: "",
        grade: "A",
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

        const DEFAULT_SPECIES = [
          { id: "sp-merbau", code: "MRB", name: "MERBAU" },
          { id: "sp-meranti", code: "MRT", name: "MERANTI" },
          { id: "sp-bengkirai", code: "BKR", name: "BENGKIRAI" },
          { id: "sp-ulin", code: "ULN", name: "ULIN" },
          { id: "sp-kenari", code: "KNR", name: "KENARI" },
          { id: "sp-jati", code: "JTI", name: "JATI" },
          { id: "sp-kampas", code: "KMP", name: "KAMPAS" },
          { id: "sp-keruing", code: "KRW", name: "KERUING" },
          { id: "sp-sonokeling", code: "SNK", name: "SONOKELING" },
          { id: "sp-mahoni", code: "MHG", name: "MAHONI" },
          { id: "sp-lokal", code: "LKL", name: "LOKAL" },
        ];

        const DEFAULT_GRADES = [
          { id: "grd-a", code: "A", name: "Grade A" },
          { id: "grd-b", code: "B", name: "Grade B" },
          { id: "grd-c", code: "C", name: "Grade C" },
          { id: "grd-afkir", code: "AFKIR", name: "Afkir" },
        ];

        setSources(mergedSources);
        setWarehouses(mergedWarehouses);
        setVariants(mergedVariants);
        setSpeciesList(Array.isArray(rawSpec) && rawSpec.length > 0 ? rawSpec : DEFAULT_SPECIES);
        setGradeList(Array.isArray(rawGrade) && rawGrade.length > 0 ? rawGrade : DEFAULT_GRADES);

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
                  species: i.timberVariant?.species || i.species || i.notes || "",
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
                    species: "",
                    grade: "A",
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

  const addSawnRows = (count: number) => {
    const last = form.items[form.items.length - 1];
    const newRows = Array.from({ length: count }).map(() => ({
      species: last?.species || "",
      grade: last?.grade || "A",
      timberVariantId: "",
      quantityPcs: 1,
      volumeM3: 0,
      purchaseThickness: last?.purchaseThickness || 0,
      purchaseWidth: last?.purchaseWidth || 0,
      purchaseLength: last?.purchaseLength || 0,
      unitPrice: last?.unitPrice || 0,
      batch: "UNKNOWN",
      notes: "",
    }));
    setForm(prev => ({
      ...prev,
      items: [...prev.items, ...newRows],
    }));
  };

  const addLogRows = (count: number) => {
    const last = form.logItems[form.logItems.length - 1];
    const newRows = Array.from({ length: count }).map(() => ({
      logNumber: "",
      species: last?.species || "",
      purchaseLength: last?.purchaseLength || 0,
      purchaseDiameter1: 0,
      purchaseDiameter2: 0,
      purchaseDiameterAvg: 0,
      purchaseVolume: 0,
    }));
    setForm(prev => ({
      ...prev,
      logItems: [...prev.logItems, ...newRows],
    }));
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    field: string,
    type: 'sawn' | 'log',
    totalRows: number,
    addRowsFn: (count: number) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
        if (nextEl) {
          nextEl.focus();
          if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
            (nextEl as any).select();
          }
        }
      } else {
        addRowsFn(1);
        setTimeout(() => {
          const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
          if (nextEl) {
            nextEl.focus();
            if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
              (nextEl as any).select();
            }
          }
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      const nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        e.preventDefault();
        const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
        if (nextEl) {
          nextEl.focus();
          if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
            (nextEl as any).select();
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        e.preventDefault();
        const prevEl = document.getElementById(`${type}-${field}-${prevRow}`);
        if (prevEl) {
          prevEl.focus();
          if ('select' in prevEl && typeof (prevEl as any).select === 'function') {
            (prevEl as any).select();
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const isSawn = form.purchaseType === "sawn-timber";

    // Silently filter out empty/blank rows so user doesn't have to delete them manually
    const validSawnItems = form.items.filter((item: any) => {
      const p = Number(item.purchaseLength || 0);
      const t = Number(item.purchaseThickness || 0);
      const l = Number(item.purchaseWidth || 0);
      const pcs = Number(item.quantityPcs || 0);
      const vol = Number(item.volumeM3 || 0);
      return (p > 0 || t > 0 || l > 0 || vol > 0) && pcs > 0;
    });

    const validLogItems = form.logItems.filter((li: any) => {
      const p = Number(li.purchaseLength || 0);
      const d1 = Number(li.purchaseDiameter1 || 0);
      const d2 = Number(li.purchaseDiameter2 || 0);
      const avg = Number(li.purchaseDiameterAvg || 0);
      const vol = Number(li.purchaseVolume || 0);
      const num = (li.logNumber || "").trim();
      return p > 0 || d1 > 0 || d2 > 0 || avg > 0 || vol > 0 || num.length > 0;
    });

    if (isSawn && validSawnItems.length === 0) {
      setError("Silakan isi minimal 1 baris data sawn timber sebelum menyimpan.");
      setLoading(false);
      return;
    }

    if (!isSawn && validLogItems.length === 0) {
      setError("Silakan isi minimal 1 baris data log bulat sebelum menyimpan.");
      setLoading(false);
      return;
    }

    try {
      await api.put(`/inventory/timber-purchase/${purchaseId}`, {
        purchaseNumber: form.purchaseNumber,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        sourceId: form.sourceId,
        warehouseId: form.warehouseId,
        notes: form.notes,
        partaiId: form.partaiId,
        status: form.status,
        items: isSawn
          ? validSawnItems.map((i: any) => ({
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
        logItems: !isSawn
          ? validLogItems.map((li: any, idx: number) => ({
              logNumber: li.logNumber?.trim() || `LOG-${form.purchaseNumber || 'PUR'}-${idx + 1}`,
              species: li.species || 'UNKNOWN',
              purchaseLength: Number(li.purchaseLength || 0),
              purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
              purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
              purchaseDiameter3: Number((li as any).purchaseDiameter3 || 0),
              purchaseDiameter4: Number((li as any).purchaseDiameter4 || 0),
              purchaseDiameterAvg: Number(li.purchaseDiameterAvg || 0),
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
                <SawnTimberSpreadsheet
                  initialRows={form.items.map((it: any) => ({
                    species: it.species || "MERBAU",
                    grade: it.grade || "A",
                    thickness: it.purchaseThickness || "",
                    width: it.purchaseWidth || "",
                    length: it.purchaseLength || "",
                    pcs: it.quantityPcs || "",
                    m3: it.volumeM3 || 0,
                  }))}
                  speciesList={speciesList}
                  defaultSpecies="MERBAU"
                  showSpecies={true}
                  onChange={(updatedRows: SawnTallyRow[]) => {
                    const mappedItems = updatedRows.map(r => ({
                      species: r.species || "MERBAU",
                      grade: r.grade || "A",
                      purchaseThickness: parseFloat(String(r.thickness).replace(",", ".")) || 0,
                      purchaseWidth: parseFloat(String(r.width).replace(",", ".")) || 0,
                      purchaseLength: parseFloat(String(r.length).replace(",", ".")) || 0,
                      quantityPcs: parseInt(String(r.pcs)) || 0,
                      volumeM3: Number(r.m3) || 0,
                      unitPrice: 0,
                      timberVariantId: r.timberVariantId || "",
                      batch: "UNKNOWN",
                      notes: r.species || "SAWN-TIMBER",
                    }));
                    setForm(prev => ({ ...prev, items: mappedItems }));
                  }}
                />
              </TabsContent>

              <TabsContent value="raw-log" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span>🪵 Spreadsheet Pembelian Raw Logs (DUKB)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input tabel log bulat: Panjang, Ø Pangkal (D1), Ø Ujung (D2), dan RT otomatis. Tekan <strong>Enter</strong> untuk turun ke bawah. Baris kosong akan otomatis diabaikan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => addLogRows(1)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +1
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(5)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +5
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(10)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +10
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(20)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +20 Log
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-2.5 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span><strong>Mode Excel Aktif:</strong> Ketik nilai (misal: isi kolom P terus menerus lalu pindah ke D1/D2), tekan <strong>Enter</strong> untuk turun. Baris kosong tidak perlu dihapus.</span>
                  </div>
                  <span className="font-mono font-bold bg-background/80 px-2 py-0.5 rounded border text-[11px]">
                    {form.logItems.filter((li: any) => Number(li.purchaseLength || 0) > 0 || Number(li.purchaseDiameter1 || 0) > 0 || Number(li.purchaseDiameter2 || 0) > 0 || Number(li.purchaseVolume || 0) > 0 || (li.logNumber && li.logNumber.trim() !== '')).length} / {form.logItems.length} Log Terisi
                  </span>
                </div>

                {/* RAW LOG SPREADSHEET TABLE */}
                <div className="overflow-x-auto border rounded-xl shadow-sm bg-card">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60 border-b text-muted-foreground font-semibold">
                        <th className="py-2.5 px-2 text-center w-10">No</th>
                        <th className="py-2.5 px-2 text-left w-28">No Log</th>
                        <th className="py-2.5 px-2 text-left w-28">Spesies</th>
                        <th className="py-2.5 px-2 text-center w-24">P (cm/m)</th>
                        <th className="py-2.5 px-2 text-center w-24">&Oslash; Pkl D1 (cm)</th>
                        <th className="py-2.5 px-2 text-center w-24">&Oslash; Ujg D2 (cm)</th>
                        <th className="py-2.5 px-2 text-center w-24 text-blue-700 dark:text-blue-300 font-bold">RT (cm)</th>
                        <th className="py-2.5 px-2 text-right w-28 text-emerald-700 dark:text-emerald-400 font-bold">Vol (m³)</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {form.logItems.map((item: any, index: number) => {
                        const currentRt = item.purchaseDiameterAvg || ((item.purchaseDiameter1 > 0 && item.purchaseDiameter2 > 0) ? Math.round(((item.purchaseDiameter1 + item.purchaseDiameter2) / 2) * 10) / 10 : (item.purchaseDiameter1 || item.purchaseDiameter2 || 0));
                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="py-1 px-2 text-center font-mono text-muted-foreground font-medium">
                              {index + 1}
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-logNumber-${index}`}
                                value={item.logNumber || ""}
                                placeholder={`LOG-${index + 1}`}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'logNumber', 'log', form.logItems.length, () => addLogRows(1))}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].logNumber = e.target.value;
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <select
                                id={`log-species-${index}`}
                                value={item.species || ""}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'species', 'log', form.logItems.length, () => addLogRows(1))}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].species = e.target.value.toUpperCase();
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs font-semibold uppercase border border-input rounded px-2 w-full bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="">-- Pilih Spesies --</option>
                                {speciesList.map((s: any) => (
                                  <option key={s.id} value={s.name || s.code}>
                                    {s.name} {s.code && s.code !== s.name ? `(${s.code})` : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseLength-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseLength || ""}
                                placeholder="cth: 400"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseLength', 'log', form.logItems.length, () => addLogRows(1))}
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
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseDiameter1-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameter1 || ""}
                                placeholder="D1"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameter1', 'log', form.logItems.length, () => addLogRows(1))}
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
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseDiameter2-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameter2 || ""}
                                placeholder="D2"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameter2', 'log', form.logItems.length, () => addLogRows(1))}
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
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseDiameterAvg-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameterAvg || (currentRt > 0 ? currentRt : "")}
                                placeholder="RT"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameterAvg', 'log', form.logItems.length, () => addLogRows(1))}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  const customRt = parseFloat(e.target.value) || 0;
                                  newLogItems[index].purchaseDiameterAvg = customRt;
                                  newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2, customRt);
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20"
                                title="Diameter Rata-rata (RT)"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseVolume-${index}`}
                                type="number"
                                step="0.0001"
                                value={item.purchaseVolume || ""}
                                placeholder="0.0000"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseVolume', 'log', form.logItems.length, () => addLogRows(1))}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].purchaseVolume = parseFloat(e.target.value) || 0;
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                              />
                            </td>
                            <td className="py-1 px-2 text-center">
                              {form.logItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, logItems: form.logItems.filter((_, i) => i !== index) });
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
                        <td colSpan={3} className="py-2.5 px-3 text-right">TOTAL KESELURUHAN:</td>
                        <td colSpan={4} className="py-2.5 px-2 text-center font-bold text-foreground">
                          {form.logItems.filter((li: any) => Number(li.purchaseLength || 0) > 0 || Number(li.purchaseDiameter1 || 0) > 0 || Number(li.purchaseDiameter2 || 0) > 0 || Number(li.purchaseVolume || 0) > 0 || (li.logNumber && li.logNumber.trim() !== '')).length} Batang Log Valid
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {form.logItems.reduce((sum: number, it: any) => sum + (Number(it.purchaseVolume) || 0), 0).toFixed(4)} m³
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <datalist id="species-datalist-edit">
                  {speciesList.map((s: any) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addLogRows(1)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +1 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(5)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +5 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(10)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +10 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(20)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +20 Log
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
