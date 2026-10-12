"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PurchaseAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, PackageOpen, FileText, Edit, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function PurchaseListPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    router.replace("/inventory/partai");
  }, [router]);

  const fetchPurchases = () => {
    setLoading(true);
    PurchaseAPI.getPurchases()
      .then((res: any) => {
        setPurchases(res?.data || res || []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleReceive = async (id: string, code: string) => {
    if (!confirm(`Konfirmasi penerimaan barang untuk ${code}? Stok kayu akan langsung dimasukkan ke gudang.`)) return;
    try {
      await PurchaseAPI.receivePurchase(id);
      alert("Barang berhasil diterima! Stok kayu telah masuk ke inventaris.");
      fetchPurchases();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal memproses penerimaan barang");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pembelian ini?")) return;
    try {
      await PurchaseAPI.deletePurchase(id);
      setPurchases((Array.isArray(purchases) ? purchases : []).filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete purchase");
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "RECEIVED" || s === "CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Diterima (Stok Masuk)
        </span>
      );
    }
    if (s === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
          <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        Belum Diterima (Draft)
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-primary" />
            Timber Purchases
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pembelian kayu (Sawn Timber & Raw Log) beserta status penerimaan ke stok gudang.
          </p>
        </div>
        <Link href="/inventory/purchase/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto shadow-sm font-semibold tracking-wide">
            <Plus className="w-4 h-4 mr-2" />
            Buat Pembelian Baru
          </Button>
        </Link>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">
          <Table className="w-full min-w-[700px]">
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground/80 h-11">No. Dokumen</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Supplier / Asal</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Gudang Tujuan</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11 text-center">Total Item / Vol</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Status Penerimaan</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Memuat data pembelian...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">Belum ada data pembelian</p>
                        <p className="text-sm">Tidak ada riwayat pembelian kayu yang ditemukan.</p>
                      </div>
                      <Link href="/inventory/purchase/create" className="mt-2">
                        <Button variant="outline" size="sm">Buat Pembelian Sekarang</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((p) => {
                  const isDraft = !p.status || p.status === "DRAFT";
                  const totalPcs = p.totalPcs || (p.items || []).reduce((acc: number, it: any) => acc + (it.quantityPcs || 0), 0);
                  const totalVol = p.totalVolumeM3 || (p.items || []).reduce((acc: number, it: any) => acc + (it.volumeM3 || 0), 0);
                  const docNum = p.code || p.purchaseNumber;

                  return (
                    <TableRow key={p.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {docNum}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.source?.name ? `${p.source.name}${p.source.code ? ` (${p.source.code})` : ''}` : (p.source?.code || p.sourceId || '-')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.warehouse?.name ? `${p.warehouse.name}${p.warehouse.code ? ` (${p.warehouse.code})` : ''}` : (p.warehouse?.code || p.warehouseId || '-')}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {totalPcs > 0 ? (
                          <div>
                            <span className="font-bold text-foreground">{totalPcs} Pcs</span>
                            {totalVol > 0 && <span> / {totalVol.toFixed(4)} m³</span>}
                          </div>
                        ) : p.logItems?.length > 0 ? (
                          <div>
                            <span className="font-bold text-foreground">{p.logItems.length} Log</span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(p.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReceive(p.id, docNum)}
                              className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-800"
                              title="Terima Barang ke Stok"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                              Terima Barang
                            </Button>
                          )}
                          <Link href={`/inventory/purchase/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Lihat Detail">
                              <Eye className="w-4 h-4 mr-1" />
                              Lihat
                            </Button>
                          </Link>
                          {isDraft && (
                            <Link href={`/inventory/purchase/${p.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Hapus" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
