"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Scale,
  Fish,
  FileText,
  Calculator,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  Receipt,
  Layers,
  TrendingDown,
  PieChart,
  Landmark,
} from "lucide-react";
import { TaxAPI } from "@/lib/api";

export default function TaxManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [taxProfile, setTaxProfile] = useState<any>(null);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [taxCodes, setTaxCodes] = useState<any[]>([]);
  const [fishClassifications, setFishClassifications] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Phase 3: Faktur Pajak State
  const [taxInvoices, setTaxInvoices] = useState<any[]>([]);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("OUTPUT");

  // Phase 4: Withholding Certificates State (Bukti Potong)
  const [bupotList, setBupotList] = useState<any[]>([]);
  const [bupotTaxType, setBupotTaxType] = useState("");

  // Phase 5: Fiscal Adjustments & Corporate Tax Return
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [fiscalAdjustments, setFiscalAdjustments] = useState<any[]>([]);
  const [corporateTaxReturn, setCorporateTaxReturn] = useState<any>(null);
  const [isCalculatingCit, setIsCalculatingCit] = useState(false);

  // Simulation state
  const [simItemName, setSimItemName] = useState("Ikan Tuna Yellowfin Utuh");
  const [simQty, setSimQty] = useState(10);
  const [simPrice, setSimPrice] = useState(65000);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, regsRes, codesRes, fishRes, invoicesRes, bupotRes, adjRes] = await Promise.all([
        TaxAPI.getProfile().catch(() => null),
        TaxAPI.getRegulations().catch(() => []),
        TaxAPI.getCodes().catch(() => []),
        TaxAPI.getFishClassifications().catch(() => []),
        TaxAPI.getTaxInvoices({ type: invoiceTypeFilter }).catch(() => []),
        TaxAPI.getWithholdingCertificates().catch(() => []),
        TaxAPI.getFiscalAdjustments(fiscalYear).catch(() => []),
      ]);
      setTaxProfile(profileRes);
      setRegulations(Array.isArray(regsRes) ? regsRes : []);
      setTaxCodes(Array.isArray(codesRes) ? codesRes : []);
      setFishClassifications(Array.isArray(fishRes) ? fishRes : []);
      setTaxInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
      setBupotList(Array.isArray(bupotRes) ? bupotRes : []);
      setFiscalAdjustments(Array.isArray(adjRes) ? adjRes : []);
    } catch (e) {
      console.error("Failed to load tax data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [invoiceTypeFilter, fiscalYear]);

  const handleSeedStandards = async () => {
    if (!confirm("Inisialisasi regulasi perpajakan Indonesia 2026 dan klasifikasi produk perikanan (PP 49/2022 & PMK 131/2024)?")) return;
    try {
      setIsSeeding(true);
      await TaxAPI.seedStandards();
      alert("Inisialisasi standar perpajakan berhasil disinkronkan!");
      await loadData();
    } catch (e: any) {
      alert("Gagal inisialisasi: " + (e?.response?.data?.message || e.message));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const res = await TaxAPI.simulateCalculate({
        transactionType: "SALES_INVOICE",
        items: [
          {
            itemName: simItemName,
            qty: Number(simQty),
            unitPrice: Number(simPrice),
          },
        ],
      });
      setSimResult(res);
    } catch (e: any) {
      alert("Simulasi kalkulasi gagal: " + (e?.response?.data?.message || e.message));
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCalculateCit = async () => {
    try {
      setIsCalculatingCit(true);
      const res = await TaxAPI.calculateCorporateTax({
        fiscalYear: Number(fiscalYear),
        isEligiblePasal31e: true,
      });
      setCorporateTaxReturn(res);
      alert("Perhitungan PPh Badan Tahun Pajak " + fiscalYear + " berhasil difinalisasi!");
      await loadData();
    } catch (e: any) {
      alert("Kalkulasi PPh Badan gagal: " + (e?.response?.data?.message || e.message));
    } finally {
      setIsCalculatingCit(false);
    }
  };

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" /> Manajemen Pajak Indonesia 2026
          </h1>
          <p className="text-muted-foreground mt-1">
            Kepatuhan perpajakan korporasi terintegrasi: Faktur Pajak PPN (PP 49/2022), Bukti Potong Unifikasi (PPh 21/22/23), dan SPT Tahunan PPh Badan (Pasal 31E).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            onClick={handleSeedStandards}
            disabled={isSeeding}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            {isSeeding ? "Sinkronisasi..." : "Sinkronisasi Regulasi 2026"}
          </Button>
        </div>
      </div>

      {/* Profile Card Highlight */}
      <Card className="border-border/60 bg-gradient-to-r from-card to-card/50 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="space-y-1">
              <div className="text-xs uppercase font-medium text-muted-foreground flex items-center gap-1.5">
                <Building className="w-4 h-4 text-primary" /> Status Wajib Pajak
              </div>
              <div className="text-lg font-bold text-foreground">
                {taxProfile ? taxProfile.legal_entity_name : "PT IKAN TATA LORA"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={taxProfile?.is_pkp ? "default" : "secondary"} className="bg-emerald-600/90 text-white font-medium">
                  {taxProfile?.is_pkp ? "Pengusaha Kena Pajak (PKP)" : "Non-PKP"}
                </Badge>
                <Badge variant="outline" className="border-border/80 text-xs">
                  KPP Pratama: {taxProfile?.kpp_code || "011"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase font-medium text-muted-foreground">NPWP (15 / 16 Digit Coretax)</div>
              <div className="text-base font-semibold font-mono text-foreground">
                {taxProfile?.npwp || "01.234.567.8-011.000"}
              </div>
              <div className="text-xs text-muted-foreground">
                NITKU: {taxProfile?.nitku || "0000000000000000"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase font-medium text-muted-foreground">Sertifikat Digital E-Faktur / Coretax</div>
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Aktif (DJP Validated)
              </div>
              <div className="text-xs text-muted-foreground">
                Berlaku s.d. 31 Des 2026
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase font-medium text-muted-foreground">Basis Regulasi Aktif</div>
              <div className="text-sm font-semibold text-foreground">
                UU HPP, PP 49/2022 & PMK 131/2024
              </div>
              <div className="text-xs text-muted-foreground">
                Pajak Penghasilan: UU 36/2008 stdd UU 7/2021
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60">
          <TabsTrigger value="overview" className="gap-2 py-2.5">
            <ShieldCheck className="w-4 h-4" /> Ikhtisar Pajak
          </TabsTrigger>
          <TabsTrigger value="vat-invoices" className="gap-2 py-2.5">
            <Receipt className="w-4 h-4" /> Faktur Pajak PPN
          </TabsTrigger>
          <TabsTrigger value="withholding" className="gap-2 py-2.5">
            <FileText className="w-4 h-4" /> Bukti Potong Unifikasi
          </TabsTrigger>
          <TabsTrigger value="corporate-tax" className="gap-2 py-2.5">
            <Landmark className="w-4 h-4" /> Koreksi Fiskal & PPh Badan
          </TabsTrigger>
          <TabsTrigger value="fish-products" className="gap-2 py-2.5">
            <Fish className="w-4 h-4" /> Klasifikasi Ikan
          </TabsTrigger>
          <TabsTrigger value="simulator" className="gap-2 py-2.5">
            <Calculator className="w-4 h-4" /> Simulator Pajak
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  Fasilitas PPN Ikan Utuh / Segar
                  <Badge variant="outline" className="border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                    PP 49/2022
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Komoditas perikanan tanpa pengolahan lanjutan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-2xl font-bold text-foreground">0% Dibebaskan</div>
                <p className="text-xs text-muted-foreground">
                  Ikan segar, dingin, atau beku yang hanya dibersihkan/dibuang insang memenuhi kriteria BKP Tertentu yang Bersifat Strategis yang dibebaskan dari pengenaan PPN.
                </p>
                <div className="text-xs text-primary font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faktur Pajak Kode 080 (Dibebaskan)
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  PPN Produk Olahan (Fillet/Kemasan)
                  <Badge variant="outline" className="border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                    PMK 131/2024
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Produk hasil proses industri hilirisasi perikanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-2xl font-bold text-foreground">11% PPN Standar</div>
                <p className="text-xs text-muted-foreground">
                  Produk yang telah mengalami proses pemotongan/fillet, seasoning, pengalengan, atau pengasapan dikenakan tarif PPN standar 11%.
                </p>
                <div className="text-xs text-primary font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faktur Pajak Kode 010 (Standar)
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  PPh Badan Fasilitas 50%
                  <Badge variant="outline" className="border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-950/20">
                    Pasal 31E UU PPh
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Pengurangan tarif untuk peredaran bruto s.d Rp 50 Miliar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-2xl font-bold text-foreground">11% Tarif Efektif</div>
                <p className="text-xs text-muted-foreground">
                  Fasilitas pengurangan tarif 50% dari tarif normal 22% atas Penghasilan Kena Pajak dari bagian peredaran bruto sampai dengan Rp 4,8 Miliar.
                </p>
                <div className="text-xs text-purple-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rekonsiliasi Fiskal Terotomasi
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Master Regulations & Codes Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Regulasi Perpajakan Terdaftar (Master Regulations)</CardTitle>
                <CardDescription>Dasar hukum dan aturan efektif yang diintegrasikan ke dalam kalkulasi ERP.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Regulasi</TableHead>
                      <TableHead>Berlaku Mulai</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regulations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Belum ada regulasi terdaftar. Klik Sinkronisasi Regulasi 2026.
                        </TableCell>
                      </TableRow>
                    ) : (
                      regulations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-mono text-xs font-semibold">{reg.code}</TableCell>
                          <TableCell>
                            <div className="font-medium text-xs text-foreground">{reg.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{reg.description}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(reg.effective_from).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={reg.status === "ACTIVE" ? "outline" : "secondary"} className="text-[10px]">
                              {reg.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Master Kode Pajak (Tax Codes)</CardTitle>
                <CardDescription>Kode transaksi, tarif, dan pemetaan akun buku besar.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Tarif Standar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Belum ada data kode pajak.
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono text-xs font-semibold">{code.code}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{code.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{code.tax_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {code.default_rate !== null ? `${code.default_rate}%` : "Aturan Khusus / TER"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: FAKTUR PAJAK PPN (PHASE 3) */}
        <TabsContent value="vat-invoices" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Daftar Faktur Pajak Elektronik (E-Faktur / Coretax)</CardTitle>
                <CardDescription>
                  Pencatatan Nomor Seri Faktur Pajak (NSFP 16 digit), kode transaksi (010, 080), dan rekonsiliasi PPN Masukan/Keluaran.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={invoiceTypeFilter === "OUTPUT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInvoiceTypeFilter("OUTPUT")}
                >
                  Faktur Pajak Keluaran
                </Button>
                <Button
                  variant={invoiceTypeFilter === "INPUT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInvoiceTypeFilter("INPUT")}
                >
                  Faktur Pajak Masukan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NSFP / No Faktur</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Lawan Transaksi</TableHead>
                    <TableHead>NPWP / NITKU</TableHead>
                    <TableHead className="text-right">DPP (Rp)</TableHead>
                    <TableHead className="text-right">PPN (Rp)</TableHead>
                    <TableHead>Status DJP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada Faktur Pajak tercatat untuk kategori ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {inv.transaction_code}{inv.status_code}.{inv.nsfp}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(inv.invoice_date).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{inv.counterparty_name}</TableCell>
                        <TableCell className="font-mono text-xs">{inv.counterparty_npwp}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatIDR(inv.dpp_amount)}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-primary">{formatIDR(inv.vat_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-emerald-600 text-emerald-600">
                            {inv.approval_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BUKTI POTONG UNIFIKASI (PHASE 4) */}
        <TabsContent value="withholding" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bukti Potong Unifikasi (PPh 21, 22, 23, 4(2))</CardTitle>
              <CardDescription>
                Pencatatan pemotongan/pemungutan pajak pihak ketiga, TER PPh 21 Karyawan, dan PPh 22 Pembelian Hasil Perikanan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Bukti Potong</TableHead>
                    <TableHead>Jenis Pajak</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama Penerima Penghasilan</TableHead>
                    <TableHead>NPWP / NIK</TableHead>
                    <TableHead className="text-right">Penghasilan Bruto</TableHead>
                    <TableHead className="text-center">Tarif</TableHead>
                    <TableHead className="text-right">PPh Dipotong</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bupotList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Belum ada Bukti Pemotongan Pajak tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bupotList.map((bp) => (
                      <TableRow key={bp.id}>
                        <TableCell className="font-mono text-xs font-semibold">{bp.certificate_no}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{bp.tax_type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(bp.transaction_date).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{bp.taxpayer_name}</TableCell>
                        <TableCell className="font-mono text-xs">{bp.taxpayer_id}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatIDR(bp.gross_amount)}</TableCell>
                        <TableCell className="text-xs text-center font-mono">{bp.tax_rate}%</TableCell>
                        <TableCell className="text-xs text-right font-bold text-rose-600 dark:text-rose-400">
                          {formatIDR(bp.withholding_amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: KOREKSI FISKAL & PPH BADAN (PHASE 5) */}
        <TabsContent value="corporate-tax" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border/60">
            <div>
              <div className="font-bold text-sm text-foreground">Tahun Pajak Rekonsiliasi Fiskal</div>
              <p className="text-xs text-muted-foreground">Pilih tahun pajak untuk kalkulasi laba rugi komersial vs laba rugi fiskal.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-28 font-mono"
              />
              <Button onClick={handleCalculateCit} disabled={isCalculatingCit} className="gap-2">
                <Calculator className="w-4 h-4" />
                {isCalculatingCit ? "Menghitung..." : "Hitung PPh Badan (Pasal 31E)"}
              </Button>
            </div>
          </div>

          {corporateTaxReturn && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs text-muted-foreground">Peredaran Bruto Komersial</div>
                  <div className="text-xl font-bold">{formatIDR(corporateTaxReturn.commercial_gross_revenue)}</div>
                  <div className="text-[11px] text-emerald-600">Fasilitas PPh Badan 50% Aktif</div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs text-muted-foreground">Penghasilan Neto Fiskal</div>
                  <div className="text-xl font-bold">{formatIDR(corporateTaxReturn.fiscal_net_income)}</div>
                  <div className="text-[11px] text-muted-foreground">Setelah Koreksi Positif/Negatif</div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs text-muted-foreground">Kredit Pajak (PPh 22 & 23)</div>
                  <div className="text-xl font-bold text-blue-600">{formatIDR(corporateTaxReturn.total_tax_credits)}</div>
                  <div className="text-[11px] text-muted-foreground">Dari Bukti Potong Pihak Lain</div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs text-muted-foreground">PPh Kurang Bayar (Pasal 29)</div>
                  <div className="text-xl font-bold text-rose-600">{formatIDR(corporateTaxReturn.underpayment_amount)}</div>
                  <div className="text-[11px] text-muted-foreground">Cicilan PPh 25: {formatIDR(corporateTaxReturn.monthly_pph25_next_year)}/bln</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Daftar Koreksi Fiskal Positif & Negatif (Tahun {fiscalYear})</CardTitle>
              <CardDescription>Penyesuaian atas perbedaan ketentuan akuntansi komersial dan perpajakan (Undang-Undang PPh).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Koreksi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Keterangan & Dasar Hukum</TableHead>
                    <TableHead className="text-right">Jumlah Komersial</TableHead>
                    <TableHead className="text-right">Jumlah Fiskal</TableHead>
                    <TableHead className="text-right">Nilai Koreksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada pos koreksi fiskal untuk tahun {fiscalYear}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fiscalAdjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          <Badge variant={adj.adjustment_type === "POSITIVE" ? "destructive" : "secondary"}>
                            {adj.adjustment_type === "POSITIVE" ? "+ Positif" : "- Negatif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{adj.category}</TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-foreground">{adj.description}</div>
                          <div className="text-[11px] text-muted-foreground">{adj.legal_reference}</div>
                        </TableCell>
                        <TableCell className="text-xs text-right">{formatIDR(adj.commercial_amount)}</TableCell>
                        <TableCell className="text-xs text-right">{formatIDR(adj.fiscal_amount)}</TableCell>
                        <TableCell className="text-xs text-right font-bold">{formatIDR(adj.adjustment_amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: FISH CLASSIFICATIONS */}
        <TabsContent value="fish-products" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Klasifikasi Pajak Produk Perikanan (Fish Tax Registry)</CardTitle>
              <CardDescription>
                Pemetaan setiap jenis produk ikan terhadap perlakuan PPN: Dibebaskan (PP 49/2022) vs Terutang 11% (PMK 131/2024).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori / Nama Latin</TableHead>
                    <TableHead>Kondisi & Bentuk</TableHead>
                    <TableHead>Kode HS</TableHead>
                    <TableHead>Perlakuan PPN</TableHead>
                    <TableHead>Fasilitas / Regulasi</TableHead>
                    <TableHead>Status Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fishClassifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Belum ada data klasifikasi ikan. Klik Sinkronisasi Regulasi 2026.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fishClassifications.map((item) => {
                      const isExempt = item.vat_classification === "EXEMPT";
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-foreground">
                            {item.product?.name || "Produk Perikanan"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>{item.fish_category}</div>
                            <div className="italic text-muted-foreground text-[11px]">{item.scientific_name || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-semibold">{item.product_condition}</span> / {item.cut_form}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.hs_code || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={isExempt ? "border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" : "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/20"}
                            >
                              {isExempt ? "DIBEBASKAN (0%)" : "TERUTANG (11%)"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{item.tax_facility}</div>
                            <div className="text-[11px] text-muted-foreground">{item.legal_reference}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.manual_review_status === "APPROVED" ? "default" : "outline"} className="text-[10px]">
                              {item.manual_review_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: SIMULATOR */}
        <TabsContent value="simulator" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Simulator Mesin Pajak IKAN ERP (Tax Calculation Engine)</CardTitle>
              <CardDescription>
                Uji perhitungan otomatis perlakuan pajak, pemisahan DPP Standar vs DPP Dibebaskan, dan penentuan akun buku besar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nama Barang / Produk Perikanan</Label>
                  <Input
                    value={simItemName}
                    onChange={(e) => setSimItemName(e.target.value)}
                    placeholder="misal: Ikan Tuna Yellowfin Utuh atau Fillet Tuna"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Kuantitas (Qty)</Label>
                  <Input
                    type="number"
                    value={simQty}
                    onChange={(e) => setSimQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Harga Satuan (Rp)</Label>
                  <Input
                    type="number"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={handleSimulate} disabled={isSimulating} className="gap-2">
                <Calculator className="w-4 h-4" /> {isSimulating ? "Menghitung..." : "Jalankan Simulasi Kalkulasi"}
              </Button>

              {simResult && (
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <h4 className="font-bold text-sm text-foreground">Hasil Evaluasi Mesin Pajak (Tax Calculation Trace):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <div className="text-xs text-muted-foreground">Subtotal Kotor</div>
                      <div className="text-lg font-bold">{formatIDR(simResult.subtotalGross)}</div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <div className="text-xs text-muted-foreground">DPP Standar (11%)</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatIDR(simResult.dppStandard)}</div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <div className="text-xs text-muted-foreground">DPP Dibebaskan (PP 49)</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(simResult.dppExempt)}</div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <div className="text-xs text-muted-foreground">PPN Terutang</div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatIDR(simResult.totalVatAmount)}</div>
                    </div>
                  </div>

                  {simResult.lines?.[0] && (
                    <div className="p-4 rounded-xl bg-accent/30 border border-border text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{simResult.lines[0].taxTreatment}</Badge>
                        <span className="font-semibold text-foreground">{simResult.lines[0].legalReference}</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground bg-background p-3 rounded border border-border/50">
                        {simResult.lines[0].calculationTrace}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
