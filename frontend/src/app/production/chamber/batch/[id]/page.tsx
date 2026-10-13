"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { ProductionAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Flame, 
  Package, 
  Layers, 
  Trash2,
  Calendar,
  Building
} from "lucide-react";

export default function ChamberBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBatchDetail();
  }, [id]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    try {
      const data = await ProductionAPI.getProcess(id);
      setBatch(data);
    } catch (err: any) {
      toast({ title: "Gagal memuat batch", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBatch = async () => {
    if (!window.confirm("Konfirmasi batch ini? Stok sawn timber akan dipotong dan stok produk KD baru akan ditambahkan ke sistem.")) return;
    setProcessing(true);
    try {
      await ProductionAPI.confirmProcess(id);
      toast({ title: "Berhasil!", description: "Batch KD telah dikonfirmasi dan mutasi stok telah dieksekusi." });
      fetchBatchDetail();
    } catch (err: any) {
      toast({ 
        title: "Gagal Konfirmasi", 
        description: err.response?.data?.message || err.message || "Terjadi kesalahan", 
        variant: "destructive" 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBatch = async () => {
    if (!window.confirm("Batalkan batch ini? Mutasi stok akan dibatalkan/di-reversal.")) return;
    setProcessing(true);
    try {
      await ProductionAPI.cancelProcess(id);
      toast({ title: "Batch Dibatalkan", description: "Proses batch telah dibatalkan." });
      fetchBatchDetail();
    } catch (err: any) {
      toast({ 
        title: "Gagal Membatalkan", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm("Hapus draft batch ini secara permanen?")) return;
    setProcessing(true);
    try {
      await ProductionAPI.deleteProcess(id);
      toast({ title: "Draft Dihapus", description: "Batch KD telah dihapus." });
      router.push("/production/chamber");
    } catch (err: any) {
      toast({ 
        title: "Gagal Menghapus", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat detail Project KD...</span>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-16 text-center space-y-4">
        <p className="text-muted-foreground">Data Project Batch KD tidak ditemukan.</p>
        <Button onClick={() => router.push("/production/chamber")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Halaman Chamber
        </Button>
      </div>
    );
  }

  const isDraft = batch.status === "DRAFT";
  const isConfirmed = batch.status === "CONFIRMED";
  const isCancelled = batch.status === "CANCELLED";

  const totalInputPcs = (batch.inputs || []).reduce((sum: number, i: any) => sum + (i.quantityPCS || 0), 0);
  const totalOutputPcs = (batch.outputs || []).reduce((sum: number, o: any) => sum + (o.quantityPCS || 0), 0);

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-300 pb-16 px-4 md:px-6">
      {/* HEADER DETAIL */}
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-500" />
                {batch.processNo}
              </h1>
              <Badge 
                variant={isConfirmed ? "default" : isCancelled ? "destructive" : "outline"}
                className={
                  isConfirmed 
                    ? "bg-emerald-600 font-bold text-xs" 
                    : isCancelled 
                    ? "bg-rose-600 font-bold text-xs text-white" 
                    : "text-amber-600 border-amber-500 font-bold text-xs"
                }
              >
                {batch.status}
              </Badge>
              <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                OVEN / KD
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal: {batch.processDate ? format(new Date(batch.processDate), "dd MMMM yyyy") : "-"}
              </span>
              <span>•</span>
              <span>{batch.notes || "Tidak ada catatan"}</span>
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isDraft && (
            <>
              <Button 
                variant="outline" 
                onClick={handleDeleteDraft}
                disabled={processing}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Hapus Draft
              </Button>
              <Button 
                onClick={handleConfirmBatch}
                disabled={processing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                Konfirmasi & Potong Stok
              </Button>
            </>
          )}

          {isConfirmed && (
            <Button 
              variant="outline" 
              onClick={handleCancelBatch}
              disabled={processing}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
              Batalkan Batch (Reversal Stok)
            </Button>
          )}
        </div>
      </div>

      {/* RINGKASAN METRIK BATCH */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Bahan Input (Pcs)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">{totalInputPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sawn Timber yang diambil</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Bahan Input (m³)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 mt-1">{Number(batch.inputVolumeM3 || 0).toFixed(4)} m³</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total volume sawn timber</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Hasil Produk KD (Pcs)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">{totalOutputPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Produk jadi siap stok</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Hasil Produk KD (m³)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1">{Number(batch.outputVolumeM3 || 0).toFixed(4)} m³</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total volume produk KD</p>
          </CardContent>
        </Card>
      </div>

      {/* 1. TABEL BAHAN SAWN TIMBER YANG DIAMBIL */}
      <Card className="shadow-sm">
        <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            1. Bahan Sawn Timber yang Diambil (Input Stok)
          </CardTitle>
          <CardDescription className="text-xs">
            Stok sawn timber yang berkurang dari inventori untuk dimasukkan ke oven batch ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">SKU / Produk</TableHead>
                  <TableHead className="w-[140px]">Spesies</TableHead>
                  <TableHead className="w-[100px]">Grade</TableHead>
                  <TableHead className="w-[140px]">Ukuran (TxLxP cm)</TableHead>
                  <TableHead className="w-[160px]">Lokasi Gudang</TableHead>
                  <TableHead className="w-[120px] text-right">Pcs Diambil</TableHead>
                  <TableHead className="w-[130px] text-right">Volume (m³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(batch.inputs || []).map((input: any, idx: number) => {
                  const v = input.variant || {};
                  const tCm = v.thickness ? v.thickness / 10 : 0;
                  const lCm = v.width ? v.width / 10 : 0;
                  const pCm = v.length ? v.length / 10 : 0;
                  const whName = input.timberStock?.location?.name || input.timberStock?.location?.code || "-";

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono font-semibold text-xs text-primary">
                        {v.sku || "-"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{v.species || "-"}</TableCell>
                      <TableCell className="text-xs">{v.grade || "-"}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {tCm} x {lCm} x {pCm} cm
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{whName}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {input.quantityPCS}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-blue-600">
                        {Number(input.volumeM3 || 0).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. TABEL HASIL PRODUK KD BARU */}
      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
        <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            2. Hasil Produk Baru KD (Output Stok Masuk)
          </CardTitle>
          <CardDescription className="text-xs">
            Produk olahan oven yang menjadi stok baru dengan identitas KD di inventori.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">SKU / Produk KD Baru</TableHead>
                  <TableHead className="w-[140px]">Spesies</TableHead>
                  <TableHead className="w-[100px]">Grade</TableHead>
                  <TableHead className="w-[140px]">Ukuran (TxLxP cm)</TableHead>
                  <TableHead className="w-[160px]">Gudang Masuk</TableHead>
                  <TableHead className="w-[120px] text-right">Qty (Pcs)</TableHead>
                  <TableHead className="w-[130px] text-right">Volume (m³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(batch.outputs || []).map((output: any, idx: number) => {
                  const v = output.variant || {};
                  const tCm = v.thickness ? v.thickness / 10 : 0;
                  const lCm = v.width ? v.width / 10 : 0;
                  const pCm = v.length ? v.length / 10 : 0;
                  const whName = output.warehouse?.name || output.warehouse?.code || "-";

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono font-semibold text-xs text-emerald-600">
                        {v.sku || "KD-ITEM"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{v.species || "-"}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-emerald-700 border-emerald-500 font-bold text-[10px]">
                          {v.grade || "KD"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {tCm} x {lCm} x {pCm} cm
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{whName}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {output.quantityPCS}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
                        {Number(output.volumeM3 || 0).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
