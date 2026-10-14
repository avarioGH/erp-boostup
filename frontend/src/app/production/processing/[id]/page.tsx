"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { ProductionAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Cog, 
  Layers, 
  Trash2,
  Calendar,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";

export default function ProcessingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [processData, setProcessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await ProductionAPI.getProcess(id);
      setProcessData(data);
    } catch (err: any) {
      toast({ title: "Gagal memuat proses", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("Konfirmasi proses ini? Kubikasi bahan lama akan dipotong dan stok produk baru akan ditambahkan.")) return;
    setProcessing(true);
    try {
      await ProductionAPI.confirmProcess(id);
      toast({ title: "Berhasil!", description: "Proses telah dikonfirmasi dan mutasi stok dieksekusi." });
      fetchDetail();
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

  const handleCancel = async () => {
    if (!window.confirm("Batalkan proses ini? Mutasi stok akan di-reversal (dikembalikan).")) return;
    setProcessing(true);
    try {
      await ProductionAPI.cancelProcess(id);
      toast({ title: "Proses Dibatalkan", description: "Proses transaksi telah dibatalkan." });
      fetchDetail();
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

  const handleDelete = async () => {
    if (!window.confirm("Hapus draft proses ini secara permanen?")) return;
    setProcessing(true);
    try {
      await ProductionAPI.deleteProcess(id);
      toast({ title: "Draft Dihapus", description: "Data proses telah dihapus." });
      router.push("/production/processing");
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
        <span className="text-sm text-muted-foreground">Memuat detail proses...</span>
      </div>
    );
  }

  if (!processData) {
    return (
      <div className="p-16 text-center space-y-4">
        <p className="text-muted-foreground">Data proses tidak ditemukan.</p>
        <Button onClick={() => router.push("/production/processing")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Processing
        </Button>
      </div>
    );
  }

  const isDraft = processData.status === "DRAFT";
  const isConfirmed = processData.status === "CONFIRMED";
  const isCancelled = processData.status === "CANCELLED";

  const totalInputPcs = (processData.inputs || []).reduce((sum: number, i: any) => sum + (i.quantityPCS || 0), 0);
  const totalOutputPcs = (processData.outputs || []).reduce((sum: number, o: any) => sum + (o.quantityPCS || 0), 0);
  const yieldPct = processData.inputVolumeM3 > 0 ? ((processData.outputVolumeM3 / processData.inputVolumeM3) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-300 pb-16 px-4 md:px-6">
      {/* HEADER DETAIL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/production/processing")} 
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Cog className="w-6 h-6 text-primary" />
                {processData.processNo}
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
                {processData.status}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-mono text-xs font-semibold">
                {processData.processType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal: {processData.processDate ? format(new Date(processData.processDate), "dd MMMM yyyy") : "-"}
              </span>
              <span>•</span>
              <span>{processData.notes || "Tidak ada catatan"}</span>
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isDraft && (
            <>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={processing}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Hapus Draft
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={processing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                Konfirmasi & Mutasi Stok
              </Button>
            </>
          )}

          {isConfirmed && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={processing}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
              Batalkan Proses (Reversal Stok)
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
            <p className="text-[11px] text-muted-foreground mt-0.5">Bahan lama yang dipotong</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Bahan Input (m³)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 mt-1">{Number(processData.inputVolumeM3 || 0).toFixed(4)} m³</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total kubikasi bahan masuk</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Hasil Produk Baru (Pcs)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">{totalOutputPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Produk {processData.processType}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted-foreground">Hasil Produk Baru (m³)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1">{Number(processData.outputVolumeM3 || 0).toFixed(4)} m³</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rendemen: {yieldPct}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 1. TABEL BAHAN INPUT */}
      <Card className="shadow-sm border-blue-200/60 dark:border-blue-900/30">
        <CardHeader className="py-3 px-4 md:px-6 border-b bg-blue-50/30 dark:bg-blue-950/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <ArrowDownCircle className="w-4 h-4 text-blue-600" />
            1. Rincian Bahan Input (Pengurangan Kubikasi)
          </CardTitle>
          <span className="text-xs font-mono font-bold text-blue-600">
            Total: {Number(processData.inputVolumeM3 || 0).toFixed(4)} M³
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[60px] text-center">No</TableHead>
                  <TableHead>Produk / Variant Sumber</TableHead>
                  <TableHead className="text-center">Dimensi (mm)</TableHead>
                  <TableHead className="text-center">Kuantitas (PCS)</TableHead>
                  <TableHead className="text-right pr-6">Volume Terpotong (M³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(processData.inputs || []).map((input: any, idx: number) => {
                  const v = input.variant || {};
                  return (
                    <TableRow key={input.id || idx}>
                      <TableCell className="text-center text-xs font-mono">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs">
                        <div className="font-bold text-foreground">{v.species || "KAYU"} - {v.sku || "-"}</div>
                        <div className="text-[11px] text-muted-foreground">{v.grade || "STANDARD"}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {v.thickness || "-"} × {v.width || "-"} × {v.length || "-"}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">
                        {input.quantityPCS}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-blue-600 pr-6">
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

      {/* 2. TABEL HASIL PRODUK BARU */}
      <Card className="shadow-sm border-emerald-200/60 dark:border-emerald-900/30">
        <CardHeader className="py-3 px-4 md:px-6 border-b bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
            <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            2. Rincian Hasil Produk Baru {processData.processType} (Penambahan Stok)
          </CardTitle>
          <span className="text-xs font-mono font-bold text-emerald-600">
            Total: {Number(processData.outputVolumeM3 || 0).toFixed(4)} M³
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[60px] text-center">No</TableHead>
                  <TableHead>Produk Olahan Baru</TableHead>
                  <TableHead className="text-center">Dimensi (mm)</TableHead>
                  <TableHead className="text-center">Kuantitas (PCS)</TableHead>
                  <TableHead className="text-right pr-6">Volume Dihasilkan (M³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(processData.outputs || []).map((output: any, idx: number) => {
                  const v = output.variant || {};
                  return (
                    <TableRow key={output.id || idx}>
                      <TableCell className="text-center text-xs font-mono">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs">
                        <div className="font-bold text-foreground">{v.species || "KAYU"} - {v.sku || "-"}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">{v.grade || processData.processType}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {v.thickness || "-"} × {v.width || "-"} × {v.length || "-"}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">
                        {output.quantityPCS}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 pr-6">
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
