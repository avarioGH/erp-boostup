"use client";

import { useEffect, useState } from "react";
import { PurchaseAPI } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  PackageOpen,
  Warehouse,
  Building2,
  Calendar,
  Layers,
  Edit,
  FileText
} from "lucide-react";

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const purchaseId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (purchaseId && purchaseId !== "undefined") {
      fetchData();
    }
  }, [purchaseId]);

  const fetchData = () => {
    setLoading(true);
    PurchaseAPI.getPurchase(purchaseId)
      .then((res: any) => {
        setPurchase(res?.data || res);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || err.message || "Failed to load data");
        setLoading(false);
      });
  };

  const handleReceive = async () => {
    if (!confirm("Konfirmasi penerimaan barang? Stok kayu akan otomatis ditambahkan ke stok gudang yang dipilih.")) return;
    try {
      setActionLoading(true);
      await PurchaseAPI.receivePurchase(purchaseId);
      alert("Barang berhasil diterima! Stok kayu telah masuk ke inventaris.");
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal memproses penerimaan barang");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan transaksi pembelian ini?")) return;
    try {
      setActionLoading(true);
      await PurchaseAPI.cancelPurchase(purchaseId);
      alert("Pembelian berhasil dibatalkan.");
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Pembatalan gagal");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Memuat detail pembelian...</p>
      </div>
    );
  }

  if (error && !purchase) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-destructive/10 rounded-xl border border-destructive/20 text-center space-y-4">
        <p className="text-destructive font-semibold">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  if (!purchase) return null;

  const isReceived = purchase.status === "RECEIVED" || purchase.status === "CONFIRMED";
  const isCancelled = purchase.status === "CANCELLED";
  const isDraft = !isReceived && !isCancelled;

  const totalItemCount = (purchase.items || []).reduce((acc: number, it: any) => acc + (it.quantityPcs || 0), 0);
  const totalVolume = (purchase.items || []).reduce((acc: number, it: any) => acc + (it.volumeM3 || 0), 0);
  const totalAmount = (purchase.items || []).reduce((acc: number, it: any) => acc + ((it.quantityPcs || 0) * (it.unitPrice || 0)), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-300 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => purchase?.partaiId ? router.push(`/inventory/partai/${purchase.partaiId}?tab=purchase`) : router.push("/inventory/partai")} 
              className="h-8 w-8"
              title="Kembali ke Manajemen Partai"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <PackageOpen className="w-6 h-6 text-primary" />
              {purchase.purchaseNumber || purchase.code || "Pembelian Kayu"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Detail transaksi pembelian kayu dan status penerimaan ke gudang.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isDraft && (
            <>
              <Button
                onClick={handleReceive}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Terima Barang (Masuk Stok)
              </Button>
              <Link href={`/inventory/purchase/${purchase.id}/edit`}>
                <Button variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50">
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Batalkan
              </Button>
            </>
          )}

          {isReceived && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Batalkan & Tarik Stok
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* OVERVIEW INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Supplier / Asal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {purchase.source?.name || purchase.source?.code || purchase.sourceId || "-"}
            </div>
            {purchase.source?.code && purchase.source?.name && (
              <p className="text-xs text-muted-foreground mt-0.5">Kode: {purchase.source.code}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" />
              Gudang Penerima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {purchase.warehouse?.name || purchase.warehouse?.code || purchase.warehouseId || "-"}
            </div>
            {purchase.warehouse?.code && purchase.warehouse?.name && (
              <p className="text-xs text-muted-foreground mt-0.5">Kode: {purchase.warehouse.code}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Status Penerimaan Barang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-1">
              {isReceived ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  SUDAH DITERIMA (STOK MASUK)
                </span>
              ) : isCancelled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/60 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  DIBATALKAN
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  BELUM DITERIMA (DRAFT)
                </span>
              )}
            </div>
            {purchase.purchaseDate && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal: {new Date(purchase.purchaseDate).toLocaleDateString("id-ID", { dateStyle: "long" })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY TOTALS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
        <div>
          <span className="text-xs text-muted-foreground font-medium">Total Item</span>
          <p className="text-lg font-bold text-foreground">{totalItemCount > 0 ? `${totalItemCount} Pcs` : `${purchase.logItems?.length || 0} Log`}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-medium">Total Volume</span>
          <p className="text-lg font-bold text-foreground">
            {totalVolume > 0 ? `${totalVolume.toFixed(4)} m³` : `${(purchase.totalVolumeM3 || 0).toFixed(4)} m³`}
          </p>
        </div>
        {totalAmount > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground font-medium">Total Nilai Pembelian</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Rp {totalAmount.toLocaleString("id-ID")}
            </p>
          </div>
        )}
      </div>

      {purchase.notes && (
        <div className="bg-card p-4 rounded-lg border border-border text-sm">
          <span className="font-semibold text-foreground">Catatan: </span>
          <span className="text-muted-foreground">{purchase.notes}</span>
        </div>
      )}

      {/* ITEMS TABLE (SAWN TIMBER) */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Daftar Kayu Gergajian (Sawn Timber)
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {purchase.items?.length || 0} varian kayu
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Varian / SKU</TableHead>
                  <TableHead className="font-semibold">Jenis Kayu & Grade</TableHead>
                  <TableHead className="font-semibold text-center">Ukuran (T x L x P)</TableHead>
                  <TableHead className="font-semibold text-center">Jumlah (Pcs)</TableHead>
                  <TableHead className="font-semibold text-center">Volume (M³)</TableHead>
                  <TableHead className="font-semibold text-right">Harga Satuan</TableHead>
                  <TableHead className="font-semibold text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(purchase.items || []).map((item: any, i: number) => {
                  const thickness = item.purchaseThickness || item.timberVariant?.thickness || 0;
                  const width = item.purchaseWidth || item.timberVariant?.width || 0;
                  const length = item.purchaseLength || item.timberVariant?.length || 0;
                  const sku = item.timberVariant?.sku || `VAR-${thickness}x${width}x${length}`;
                  const species = item.timberVariant?.species || item.timberVariant?.timberSpecies?.name || "-";
                  const grade = item.timberVariant?.grade || item.timberVariant?.timberGrade?.name || "-";
                  const subtotal = (item.quantityPcs || 0) * (item.unitPrice || 0);

                  return (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">
                        {sku}
                        {item.batch && item.batch !== "UNKNOWN" && (
                          <span className="block text-xs font-normal text-muted-foreground">Batch: {item.batch}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{species}</span>
                        <span className="text-xs text-muted-foreground block">Grade: {grade}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {thickness} × {width} × {length} mm
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">
                        {item.quantityPcs} Pcs
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-muted-foreground">
                        {(item.volumeM3 || 0).toFixed(4)} m³
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.unitPrice ? `Rp ${Number(item.unitPrice).toLocaleString("id-ID")}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-foreground">
                        {subtotal > 0 ? `Rp ${subtotal.toLocaleString("id-ID")}` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!purchase.items || purchase.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data sawn timber untuk transaksi ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* RAW LOG ITEMS (IF ANY) */}
      {(purchase.logItems && purchase.logItems.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Daftar Log Bulat (Raw Logs / DUKB)
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {purchase.logItems.length} batang log
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">No. Log</TableHead>
                    <TableHead className="font-semibold">Jenis Kayu</TableHead>
                    <TableHead className="font-semibold text-center">Panjang (m)</TableHead>
                    <TableHead className="font-semibold text-center">Diameter (cm)</TableHead>
                    <TableHead className="font-semibold text-center">Volume (M³)</TableHead>
                    <TableHead className="font-semibold text-center">Status Log</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.logItems.map((log: any, i: number) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">{log.logNumber}</TableCell>
                      <TableCell>{log.species}</TableCell>
                      <TableCell className="text-center font-mono">{log.purchaseLength} m</TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {log.purchaseDiameter1 || 0} / {log.purchaseDiameter2 || 0} / {log.purchaseDiameter3 || 0} / {log.purchaseDiameter4 || 0} cm
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium">{log.purchaseVolume} m³</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={log.status === "RECEIVED" ? "default" : "secondary"}
                          className={log.status === "RECEIVED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-300" : ""}
                        >
                          {log.status === "RECEIVED" ? "Diterima" : "Draft / Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
