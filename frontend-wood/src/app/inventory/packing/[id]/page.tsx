"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PackingAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Receipt,
  Package,
  Layers,
  FileSpreadsheet,
  Printer,
  Loader2,
  AlertCircle,
  Warehouse,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function PackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [packing, setPacking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await PackingAPI.getPacking(id);
      const data = res?.data || res;
      setPacking(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Gagal memuat detail packing list");
    } finally {
      setLoading(false);
    }
  };

  // Group items by palletNo
  const palletGroups = useMemo(() => {
    if (!packing?.items) return [];
    const map = new Map<string, any[]>();
    packing.items.forEach((it: any) => {
      const plt = it.palletNo || "01";
      if (!map.has(plt)) map.set(plt, []);
      map.get(plt)!.push(it);
    });
    return Array.from(map.entries()).map(([palletNo, items]) => {
      const realPcs = items.reduce((s, i) => s + (i.realPcs || 0), 0);
      const realM3 = items.reduce((s, i) => s + (i.realM3 || 0), 0);
      const custPcs = items.reduce((s, i) => s + (i.custPcs || i.realPcs || 0), 0);
      const custM3 = items.reduce((s, i) => s + (i.custM3 || 0), 0);
      return { palletNo, items, realPcs, realM3, custPcs, custM3 };
    });
  }, [packing]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm">Memuat detail packing list...</p>
      </div>
    );
  }

  if (error || !packing) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-xs gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-base font-bold text-destructive">Data Packing Tidak Ditemukan</h2>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1550px] w-full mx-auto p-4 md:p-6 pb-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2 text-muted-foreground hover:text-foreground text-xs gap-1.5 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
              <Package className="w-6 h-6 text-purple-600" />
              Detail Packing: {packing.packingNumber}
            </h1>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold">
              {packing.status || "CONFIRMED"}
            </Badge>
            {packing.partai && (
              <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-xs font-mono">
                Partai: {packing.partai.code}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Daftar per palet ukuran riil pabrik dan nominal perjanjian customer sesuai lembar packing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak
          </Button>
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/sales/invoices/create?packingId=${packing.id}${
                  packing.partaiId ? `&partaiId=${packing.partaiId}` : ""
                }`
              )
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Receipt className="w-4 h-4" />
            Buat Invoice Buyer
          </Button>
        </div>
      </div>

      {/* RINGKASAN HEADER DOKUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Card className="p-3.5 border-border shadow-sm">
          <span className="text-[11px] text-muted-foreground block">Tanggal Packing</span>
          <p className="text-xs font-semibold font-mono mt-0.5">
            {new Date(packing.packingDate || packing.createdAt).toLocaleDateString("id-ID")}
          </p>
        </Card>
        <Card className="p-3.5 border-border shadow-sm">
          <span className="text-[11px] text-muted-foreground block">Pemilik Kayu</span>
          <p className="text-xs font-semibold truncate mt-0.5">{packing.ownerName || "PT Daun Emas"}</p>
        </Card>
        <Card className="p-3.5 border-border shadow-sm">
          <span className="text-[11px] text-muted-foreground block">Spesies / Kayu</span>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono mt-0.5">
            {packing.species || "MERBAU"}
          </p>
        </Card>
        <Card className="p-3.5 border-border shadow-sm">
          <span className="text-[11px] text-muted-foreground block">No. Kontainer</span>
          <p className="text-xs font-semibold font-mono mt-0.5">{packing.containerNo || "-"}</p>
        </Card>
        <Card className="p-3.5 border-border shadow-sm">
          <span className="text-[11px] text-muted-foreground block">Gudang Simpan</span>
          <p className="text-xs font-semibold truncate mt-0.5">{packing.warehouse?.name || "-"}</p>
        </Card>
        <Card className="p-3.5 border-purple-200/80 dark:border-purple-900/50 bg-purple-50/30 shadow-sm">
          <span className="text-[11px] text-purple-700 dark:text-purple-400 block font-medium">Total Palet</span>
          <p className="text-sm font-bold font-mono text-purple-700 dark:text-purple-400 mt-0.5">
            {packing.palletCount || palletGroups.length} Palet
          </p>
        </Card>
      </div>

      {/* STATISTIK DUA SISI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-blue-200/80 dark:border-blue-900/50 bg-blue-50/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 block">
                Total Ukuran Asli Pabrik (Riil Produksi)
              </span>
              <p className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                {Number(packing.totalRealVolume || 0).toFixed(4)} M³
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Jumlah Batang</span>
              <p className="text-lg font-bold font-mono text-foreground">{packing.totalRealPcs || 0} Pcs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 block">
                Total Ukuran Customer (Nominal Invoice)
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {Number(packing.totalCustVolume || 0).toFixed(4)} M³
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Jumlah Batang</span>
              <p className="text-lg font-bold font-mono text-foreground">{packing.totalCustPcs || 0} Pcs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RINCIAN PALET DAN UKURAN */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 py-3.5 px-4 md:px-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              Tabel Rincian Palet (Asli vs Customer)
            </CardTitle>
            <CardDescription className="text-xs">
              Sesuai format Excel 6: Setiap baris palet mencatat tebal, lebar, panjang, batang, dan kubikasi.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-muted/60 text-xs">
                <TableRow>
                  <TableHead rowSpan={2} className="w-[100px] border-r text-center font-bold">
                    No. Palet
                  </TableHead>
                  <TableHead colSpan={5} className="border-r text-center font-bold bg-blue-50/50 text-blue-900 dark:text-blue-300">
                    UKURAN ASLI PABRIK
                  </TableHead>
                  <TableHead colSpan={5} className="border-r text-center font-bold bg-emerald-50/50 text-emerald-900 dark:text-emerald-300">
                    UKURAN CUSTOMER (NOMINAL INVOICE)
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[150px] text-center font-bold">
                    Keterangan
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[80px] text-center bg-blue-50/20">T (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-blue-50/20">L (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-blue-50/20">P (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-blue-50/20">Pcs</TableHead>
                  <TableHead className="w-[110px] text-right border-r font-bold text-blue-700 bg-blue-50/20">
                    Vol M³
                  </TableHead>

                  <TableHead className="w-[80px] text-center bg-emerald-50/20">T (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-emerald-50/20">L (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-emerald-50/20">P (cm)</TableHead>
                  <TableHead className="w-[80px] text-center bg-emerald-50/20">Pcs</TableHead>
                  <TableHead className="w-[110px] text-right border-r font-bold text-emerald-700 bg-emerald-50/20">
                    Vol M³
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {palletGroups.map((group) =>
                  group.items.map((row: any, idx: number) => {
                    const isFirstInPallet = idx === 0;
                    return (
                      <TableRow key={row.id || `${group.palletNo}-${idx}`} className="hover:bg-muted/20 text-xs">
                        {isFirstInPallet ? (
                          <TableCell
                            rowSpan={group.items.length}
                            className="font-mono text-center font-bold border-r bg-muted/20 align-top pt-3"
                          >
                            <Badge variant="outline" className="font-mono text-xs font-bold">
                              PLT {group.palletNo}
                            </Badge>
                            <span className="block text-[10px] text-muted-foreground mt-1">
                              {group.custPcs} btg
                            </span>
                          </TableCell>
                        ) : null}

                        {/* Ukuran Asli */}
                        <TableCell className="text-center font-mono">{row.realT}</TableCell>
                        <TableCell className="text-center font-mono">{row.realL}</TableCell>
                        <TableCell className="text-center font-mono">{row.realP}</TableCell>
                        <TableCell className="text-center font-mono font-semibold text-blue-700 dark:text-blue-400">
                          {row.realPcs}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 border-r pr-3">
                          {Number(row.realM3 || 0).toFixed(4)}
                        </TableCell>

                        {/* Ukuran Customer */}
                        <TableCell className="text-center font-mono">{row.custT ?? row.realT}</TableCell>
                        <TableCell className="text-center font-mono">{row.custL ?? row.realL}</TableCell>
                        <TableCell className="text-center font-mono">{row.custP ?? row.realP}</TableCell>
                        <TableCell className="text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {row.custPcs ?? row.realPcs}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r pr-3">
                          {Number(row.custM3 ?? row.realM3 ?? 0).toFixed(4)}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">{row.notes || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
