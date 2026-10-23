"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TimberAPI, InventoryAPI, ProductionAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search, 
  Save, 
  Loader2, 
  Layers, 
  Flame, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function CreateChamberKDPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [noKd, setNoKd] = useState(`KD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [jasaKd, setJasaKd] = useState("");
  const [notes, setNotes] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bahan Input (Stok Sawn Timber yang diambil)
  const [inputItems, setInputItems] = useState<any[]>([]);

  // Hasil Output Produk KD
  const [outputItems, setOutputItems] = useState<any[]>([
    {
      noBdl: "BDL-KD-01",
      species: "ULIN",
      t: "2",
      l: "4",
      p: "50",
      pcs: "50",
      volumeM3: 0.002,
    },
  ]);

  // Modal pencarian stok input
  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const stocksPerPage = 8;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingStocks(true);
      const [whRes, stockRes] = await Promise.all([
        InventoryAPI.getWarehouses().catch(() => []),
        TimberAPI.getTimberStock({ take: 1000 }).catch(() => ({ items: [] })),
      ]);

      const whList = Array.isArray(whRes) ? whRes : whRes?.items || [];
      setWarehouses(whList);
      if (whList.length > 0) {
        setTargetWarehouseId(whList[0].id);
      }

      const rawStockList = Array.isArray(stockRes) ? stockRes : stockRes?.items || [];
      // Hanya tampilkan stok yang memiliki kuantitas > 0
      const activeStocks = rawStockList.filter((s: any) => (s.currentPcs || 0) > 0);
      setStocks(activeStocks);
    } catch (err: any) {
      toast({ title: "Gagal memuat data", description: err.message, variant: "destructive" });
    } finally {
      setLoadingStocks(false);
    }
  };

  // Kalkulasi Volume Output: (T * L * P * pcs) / 1.000.000
  const handleOutputChange = (index: number, field: string, value: string) => {
    const updated = [...outputItems];
    updated[index][field] = value;

    const t = parseFloat(updated[index].t) || 0;
    const l = parseFloat(updated[index].l) || 0;
    const p = parseFloat(updated[index].p) || 0;
    const pcs = parseInt(updated[index].pcs) || 0;

    const volume = (t * l * p * pcs) / 1000000;
    updated[index].volumeM3 = isNaN(volume) ? 0 : Number(volume.toFixed(4));

    setOutputItems(updated);
  };

  const addOutputRow = () => {
    const last = outputItems[outputItems.length - 1];
    setOutputItems([
      ...outputItems,
      {
        noBdl: last ? last.noBdl : `BDL-KD-${String(outputItems.length + 1).padStart(2, "0")}`,
        species: last ? last.species : "ULIN",
        t: last ? last.t : "",
        l: last ? last.l : "",
        p: last ? last.p : "",
        pcs: "",
        volumeM3: 0,
      },
    ]);
  };

  const removeOutputRow = (index: number) => {
    if (outputItems.length <= 1) return;
    setOutputItems(outputItems.filter((_, idx) => idx !== index));
  };

  // Pilih stok input
  const handleSelectStock = (stock: any) => {
    const exists = inputItems.find((item) => item.timberStockId === stock.id);
    if (exists) {
      toast({ title: "Stok sudah ada", description: "Item ini sudah ditambahkan ke daftar bahan input." });
      return;
    }

    const variant = stock.timberVariant || {};
    // Tebal, Lebar, Panjang (dalam cm) jika variant menyimpan dalam mm
    const tCm = variant.thickness ? variant.thickness / 10 : 0;
    const lCm = variant.width ? variant.width / 10 : 0;
    const pCm = variant.length ? variant.length / 10 : 0;

    const newItem = {
      timberStockId: stock.id,
      variantId: variant.id,
      species: variant.species || "KAYU",
      grade: variant.grade || "-",
      noBdlApm: stock.batch && stock.batch !== "UNKNOWN" ? stock.batch : variant.sku || "-",
      tebal: tCm || 0,
      lebar: lCm || 0,
      panjang: pCm || 0,
      maxPcs: stock.currentPcs || 0,
      pcs: stock.currentPcs || 0, // default ambil seluruh pcs
      unitVolumeM3: variant.volumePerPiece || ((tCm * lCm * pCm) / 1000000) || 0,
      volumeM3: stock.currentVolumeM3 || 0,
      locationName: stock.location?.name || stock.location?.code || "-",
    };

    setInputItems([...inputItems, newItem]);
    toast({ title: "Bahan Ditambahkan", description: `${variant.sku} dimasukkan ke batch.` });
    setIsStockSearchOpen(false);
  };

  const handleInputPcsChange = (index: number, val: string) => {
    const updated = [...inputItems];
    const item = updated[index];
    let pcs = parseInt(val) || 0;
    if (pcs < 0) pcs = 0;
    if (pcs > item.maxPcs) pcs = item.maxPcs;

    item.pcs = pcs;
    const calcVol = (item.tebal * item.lebar * item.panjang * pcs) / 1000000;
    item.volumeM3 = Number(calcVol.toFixed(4));
    setInputItems(updated);
  };

  const removeInputItem = (index: number) => {
    setInputItems(inputItems.filter((_, idx) => idx !== index));
  };

  // Total summary
  const totalInputPcs = inputItems.reduce((sum, item) => sum + (Number(item.pcs) || 0), 0);
  const totalInputM3 = inputItems.reduce((sum, item) => sum + (Number(item.volumeM3) || 0), 0);

  const totalOutputPcs = outputItems.reduce((sum, item) => sum + (Number(item.pcs) || 0), 0);
  const totalOutputM3 = outputItems.reduce((sum, item) => sum + (Number(item.volumeM3) || 0), 0);

  // Filter list stok untuk modal pencarian
  const filteredStocks = stocks.filter((s: any) => {
    const v = s.timberVariant || {};
    const tCm = v.thickness ? v.thickness / 10 : 0;
    const lCm = v.width ? v.width / 10 : 0;
    const pCm = v.length ? v.length / 10 : 0;
    const label = `${v.species || "KAYU"}-${v.grade || "STD"}-${tCm}x${lCm}x${pCm} (${s.currentPcs}pcs) ${s.batch || ""}`.toLowerCase();
    return label.includes(stockSearchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredStocks.length / stocksPerPage) || 1;
  const paginatedStocks = filteredStocks.slice((stockPage - 1) * stocksPerPage, stockPage * stocksPerPage);

  // Submit batch KD
  const handleSaveBatch = async (status: "DRAFT" | "CONFIRMED") => {
    if (!noKd.trim()) {
      return toast({ title: "Validasi Gagal", description: "Nomor KD harus diisi", variant: "destructive" });
    }
    if (inputItems.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal masukkan 1 bahan sawn timber yang diambil", variant: "destructive" });
    }
    if (outputItems.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal masukkan 1 produk hasil KD", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      const payload = {
        processNo: noKd.trim(),
        processType: "KD",
        processDate: date,
        status: status,
        notes: `Jasa KD: ${jasaKd || "-"}. ${notes || ""}`.trim(),
        inputs: inputItems.map((item) => ({
          timberStockId: item.timberStockId,
          variantId: item.variantId,
          quantityPCS: Number(item.pcs),
          volumeM3: Number(item.volumeM3),
        })),
        outputs: outputItems.map((out) => ({
          outputType: "PRODUCT",
          species: out.species || "KAYU",
          grade: "KD",
          thickness: Number(out.t),
          width: Number(out.l),
          length: Number(out.p),
          quantityPCS: Number(out.pcs),
          volumeM3: Number(out.volumeM3),
          warehouseId: targetWarehouseId || null,
        })),
      };

      const res = await ProductionAPI.createProcess(payload);

      if (status === "CONFIRMED" && res?.id) {
        // Otomatis confirm jika user memilih Simpan & Posting Stok
        await ProductionAPI.confirmProcess(res.id);
      }

      toast({ 
        title: "Berhasil!", 
        description: `Batch KD ${noKd} berhasil disimpan ${status === "CONFIRMED" ? "dan stok otomatis diperbarui!" : "sebagai DRAFT."}` 
      });
      router.push("/production/chamber");
    } catch (err: any) {
      toast({ 
        title: "Gagal Menyimpan Batch", 
        description: err.response?.data?.message || err.message || "Terjadi kesalahan sistem", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-300 pb-16 px-4 md:px-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/production/chamber")} 
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Flame className="w-7 h-7 text-amber-500" />
              Tambah Batch / Project KD
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Transformasi pengeringan kayu dari bahan Sawn Timber menjadi Produk Jadi KD.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSaveBatch("DRAFT")}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSaveBatch("CONFIRMED")}
            disabled={submitting}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Konfirmasi & Potong Stok
          </Button>
        </div>
      </div>

      {/* 1. INFORMASI BATCH KD */}
      <Card className="shadow-sm border-amber-200/60 dark:border-amber-900/30">
        <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 py-3.5 px-4 md:px-6 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400">
            <Layers className="w-4 h-4" /> Header Informasi KD
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tanggal Proses KD *</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">No. KD *</Label>
            <Input 
              type="text" 
              placeholder="Contoh: KD-2026-001" 
              value={noKd} 
              onChange={(e) => setNoKd(e.target.value)} 
              className="h-9 font-semibold text-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jasa KD (Nama / Operator) *</Label>
            <Input 
              type="text" 
              placeholder="Nama Jasa / Operator Oven" 
              value={jasaKd} 
              onChange={(e) => setJasaKd(e.target.value)} 
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gudang Tujuan Hasil KD</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={targetWarehouseId}
              onChange={(e) => setTargetWarehouseId(e.target.value)}
            >
              {warehouses.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name || wh.code}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 2. BAHAN BAKU: AMBIL DARI STOK SAWN TIMBER */}
      <Card className="shadow-sm">
        <CardHeader className="py-3.5 px-4 md:px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              1. Bahan Input (Pengurangan Stok Sawn Timber)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Pilih stok sawn timber yang masuk ke oven/chamber untuk diproses dalam batch ini.
            </CardDescription>
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setStockPage(1);
              setStockSearchQuery("");
              setIsStockSearchOpen(true);
            }}
          >
            <Search className="w-4 h-4 mr-1.5" /> Cari & Ambil Stok Sawn Timber
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Jenis Kayu</TableHead>
                  <TableHead className="w-[150px]">No BDL APM</TableHead>
                  <TableHead className="w-[100px] text-right">Tebal (cm)</TableHead>
                  <TableHead className="w-[100px] text-right">Lebar (cm)</TableHead>
                  <TableHead className="w-[100px] text-right">Panjang (cm)</TableHead>
                  <TableHead className="w-[130px] text-center">Pcs Diambil</TableHead>
                  <TableHead className="w-[120px] text-right">Volume (m³)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      Belum ada stok yang dipilih. Klik tombol <strong>"Cari & Ambil Stok Sawn Timber"</strong> di atas untuk mengambil bahan dari inventori.
                    </TableCell>
                  </TableRow>
                ) : (
                  inputItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs">{item.species}</TableCell>
                      <TableCell className="font-mono text-xs">{item.noBdlApm}</TableCell>
                      <TableCell className="text-right text-xs">{item.tebal}</TableCell>
                      <TableCell className="text-right text-xs">{item.lebar}</TableCell>
                      <TableCell className="text-right text-xs">{item.panjang}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input 
                            type="number"
                            min="1"
                            max={item.maxPcs}
                            value={item.pcs}
                            onChange={(e) => handleInputPcsChange(idx, e.target.value)}
                            className="h-8 w-20 text-center font-bold text-xs"
                          />
                          <span className="text-[11px] text-muted-foreground">/ {item.maxPcs}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-blue-600">
                        {Number(item.volumeM3 || 0).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => removeInputItem(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {inputItems.length > 0 && (
            <div className="p-3 bg-muted/20 border-t flex items-center justify-between text-xs font-semibold px-4">
              <span>Total Bahan Masuk:</span>
              <div className="flex items-center gap-6">
                <span>Pcs: <strong className="text-foreground font-mono">{totalInputPcs}</strong></span>
                <span>Volume: <strong className="text-blue-600 font-mono text-sm">{totalInputM3.toFixed(4)} m³</strong></span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. HASIL HITUNGAN PRODUK BARU KD */}
      <Card className="shadow-sm border-emerald-200/60 dark:border-emerald-900/30">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 py-3.5 px-4 md:px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              2. Hasil Produk Baru KD (Penambahan Stok Baru)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Di 1 BDL bisa memiliki hitungan T, L, P berbeda-beda. Rumus volume: T × L × P × Pcs / 1.000.000.
            </CardDescription>
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={addOutputRow}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Baris Ukuran KD
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[160px]">No BDL</TableHead>
                  <TableHead className="w-[140px]">Jenis</TableHead>
                  <TableHead className="w-[100px]">T (cm)</TableHead>
                  <TableHead className="w-[100px]">L (cm)</TableHead>
                  <TableHead className="w-[100px]">P (cm)</TableHead>
                  <TableHead className="w-[100px]">Pcs</TableHead>
                  <TableHead className="w-[130px] text-right">Volume (m³)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outputItems.map((out, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="p-2">
                      <Input 
                        placeholder="BDL-KD-01" 
                        value={out.noBdl} 
                        onChange={(e) => handleOutputChange(idx, "noBdl", e.target.value)}
                        className="h-8 font-mono text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        placeholder="ULIN" 
                        value={out.species} 
                        onChange={(e) => handleOutputChange(idx, "species", e.target.value)}
                        className="h-8 uppercase text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        step="any"
                        placeholder="2" 
                        value={out.t} 
                        onChange={(e) => handleOutputChange(idx, "t", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        step="any"
                        placeholder="4" 
                        value={out.l} 
                        onChange={(e) => handleOutputChange(idx, "l", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        step="any"
                        placeholder="50" 
                        value={out.p} 
                        onChange={(e) => handleOutputChange(idx, "p", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        min="1"
                        placeholder="50" 
                        value={out.pcs} 
                        onChange={(e) => handleOutputChange(idx, "pcs", e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </TableCell>
                    <TableCell className="p-2 font-mono font-bold text-right text-emerald-600 text-xs">
                      {Number(out.volumeM3 || 0).toFixed(4)}
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => removeOutputRow(idx)}
                        disabled={outputItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-emerald-50/30 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs px-4">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={addOutputRow}
              className="border border-dashed text-xs h-8 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris Ukuran Lagi
            </Button>
            <div className="flex items-center gap-6 font-semibold">
              <span>Total Hasil KD:</span>
              <span>Pcs: <strong className="text-foreground font-mono">{totalOutputPcs}</strong></span>
              <span>Volume: <strong className="text-emerald-600 font-mono text-sm">{totalOutputM3.toFixed(4)} m³</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL SEARCH STOK INPUT SAWN TIMBER */}
      <Dialog open={isStockSearchOpen} onOpenChange={setIsStockSearchOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Pilih Bahan Sawn Timber dari Stok
            </DialogTitle>
            <DialogDescription className="text-xs">
              Format tampilan: <strong>[JENIS]-[GRADE]-[TxLxP] ([PCS] pcs)</strong>. Cari dan klik "Pilih" untuk menambahkan ke batch KD.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari berdasarkan jenis kayu, grade, atau ukuran (contoh: ULIN, 20x40x50)..."
                value={stockSearchQuery}
                onChange={(e) => {
                  setStockSearchQuery(e.target.value);
                  setStockPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs">Nama Produk / Sawn Timber</TableHead>
                    <TableHead className="text-xs">Lokasi Gudang</TableHead>
                    <TableHead className="text-xs text-right">Tersedia (Pcs)</TableHead>
                    <TableHead className="text-xs text-right">Volume (m³)</TableHead>
                    <TableHead className="w-[90px] text-center text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingStocks ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        <span className="text-xs text-muted-foreground mt-2 block">Memuat stok sawn timber...</span>
                      </TableCell>
                    </TableRow>
                  ) : paginatedStocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                        Tidak ada stok sawn timber yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStocks.map((s: any) => {
                      const v = s.timberVariant || {};
                      const tCm = v.thickness ? v.thickness / 10 : 0;
                      const lCm = v.width ? v.width / 10 : 0;
                      const pCm = v.length ? v.length / 10 : 0;
                      const productName = `${v.species || "KAYU"}-${v.grade || "STD"}-${tCm}x${lCm}x${pCm} (${s.currentPcs}pcs)`;
                      const isAdded = inputItems.some((i) => i.timberStockId === s.id);

                      return (
                        <TableRow key={s.id} className={isAdded ? "bg-muted/40 opacity-70" : ""}>
                          <TableCell className="py-2.5">
                            <div className="font-semibold text-xs text-foreground">{productName}</div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              BDL: {s.batch && s.batch !== "UNKNOWN" ? s.batch : v.sku || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground">
                            {s.location?.name || s.location?.code || "-"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-foreground">
                            {s.currentPcs}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono text-xs text-blue-600">
                            {Number(s.currentVolumeM3 || 0).toFixed(4)}
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            <Button 
                              size="sm" 
                              variant={isAdded ? "secondary" : "default"}
                              disabled={isAdded}
                              onClick={() => handleSelectStock(s)}
                              className="h-7 text-xs px-2.5"
                            >
                              {isAdded ? "Dipilih" : "Pilih"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-muted-foreground">
                  Halaman {stockPage} dari {totalPages} ({filteredStocks.length} stok)
                </span>
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={stockPage <= 1}
                    onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5"
                  >
                    Sebelumnya
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={stockPage >= totalPages}
                    onClick={() => setStockPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2.5"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
