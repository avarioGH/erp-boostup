"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InventoryAPI, ProductionAPI, MasterDataAPI, PartaiAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Layers, 
  CheckCircle2, 
  Cog, 
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  ChevronRight,
  Boxes,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export interface SizeRow {
  bundleNo: string;
  species: string;
  t: string; // Tebal cm
  w: string; // Lebar cm
  l: string; // Panjang cm
  pcs: string;
  volumeM3: number;
  customData?: Record<string, string>; // Dynamic custom fields e.g. kdNumber, palletNo, containerNo
}

export interface ProcessingStep {
  id: string; // Unique id for frontend state
  code: string; // e.g. "GESEK", "KD", "MOULDING"
  name: string; // e.g. "Sawing / Gesek"
  operator: string;
  notes: string;
  customFields?: { key: string; label: string; placeholder?: string; type?: string }[];
  rows: SizeRow[];
}

const DEFAULT_PROCESSING_TYPES = [
  { 
    id: "GESEK", 
    code: "GESEK", 
    name: "Sawing / Pembelahan (Gesek)",
    customFields: [
      { key: "machineNo", label: "No. Mesin Sawmill", placeholder: "Mesin 1" },
      { key: "logCode", label: "No. Log / Code", placeholder: "Contoh: 5357" },
      { key: "shift", label: "Shift / Operator", placeholder: "Shift 1" },
    ]
  },
  { 
    id: "KD", 
    code: "KD", 
    name: "Kiln Dry (Oven / Pengeringan)",
    customFields: [
      { key: "kdNumber", label: "Nomor KD / Chamber", placeholder: "MA 13 / KD-01" },
      { key: "mcInitial", label: "MC Awal (%)", placeholder: "35%" },
      { key: "mcFinal", label: "MC Akhir (%)", placeholder: "12%" },
    ]
  },
  { 
    id: "MOULDING", 
    code: "MOULDING", 
    name: "Moulding / Profil",
    customFields: [
      { key: "palletNo", label: "No. Palet (NO.PLT)", placeholder: "Contoh: 6579" },
      { key: "containerNo", label: "No. Container (CONT)", placeholder: "Contoh: Cont 1" },
      { key: "profileType", label: "Profil / Pisau", placeholder: "E4E / Decking" },
    ]
  },
  { 
    id: "PLANNER", 
    code: "PLANNER", 
    name: "Planing / Planner (Ketam Rata)",
    customFields: [
      { key: "palletNo", label: "No. Palet (NO.PLT)", placeholder: "Contoh: 6581" },
      { key: "containerNo", label: "No. Container (CONT)", placeholder: "Cont 1" },
    ]
  },
  { 
    id: "CROSSCUT", 
    code: "CROSSCUT", 
    name: "Crosscut / Trimming",
    customFields: [
      { key: "palletNo", label: "No. Palet (NO.PLT)", placeholder: "Contoh: 6590" },
      { key: "containerNo", label: "No. Container (CONT)", placeholder: "Cont 1" },
    ]
  },
  { 
    id: "PACKING", 
    code: "PACKING", 
    name: "Packing & Bundling",
    customFields: [
      { key: "palletNo", label: "No. Palet (NO.PLT)", placeholder: "Contoh: 01" },
      { key: "containerNo", label: "No. Container (CONT)", placeholder: "Cont 1" },
    ]
  },
  { 
    id: "SIPOT", 
    code: "SIPOT", 
    name: "Sisa Potong (Sipot / Afkir)",
    customFields: [
      { key: "palletNo", label: "No. Palet Asal", placeholder: "Contoh: 6780" },
    ]
  },
];

