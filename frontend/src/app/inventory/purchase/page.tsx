"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PurchaseAPI, MasterDataAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, PackageOpen, FileText, Edit, Trash2, CheckCircle2, Clock, XCircle, Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReceiveLogModal } from "@/components/timber/receive-log-modal";

export default function PurchaseListPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPurchaseForReceive, setSelectedPurchaseForReceive] = useState<any>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkReceiving, setIsBulkReceiving] = useState(false);

  // Filter States
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    MasterDataAPI.getSpecies()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSpeciesList(list);
      })
      .catch(() => {});
  }, []);

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredList: any[]) => {
    const selectable = filteredList.filter(p => !p.status || p.status === "DRAFT").map(p => p.id);
    if (selectable.length === 0) return;
    const allSelected = selectable.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const handleBulkReceive = async () => {
    const draftPurchases = purchases.filter(p => selectedIds.includes(p.id) && (!p.status || p.status === "DRAFT"));
    if (draftPurchases.length === 0) {
      alert("Pilih minimal satu data pembelian yang berstatus DRAFT / Belum Diterima.");
      return;
    }

    if (!confirm(`Konfirmasi penerimaan otomatis untuk ${draftPurchases.length} pembelian yang dipilih?\nSemua item dan volume kayu akan otomatis dicatat masuk ke stok inventori.`)) {
      return;
    }

    setIsBulkReceiving(true);
    let successCount = 0;
    let failCount = 0;

    for (const p of draftPurchases) {
      try {
        await PurchaseAPI.receivePurchase(p.id, {
          partaiId: p.partaiId || undefined,
          receivingDate: new Date().toISOString(),
        });
        successCount++;
      } catch (err) {
        console.error(`Gagal menerima pembelian ${p.purchaseNumber || p.id}:`, err);
        failCount++;
      }
    }

    setIsBulkReceiving(false);
    setSelectedIds([]);
    fetchPurchases();

    if (failCount === 0) {
      alert(`Berhasil! ${successCount} pembelian telah resmi diterima dan masuk ke stok inventori.`);
    } else {
      alert(`Penerimaan selesai: ${successCount} berhasil, ${failCount} gagal diproses.`);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p: any) => {
      // 1. Filter Species
      if (selectedSpecies && selectedSpecies !== "ALL") {
        const searchSpec = selectedSpecies.trim().toUpperCase();
        const hasMatchingLog = (p.logItems || []).some((li: any) => 
          (li.species || "").trim().toUpperCase() === searchSpec ||
          (li.species || "").trim().toUpperCase().includes(searchSpec)
        );
        const hasMatchingSawn = (p.items || []).some((it: any) => {
          const itemSpecies = (it.timberVariant?.species || it.notes || it.species || "").trim().toUpperCase();
          return itemSpecies === searchSpec || itemSpecies.includes(searchSpec);
        });
        if (!hasMatchingLog && !hasMatchingSawn) return false;
      }

      // 2. Filter Tanggal (berdasarkan purchaseDate atau createdAt)
      const dateVal = p.purchaseDate || p.createdAt;
      if (dateVal) {
        const itemDateStr = new Date(dateVal).toISOString().split("T")[0];
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
      } else {
        if (startDate || endDate) return false;
      }

      return true;
    });
  }, [purchases, selectedSpecies, startDate, endDate]);

  const handleOpenReceive = (purchase: any) => {
    setSelectedPurchaseForReceive(purchase);
    setReceiveModalOpen(true);
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

      {/* FILTER BAR */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Pembelian</span>
          </div>
          {(selectedSpecies !== "ALL" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedSpecies("ALL");
                setStartDate("");
                setEndDate("");
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Filter
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter Species */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Jenis Kayu (Species)</label>
            <Select value={selectedSpecies} onValueChange={(val: any) => setSelectedSpecies(val || "ALL")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Jenis Kayu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis Kayu</SelectItem>
                {speciesList.map((s) => (
                  <SelectItem key={s.id || s.code || s.name} value={s.name || s.code}>
                    {s.name} {s.code && s.code !== s.name ? `(${s.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Tanggal Mulai */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Filter Tanggal Sampai */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR JIKA ADA DATA YANG DIPILIH */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {selectedIds.length} pembelian kayu dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Batalkan Pilihan
            </Button>
            <Button
              size="sm"
              onClick={handleBulkReceive}
              disabled={isBulkReceiving}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isBulkReceiving ? "Memproses Penerimaan..." : `Terima Semua (${selectedIds.length}) & Masukkan Stok`}
            </Button>
          </div>
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">
          <Table className="w-full min-w-[750px]">
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[45px] text-center">
                  <input
                    type="checkbox"
                    aria-label="Pilih Semua Pembelian Draft"
                    checked={
                      filteredPurchases.filter(p => !p.status || p.status === "DRAFT").length > 0 &&
                      filteredPurchases.filter(p => !p.status || p.status === "DRAFT").every(p => selectedIds.includes(p.id))
                    }
                    onChange={() => handleSelectAll(filteredPurchases)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer align-middle"
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">No. Dokumen</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Tgl Dibuat</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Tgl Diterima</TableHead>
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
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Memuat data pembelian...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">
                          {purchases.length === 0 ? "Belum ada data pembelian" : "Tidak ada pembelian yang sesuai filter"}
                        </p>
                        <p className="text-sm">
                          {purchases.length === 0 
                            ? "Tidak ada riwayat pembelian kayu yang ditemukan." 
                            : "Coba ubah filter jenis kayu atau rentang tanggal."}
                        </p>
                      </div>
                      {purchases.length === 0 ? (
                        <Link href="/inventory/purchase/create" className="mt-2">
                          <Button variant="outline" size="sm">Buat Pembelian Sekarang</Button>
                        </Link>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedSpecies("ALL");
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="mt-2"
                        >
                          Reset Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((p) => {
                  const isDraft = !p.status || p.status === "DRAFT";
                  const totalPcs = p.totalPcs || (p.items || []).reduce((acc: number, it: any) => acc + (it.quantityPcs || 0), 0);
                  const totalVol = p.totalVolumeM3 || (p.items || []).reduce((acc: number, it: any) => acc + (it.volumeM3 || 0), 0);
                  const docNum = p.code || p.purchaseNumber;

                  return (
                    <TableRow key={p.id} className={`group hover:bg-muted/40 transition-colors ${selectedIds.includes(p.id) ? "bg-primary/5" : ""}`}>
                      <TableCell className="text-center w-10">
                        <input
                          type="checkbox"
                          disabled={!isDraft}
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                          title={isDraft ? "Pilih untuk proses massal" : "Sudah berstatus Diterima"}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer align-middle disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {docNum}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("id-ID") : (p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "-")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {p.status === "RECEIVED" ? (
                          p.receivingDate ? (
                            <span className="text-foreground font-medium">{new Date(p.receivingDate).toLocaleDateString("id-ID")}</span>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-xs">
                              Diterima
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground italic">Belum diterima</span>
                        )}
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
                              onClick={() => handleOpenReceive(p)}
                              className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-800"
                              title="Terima Barang (Cek Ukuran Fisik)"
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

      <ReceiveLogModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedPurchaseForReceive(null);
        }}
        purchase={selectedPurchaseForReceive}
        partaiId={selectedPurchaseForReceive?.partaiId}
        onSuccess={fetchPurchases}
      />
    </div>
  );
}
