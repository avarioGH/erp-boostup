"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InventoryAPI, ProductionAPI, MasterDataAPI, PartaiAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Layers, 
  CheckCircle2, 
  Cog, 
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

interface SizeRow {
  bundleNo: string;
  species: string;
  t: string; // Tebal cm
  w: string; // Lebar cm
  l: string; // Panjang cm
  pcs: string;
  volumeM3: number;
}

const DEFAULT_PROCESSING_TYPES = [
  { id: "KD", code: "KD", name: "Kiln Dry (Oven)" },
  { id: "MOLDING", code: "MOLDING", name: "Molding / Profil" },
  { id: "RESAW", code: "RESAW", name: "Re-Sawing / Belah" },
  { id: "S4S", code: "S4S", name: "S4S (Serut 4 Sisi)" },
  { id: "FJ", code: "FJ", name: "Finger Joint" },
  { id: "SANDING", code: "SANDING", name: "Sanding / Amplas" },
  { id: "TREATMENT", code: "TREATMENT", name: "Chemical Treatment / Pengawetan" },
];

export default function CreateProcessingRunPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlPartaiId = searchParams.get("partaiId") || "";
  const [partaiInfo, setPartaiInfo] = useState<any>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [processNo, setProcessNo] = useState(`PRC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [processType, setProcessType] = useState<string>("KD");
  const [operator, setOperator] = useState("");
  const [notes, setNotes] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [processingTypes, setProcessingTypes] = useState<any[]>(DEFAULT_PROCESSING_TYPES);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Bagian 1: Input Sawn Timber yang dipotong (Pengurangan Kubikasi)
  const [inputRows, setInputRows] = useState<SizeRow[]>([
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
  ]);

  // Bagian 2: Output Sawn Timber Hasil Potong / Gesek (Penambahan Stok Baru)
  const [outputRows, setOutputRows] = useState<SizeRow[]>([
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0 },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [whRes, typesRes, specRes] = await Promise.all([
        InventoryAPI.getWarehouses().catch(() => []),
        MasterDataAPI.getProcessingTypes().catch(() => []),
        MasterDataAPI.getSpecies().catch(() => []),
      ]);

      const whList = Array.isArray(whRes) ? whRes : whRes?.items || [];
      setWarehouses(whList);

      // Default warehouse to active warehouse or first warehouse
      if (typeof window !== "undefined") {
        const storedWh = localStorage.getItem("active_warehouse");
        if (storedWh) {
          try {
            const parsed = JSON.parse(storedWh);
            if (parsed && parsed.id) setTargetWarehouseId(parsed.id);
          } catch (e) {}
        }
      }
      if (!targetWarehouseId && whList.length > 0) {
        setTargetWarehouseId(whList[0].id);
      }

      const rawTypes = Array.isArray(typesRes) ? typesRes : typesRes?.data || [];
      const types = rawTypes.length > 0 ? rawTypes : DEFAULT_PROCESSING_TYPES;
      setProcessingTypes(types);
      if (types.length > 0) {
        setProcessType(prev => prev || types[0].code || "KD");
      }

      const species = Array.isArray(specRes) ? specRes : specRes?.data || [];
      setSpeciesList(species);

      if (urlPartaiId) {
        try {
          const p = await PartaiAPI.getPartai(urlPartaiId);
          if (p) {
            setPartaiInfo(p);
            // Default species from partai if available
            const partaiSpecies = p.rawLogs?.[0]?.species || p.inputLogs?.[0]?.species || (species[0]?.name || "");
            if (partaiSpecies) {
              setInputRows(prev => prev.map(r => ({ ...r, species: r.species || partaiSpecies })));
              setOutputRows(prev => prev.map(r => ({ ...r, species: r.species || partaiSpecies })));
            }
            if (p.warehouseId) {
              setTargetWarehouseId(p.warehouseId);
            }
          }
        } catch (e) {
          console.error("Error fetching partai details:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Kalkulasi Volume Ukuran: (T cm * W cm * L cm * Pcs) / 1.000.000
  const calcVolume = (t: string, w: string, l: string, pcs: string): number => {
    const tNum = parseFloat(t) || 0;
    const wNum = parseFloat(w) || 0;
    const lNum = parseFloat(l) || 0;
    const pcsNum = parseInt(pcs) || 0;
    if (tNum <= 0 || wNum <= 0 || lNum <= 0 || pcsNum <= 0) return 0;
    const vol = (tNum * wNum * lNum * pcsNum) / 1000000;
    return isNaN(vol) ? 0 : Number(vol.toFixed(4));
  };

  const handleInputChange = (index: number, field: keyof SizeRow, value: string) => {
    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index].volumeM3 = calcVolume(
        updated[index].t,
        updated[index].w,
        updated[index].l,
        updated[index].pcs
      );
      return updated;
    });
  };

  const handleOutputChange = (index: number, field: keyof SizeRow, value: string) => {
    setOutputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index].volumeM3 = calcVolume(
        updated[index].t,
        updated[index].w,
        updated[index].l,
        updated[index].pcs
      );
      return updated;
    });
  };

  // Navigasi Vertikal Enter sperti Excel
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    columnKey: string,
    isInputTable: boolean
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const prefix = isInputTable ? "proc-in" : "proc-out";
      const nextRow = rowIndex + 1;
      const totalRows = isInputTable ? inputRows.length : outputRows.length;

      // Auto add row if at the end
      if (nextRow >= totalRows) {
        if (isInputTable) {
          addInputRows(5);
        } else {
          addOutputRows(5);
        }
      }

      setTimeout(() => {
        const nextId = `${prefix}-${columnKey}-${nextRow}`;
        const nextInput = document.getElementById(nextId) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 50);
    }
  };

  const addInputRows = (count: number) => {
    setInputRows(prev => {
      const newRows = Array.from({ length: count }).map(() => ({
        bundleNo: "",
        species: prev[prev.length - 1]?.species || "",
        t: "",
        w: "",
        l: "",
        pcs: "",
        volumeM3: 0,
      }));
      return [...prev, ...newRows];
    });
  };

  const addOutputRows = (count: number) => {
    setOutputRows(prev => {
      const newRows = Array.from({ length: count }).map(() => ({
        bundleNo: "",
        species: prev[prev.length - 1]?.species || "",
        t: "",
        w: "",
        l: "",
        pcs: "",
        volumeM3: 0,
      }));
      return [...prev, ...newRows];
    });
  };

  // Filter baris valid (tidak kosong)
  const validInputs = inputRows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseFloat(r.w) || 0) > 0 && (parseFloat(r.l) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
  const validOutputs = outputRows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseFloat(r.w) || 0) > 0 && (parseFloat(r.l) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);

  const totalInputPcs = validInputs.reduce((acc, r) => acc + (parseInt(r.pcs) || 0), 0);
  const totalInputM3 = validInputs.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);

  const totalOutputPcs = validOutputs.reduce((acc, r) => acc + (parseInt(r.pcs) || 0), 0);
  const totalOutputM3 = validOutputs.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);

  const yieldPercentage = totalInputM3 > 0 ? (totalOutputM3 / totalInputM3) * 100 : 0;

  // Nama label proses aktif
  const currentProcessObj = processingTypes.find(t => t.code === processType);
  const currentProcessName = currentProcessObj?.name || processType;

  const handleSubmit = async (status: "DRAFT" | "CONFIRMED") => {
    if (!processNo.trim()) {
      return toast({ title: "Validasi Gagal", description: "Nomor proses wajib diisi", variant: "destructive" });
    }
    if (validInputs.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal isi 1 baris ukuran bahan input yang dipotong kubikasinya", variant: "destructive" });
    }
    if (validOutputs.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal isi 1 baris ukuran hasil produk baru", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      const payload = {
        processNo: processNo.trim(),
        processType: processType,
        processDate: date,
        status: status,
        notes: `Jasa/Operator: ${operator || "-"}. ${notes || ""}`.trim(),
        inputVolumeM3: totalInputM3,
        outputVolumeM3: totalOutputM3,
        // Kirim bahan input berukuran & kubikasi
        inputs: validInputs.map((item, idx) => ({
          bundleNo: item.bundleNo || `IN-${idx + 1}`,
          species: item.species || "KAYU",
          thickness: Number(item.t),
          width: Number(item.w),
          length: Number(item.l),
          quantityPCS: Number(item.pcs),
          volumeM3: Number(item.volumeM3),
        })),
        // Kirim output produk hasil olahan baru
        outputs: validOutputs.map((item, idx) => ({
          outputType: "PRODUCT",
          bundleNo: item.bundleNo || `OUT-${processType}-${idx + 1}`,
          species: item.species || "KAYU",
          grade: processType, // Grade/Label otomatis sesuai nama proses
          thickness: Number(item.t),
          width: Number(item.w),
          length: Number(item.l),
          quantityPCS: Number(item.pcs),
          volumeM3: Number(item.volumeM3),
          warehouseId: targetWarehouseId || null,
        })),
      };

      const res = await ProductionAPI.createProcess(payload);

      if (status === "CONFIRMED" && res?.id) {
        await ProductionAPI.confirmProcess(res.id).catch(() => {});
      }

      toast({ 
        title: "Proses Berhasil Disimpan!", 
        description: `Proses ${processType} (${processNo}) dengan input ${totalInputM3.toFixed(4)} M³ dan output ${totalOutputM3.toFixed(4)} M³ berhasil disimpan ${status === "CONFIRMED" ? "dan saldo stok terupdate." : "sebagai DRAFT."}`
      });
      if (urlPartaiId) {
        router.push(`/inventory/partai/${urlPartaiId}?tab=processing`);
      } else {
        router.push("/production/processing");
      }
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Gagal Menyimpan Proses", 
        description: err?.response?.data?.message || err.message || "Terjadi kesalahan sistem", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] w-full mx-auto animate-in fade-in duration-300 pb-20 px-4 md:px-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => urlPartaiId ? router.push(`/inventory/partai/${urlPartaiId}?tab=processing`) : router.push("/production/processing")} 
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Cog className="w-6 h-6 text-primary" /> Input Batch Pengolahan (Processing)
              </h1>
              {partaiInfo && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Partai: {partaiInfo.code}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Input ukuran bahan baku & produk hasil baru secara vertikal ala Excel. Otomatis hitung kubikasi M³ & rendemen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("DRAFT")}
            disabled={submitting}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            Simpan Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit("CONFIRMED")}
            disabled={submitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5 text-white" />}
            Konfirmasi & Mutasi Stok
          </Button>
        </div>
      </div>

      {/* 1. INFORMASI HEADER PROSES */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="bg-primary/5 py-3 px-4 md:px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Layers className="w-4 h-4 text-primary" /> Header Transaksi Proses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jenis Proses (Master Data) *</Label>
            <Select value={processType} onValueChange={(val) => setProcessType(val || "KD")}>
              <SelectTrigger className="h-9 font-bold text-primary">
                <SelectValue placeholder="Pilih Jenis Proses">
                  {(() => {
                    const pt = processingTypes.find((t) => t.code === processType || t.id === processType);
                    if (pt) return `${pt.code} - ${pt.name}`;
                    return processType || "Pilih Jenis Proses";
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {processingTypes.map((t) => (
                  <SelectItem key={t.id || t.code} value={t.code} className="font-medium">
                    {t.code} - {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tanggal Proses *</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">No. Proses / SPK *</Label>
            <Input 
              type="text" 
              placeholder="Contoh: PRC-2026-001" 
              value={processNo} 
              onChange={(e) => setProcessNo(e.target.value)} 
              className="h-9 font-mono text-xs font-bold text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jasa / Mesin / Operator</Label>
            <Input 
              type="text" 
              placeholder="Nama Jasa / Mesin" 
              value={operator} 
              onChange={(e) => setOperator(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gudang Alokasi Hasil</Label>
            <Select value={targetWarehouseId} onValueChange={(val) => setTargetWarehouseId(val || "")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih Gudang">
                  {(() => {
                    const wh = warehouses.find((w: any) => w.id === targetWarehouseId);
                    if (wh) return wh.name || wh.code || wh.id;
                    return targetWarehouseId ? (warehouses.length === 0 ? "Memuat gudang..." : "Pilih Gudang") : "Pilih Gudang";
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name ? `${wh.name}${wh.code ? ` (${wh.code})` : ""}` : (wh.code || wh.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PETUNJUK EXCEL INPUT */}
      <div className="bg-muted/40 border border-border p-3 rounded-lg text-xs flex items-center justify-between gap-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Tips Input Seperti Excel:</strong> Ketik angka dimensi (P | L | T | Pcs), lalu tekan <strong>[Enter]</strong> untuk langsung pindah ke baris bawahnya. Baris kosong tidak akan disimpan ke sistem.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <span>Satuan: <strong>T, L, P (cm)</strong></span>
          <span>Rumus: <strong>T × L × P × Pcs / 1.000.000</strong></span>
        </div>
      </div>

      {/* SEKSI INPUT (PENGURANGAN) & OUTPUT (PENAMBAHAN) DISUSUN VERTIKAL KE BAWAH AGAR LEGA DAN TIDAK NABRAK */}
      <div className="flex flex-col gap-6">
        
        {/* SEKSI 1: INPUT SAWN TIMBER YANG AKAN DIPOTONG / DIGESEK (PENGURANGAN KUBIKASI) */}
        <Card className="shadow-sm border-blue-200/70 dark:border-blue-900/40">
          <CardHeader className="bg-blue-50/60 dark:bg-blue-950/20 py-3.5 px-4 md:px-5 border-b flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
                <ArrowDownCircle className="w-5 h-5 text-blue-600" />
                <span>1. Sawn Timber Input (Dipicu untuk Pemotongan / Gesek)</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Data sawn timber awal yang akan dipotong ukurannya (mengurangi kubikasi M³).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addInputRows(5)}
              className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Plus className="w-3.5 h-3.5" /> +5 Baris
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <Table className="min-w-[750px]">
                <TableHeader className="bg-muted/60 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[140px] text-xs">No. BDL / Tgl</TableHead>
                    <TableHead className="w-[150px] text-xs">Species / Jenis Kayu</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">T (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">L (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">P (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">Pcs</TableHead>
                    <TableHead className="w-[110px] text-xs text-right">Vol (M³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inputRows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-blue-50/20">
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-bundleNo-${idx}`}
                          value={row.bundleNo}
                          onChange={(e) => handleInputChange(idx, "bundleNo", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "bundleNo", true)}
                          placeholder="BDL-01"
                          className="h-8 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-species-${idx}`}
                          value={row.species}
                          onChange={(e) => handleInputChange(idx, "species", e.target.value.toUpperCase())}
                          onKeyDown={(e) => handleKeyDown(e, idx, "species", true)}
                          placeholder="KENARI"
                          className="h-8 text-xs uppercase"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-t-${idx}`}
                          type="number"
                          step="any"
                          value={row.t}
                          onChange={(e) => handleInputChange(idx, "t", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "t", true)}
                          placeholder="21"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-w-${idx}`}
                          type="number"
                          step="any"
                          value={row.w}
                          onChange={(e) => handleInputChange(idx, "w", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "w", true)}
                          placeholder="21"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-l-${idx}`}
                          type="number"
                          step="any"
                          value={row.l}
                          onChange={(e) => handleInputChange(idx, "l", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "l", true)}
                          placeholder="200"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-in-pcs-${idx}`}
                          type="number"
                          min="0"
                          value={row.pcs}
                          onChange={(e) => handleInputChange(idx, "pcs", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "pcs", true)}
                          placeholder="48"
                          className="h-8 text-xs text-center font-bold text-blue-700 dark:text-blue-400"
                        />
                      </TableCell>
                      <TableCell className="p-1.5 text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400 pr-3">
                        {row.volumeM3 > 0 ? row.volumeM3.toFixed(4) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-t flex items-center justify-between text-xs px-4">
              <span className="text-muted-foreground font-medium">Total Bahan Terpakai:</span>
              <div className="flex items-center gap-6 font-semibold">
                <span>Pcs: <strong className="font-mono text-foreground">{totalInputPcs}</strong></span>
                <span>Total M³: <strong className="font-mono text-sm text-blue-600 dark:text-blue-400">{totalInputM3.toFixed(4)} M³</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEKSI 2: OUTPUT HASIL GESEK / POTONG (PENAMBAHAN STOK SAWN TIMBER BARU / KD) */}
        <Card className="shadow-sm border-emerald-200/70 dark:border-emerald-900/40">
          <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/20 py-3.5 px-4 md:px-5 border-b flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm">
                <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                <span>2. Sawn Timber Output (Hasil Gesek / Potong Baru)</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hasil sawn timber setelah dipotong atau siap masuk ke KD / proses lanjutan (menambah stok M³).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addOutputRows(5)}
              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Plus className="w-3.5 h-3.5" /> +5 Baris
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <Table className="min-w-[750px]">
                <TableHeader className="bg-muted/60 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[140px] text-xs">No. BDL / Tgl</TableHead>
                    <TableHead className="w-[150px] text-xs">Species / Jenis Kayu</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">T (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">L (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">P (cm)</TableHead>
                    <TableHead className="w-[90px] text-xs text-center">Pcs</TableHead>
                    <TableHead className="w-[110px] text-xs text-right">Vol (M³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputRows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-emerald-50/20">
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-bundleNo-${idx}`}
                          value={row.bundleNo}
                          onChange={(e) => handleOutputChange(idx, "bundleNo", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "bundleNo", false)}
                          placeholder="BDL-KD-01"
                          className="h-8 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-species-${idx}`}
                          value={row.species}
                          onChange={(e) => handleOutputChange(idx, "species", e.target.value.toUpperCase())}
                          onKeyDown={(e) => handleKeyDown(e, idx, "species", false)}
                          placeholder="KENARI"
                          className="h-8 text-xs uppercase"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-t-${idx}`}
                          type="number"
                          step="any"
                          value={row.t}
                          onChange={(e) => handleOutputChange(idx, "t", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "t", false)}
                          placeholder="3.5"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-w-${idx}`}
                          type="number"
                          step="any"
                          value={row.w}
                          onChange={(e) => handleOutputChange(idx, "w", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "w", false)}
                          placeholder="16.5"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-l-${idx}`}
                          type="number"
                          step="any"
                          value={row.l}
                          onChange={(e) => handleOutputChange(idx, "l", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "l", false)}
                          placeholder="200"
                          className="h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          id={`proc-out-pcs-${idx}`}
                          type="number"
                          min="0"
                          value={row.pcs}
                          onChange={(e) => handleOutputChange(idx, "pcs", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, "pcs", false)}
                          placeholder="15"
                          className="h-8 text-xs text-center font-bold text-emerald-700 dark:text-emerald-400"
                        />
                      </TableCell>
                      <TableCell className="p-1.5 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 pr-3">
                        {row.volumeM3 > 0 ? row.volumeM3.toFixed(4) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-t flex items-center justify-between text-xs px-4">
              <span className="text-muted-foreground font-medium">Total Hasil {currentProcessName}:</span>
              <div className="flex items-center gap-6 font-semibold">
                <span>Pcs: <strong className="font-mono text-foreground">{totalOutputPcs}</strong></span>
                <span>Total M³: <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">{totalOutputM3.toFixed(4)} M³</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REKAPAN RENDEMEN KUBIKASI */}
      <Card className="bg-muted/20 border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Rekapitulasi Konversi Kubikasi ({currentProcessName})
            </h4>
            <p className="text-xs text-muted-foreground">
              Kubikasi stok lama akan berkurang sebesar <strong className="text-blue-600">{totalInputM3.toFixed(4)} M³</strong> dan produk olahan baru bertambah sebesar <strong className="text-emerald-600">{totalOutputM3.toFixed(4)} M³</strong>.
            </p>
          </div>
          <div className="flex items-center gap-8 text-xs">
            <div className="text-right">
              <p className="text-muted-foreground">Persentase Rendemen Output</p>
              <p className="text-xl font-bold font-mono text-primary">{yieldPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
