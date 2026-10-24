"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MasterDataAPI, InventoryAPI, PackingAPI, PartaiAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Plus, Trash2, Package, Layers, FileSpreadsheet, Scale, Info, AlertCircle, Columns, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CustomPackingColumn {
  id: string;
  label: string;
}

interface PackingRow {
  palletNo: string;
  // Ukuran Asli Pabrik
  realT: string;
  realL: string;
  realP: string;
  realPcs: string;
  realM3: number;
  // Ukuran Customer
  custT: string;
  custL: string;
  custP: string;
  custPcs: string;
  custM3: number;
  notes: string;
  [key: string]: any;
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

export default function CreatePackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlPartaiId = searchParams.get("partaiId") || "";
  const [partaiInfo, setPartaiInfo] = useState<any>(null);

  const [packingNumber, setPackingNumber] = useState(
    `PKG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
  );
  const [packingDate, setPackingDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPartaiId, setSelectedPartaiId] = useState(urlPartaiId);
  const [allPartais, setAllPartais] = useState<any[]>([]);
  const [ownerName, setOwnerName] = useState("PT Daun Emas Multi Perkasa");
  const [species, setSpecies] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>(DEFAULT_SPECIES);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Dynamic custom columns state
  const [customColumns, setCustomColumns] = useState<CustomPackingColumn[]>([]);
  const [newColName, setNewColName] = useState("");
  const [showAddColInput, setShowAddColInput] = useState(false);

  const addCustomColumn = () => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    const colId = `custom_${Date.now()}`;
    setCustomColumns((prev) => [...prev, { id: colId, label: trimmed }]);
    setNewColName("");
    setShowAddColInput(false);
  };

  const removeCustomColumn = (colId: string) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [
        {
          palletNo: "01",
          realT: "",
          realL: "",
          realP: "",
          realPcs: "",
          realM3: 0,
          custT: "",
          custL: "",
          custP: "",
          custPcs: "",
          custM3: 0,
          notes: "",
        }
      ];
    });
  };

  // Rows generator
  const [rows, setRows] = useState<PackingRow[]>(
    Array.from({ length: 15 }, (_, i) => ({
      palletNo: `0${Math.floor(i / 5) + 1}`,
      realT: "",
      realL: "",
      realP: "",
      realPcs: "",
      realM3: 0,
      custT: "",
      custL: "",
      custP: "",
      custPcs: "",
      custM3: 0,
      notes: "",
    }))
  );

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [whRes, specRes, partaisRes] = await Promise.all([
        InventoryAPI.getWarehouses().catch(() => []),
        MasterDataAPI.getSpecies().catch(() => []),
        PartaiAPI.getPartais({ limit: 100 }).catch(() => []),
      ]);

      const whList = Array.isArray(whRes) ? whRes : (whRes?.data || whRes?.items || []);
      setWarehouses(whList);
      if (whList.length > 0) {
        setTargetWarehouseId(whList[0].id);
      }

      const spList = (Array.isArray(specRes) && specRes.length > 0) 
        ? specRes 
        : (Array.isArray(specRes?.data) && specRes.data.length > 0)
          ? specRes.data 
          : DEFAULT_SPECIES;
      setSpeciesList(spList);

      const pList = Array.isArray(partaisRes) ? partaisRes : (partaisRes?.data || []);
      setAllPartais(pList);

      const targetPId = urlPartaiId || (pList.length > 0 ? pList[0].id : "");
      if (targetPId) {
        setSelectedPartaiId(targetPId);
        await selectPartai(targetPId, spList);
      } else {
        setSpecies("");
      }
    } catch (e) {
      console.error(e);
      setSpeciesList(DEFAULT_SPECIES);
      setSpecies("");
    }
  };

  const selectPartai = async (partId: string, spList: any[] = speciesList) => {
    if (!partId) {
      setPartaiInfo(null);
      return;
    }
    try {
      const p = await PartaiAPI.getPartai(partId);
      if (p) {
        setPartaiInfo(p);
        const foundSpecies = 
          p.rawLogs?.[0]?.species || 
          p.inputLogs?.[0]?.species || 
          p.sawnOutputs?.[0]?.species || 
          p.purchases?.[0]?.species || 
          "";

        if (foundSpecies) {
          const matched = spList.find((s: any) => 
            (s.name || "").toUpperCase() === foundSpecies.toUpperCase() ||
            (s.code || "").toUpperCase() === foundSpecies.toUpperCase()
          );
          setSpecies(matched ? (matched.name || matched.code) : foundSpecies.toUpperCase());
        } else if (p.code) {
          const codeUpper = p.code.toUpperCase();
          const matchedByCode = spList.find((s: any) => 
            (s.name && codeUpper.includes(s.name.toUpperCase())) ||
            (s.code && codeUpper.includes(s.code.toUpperCase()))
          );
          if (matchedByCode) {
            setSpecies(matchedByCode.name || matchedByCode.code);
          } else {
            setSpecies("");
          }
        } else {
          setSpecies("");
        }

        if (p.warehouseId) {
          setTargetWarehouseId(p.warehouseId);
        }
      }
    } catch (e) {
      console.error("Error loading partai info:", e);
    }
  };

  const handleRowChange = (index: number, field: keyof PackingRow, val: string) => {
    const updated = [...rows];
    (updated[index] as any)[field] = val;

    // Recalculate Real M3
    const rT = parseFloat(updated[index].realT) || 0;
    const rL = parseFloat(updated[index].realL) || 0;
    const rP = parseFloat(updated[index].realP) || 0;
    const rPcs = parseFloat(updated[index].realPcs) || 0;
    updated[index].realM3 = (rT * rL * rP * rPcs) / 1000000;

    // Auto-fill customer dimensions if empty or user enters real
    if (field === "realT" && !updated[index].custT) updated[index].custT = val;
    if (field === "realL" && !updated[index].custL) updated[index].custL = val;
    if (field === "realP" && !updated[index].custP) updated[index].custP = val;
    if (field === "realPcs" && !updated[index].custPcs) updated[index].custPcs = val;

    // Recalculate Cust M3
    const cT = parseFloat(updated[index].custT || updated[index].realT) || 0;
    const cL = parseFloat(updated[index].custL || updated[index].realL) || 0;
    const cP = parseFloat(updated[index].custP || updated[index].realP) || 0;
    const cPcs = parseFloat(updated[index].custPcs || updated[index].realPcs) || 0;
    updated[index].custM3 = (cT * cL * cP * cPcs) / 1000000;

    setRows(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, curRow: number, fieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (curRow < rows.length - 1) {
        const nextId = `pkg-${fieldName}-${curRow + 1}`;
        const nextEl = document.getElementById(nextId);
        if (nextEl) nextEl.focus();
      } else {
        addRows(5);
        setTimeout(() => {
          const nextId = `pkg-${fieldName}-${curRow + 1}`;
          const nextEl = document.getElementById(nextId);
          if (nextEl) nextEl.focus();
        }, 50);
      }
    }
  };

  const addRows = (count: number = 5) => {
    const lastPallet = rows[rows.length - 1]?.palletNo || "01";
    const newItems: PackingRow[] = Array.from({ length: count }, () => ({
      palletNo: lastPallet,
      realT: "",
      realL: "",
      realP: "",
      realPcs: "",
      realM3: 0,
      custT: "",
      custL: "",
      custP: "",
      custPcs: "",
      custM3: 0,
      notes: "",
    }));
    setRows((prev) => [...prev, ...newItems]);
  };

  // Totals
  const totalRealPcs = useMemo(
    () => rows.reduce((s, r) => s + (parseFloat(r.realPcs) || 0), 0),
    [rows]
  );
  const totalRealM3 = useMemo(
    () => rows.reduce((s, r) => s + (r.realM3 || 0), 0),
    [rows]
  );

  const totalCustPcs = useMemo(
    () => rows.reduce((s, r) => s + (parseFloat(r.custPcs || r.realPcs) || 0), 0),
    [rows]
  );
  const totalCustM3 = useMemo(
    () => rows.reduce((s, r) => s + (r.custM3 || 0), 0),
    [rows]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter(
      (r) =>
        (parseFloat(r.realT) || 0) > 0 &&
        (parseFloat(r.realL) || 0) > 0 &&
        (parseFloat(r.realP) || 0) > 0 &&
        (parseFloat(r.realPcs) || 0) > 0
    );

    if (validRows.length === 0) {
      toast({
        title: "Tabel Masih Kosong",
        description: "Isi minimal satu baris ukuran dan jumlah batang (Pcs) yang valid.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setPageError(null);
    try {
      const payload = {
        packingNumber,
        packingDate,
        ownerName,
        species,
        containerNo,
        warehouseId: targetWarehouseId || undefined,
        notes,
        partaiId: selectedPartaiId || undefined,
        items: validRows.map((r) => {
          let itemNotes = r.notes || "";
          if (customColumns.length > 0) {
            const extraFields = customColumns
              .map((c) => {
                const val = r[c.id];
                return val ? `${c.label}: ${val}` : null;
              })
              .filter(Boolean);
            if (extraFields.length > 0) {
              itemNotes = itemNotes
                ? `${itemNotes} [${extraFields.join(", ")}]`
                : `[${extraFields.join(", ")}]`;
            }
          }
          return {
            palletNo: r.palletNo || "01",
            realT: parseFloat(r.realT),
            realL: parseFloat(r.realL),
            realP: parseFloat(r.realP),
            realPcs: parseInt(r.realPcs),
            custT: parseFloat(r.custT || r.realT),
            custL: parseFloat(r.custL || r.realL),
            custP: parseFloat(r.custP || r.realP),
            custPcs: parseInt(r.custPcs || r.realPcs),
            notes: itemNotes,
          };
        }),
      };

      await PackingAPI.createPacking(payload);
      toast({
        title: "Packing List Berhasil Disimpan!",
        description: `Dokumen ${packingNumber} berhasil dicatat dengan ${validRows.length} ukuran (Total Asli: ${totalRealM3.toFixed(4)} M³, Cust: ${totalCustM3.toFixed(4)} M³).`,
      });

      setTimeout(() => {
        if (selectedPartaiId) {
          router.push(`/inventory/partai/${selectedPartaiId}?tab=packing`);
        } else {
          router.push(`/inventory/packing`);
        }
      }, 700);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error?.message || err.message || "Gagal menyimpan packing list";
      setPageError(errMsg);
      toast({
        title: "Gagal Menyimpan Packing List",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1550px] w-full mx-auto p-4 md:p-6 pb-28">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (urlPartaiId) router.push(`/inventory/partai/${urlPartaiId}?tab=packing`);
              else router.back();
            }}
            className="mb-2 text-muted-foreground hover:text-foreground text-xs gap-1.5 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
              <Package className="w-6 h-6 text-purple-600" />
              Input Packing List Kayu (Dual Measurement)
            </h1>
            {partaiInfo && (
              <Badge variant="outline" className="font-mono text-xs border-purple-500 text-purple-600 bg-purple-50/50">
                Partai: {partaiInfo.code}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Format sesuai Sheet PACKING Excel 6: Catat ukuran asli pabrik berdampingan dengan ukuran perjanjian nominal customer untuk invoice & ekspor.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (urlPartaiId) router.push(`/inventory/partai/${urlPartaiId}?tab=packing`);
              else router.back();
            }}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs shadow-sm"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Menyimpan..." : "Simpan Packing List"}
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert variant="destructive" className="border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="font-semibold text-xs flex items-center justify-between">
            <span>{pageError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageError(null)}
              className="h-6 px-2 text-xs text-rose-600 hover:text-rose-800"
            >
              Tutup
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* HEADER INFORMASI PACKING */}
      <Card className="shadow-sm border-purple-200/80 dark:border-purple-900/40">
        <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 py-3 px-4 md:px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Layers className="w-4 h-4 text-purple-600" /> Header Dokumen Packing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Asal Partai Kayu</Label>
            <Select 
              value={selectedPartaiId} 
              onValueChange={async (val) => {
                setSelectedPartaiId(val || "");
                if (val) await selectPartai(val);
              }}
            >
              <SelectTrigger className="h-9 text-xs font-mono font-bold text-purple-700 bg-purple-50/40">
                <SelectValue placeholder="Pilih Asal Partai">
                  {allPartais.find((p: any) => p.id === selectedPartaiId)?.code || (selectedPartaiId ? "Partai Terpilih" : "Bebas / Multi-Partai")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <SelectItem value="none" className="text-xs">-- Tanpa Partai Tertentu (Stok Bebas) --</SelectItem>
                {allPartais.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-mono">
                    <span className="font-bold">{p.code}</span>
                    <span className="text-muted-foreground ml-1.5 text-[11px]">({p.supplier?.name || "Partai Kayu"})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">No. Packing / SPK *</Label>
            <Input
              value={packingNumber}
              onChange={(e) => setPackingNumber(e.target.value)}
              className="h-9 font-mono text-xs font-bold text-purple-700 dark:text-purple-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tanggal Packing *</Label>
            <Input
              type="date"
              value={packingDate}
              onChange={(e) => setPackingDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pemilik Kayu</Label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="PT Daun Emas Multi Perkasa"
              className="h-9 text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jenis Kayu / Species</Label>
            <Select
              value={species || ""}
              onValueChange={(val) => setSpecies(val || "")}
            >
              <SelectTrigger className="h-9 text-xs font-bold uppercase text-primary bg-background">
                <SelectValue placeholder="Pilih Jenis Kayu">
                  {species || <span className="text-muted-foreground font-normal normal-case">Pilih Jenis Kayu</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent searchable={true} className="min-w-[200px]">
                {speciesList.map((s: any) => {
                  const val = (s.name || s.code || "").toUpperCase();
                  return (
                    <SelectItem key={s.id || s.code || val} value={val}>
                      {s.name || s.code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">No. Kontainer</Label>
            <Input
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
              placeholder="Contoh: CONT-01"
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gudang Penyimpanan</Label>
            <Select value={targetWarehouseId} onValueChange={(val) => setTargetWarehouseId(val || "")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih Gudang">
                  {(() => {
                    const wh = warehouses.find((w: any) => w.id === targetWarehouseId);
                    if (wh) return wh.name || wh.code;
                    return "Pilih Gudang";
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name || wh.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PETUNJUK INPUT DUAL MEASUREMENT */}
      <div className="bg-muted/40 border border-border p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Tips Excel Dual Measurement:</strong> Kolom Kiri mencatat <strong>Ukuran Asli Pabrik</strong>, kolom Kanan mencatat <strong>Ukuran Nominal Customer</strong>. Bila ukuran customer sama, sistem otomatis menduplikasikannya. Tekan <strong>[Enter]</strong> untuk pindah ke baris bawahnya.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <span>Satuan: <strong>T, L, P (cm)</strong></span>
          <span>Rumus: <strong>T × L × P × Pcs / 1.000.000</strong></span>
        </div>
      </div>

      {/* SPREADSHEET TABLE GAYA EXCEL 6 */}
      <Card className="shadow-sm border-purple-200/70 dark:border-purple-900/40">
        <CardHeader className="bg-purple-50/40 dark:bg-purple-950/20 py-3 px-4 md:px-5 border-b flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
            <Scale className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Tabel Packing List (Riil Pabrik vs Nominal Customer)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Popover / Inline tambah kolom custom */}
            {showAddColInput ? (
              <div className="flex items-center gap-1.5 bg-background border rounded px-2 py-1 shadow-sm">
                <Input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomColumn();
                    } else if (e.key === "Escape") {
                      setShowAddColInput(false);
                    }
                  }}
                  placeholder="Nama kolom baru..."
                  className="h-7 text-xs w-36"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={addCustomColumn}
                  className="h-7 text-xs px-2.5 bg-purple-600 hover:bg-purple-700"
                >
                  OK
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddColInput(false)}
                  className="h-7 w-7 p-0 text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddColInput(true)}
                className="h-7 text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <Columns className="w-3.5 h-3.5" /> + Kolom Baru
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRows(5)}
              className="h-7 text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Plus className="w-3.5 h-3.5" /> +5 Baris
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] touch-pan-x">
            <Table className="min-w-[1250px]">
              <TableHeader className="bg-muted/70 sticky top-0 z-10 shadow-sm text-xs">
                {/* Header Level 1 */}
                <TableRow className="border-b">
                  <TableHead rowSpan={2} className="w-[100px] border-r text-center font-bold">
                    No. Palet
                  </TableHead>
                  <TableHead colSpan={5} className="border-r text-center font-bold bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300">
                    UKURAN ASLI PABRIK (PRODUKSI RIIL)
                  </TableHead>
                  <TableHead colSpan={5} className="border-r text-center font-bold bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300">
                    UKURAN CUSTOMER (NOMINAL INVOICE)
                  </TableHead>
                  {customColumns.length > 0 && (
                    <TableHead colSpan={customColumns.length} className="border-r text-center font-bold bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300">
                      KOLOM TAMBAHAN (CUSTOM)
                    </TableHead>
                  )}
                  <TableHead rowSpan={2} className="w-[140px] text-center font-bold border-r">
                    Keterangan
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[45px] text-center font-bold">
                    Aksi
                  </TableHead>
                </TableRow>
                {/* Header Level 2 */}
                <TableRow>
                  <TableHead className="w-[85px] text-center bg-blue-50/30 dark:bg-blue-950/20">T (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-blue-50/30 dark:bg-blue-950/20">L (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-blue-50/30 dark:bg-blue-950/20">P (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-blue-50/30 dark:bg-blue-950/20">Pcs</TableHead>
                  <TableHead className="w-[110px] text-right border-r font-bold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                    Vol M³
                  </TableHead>

                  <TableHead className="w-[85px] text-center bg-emerald-50/30 dark:bg-emerald-950/20">T (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-emerald-50/30 dark:bg-emerald-950/20">L (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-emerald-50/30 dark:bg-emerald-950/20">P (cm)</TableHead>
                  <TableHead className="w-[85px] text-center bg-emerald-50/30 dark:bg-emerald-950/20">Pcs</TableHead>
                  <TableHead className="w-[110px] text-right border-r font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                    Vol M³
                  </TableHead>

                  {customColumns.map((c) => (
                    <TableHead key={c.id} className="min-w-[120px] text-center bg-amber-50/30 dark:bg-amber-950/20 border-r px-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-amber-950 dark:text-amber-200">{c.label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomColumn(c.id)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          title="Hapus kolom"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/20">
                    {/* No Palet */}
                    <TableCell className="p-1.5 border-r">
                      <Input
                        id={`pkg-palletNo-${idx}`}
                        value={row.palletNo}
                        onChange={(e) => handleRowChange(idx, "palletNo", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "palletNo")}
                        placeholder="01"
                        className="h-8 text-xs font-mono text-center font-bold"
                      />
                    </TableCell>

                    {/* REAL FABRIK */}
                    <TableCell className="p-1.5 bg-blue-50/10">
                      <Input
                        id={`pkg-realT-${idx}`}
                        type="number"
                        step="any"
                        value={row.realT}
                        onChange={(e) => handleRowChange(idx, "realT", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "realT")}
                        placeholder="16"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-blue-50/10">
                      <Input
                        id={`pkg-realL-${idx}`}
                        type="number"
                        step="any"
                        value={row.realL}
                        onChange={(e) => handleRowChange(idx, "realL", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "realL")}
                        placeholder="16"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-blue-50/10">
                      <Input
                        id={`pkg-realP-${idx}`}
                        type="number"
                        step="any"
                        value={row.realP}
                        onChange={(e) => handleRowChange(idx, "realP", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "realP")}
                        placeholder="440"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-blue-50/10">
                      <Input
                        id={`pkg-realPcs-${idx}`}
                        type="number"
                        min="0"
                        value={row.realPcs}
                        onChange={(e) => handleRowChange(idx, "realPcs", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "realPcs")}
                        placeholder="15"
                        className="h-8 text-xs text-center font-bold text-blue-700 dark:text-blue-400"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400 pr-3 border-r bg-blue-50/10">
                      {row.realM3 > 0 ? row.realM3.toFixed(4) : "-"}
                    </TableCell>

                    {/* CUSTOMER NOMINAL */}
                    <TableCell className="p-1.5 bg-emerald-50/10">
                      <Input
                        id={`pkg-custT-${idx}`}
                        type="number"
                        step="any"
                        value={row.custT}
                        onChange={(e) => handleRowChange(idx, "custT", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "custT")}
                        placeholder="15"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-emerald-50/10">
                      <Input
                        id={`pkg-custL-${idx}`}
                        type="number"
                        step="any"
                        value={row.custL}
                        onChange={(e) => handleRowChange(idx, "custL", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "custL")}
                        placeholder="15"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-emerald-50/10">
                      <Input
                        id={`pkg-custP-${idx}`}
                        type="number"
                        step="any"
                        value={row.custP}
                        onChange={(e) => handleRowChange(idx, "custP", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "custP")}
                        placeholder="440"
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 bg-emerald-50/10">
                      <Input
                        id={`pkg-custPcs-${idx}`}
                        type="number"
                        min="0"
                        value={row.custPcs}
                        onChange={(e) => handleRowChange(idx, "custPcs", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "custPcs")}
                        placeholder="15"
                        className="h-8 text-xs text-center font-bold text-emerald-700 dark:text-emerald-400"
                      />
                    </TableCell>
                    <TableCell className="p-1.5 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 pr-3 border-r bg-emerald-50/10">
                      {row.custM3 > 0 ? row.custM3.toFixed(4) : "-"}
                    </TableCell>

                    {/* Custom dynamic columns */}
                    {customColumns.map((c) => (
                      <TableCell key={c.id} className="p-1.5 bg-amber-50/10 border-r">
                        <Input
                          value={row[c.id] || ""}
                          onChange={(e) => handleRowChange(idx, c.id, e.target.value)}
                          placeholder="..."
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                    ))}

                    {/* Keterangan */}
                    <TableCell className="p-1.5 border-r">
                      <Input
                        id={`pkg-notes-${idx}`}
                        value={row.notes}
                        onChange={(e) => handleRowChange(idx, "notes", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, "notes")}
                        placeholder="Ket..."
                        className="h-8 text-xs"
                      />
                    </TableCell>

                    {/* Aksi Hapus Baris */}
                    <TableCell className="p-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(idx)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* TOTAL FOOTER SUMMARY */}
          <div className="p-3 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between text-xs px-5 gap-4">
            <span className="text-muted-foreground font-semibold">Total Rekapitulasi Packing List:</span>
            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <div className="flex items-center gap-2 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1.5 rounded border border-blue-200">
                <span className="text-blue-900 dark:text-blue-300">Riil Pabrik:</span>
                <span className="font-mono text-foreground font-bold">{totalRealPcs} Pcs</span>
                <span className="text-muted-foreground">|</span>
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">
                  {totalRealM3.toFixed(4)} M³
                </span>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-200">
                <span className="text-emerald-900 dark:text-emerald-300">Nominal Customer:</span>
                <span className="font-mono text-foreground font-bold">{totalCustPcs} Pcs</span>
                <span className="text-muted-foreground">|</span>
                <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                  {totalCustM3.toFixed(4)} M³
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
