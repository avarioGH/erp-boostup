"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackingAPI, MasterDataAPI, InventoryAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  Plus,
  ArrowRight,
  Receipt,
  Search,
  Layers,
  FileSpreadsheet,
  Boxes,
  Loader2,
  Calendar,
  Warehouse,
  CheckSquare,
} from "lucide-react";

export default function PackingListPage() {
  const router = useRouter();
  const [packings, setPackings] = useState<any[]>([]);
  const [selectedPackingIds, setSelectedPackingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterSpecies, setFilterSpecies] = useState("ALL");
  const [speciesList, setSpeciesList] = useState<any[]>([]);

  useEffect(() => {
    fetchPackings();
  }, []);

  const fetchPackings = async () => {
    setLoading(true);
    try {
      const [packRes, specRes] = await Promise.all([
        PackingAPI.getPackings().catch(() => []),
        MasterDataAPI.getSpecies().catch(() => []),
      ]);

      const list = Array.isArray(packRes) ? packRes : packRes?.data || [];
      setPackings(list);

      const sp = Array.isArray(specRes) ? specRes : specRes?.data || [];
      setSpeciesList(sp);
    } catch (err) {
      console.error("Gagal memuat data packing:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackings = packings.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      (p.packingNumber && p.packingNumber.toLowerCase().includes(term)) ||
      (p.ownerName && p.ownerName.toLowerCase().includes(term)) ||
      (p.species && p.species.toLowerCase().includes(term)) ||
      (p.containerNo && p.containerNo.toLowerCase().includes(term)) ||
      (p.partai?.code && p.partai.code.toLowerCase().includes(term));

    const matchSpecies =
      filterSpecies === "ALL" ||
      (p.species && p.species.toUpperCase() === filterSpecies.toUpperCase());

    return matchSearch && matchSpecies;
  });
  const paginatedPackings = filteredPackings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPallets = packings.reduce((sum, p) => sum + (p.palletCount || 1), 0);
  const totalRealM3 = packings.reduce((sum, p) => sum + (p.totalRealVolume || 0), 0);
  const totalCustM3 = packings.reduce((sum, p) => sum + (p.totalCustVolume || 0), 0);
  const totalPcs = packings.reduce((sum, p) => sum + (p.totalCustPcs || p.totalRealPcs || 0), 0);

  return (
    <div className="space-y-6 max-w-[1550px] w-full mx-auto p-4 md:p-6 pb-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <Package className="w-7 h-7 text-purple-600" />
            Stok Produk Jadi & Packing List
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Daftar stok produk jadi per palet dengan ukuran riil pabrik & nominal buyer siap dijadikan invoice penjualan ekspor/lokal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedPackingIds.length > 0 && (
            <Button
              onClick={() => {
                const query = selectedPackingIds.map((id) => `packingId=${id}`).join("&");
                router.push(`/sales/invoices/create?${query}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm animate-pulse"
            >
              <Receipt className="w-4 h-4" />
              Buat 1 Faktur dari ({selectedPackingIds.length}) Packing Terpilih
            </Button>
          )}
          <Button
            onClick={() => router.push("/sales/invoices/create")}
            variant="outline"
            className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs font-semibold gap-1.5"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            + Buat Invoice Penjualan
          </Button>
          <Button
            onClick={() => router.push("/inventory/packing/create")}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Buat Packing List Baru
          </Button>
        </div>
      </div>

      {/* STATISTIK RINGKASAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-purple-200/70 dark:border-purple-900/40 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-xl text-purple-700 dark:text-purple-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Dokumen / Palet</p>
              <p className="text-lg font-bold font-mono text-foreground">
                {packings.length} Dok / {totalPallets} PLT
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/70 dark:border-blue-900/40 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-xl text-blue-700 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Vol. Riil Pabrik (M³)</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {totalRealM3.toFixed(4)} M³
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 dark:border-emerald-900/40 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Vol. Nominal Buyer (M³)</p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {totalCustM3.toFixed(4)} M³
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-muted rounded-xl text-foreground">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Batang (Pcs)</p>
              <p className="text-lg font-bold font-mono text-foreground">{totalPcs.toLocaleString("id-ID")} Pcs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari no. packing, customer, spesies, kontainer..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Filter Kayu:</span>
            <Select value={filterSpecies} onValueChange={(val) => setFilterSpecies(val || "ALL")}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Semua Spesies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis Kayu</SelectItem>
                {speciesList.map((s: any) => (
                  <SelectItem key={s.id || s.code || s.name} value={(s.name || s.code).toUpperCase()}>
                    {s.name || s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABEL PACKING LIST */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 py-3.5 px-4 md:px-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Daftar Stok Produk Jadi Siap Jual
            </CardTitle>
            <CardDescription className="text-xs">
              Klik <strong>Buat Invoice</strong> pada baris untuk langsung mengisi faktur buyer berdasarkan volume nominal customer.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs">Memuat data packing list...</p>
            </div>
          ) : filteredPackings.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <Package className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-medium">Belum ada dokumen packing list produk jadi.</p>
              <p className="text-xs">Buat packing list baru setelah pengolahan/processing kayu selesai.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 text-xs">
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={
                          paginatedPackings.length > 0 &&
                          paginatedPackings.every((p) => selectedPackingIds.includes(p.id))
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newIds = Array.from(new Set([...selectedPackingIds, ...paginatedPackings.map((p) => p.id)]));
                            setSelectedPackingIds(newIds);
                          } else {
                            setSelectedPackingIds((prev) => prev.filter((id) => !paginatedPackings.some((p) => p.id === id)));
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[110px]">Tgl Packing</TableHead>
                    <TableHead>No. Packing / SPK</TableHead>
                    <TableHead>Partai Asal</TableHead>
                    <TableHead>Pemilik / Spesies</TableHead>
                    <TableHead>Kontainer / Gudang</TableHead>
                    <TableHead className="text-center">Palet</TableHead>
                    <TableHead className="text-right text-blue-700 dark:text-blue-400">Riil Pabrik (M³)</TableHead>
                    <TableHead className="text-right text-emerald-700 dark:text-emerald-400">Nominal Buyer (M³)</TableHead>
                    <TableHead className="text-center w-[90px]">Status</TableHead>
                    <TableHead className="text-right w-[160px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPackings.map((item) => {
                    const isChecked = selectedPackingIds.includes(item.id);
                    return (
                    <TableRow key={item.id} className={`hover:bg-muted/20 transition-colors ${isChecked ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''}`}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => {
                            setSelectedPackingIds((prev) =>
                              prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {new Date(item.packingDate || item.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                        {item.packingNumber}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {item.partai?.code ? (
                          <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50/50 text-[11px]">
                            {item.partai.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold block text-foreground">{item.ownerName || "PT Daun Emas"}</span>
                        <span className="text-muted-foreground text-[11px] uppercase font-mono font-bold text-amber-700 dark:text-amber-400">
                          {item.species || "MERBAU"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.containerNo ? (
                          <span className="font-mono font-medium text-foreground block">Cont: {item.containerNo}</span>
                        ) : null}
                        <span>{item.warehouse?.name || "-"}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold text-xs">
                        <Badge variant="secondary" className="font-mono">
                          {item.palletCount || 1} PLT
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {Number(item.totalRealVolume || 0).toFixed(4)} M³
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          ({item.totalRealPcs || 0} pcs)
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {Number(item.totalCustVolume || 0).toFixed(4)} M³
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          ({item.totalCustPcs || 0} pcs)
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold">
                          {item.status || "CONFIRMED"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 shadow-sm gap-1"
                            onClick={() =>
                              router.push(
                                `/sales/invoices/create?packingId=${item.id}${
                                  item.partaiId ? `&partaiId=${item.partaiId}` : ""
                                }`
                              )
                            }
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Buat Invoice
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 px-2"
                            onClick={() => router.push(`/inventory/packing/${item.id}`)}
                          >
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination currentPage={currentPage} totalItems={filteredPackings.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10, 25, 50, 100]} itemLabel="packing" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
