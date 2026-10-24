"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { TimberAPI, PurchaseAPI, MasterDataAPI, api } from "@/lib/api";
import { CheckCircle2, Ruler, PackageCheck, Plus, Trash2, TrendingUp, AlertCircle, Camera, Loader2 } from "lucide-react";
import { SawnTimberSpreadsheet, SawnTallyRow } from "@/components/timber/sawn-timber-spreadsheet";

interface ReceiveLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  partaiId?: string;
  onSuccess?: () => void;
}

export function ReceiveLogModal({
  isOpen,
  onClose,
  purchase,
  partaiId,
  onSuccess,
}: ReceiveLogModalProps) {
  const { toast } = useToast();
  const [lengthUnit, setLengthUnit] = useState<"m" | "cm" | "mm">("m");
  const [receivingDate, setReceivingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [logRows, setLogRows] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const logFileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningLog, setIsScanningLog] = useState(false);

  const handleScanLogImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningLog(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workflowType", "RAW_LOG");

      const res = await api.post("/api/ai/parse-tally", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extractedItems = res.data?.items || [];
      if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
        toast({
          title: "Scan AI Selesai",
          description: "Tidak ditemukan baris tabel log kayu pada foto tersebut. Pastikan foto jelas.",
          variant: "destructive",
        });
        return;
      }

      setLogRows((prev) => {
        const newRows = extractedItems.map((it: any, idx: number) => {
          const l = Number(it.length || 0);
          const d1 = Number(it.d1 || 0);
          const d2 = Number(it.d2 || 0);
          const avg = it.rt ? Number(it.rt) : ((d1 + d2) / (d1 && d2 ? 2 : 1));
          return {
            purchaseLogItemId: undefined,
            logNumber: it.logNumber || `LOG-SCAN-${prev.length + idx + 1}`,
            species: it.species || "MERBAU",
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
        return [...prev, ...newRows];
      });

      toast({
        title: "Scan AI Berhasil!",
        description: `${extractedItems.length} baris kayu bulat berhasil dibaca dari foto.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Scan AI",
        description: err?.response?.data?.message || err?.message || "Terjadi error saat membaca gambar",
        variant: "destructive",
      });
    } finally {
      setIsScanningLog(false);
      if (logFileInputRef.current) logFileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("erp_length_unit_pref");
    if (saved === "m" || saved === "cm" || saved === "mm") {
      setLengthUnit(saved);
    }
    // Fetch master species for quick select in sawn timber row
    MasterDataAPI.getSpecies()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setSpeciesList(list);
      })
      .catch((err: any) => console.warn("Failed to load species for receive modal:", err));
  }, []);

  const handleUnitChange = (unit: "m" | "cm" | "mm") => {
    setLengthUnit(unit);
    localStorage.setItem("erp_length_unit_pref", unit);
  };

  // Populate rows whenever purchase changes
  useEffect(() => {
    if (!purchase) {
      setLogRows([]);
      setSawnRows([]);
      return;
    }

    if (purchase.receivingDate) {
      try {
        setReceivingDate(new Date(purchase.receivingDate).toISOString().split("T")[0]);
      } catch (e) {
        setReceivingDate(new Date().toISOString().split("T")[0]);
      }
    } else {
      setReceivingDate(new Date().toISOString().split("T")[0]);
    }

    // 1. Raw Logs
    if (purchase.logItems && purchase.logItems.length > 0) {
      const rows = purchase.logItems.map((li: any, idx: number) => ({
        selected: true,
        isAlreadyReceived: li.status === "RECEIVED",
        purchaseLogItemId: li.id,
        logNumber: li.logNumber || `LOG-${purchase.purchaseNumber || "PUR"}-${idx + 1}`,
        species: li.species || "-",
        speciesId: li.speciesId || null,
        length: li.purchaseLength || li.length || "",
        d1: li.purchaseDiameter1 || li.diameter1 || "",
        d2: li.purchaseDiameter2 || li.diameter2 || "",
        d3: li.purchaseDiameter3 || li.diameter3 || "",
        d4: li.purchaseDiameter4 || li.diameter4 || "",
        avgDia: "",
        gerowong: "",
        locationId: purchase.warehouseId || undefined,
      }));
      setLogRows(rows);
    } else {
      setLogRows([]);
    }

    // 2. Sawn Timber
    if (purchase.items && purchase.items.length > 0) {
      const rows = purchase.items.map((it: any) => {
        let t = Number(it.purchaseThickness || it.timberVariant?.thickness || 0);
        let w = Number(it.purchaseWidth || it.timberVariant?.width || 0);
        let l = Number(it.purchaseLength || it.timberVariant?.length || 0);
        // If stored in mm (> 50 for thickness, > 100 for width), convert to cm for consistent display in cm
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
          species: it.timberVariant?.species || it.timberVariant?.timberSpecies?.name || it.species || "Sawn Timber",
          grade: it.timberVariant?.grade || it.grade || "A",
          productType: it.productType || it.timberVariant?.productType || "BALOK",
          thickness: tCm || "",
          width: wCm || "",
          length: lCm || "",
          orderedPcs: pcs,
          orderedVolM3: vol,
          receivedPcs: pcs || "",
          volumeM3: vol,
          selected: purchase.status !== "RECEIVED",
          isAlreadyReceived: purchase.status === "RECEIVED",
          isCustomRow: false,
        };
      });
      setSawnRows(rows);
    } else {
      setSawnRows([]);
    }
  }, [purchase]);

  const handleRowChange = (index: number, field: string, value: any) => {
    setLogRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSawnRowChange = (index: number, field: string, value: any) => {
    setSawnRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      if (
        field === "thickness" ||
        field === "width" ||
        field === "length" ||
        field === "receivedPcs"
      ) {
        const t = parseFloat(row.thickness) || 0;
        const w = parseFloat(row.width) || 0;
        const l = parseFloat(row.length) || 0;
        const pcs = parseFloat(row.receivedPcs) || 0;
        if (t > 0 && w > 0 && l > 0 && pcs > 0) {
          // Both cm (divisor 1.000.000) or mm (divisor 1.000.000.000)
          const isMm = t > 50 || w > 100 || l > 1000;
          row.volumeM3 = Number(
            (isMm
              ? (((t * w * l) / 1000000000) * pcs)
              : (((t * w * l) / 1000000) * pcs)
            ).toFixed(4)
          );
        } else {
          row.volumeM3 = 0;
        }
      }
      updated[index] = row;
      return updated;
    });
  };

  const handleAddSawnRow = () => {
    const defaultSpecies = speciesList[0]?.name || "Meranti";
    const newRow = {
      id: undefined,
      timberVariantId: undefined,
      sku: "MANUAL-INPUT",
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
      isCustomRow: true,
    };
    setSawnRows((prev) => [...prev, newRow]);
  };

  const handleDeleteSawnRow = (index: number) => {
    setSawnRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const calculateRow = (row: any) => {
    let lRaw = parseFloat(row.length) || 0;
    let l = lRaw;
    if (lengthUnit === "cm") l = lRaw / 100;
    if (lengthUnit === "mm") l = lRaw / 1000;

    const d1 = parseFloat(row.d1) || 0;
    const d2 = parseFloat(row.d2) || 0;
    const d3 = parseFloat(row.d3) || 0;
    const d4 = parseFloat(row.d4) || 0;
    const manualAvg = parseFloat(row.avgDia) || 0;
    const g = parseFloat(row.gerowong) || 0;

    let avgDiaStrict = 0;
    if (d1 > 0 || d2 > 0 || d3 > 0 || d4 > 0) {
      avgDiaStrict = (d1 + d2 + d3 + d4) / 4;
    } else {
      avgDiaStrict = manualAvg;
    }
    const rndDia = Math.round(avgDiaStrict);

    const grossVol = l > 0 && rndDia > 0 ? (Math.pow(rndDia, 2) * l * 0.7854) / 10000 : 0;
    const gerowongVol = l > 0 && g > 0 ? (Math.pow(g, 2) * l * 0.7854) / 10000 : 0;
    const netVol = grossVol - gerowongVol;

    return {
      meterLength: l,
      avg: avgDiaStrict,
      gross: grossVol,
      net: netVol < 0 ? 0 : netVol,
    };
  };

  const hasLogItems = logRows.length > 0;
  const hasSawnItems = sawnRows.length > 0;

  const handleSaveLogs = async () => {
    const toSave = logRows.filter(
      (r) => r.selected && r.length && (r.avgDia || (r.d1 && r.d2 && r.d3 && r.d4))
    );

    if (toSave.length === 0) {
      toast({
        title: "Data belum lengkap",
        description: "Pilih dan isi data dimensi minimal pada satu log (Panjang, serta D1-D4 atau Rata-rata).",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const targetIsoDate = receivingDate ? new Date(receivingDate).toISOString() : new Date().toISOString();
      const payload = toSave.map((r) => {
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
          partaiId: partaiId || purchase?.partaiId,
          locationId: r.locationId || purchase?.warehouseId,
          date: targetIsoDate,
          receivingDate: targetIsoDate,
        };
      });

      await TimberAPI.createBulkLogs({ items: payload });

      if (purchase?.id) {
        try {
          await PurchaseAPI.receivePurchase(purchase.id, {
            partaiId: partaiId || purchase?.partaiId,
            receivingDate: targetIsoDate,
          });
        } catch (recErr) {
          console.warn("PurchaseAPI.receivePurchase status sync:", recErr);
        }
      }

      toast({
        title: "Berhasil Diterima!",
        description: `${payload.length} log berhasil diverifikasi dan dicatat ke DUKB (Raw Log Stock).`,
      });

      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({
        title: "Gagal Menyimpan DUKB",
        description: e.response?.data?.message || e.message || "Terjadi kesalahan saat memproses",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Sawn Timber directly
  const handleSaveSawn = async () => {
    if (!purchase?.id) return;
    const toSave = sawnRows.filter((r) => r.selected && !r.isAlreadyReceived);
    if (toSave.length === 0) {
      toast({
        title: "Data belum dipilih",
        description: "Pilih minimal satu item sawn timber yang akan diterima.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const targetIsoDate = receivingDate ? new Date(receivingDate).toISOString() : new Date().toISOString();
      const payload = toSave.map((r) => ({
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

      await PurchaseAPI.receivePurchase(purchase.id, {
        partaiId: partaiId || purchase?.partaiId,
        receivingDate: targetIsoDate,
        items: payload,
      });

      toast({
        title: "Berhasil Diterima!",
        description: `${payload.length} item kayu olahan (Sawn Timber) berhasil diverifikasi dan masuk ke output stok jadi.`,
      });
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({
        title: "Gagal Menerima",
        description: e.response?.data?.message || e.message || "Gagal memproses penerimaan sawn timber",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Both if both are present
  const handleSaveAll = async () => {
    if (hasLogItems && hasSawnItems) {
      const logsToSave = logRows.filter(
        (r) => r.selected && r.length && (r.avgDia || (r.d1 && r.d2 && r.d3 && r.d4))
      );
      const sawnToSave = sawnRows.filter((r) => r.selected);

      if (logsToSave.length === 0 && sawnToSave.length === 0) {
        toast({
          title: "Pilih item untuk diterima",
          description: "Tidak ada log atau sawn timber yang dipilih untuk diproses.",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);
      try {
        const targetIsoDate = receivingDate ? new Date(receivingDate).toISOString() : new Date().toISOString();
        if (logsToSave.length > 0) {
          const logPayload = logsToSave.map((r) => {
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
              partaiId: partaiId || purchase?.partaiId,
              locationId: r.locationId || purchase?.warehouseId,
              date: targetIsoDate,
              receivingDate: targetIsoDate,
            };
          });
          await TimberAPI.createBulkLogs({ items: logPayload });
        }

        if (sawnToSave.length > 0) {
          const sawnPayload = sawnToSave.map((r) => ({
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
          await PurchaseAPI.receivePurchase(purchase.id, {
            partaiId: partaiId || purchase?.partaiId,
            receivingDate: targetIsoDate,
            items: sawnPayload,
          });
        } else if (purchase?.id) {
          await PurchaseAPI.receivePurchase(purchase.id, {
            partaiId: partaiId || purchase?.partaiId,
            receivingDate: targetIsoDate,
          });
        }

        toast({
          title: "Berhasil Diterima!",
          description: "Semua item terpilih berhasil diverifikasi dan dicatat ke inventaris.",
        });
        onSuccess?.();
        onClose();
      } catch (e: any) {
        toast({
          title: "Gagal Menerima",
          description: e.response?.data?.message || e.message || "Gagal memproses penerimaan",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else if (hasLogItems) {
      await handleSaveLogs();
    } else {
      await handleSaveSawn();
    }
  };

  const totalNetLive = logRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + calculateRow(r).net, 0);

  const totalSawnPcs = sawnRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.receivedPcs) || 0), 0);

  const totalOrderedSawnPcs = sawnRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.orderedPcs) || 0), 0);

  const totalSawnVol = sawnRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.volumeM3) || 0), 0);

  const totalOrderedSawnVol = sawnRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + (Number(r.orderedVolM3) || 0), 0);

  const sawnRendement = totalOrderedSawnVol > 0
    ? (totalSawnVol / totalOrderedSawnVol) * 100
    : 100;

  const sawnVolDelta = totalSawnVol - totalOrderedSawnVol;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <DialogTitle className="text-lg font-bold">
                Penerimaan & Cek Ukur Fisik: {purchase?.purchaseNumber || purchase?.code || "Pembelian"}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium whitespace-nowrap">Tgl Diterima:</span>
                <Input
                  type="date"
                  className="h-8 text-xs w-[135px] font-medium"
                  value={receivingDate}
                  onChange={(e) => setReceivingDate(e.target.value)}
                />
              </div>
              {hasLogItems && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium whitespace-nowrap">Satuan:</span>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                    value={lengthUnit}
                    onChange={(e: any) => handleUnitChange(e.target.value)}
                  >
                    <option value="m">Meter (m)</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="mm">Millimeter (mm)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Silakan cek ulang fisik kayu yang dikirim, sesuaikan nomor log dan ukurannya (Panjang, D1-D4, Gerowong) untuk memastikan volume aktual sebelum dicatat ke inventaris.
          </DialogDescription>
        </DialogHeader>

        {/* 1. RAW LOGS SECTION */}
        {hasLogItems && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-foreground">Daftar Kayu Bulat (Raw Log / DUKB)</span>
                <Badge variant="outline" className="text-xs">
                  {logRows.filter((r) => r.selected && !r.isAlreadyReceived).length} dari {logRows.length} terpilih
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={logFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanLogImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isScanningLog}
                  onClick={() => logFileInputRef.current?.click()}
                  className="h-7 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold"
                  title="Foto lembar DUKB atau upload gambar untuk diisi otomatis oleh AI"
                >
                  {isScanningLog ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Membaca Foto...
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 mr-1" /> Scan Foto DUKB (AI)
                    </>
                  )}
                </Button>
                <div className="text-muted-foreground">
                  Total Net Volume:{" "}
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {totalNetLive.toFixed(4)} m³
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={
                          logRows.length > 0 &&
                          logRows.filter((r) => !r.isAlreadyReceived).every((r) => r.selected)
                        }
                        onCheckedChange={(checked) => {
                          setLogRows((prev) =>
                            prev.map((r) => (r.isAlreadyReceived ? r : { ...r, selected: !!checked }))
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">No. Log</TableHead>
                    <TableHead className="w-[100px]">Spesies</TableHead>
                    <TableHead className="w-[75px]">P ({lengthUnit})</TableHead>
                    <TableHead className="w-[70px]">D1 (cm)</TableHead>
                    <TableHead className="w-[70px]">D2 (cm)</TableHead>
                    <TableHead className="w-[70px]">D3 (cm)</TableHead>
                    <TableHead className="w-[70px]">D4 (cm)</TableHead>
                    <TableHead className="w-[70px]">Grw (cm)</TableHead>
                    <TableHead className="w-[70px] text-right">Avg (cm)</TableHead>
                    <TableHead className="w-[80px] text-right">Gross (m³)</TableHead>
                    <TableHead className="w-[80px] text-right text-blue-600 dark:text-blue-400 font-bold">
                      Net (m³)
                    </TableHead>
                    <TableHead className="w-[90px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logRows.map((r, idx) => {
                    const calc = calculateRow(r);
                    return (
                      <TableRow
                        key={idx}
                        className={r.isAlreadyReceived ? "bg-muted/20 opacity-60" : "hover:bg-muted/30"}
                      >
                        <TableCell className="text-center p-2">
                          <Checkbox
                            checked={r.selected}
                            onCheckedChange={(val) => handleRowChange(idx, "selected", !!val)}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 text-xs font-semibold"
                            value={r.logNumber}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "logNumber", e.target.value)}
                            placeholder="No Log"
                          />
                        </TableCell>
                        <TableCell className="p-1 font-medium">{r.species}</TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-xs"
                            value={r.length}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "length", e.target.value)}
                            placeholder="Panjang"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={r.d1}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "d1", e.target.value)}
                            placeholder="D1"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={r.d2}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "d2", e.target.value)}
                            placeholder="D2"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={r.d3}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "d3", e.target.value)}
                            placeholder="D3"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={r.d4}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "d4", e.target.value)}
                            placeholder="D4"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={r.gerowong}
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "gerowong", e.target.value)}
                            placeholder="Grw"
                          />
                        </TableCell>
                        <TableCell className="p-1 bg-muted/20 border-l">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs text-right font-semibold bg-background"
                            value={
                              r.avgDia !== undefined && r.avgDia !== ""
                                ? r.avgDia
                                : calc.avg > 0
                                ? calc.avg.toFixed(1)
                                : ""
                            }
                            disabled={!r.selected}
                            onChange={(e) => handleRowChange(idx, "avgDia", e.target.value)}
                            placeholder={calc.avg > 0 ? calc.avg.toFixed(1) : "-"}
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right bg-muted/20 text-muted-foreground font-mono">
                          {calc.gross > 0 ? calc.gross.toFixed(4) : "-"}
                        </TableCell>
                        <TableCell className="p-2 text-right bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold font-mono">
                          {calc.net > 0 ? calc.net.toFixed(4) : "-"}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          {r.isAlreadyReceived ? (
                            <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">
                              Diterima
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* 2. SAWN TIMBER SECTION */}
        {hasSawnItems && (
          <div className="space-y-4 py-2 border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="flex items-center gap-2 flex-wrap">
                <PackageCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-foreground">Kayu Olahan (Sawn Timber) Fisik</span>
                <Badge variant="outline" className="text-xs">
                  {sawnRows.filter((r) => r.selected && !r.isAlreadyReceived).length} dari {sawnRows.length} terpilih
                </Badge>
                {totalOrderedSawnVol > 0 && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                      sawnRendement >= 98
                        ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                        : sawnRendement >= 90
                        ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40"
                        : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 mr-1 inline" />
                    Rendemen: {sawnRendement.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span>
                  Vol PO:{" "}
                  <strong className="text-muted-foreground font-mono">
                    {totalOrderedSawnVol.toFixed(4)} m³
                  </strong>
                </span>
                <span>
                  Vol Diterima:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {totalSawnVol.toFixed(4)} m³
                  </strong>
                </span>
                <span>
                  Selisih:{" "}
                  <strong
                    className={`font-mono font-semibold ${
                      sawnVolDelta >= 0 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {sawnVolDelta >= 0 ? `+${sawnVolDelta.toFixed(4)}` : sawnVolDelta.toFixed(4)} m³
                  </strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-background hover:bg-emerald-50 hover:text-emerald-600 border-dashed"
                  onClick={handleAddSawnRow}
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Tambah Baris Kayu
                </Button>
              </div>
            </div>

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
                    selected: pcsNum > 0 && (tNum > 0 || wNum > 0 || lNum > 0),
                    isAlreadyReceived: false,
                    isCustomRow: !r.id,
                  };
                });
                setSawnRows(mapped);
              }}
            />
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            {hasLogItems && (
              <span>
                Total Net Log:{" "}
                <strong className="text-blue-600 dark:text-blue-400 text-sm">
                  {totalNetLive.toFixed(4)} m³
                </strong>
              </span>
            )}
            {hasSawnItems && (
              <span>
                Total Sawn:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                  {totalSawnVol.toFixed(4)} m³ ({totalSawnPcs} Pcs)
                </strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleSaveAll}
              disabled={
                isSaving ||
                (hasLogItems && logRows.filter((r) => r.selected && !r.isAlreadyReceived).length === 0 &&
                 hasSawnItems && sawnRows.filter((r) => r.selected && !r.isAlreadyReceived).length === 0)
              }
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {isSaving
                ? "Memproses..."
                : hasLogItems && hasSawnItems
                ? "Konfirmasi Terima Semua"
                : hasLogItems
                ? "Simpan DUKB & Terima Log"
                : "Konfirmasi Terima Sawn Timber"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