export default function CreateProcessingProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlPartaiId = searchParams.get("partaiId") || "";
  const [partaiInfo, setPartaiInfo] = useState<any>(null);

  // Project Header Info
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [processNo, setProcessNo] = useState(`PRJ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  // Sheet Tab Navigation: "input" | "step-{id}" | "rekap"
  const [activeSheetTab, setActiveSheetTab] = useState<string>("input");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [masterProcessingTypes, setMasterProcessingTypes] = useState<any[]>(DEFAULT_PROCESSING_TYPES);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Selected Step to add
  const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string>("");

  // Initial Material Input (Dipotong dari Stok Fisik)
  const [inputRows, setInputRows] = useState<SizeRow[]>([
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
    { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
  ]);

  // Project Multi-Steps
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "step-1",
      code: "GESEK",
      name: "Sawing / Pembelahan (Gesek)",
      operator: "",
      notes: "",
      customFields: DEFAULT_PROCESSING_TYPES[0].customFields,
      rows: [
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
      ],
    },
    {
      id: "step-2",
      code: "KD",
      name: "Kiln Dry (Oven / Pengeringan)",
      operator: "",
      notes: "",
      customFields: DEFAULT_PROCESSING_TYPES[1].customFields,
      rows: [
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
      ],
    },
    {
      id: "step-3",
      code: "MOULDING",
      name: "Moulding / Profil",
      operator: "",
      notes: "",
      customFields: DEFAULT_PROCESSING_TYPES[2].customFields,
      rows: [
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
      ],
    },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [whRes, typesRes, specRes] = await Promise.all([
        InventoryAPI.getWarehouses().catch(() => []),
        MasterDataAPI.getProcessingTypes().catch(() => []),
        MasterDataAPI.getSpecies().catch(() => []),
      ]);

      const whList = Array.isArray(whRes) ? whRes : whRes?.items || [];
      setWarehouses(whList);

      if (typeof window !== "undefined") {
        const storedWh = localStorage.getItem("active_warehouse");
        if (storedWh) {
          try {
            const parsed = JSON.parse(storedWh);
            if (parsed && parsed.id) setTargetWarehouseId(parsed.id);
          } catch (e) {}
        }
      }
      if (!targetWarehouseId && whList.length > 0) {
        setTargetWarehouseId(whList[0].id);
      }

      const rawTypes = Array.isArray(typesRes) ? typesRes : typesRes?.data || [];
      const types = rawTypes.length > 0 ? rawTypes : DEFAULT_PROCESSING_TYPES;
      setMasterProcessingTypes(types);
      if (types.length > 0) {
        setSelectedTypeToAdd(types[0].code);
      }

      const species = Array.isArray(specRes) ? specRes : specRes?.data || [];
      setSpeciesList(species);

      if (urlPartaiId) {
        try {
          const p = await PartaiAPI.getPartai(urlPartaiId);
          if (p) {
            setPartaiInfo(p);
            setProjectName(`Project Partai ${p.code || p.name}`);
            const partaiSpecies = p.rawLogs?.[0]?.species || p.inputLogs?.[0]?.species || (species[0]?.name || "");
            if (partaiSpecies) {
              setInputRows(prev => prev.map(r => ({ ...r, species: r.species || partaiSpecies })));
            }
            if (p.warehouseId) {
              setTargetWarehouseId(p.warehouseId);
            }
          }
        } catch (e) {
          console.error("Error fetching partai details:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Kalkulasi Volume Ukuran: (T cm * W cm * L cm * Pcs) / 1.000.000
  const calcVolume = (t: string | number, w: string | number, l: string | number, pcs: string | number): number => {
    const tStr = String(t ?? "").replace(",", ".");
    const wStr = String(w ?? "").replace(",", ".");
    const lStr = String(l ?? "").replace(",", ".");
    const pcsStr = String(pcs ?? "").replace(",", ".");

    const tNum = parseFloat(tStr) || 0;
    const wNum = parseFloat(wStr) || 0;
    const lNum = parseFloat(lStr) || 0;
    const pcsNum = parseFloat(pcsStr) || 0;

    if (tNum <= 0 || wNum <= 0 || lNum <= 0 || pcsNum <= 0) return 0;
    const vol = (tNum * wNum * lNum * pcsNum) / 1000000;
    return isNaN(vol) ? 0 : Number(vol.toFixed(4));
  };

  // Input Rows Handlers
  const handleInputChange = (index: number, field: keyof SizeRow, value: string) => {
    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index].volumeM3 = calcVolume(
        updated[index].t,
        updated[index].w,
        updated[index].l,
        updated[index].pcs
      );
      return updated;
    });
  };

  const addInputRows = (count: number) => {
    setInputRows(prev => {
      const newRows = Array.from({ length: count }).map(() => ({
        bundleNo: "",
        species: prev[prev.length - 1]?.species || "",
        t: "",
        w: "",
        l: "",
        pcs: "",
        volumeM3: 0,
      }));
      return [...prev, ...newRows];
    });
  };

  const removeInputRow = (index: number) => {
    if (inputRows.length <= 1) return;
    setInputRows(prev => prev.filter((_, i) => i !== index));
  };

  // Step Rows Handlers
  const handleStepRowChange = (stepIndex: number, rowIndex: number, field: keyof SizeRow | string, value: string, isCustomField = false) => {
    setSteps(prev => {
      const updated = [...prev];
      const step = { ...updated[stepIndex] };
      const rows = [...step.rows];
      if (isCustomField) {
        rows[rowIndex] = {
          ...rows[rowIndex],
          customData: {
            ...(rows[rowIndex].customData || {}),
            [field]: value,
          },
        };
      } else {
        rows[rowIndex] = { ...rows[rowIndex], [field]: value };
        rows[rowIndex].volumeM3 = calcVolume(
          rows[rowIndex].t,
          rows[rowIndex].w,
          rows[rowIndex].l,
          rows[rowIndex].pcs
        );
      }
      step.rows = rows;
      updated[stepIndex] = step;
      return updated;
    });
  };

  const addStepRows = (stepIndex: number, count: number) => {
    setSteps(prev => {
      const updated = [...prev];
      const step = { ...updated[stepIndex] };
      const lastSpecies = step.rows[step.rows.length - 1]?.species || inputRows[0]?.species || "";
      const newRows = Array.from({ length: count }).map(() => ({
        bundleNo: "",
        species: lastSpecies,
        t: "",
        w: "",
        l: "",
        pcs: "",
        volumeM3: 0,
        customData: {},
      }));
      step.rows = [...step.rows, ...newRows];
      updated[stepIndex] = step;
      return updated;
    });
  };

  const removeStepRow = (stepIndex: number, rowIndex: number) => {
    setSteps(prev => {
      const updated = [...prev];
      const step = { ...updated[stepIndex] };
      if (step.rows.length <= 1) return prev;
      step.rows = step.rows.filter((_, i) => i !== rowIndex);
      updated[stepIndex] = step;
      return updated;
    });
  };

  // Copy rows from previous stage
  const copyFromPreviousStage = (stepIndex: number) => {
    let sourceRows: SizeRow[] = [];
    if (stepIndex === 0) {
      sourceRows = inputRows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
    } else {
      sourceRows = steps[stepIndex - 1].rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
    }

    if (sourceRows.length === 0) {
      toast({ 
        title: "Data Sumber Kosong", 
        description: "Tahap sebelumnya belum memiliki baris ukuran yang valid untuk disalin.", 
        variant: "destructive" 
      });
      return;
    }

    setSteps(prev => {
      const updated = [...prev];
      const step = { ...updated[stepIndex] };
      step.rows = sourceRows.map(r => ({ 
        ...r, 
        customData: { ...(r.customData || {}) } 
      }));
      updated[stepIndex] = step;
      return updated;
    });

    toast({ 
      title: "Data Disalin!", 
      description: `${sourceRows.length} baris ukuran berhasil disalin dari ${stepIndex === 0 ? "Bahan Input Awal" : steps[stepIndex - 1].name}. Anda dapat menyesuaikan dimensi/pcs setelah proses ini.` 
    });
  };

  // Add a new step to pipeline
  const handleAddStep = () => {
    if (!selectedTypeToAdd) return;
    const typeObj = masterProcessingTypes.find(t => t.code === selectedTypeToAdd);
    const newStepId = `step-${Date.now()}`;
    const newStep: ProcessingStep = {
      id: newStepId,
      code: selectedTypeToAdd,
      name: typeObj?.name || selectedTypeToAdd,
      operator: "",
      notes: "",
      customFields: Array.isArray(typeObj?.customFields) ? typeObj.customFields : [],
      rows: [
        { bundleNo: "", species: inputRows[0]?.species || "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: inputRows[0]?.species || "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
        { bundleNo: "", species: inputRows[0]?.species || "", t: "", w: "", l: "", pcs: "", volumeM3: 0, customData: {} },
      ],
    };
    setSteps(prev => [...prev, newStep]);
    setActiveSheetTab(newStepId);
    toast({ title: "Tahap Ditambahkan", description: `Tahap "${newStep.name}" berhasil ditambahkan ke alur project.` });
  };

  const handleRemoveStep = (stepIndex: number) => {
    if (steps.length <= 1) {
      toast({ title: "Peringatan", description: "Project minimal harus memiliki 1 tahap proses.", variant: "destructive" });
      return;
    }
    const stepName = steps[stepIndex].name;
    setSteps(prev => prev.filter((_, idx) => idx !== stepIndex));
    toast({ title: "Tahap Dihapus", description: `Tahap ${stepName} dihapus dari urutan project.` });
  };

  const handleMoveStep = (stepIndex: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && stepIndex === 0) return;
    if (direction === "DOWN" && stepIndex === steps.length - 1) return;
    setSteps(prev => {
      const updated = [...prev];
      const targetIdx = direction === "UP" ? stepIndex - 1 : stepIndex + 1;
      const temp = updated[stepIndex];
      updated[stepIndex] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  // Navigasi Vertikal Enter sperti Excel
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prefix: string,
    rowIndex: number,
    columnKey: string,
    stepIndex?: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const isInput = prefix === "input";
      const totalRows = isInput ? inputRows.length : (steps[stepIndex ?? 0]?.rows.length || 0);
      const nextRow = rowIndex + 1;

      // Auto add row if at bottom
      if (nextRow >= totalRows) {
        if (isInput) {
          addInputRows(3);
        } else if (stepIndex !== undefined) {
          addStepRows(stepIndex, 3);
        }
      }

      setTimeout(() => {
        const nextId = `${prefix}-${columnKey}-${nextRow}`;
        const nextInput = document.getElementById(nextId) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 50);
    }
  };

  // Valid rows & Kubikasi Totals
  const validInputs = inputRows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseFloat(r.w) || 0) > 0 && (parseFloat(r.l) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
  const totalInputPcs = validInputs.reduce((acc, r) => acc + (parseInt(r.pcs) || 0), 0);
  const totalInputM3 = validInputs.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);

  // Final Step Output
  const lastStepIndex = steps.length - 1;
  const lastStep = steps[lastStepIndex];
  const validFinalOutputs = (lastStep?.rows || []).filter(r => (parseFloat(r.t) || 0) > 0 && (parseFloat(r.w) || 0) > 0 && (parseFloat(r.l) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
  const totalFinalOutputPcs = validFinalOutputs.reduce((acc, r) => acc + (parseInt(r.pcs) || 0), 0);
  const totalFinalOutputM3 = validFinalOutputs.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);

  const cumulativeYield = totalInputM3 > 0 ? (totalFinalOutputM3 / totalInputM3) * 100 : 0;

  // Pipeline Process Type string (e.g. "GESEK -> KD -> MOULDING")
  const pipelineCode = steps.map(s => s.code).join("-");

  const handleSubmit = async (status: "DRAFT" | "CONFIRMED") => {
    if (!processNo.trim()) {
      return toast({ title: "Validasi Gagal", description: "Nomor Project / Proses wajib diisi", variant: "destructive" });
    }
    if (steps.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal tentukan 1 alur tahap proses", variant: "destructive" });
    }
    if (validInputs.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Bahan Input Awal belum diisi. Isi minimal 1 baris ukuran kayu awal yang dipotong kubikasinya.", variant: "destructive" });
    }
    if (validFinalOutputs.length === 0) {
      return toast({ title: "Validasi Gagal", description: `Tahap akhir (${lastStep?.name}) belum memiliki baris hasil ukuran. Isi minimal 1 baris ukuran produk jadi.`, variant: "destructive" });
    }

    setSubmitting(true);
    setPageError(null);
    try {
      // Siapkan Structured Multi-Step Metadata untuk disimpan di field `notes`
      const projectMetadata = {
        isProject: true,
        projectName: projectName.trim() || `Project ${pipelineCode}`,
        pipeline: steps.map((s, idx) => {
          const vRows = s.rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
          const vM3 = vRows.reduce((sum, r) => sum + (r.volumeM3 || 0), 0);
          const vPcs = vRows.reduce((sum, r) => sum + (parseInt(r.pcs) || 0), 0);
          return {
            stepIndex: idx + 1,
            code: s.code,
            name: s.name,
            operator: s.operator,
            notes: s.notes,
            customFields: s.customFields || [],
            totalPcs: vPcs,
            totalVolumeM3: Number(vM3.toFixed(4)),
            isFinal: idx === lastStepIndex,
            rows: vRows,
          };
        }),
        generalNotes: generalNotes.trim(),
        cumulativeYieldPct: Number(cumulativeYield.toFixed(2)),
      };

      const payload = {
        processNo: processNo.trim(),
        processType: pipelineCode,
        processDate: date,
        status: status,
        notes: JSON.stringify(projectMetadata),
        inputVolumeM3: Number(totalInputM3.toFixed(4)),
        outputVolumeM3: Number(totalFinalOutputM3.toFixed(4)),
        partaiId: urlPartaiId || null,
        targetWarehouseId: targetWarehouseId || null,
        // 1. Bahan Input Awal (DIPOTONG DARI STOK)
        inputs: validInputs.map((item, idx) => ({
          bundleNo: item.bundleNo || `IN-${idx + 1}`,
          species: item.species || "KAYU",
          thickness: Number(item.t),
          width: Number(item.w),
          length: Number(item.l),
          quantityPCS: Number(item.pcs),
          volumeM3: Number(item.volumeM3),
          warehouseId: targetWarehouseId || null,
        })),
        // 2. Hasil Output Tahap Terakhir (DITAMBAHKAN KE STOK WAREHOUSE)
        outputs: validFinalOutputs.map((item, idx) => ({
          outputType: "PRODUCT",
          bundleNo: item.bundleNo || `OUT-${lastStep.code}-${idx + 1}`,
          species: item.species || "KAYU",
          grade: lastStep.code, // Label grade sesuai tahap akhir
          thickness: Number(item.t),
          width: Number(item.w),
          length: Number(item.l),
          quantityPCS: Number(item.pcs),
          volumeM3: Number(item.volumeM3),
          warehouseId: targetWarehouseId || null,
        })),
      };

      const res = await ProductionAPI.createProcess(payload);

      if (status === "CONFIRMED" && res?.id) {
        await ProductionAPI.confirmProcess(res.id).catch(() => {});
      }

      toast({ 
        title: "Project Processing Berhasil Disimpan!", 
        description: `Project ${processNo} (${pipelineCode}) berhasil disimpan ${status === "CONFIRMED" ? "dan mutasi stok fisik dieksekusi." : "sebagai DRAFT."}`
      });

      setTimeout(() => {
        if (urlPartaiId) {
          router.push(`/inventory/partai/${urlPartaiId}?tab=processing`);
        } else {
          router.push("/production/processing");
        }
      }, 700);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error?.message || err.message || "Terjadi kesalahan sistem saat menyimpan project";
      setPageError(errMsg);
      toast({ 
        title: "Gagal Menyimpan Project", 
        description: errMsg, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (urlPartaiId) router.push(`/inventory/partai/${urlPartaiId}?tab=processing`);
              else router.push("/production/processing");
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Boxes className="w-6 h-6 text-primary" />
              Project Multi-Step Processing Kayu
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tentukan alur proses berantai (Gesek &rarr; KD &rarr; Moulding dll). Stok awal dipotong, WIP dihitung, dan hanya hasil akhir yang masuk stok.
            </p>
          </div>
        </div>

        {/* BUTTON MASTER DATA LINK */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/inventory/master-data/processing", "_blank")}
            className="text-xs flex items-center gap-1.5"
          >
            <Cog className="w-3.5 h-3.5" />
            Kelola Master Data Proses
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
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

      {/* PROJECT CONFIGURATION CARD */}
      <Card className="border shadow-sm">
        <CardHeader className="py-4 px-5 border-b bg-muted/15">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            1. Informasi Project & Lokasi Gudang
          </CardTitle>
          <CardDescription className="text-xs">
            Atur identitas project, tanggal pengerjaan, dan lokasi gudang tempat mutasi stok berlangsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nama / Judul Project</Label>
            <Input 
              placeholder="Contoh: Project KD & Moulding Merbau Batch 1" 
              value={projectName} 
              onChange={e => setProjectName(e.target.value)} 
              className="text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">No. SPK / Project <span className="text-rose-500">*</span></Label>
            <Input 
              value={processNo} 
              onChange={e => setProcessNo(e.target.value)} 
              className="text-xs font-mono font-bold" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tanggal Mulai Pengerjaan</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gudang Penyimpanan</Label>
            <Select value={targetWarehouseId} onValueChange={(val) => setTargetWarehouseId(val || "")}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih Gudang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 md:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold">Catatan Umum / Instruksi Khusus</Label>
            <Input 
              placeholder="Catatan tambahan untuk seluruh rangkaian proses..." 
              value={generalNotes} 
              onChange={e => setGeneralNotes(e.target.value)} 
              className="text-xs" 
            />
          </div>
        </CardContent>
      </Card>

      {/* PIPELINE ROUTE BUILDER */}
      <Card className="border shadow-sm border-primary/20 bg-primary/5 dark:bg-card">
        <CardHeader className="py-4 px-5 border-b bg-primary/10 dark:bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                2. Alur Rangkaian Proses (Pipeline Sequence)
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih tahapan proses yang akan dilalui secara berurutan. Anda bisa menambah atau menghapus tahap kapan saja.
              </CardDescription>
            </div>

            {/* ADD STEP CONTROLS */}
            <div className="flex items-center gap-2">
              <Select value={selectedTypeToAdd} onValueChange={(val) => setSelectedTypeToAdd(val || "")}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih Tahap" />
                </SelectTrigger>
                <SelectContent>
                  {masterProcessingTypes.map(t => (
                    <SelectItem key={t.id || t.code} value={t.code}>
                      {t.code} - {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAddStep} className="h-8 text-xs flex items-center gap-1 font-semibold">
                <Plus className="w-3.5 h-3.5" /> Tambah Tahap
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {/* VISUAL PIPELINE */}
          <div className="flex items-center flex-wrap gap-2 pt-1 pb-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 font-semibold text-xs shadow-xs">
              <ArrowDownCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Bahan Awal (Input)</span>
            </div>

            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs shadow-xs transition-all ${
                  idx === lastStepIndex 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold" 
                    : "bg-background border-border text-foreground font-medium"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{step.name}</span>
                  {idx === lastStepIndex && (
                    <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-emerald-600 hover:bg-emerald-600 text-white font-bold">
                      Hasil Akhir
                    </Badge>
                  )}
                  {steps.length > 1 && (
                    <button 
                      onClick={() => handleRemoveStep(idx)}
                      className="text-muted-foreground hover:text-rose-500 ml-1 font-bold text-sm leading-none"
                      title="Hapus tahap ini"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EXCEL SHEET TABS BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/80 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveSheetTab("input")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-xs whitespace-nowrap transition-all border-b-2 ${
            activeSheetTab === "input"
              ? "bg-card border-blue-600 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
              : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-transparent"
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Sheet 1: Bahan Awal (Input)</span>
          <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1 font-mono">
            {totalInputM3.toFixed(3)} M³
          </Badge>
        </button>

        {steps.map((step, idx) => {
          const isFinal = idx === lastStepIndex;
          const vRows = step.rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
          const sM3 = vRows.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);
          const isActive = activeSheetTab === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveSheetTab(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-xs whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? isFinal
                    ? "bg-card border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                    : "bg-card border-primary text-primary font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-transparent"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sheet {idx + 2}: {step.name}</span>
              {isFinal && (
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                  Stok Akhir
                </span>
              )}
              <Badge variant="outline" className="text-[10px] ml-0.5 py-0 px-1 font-mono">
                {sM3.toFixed(3)} M³
              </Badge>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveSheetTab("rekap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-xs whitespace-nowrap transition-all border-b-2 ${
            activeSheetTab === "rekap"
              ? "bg-card border-amber-600 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
              : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-transparent"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Rekapan Grand Total</span>
          <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1 font-mono text-amber-600 dark:text-amber-400">
            {cumulativeYield.toFixed(1)}% Yield
          </Badge>
        </button>
      </div>

      {/* TAB CONTENT 1: BAHAN INPUT AWAL */}
      {activeSheetTab === "input" && (
        <Card className="border shadow-sm border-blue-200 dark:border-blue-900/40 animate-in fade-in duration-200">
          <CardHeader className="py-3 px-4 md:px-5 border-b bg-blue-50/50 dark:bg-blue-950/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <ArrowDownCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Sheet 1: Data Bahan Baku Awal (Stok Berkurang)
              </CardTitle>
              <CardDescription className="text-xs text-blue-700/80 dark:text-blue-400/80">
                Isi ukuran kayu awal yang diambil untuk diproses. Kubikasi: <span className="font-mono font-bold">(T cm × L cm × P cm × Pcs) / 1.000.000</span>. Tekan <kbd className="px-1 py-0.5 border rounded bg-background text-[10px]">Enter</kbd> untuk lompat ke baris bawah.
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 block">Total Bahan Awal:</span>
              <span className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400">{totalInputPcs} Pcs • {totalInputM3.toFixed(4)} M³</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs">
                    <TableHead className="w-[45px] text-center">No</TableHead>
                    <TableHead className="w-[140px]">Bundle / No Seri</TableHead>
                    <TableHead className="w-[150px]">Jenis Kayu</TableHead>
                    <TableHead className="w-[85px] text-center">T (cm)</TableHead>
                    <TableHead className="w-[85px] text-center">L (cm)</TableHead>
                    <TableHead className="w-[85px] text-center">P (cm)</TableHead>
                    <TableHead className="w-[85px] text-center">Pcs</TableHead>
                    <TableHead className="w-[110px] text-right font-bold pr-4">Kubikasi (M³)</TableHead>
                    <TableHead className="w-[45px] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inputRows.map((row, idx) => (
                    <TableRow key={`input-${idx}`} className="hover:bg-muted/20">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <Input
                          id={`input-bundle-${idx}`}
                          placeholder="Contoh: BND-01"
                          value={row.bundleNo}
                          onChange={e => handleInputChange(idx, "bundleNo", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, "input", idx, "bundle")}
                          className="h-8 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.species || (speciesList[0]?.name || "MERBAU")}
                          onValueChange={(val) => handleInputChange(idx, "species", val)}
                        >
                          <SelectTrigger
                            id={`input-species-${idx}`}
                            className="h-8 text-xs font-semibold uppercase justify-between bg-transparent border-input"
                          >
                            <SelectValue placeholder="Pilih Spesies">
                              {row.species || (speciesList[0]?.name || "MERBAU")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent searchable={true} className="min-w-[180px]">
                            {speciesList.map((s: any) => {
                              const val = (s.name || s.code || "").toUpperCase();
                              return (
                                <SelectItem key={s.id || s.code || val} value={val}>
                                  {s.name || s.code}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-1.5">
                        <Input
                          id={`input-t-${idx}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="T"
                          value={row.t}
                          onChange={e => handleInputChange(idx, "t", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, "input", idx, "t")}
                          className="h-8 text-xs font-mono text-center px-1"
                        />
                      </TableCell>
                      <TableCell className="px-1.5">
                        <Input
                          id={`input-w-${idx}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="L"
                          value={row.w}
                          onChange={e => handleInputChange(idx, "w", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, "input", idx, "w")}
                          className="h-8 text-xs font-mono text-center px-1"
                        />
                      </TableCell>
                      <TableCell className="px-1.5">
                        <Input
                          id={`input-l-${idx}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="P"
                          value={row.l}
                          onChange={e => handleInputChange(idx, "l", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, "input", idx, "l")}
                          className="h-8 text-xs font-mono text-center px-1"
                        />
                      </TableCell>
                      <TableCell className="px-1.5">
                        <Input
                          id={`input-pcs-${idx}`}
                          type="text"
                          inputMode="numeric"
                          placeholder="Pcs"
                          value={row.pcs}
                          onChange={e => handleInputChange(idx, "pcs", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, "input", idx, "pcs")}
                          className="h-8 text-xs font-mono text-center font-bold px-1"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400 pr-4">
                        {row.volumeM3 > 0 ? Number(row.volumeM3.toFixed(4)) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInputRow(idx)}
                          disabled={inputRows.length <= 1}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 bg-muted/10 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addInputRows(5)}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah 5 Baris
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-muted-foreground">
                  Total Bahan Masuk: <span className="font-bold text-blue-600 dark:text-blue-400">{totalInputM3.toFixed(4)} M³</span> ({totalInputPcs} Pcs)
                </div>
                {steps.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setActiveSheetTab(steps[0].id)}
                    className="h-8 text-xs gap-1 font-semibold"
                  >
                    Lanjut ke {steps[0].name} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 2: INDIVIDUAL PROCESSING STEP SHEETS */}
      {steps.map((step, sIdx) => {
        if (activeSheetTab !== step.id) return null;

        const isFinal = sIdx === lastStepIndex;
        const validStepRows = step.rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
        const stepTotalPcs = validStepRows.reduce((sum, r) => sum + (parseInt(r.pcs) || 0), 0);
        const stepTotalM3 = validStepRows.reduce((sum, r) => sum + (r.volumeM3 || 0), 0);
        
        // Yield terhadap tahap sebelumnya
        const prevStageM3 = sIdx === 0 
          ? totalInputM3 
          : steps[sIdx - 1].rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0).reduce((sum, r) => sum + (r.volumeM3 || 0), 0);
        const stepYield = prevStageM3 > 0 ? (stepTotalM3 / prevStageM3) * 100 : 0;

        const stepCustomFields = step.customFields || [];

        return (
          <Card 
            key={step.id} 
            className={`border shadow-sm animate-in fade-in duration-200 transition-all ${
              isFinal 
                ? "border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20" 
                : "border-border"
            }`}
          >
            <CardHeader className={`py-3 px-4 md:px-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isFinal ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "bg-muted/30"
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {sIdx + 2}
                  </span>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Sheet {sIdx + 2}: {step.name} ({step.code})
                  </CardTitle>
                  {isFinal ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px] font-bold text-white">
                      PRODUK AKHIR (MASUK STOK GUDANG)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                      Work-In-Progress (WIP)
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {isFinal 
                    ? "Tahap terakhir: Hasil ukuran di tabel ini akan otomatis ditambahkan ke saldo inventori fisik gudang." 
                    : "Tahap perantara: Hasil dicatat sebagai riwayat transformasi alur tanpa membebani stok umum."}
                </CardDescription>
              </div>

              {/* STEP ACTIONS & METRICS */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-right mr-2">
                  <span className="text-[10px] text-muted-foreground block">Rendemen Tahap:</span>
                  <span className="text-xs font-mono font-bold">
                    {stepYield.toFixed(1)}% <span className="text-muted-foreground font-normal">({stepTotalM3.toFixed(4)} M³)</span>
                  </span>
                </div>

                {/* Copy helper */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyFromPreviousStage(sIdx)}
                  className="h-7 text-[11px] flex items-center gap-1 bg-background"
                  title="Salin ukuran dari tahap sebelumnya"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                  Salin dari {sIdx === 0 ? "Bahan Input" : steps[sIdx - 1].name}
                </Button>

                {/* Move Up/Down */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveStep(sIdx, "UP")}
                  disabled={sIdx === 0}
                  className="h-7 w-7 text-xs"
                  title="Geser urutan alur ke kiri"
                >
                  &larr;
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveStep(sIdx, "DOWN")}
                  disabled={sIdx === steps.length - 1}
                  className="h-7 w-7 text-xs"
                  title="Geser urutan alur ke kanan"
                >
                  &rarr;
                </Button>
              </div>
            </CardHeader>

            {/* STEP METADATA (OPERATOR & NOTES) */}
            <div className="px-5 py-2.5 bg-muted/10 border-b grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-semibold text-muted-foreground w-28">Operator / Shift:</Label>
                <Input 
                  placeholder="Nama operator atau no mesin..." 
                  value={step.operator}
                  onChange={e => {
                    const val = e.target.value;
                    setSteps(prev => {
                      const copy = [...prev];
                      copy[sIdx].operator = val;
                      return copy;
                    });
                  }}
                  className="h-7 text-xs bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-semibold text-muted-foreground w-24">Catatan Proses:</Label>
                <Input 
                  placeholder="Keterangan khusus (suhu oven, jenis pisau, dsb)..." 
                  value={step.notes}
                  onChange={e => {
                    const val = e.target.value;
                    setSteps(prev => {
                      const copy = [...prev];
                      copy[sIdx].notes = val;
                      return copy;
                    });
                  }}
                  className="h-7 text-xs bg-background"
                />
              </div>
            </div>

            {/* STEP TABLE WITH DYNAMIC CUSTOM FIELDS */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="text-xs">
                      <TableHead className="w-[45px] text-center">No</TableHead>
                      <TableHead className="w-[130px]">Bundle / Seri</TableHead>
                      
                      {/* DYNAMIC CUSTOM FIELDS HEADER PER PROSES */}
                      {stepCustomFields.map((cf) => (
                        <TableHead key={cf.key} className="w-[130px] font-semibold text-primary">
                          {cf.label}
                        </TableHead>
                      ))}

                      <TableHead className="w-[140px]">Jenis Kayu</TableHead>
                      <TableHead className="w-[85px] text-center">T (cm)</TableHead>
                      <TableHead className="w-[85px] text-center">L (cm)</TableHead>
                      <TableHead className="w-[85px] text-center">P (cm)</TableHead>
                      <TableHead className="w-[85px] text-center">Pcs</TableHead>
                      <TableHead className={`w-[110px] text-right font-bold pr-4 ${isFinal ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                        Kubikasi (M³)
                      </TableHead>
                      <TableHead className="w-[45px] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {step.rows.map((row, rIdx) => (
                      <TableRow key={`step-${sIdx}-row-${rIdx}`} className="hover:bg-muted/20">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{rIdx + 1}</TableCell>
                        <TableCell>
                          <Input
                            id={`step-${sIdx}-bundle-${rIdx}`}
                            placeholder="Seri / Batch"
                            value={row.bundleNo}
                            onChange={e => handleStepRowChange(sIdx, rIdx, "bundleNo", e.target.value)}
                            onKeyDown={e => handleKeyDown(e, `step-${sIdx}`, rIdx, "bundle", sIdx)}
                            className="h-8 text-xs font-mono"
                          />
                        </TableCell>

                        {/* DYNAMIC CUSTOM FIELDS INPUT */}
                        {stepCustomFields.map((cf) => (
                          <TableCell key={cf.key}>
                            <Input
                              placeholder={cf.placeholder || cf.label}
                              value={row.customData?.[cf.key] || ""}
                              onChange={e => handleStepRowChange(sIdx, rIdx, cf.key, e.target.value, true)}
                              className="h-8 text-xs bg-background"
                            />
                          </TableCell>
                        ))}

                        <TableCell>
                          <Select
                            value={row.species || (speciesList[0]?.name || "MERBAU")}
                            onValueChange={(val) => handleStepRowChange(sIdx, rIdx, "species", val)}
                          >
                            <SelectTrigger
                              id={`step-${sIdx}-species-${rIdx}`}
                              className="h-8 text-xs font-semibold uppercase justify-between bg-transparent border-input"
                            >
                              <SelectValue placeholder="Pilih Spesies">
                                {row.species || (speciesList[0]?.name || "MERBAU")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent searchable={true} className="min-w-[180px]">
                              {speciesList.map((s: any) => {
                                const val = (s.name || s.code || "").toUpperCase();
                                return (
                                  <SelectItem key={s.id || s.code || val} value={val}>
                                    {s.name || s.code}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-1.5">
                          <Input
                            id={`step-${sIdx}-t-${rIdx}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="T"
                            value={row.t}
                            onChange={e => handleStepRowChange(sIdx, rIdx, "t", e.target.value)}
                            onKeyDown={e => handleKeyDown(e, `step-${sIdx}`, rIdx, "t", sIdx)}
                            className="h-8 text-xs font-mono text-center px-1"
                          />
                        </TableCell>
                        <TableCell className="px-1.5">
                          <Input
                            id={`step-${sIdx}-w-${rIdx}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="L"
                            value={row.w}
                            onChange={e => handleStepRowChange(sIdx, rIdx, "w", e.target.value)}
                            onKeyDown={e => handleKeyDown(e, `step-${sIdx}`, rIdx, "w", sIdx)}
                            className="h-8 text-xs font-mono text-center px-1"
                          />
                        </TableCell>
                        <TableCell className="px-1.5">
                          <Input
                            id={`step-${sIdx}-l-${rIdx}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="P"
                            value={row.l}
                            onChange={e => handleStepRowChange(sIdx, rIdx, "l", e.target.value)}
                            onKeyDown={e => handleKeyDown(e, `step-${sIdx}`, rIdx, "l", sIdx)}
                            className="h-8 text-xs font-mono text-center px-1"
                          />
                        </TableCell>
                        <TableCell className="px-1.5">
                          <Input
                            id={`step-${sIdx}-pcs-${rIdx}`}
                            type="text"
                            inputMode="numeric"
                            placeholder="Pcs"
                            value={row.pcs}
                            onChange={e => handleStepRowChange(sIdx, rIdx, "pcs", e.target.value)}
                            onKeyDown={e => handleKeyDown(e, `step-${sIdx}`, rIdx, "pcs", sIdx)}
                            className="h-8 text-xs font-mono text-center font-bold px-1"
                          />
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold text-xs pr-4 ${isFinal ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                          {row.volumeM3 > 0 ? Number(row.volumeM3.toFixed(4)) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStepRow(sIdx, rIdx)}
                            disabled={step.rows.length <= 1}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 bg-muted/10 border-t flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStepRows(sIdx, 3)}
                  className="h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah 3 Baris Ukuran
                </Button>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    Subtotal Sheet: <span className={`font-bold ${isFinal ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{stepTotalM3.toFixed(4)} M³</span> ({stepTotalPcs} Pcs)
                  </div>
                  {sIdx < steps.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setActiveSheetTab(steps[sIdx + 1].id)}
                      className="h-8 text-xs gap-1 font-semibold"
                    >
                      Lanjut ke {steps[sIdx + 1].name} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setActiveSheetTab("rekap")}
                      className="h-8 text-xs gap-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Lihat Rekapan Grand Total <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* TAB CONTENT 3: REKAPAN GRAND TOTAL SHEET */}
      {activeSheetTab === "rekap" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border shadow-md bg-card">
            <CardHeader className="py-4 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Rekapan Grand Total Alur Folder Processing
                </CardTitle>
                <CardDescription className="text-xs">
                  Ringkasan transformasi kubikasi dari bahan awal (Input), tahapan perantara (WIP), hingga produk jadi akhir yang masuk ke stok inventori.
                </CardDescription>
              </div>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs font-mono">
                {steps.length} Tahap Pemrosesan
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs">
                    <TableHead className="w-[80px]">Sheet / Urutan</TableHead>
                    <TableHead>Nama Proses / Tahapan</TableHead>
                    <TableHead>Status Mutasi Inventori</TableHead>
                    <TableHead className="text-center">Total Batang (PCS)</TableHead>
                    <TableHead className="text-right">Volume (M³)</TableHead>
                    <TableHead className="text-right">Rendemen (%)</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Row 1: Bahan Awal */}
                  <TableRow className="bg-blue-50/30 dark:bg-blue-950/20">
                    <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">Sheet 1</TableCell>
                    <TableCell className="font-semibold text-foreground">Bahan Baku Awal (Input)</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-600 text-white text-[10px]">
                        Stok Dipotong (Keluar)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">{totalInputPcs} PCS</TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">{totalInputM3.toFixed(4)} M³</TableCell>
                    <TableCell className="text-right font-mono">100% (Baseline)</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" onClick={() => setActiveSheetTab("input")} className="h-7 text-xs">
                        Buka Sheet
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Rows 2..N: Steps */}
                  {steps.map((step, idx) => {
                    const isFinal = idx === lastStepIndex;
                    const vRows = step.rows.filter(r => (parseFloat(r.t) || 0) > 0 && (parseInt(r.pcs) || 0) > 0);
                    const sPcs = vRows.reduce((acc, r) => acc + (parseInt(r.pcs) || 0), 0);
                    const sM3 = vRows.reduce((acc, r) => acc + (r.volumeM3 || 0), 0);
                    const sYield = totalInputM3 > 0 ? (sM3 / totalInputM3) * 100 : 0;

                    return (
                      <TableRow 
                        key={step.id} 
                        className={isFinal ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold" : "hover:bg-muted/10"}
                      >
                        <TableCell className="font-mono text-xs font-bold">Sheet {idx + 2}</TableCell>
                        <TableCell className="font-medium text-foreground flex items-center gap-2">
                          {step.name} ({step.code})
                          {step.customFields && step.customFields.length > 0 && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({step.customFields.map(c => c.label).join(", ")})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isFinal ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                              Masuk Inventori Gudang (IN)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Work-In-Progress (WIP)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">{sPcs} PCS</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isFinal ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                          {sM3.toFixed(4)} M³
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {sYield.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" onClick={() => setActiveSheetTab(step.id)} className="h-7 text-xs">
                            Buka Sheet
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUMMARY DASHBOARD CARD (ALWAYS VISIBLE AT BOTTOM) */}
      <Card className="border shadow-md bg-gradient-to-r from-blue-50/50 via-background to-emerald-50/50 dark:from-blue-950/20 dark:via-card dark:to-emerald-950/20">
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Bahan Awal (Input)
              </span>
              <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
                {totalInputM3.toFixed(4)} <span className="text-sm font-normal">M³</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{totalInputPcs} PCS kayu dipotong</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Hasil Akhir (Output)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {totalFinalOutputM3.toFixed(4)} <span className="text-sm font-normal">M³</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{totalFinalOutputPcs} PCS produk jadi masuk stok</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Rendemen Kumulatif
              </span>
              <div className="text-2xl font-bold font-mono text-foreground">
                {cumulativeYield.toFixed(1)}%
              </div>
              <p className="text-[11px] text-muted-foreground">Rasio konversi dari bahan awal</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSubmit("CONFIRMED")}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Konfirmasi & Mutasi Stok
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit("DRAFT")}
                disabled={submitting}
                className="w-full h-8 text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Simpan Sebagai Draft
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
