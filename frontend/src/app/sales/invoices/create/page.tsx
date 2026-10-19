"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinanceAPI, PackingAPI, MasterDataAPI, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Receipt,
  Package,
  Layers,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  Calculator,
  User,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceLineItem {
  id: string;
  palletNo: string;
  description: string;
  tCm: number;
  lCm: number;
  pCm: number;
  pcs: number;
  volumeM3: number;
  billingBasis: "M3" | "PCS";
  unitPrice: number;
  subtotal: number;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlPackingId = searchParams.get("packingId") || "";
  const urlPartaiId = searchParams.get("partaiId") || "";

  const [packingList, setPackingList] = useState<any[]>([]);
  const [selectedPackingId, setSelectedPackingId] = useState(urlPackingId);
  const [selectedPacking, setSelectedPacking] = useState<any>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [defaultPricePerM3, setDefaultPricePerM3] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [packRes, custRes] = await Promise.all([
        PackingAPI.getPackings().catch(() => []),
        api.get("/customers?limit=100").catch(() => ({ data: [] })),
      ]);

      const pList = Array.isArray(packRes) ? packRes : packRes?.data || [];
      setPackingList(pList);

      const cList = Array.isArray(custRes?.data) ? custRes.data : custRes?.data?.data || [];
      setCustomers(cList);

      if (urlPackingId) {
        loadPacking(urlPackingId);
      }
    } catch (e) {
      console.error("Gagal inisialisasi:", e);
    }
  };

  const loadPacking = async (packId: string) => {
    if (!packId) return;
    try {
      const res = await PackingAPI.getPacking(packId);
      const data = res?.data || res;
      setSelectedPacking(data);
      setSelectedPackingId(packId);

      // Extract packing items based on Nominal Customer
      if (data?.items && Array.isArray(data.items)) {
        const lines: InvoiceLineItem[] = data.items.map((it: any, idx: number) => {
          const t = Number(it.custT ?? it.realT ?? 0);
          const l = Number(it.custL ?? it.realL ?? 0);
          const p = Number(it.custP ?? it.realP ?? 0);
          const pcs = Number(it.custPcs ?? it.realPcs ?? 0);
          const vol = Number(it.custM3 ?? it.realM3 ?? (t * l * p * pcs) / 1000000);
          const species = data.species || "KAYU";
          const desc = `${species} - Plt ${it.palletNo || "01"} (${t}x${l}x${p} cm)`;

          return {
            id: it.id || `line-${idx}`,
            palletNo: it.palletNo || "01",
            description: desc,
            tCm: t,
            lCm: l,
            pCm: p,
            pcs,
            volumeM3: Number(vol.toFixed(4)),
            billingBasis: "M3",
            unitPrice: 0,
            subtotal: 0,
          };
        });
        setLineItems(lines);
      }
    } catch (err: any) {
      console.error("Gagal memuat detail packing:", err);
      toast({
        title: "Gagal Mengambil Data Packing",
        description: err.message || "Dokumen packing tidak ditemukan",
        variant: "destructive",
      });
    }
  };

  const handleSelectPacking = (packId: string | null) => {
    if (!packId) return;
    setSelectedPackingId(packId);
    loadPacking(packId);
  };

  // Bulk apply price per M3
  const handleApplyPriceToAll = (price: number) => {
    setDefaultPricePerM3(price);
    setLineItems((prev) =>
      prev.map((item) => {
        const qty = item.billingBasis === "M3" ? item.volumeM3 : item.pcs;
        const subtotal = Math.round(qty * price);
        return {
          ...item,
          unitPrice: price,
          subtotal,
        };
      })
    );
  };

  const handleLinePriceChange = (index: number, price: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.unitPrice = price;
      const qty = item.billingBasis === "M3" ? item.volumeM3 : item.pcs;
      item.subtotal = Math.round(qty * price);
      updated[index] = item;
      return updated;
    });
  };

  const handleBasisChange = (index: number, basis: "M3" | "PCS") => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.billingBasis = basis;
      const qty = basis === "M3" ? item.volumeM3 : item.pcs;
      item.subtotal = Math.round(qty * item.unitPrice);
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalVolumeM3 = useMemo(
    () => lineItems.reduce((acc, it) => acc + (it.volumeM3 || 0), 0),
    [lineItems]
  );
  const totalPcs = useMemo(
    () => lineItems.reduce((acc, it) => acc + (it.pcs || 0), 0),
    [lineItems]
  );
  const subtotal = useMemo(
    () => lineItems.reduce((acc, it) => acc + (it.subtotal || 0), 0),
    [lineItems]
  );
  const taxAmount = useMemo(
    () => Math.round((subtotal * (Number(taxPercent) || 0)) / 100),
    [subtotal, taxPercent]
  );
  const grandTotal = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId && !buyerName) {
      toast({
        title: "Customer Wajib Dipilih",
        description: "Pilih customer atau isi nama buyer untuk penerbitan faktur.",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        title: "Item Faktur Kosong",
        description: "Pilih stok packing list atau masukkan item yang akan ditagihkan.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setPageError(null);
    try {
      const payload = {
        customerId: selectedCustomerId || undefined,
        invoiceNumber,
        invoiceDate,
        dueDate,
        tax: taxAmount,
        notes: notes || (selectedPacking ? `Packing List: ${selectedPacking.packingNumber}` : ""),
        items: lineItems.map((it) => ({
          description: it.description,
          qty: it.billingBasis === "M3" ? it.volumeM3 : it.pcs,
          unit_price: it.unitPrice,
          subtotal: it.subtotal,
        })),
      };

      await FinanceAPI.createInvoice(payload);

      toast({
        title: "Faktur Berhasil Dibuat!",
        description: `Invoice ${invoiceNumber} senilai Rp ${grandTotal.toLocaleString("id-ID")} berhasil dicatat.`,
      });

      setTimeout(() => {
        router.push("/finance/invoices");
      }, 700);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.message || err?.response?.data?.error?.message || err.message || "Gagal membuat invoice";
      setPageError(errMsg);
      toast({
        title: "Gagal Menerbitkan Invoice",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1550px] w-full mx-auto p-4 md:p-6 pb-28">
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
              <Receipt className="w-6 h-6 text-emerald-600" />
              Buat Invoice Penjualan Kayu (Ambil dari Packing)
            </h1>
            {selectedPacking && (
              <Badge className="bg-purple-600 font-mono text-xs text-white">
                Stok: {selectedPacking.packingNumber}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tarik stok produk jadi dari lembar Packing List (Ukuran Nominal Buyer) & langsung tentukan harga jual per M³ atau per Batang.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Menyimpan Faktur..." : "Simpan & Terbitkan Invoice"}
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert variant="destructive" className="border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="font-semibold text-xs flex items-center justify-between">
            <span>{pageError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageError(null)}
              className="h-6 px-2 text-xs text-rose-600 hover:text-rose-800"
            >
              Tutup
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* STEP 1: PILIH SUMBER PACKING & INFORMASI BUYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI: PILIH SUMBER PACKING LIST */}
        <Card className="border-purple-200/80 dark:border-purple-900/40 shadow-sm">
          <CardHeader className="bg-purple-50/40 dark:bg-purple-950/20 py-3.5 px-4 md:px-5 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
              <Package className="w-4 h-4 text-purple-600" /> 1. Sumber Stok Packing List
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih packing list kayu yang sudah selesai dipacking untuk ditarik ke tagihan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Dokumen Packing List *</Label>
              <Select value={selectedPackingId} onValueChange={handleSelectPacking}>
                <SelectTrigger className="h-9 text-xs font-mono font-medium">
                  <SelectValue placeholder="-- Pilih Packing List --">
                    {selectedPacking
                      ? `${selectedPacking.packingNumber} (${selectedPacking.species || "KAYU"} - ${selectedPacking.palletCount || 1} PLT)`
                      : "-- Pilih Packing List --"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {packingList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-700">{p.packingNumber}</span>
                        <span className="text-muted-foreground">({p.species || "KAYU"})</span>
                        <span className="text-[11px] font-mono text-emerald-600">
                          {Number(p.totalCustVolume || p.totalRealVolume || 0).toFixed(4)} M³
                        </span>
                        {p.partai?.code && <Badge variant="outline" className="text-[10px]">{p.partai.code}</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPacking && (
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg border border-purple-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spesies / Kayu:</span>
                  <strong className="font-mono uppercase text-foreground">{selectedPacking.species || "MERBAU"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Palet:</span>
                  <strong className="font-mono">{selectedPacking.palletCount || 1} Palet</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vol. Riil Pabrik:</span>
                  <strong className="font-mono text-blue-600">{Number(selectedPacking.totalRealVolume || 0).toFixed(4)} M³</strong>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-purple-900 dark:text-purple-300 font-semibold">Vol. Nominal Buyer:</span>
                  <strong className="font-mono text-emerald-600 font-bold">
                    {Number(selectedPacking.totalCustVolume || selectedPacking.totalRealVolume || 0).toFixed(4)} M³
                  </strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TENGAH & KANAN: INFORMASI CUSTOMER & FAKTUR */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="bg-muted/30 py-3.5 px-4 md:px-5 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> 2. Informasi Buyer & Nomor Invoice
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih data buyer dan nomor faktur penjualan yang akan dicetak/dikirimkan ke pelanggan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Customer / Buyer *</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(val) => {
                  setSelectedCustomerId(val || "");
                  const c = customers.find((cust) => cust.id === val);
                  if (c) setBuyerName(c.name);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Customer">
                    {customers.find((c) => c.id === selectedCustomerId)?.name || "Pilih Customer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nomor Invoice *</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tanggal Invoice *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Jatuh Tempo (Due Date)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Catatan / Kontainer / Keterangan Ekspor</Label>
              <Input
                placeholder="Contoh: Muatan Kontainer CONT-01, Kirim via Tanjung Perak"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP 2: PENETAPAN HARGA CEPAT (BULK PRICE CALCULATOR) */}
      <Card className="border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Penerapan Harga Cepat (Quick Bulk Price)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ketik harga per M³ untuk langsung mengisi seluruh baris palet di bawah ini secara serentak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Harga/M³: Rp</span>
              <Input
                type="number"
                placeholder="misal: 12500000"
                value={defaultPricePerM3 || ""}
                onChange={(e) => handleApplyPriceToAll(Number(e.target.value) || 0)}
                className="w-40 h-8 text-xs font-mono font-bold text-emerald-700 bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">PPN (%):</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={taxPercent || ""}
                onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                className="w-20 h-8 text-xs font-mono text-center bg-background"
                placeholder="11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 3: TABEL RINCIAN ITEM DARI PACKING LIST */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 py-3.5 px-4 md:px-5 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              3. Rincian Item Kayu & Nilai Penjualan
            </CardTitle>
            <CardDescription className="text-xs">
              Item terisi otomatis berdasarkan ukuran Nominal Customer dari packing list. Anda dapat menyesuaikan harga satuan setiap baris.
            </CardDescription>
          </div>
          <span className="text-xs font-mono font-semibold text-muted-foreground">
            {lineItems.length} Baris Terdaftar
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/50 text-xs">
                <TableRow>
                  <TableHead className="w-[80px] text-center">Palet</TableHead>
                  <TableHead className="min-w-[220px]">Deskripsi Produk</TableHead>
                  <TableHead className="w-[100px] text-center">Ukuran (cm)</TableHead>
                  <TableHead className="w-[80px] text-center">Batang</TableHead>
                  <TableHead className="w-[110px] text-right text-emerald-700 dark:text-emerald-400 font-bold">
                    Vol M³
                  </TableHead>
                  <TableHead className="w-[110px] text-center">Dasar Tagihan</TableHead>
                  <TableHead className="w-[160px] text-right">Harga Satuan (Rp)</TableHead>
                  <TableHead className="w-[150px] text-right font-bold text-foreground">Subtotal (Rp)</TableHead>
                  <TableHead className="w-[50px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
                      Belum ada item tagihan. Pilih dokumen <strong>Packing List</strong> pada langkah 1 di atas untuk menarik data secara otomatis.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 text-xs">
                      <TableCell className="text-center font-mono font-bold">
                        <Badge variant="outline" className="text-[11px] font-mono">
                          {item.palletNo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLineItems((prev) => {
                              const updated = [...prev];
                              updated[idx].description = val;
                              return updated;
                            });
                          }}
                          className="h-8 text-xs font-medium"
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {item.tCm} × {item.lCm} × {item.pCm}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold">
                        {item.pcs} Pcs
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 pr-3">
                        {item.volumeM3.toFixed(4)} M³
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={item.billingBasis}
                          onValueChange={(val: string | null) => handleBasisChange(idx, (val as "M3" | "PCS") || "M3")}
                        >
                          <SelectTrigger className="h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M3">Per M³</SelectItem>
                            <SelectItem value="PCS">Per Batang</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(e) => handleLinePriceChange(idx, Number(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 text-xs font-mono text-right font-bold"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground text-xs pr-3">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* TOTAL INVOICE REKAPITULASI */}
          <div className="p-4 bg-muted/40 border-t flex flex-col sm:flex-row items-end sm:items-center justify-between text-xs px-6 gap-4">
            <div className="flex items-center gap-4 text-muted-foreground font-medium">
              <span>
                Total Batang: <strong className="font-mono text-foreground">{totalPcs} Pcs</strong>
              </span>
              <span>•</span>
              <span>
                Total Volume Buyer: <strong className="font-mono text-emerald-600 text-sm font-bold">{totalVolumeM3.toFixed(4)} M³</strong>
              </span>
            </div>

            <div className="w-full sm:w-80 space-y-2 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal DPP:</span>
                <span className="font-mono font-bold text-foreground">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {taxPercent > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">PPN ({taxPercent}%):</span>
                  <span className="font-mono font-medium text-muted-foreground">Rp {taxAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2 font-bold">
                <span className="text-emerald-900 dark:text-emerald-300">Total Faktur:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
