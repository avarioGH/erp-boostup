"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PurchaseAPI, TimberAPI, InventoryAPI, MasterDataAPI, PartaiAPI, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SawnTimberSpreadsheet, SawnTallyRow } from "@/components/timber/sawn-timber-spreadsheet";
import { AiTallyImportModal } from "@/components/timber/ai-tally-import-modal";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Truck, 
  FileText, 
  PackageCheck, 
  Ruler, 
  Boxes,
  Camera
} from "lucide-react";

export default function CreateGoodsReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlPartaiId = searchParams.get("partaiId") || "";
  const urlPurchaseId = searchParams.get("purchaseId") || "";

  // Receipt Header Info
  const [receiptNumber, setReceiptNumber] = useState(`GRN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryNoteNo, setDeliveryNoteNo] = useState(""); // No. Surat Jalan Supplier
  const [truckNumber, setTruckNumber] = useState(""); // No. Truk / Polisi
  const [driverName, setDriverName] = useState("");
  const [notes, setNotes] = useState("");

  const [partaiList, setPartaiList] = useState<any[]>([]);
  const [selectedPartaiId, setSelectedPartaiId] = useState(urlPartaiId);
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [purchaseList, setPurchaseList] = useState<any[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(urlPurchaseId);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  // Receipt item mode: "LOG" | "SAWN"
  const [itemType, setItemType] = useState<"LOG" | "SAWN">("LOG");

  // Raw Log items table
  const [logRows, setLogRows] = useState<any[]>([]);
  const [lengthUnit, setLengthUnit] = useState<"m" | "cm" | "mm">("m");

  // Sawn Timber items table
  const [sawnRows, setSawnRows] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load initial master data
  useEffect(() => {
    Promise.all([
      PartaiAPI.getPartaiList().catch(() => ({ data: [] })),
      InventoryAPI.getWarehouses().catch(() => []),
      MasterDataAPI.getSpecies().catch(() => []),
      PurchaseAPI.getPurchases({ limit: 100 }).catch(() => ({ data: [] })),
    ]).then(([pRes, wRes, sRes, poRes]: any) => {
      const pItems = Array.isArray(pRes?.data) ? pRes.data : Array.isArray(pRes) ? pRes : [];
      setPartaiList(pItems);
      const wItems = Array.isArray(wRes) ? wRes : [];
      setWarehouseList(wItems);
      if (wItems.length > 0) setSelectedWarehouseId(wItems[0].id);
      const spItems = Array.isArray(sRes) ? sRes : sRes?.data || [];
      setSpeciesList(spItems);
      const poItems = Array.isArray(poRes?.data) ? poRes.data : Array.isArray(poRes) ? poRes : [];
      setPurchaseList(poItems);
    }).finally(() => setLoading(false));
  }, []);

  // When purchase selection changes, pre-fill items
  useEffect(() => {
    if (!selectedPurchaseId || selectedPurchaseId === "none") {
      setSelectedPurchase(null);
      return;
    }

    PurchaseAPI.getPurchase(selectedPurchaseId)
      .then((res: any) => {
        const po = res?.data || res;
        setSelectedPurchase(po);
        if (po.partaiId && !selectedPartaiId) setSelectedPartaiId(po.partaiId);
        if (po.warehouseId) setSelectedWarehouseId(po.warehouseId);

        if (po.logItems && po.logItems.length > 0) {
          setItemType("LOG");
          const mappedLogs = po.logItems.map((li: any, idx: number) => {
            let rawLen = Number(li.purchaseLength || li.length || 0);
            let displayLen = rawLen > 0 ? (rawLen >= 50 ? rawLen / 100 : rawLen) : "4";
            const pAvg = Number(li.purchaseDiameterAvg || 0);
            return {
              purchaseLogItemId: li.id,
              logNumber: li.logNumber || `LOG-${idx + 1}`,
              species: li.species || "MERBAU",
              speciesId: li.speciesId,
              length: String(displayLen),
              d1: li.purchaseDiameter1 ? String(li.purchaseDiameter1) : "",
              d2: li.purchaseDiameter2 ? String(li.purchaseDiameter2) : "",
              d3: "",
              d4: "",
              avgDia: pAvg > 0 ? String(pAvg) : "",
              supplierAvg: pAvg > 0 ? String(pAvg) : "",
              gerowong: "0",
              selected: li.status !== "RECEIVED",
              isAlreadyReceived: li.status === "RECEIVED",
            };
          });
          setLogRows(mappedLogs);
        } else if (po.items && po.items.length > 0) {
          setItemType("SAWN");
          const mappedSawn = po.items.map((it: any) => {
            let t = Number(it.purchaseThickness || it.timberVariant?.thickness || 0);
            let w = Number(it.purchaseWidth || it.timberVariant?.width || 0);
            let l = Number(it.purchaseLength || it.timberVariant?.length || 0);
            const isMmFormat = t > 50 || w > 100 || l > 1000;
            const tCm = isMmFormat ? t / 10 : t;
            const wCm = isMmFormat ? w / 10 : w;
            const lCm = isMmFormat ? (l > 1000 ? l / 10 : l) : l;
            const pcs = Number(it.quantityPcs || 0);
            let vol = Number(it.volumeM3 || 0);
            if ((!vol || vol === 0) && tCm > 0 && wCm > 0 && lCm > 0 && pcs > 0) {
              vol = Number(((tCm * wCm * lCm * pcs) / 1000000).toFixed(4));
            }
            return {
              id: it.id,
              timberVariantId: it.timberVariantId,
              sku: it.timberVariant?.sku || it.sku || "-",
              species: it.timberVariant?.species || it.species || "Sawn Timber",
              grade: it.timberVariant?.grade || it.grade || "A",
              productType: it.productType || "BALOK",
              thickness: tCm || "",
              width: wCm || "",
              length: lCm || "",
              orderedPcs: pcs,
              orderedVolM3: vol,
              receivedPcs: pcs || "",
              volumeM3: vol,
              selected: po.status !== "RECEIVED",
              isAlreadyReceived: po.status === "RECEIVED",
            };
          });
          setSawnRows(mappedSawn);
        }
      })
      .catch(console.error);
  }, [selectedPurchaseId]);

  // Log calculation helper
  const calculateRow = (row: any) => {
    let lRaw = parseFloat(row.length) || 0;
    let l = lRaw;
    if (lengthUnit === "cm" || (lengthUnit === "m" && lRaw >= 50)) {
      l = lRaw / 100;
    } else if (lengthUnit === "mm") {
      l = lRaw / 1000;
    }
    const d1 = parseFloat(row.d1) || 0;
    const d2 = parseFloat(row.d2) || 0;
    const d3 = parseFloat(row.d3) || 0;
    const d4 = parseFloat(row.d4) || 0;
    const validD: number[] = [];
    if (d1 > 0) validD.push(d1);
    if (d2 > 0) validD.push(d2);
    if (d3 > 0) validD.push(d3);
    if (d4 > 0) validD.push(d4);

    let avg = 0;
    if (validD.length > 0) {
      avg = validD.reduce((sum, d) => sum + d, 0) / validD.length;
    } else {
      avg = parseFloat(row.avgDia) || 0;
    }

    let gross = 0;
    if (l > 0 && avg > 0) {
      gross = (0.7854 * (l * 100) * avg * avg) / 1000000;
    }
    const grw = parseFloat(row.gerowong) || 0;
    let net = gross;
    if (l > 0 && grw > 0) {
      const red = (0.7854 * (l * 100) * grw * grw) / 1000000;
      net = Math.max(0, gross - red);
    }
    return { gross, net, avg, meterLength: l };
  };

  const handleAddLogRow = () => {
    const defaultSpecies = speciesList[0]?.name || "MERANTI";
    setLogRows(prev => [
      ...prev,
      {
        purchaseLogItemId: undefined,
        logNumber: `LOG-${Date.now().toString().slice(-4)}`,
        species: defaultSpecies,
        speciesId: undefined,
        length: "4",
        d1: "40",
        d2: "40",
        d3: "",
        d4: "",
        avgDia: "40",
        gerowong: "0",
        selected: true,
        isAlreadyReceived: false,
      }
    ]);
  };

  const handleAddSawnRow = () => {
    const defaultSpecies = speciesList[0]?.name || "MERANTI";
    setSawnRows(prev => [
      ...prev,
      {
        id: undefined,
        timberVariantId: undefined,
        sku: "MANUAL",
        species: defaultSpecies,
        grade: "A",
        productType: "BALOK",
        thickness: "",
        width: "",
        length: "",
        orderedPcs: 0,
        orderedVolM3: 0,
        receivedPcs: "",
        volumeM3: 0,
        selected: true,
        isAlreadyReceived: false,
      }
    ]);
  };

  // AI parsed data handler
  const handleAiDataParsed = (parsedRows: any[]) => {
    if (!parsedRows || parsedRows.length === 0) return;

    if (itemType === "LOG") {
      const newItems = parsedRows.map((it: any, idx: number) => {
        const l = Number(it.length || 0);
        const d1 = Number(it.d1 || 0);
        const d2 = Number(it.d2 || 0);
        const avg = it.rt ? Number(it.rt) : ((d1 + d2) / (d1 && d2 ? 2 : 1));
        return {
          purchaseLogItemId: undefined,
          logNumber: it.logNumber || `LOG-AI-${logRows.length + idx + 1}`,
          species: it.species ? it.species.toUpperCase() : "MERBAU",
          speciesId: undefined,
          length: l > 0 ? String(l) : "4",
          d1: d1 > 0 ? String(d1) : "40",
          d2: d2 > 0 ? String(d2) : "40",
          d3: "",
          d4: "",
          avgDia: String(Math.round(avg || 40)),
          gerowong: "0",
          selected: true,
          isAlreadyReceived: false,
        };
      });
      setLogRows(prev => [...prev, ...newItems]);
      toast({
        title: "Scan AI Berhasil",
        description: `${newItems.length} baris log berhasil dimuat dari tally sheet.`,
      });
    } else {
      const newItems = parsedRows.map((it: any) => {
        const t = Number(it.thickness) || 0;
        const w = Number(it.width) || 0;
        const l = Number(it.length) || 0;
        const pcs = Number(it.pcs) || 1;
        const vol = (t > 0 && w > 0 && l > 0 && pcs > 0) ? Number(((t * w * l * pcs) / 1000000).toFixed(4)) : 0;
        return {
          id: undefined,
          timberVariantId: undefined,
          sku: "SCAN-AI",
          species: it.species ? it.species.toUpperCase() : "MERBAU",
          grade: it.grade || "A",
          productType: "BALOK",
          thickness: t || "",
          width: w || "",
          length: l || "",
          orderedPcs: pcs,
          orderedVolM3: vol,
          receivedPcs: pcs,
          volumeM3: vol,
          selected: true,
          isAlreadyReceived: false,
        };
      });
      setSawnRows(prev => [...prev, ...newItems]);
      toast({
        title: "Scan AI Berhasil",
        description: `${newItems.length} baris ukuran sawn timber berhasil dimuat.`,
      });
    }
  };

  // Submit Receipt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) {
      toast({ title: "Gudang Belum Dipilih", description: "Pilih gudang tujuan bongkar barang.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const targetIsoDate = receivingDate ? new Date(receivingDate).toISOString() : new Date().toISOString();

      if (itemType === "LOG") {
        const selectedLogs = logRows.filter(r => r.selected && !r.isAlreadyReceived);
        if (selectedLogs.length === 0) {
          toast({ title: "Pilih Log", description: "Pilih minimal 1 log yang diterima.", variant: "destructive" });
          setSubmitting(false);
          return;
        }

        const logPayload = selectedLogs.map(r => {
          const calc = calculateRow(r);
          return {
            purchaseLogItemId: r.purchaseLogItemId,
            logNumber: r.logNumber,
            species: r.species,
            speciesId: r.speciesId || undefined,
            originalLength: calc.meterLength,
            diameter1: Number(r.d1) || 0,
            diameter2: Number(r.d2) || 0,
            diameter3: Number(r.d3) || 0,
            diameter4: Number(r.d4) || 0,
            averageDiameter: calc.avg || Number(r.avgDia) || 0,
            gerowong: Number(r.gerowong) || 0,
            partaiId: selectedPartaiId || undefined,
            locationId: selectedWarehouseId,
            date: targetIsoDate,
            receivingDate: targetIsoDate,
            deliveryNoteNo,
            truckNumber,
            driverName,
            notes,
          };
        });

        await TimberAPI.createBulkLogs({ items: logPayload });

        // If linked to a PO, sync purchase status
        if (selectedPurchaseId && selectedPurchaseId !== "none") {
          try {
            await PurchaseAPI.receivePurchase(selectedPurchaseId, {
              partaiId: selectedPartaiId,
              receivingDate: targetIsoDate,
              logItems: logPayload,
            });
          } catch (syncErr) {
            console.warn("PO sync warning:", syncErr);
          }
        }

        toast({
          title: "Penerimaan Berhasil Disimpan!",
          description: `${logPayload.length} log bulat berhasil dicatat ke DUKB Gudang.`,
        });
      } else {
        // SAWN TIMBER
        const selectedSawn = sawnRows.filter(r => r.selected && !r.isAlreadyReceived);
        if (selectedSawn.length === 0) {
          toast({ title: "Pilih Kayu Olahan", description: "Pilih minimal 1 baris ukuran kayu yang diterima.", variant: "destructive" });
          setSubmitting(false);
          return;
        }

        const sawnPayload = selectedSawn.map(r => ({
          id: r.id,
          timberVariantId: r.timberVariantId,
          species: r.species,
          grade: r.grade || "A",
          productType: r.productType || "BALOK",
          quantityPcs: Number(r.receivedPcs) || 0,
          thickness: Number(r.thickness) || 0,
          width: Number(r.width) || 0,
          length: Number(r.length) || 0,
          volumeM3: Number(r.volumeM3) || 0,
        }));

        if (selectedPurchaseId && selectedPurchaseId !== "none") {
          await PurchaseAPI.receivePurchase(selectedPurchaseId, {
            partaiId: selectedPartaiId,
            receivingDate: targetIsoDate,
            items: sawnPayload,
          });
        }

        toast({
          title: "Penerimaan Sawn Timber Berhasil!",
          description: `${sawnPayload.length} baris kayu olahan berhasil masuk ke inventaris stok jadi.`,
        });
      }

      if (selectedPartaiId) {
        router.push(`/inventory/partai/${selectedPartaiId}`);
      } else {
        router.push("/inventory/logs");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Menyimpan Penerimaan",
        description: err.response?.data?.message || err.message || "Terjadi kesalahan pada server",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalLogNet = logRows
    .filter(r => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + calculateRow(r).net, 0);

  const totalSawnPcs = sawnRows
    .filter(r => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.receivedPcs) || 0), 0);

  const totalSawnVol = sawnRows
    .filter(r => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.volumeM3) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight">Input Penerimaan Kayu (Goods Receipt)</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Penerimaan fisik kayu dari armada/truk langsung ke gudang tanpa terikat draft pembelian statis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAiModalOpen(true)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 font-semibold text-xs shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-purple-600 animate-pulse" /> ✨ AI Scan Tally / Surat Jalan
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Simpan Penerimaan
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Surat Jalan & Dokumen Info */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Informasi Kedatangan & Surat Jalan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">No. Penerimaan (GRN)</Label>
              <Input
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                className="h-8 font-mono font-semibold"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Diterima</Label>
              <Input
                type="date"
                value={receivingDate}
                onChange={e => setReceivingDate(e.target.value)}
                className="h-8"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gudang / Lokasi Bongkar</Label>
              <Select value={selectedWarehouseId} onValueChange={(val: any) => setSelectedWarehouseId(val || "")}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Pilih Gudang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseList.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Partai Terkait</Label>
              <Select value={selectedPartaiId} onValueChange={(val: any) => setSelectedPartaiId(val || "")}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Pilih Partai (Opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Tanpa Partai --</SelectItem>
                  {partaiList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.partaiNumber} - {p.name || p.species}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Referensi PO (Opsional)</Label>
              <Select value={selectedPurchaseId} onValueChange={(val: any) => setSelectedPurchaseId(val || "")}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Pilih PO / Mandiri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Penerimaan Mandiri (Tanpa PO) --</SelectItem>
                  {purchaseList.map(po => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.purchaseNumber} ({po.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">No. Surat Jalan Supplier</Label>
              <Input
                placeholder="Contoh: SJ-99120"
                value={deliveryNoteNo}
                onChange={e => setDeliveryNoteNo(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">No. Truk / Polisi</Label>
              <Input
                placeholder="Contoh: B 9123 XYZ"
                value={truckNumber}
                onChange={e => setTruckNumber(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Supir / Catatan</Label>
              <Input
                placeholder="Nama Supir / Ekspedisi"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="h-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tipe Barang yang Diterima */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={itemType === "LOG" ? "default" : "outline"}
            onClick={() => setItemType("LOG")}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <span>🪵</span> Kayu Bulat (Log DUKB)
          </Button>
          <Button
            type="button"
            variant={itemType === "SAWN" ? "default" : "outline"}
            onClick={() => setItemType("SAWN")}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <span>📐</span> Kayu Olahan (Sawn Timber)
          </Button>
        </div>

        {/* 1. SECTION RAW LOGS */}
        {itemType === "LOG" && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-500" />
                  Rincian Fisik Kayu Bulat (DUKB)
                </CardTitle>
                <CardDescription className="text-xs">
                  Cek panjang dan diameter aktual (D1-D4) yang tiba di gudang.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLogRow}
                  className="h-7 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> + Tambah Baris Log
                </Button>
                <div className="text-xs font-mono">
                  Total Volume Net: <strong className="text-blue-600 dark:text-blue-400 font-bold">{totalLogNet.toFixed(4)} m³</strong>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">Pilih</TableHead>
                    <TableHead className="w-[120px]">No. Log</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead className="w-[80px]">Panjang (m)</TableHead>
                    <TableHead className="w-[60px]">D1</TableHead>
                    <TableHead className="w-[60px]">D2</TableHead>
                    <TableHead className="w-[60px]">D3</TableHead>
                    <TableHead className="w-[60px]">D4</TableHead>
                    <TableHead className="w-[60px]">Grw</TableHead>
                    <TableHead className="w-[80px] text-right font-bold">RT (cm)</TableHead>
                    <TableHead className="w-[90px] text-right">Vol Net (m³)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logRows.map((r, idx) => {
                    const calc = calculateRow(r);
                    return (
                      <TableRow key={idx} className={r.isAlreadyReceived ? "opacity-50" : ""}>
                        <TableCell className="text-center p-2">
                          <Checkbox
                            checked={r.selected}
                            disabled={r.isAlreadyReceived}
                            onCheckedChange={val => {
                              const updated = [...logRows];
                              updated[idx].selected = !!val;
                              setLogRows(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={r.logNumber}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].logNumber = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-semibold"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={r.species}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].species = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={r.length}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].length = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={r.d1}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].d1 = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={r.d2}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].d2 = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={r.d3}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].d3 = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={r.d4}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].d4 = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={r.gerowong}
                            onChange={e => {
                              const updated = [...logRows];
                              updated[idx].gerowong = e.target.value;
                              setLogRows(updated);
                            }}
                            className="h-7 text-xs font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right font-bold text-blue-600 font-mono">
                          {calc.avg > 0 ? calc.avg.toFixed(1) : "-"}
                        </TableCell>
                        <TableCell className="p-1 text-right font-bold text-emerald-600 font-mono">
                          {calc.net > 0 ? calc.net.toFixed(4) : "-"}
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setLogRows(prev => prev.filter((_, i) => i !== idx))}
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 2. SECTION SAWN TIMBER */}
        {itemType === "SAWN" && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  Rincian Fisik Kayu Olahan (Sawn Timber)
                </CardTitle>
                <CardDescription className="text-xs">
                  Input ukuran tebal, lebar, panjang dan pcs kayu olahan yang tiba di gudang.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSawnRow}
                  className="h-7 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> + Tambah Baris
                </Button>
                <div className="text-xs font-mono">
                  Total Fisik: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{totalSawnVol.toFixed(4)} m³</strong> ({totalSawnPcs} Pcs)
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <SawnTimberSpreadsheet
                initialRows={sawnRows.map((r: any) => ({
                  species: r.species || "MERBAU",
                  grade: r.grade || "A",
                  thickness: r.thickness ?? "",
                  width: r.width ?? "",
                  length: r.length ?? "",
                  pcs: r.receivedPcs !== undefined && r.receivedPcs !== "" ? r.receivedPcs : (r.orderedPcs || ""),
                  m3: r.volumeM3 || 0,
                  timberVariantId: r.timberVariantId,
                  id: r.id,
                }))}
                speciesList={speciesList}
                defaultSpecies="MERBAU"
                showSpecies={true}
                showGrade={true}
                onChange={(updatedRows: SawnTallyRow[]) => {
                  const mapped = updatedRows.map((r: any) => {
                    const pcsNum = parseInt(String(r.pcs)) || 0;
                    const tNum = parseFloat(String(r.thickness).replace(",", ".")) || 0;
                    const wNum = parseFloat(String(r.width).replace(",", ".")) || 0;
                    const lNum = parseFloat(String(r.length).replace(",", ".")) || 0;
                    const m3Num = Number(r.m3) || 0;
                    return {
                      id: r.id,
                      timberVariantId: r.timberVariantId,
                      species: r.species || "MERBAU",
                      grade: r.grade || "A",
                      productType: r.productType || "BALOK",
                      thickness: tNum,
                      width: wNum,
                      length: lNum,
                      orderedPcs: r.orderedPcs || 0,
                      orderedVolM3: r.orderedVolM3 || 0,
                      receivedPcs: pcsNum,
                      volumeM3: m3Num,
                      selected: pcsNum > 0,
                      isAlreadyReceived: false,
                    };
                  });
                  setSawnRows(mapped);
                }}
              />
            </CardContent>
          </Card>
        )}
      </form>

      {/* AI TALLY SCAN MODAL */}
      <AiTallyImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        workflowType={itemType === "LOG" ? "RAW_LOG" : "SAWN_TIMBER"}
        onDataParsed={handleAiDataParsed}
      />
    </div>
  );
}
