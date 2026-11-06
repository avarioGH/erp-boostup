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
  ExternalLink,
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

  // Simulation state
  const [simItemName, setSimItemName] = useState("Ikan Tuna Yellowfin Utuh");
  const [simQty, setSimQty] = useState(10);
  const [simPrice, setSimPrice] = useState(65000);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, regsRes, codesRes, fishRes] = await Promise.all([
        TaxAPI.getProfile().catch(() => null),
        TaxAPI.getRegulations().catch(() => []),
        TaxAPI.getCodes().catch(() => []),
        TaxAPI.getFishClassifications().catch(() => []),
      ]);
      setTaxProfile(profileRes);
      setRegulations(Array.isArray(regsRes) ? regsRes : []);
      setTaxCodes(Array.isArray(codesRes) ? codesRes : []);
      setFishClassifications(Array.isArray(fishRes) ? fishRes : []);
    } catch (e) {
      console.error("Failed to load tax data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            Kepatuhan perpajakan korporasi terintegrasi: PPN Hasil Perikanan (PP 49/2022), PPh 21 TER, PPh 22/23, dan Kesiapan Coretax DJP.
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

      {/* Tax Profile Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {taxProfile?.taxpayer_name || "PT Bahari Ikan Nusantara"}
                  </h3>
                  <Badge variant={taxProfile?.is_pkp ? "default" : "secondary"}>
                    {taxProfile?.is_pkp ? "PKP (Pengusaha Kena Pajak)" : "Non-PKP"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-4">
                  <span><strong>NPWP:</strong> {taxProfile?.npwp || "01.234.567.8-054.000"}</span>
                  <span><strong>KLU:</strong> {taxProfile?.klu_code || "03111"} (Perikanan Laut)</span>
                  <span><strong>KPP:</strong> {taxProfile?.tax_office_code || "Pratama"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-xs text-muted-foreground hidden sm:block">
                <div>Status Engine: <strong>Aktif & Terverifikasi</strong></div>
                <div>Standar: <strong>PP 49/2022 & PMK 131/2024</strong></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="overview" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Klasifikasi Ikan (Fasilitas)
          </TabsTrigger>
          <TabsTrigger value="regulations" className="gap-2">
            <FileText className="w-4 h-4" /> Dasar Regulasi
          </TabsTrigger>
          <TabsTrigger value="taxcodes" className="gap-2">
            <Scale className="w-4 h-4" /> Kode & Aturan Pajak
          </TabsTrigger>
          <TabsTrigger value="simulator" className="gap-2">
            <Calculator className="w-4 h-4" /> Simulator Pajak
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FISH PRODUCT CLASSIFICATION */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="w-5 h-5 text-primary" /> Klasifikasi Pajak Produk Perikanan (PP 49/2022)
              </CardTitle>
              <CardDescription>
                Penetapan kepatuhan PPN untuk setiap komoditas perikanan: Ikan segar/beku tangkapan alam yang belum diolah dibebaskan dari pengenaan PPN (Faktur Pajak 080), sedangkan produk olahan/fillet terutang PPN standar 11%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data klasifikasi...</div>
              ) : fishClassifications.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-muted-foreground">Belum ada data klasifikasi pajak produk ikan.</p>
                  <Button onClick={handleSeedStandards} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Jalankan Sinkronisasi Regulasi Otomatis
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Kode / Nama Produk</TableHead>
                        <TableHead>Spesies</TableHead>
                        <TableHead>Kondisi & Bentuk</TableHead>
                        <TableHead>Asal Komoditas</TableHead>
                        <TableHead>Klasifikasi PPN</TableHead>
                        <TableHead>Dasar Hukum</TableHead>
                        <TableHead className="text-center">Status Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fishClassifications.map((fc: any) => (
                        <TableRow key={fc.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div>{fc.product?.name || "Produk"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{fc.product?.code || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{fc.fish_species_category}</Badge>
                            {fc.scientific_name && (
                              <div className="text-[11px] italic text-muted-foreground">{fc.scientific_name}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{fc.product_condition}</div>
                            <div className="text-xs text-muted-foreground">{fc.cutting_form}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {fc.origin_type === "WILD_CAPTURE_MARINE" ? "Tangkapan Laut" : fc.origin_type}
                          </TableCell>
                          <TableCell>
                            {fc.vat_classification === "EXEMPT_FACILITY" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none font-semibold">
                                PPN Dibebaskan (080)
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-none font-semibold">
                                Terutang PPN 11% (010)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={fc.legal_reference}>
                            {fc.legal_reference}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={fc.review_status === "VERIFIED" ? "default" : "secondary"} className="gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {fc.review_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REGULATIONS */}
        <TabsContent value="regulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulasi & Dasar Hukum Perpajakan</CardTitle>
              <CardDescription>
                Daftar peraturan perundang-undangan Republik Indonesia yang menjadi landasan kepatuhan perpajakan IKAN ERP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regulations.map((reg: any) => (
                  <div key={reg.id} className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="font-mono">{reg.regulation_number}</Badge>
                      <Badge className="bg-primary/10 text-primary border-none">{reg.category}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{reg.title}</h4>
                    <p className="text-xs text-muted-foreground">{reg.description}</p>
                    <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      Mulai Berlaku: <strong>{new Date(reg.effective_from).toLocaleDateString("id-ID")}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: TAX CODES & RULES */}
        <TabsContent value="taxcodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Kode & Aturan Pajak</CardTitle>
              <CardDescription>
                Aturan tarif pajak berbasis versi dan tanggal efektif (*effective-dated tax rules*) untuk mencegah *hardcoding* di controller.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Kode Pajak</TableHead>
                      <TableHead>Nama Deskripsi</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Perlakuan (Treatment)</TableHead>
                      <TableHead className="text-right">Tarif Efektif</TableHead>
                      <TableHead className="text-center">Dapat Dikreditkan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxCodes.map((tc: any) => {
                      const activeRule = tc.rules?.[0];
                      return (
                        <TableRow key={tc.id}>
                          <TableCell className="font-mono font-bold text-primary">{tc.code}</TableCell>
                          <TableCell>{tc.name}</TableCell>
                          <TableCell><Badge variant="secondary">{tc.tax_type}</Badge></TableCell>
                          <TableCell>{activeRule?.tax_treatment || "STANDARD"}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {activeRule ? `${(activeRule.tariff_rate * 100).toFixed(1)}%` : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {activeRule?.is_creditable ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-none">Ya</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Tidak</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: TAX SIMULATOR */}
        <TabsContent value="simulator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Simulator & Trace Audit Pajak
              </CardTitle>
              <CardDescription>
                Uji langsung kalkulasi mesin pajak (*Tax Engine*) untuk memverifikasi DPP, PPN Terutang/Dibebaskan, dan audit trace hukum secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-border/70 bg-muted/20">
                <div className="space-y-2">
                  <Label>Nama Komoditas / Produk</Label>
                  <Input
                    value={simItemName}
                    onChange={(e) => setSimItemName(e.target.value)}
                    placeholder="Misal: Ikan Tuna Segar atau Fillet Ikan"
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
