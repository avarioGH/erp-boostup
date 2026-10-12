"use client";

import React, { useState, useEffect } from "react";
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
import { TimberAPI, PurchaseAPI } from "@/lib/api";
import { CheckCircle2, Ruler, PackageCheck } from "lucide-react";

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
  const [logRows, setLogRows] = useState<any[]>([]);
  const [sawnRows, setSawnRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("erp_length_unit_pref");
    if (saved === "m" || saved === "cm" || saved === "mm") {
      setLengthUnit(saved);
    }
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

    // 1. Raw Logs
    if (purchase.logItems && purchase.logItems.length > 0) {
      const rows = purchase.logItems.map((li: any, idx: number) => ({
        selected: li.status !== "RECEIVED",
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
      const rows = purchase.items.map((it: any) => ({
        id: it.id,
        timberVariantId: it.timberVariantId,
        sku: it.timberVariant?.sku || it.sku || "-",
        species: it.timberVariant?.species || it.timberVariant?.timberSpecies?.name || it.species || "Sawn Timber",
        thickness: it.purchaseThickness || it.timberVariant?.thickness || 0,
        width: it.purchaseWidth || it.timberVariant?.width || 0,
        length: it.purchaseLength || it.timberVariant?.length || 0,
        orderedPcs: it.quantityPcs || 0,
        receivedPcs: it.quantityPcs || 0,
        volumeM3: it.volumeM3 || 0,
      }));
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

  // Save Raw Logs to DUKB
  const handleSaveLogs = async () => {
    const toSave = logRows.filter(
      (r) => r.selected && !r.isAlreadyReceived && r.length && (r.avgDia || (r.d1 && r.d2 && r.d3 && r.d4))
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
          date: new Date().toISOString(),
        };
      });

      await TimberAPI.createBulkLogs({ items: payload });
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
    setIsSaving(true);
    try {
      await PurchaseAPI.receivePurchase(purchase.id);
      toast({
        title: "Berhasil Diterima!",
        description: "Kayu olahan (Sawn Timber) berhasil masuk ke stok gudang.",
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

  const totalNetLive = logRows
    .filter((r) => r.selected && !r.isAlreadyReceived)
    .reduce((sum, r) => sum + calculateRow(r).net, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <DialogTitle className="text-lg font-bold">
                Penerimaan & Cek Ukur Fisik: {purchase?.purchaseNumber || purchase?.code || "Pembelian"}
              </DialogTitle>
            </div>
            {hasLogItems && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">Satuan Panjang:</span>
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
              <div className="text-muted-foreground">
                Total Net Volume:{" "}
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  {totalNetLive.toFixed(4)} m³
                </span>
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
                            disabled={r.isAlreadyReceived}
                            onCheckedChange={(val) => handleRowChange(idx, "selected", !!val)}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 text-xs font-semibold"
                            value={r.logNumber}
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
                            disabled={r.isAlreadyReceived}
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
            <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border">
              <span className="font-semibold text-foreground">Kayu Olahan (Sawn Timber)</span>
              <span className="text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {sawnRows.reduce((sum, r) => sum + Number(r.orderedPcs || 0), 0)} Pcs
                </span>{" "}
                |{" "}
                <span className="font-semibold text-foreground">
                  {sawnRows.reduce((sum, r) => sum + Number(r.volumeM3 || 0), 0).toFixed(4)} m³
                </span>
              </span>
            </div>

            <Table className="text-xs border rounded-lg">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>SKU / Dimensi</TableHead>
                  <TableHead>Spesies</TableHead>
                  <TableHead className="text-right">Qty (Pcs)</TableHead>
                  <TableHead className="text-right">Volume (m³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sawnRows.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-primary">{it.sku}</TableCell>
                    <TableCell>{it.species}</TableCell>
                    <TableCell className="text-right font-semibold">{it.orderedPcs} Pcs</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(it.volumeM3 || 0).toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {hasLogItems && (
              <span>
                Total Net:{" "}
                <strong className="text-blue-600 dark:text-blue-400 text-sm">
                  {totalNetLive.toFixed(4)} m³
                </strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            {hasLogItems ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleSaveLogs}
                disabled={isSaving || logRows.filter((r) => r.selected && !r.isAlreadyReceived).length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isSaving ? "Menyimpan..." : "Simpan DUKB & Terima Log"}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleSaveSawn}
                disabled={isSaving}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isSaving ? "Memproses..." : "Konfirmasi Terima Sawn Timber"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
