"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductionAPI, MasterDataAPI } from "@/lib/api";
import { 
  Search, 
  Loader2, 
  Plus, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Eye,
  Cog,
  ArrowRight,
  Sparkles,
  Filter,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PROCESSING_TYPES = [
  { id: "KD", code: "KD", name: "Kiln Dry (Oven)" },
  { id: "MOLDING", code: "MOLDING", name: "Molding / Profil" },
  { id: "RESAW", code: "RESAW", name: "Re-Sawing / Belah" },
  { id: "S4S", code: "S4S", name: "S4S (Serut 4 Sisi)" },
  { id: "FJ", code: "FJ", name: "Finger Joint" },
  { id: "SANDING", code: "SANDING", name: "Sanding / Amplas" },
  { id: "TREATMENT", code: "TREATMENT", name: "Chemical Treatment / Pengawetan" },
];

export default function ProcessingListPage() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [processingTypes, setProcessingTypes] = useState<any[]>(DEFAULT_PROCESSING_TYPES);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [selectedType, search]);

  const fetchInitialData = async () => {
    try {
      const typesRes = await MasterDataAPI.getProcessingTypes().catch(() => []);
      const rawTypes = Array.isArray(typesRes) ? typesRes : typesRes?.data || [];
      setProcessingTypes(rawTypes.length > 0 ? rawTypes : DEFAULT_PROCESSING_TYPES);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const params: any = { take: 100 };
      if (selectedType && selectedType !== "ALL") {
        params.processType = selectedType;
      }
      if (search) {
        params.search = search;
      }
      const res = await ProductionAPI.getProcesses(params).catch(() => ({ items: [] }));
      const list = Array.isArray(res) ? res : res?.items || [];
      setProcesses(list);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, processNo: string) => {
    if (!window.confirm(`Hapus proses ${processNo}?`)) return;
    try {
      await ProductionAPI.deleteProcess(id);
      toast({ title: "Berhasil!", description: `Proses ${processNo} berhasil dihapus.` });
      fetchProcesses();
    } catch (e: any) {
      toast({ 
        title: "Gagal Menghapus", 
        description: e?.response?.data?.message || e?.message || "Tidak dapat menghapus proses", 
        variant: "destructive" 
      });
    }
  };

  // Stats
  const totalVolumeInput = processes.reduce((acc, p) => acc + (p.inputVolumeM3 || 0), 0);
  const totalVolumeOutput = processes.reduce((acc, p) => acc + (p.outputVolumeM3 || 0), 0);
  const totalBatches = processes.length;
  const confirmedBatches = processes.filter(p => p.status === "CONFIRMED").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 px-4 md:px-6 max-w-[1400px] mx-auto box-border">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cog className="w-6 h-6 text-primary" /> Processing (Pengolahan Kayu Lanjutan)
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Transformasi stok produk kayu ke produk hasil olahan baru (KD, Molding, Resaw, S4S, dll) berbasis konversi kubikasi (M³).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => router.push("/production/processing/create")} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> + Buat Proses Baru
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Batch Proses</p>
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono">{totalBatches} Batch</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{confirmedBatches} telah selesai & posting stok</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Kubikasi Input</p>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {totalVolumeInput.toFixed(4)} M³
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Bahan baku yang dipotong</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Kubikasi Output</p>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalVolumeOutput.toFixed(4)} M³
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Produk jadi yang ditambahkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Rata-rata Rendemen</p>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono">
              {totalVolumeInput > 0 ? ((totalVolumeOutput / totalVolumeInput) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Efisiensi output vs input</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Riwayat Proses Produksi Lanjutan
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select value={selectedType} onValueChange={(val) => setSelectedType(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs bg-background">
                  <SelectValue placeholder="Pilih Jenis Proses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis Proses</SelectItem>
                  {processingTypes.map((t) => (
                    <SelectItem key={t.id || t.code} value={t.code}>
                      {t.code} - {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari No Proses / Catatan..." 
                  className="pl-9 h-9 text-xs bg-background" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : processes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <Cog className="w-10 h-10 mx-auto text-muted-foreground/40 animate-pulse" />
              <p className="text-muted-foreground text-sm">Belum ada transaksi processing yang tercatat.</p>
              <Button 
                onClick={() => router.push("/production/processing/create")}
                variant="outline"
                className="border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" /> Mulai Catat Proses Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[120px]">Tanggal</TableHead>
                    <TableHead className="w-[160px]">No. Proses</TableHead>
                    <TableHead className="w-[140px]">Jenis Proses</TableHead>
                    <TableHead className="text-right">Vol Input (m³)</TableHead>
                    <TableHead className="text-right">Vol Output (m³)</TableHead>
                    <TableHead className="text-center">Rendemen</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="max-w-[200px]">Catatan / Jasa</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((p) => {
                    const yieldPct = p.inputVolumeM3 > 0 ? ((p.outputVolumeM3 / p.inputVolumeM3) * 100).toFixed(1) : "0.0";
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs font-medium">
                          {p.processDate ? new Date(p.processDate).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {p.processNo}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[11px] bg-primary/10 border-primary/20 text-primary">
                            {p.processType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          {Number(p.inputVolumeM3 || 0).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {Number(p.outputVolumeM3 || 0).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold">
                          {yieldPct}%
                        </TableCell>
                        <TableCell className="text-center">
                          {p.status === "CONFIRMED" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]">
                              POSTED
                            </Badge>
                          ) : p.status === "CANCELLED" ? (
                            <Badge variant="destructive" className="text-[11px]">
                              CANCELLED
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                              DRAFT
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={p.notes}>
                          {p.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => router.push(`/production/processing/${p.id}`)}
                              title="Lihat Rincian"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            {p.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDelete(p.id, p.processNo)}
                                title="Hapus Draft"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
