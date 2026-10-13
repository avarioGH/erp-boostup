"use client";
import React, { useEffect, useState } from "react";
import { api, PartaiAPI, TimberAPI, PurchaseAPI, MasterDataAPI, InventoryAPI } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Plus, Eye, Edit, Trash2, Scissors, MoreHorizontal, Pencil, Trash, CheckCircle2, Check, X, Loader2, Package, CheckSquare, Square, ChevronDown, ChevronRight, Calendar, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "@/components/ui/table-pagination";
import { ReceiveLogModal } from "@/components/timber/receive-log-modal";

export default function PartaiDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { id } = React.use(params as Promise<{ id: string }>);
  const [partai, setPartai] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState("purchase");

  // Receive inspection modal state
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPurchaseForReceive, setSelectedPurchaseForReceive] = useState<any>(null);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`partai_${id}_active_tab`, tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState(null, "", url.toString());
      } catch (e) {}
    }
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setCurrentTab(tabFromUrl);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`partai_${id}_active_tab`, tabFromUrl);
        } catch (e) {}
      }
    } else if (typeof window !== "undefined") {
      try {
        const savedTab = sessionStorage.getItem(`partai_${id}_active_tab`);
        if (savedTab) {
          setCurrentTab(savedTab);
          const url = new URL(window.location.href);
          url.searchParams.set("tab", savedTab);
          window.history.replaceState(null, "", url.toString());
        }
      } catch (e) {}
    }
  }, [searchParams, id]);

  // -- Pagination & Page Size states --
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePageSize, setPurchasePageSize] = useState(50);

  const [dukbPage, setDukbPage] = useState(1);
  const [dukbPageSize, setDukbPageSize] = useState(50);

  const [trimmingPage, setTrimmingPage] = useState(1);
  const [trimmingPageSize, setTrimmingPageSize] = useState(50);

  const [inputPage, setInputPage] = useState(1);
  const [inputPageSize, setInputPageSize] = useState(50);

  const [outputPage, setOutputPage] = useState(1);
  const [outputPageSize, setOutputPageSize] = useState(50);
  
  // DUKB selection & bulk trimming state
  const [selectedDukbLogIds, setSelectedDukbLogIds] = useState<string[]>([]);
  const [isBulkTrimming, setIsBulkTrimming] = useState(false);
  
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedOutputItems, setSelectedOutputItems] = useState<{id: string, outputId: string}[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedTrimmedLogIds, setSelectedTrimmedLogIds] = useState<string[]>([]);
  
  // Tally Modal State for Tab 4 WIP
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);
  const [targetInputLogForTally, setTargetInputLogForTally] = useState<any>(null);
  const [tallyDate, setTallyDate] = useState(new Date().toISOString().split('T')[0]);
  const [tallyWarehouseId, setTallyWarehouseId] = useState("");
  const [tallyLines, setTallyLines] = useState<any[]>([
    { t: "", l: "", p: "", pcs: "", productType: "BALOK" }
  ]);
  const [isSavingTally, setIsSavingTally] = useState(false);
  const [expandedInputLogIds, setExpandedInputLogIds] = useState<string[]>([]);
  const toggleExpandInputLog = (logId: string) => {
    setExpandedInputLogIds(prev => 
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  useEffect(() => {
    MasterDataAPI.getGrades().then((res: any) => setGrades(res.data || res)).catch(() => {});
    InventoryAPI.getWarehouses().then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setWarehouses(list);
      if (list.length > 0) setTallyWarehouseId(list[0].id);
    }).catch(() => {});
  }, []);

  const openTallyModalWithSelection = (specificLogIds?: string[], existingInputLog?: any) => {
    const logsToUse = specificLogIds || selectedTrimmedLogIds;
    if (!existingInputLog && (!logsToUse || logsToUse.length === 0)) {
      toast({ 
        title: "Pilih Log Terlebih Dahulu", 
        description: "Silakan centang log hasil trimming yang ingin diproses.", 
        variant: "destructive" 
      });
      return;
    }
    setTargetInputLogForTally(existingInputLog || null);
    if (!existingInputLog && logsToUse) {
      setSelectedTrimmedLogIds(logsToUse);
    }
    setTallyDate(new Date().toISOString().split('T')[0]);
    if (!tallyWarehouseId && warehouses.length > 0) {
      setTallyWarehouseId(warehouses[0].id);
    }
    setTallyLines([{ t: "", l: "", p: "", pcs: "", productType: "BALOK" }]);
    setIsTallyModalOpen(true);
  };

  const handleSaveWipTally = async () => {
    const validLines = tallyLines.filter(l => 
      parseFloat(l.t) > 0 && parseFloat(l.l) > 0 && parseFloat(l.p) > 0 && parseInt(l.pcs) > 0
    );

    if (validLines.length === 0) {
      toast({ 
        title: "Ukuran Belum Lengkap", 
        description: "Isi minimal 1 baris ukuran (T, L, P, dan PCS harus lebih dari 0).", 
        variant: "destructive" 
      });
      return;
    }

    let whId = tallyWarehouseId || partai?.warehouseId || partai?.warehouse?.id;
    if (!whId && warehouses.length > 0) whId = warehouses[0].id;
    if (!whId) {
      toast({ title: "Gudang Belum Tersedia", description: "Pilih gudang tujuan output terlebih dahulu.", variant: "destructive" });
      return;
    }

    setIsSavingTally(true);
    try {
      let inputLogId = targetInputLogForTally?.id;

      // If no existing inputLog, create one from selected trimmed logs first
      if (!inputLogId) {
        if (!selectedTrimmedLogIds || selectedTrimmedLogIds.length === 0) {
          throw new Error("Tidak ada log trimming yang dipilih");
        }
        const createdInputLog = await TimberAPI.createInputLog({
          trimmedLogIds: selectedTrimmedLogIds,
          locationId: whId,
          partaiId: id,
          date: tallyDate,
        });
        inputLogId = createdInputLog.id;
      }

      // Create Sawn Timber Output (Daily Tally)
      const payload = {
        inputLogId: inputLogId,
        partaiId: id,
        outputDate: tallyDate,
        locationId: whId,
        items: validLines.map(line => ({
          thickness: parseFloat(line.t) * 10, // cm to mm
          width: parseFloat(line.l) * 10,     // cm to mm
          length: parseFloat(line.p) * 10,    // cm to mm
          quantityPcs: parseInt(line.pcs),
          grade: "PENDING",
          productType: line.productType || "BALOK"
        }))
      };

      const res = await api.post('/inventory/sawn-timber/output', payload);
      // Auto-post the tally so it directly enters output stock
      await api.post(`/inventory/sawn-timber/output/${res.data.id}/post`);

      toast({ 
        title: "Tally Berhasil Disimpan!", 
        description: `Hasil tally ${validLines.length} ukuran berhasil dicatat ke WIP dan diposting ke output.` 
      });
      setIsTallyModalOpen(false);
      setSelectedTrimmedLogIds([]);
      setTargetInputLogForTally(null);
      setTallyLines([{ t: "", l: "", p: "", pcs: "", productType: "BALOK" }]);
      fetchPartai();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Gagal Menyimpan Tally", 
        description: err?.response?.data?.error?.message || err?.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSavingTally(false);
    }
  };
  
  const handleBulkGrade = async () => {
    if (!selectedGradeId) {
       toast({ title: "Pilih Grade", description: "Silakan pilih grade terlebih dahulu", variant: "destructive" });
       return;
    }
    const gradeObj = grades.find(g => g.id === selectedGradeId);
    setIsGrading(true);
    let success = 0;
    for (const item of selectedOutputItems) {
       try {
         await api.patch(`/inventory/sawn-timber/output/${item.outputId}/items/${item.id}/grade`, {
           gradeId: gradeObj.id,
           grade: gradeObj.code || gradeObj.name || 'STANDARD',
         });
         success++;
       } catch (e: any) {
         console.error(e);
         const msg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Gagal update grade';
         toast({ title: 'Gagal', description: msg, variant: 'destructive' });
       }
    }
    setIsGrading(false);
    if (success > 0) {
      toast({ title: "Selesai", description: `Berhasil mengupdate ${success} item.` });
    }
    setSelectedOutputItems([]);
    fetchPartai();
  };

  const [isPostingOutputs, setIsPostingOutputs] = useState(false);
  const handlePostOutputs = async () => {
    const draftOutputs = (partai?.sawnOutputs || []).filter((o: any) => o.status === 'DRAFT');
    const outputsToPost = selectedOutputItems.length > 0
      ? Array.from(new Set(selectedOutputItems.map(i => i.outputId))).filter(oid => {
          const out = (partai?.sawnOutputs || []).find((o: any) => o.id === oid);
          return out?.status === 'DRAFT';
        })
      : draftOutputs.map((o: any) => o.id);

    if (outputsToPost.length === 0) {
      toast({ title: "Info", description: "Tidak ada output berstatus DRAFT untuk di-posting ke stok." });
      return;
    }

    setIsPostingOutputs(true);
    let success = 0;
    for (const outputId of outputsToPost) {
      try {
        await api.post(`/inventory/sawn-timber/output/${outputId}/post`);
        success++;
      } catch (err: any) {
        console.error(err);
        const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Gagal posting output';
        toast({ title: 'Gagal', description: msg, variant: 'destructive' });
      }
    }
    setIsPostingOutputs(false);
    if (success > 0) {
      toast({ title: "Berhasil", description: `${success} output berhasil di-posting ke Stok!` });
    }
    setSelectedOutputItems([]);
    fetchPartai();
  };
  
  const toggleSelectOutputItem = (id: string, outputId: string) => {
    const exists = selectedOutputItems.find(x => x.id === id);
    if (exists) {
      setSelectedOutputItems(selectedOutputItems.filter(x => x.id !== id));
    } else {
      setSelectedOutputItems([...selectedOutputItems, {id, outputId}]);
    }
  };
  
  const toggleSelectAllOutputItems = (allItems: any[]) => {
    if (selectedOutputItems.length === allItems.length) {
       setSelectedOutputItems([]);
    } else {
        setSelectedOutputItems(allItems.map(i => ({ id: i.id, outputId: i.parentOutputId })));
     }
  };

  const fetchPartai = () => {
    if (id) {
      PartaiAPI.getPartai(id).then((res: any) => {
        setPartai(res);
      }).catch(console.error);
    }
  };

  useEffect(() => {
    fetchPartai();
  }, [id]);

  
  
  const handleOpenReceiveModal = (purchaseId: string, rawPurchase?: any) => {
    const p = rawPurchase || (partai?.purchases || []).find((x: any) => x.id === purchaseId);
    if (p) {
      setSelectedPurchaseForReceive(p);
      setReceiveModalOpen(true);
    } else {
      handleReceivePurchase(purchaseId);
    }
  };

  const handleReceivePurchase = async (purchaseId: string) => {
    try {
      await PurchaseAPI.receivePurchase(purchaseId);
      toast({ title: "Berhasil", description: "Pembelian berhasil diterima! Stok kayu telah masuk ke inventaris gudang." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to receive", variant: "destructive" });
    }
  };

  const handleConfirmPurchase = async (purchaseId: string) => {
    try {
      await PurchaseAPI.confirmPurchase(purchaseId);
      toast({ title: "Success", description: "Purchase confirmed." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to confirm", variant: "destructive" });
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await PurchaseAPI.deletePurchase(purchaseId);
      toast({ title: "Success", description: "Purchase deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

      const handleDirectTrim = async (log: any) => {
    if (!confirm(`Buat hasil trimming penuh (100% full) untuk log ${log.logNumber} tanpa pemotongan?`)) return;
    try {
      await api.post(`/inventory/logs/${log.id}/trimming`, {
        length: log.originalLength,
        diameter1: log.diameter1 || 0,
        diameter2: log.diameter2 || 0,
        diameter3: log.diameter3 || 0,
        diameter4: log.diameter4 || 0,
        averageDiameter: log.averageDiameter || 0,
        gerowong: log.gerowong || 0,
        trimmingLength: 0
      });
      toast({ title: "Success", description: "Log berhasil di-trim penuh." });
      fetchPartai();
    } catch (e: any) {
      console.error(e);
      const rawData = e?.response?.data;
      const msg = rawData?.error?.message || rawData?.message || e.message;
      toast({ title: "Gagal Trimming", description: msg, variant: "destructive" });
      alert("Gagal Trimming: " + msg);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      await TimberAPI.deleteLog(logId);
      toast({ title: "Success", description: "Log deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteTrim = async (trimId: string) => {
    if (!confirm("Are you sure you want to delete this trim record?")) return;
    try {
      await TimberAPI.deleteTrimmingLog(trimId);
      toast({ title: "Success", description: "Trim deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteInput = async (inputId: string) => {
    if (!confirm("Are you sure you want to delete this input log?")) return;
    try {
      await TimberAPI.deleteInputLog(inputId);
      toast({ title: "Success", description: "Input log deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    if (!confirm("Are you sure you want to delete this output?")) return;
    try {
      await TimberAPI.cancelSawnOutput(outputId);
      toast({ title: "Success", description: "Output deleted/cancelled." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  // 1. Flatten Purchases: Each log / sawn timber item has its own row ("di jejerkan langsung 2 log")
  const flattenedPurchases = React.useMemo(() => {
    if (!partai?.purchases) return [];
    const list: any[] = [];

    partai.purchases.forEach((p: any) => {
      const pDate = p.purchaseDate || p.createdAt;
      const pStatus = p.status || "DRAFT";
      const docNum = p.purchaseNumber || p.code || "PO";

      let hasItems = false;

      // Raw Log items
      if (p.logItems && p.logItems.length > 0) {
        hasItems = true;
        p.logItems.forEach((li: any, idx: number) => {
          const itemReceivingDate = li.receivingDate || p.receivingDate || (li.status === 'RECEIVED' ? (p.receivingDate || li.updatedAt || p.updatedAt) : null);
          list.push({
            id: li.id || `${p.id}-log-${idx}`,
            purchaseId: p.id,
            purchaseNumber: docNum,
            purchaseDate: pDate,
            receivingDate: itemReceivingDate,
            createdAt: li.createdAt || p.createdAt,
            itemType: "RAW_LOG",
            itemCode: li.logNumber || `Log #${idx + 1}`,
            species: li.species || "Log",
            dimensions: li.purchaseLength
              ? `${li.purchaseLength}m (D: ${li.purchaseDiameter1 || li.purchaseDiameter2 || "-"}cm)`
              : "-",
            quantityStr: "1 Log",
            volume: Number(li.purchaseVolume || 0),
            status: li.status === "RECEIVED" ? "RECEIVED" : pStatus,
            purchaseStatus: pStatus,
            source: p.source?.name ? `${p.source.name}${p.source.code ? ` (${p.source.code})` : ""}` : (p.source?.code || p.sourceId || "-"),
            rawPurchase: p,
          });
        });
      }

      // Sawn Timber items
      if (p.items && p.items.length > 0) {
        hasItems = true;
        p.items.forEach((it: any, idx: number) => {
          const t = it.purchaseThickness || it.timberVariant?.thickness || 0;
          const w = it.purchaseWidth || it.timberVariant?.width || 0;
          const l = it.purchaseLength || it.timberVariant?.length || 0;
          const dimStr = t && w && l ? `${t}×${w}×${l} mm` : "-";
          const sku = it.timberVariant?.sku || (dimStr !== "-" ? dimStr : `Item #${idx + 1}`);
          const sp = it.timberVariant?.species || it.timberVariant?.timberSpecies?.name || "Sawn Timber";
          const itemReceivingDate = p.receivingDate || (pStatus === 'RECEIVED' ? (p.receivingDate || it.updatedAt || p.updatedAt) : null);

          list.push({
            id: it.id || `${p.id}-item-${idx}`,
            purchaseId: p.id,
            purchaseNumber: docNum,
            purchaseDate: pDate,
            receivingDate: itemReceivingDate,
            createdAt: it.createdAt || p.createdAt,
            itemType: "SAWN_TIMBER",
            itemCode: sku,
            species: sp,
            dimensions: dimStr,
            quantityStr: `${it.quantityPcs || 0} Pcs`,
            volume: Number(it.volumeM3 || 0),
            status: pStatus,
            purchaseStatus: pStatus,
            source: p.source?.name ? `${p.source.name}${p.source.code ? ` (${p.source.code})` : ""}` : (p.source?.code || p.sourceId || "-"),
            rawPurchase: p,
          });
        });
      }

      // Fallback if purchase has no items yet
      if (!hasItems) {
        list.push({
          id: p.id,
          purchaseId: p.id,
          purchaseNumber: docNum,
          purchaseDate: pDate,
          receivingDate: p.receivingDate || (pStatus === 'RECEIVED' ? p.updatedAt : null),
          createdAt: p.createdAt,
          itemType: "EMPTY",
          itemCode: "-",
          species: "-",
          dimensions: "-",
          quantityStr: "-",
          volume: Number(p.totalVolumeM3 || 0),
          status: pStatus,
          purchaseStatus: pStatus,
          source: p.source?.name ? `${p.source.name}${p.source.code ? ` (${p.source.code})` : ""}` : (p.source?.code || p.sourceId || "-"),
          rawPurchase: p,
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => {
      const timeA = new Date(a.purchaseDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.purchaseDate || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [partai?.purchases]);

  const paginatedPurchases = React.useMemo(() => {
    if (purchasePageSize >= 9999) return flattenedPurchases;
    const start = (purchasePage - 1) * purchasePageSize;
    return flattenedPurchases.slice(start, start + purchasePageSize);
  }, [flattenedPurchases, purchasePage, purchasePageSize]);

  // Trimming mapping: track which raw logs have already been trimmed
  const trimmedLogMap = React.useMemo(() => {
    const map = new Map<string, string>(); // rawLogId -> trimNumber
    (partai?.trimmedLogs || []).forEach((t: any) => {
      if (t.rawLogId) {
        map.set(t.rawLogId, t.trimNumber || "Trimmed");
      }
    });
    (partai?.rawLogs || []).forEach((r: any) => {
      if (r.trimmedLogs && r.trimmedLogs.length > 0) {
        map.set(r.id, r.trimmedLogs[0]?.trimNumber || "Trimmed");
      }
    });
    return map;
  }, [partai?.trimmedLogs, partai?.rawLogs]);

  // 2. DUKB (Raw Logs) sorted newest first
  const sortedRawLogs = React.useMemo(() => {
    return [...(partai?.rawLogs || [])].sort((a: any, b: any) => {
      const timeA = new Date(a.receivingDate || a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.receivingDate || b.date || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.logNumber || "").localeCompare(a.logNumber || "");
    });
  }, [partai?.rawLogs]);

  const untrimmedLogs = React.useMemo(() => {
    return sortedRawLogs.filter((r: any) => r.status !== 'TRIMMED' && !trimmedLogMap.has(r.id));
  }, [sortedRawLogs, trimmedLogMap]);

  const paginatedRawLogs = React.useMemo(() => {
    if (dukbPageSize >= 9999) return sortedRawLogs;
    const start = (dukbPage - 1) * dukbPageSize;
    return sortedRawLogs.slice(start, start + dukbPageSize);
  }, [sortedRawLogs, dukbPage, dukbPageSize]);

  const handleBulkTrim = async (targetIds?: string[]) => {
    const idsToTrim = targetIds || selectedDukbLogIds;
    const finalIds = idsToTrim.filter((id) => !trimmedLogMap.has(id));

    if (finalIds.length === 0) {
      toast({
        title: "Tidak ada log untuk di-trim",
        description: "Semua log yang dipilih sudah berstatus trim.",
        variant: "destructive",
      });
      return;
    }

    const confirmMsg = `Trimming penuh (100% full length) untuk ${finalIds.length} log?\nLog yang di-trim akan otomatis mendapatkan nomor trim dan siap masuk ke Input Sawmill.`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkTrimming(true);
    try {
      const res = await TimberAPI.bulkTrimLogs(finalIds, 0);
      toast({
        title: "Trimming Berhasil!",
        description: `${res?.successCount || finalIds.length} log berhasil di-trim penuh.`,
      });
      setSelectedDukbLogIds([]);
      fetchPartai();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.message || "Gagal melakukan bulk trimming";
      toast({
        title: "Gagal Bulk Trimming",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsBulkTrimming(false);
    }
  };

  // 3. Trimming sorted newest first
  const sortedTrimmedLogs = React.useMemo(() => {
    return [...(partai?.trimmedLogs || [])].sort((a: any, b: any) => {
      const timeA = new Date(a.trimDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.trimDate || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.trimNumber || "").localeCompare(a.trimNumber || "");
    });
  }, [partai?.trimmedLogs]);

  const paginatedTrimmedLogs = React.useMemo(() => {
    if (trimmingPageSize >= 9999) return sortedTrimmedLogs;
    const start = (trimmingPage - 1) * trimmingPageSize;
    return sortedTrimmedLogs.slice(start, start + trimmingPageSize);
  }, [sortedTrimmedLogs, trimmingPage, trimmingPageSize]);

  // 4. Input (WIP) sorted newest first
  const sortedInputLogs = React.useMemo(() => {
    return [...(partai?.inputLogs || [])].sort((a: any, b: any) => {
      const timeA = new Date(a.inputDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.inputDate || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.inputNumber || "").localeCompare(a.inputNumber || "");
    });
  }, [partai?.inputLogs]);

  const paginatedInputLogs = React.useMemo(() => {
    if (inputPageSize >= 9999) return sortedInputLogs;
    const start = (inputPage - 1) * inputPageSize;
    return sortedInputLogs.slice(start, start + inputPageSize);
  }, [sortedInputLogs, inputPage, inputPageSize]);

  // 5. Output (Sawn Timber) sorted newest first
  const allOutputItems = React.useMemo(() => {
    const list = (partai?.sawnOutputs || []).flatMap((o: any) =>
      (o.items || []).map((item: any) => ({
        ...item,
        parentDate: o.outputDate,
        parentInputId: o.inputLogId,
        parentBundleNumber: o.bundleNumber,
        parentOutputId: o.id,
        parentStatus: o.status,
        parentCreatedAt: o.createdAt,
        parentNotes: o.notes,
      }))
    );
    return list.sort((a: any, b: any) => {
      const timeA = new Date(a.parentDate || a.parentCreatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.parentDate || b.parentCreatedAt || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [partai?.sawnOutputs]);

  const paginatedOutputItems = React.useMemo(() => {
    if (outputPageSize >= 9999) return allOutputItems;
    const start = (outputPage - 1) * outputPageSize;
    return allOutputItems.slice(start, start + outputPageSize);
  }, [allOutputItems, outputPage, outputPageSize]);

  if (!partai) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/partai')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Partai: {partai.code}</h1>
            <p className="text-sm text-muted-foreground">{partai.name || "Tanpa Nama"}</p>
          </div>
        </div>
        <Badge variant={partai.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {partai.status}
        </Badge>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-12 mb-6">
          <TabsTrigger value="purchase">1. Purchase</TabsTrigger>
          <TabsTrigger value="rawlogs">2. DUKB (Raw Logs)</TabsTrigger>
          <TabsTrigger value="trimming">3. Trimming</TabsTrigger>
          <TabsTrigger value="input">4. Input (WIP)</TabsTrigger>
          <TabsTrigger value="output">5. Output (Sawn Timber)</TabsTrigger>
          <TabsTrigger value="summary">6. Rekapan</TabsTrigger>
        </TabsList>

        {/* 1. PURCHASE LOGS */}
        <TabsContent value="purchase">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Purchase Log / Sawn Timber</CardTitle>
                <CardDescription>Data pembelian awal bahan baku (log bulat atau sawn timber) untuk partai ini.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => router.push(`/inventory/purchase/create?partaiId=${id}&type=raw-log&tab=purchase`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> + Beli Log Bulat (DUKB)
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/inventory/purchase/create?partaiId=${id}&type=sawn-timber&tab=purchase`)}
                  className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> + Beli Sawn Timber
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pembelian</TableHead>
                    <TableHead>No. Log / SKU</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead>Tgl Dibuat</TableHead>
                    <TableHead>Tgl Diterima</TableHead>
                    <TableHead>Dimensi / Ukuran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead className="text-right">Volume (m³)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPurchases.map((r: any) => (
                    <TableRow 
                      key={r.id} 
                      className="group hover:bg-muted/50 cursor-pointer" 
                      onClick={() => router.push(`/inventory/purchase/${r.purchaseId}?partaiId=${id}&tab=purchase`)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {r.purchaseNumber}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {r.itemCode}
                        </span>
                        {r.itemType === "RAW_LOG" ? (
                          <Badge variant="outline" className="ml-2 text-xs py-0 border-blue-400/60 text-blue-600 dark:text-blue-400">
                            Log
                          </Badge>
                        ) : r.itemType === "SAWN_TIMBER" ? (
                          <Badge variant="outline" className="ml-2 text-xs py-0 border-emerald-400/60 text-emerald-600 dark:text-emerald-400">
                            Sawn
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{r.species || "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.status === 'RECEIVED' ? (
                          r.receivingDate ? (
                            <span className="text-foreground font-medium">
                              {new Date(r.receivingDate).toLocaleDateString("id-ID")}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-xs">
                              Diterima
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground italic">Belum diterima</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.dimensions || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.status === 'CONFIRMED' || r.status === 'RECEIVED'
                              ? 'text-emerald-500 border-emerald-500 bg-emerald-500/10'
                              : r.status === 'CANCELLED'
                              ? 'text-destructive border-destructive/30'
                              : 'text-amber-500 border-amber-500/40 bg-amber-500/10'
                          }
                        >
                          {r.status === 'RECEIVED' ? 'DITERIMA' : (r.status || "DRAFT")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {r.quantityStr}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {Number(r.volume || 0).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {r.purchaseStatus === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              title="Terima Purchase (Cek Ukuran & Masuk DUKB)"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReceiveModal(r.purchaseId, r.rawPurchase);
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terima
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                            title="View" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              router.push(`/inventory/purchase/${r.purchaseId}?partaiId=${id}&tab=purchase`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                            title="Edit" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              router.push(`/inventory/purchase/${r.purchaseId}/edit?partaiId=${id}&tab=purchase`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            title="Delete" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeletePurchase(r.purchaseId);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {flattenedPurchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        Belum ada pembelian untuk partai ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={purchasePage}
                pageSize={purchasePageSize}
                totalItems={flattenedPurchases.length}
                onPageChange={setPurchasePage}
                onPageSizeChange={(newSize) => {
                  setPurchasePageSize(newSize);
                  setPurchasePage(1);
                }}
                itemLabel="item pembelian / log"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DUKB (RAW LOGS) */}
        <TabsContent value="rawlogs">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Data Ukur Kayu Bulat (DUKB)</CardTitle>
                <CardDescription>
                  Daftar log mentah yang telah diterima. Pilih log untuk proses Trimming sebelum masuk mesin gesek Sawmill.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {untrimmedLogs.length > 0 && (
                  <Button 
                    onClick={() => handleBulkTrim(untrimmedLogs.map((l: any) => l.id))}
                    disabled={isBulkTrimming}
                    variant="outline"
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold shadow-sm"
                    title={`Trim Semua (${untrimmedLogs.length}) Log yang Belum Di-trim`}
                  >
                    <Scissors className="w-4 h-4 mr-1.5" />
                    {isBulkTrimming ? "Memproses..." : `Trim Semua (${untrimmedLogs.length} Log)`}
                  </Button>
                )}
                <Button 
                  onClick={() => router.push(`/inventory/purchase/create?partaiId=${id}&type=raw-log&tab=rawlogs`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> + Beli Log Baru (DUKB)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDukbLogIds.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-bold">
                      {selectedDukbLogIds.length} Log Terpilih
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Log siap di-trim penuh (100% full length) dan masuk ke tab Trimming & Input Sawmill.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBulkTrim()}
                      disabled={isBulkTrimming}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs"
                    >
                      <Scissors className="w-3.5 h-3.5 mr-1" />
                      {isBulkTrimming ? "Memproses..." : `Trim Terpilih (${selectedDukbLogIds.length})`}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDukbLogIds([])}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Batal Pilih
                    </Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={
                          paginatedRawLogs.length > 0 &&
                          paginatedRawLogs.filter((r: any) => !trimmedLogMap.has(r.id)).length > 0 &&
                          paginatedRawLogs.filter((r: any) => !trimmedLogMap.has(r.id)).every((r: any) => selectedDukbLogIds.includes(r.id))
                        }
                        onCheckedChange={(checked) => {
                          const untrimmedOnPage = paginatedRawLogs.filter((r: any) => !trimmedLogMap.has(r.id)).map((r: any) => r.id);
                          if (checked) {
                            setSelectedDukbLogIds((prev) => Array.from(new Set([...prev, ...untrimmedOnPage])));
                          } else {
                            setSelectedDukbLogIds((prev) => prev.filter((id) => !untrimmedOnPage.includes(id)));
                          }
                        }}
                        aria-label="Pilih semua log belum trim di halaman ini"
                      />
                    </TableHead>
                    <TableHead>No. Log</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead>Tgl Diterima</TableHead>
                    <TableHead className="text-right">Panjang (m)</TableHead>
                    <TableHead className="text-right">Avg (cm)</TableHead>
                    <TableHead className="text-right">Grw (cm)</TableHead>
                    <TableHead className="text-right">Gross (m³)</TableHead>
                    <TableHead className="text-right">Net (m³)</TableHead>
                    <TableHead className="text-center">Status Trim</TableHead>
                    <TableHead className="text-center w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRawLogs.map((r: any) => {
                    const isTrimmed = r.status === 'TRIMMED' || trimmedLogMap.has(r.id);
                    const trimCode = trimmedLogMap.get(r.id);
                    const isSelected = selectedDukbLogIds.includes(r.id);

                    return (
                      <TableRow 
                        key={r.id} 
                        className={`hover:bg-muted/50 cursor-pointer group ${isSelected ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""}`} 
                        onClick={() => router.push(`/inventory/logs/${r.id}?partaiId=${id}&tab=rawlogs`)}
                      >
                        <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                          {isTrimmed ? (
                            <span title="Log sudah selesai di-trim">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto opacity-70" />
                            </span>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDukbLogIds((prev) => [...prev, r.id]);
                                } else {
                                  setSelectedDukbLogIds((prev) => prev.filter((id) => id !== r.id));
                                }
                              }}
                              aria-label={`Pilih log ${r.logNumber}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{r.logNumber}</TableCell>
                        <TableCell>{r.species}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {r.receivingDate ? new Date(r.receivingDate).toLocaleDateString("id-ID") : (r.date ? new Date(r.date).toLocaleDateString("id-ID") : (r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"))}
                        </TableCell>
                        <TableCell className="text-right">{r.originalLength}</TableCell>
                        <TableCell className="text-right">{Number(r.averageDiameter || 0).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{r.gerowong ? Number(r.gerowong).toFixed(1) : "-"}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{Number(r.grossVolume || 0).toFixed(4)}</TableCell>
                        <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">{Number(r.netVolume || 0).toFixed(4)}</TableCell>
                        <TableCell className="text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isTrimmed ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-xs py-0.5">
                              <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                              Sudah Di-trim {trimCode ? `(${trimCode})` : ""}
                            </Badge>
                          ) : r.status === 'IN_TRIMMING' ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10 text-xs py-0.5">
                              Trim Sebagian
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-400/40 bg-amber-500/10 text-xs py-0.5">
                              Belum Di-trim
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Detail Log" onClick={(e) => { e.stopPropagation(); router.push(`/inventory/logs/${r.id}?partaiId=${id}&tab=rawlogs`); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!isTrimmed ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Tanpa Trimming (Langsung Trim Penuh)" onClick={(e) => { e.stopPropagation(); handleDirectTrim(r); }}>
                                <Scissors className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-40 cursor-not-allowed" title="Log sudah selesai di-trim" disabled>
                                <Scissors className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit / Ukur DUKB" onClick={(e) => { e.stopPropagation(); router.push(`/inventory/logs/${r.id}/edit?partaiId=${id}&tab=rawlogs`); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteLog(r.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sortedRawLogs.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Belum ada raw log (DUKB) terdaftar.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={dukbPage}
                pageSize={dukbPageSize}
                totalItems={sortedRawLogs.length}
                onPageChange={setDukbPage}
                onPageSizeChange={(newSize) => {
                  setDukbPageSize(newSize);
                  setDukbPage(1);
                }}
                itemLabel="log mentah (DUKB)"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TRIMMING */}
        <TabsContent value="trimming">
          <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trimming</CardTitle>
                  <CardDescription>Proses pemotongan log (pangkal/ujung) sebelum masuk sawmill.</CardDescription>
                </div>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Trim</TableHead>
                    <TableHead>No. Log Asal</TableHead>
                    <TableHead className="text-right">Volume Hasil (m³)</TableHead>
                    <TableHead className="text-right">Sisa Gerowong</TableHead>
                    <TableHead className="text-center">Status Pemrosesan</TableHead>
                    <TableHead className="text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrimmedLogs.map((t: any) => {
                    const isCut = t.status === 'ASSIGNED_TO_INPUT' || t.status === 'CONSUMED' || t.status === 'IN_PROCESS' || !!t.inputLogId;
                    return (
                    <TableRow key={t.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/inventory/trimming/${t.id}?partaiId=${id}&tab=trimming`)}>
                      <TableCell className="font-semibold text-foreground font-mono">{t.trimNumber || t.logNumber}</TableCell>
                      <TableCell className="text-primary font-medium">{t.rawLog?.logNumber || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-foreground/90">{Number(t.netVolume || 0).toFixed(4)}</TableCell>
                      <TableCell className="text-right">{Number(t.hollowVolume || 0).toFixed(4)}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        {isCut ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold py-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                            Sudah Dipotong (WIP)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 text-xs font-semibold py-0.5">
                            Available (Siap Potong)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inventory/trimming/${t.id}?partaiId=${id}&tab=trimming`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/inventory/trimming/${t.id}?partaiId=${id}&tab=trimming`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTrim(t.id) }} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                  {sortedTrimmedLogs.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada proses trimming.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={trimmingPage}
                pageSize={trimmingPageSize}
                totalItems={sortedTrimmedLogs.length}
                onPageChange={setTrimmingPage}
                onPageSizeChange={(newSize) => {
                  setTrimmingPageSize(newSize);
                  setTrimmingPage(1);
                }}
                itemLabel="hasil trimming"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. INPUT LOGS (WIP & INPUT TALLY) */}
        <TabsContent value="input" className="space-y-6">
          {/* SECTION 1: PILIH LOG DARI TRIMMING & LANGSUNG INPUT TALLY */}
          <Card className="border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-400 text-lg flex items-center gap-2">
                  <span className="text-xl">🪵</span> Log Siap Masuk Mesin & Input Hasil Tally
                </CardTitle>
                <CardDescription>
                  Centang log hasil trimming di bawah ini, lalu klik tombol <strong>Input Tally Harian</strong> untuk langsung memasukkan hasil ukuran gergajian (P &times; L &times; T &times; PCS).
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const availableLogs = (partai.trimmedLogs || []).filter((t: any) => t.status === 'AVAILABLE');
                  const isAllSelected = availableLogs.length > 0 && selectedTrimmedLogIds.length === availableLogs.length;
                  return (
                    <>
                      {availableLogs.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isAllSelected) {
                              setSelectedTrimmedLogIds([]);
                            } else {
                              setSelectedTrimmedLogIds(availableLogs.map((t: any) => t.id));
                            }
                          }}
                          className="h-9 text-xs font-semibold"
                        >
                          {isAllSelected ? "Batal Pilih Semua" : "Pilih Semua Log"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => openTallyModalWithSelection()}
                        disabled={selectedTrimmedLogIds.length === 0}
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Input Tally Harian ({selectedTrimmedLogIds.length} Log Terpilih)
                      </Button>
                    </>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {(() => {
                const availableLogs = (partai.trimmedLogs || []).filter((t: any) => t.status === 'AVAILABLE');
                if (availableLogs.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <p className="font-medium text-sm">Tidak ada log trimming yang berstatus SIAP POTONG saat ini.</p>
                      <p className="text-xs mt-1">Lakukan trimming log terlebih dahulu pada tab <strong>3. Trimming</strong> untuk menghasilkan log siap potong.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableLogs.map((t: any) => {
                        const isSelected = selectedTrimmedLogIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTrimmedLogIds(selectedTrimmedLogIds.filter(x => x !== t.id));
                              } else {
                                setSelectedTrimmedLogIds([...selectedTrimmedLogIds, t.id]);
                              }
                            }}
                            className={`flex flex-col border rounded-lg p-3.5 bg-background shadow-sm cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                                : "hover:border-amber-400"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2.5">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTrimmedLogIds([...selectedTrimmedLogIds, t.id]);
                                    } else {
                                      setSelectedTrimmedLogIds(selectedTrimmedLogIds.filter(x => x !== t.id));
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-bold text-base text-foreground font-mono">{t.trimNumber}</span>
                              </div>
                              <Badge variant="outline" className="text-amber-600 border-amber-500 bg-amber-500/10 text-xs">
                                SIAP POTONG
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 mb-3 pl-6">
                              <p>Spesies: <span className="font-semibold text-foreground">{t.species}</span></p>
                              <p>Dimensi: <span className="font-medium text-foreground">{t.roundedDiameter} cm &times; {t.length} m</span></p>
                              <p>Volume: <span className="font-bold text-foreground font-mono">{Number(t.netVolume || 0).toFixed(4)} m&sup3;</span></p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full mt-auto bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTallyModalWithSelection([t.id]);
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Langsung Input Tally Log Ini
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* SECTION 2: PRODUCTION JOBS (INPUT WIP) YANG SEDANG BERJALAN */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg">Daftar Pekerjaan Produksi (Input WIP)</CardTitle>
                <CardDescription>Pekerjaan gergajian berjalan beserta rekapan hasil tally output masing-masing pekerjaan.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {paginatedInputLogs.map((i: any) => {
                const totalInputVol = Number(i.totalVolume || 0);
                const outItems = (i.sawnOutputs || []).flatMap((o: any) => o.items || []);
                const totalOutputVol = outItems.reduce((acc: number, cur: any) => acc + (cur.volumeM3 || 0), 0);
                const totalOutputPcs = outItems.reduce((acc: number, cur: any) => acc + (cur.quantityPcs || 0), 0);
                const progressPct = totalInputVol > 0 ? Math.min(100, Math.round((totalOutputVol / totalInputVol) * 100)) : 0;
                const isExpanded = expandedInputLogIds.includes(i.id);
                
                return (
                  <Card key={i.id} className="overflow-hidden border-border/70 hover:border-primary/50 transition-all shadow-sm">
                    {/* Header Row */}
                    <div 
                      className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpandInputLog(i.id)}
                    >
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandInputLog(i.id);
                            }}
                          >
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                          <span className="font-bold text-base text-primary font-mono">{i.inputNumber}</span>
                          {i.status === 'DONE' ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">DONE</Badge>
                          ) : i.status === 'IN_PROCESS' || i.status === 'PROCESSING' ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600">IN PROCESS</Badge>
                          ) : (
                            <Badge className="bg-blue-500 hover:bg-blue-600">AVAILABLE</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-1.5 items-center pl-7">
                          <span>{i.date ? new Date(i.date).toLocaleDateString("id-ID") : (i.createdAt ? new Date(i.createdAt).toLocaleDateString("id-ID") : "-")}</span>
                          <span>&bull;</span>
                          <span className="font-medium text-foreground/80">{i.species || "-"}</span> 
                          <span>&bull;</span>
                          <span>{i.items?.length || 0} Source Logs</span>
                        </div>
                      </div>
                      
                      <div className="md:col-span-5 grid grid-cols-3 gap-2.5 text-sm text-center">
                        <div className="bg-muted/40 rounded-md p-2">
                          <div className="text-[11px] text-muted-foreground mb-0.5">Input Bahan</div>
                          <div className="font-semibold text-foreground/90 font-mono text-xs md:text-sm">{totalInputVol.toFixed(4)} m³</div>
                        </div>
                        <div className="bg-muted/40 rounded-md p-2">
                          <div className="text-[11px] text-muted-foreground mb-0.5">Output Hasil</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs md:text-sm">
                            {totalOutputVol.toFixed(4)} m³
                            {totalOutputPcs > 0 && <span className="block text-[10px] text-muted-foreground font-normal">{totalOutputPcs} pcs</span>}
                          </div>
                        </div>
                        <div className="bg-muted/40 rounded-md p-2">
                          <div className="text-[11px] text-muted-foreground mb-0.5">Rendemen</div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400 text-xs md:text-sm">{progressPct}%</div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 flex justify-end items-center gap-2">
                        <Button 
                          size="sm" 
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTallyModalWithSelection([], i);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> + Tally
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandInputLog(i.id);
                          }}
                        >
                          {isExpanded ? "Tutup" : "Buka Isi"}
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-xs px-2"
                          title="Buka Halaman Job Card Lengkap"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            router.push(`/inventory/input-logs/${i.id}?partaiId=${id}&tab=input`);
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div className="h-1.5 w-full bg-muted/50">
                      <div className={`h-full transition-all duration-500 ${i.status === 'DONE' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progressPct}%` }} />
                    </div>

                    {/* EXPANDED DETAILS (Log Sumber, Tanggal, Hasil Tally PxLxT=m3, PCS) */}
                    {isExpanded && (
                      <div className="border-t bg-muted/15 p-4 sm:p-5 space-y-4">
                        {/* 1. Log Sumber yang Dipotong */}
                        <div className="bg-background rounded-lg border p-3.5 shadow-sm space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              🪵 Log Sumber Yang Dipotong ({i.items?.length || 0} Log)
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              Total Input: <strong className="text-foreground font-mono">{totalInputVol.toFixed(4)} m³</strong>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(i.items || []).map((item: any, idx: number) => {
                              const logCode = item.trimmedLog?.trimNumber || item.rawLog?.logNumber || `Log #${idx + 1}`;
                              const pjg = item.trimmedLog?.length || item.rawLog?.length;
                              const dia = item.trimmedLog?.averageDiameter || item.rawLog?.averageDiameter;
                              const vol = item.volume || item.trimmedLog?.netVolume || item.rawLog?.netVolume || 0;
                              return (
                                <div key={item.id || idx} className="inline-flex items-center gap-2 bg-muted/60 border rounded-md px-2.5 py-1 text-xs">
                                  <span className="font-bold font-mono text-primary">{logCode}</span>
                                  {(dia || pjg) && <span className="text-muted-foreground text-[11px]">({dia ? `Ø${dia}cm` : ''} {pjg ? `P${pjg}m` : ''})</span>}
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{Number(vol).toFixed(4)} m³</span>
                                </div>
                              );
                            })}
                            {(!i.items || i.items.length === 0) && (
                              <span className="text-xs text-muted-foreground italic">Tidak ada rincian data log sumber.</span>
                            )}
                          </div>
                        </div>

                        {/* 2. Info Tanggal & Spesies */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1 gap-2">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Tanggal Pengerjaan: <strong className="text-foreground">{i.date ? new Date(i.date).toLocaleDateString("id-ID") : (i.createdAt ? new Date(i.createdAt).toLocaleDateString("id-ID") : "-")}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> Spesies Kayu: <strong className="text-foreground">{i.species || "-"}</strong>
                            </span>
                          </div>
                          <span className="text-xs font-medium">
                            Total Hasil: <strong className="text-emerald-600 font-mono">{totalOutputPcs} PCS</strong> ({totalOutputVol.toFixed(4)} m³)
                          </span>
                        </div>

                        {/* 3. Hasil Tally Gergajian (T x L x P = m3, PCS) */}
                        <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
                          <div className="bg-muted/40 px-3.5 py-2 border-b flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              📋 Rincian Hasil Tally Gergajian (P × L × T = m³)
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTallyModalWithSelection([], i);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Tambah Tally
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/20">
                                  <TableHead className="h-8 text-xs">Tgl Tally</TableHead>
                                  <TableHead className="h-8 text-xs">Kategori Produk</TableHead>
                                  <TableHead className="h-8 text-xs font-bold">Ukuran: T × L × P (cm)</TableHead>
                                  <TableHead className="h-8 text-xs text-right font-bold">Jumlah (PCS)</TableHead>
                                  <TableHead className="h-8 text-xs text-right font-bold text-emerald-600">Hasil (m³)</TableHead>
                                  <TableHead className="h-8 text-xs text-center w-[90px]">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(i.sawnOutputs || []).flatMap((o: any) => 
                                  (o.items || []).map((item: any) => ({ ...item, outputDate: o.outputDate, status: o.status }))
                                ).map((item: any, rowIdx: number) => {
                                  const tCm = item.thicknessMm ? (item.thicknessMm / 10) : 0;
                                  const lCm = item.widthMm ? (item.widthMm / 10) : 0;
                                  const pCm = item.lengthMm ? (item.lengthMm / 10) : 0;
                                  return (
                                    <TableRow key={item.id || rowIdx} className="hover:bg-muted/30">
                                      <TableCell className="py-2 text-xs text-muted-foreground">
                                        {item.outputDate ? new Date(item.outputDate).toLocaleDateString("id-ID") : "-"}
                                      </TableCell>
                                      <TableCell className="py-2 text-xs">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          item.productType === 'RENG' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                          item.productType === 'AFKIR_BS' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                                          item.productType === 'AIR_DRY' ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20' :
                                          item.productType === 'FJL' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                                          'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                        }`}>
                                          {item.productType || 'BALOK'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-2 text-xs font-semibold font-mono text-foreground">
                                        {tCm} &times; {lCm} &times; {pCm} cm
                                      </TableCell>
                                      <TableCell className="py-2 text-xs text-right font-bold text-foreground">
                                        {item.quantityPcs} pcs
                                      </TableCell>
                                      <TableCell className="py-2 text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {Number(item.volumeM3 || 0).toFixed(4)} m³
                                      </TableCell>
                                      <TableCell className="py-2 text-xs text-center">
                                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${item.status === 'POSTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : ''}`}>
                                          {item.status || 'POSTED'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {outItems.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                      Belum ada hasil tally gergajian yang dimasukkan untuk pekerjaan ini.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          {outItems.length > 0 && (
                            <div className="bg-muted/30 px-3.5 py-2 border-t flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                              <span className="font-semibold text-muted-foreground">Total Rekapitulasi Output:</span>
                              <div className="flex items-center gap-4">
                                <span>Jumlah: <strong className="text-foreground font-mono">{totalOutputPcs} PCS</strong></span>
                                <span>Volume: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{totalOutputVol.toFixed(4)} m³</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {sortedInputLogs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  Belum ada pekerjaan produksi (WIP). Pilih log hasil trimming di atas dan klik <strong>Input Tally Harian</strong> untuk memulai pekerjaan.
                </div>
              )}
              <TablePagination
                currentPage={inputPage}
                pageSize={inputPageSize}
                totalItems={sortedInputLogs.length}
                onPageChange={setInputPage}
                onPageSizeChange={(newSize) => {
                  setInputPageSize(newSize);
                  setInputPage(1);
                }}
                itemLabel="pekerjaan WIP"
              />
            </CardContent>
          </Card>
        </TabsContent>

        
          {/* 5. SAWN TIMBER OUTPUT */}
          <TabsContent value="output">
            

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Sawn Timber Output (Daily Tally)</CardTitle>
                <CardDescription>Hasil akhir gergajian yang tercatat dari seluruh WIP partai ini.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-4 mb-4 bg-muted/30 p-3 rounded-lg border">
                <div className="text-sm font-medium">{selectedOutputItems.length} item terpilih</div>
                <Select value={selectedGradeId} onValueChange={(val) => setSelectedGradeId(val || "")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(g => (
                      <SelectItem key={g.id || g._id} value={g.id || g._id}>{g.name && g.code ? (g.code + " - " + g.name) : (g.name || g.code || ("Grade " + (g.id || g._id).toString().slice(-4)))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkGrade} 
                  disabled={selectedOutputItems.length === 0 || !selectedGradeId || isGrading}
                >
                  {isGrading ? "Memproses..." : "Update Grade"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePostOutputs} 
                  disabled={isPostingOutputs || (partai?.sawnOutputs || []).filter((o: any) => o.status === 'DRAFT').length === 0}
                  className="ml-auto text-emerald-600 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                >
                  {isPostingOutputs ? "Memposting..." : "Post Output ke Stok"}
                </Button>
              </div>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={allOutputItems.length > 0 && selectedOutputItems.length === allOutputItems.length}
                        onCheckedChange={() => toggleSelectAllOutputItems(allOutputItems)}
                      />
                    </TableHead>
                    <TableHead>Tgl Produksi</TableHead>
                    <TableHead>Bundle No</TableHead>
                    <TableHead>Source WIP</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tebal</TableHead>
                    <TableHead>Lebar</TableHead>
                    <TableHead>Panjang</TableHead>
                    <TableHead className="text-right">PCS</TableHead>
                    <TableHead className="text-right">M&sup3;</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOutputItems.map((i: any) => {
                    const wip = (partai.inputLogs || []).find((log: any) => log.id === i.parentInputId);
                    const isDirectPurchase =
                      (wip?.inputNumber && wip.inputNumber.startsWith("DIRECT-PURCHASE")) ||
                      (i.parentNotes && i.parentNotes.includes("Beli Masak")) ||
                      (i.notes && i.notes.includes("Penerimaan Sawn Timber"));
                    return (
                      <TableRow key={i.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/inventory/sawn-timber/output/${i.parentOutputId}?partaiId=${id}&tab=output`)}>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox 
                            checked={!!selectedOutputItems.find(x => x.id === i.id)} 
                            onCheckedChange={() => toggleSelectOutputItem(i.id, i.parentOutputId)} 
                          />
                        </TableCell>
                        <TableCell>{i.parentDate ? new Date(i.parentDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                        <TableCell className="font-medium text-blue-600 dark:text-blue-400">{i.parentBundleNumber}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {isDirectPurchase ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50/50">
                              Beli Jadi
                            </Badge>
                          ) : (
                            <Link href={`/inventory/input-logs/${i.parentInputId}`} onClick={e => e.stopPropagation()}>
                              {wip?.inputNumber || "WIP"}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            i.productType === 'RENG' ? 'border-amber-500 text-amber-600 bg-amber-50/50' :
                            i.productType === 'AFKIR_BS' ? 'border-red-500 text-red-600 bg-red-50/50' :
                            i.productType === 'AIR_DRY' ? 'border-sky-500 text-sky-600 bg-sky-50/50' :
                            i.productType === 'FJL' ? 'border-purple-500 text-purple-600 bg-purple-50/50' :
                            'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                          }>
                            {i.productType === 'BALOK' ? 'Balok / Main' :
                             i.productType === 'RENG' ? 'Reng / Papan' :
                             i.productType === 'AFKIR_BS' ? 'BS / Afkir' :
                             i.productType === 'AIR_DRY' ? 'Air Dry' :
                             i.productType === 'FJL' ? 'FJL' : (i.productType || 'Balok / Main')}
                          </Badge>
                        </TableCell>
                        <TableCell>{i.thicknessMm / 10} cm</TableCell>
                        <TableCell>{i.widthMm / 10} cm</TableCell>
                        <TableCell>{i.lengthMm / 10} cm</TableCell>
                        <TableCell className="text-right font-medium">{i.quantityPcs}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{Number((i.volumeM3 || 0).toFixed(4))}</TableCell>
                        <TableCell className="text-center">
                          {i.grade === 'PENDING' ? <Badge variant="outline" className="text-amber-500 border-amber-500">PENDING</Badge> : <Badge className="bg-primary">{grades.find(g => g.code === i.grade)?.name || i.grade}</Badge>}
                        </TableCell>
                        <TableCell className="text-center">
                          {i.parentStatus === 'POSTED' ? <Badge className="bg-emerald-500">POSTED</Badge> : <Badge variant="outline">DRAFT</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {allOutputItems.length === 0 && (
                    <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">Belum ada output produksi.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={outputPage}
                pageSize={outputPageSize}
                totalItems={allOutputItems.length}
                onPageChange={setOutputPage}
                onPageSizeChange={(newSize) => {
                  setOutputPageSize(newSize);
                  setOutputPage(1);
                }}
                itemLabel="output sawn timber"
              />
            </CardContent>
          </Card>
        </TabsContent>

          {/* 6. REKAPAN */}
          <TabsContent value="summary">
            {(() => {
              // Raw Logs (DUKB)
              const rawLogs = partai.rawLogs || [];
              const totalRawLogPcs = rawLogs.length;
              const totalRawLogVolM3 = rawLogs.reduce((s: number, r: any) => {
                const d = (r.averageDiameter || r.diameter || 0) / 100;
                const l = r.length || 0;
                return s + (Math.PI / 4) * d * d * l;
              }, 0);

              // Trimming
              const trimmedLogs = partai.trimmedLogs || [];
              const totalTrimmedPcs = trimmedLogs.length;
              const totalTrimmedVolM3 = trimmedLogs.reduce((s: number, t: any) => {
                const d = (t.averageDiameter || t.diameter || 0) / 100;
                const l = t.length || 0;
                return s + (Math.PI / 4) * d * d * l;
              }, 0);

              // Input WIP
              const inputLogs = partai.inputLogs || [];
              const totalInputPcs = inputLogs.length;

              // Output Sawn Timber
              const allOutputItems = (partai.sawnOutputs || []).flatMap((o: any) => o.items || []);
              const totalOutputPcs = allOutputItems.reduce((s: number, i: any) => s + (i.quantityPcs || 0), 0);
              const totalOutputM3 = allOutputItems.reduce((s: number, i: any) => s + (i.volumeM3 || 0), 0);
              const postedItems = (partai.sawnOutputs || []).filter((o: any) => o.status === 'POSTED').flatMap((o: any) => o.items || []);
              const postedPcs = postedItems.reduce((s: number, i: any) => s + (i.quantityPcs || 0), 0);
              const postedM3 = postedItems.reduce((s: number, i: any) => s + (i.volumeM3 || 0), 0);

              // Rendemen
              const rendemen = totalRawLogVolM3 > 0 ? (totalOutputM3 / totalRawLogVolM3) * 100 : 0;

              // Product Category breakdown (Balok, Reng, BS, Air Dry, FJL)
              const CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
                BALOK: { label: 'Balok / Main Size', badgeClass: 'border-emerald-500 text-emerald-600 bg-emerald-50/50' },
                RENG: { label: 'Reng / Papan', badgeClass: 'border-amber-500 text-amber-600 bg-amber-50/50' },
                AFKIR_BS: { label: 'BS / Afkir', badgeClass: 'border-red-500 text-red-600 bg-red-50/50' },
                AIR_DRY: { label: 'Air Dry', badgeClass: 'border-sky-500 text-sky-600 bg-sky-50/50' },
                FJL: { label: 'FJL', badgeClass: 'border-purple-500 text-purple-600 bg-purple-50/50' },
              };
              const categoryBreakdown: Record<string, { pcs: number; m3: number }> = {};
              allOutputItems.forEach((i: any) => {
                const cat = i.productType || 'BALOK';
                if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { pcs: 0, m3: 0 };
                categoryBreakdown[cat].pcs += i.quantityPcs || 0;
                categoryBreakdown[cat].m3 += i.volumeM3 || 0;
              });

              // Grade breakdown
              const gradeBreakdown: Record<string, { pcs: number; m3: number }> = {};
              allOutputItems.forEach((i: any) => {
                const gradeKey = i.grade || 'PENDING';
                const gradeName = grades.find((g: any) => g.code === gradeKey)?.name || gradeKey;
                if (!gradeBreakdown[gradeName]) gradeBreakdown[gradeName] = { pcs: 0, m3: 0 };
                gradeBreakdown[gradeName].pcs += i.quantityPcs || 0;
                gradeBreakdown[gradeName].m3 += i.volumeM3 || 0;
              });

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10">
                      <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Raw Log</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRawLogPcs} pcs</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{Number(totalRawLogVolM3.toFixed(3))} m³</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-900/10">
                      <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Input Mesin (WIP)</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalInputPcs} pcs</p>
                        <p className="text-sm text-muted-foreground mt-0.5">dari {totalTrimmedPcs} log trimming</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/10">
                      <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Output Kayu Gergajian</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalOutputPcs} pcs</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{Number(totalOutputM3.toFixed(4))} m³</p>
                      </CardContent>
                    </Card>
                    <Card className={rendemen >= 50 ? "border-purple-500/30 bg-purple-50/30 dark:bg-purple-900/10" : "border-red-500/30 bg-red-50/30 dark:bg-red-900/10"}>
                      <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Rendemen</p>
                        <p className={`text-2xl font-bold ${rendemen >= 50 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600'}`}>{rendemen.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Output / Raw Log M³</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="border-b pb-4">
                      <CardTitle>Alur Proses Partai</CardTitle>
                      <CardDescription>Ringkasan volume & jumlah di setiap tahap produksi</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tahap</TableHead>
                            <TableHead className="text-right">Jumlah (Pcs)</TableHead>
                            <TableHead className="text-right">Volume (M³)</TableHead>
                            <TableHead className="text-right">Susut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">2. DUKB (Raw Log Diterima)</TableCell>
                            <TableCell className="text-right">{totalRawLogPcs}</TableCell>
                            <TableCell className="text-right">{Number(totalRawLogVolM3.toFixed(3))}</TableCell>
                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">3. Trimming</TableCell>
                            <TableCell className="text-right">{totalTrimmedPcs}</TableCell>
                            <TableCell className="text-right">{Number(totalTrimmedVolM3.toFixed(3))}</TableCell>
                            <TableCell className="text-right">
                              {totalRawLogVolM3 > 0 && totalTrimmedVolM3 > 0 ? (
                                <span className="text-amber-600 font-medium">-{Number((totalRawLogVolM3 - totalTrimmedVolM3).toFixed(3))} m³</span>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">4. Input Mesin (WIP)</TableCell>
                            <TableCell className="text-right">{totalInputPcs}</TableCell>
                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                          </TableRow>
                          <TableRow className="bg-emerald-50/30 dark:bg-emerald-900/10">
                            <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">5. Output Kayu Gergajian (Total)</TableCell>
                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">{totalOutputPcs}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">{Number(totalOutputM3.toFixed(4))}</TableCell>
                            <TableCell className="text-right">
                              {totalRawLogVolM3 > 0 ? (
                                <span className={`font-bold ${rendemen >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>Rendemen {rendemen.toFixed(1)}%</span>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-blue-50/30 dark:bg-blue-900/10">
                            <TableCell className="font-medium text-blue-700 dark:text-blue-400 pl-8">↳ Sudah POSTED ke Stok</TableCell>
                            <TableCell className="text-right text-blue-700 dark:text-blue-400">{postedPcs}</TableCell>
                            <TableCell className="text-right text-blue-700 dark:text-blue-400">{Number(postedM3.toFixed(4))}</TableCell>
                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {Object.keys(categoryBreakdown).length > 0 && (
                    <Card>
                      <CardHeader className="border-b pb-4">
                        <CardTitle>Rendemen & Rekap per Kategori Produk</CardTitle>
                        <CardDescription>Distribusi Balok (Main Size), Reng/Papan, BS/Afkir & rendemen parsial terhadap Log Raw</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kategori Produk</TableHead>
                              <TableHead className="text-right">Jumlah (Pcs)</TableHead>
                              <TableHead className="text-right">Volume (M³)</TableHead>
                              <TableHead className="text-right">% dari Output</TableHead>
                              <TableHead className="text-right">Rendemen thdp Log (%)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(categoryBreakdown).map(([catKey, val]) => {
                              const conf = CATEGORY_CONFIG[catKey] || { label: catKey, badgeClass: 'border-slate-500 text-slate-600 bg-slate-50/50' };
                              const pctOutput = totalOutputM3 > 0 ? (val.m3 / totalOutputM3) * 100 : 0;
                              const partialRendemen = totalRawLogVolM3 > 0 ? (val.m3 / totalRawLogVolM3) * 100 : 0;
                              return (
                                <TableRow key={catKey}>
                                  <TableCell>
                                    <Badge variant="outline" className={conf.badgeClass}>{conf.label}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{val.pcs}</TableCell>
                                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{Number(val.m3.toFixed(4))}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{pctOutput.toFixed(1)}%</TableCell>
                                  <TableCell className="text-right font-bold text-primary">{partialRendemen.toFixed(2)}%</TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/30 font-bold border-t">
                              <TableCell>Total Output</TableCell>
                              <TableCell className="text-right">{totalOutputPcs}</TableCell>
                              <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{Number(totalOutputM3.toFixed(4))}</TableCell>
                              <TableCell className="text-right">100%</TableCell>
                              <TableCell className={`text-right ${rendemen >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{rendemen.toFixed(2)}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {Object.keys(gradeBreakdown).length > 0 && (
                    <Card>
                      <CardHeader className="border-b pb-4">
                        <CardTitle>Output per Grade / Kualitas</CardTitle>
                        <CardDescription>Distribusi hasil gergajian berdasarkan grade</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Pcs</TableHead>
                              <TableHead className="text-right">Volume (M³)</TableHead>
                              <TableHead className="text-right">% dari Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(gradeBreakdown).sort((a, b) => b[1].m3 - a[1].m3).map(([gradeName, val]) => (
                              <TableRow key={gradeName}>
                                <TableCell>
                                  {gradeName === 'PENDING'
                                    ? <Badge variant="outline" className="text-amber-500 border-amber-500">BELUM DIISI</Badge>
                                    : <Badge className="bg-primary">{gradeName}</Badge>}
                                </TableCell>
                                <TableCell className="text-right">{val.pcs}</TableCell>
                                <TableCell className="text-right font-bold">{Number(val.m3.toFixed(4))}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {totalOutputM3 > 0 ? ((val.m3 / totalOutputM3) * 100).toFixed(1) + '%' : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {totalRawLogPcs === 0 && totalOutputPcs === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-lg font-medium">Belum ada data untuk ditampilkan.</p>
                      <p className="text-sm mt-1">Lengkapi data di tab DUKB, Trimming, dan Output terlebih dahulu.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>
      </Tabs>

      <ReceiveLogModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedPurchaseForReceive(null);
        }}
        purchase={selectedPurchaseForReceive}
        partaiId={id}
        onSuccess={fetchPartai}
      />

      {/* MODAL INPUT TALLY HARIAN (LANGSUNG DARI TAB WIP) */}
      <Dialog open={isTallyModalOpen} onOpenChange={setIsTallyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span>Input Tally Harian</span>
              {targetInputLogForTally && (
                <Badge variant="outline" className="font-mono text-xs text-primary border-primary">
                  {targetInputLogForTally.inputNumber}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {targetInputLogForTally 
                ? `Masukkan hasil gergajian untuk WIP Job ${targetInputLogForTally.inputNumber}. Sistem otomatis menghitung M³ (T × L × P × PCS ÷ 1.000.000).`
                : `Masukkan hasil gergajian untuk ${selectedTrimmedLogIds.length} log trimming terpilih. Sistem akan membuat pekerjaan WIP dan otomatis posting output ke stok.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tanggal Produksi</Label>
                <Input 
                  type="date" 
                  value={tallyDate} 
                  onChange={e => setTallyDate(e.target.value)} 
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gudang Tujuan Output</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={tallyWarehouseId}
                  onChange={(e) => setTallyWarehouseId(e.target.value)}
                >
                  {warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name || wh.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIST OF SELECTED LOGS INFO */}
            {!targetInputLogForTally && selectedTrimmedLogIds.length > 0 && (
              <div className="p-3 bg-muted/40 rounded-lg border text-xs">
                <span className="font-semibold text-foreground">Log Trimming Sumber ({selectedTrimmedLogIds.length} log): </span>
                <span className="text-muted-foreground">
                  {(partai?.trimmedLogs || [])
                    .filter((t: any) => selectedTrimmedLogIds.includes(t.id))
                    .map((t: any) => `${t.trimNumber} (${Number(t.netVolume || 0).toFixed(4)} m³)`)
                    .join(", ")}
                </span>
              </div>
            )}
            
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="min-w-[80px]">T (cm)</TableHead>
                      <TableHead className="min-w-[80px]">L (cm)</TableHead>
                      <TableHead className="min-w-[90px]">P (cm)</TableHead>
                      <TableHead className="min-w-[80px]">PCS</TableHead>
                      <TableHead className="min-w-[130px]">Kategori</TableHead>
                      <TableHead className="min-w-[100px] text-right">M&sup3; (Auto)</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tallyLines.map((line, idx) => {
                      const vol = (Number(line.t || 0) * Number(line.l || 0) * Number(line.p || 0) * Number(line.pcs || 0)) / 1000000;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              step="any"
                              placeholder="5" 
                              value={line.t} 
                              onChange={e => { 
                                const n = [...tallyLines]; 
                                n[idx].t = e.target.value; 
                                setTallyLines(n); 
                              }} 
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              step="any"
                              placeholder="10" 
                              value={line.l} 
                              onChange={e => { 
                                const n = [...tallyLines]; 
                                n[idx].l = e.target.value; 
                                setTallyLines(n); 
                              }} 
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              step="any"
                              placeholder="400" 
                              value={line.p} 
                              onChange={e => { 
                                const n = [...tallyLines]; 
                                n[idx].p = e.target.value; 
                                setTallyLines(n); 
                              }} 
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              placeholder="15" 
                              value={line.pcs} 
                              onChange={e => { 
                                const n = [...tallyLines]; 
                                n[idx].pcs = e.target.value; 
                                setTallyLines(n); 
                              }} 
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <select 
                              className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold focus:outline-none"
                              value={line.productType || "BALOK"} 
                              onChange={e => { 
                                const n = [...tallyLines]; 
                                n[idx].productType = e.target.value; 
                                setTallyLines(n); 
                              }}
                            >
                              <option value="BALOK">Balok (Main)</option>
                              <option value="RENG">Reng / Papan</option>
                              <option value="AFKIR_BS">BS / Afkir</option>
                              <option value="AIR_DRY">Air Dry</option>
                              <option value="FJL">FJL / Jasa</option>
                            </select>
                          </TableCell>
                          <TableCell className="p-2 font-mono font-bold text-right text-emerald-600 text-sm">
                            {vol > 0 ? vol.toFixed(4) : "0.0000"}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setTallyLines(tallyLines.filter((_, i) => i !== idx))} 
                              disabled={tallyLines.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="p-2.5 bg-muted/30 border-t flex items-center justify-between">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTallyLines([...tallyLines, { t: "", l: "", p: "", pcs: "", productType: "BALOK" }])} 
                  className="border border-dashed text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Ukuran Lain
                </Button>
                <div className="text-xs font-medium text-muted-foreground mr-2">
                  Total Estimasi:{" "}
                  <span className="font-bold text-emerald-600 font-mono text-sm ml-1">
                    {tallyLines.reduce((sum, line) => {
                      const v = (Number(line.t || 0) * Number(line.l || 0) * Number(line.p || 0) * Number(line.pcs || 0)) / 1000000;
                      return sum + (isNaN(v) ? 0 : v);
                    }, 0).toFixed(4)} m³
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsTallyModalOpen(false)}>
              Batal
            </Button>
            <Button 
              type="button"
              onClick={handleSaveWipTally} 
              disabled={isSavingTally}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSavingTally ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Simpan Tally (POST)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
