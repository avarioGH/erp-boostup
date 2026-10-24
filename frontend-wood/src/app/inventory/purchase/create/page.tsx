"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api, MasterDataAPI, PartaiAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, ArrowLeft, Sparkles, Save, RotateCcw, Copy, Clipboard, CheckCircle2, CloudOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SawnTimberSpreadsheet, SawnTallyRow } from "@/components/timber/sawn-timber-spreadsheet"
import { AiTallyImportModal } from "@/components/timber/ai-tally-import-modal"



  const calculateLogVolume = (length: number, d1: number, d2: number, rtManual?: number) => {
    if (!length) return 0;
    const pkl = Number(d1) || 0;
    const ujung = Number(d2) || 0;
    let rt = typeof rtManual === "number" && rtManual > 0 ? rtManual : 0;
    if (!rt) {
      if (pkl > 0 && ujung > 0) {
        rt = (pkl + ujung) / 2;
      } else {
        rt = pkl || ujung || 0;
      }
    }

    // Length in cm (if <= 50, assumed in meters so convert to cm)
    const lengthCm = length <= 50 ? length * 100 : length;

    // Rumus revisi user (konsisten dengan excel4.xlsx INPUT LOG): 0.7854 * panjang * RT * RT / 1000000
    if (rt > 0) {
      return Number(((0.7854 * lengthCm * rt * rt) / 1000000).toFixed(4));
    }
    return 0;
  };


const SearchableSelect = ({ value, onChange, options, placeholder, onAdd }: any) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((o: any) => o.value === value)

  return (
    <div className="flex gap-2 w-full">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-10 flex-1 justify-between items-center px-3 py-2 bg-background border border-input rounded-md text-sm font-normal hover:bg-accent hover:text-accent-foreground">
          {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={"Cari..."} />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {options.map((option: any) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    {onAdd && (
      <Button type="button" variant="outline" onClick={onAdd} title="Tambah Baru" className="px-3"><Plus className="w-4 h-4" /></Button>
    )}
    </div>
  )
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partaiIdFromUrl = searchParams.get('partaiId') || '';
  const typeFromUrl = searchParams.get('type') || '';
  const initialPurchaseType = (typeFromUrl === 'raw-log' || typeFromUrl === 'log') ? 'raw-log' : 'sawn-timber';

  const DEFAULT_SPECIES = [
    { id: "sp-merbau", code: "MRB", name: "MERBAU" },
    { id: "sp-meranti", code: "MRT", name: "MERANTI" },
    { id: "sp-bengkirai", code: "BKR", name: "BENGKIRAI" },
    { id: "sp-ulin", code: "ULN", name: "ULIN" },
    { id: "sp-kenari", code: "KNR", name: "KENARI" },
    { id: "sp-jati", code: "JTI", name: "JATI" },
    { id: "sp-kampas", code: "KMP", name: "KAMPAS" },
    { id: "sp-keruing", code: "KRW", name: "KERUING" },
    { id: "sp-sonokeling", code: "SNK", name: "SONOKELING" },
    { id: "sp-mahoni", code: "MHG", name: "MAHONI" },
    { id: "sp-lokal", code: "LKL", name: "LOKAL" },
  ];

  const [partais, setPartais] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [speciesList, setSpeciesList] = useState<any[]>(DEFAULT_SPECIES)
  const [gradeList, setGradeList] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (partaiIdFromUrl) {
      setForm(prev => ({ ...prev, partaiId: partaiIdFromUrl }));
    }
    if (typeFromUrl === 'raw-log' || typeFromUrl === 'log') {
      setForm(prev => ({ ...prev, purchaseType: 'raw-log' }));
    } else if (typeFromUrl === 'sawn-timber') {
      setForm(prev => ({ ...prev, purchaseType: 'sawn-timber' }));
    }
  }, [partaiIdFromUrl, typeFromUrl]);

  const handleBack = () => {
    const targetPartaiId = searchParams.get('partaiId') || form.partaiId;
    const fromTab = searchParams.get('tab') || (form.purchaseType === 'raw-log' ? 'rawlogs' : 'purchase');
    if (targetPartaiId) {
      router.push(`/inventory/partai/${targetPartaiId}?tab=${fromTab}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push('/inventory/partai');
    }
  };
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [activeVariantRowIndex, setActiveVariantRowIndex] = useState<number>(0)
  const [newVariant, setNewVariant] = useState({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" })
  const [creatingVariant, setCreatingVariant] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
  const [creatingSupplier, setCreatingSupplier] = useState(false)

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplierName) return;
    setCreatingSupplier(true)
    try {
      const res = await api.post('/inventory/master-data/timber-source', { name: newSupplierName, code: "SUP-" + Math.floor(Math.random() * 10000), type: "SUPPLIER" })
      setSources([res.data, ...sources])
      setForm({...form, sourceId: res.data.id})
      setIsSupplierModalOpen(false)
      setNewSupplierName("")
    } catch (err: any) {
      console.error(err)
    } finally {
      setCreatingSupplier(false)
    }
  }

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVariant.species) {
      alert("Silakan pilih Species (Jenis Kayu)")
      return
    }
    if (!newVariant.grade) {
      alert("Silakan pilih Grade (Kualitas)")
      return
    }
    setCreatingVariant(true)
    try {
      const payload = {
        species: (newVariant.species || "").trim().toUpperCase(),
        speciesId: newVariant.speciesId || undefined,
        grade: (newVariant.grade || "").trim().toUpperCase(),
        gradeId: newVariant.gradeId || undefined,
        thickness: Number(newVariant.thickness || 0),
        width: Number(newVariant.width || 0),
        length: Number(newVariant.length || 0),
      }

      // Check if this variant already exists in local list
      const existingLocal = variants.find(v =>
        (v.species || "").trim().toUpperCase() === payload.species &&
        (v.grade || "").trim().toUpperCase() === payload.grade &&
        Number(v.thickness || 0) === payload.thickness &&
        Number(v.width || 0) === payload.width &&
        Number(v.length || 0) === payload.length
      );

      if (existingLocal) {
        const newItems = [...form.items];
        const targetIdx = activeVariantRowIndex >= 0 && activeVariantRowIndex < newItems.length ? activeVariantRowIndex : 0;
        if (newItems[targetIdx]) {
          newItems[targetIdx].timberVariantId = existingLocal.id;
          newItems[targetIdx].purchaseThickness = existingLocal.thickness || payload.thickness;
          newItems[targetIdx].purchaseWidth = existingLocal.width || payload.width;
          newItems[targetIdx].purchaseLength = existingLocal.length || payload.length;
          newItems[targetIdx].volumeM3 = (existingLocal.volumePerPiece || 0) * (newItems[targetIdx].quantityPcs || 1);
          setForm(prev => ({ ...prev, items: newItems }));
        }
        setIsVariantModalOpen(false);
        setNewVariant({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" });
        return;
      }

      let res: any = null;
      try {
        res = await MasterDataAPI.createTimberVariant(payload);
      } catch (apiErr: any) {
        const errMsg = apiErr?.response?.data?.message || apiErr.message || "";
        if (errMsg.includes("duplikat") || errMsg.includes("DUPLICATE_ENTRY") || errMsg.includes("terdaftar")) {
          const freshData = await MasterDataAPI.getTimberVariants().catch(() => []);
          const freshList = Array.isArray(freshData) ? freshData : freshData?.data || [];
          setVariants(freshList);

          const found = freshList.find((v: any) =>
            (v.species || "").trim().toUpperCase() === payload.species &&
            (v.grade || "").trim().toUpperCase() === payload.grade &&
            Number(v.thickness || 0) === payload.thickness &&
            Number(v.width || 0) === payload.width &&
            Number(v.length || 0) === payload.length
          ) || freshList.find((v: any) =>
            (v.sku || "").toUpperCase().includes(payload.species) &&
            Number(v.thickness || 0) === payload.thickness &&
            Number(v.width || 0) === payload.width &&
            Number(v.length || 0) === payload.length
          ) || freshList.find((v: any) => (v.sku || "").toUpperCase() === `${payload.species}-${payload.grade}-${payload.thickness}X${payload.width}X${payload.length}`)
          || freshList.find((v: any) => (v.sku || "").toUpperCase() === `${payload.species}-${payload.grade}-${payload.thickness}x${payload.width}x${payload.length}`);

          if (found) {
            res = found;
          } else {
            alert("Master produk kayu dengan ukuran ini sudah ada di database, silakan pilih langsung dari dropdown.");
            return;
          }
        } else {
          alert("Gagal menyimpan master kayu: " + errMsg);
          return;
        }
      }

      if (res && res.id) {
        setVariants(prev => {
          const exists = prev.some(v => v.id === res.id);
          return exists ? prev.map(v => v.id === res.id ? res : v) : [res, ...prev];
        });

        const newItems = [...form.items];
        const targetIdx = activeVariantRowIndex >= 0 && activeVariantRowIndex < newItems.length ? activeVariantRowIndex : 0;
        if (newItems[targetIdx]) {
          newItems[targetIdx].timberVariantId = res.id;
          newItems[targetIdx].purchaseThickness = res.thickness || payload.thickness;
          newItems[targetIdx].purchaseWidth = res.width || payload.width;
          newItems[targetIdx].purchaseLength = res.length || payload.length;
          newItems[targetIdx].volumeM3 = (res.volumePerPiece || 0) * (newItems[targetIdx].quantityPcs || 1);
          setForm(prev => ({ ...prev, items: newItems }));
        }

        setIsVariantModalOpen(false)
        setNewVariant({ species: "", speciesId: "", grade: "", gradeId: "", thickness: "", width: "", length: "" })
      }
    } catch (err: any) {
      console.error("Failed to create variant", err)
      alert("Gagal menyimpan master kayu: " + (err?.response?.data?.message || err.message || "Pastikan koneksi server tersedia"));
    } finally {
      setCreatingVariant(false)
    }
  }
  
  const [form, setForm] = useState({
    partaiId: partaiIdFromUrl,
    purchaseNumber: "PO-" + Date.now().toString().slice(-6),
    purchaseDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    sourceId: "",
    warehouseId: "",
    notes: "",
    purchaseType: initialPurchaseType,
    status: "DRAFT",
    items: [{ 
      species: "",
      grade: "A",
      timberVariantId: "", 
      quantityPcs: 1, 
      volumeM3: 0, 
      purchaseThickness: 0, 
      purchaseWidth: 0, 
      purchaseLength: 0, 
      unitPrice: 0 
    }],
    logItems: [{
      logNumber: "",
      species: "",
      purchaseLength: 0,
      purchaseDiameter1: 0,
      purchaseDiameter2: 0,
      purchaseDiameterAvg: 0,
      purchaseVolume: 0
    }]
  const draftKey = `draft_purchase_${partaiIdFromUrl || 'general'}`;
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

  // Selection & Copy-Paste Range State for Log Table
  const [logSelection, setLogSelection] = useState<{
    startRow: number;
    startCol: string;
    endRow: number;
    endCol: string;
  } | null>(null);
  const [isSelectingLog, setIsSelectingLog] = useState(false);
  const [copiedData, setCopiedData] = useState<string[][] | null>(null);

  const LOG_COL_ORDER = ["logNumber", "species", "purchaseLength", "purchaseDiameter1", "purchaseDiameter2", "purchaseDiameterAvg", "purchaseVolume"];

  const getLogColIndex = (col: string) => LOG_COL_ORDER.indexOf(col);

  // Auto-Save Effect: Simpan perubahan form & logItems ke localStorage setiap ada perubahan
  useEffect(() => {
    if (!hasDraftRestored) return; // Tunggu restore draf pertama selesai
    const timer = setTimeout(() => {
      try {
        const hasContent = 
          (form.logItems && form.logItems.some((li: any) => li.logNumber || Number(li.purchaseLength) > 0 || Number(li.purchaseDiameter1) > 0 || Number(li.purchaseDiameter2) > 0)) ||
          (form.items && form.items.some((it: any) => Number(it.purchaseThickness) > 0 || Number(it.purchaseWidth) > 0 || Number(it.purchaseLength) > 0)) ||
          form.sourceId ||
          form.notes;

        if (hasContent && typeof window !== "undefined") {
          localStorage.setItem(draftKey, JSON.stringify({
            form,
            savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          }));
          setLastSavedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn("Gagal menyimpan auto-save draf:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form, hasDraftRestored, draftKey]);

  // Restore Draft On Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRaw = localStorage.getItem(draftKey);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed && parsed.form) {
            setForm(prev => ({
              ...prev,
              ...parsed.form,
              partaiId: partaiIdFromUrl || parsed.form.partaiId || prev.partaiId,
            }));
            if (parsed.savedAt) {
              setLastSavedTime(parsed.savedAt);
            }
          }
        }
      } catch (e) {
        console.warn("Gagal memuat draf tersimpan:", e);
      } finally {
        setHasDraftRestored(true);
      }
    } else {
      setHasDraftRestored(true);
    }
  }, [draftKey, partaiIdFromUrl]);

  const clearLocalDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(draftKey);
      setLastSavedTime(null);
    }
  };

  // Helper Copy Range untuk Log Table
  const handleCopyLogSelection = () => {
    if (!logSelection) return;
    const minRow = Math.min(logSelection.startRow, logSelection.endRow);
    const maxRow = Math.max(logSelection.startRow, logSelection.endRow);
    const startCIdx = getLogColIndex(logSelection.startCol);
    const endCIdx = getLogColIndex(logSelection.endCol);
    const minCol = Math.min(startCIdx, endCIdx);
    const maxCol = Math.max(startCIdx, endCIdx);

    const matrix: string[][] = [];
    const tsvLines: string[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      const rowVals: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const colField = LOG_COL_ORDER[c];
        const val = form.logItems[r]?.[colField] ?? "";
        rowVals.push(String(val));
      }
      matrix.push(rowVals);
      tsvLines.push(rowVals.join("\t"));
    }

    setCopiedData(matrix);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(tsvLines.join("\n"));
    }
  };

  // Helper Paste Range ke Log Table (bisa ke kolom lain dengan isi persis)
  const handlePasteLogData = (targetRowIdx: number, targetColField: string, pastedTsvText?: string) => {
    let matrix: string[][] = [];

    if (pastedTsvText && pastedTsvText.includes("\t") || (pastedTsvText && pastedTsvText.includes("\n"))) {
      matrix = pastedTsvText.trim().split(/\r?\n/).map(line => line.split("\t"));
    } else if (pastedTsvText && pastedTsvText.trim().length > 0) {
      matrix = [[pastedTsvText.trim()]];
    } else if (copiedData && copiedData.length > 0) {
      matrix = copiedData;
    }

    if (!matrix || matrix.length === 0) return;

    const startCIdx = getLogColIndex(targetColField);
    if (startCIdx === -1) return;

    setForm(prev => {
      const nextLogItems = [...prev.logItems];
      const neededRows = targetRowIdx + matrix.length;
      while (nextLogItems.length < neededRows) {
        nextLogItems.push({
          logNumber: "",
          species: "",
          purchaseLength: 0,
          purchaseDiameter1: 0,
          purchaseDiameter2: 0,
          purchaseDiameterAvg: 0,
          purchaseVolume: 0,
        });
      }

      matrix.forEach((rowVals, rOffset) => {
        const curRow = targetRowIdx + rOffset;
        const targetItem = { ...nextLogItems[curRow] };

        rowVals.forEach((val, cOffset) => {
          const colIdx = startCIdx + cOffset;
          if (colIdx < LOG_COL_ORDER.length) {
            const field = LOG_COL_ORDER[colIdx];
            const cleanVal = val.trim();

            if (field === "purchaseLength" || field === "purchaseDiameter1" || field === "purchaseDiameter2" || field === "purchaseDiameterAvg" || field === "purchaseVolume") {
              const numVal = parseFloat(cleanVal.replace(",", ".")) || 0;
              (targetItem as any)[field] = numVal;
            } else {
              (targetItem as any)[field] = cleanVal;
            }
          }
        });

        // Recalculate diameter average & volume
        const len = Number(targetItem.purchaseLength || 0);
        const d1 = Number(targetItem.purchaseDiameter1 || 0);
        const d2 = Number(targetItem.purchaseDiameter2 || 0);
        const autoRt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
        if (!targetItem.purchaseDiameterAvg || targetItem.purchaseDiameterAvg <= 0) {
          targetItem.purchaseDiameterAvg = autoRt;
        }
        targetItem.purchaseVolume = calculateLogVolume(len, d1, d2, targetItem.purchaseDiameterAvg);

        nextLogItems[curRow] = targetItem;
      });

      return { ...prev, logItems: nextLogItems };
    });
  };

  const isLogCellSelected = (rIdx: number, colField: string) => {
    if (!logSelection) return false;
    const minRow = Math.min(logSelection.startRow, logSelection.endRow);
    const maxRow = Math.max(logSelection.startRow, logSelection.endRow);
    const startCIdx = getLogColIndex(logSelection.startCol);
    const endCIdx = getLogColIndex(logSelection.endCol);
    const minCol = Math.min(startCIdx, endCIdx);
    const maxCol = Math.max(startCIdx, endCIdx);
    const curCIdx = getLogColIndex(colField);

    return rIdx >= minRow && rIdx <= maxRow && curCIdx >= minCol && curCIdx <= maxCol;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [srcRes, whRes, varRes, specRes, gradeRes, partaisRes] = await Promise.all([
          api.get("/inventory/master-data/timber-source").catch(() => ({ data: [] })),
          api.get("/inventory/warehouses").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-variant").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-species").catch(() => ({ data: [] })),
          api.get("/inventory/master-data/timber-grade").catch(() => ({ data: [] })),
          PartaiAPI.getPartais().catch(() => [])
        ]);

        const rawSrc = srcRes?.data?.data || srcRes?.data || [];
        const rawWh = whRes?.data?.data || whRes?.data || [];
        const rawVar = varRes?.data?.data || varRes?.data || [];
        const rawSpec = specRes?.data?.data || specRes?.data || [];
        const rawGrade = gradeRes?.data?.data || gradeRes?.data || [];
        const rawPartais = Array.isArray(partaisRes) ? partaisRes : partaisRes?.data || [];

        const DEFAULT_GRADES = [
          { id: "grd-a", code: "A", name: "Grade A" },
          { id: "grd-b", code: "B", name: "Grade B" },
          { id: "grd-c", code: "C", name: "Grade C" },
          { id: "grd-afkir", code: "AFKIR", name: "Afkir" },
        ];

        setSources(Array.isArray(rawSrc) ? rawSrc : []);
        const whList = Array.isArray(rawWh) ? rawWh : [];
        setWarehouses(whList);
        setVariants(Array.isArray(rawVar) ? rawVar : []);

        // Combine default species with master data species from database
        if (Array.isArray(rawSpec) && rawSpec.length > 0) {
          const combined = [...rawSpec];
          DEFAULT_SPECIES.forEach(def => {
            if (!combined.some(s => (s.name || '').toUpperCase() === def.name.toUpperCase())) {
              combined.push(def);
            }
          });
          setSpeciesList(combined);
        } else {
          setSpeciesList(DEFAULT_SPECIES);
        }

        setGradeList(Array.isArray(rawGrade) && rawGrade.length > 0 ? rawGrade : DEFAULT_GRADES);
        setPartais(rawPartais);

        // Auto select active warehouse if set in localStorage
        if (typeof window !== "undefined") {
          const storedWh = localStorage.getItem("active_warehouse");
          if (storedWh) {
            try {
              const parsed = JSON.parse(storedWh);
              if (parsed && parsed.id) {
                setForm(prev => prev.warehouseId ? prev : ({ ...prev, warehouseId: parsed.id }));
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const addSawnRows = (count: number) => {
    const newRows = Array.from({ length: count }).map(() => ({
      species: "",
      grade: "A",
      timberVariantId: "",
      quantityPcs: 1,
      volumeM3: 0,
      purchaseThickness: 0,
      purchaseWidth: 0,
      purchaseLength: 0,
      unitPrice: 0,
    }));
    setForm(prev => ({
      ...prev,
      items: [...prev.items, ...newRows]
    }));
  };

  const addLogRows = (count: number) => {
    const newRows = Array.from({ length: count }).map(() => ({
      logNumber: "",
      species: "",
      purchaseLength: 0,
      purchaseDiameter1: 0,
      purchaseDiameter2: 0,
      purchaseDiameterAvg: 0,
      purchaseVolume: 0,
    }));
    setForm(prev => ({
      ...prev,
      logItems: [...prev.logItems, ...newRows]
    }));
  };

  const handleAiDataParsed = (parsedRows: any[]) => {
    if (!parsedRows || parsedRows.length === 0) return;

    if (form.purchaseType === 'raw-log') {
      const formatted = parsedRows.map((r, i) => {
        const length = Number(r.length) || 0;
        const d1 = Number(r.d1) || 0;
        const d2 = Number(r.d2) || d1;
        const rt = Number(r.rt) || ((d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0));
        const vol = calculateLogVolume(length, d1, d2, rt);

        return {
          logNumber: r.logNumber || `LOG-${i + 1}`,
          species: r.species ? r.species.toUpperCase() : "MERBAU",
          purchaseLength: length,
          purchaseDiameter1: d1,
          purchaseDiameter2: d2,
          purchaseDiameterAvg: rt,
          purchaseVolume: vol,
        };
      });

      setForm(prev => ({
        ...prev,
        logItems: formatted,
      }));
    } else {
      const formatted = parsedRows.map((r, i) => {
        const t = Number(r.thickness) || 0;
        const w = Number(r.width) || 0;
        const l = Number(r.length) || 0;
        const pcs = Number(r.pcs) || 1;
        const vol = (t > 0 && w > 0 && l > 0 && pcs > 0) ? Number(((t * w * l * pcs) / 1000000).toFixed(4)) : 0;

        return {
          species: r.species ? r.species.toUpperCase() : "MERBAU",
          grade: r.grade || "A",
          timberVariantId: "",
          purchaseThickness: t,
          purchaseWidth: w,
          purchaseLength: l,
          quantityPcs: pcs,
          volumeM3: vol,
          unitPrice: Number(r.unitPrice) || 0,
        };
      });

      setForm(prev => ({
        ...prev,
        items: formatted,
      }));
    }
  };


  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    field: string,
    type: 'sawn' | 'log',
    totalRows: number,
    addRowsFn: (count: number) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
        if (nextEl) {
          nextEl.focus();
          if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
            (nextEl as any).select();
          }
        }
      } else {
        addRowsFn(1);
        setTimeout(() => {
          const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
          if (nextEl) {
            nextEl.focus();
            if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
              (nextEl as any).select();
            }
          }
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      const nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        e.preventDefault();
        const nextEl = document.getElementById(`${type}-${field}-${nextRow}`);
        if (nextEl) {
          nextEl.focus();
          if ('select' in nextEl && typeof (nextEl as any).select === 'function') {
            (nextEl as any).select();
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        e.preventDefault();
        const prevEl = document.getElementById(`${type}-${field}-${prevRow}`);
        if (prevEl) {
          prevEl.focus();
          if ('select' in prevEl && typeof (prevEl as any).select === 'function') {
            (prevEl as any).select();
          }
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (type === 'log') {
        if (!logSelection || logSelection.startRow === logSelection.endRow && logSelection.startCol === logSelection.endCol) {
          // If no multi-cell selection, set selection to current cell then copy
          setLogSelection({
            startRow: rowIndex,
            startCol: field,
            endRow: rowIndex,
            endCol: field,
          });
          const val = (form.logItems[rowIndex] as any)?.[field] ?? "";
          setCopiedData([[String(val)]]);
          navigator.clipboard?.writeText?.(String(val));
        } else {
          handleCopyLogSelection();
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (type === 'log') {
        // Intercept paste to support multi-cell or single cell paste into another column
        navigator.clipboard?.readText?.().then((text) => {
          if (text) {
            handlePasteLogData(rowIndex, field, text);
          }
        }).catch(() => {
          if (copiedData) {
            handlePasteLogData(rowIndex, field);
          }
        });
      }
    }
  };

  const handleFillDownLog = (field: string, fromRowIdx: number = 0) => {
    const sourceVal = (form.logItems[fromRowIdx] as any)?.[field];
    if (sourceVal === undefined || sourceVal === null || sourceVal === "") return;
    setForm(prev => ({
      ...prev,
      logItems: prev.logItems.map((item, idx) => {
        if (idx < fromRowIdx) return item;
        const updated = { ...item, [field]: sourceVal };
        if (field === 'purchaseLength' || field === 'purchaseDiameter1' || field === 'purchaseDiameter2') {
          const len = field === 'purchaseLength' ? Number(sourceVal) : Number(updated.purchaseLength || 0);
          const d1 = field === 'purchaseDiameter1' ? Number(sourceVal) : Number(updated.purchaseDiameter1 || 0);
          const d2 = field === 'purchaseDiameter2' ? Number(sourceVal) : Number(updated.purchaseDiameter2 || 0);
          const rt = updated.purchaseDiameterAvg || ((d1 > 0 && d2 > 0) ? (d1 + d2) / 2 : (d1 || d2 || 0));
          updated.purchaseVolume = calculateLogVolume(len, d1, d2, rt);
        }
        return updated;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.partaiId) {
      setError("Silakan pilih Partai / Project terlebih dahulu agar pembelian tercatat di manajemen partai.");
      setLoading(false);
      return;
    }

    const isSawn = form.purchaseType === "sawn-timber";

    // Silently filter out empty/blank rows so user doesn't have to delete them manually
    const validSawnItems = form.items.filter((item: any) => {
      const p = Number(item.purchaseLength || 0);
      const t = Number(item.purchaseThickness || 0);
      const l = Number(item.purchaseWidth || 0);
      const pcs = Number(item.quantityPcs || 0);
      const vol = Number(item.volumeM3 || 0);
      return (p > 0 || t > 0 || l > 0 || vol > 0) && pcs > 0;
    });

    const validLogItems = form.logItems.filter((li: any) => {
      const p = Number(li.purchaseLength || 0);
      const d1 = Number(li.purchaseDiameter1 || 0);
      const d2 = Number(li.purchaseDiameter2 || 0);
      const avg = Number(li.purchaseDiameterAvg || 0);
      const vol = Number(li.purchaseVolume || 0);
      const num = (li.logNumber || "").trim();
      return p > 0 || d1 > 0 || d2 > 0 || avg > 0 || vol > 0 || num.length > 0;
    });

    if (isSawn && validSawnItems.length === 0) {
      setError("Silakan isi minimal 1 baris data sawn timber sebelum menyimpan.");
      setLoading(false);
      return;
    }

    if (!isSawn && validLogItems.length === 0) {
      setError("Silakan isi minimal 1 baris data log bulat sebelum menyimpan.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/inventory/timber-purchase", {
        purchaseNumber: form.purchaseNumber,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        sourceId: form.sourceId,
        warehouseId: form.warehouseId,
        notes: form.notes,
        partaiId: form.partaiId,
        status: form.status,
        isReceived: form.status === "RECEIVED",
        items: isSawn ? validSawnItems : [],
        logItems: !isSawn ? validLogItems.map((li, idx) => ({
          ...li,
          logNumber: li.logNumber?.trim() || `LOG-${form.purchaseNumber}-${idx + 1}`,
          species: li.species || 'UNKNOWN',
          purchaseLength: Number(li.purchaseLength || 0),
          purchaseDiameter1: Number(li.purchaseDiameter1 || 0),
          purchaseDiameter2: Number(li.purchaseDiameter2 || 0),
          purchaseDiameter3: Number((li as any).purchaseDiameter3 || 0),
          purchaseDiameter4: Number((li as any).purchaseDiameter4 || 0),
          purchaseDiameterAvg: Number(li.purchaseDiameterAvg || 0),
          purchaseVolume: Number(li.purchaseVolume || 0)
        })) : []
      });
      // Clear offline draft on successful submit
      clearLocalDraft();
      const targetTab = searchParams.get('tab') || (form.purchaseType === "raw-log" ? "rawlogs" : "purchase");
      router.push(`/inventory/partai/${form.partaiId}?tab=${targetTab}`);
      router.refresh();
    } catch (err: any) {
      setError((err.response?.data?.error?.message || err.response?.data?.message) || "Failed to create purchase");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Buat Purchase (Pembelian Kayu)</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold text-foreground flex items-center justify-between">
                <span>Partai / Project *</span>
                {form.partaiId && (
                  <span className="text-xs text-primary font-normal">
                    Pembelian otomatis tercatat di partai ini
                  </span>
                )}
              </Label>
              <Select value={form.partaiId} onValueChange={val => setForm({...form, partaiId: val || ""})} required>
                <SelectTrigger className="font-medium h-10 border-primary/40">
                  <SelectValue placeholder="Pilih Partai / Project">
                    {(() => {
                      const p = partais.find(item => item.id === form.partaiId);
                      if (p) return `${p.code} - ${p.name || 'Tanpa Nama'}`;
                      return form.partaiId ? "Memuat data partai..." : "Pilih Partai / Project";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {partais.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name || 'Tanpa Nama'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.partaiId && (
                <p className="text-[12px] text-destructive font-medium">
                  Wajib memilih Partai agar pembelian otomatis tercatat di Manajemen Partai.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor PO</Label>
                <Input value={form.purchaseNumber} onChange={e => setForm({...form, purchaseNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pembelian</Label>
                <Input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Supplier / Sumber Kayu *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewSupplierName("");
                      setIsSupplierModalOpen(true);
                    }}
                    className="h-6 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Supplier Baru
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={form.sourceId} onValueChange={val => setForm({...form, sourceId: val || ""})} required>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih Supplier">
                        {(() => {
                          const s = sources.find(item => item.id === form.sourceId);
                          if (s) return s.name ? `${s.name}${s.code ? ` (${s.code})` : ''}` : (s.code || s.id);
                          return form.sourceId ? "Memuat supplier..." : "Pilih Supplier";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name ? `${s.name}${s.code ? ` (${s.code})` : ''}` : (s.code || s.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setNewSupplierName("");
                      setIsSupplierModalOpen(true);
                    }}
                    title="Tambah Supplier Baru Langsung"
                    className="h-9 w-9 shrink-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gudang Penerima</Label>
                <Select value={form.warehouseId} onValueChange={val => setForm({...form, warehouseId: val || ""})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gudang">
                      {(() => {
                        const w = warehouses.find(item => item.id === form.warehouseId);
                        if (w) return w.name ? `${w.name}${w.code ? ` (${w.code})` : ''}` : (w.code || w.id);
                        return form.warehouseId ? "Memuat gudang..." : "Pilih Gudang";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name ? `${w.name}${w.code ? ` (${w.code})` : ''}` : (w.code || w.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Status Penerimaan Barang *</Label>
                <Select value={form.status} onValueChange={val => setForm({...form, status: val || "RECEIVED"})}>
                  <SelectTrigger className="font-medium h-10 border-emerald-300 dark:border-emerald-800">
                    <SelectValue placeholder="Pilih Status Penerimaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Sudah Diterima (Langsung Masuk Stok)
                      </span>
                    </SelectItem>
                    <SelectItem value="DRAFT">
                      <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        Belum Diterima (Draft / Pending)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-muted-foreground">
                  {form.purchaseType === 'raw-log' ? (
                    form.status === 'RECEIVED' 
                      ? "✓ Data log bulat akan langsung tercatat dan masuk ke DUKB partai saat disimpan." 
                      : "⏳ Log disimpan sebagai DRAFT (dapat diukur ulang / diverifikasi di tab DUKB)."
                  ) : (
                    form.status === 'RECEIVED' 
                      ? "✓ Stok sawn timber akan langsung otomatis bertambah ke gudang saat disimpan." 
                      : "⏳ Stok belum bertambah. Dapat diterima nanti via tombol 'Terima Barang'."
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Catatan (Notes)</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan pembelian..." className="h-10" />
              </div>
            </div>

            <Tabs value={form.purchaseType} onValueChange={(v) => setForm({...form, purchaseType: v})} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/70 border border-border">
                <TabsTrigger 
                  value="raw-log" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-base">🪵</span>
                  <span>Beli Log Bulat (Raw Log / DUKB)</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sawn-timber" 
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-base">🌲</span>
                  <span>Beli Kayu Olahan (Sawn Timber)</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sawn-timber" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span>🌲 Spreadsheet Pembelian Kayu Olahan (Sawn Timber)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input tabel dimensi kayu: Tebal (T), Lebar (L), Panjang (P), dan Batang (Pcs). Otomatis hitung M³.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setIsAiModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ AI Auto-Input (Foto / WA)</span>
                  </Button>
                </div>
                <SawnTimberSpreadsheet
                  initialRows={form.items.map((it: any) => ({
                    species: it.species || "",
                    grade: it.grade || "A",
                    thickness: it.purchaseThickness || "",
                    width: it.purchaseWidth || "",
                    length: it.purchaseLength || "",
                    pcs: it.quantityPcs || "",
                    m3: it.volumeM3 || 0,
                  }))}
                  speciesList={speciesList}
                  defaultSpecies=""
                  showSpecies={true}
                  onChange={(updatedRows: SawnTallyRow[]) => {
                    const mappedItems = updatedRows.map(r => ({
                      species: r.species || "",
                      grade: r.grade || "A",
                      purchaseThickness: parseFloat(String(r.thickness).replace(",", ".")) || 0,
                      purchaseWidth: parseFloat(String(r.width).replace(",", ".")) || 0,
                      purchaseLength: parseFloat(String(r.length).replace(",", ".")) || 0,
                      quantityPcs: parseInt(String(r.pcs)) || 0,
                      volumeM3: Number(r.m3) || 0,
                      unitPrice: 0,
                      timberVariantId: r.timberVariantId || "",
                      batch: "UNKNOWN",
                      notes: r.species || "SAWN-TIMBER",
                    }));
                    setForm(prev => ({ ...prev, items: mappedItems }));
                  }}
                />
              </TabsContent>

              <TabsContent value="raw-log" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span>🪵 Spreadsheet Pembelian Raw Logs (DUKB)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Input tabel log bulat: Panjang, Ø Pangkal (D1), Ø Ujung (D2), dan RT otomatis. Tekan <strong>Enter</strong> untuk turun ke bawah. Baris kosong akan otomatis diabaikan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setIsAiModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ AI Auto-Input (Foto / WA)</span>
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addLogRows(1)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +1
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(5)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +5
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(10)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +10
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(20)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> +20 Log
                    </Button>
                  </div>
                </div>


                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-2.5 text-xs text-blue-800 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">⚡</span>
                    <span><strong>Mode Excel Aktif:</strong> Klik/drag sel untuk blok, tekan <strong>Ctrl+C</strong> untuk copy & <strong>Ctrl+V</strong> untuk paste (bisa paste ke kolom lain persis). Tekan <strong>Enter</strong> untuk turun.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status Auto-Save Draf */}
                    {lastSavedTime ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Draf Tersimpan ({lastSavedTime})</span>
                        <button
                          type="button"
                          onClick={clearLocalDraft}
                          title="Hapus draf lokal"
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <CloudOff className="w-3.5 h-3.5" /> Auto-save draf aktif
                      </span>
                    )}

                    {/* Tombol Copy Range jika ada sel terblok */}
                    {logSelection && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyLogSelection}
                        className="h-6 text-[11px] px-2 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 gap-1"
                        title="Salin (Ctrl+C) area yang dipilih"
                      >
                        <Copy className="w-3 h-3" /> Salin Pilihan
                      </Button>
                    )}

                    <span className="font-mono font-bold bg-background/80 px-2 py-0.5 rounded border text-[11px]">
                      {form.logItems.filter((li: any) => Number(li.purchaseLength || 0) > 0 || Number(li.purchaseDiameter1 || 0) > 0 || Number(li.purchaseDiameter2 || 0) > 0 || Number(li.purchaseVolume || 0) > 0 || (li.logNumber && li.logNumber.trim() !== '')).length} / {form.logItems.length} Log Terisi
                    </span>
                  </div>
                </div>

                {/* RAW LOG SPREADSHEET TABLE */}
                <div 
                  className="overflow-x-auto border rounded-xl shadow-sm bg-card select-none"
                  onMouseUp={() => setIsSelectingLog(false)}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60 border-b text-muted-foreground font-semibold">
                        <th className="py-2.5 px-2 text-center w-10">No</th>
                        <th className="py-2.5 px-2 text-left w-28">No Log</th>
                        <th className="py-2.5 px-2 text-left w-36">
                          <div className="flex items-center justify-between">
                            <span>Spesies</span>
                            <button
                              type="button"
                              onClick={() => handleFillDownLog("species", 0)}
                              title="Tarik Spesies ke semua baris di bawah"
                              className="text-muted-foreground hover:text-primary p-0.5"
                            >
                              ↓
                            </button>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 text-center w-24">
                          <div className="flex items-center justify-between">
                            <span>P (cm/m)</span>
                            <button
                              type="button"
                              onClick={() => handleFillDownLog("purchaseLength", 0)}
                              title="Tarik Panjang ke semua baris di bawah"
                              className="text-muted-foreground hover:text-primary p-0.5"
                            >
                              ↓
                            </button>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 text-center w-24">
                          <div className="flex items-center justify-between">
                            <span>&Oslash; Pkl D1 (cm)</span>
                            <button
                              type="button"
                              onClick={() => handleFillDownLog("purchaseDiameter1", 0)}
                              title="Tarik D1 ke semua baris di bawah"
                              className="text-muted-foreground hover:text-primary p-0.5"
                            >
                              ↓
                            </button>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 text-center w-24">
                          <div className="flex items-center justify-between">
                            <span>&Oslash; Ujg D2 (cm)</span>
                            <button
                              type="button"
                              onClick={() => handleFillDownLog("purchaseDiameter2", 0)}
                              title="Tarik D2 ke semua baris di bawah"
                              className="text-muted-foreground hover:text-primary p-0.5"
                            >
                              ↓
                            </button>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 text-center w-24 text-blue-700 dark:text-blue-300 font-bold">RT (cm)</th>
                        <th className="py-2.5 px-2 text-right w-28 text-emerald-700 dark:text-emerald-400 font-bold">Vol (m³)</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {form.logItems.map((item: any, index: number) => {
                        const currentRt = item.purchaseDiameterAvg || ((item.purchaseDiameter1 > 0 && item.purchaseDiameter2 > 0) ? Math.round(((item.purchaseDiameter1 + item.purchaseDiameter2) / 2) * 10) / 10 : (item.purchaseDiameter1 || item.purchaseDiameter2 || 0));
                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="py-1 px-2 text-center font-mono text-muted-foreground font-medium">
                              {index + 1}
                            </td>
                            {/* No Log */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'logNumber') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'logNumber' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'logNumber', endRow: index, endCol: 'logNumber' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'logNumber' }) : null);
                                }
                              }}
                            >
                              <Input
                                id={`log-logNumber-${index}`}
                                value={item.logNumber || ""}
                                placeholder={`LOG-${index + 1}`}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'logNumber', 'log', form.logItems.length, () => addLogRows(1))}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (text && (text.includes("\t") || text.includes("\n"))) {
                                    e.preventDefault();
                                    handlePasteLogData(index, 'logNumber', text);
                                  }
                                }}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].logNumber = e.target.value;
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </td>

                            {/* Spesies */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'species') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'species' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'species', endRow: index, endCol: 'species' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'species' }) : null);
                                }
                              }}
                            >
                              <Select
                                value={item.species || ""}
                                onValueChange={(val) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].species = val;
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                              >
                                <SelectTrigger
                                  id={`log-species-${index}`}
                                  className="h-8 text-xs font-semibold uppercase justify-between bg-transparent border-input"
                                  onKeyDown={(e) => handleCellKeyDown(e as any, index, 'species', 'log', form.logItems.length, () => addLogRows(1))}
                                >
                                  <SelectValue placeholder="Pilih Spesies">
                                    {item.species || <span className="text-muted-foreground font-normal">Pilih Spesies</span>}
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
                            </td>

                            {/* Panjang P */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'purchaseLength') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'purchaseLength' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'purchaseLength', endRow: index, endCol: 'purchaseLength' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'purchaseLength' }) : null);
                                }
                              }}
                            >
                              <Input
                                id={`log-purchaseLength-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseLength || ""}
                                placeholder="cth: 400"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseLength', 'log', form.logItems.length, () => addLogRows(1))}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (text && (text.includes("\t") || text.includes("\n"))) {
                                    e.preventDefault();
                                    handlePasteLogData(index, 'purchaseLength', text);
                                  }
                                }}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  const len = parseFloat(e.target.value) || 0;
                                  newLogItems[index].purchaseLength = len;
                                  const d1 = newLogItems[index].purchaseDiameter1 || 0;
                                  const d2 = newLogItems[index].purchaseDiameter2 || 0;
                                  const rt = newLogItems[index].purchaseDiameterAvg || ((d1 > 0 && d2 > 0) ? (d1 + d2) / 2 : (d1 || d2 || 0));
                                  newLogItems[index].purchaseVolume = calculateLogVolume(len, d1, d2, rt);
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>

                            {/* D1 */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'purchaseDiameter1') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'purchaseDiameter1' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'purchaseDiameter1', endRow: index, endCol: 'purchaseDiameter1' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'purchaseDiameter1' }) : null);
                                }
                              }}
                            >
                              <Input
                                id={`log-purchaseDiameter1-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameter1 || ""}
                                placeholder=""
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameter1', 'log', form.logItems.length, () => addLogRows(1))}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (text && (text.includes("\t") || text.includes("\n"))) {
                                    e.preventDefault();
                                    handlePasteLogData(index, 'purchaseDiameter1', text);
                                  }
                                }}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  const d1 = parseFloat(e.target.value) || 0;
                                  newLogItems[index].purchaseDiameter1 = d1;
                                  const d2 = newLogItems[index].purchaseDiameter2 || 0;
                                  const calcRt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
                                  newLogItems[index].purchaseDiameterAvg = calcRt;
                                  newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, d1, d2, calcRt);
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>

                            {/* D2 */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'purchaseDiameter2') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'purchaseDiameter2' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'purchaseDiameter2', endRow: index, endCol: 'purchaseDiameter2' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'purchaseDiameter2' }) : null);
                                }
                              }}
                            >
                              <Input
                                id={`log-purchaseDiameter2-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameter2 || ""}
                                placeholder=""
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameter2', 'log', form.logItems.length, () => addLogRows(1))}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (text && (text.includes("\t") || text.includes("\n"))) {
                                    e.preventDefault();
                                    handlePasteLogData(index, 'purchaseDiameter2', text);
                                  }
                                }}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  const d2 = parseFloat(e.target.value) || 0;
                                  newLogItems[index].purchaseDiameter2 = d2;
                                  const d1 = newLogItems[index].purchaseDiameter1 || 0;
                                  const calcRt = (d1 > 0 && d2 > 0) ? Math.round(((d1 + d2) / 2) * 10) / 10 : (d1 || d2 || 0);
                                  newLogItems[index].purchaseDiameterAvg = calcRt;
                                  newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, d1, d2, calcRt);
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-center font-mono"
                              />
                            </td>

                            {/* RT */}
                            <td 
                              className={`py-1 px-2 border-r transition-colors ${isLogCellSelected(index, 'purchaseDiameterAvg') ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''}`}
                              onMouseDown={(e) => {
                                if (e.shiftKey && logSelection) {
                                  setLogSelection({ ...logSelection, endRow: index, endCol: 'purchaseDiameterAvg' });
                                } else {
                                  setLogSelection({ startRow: index, startCol: 'purchaseDiameterAvg', endRow: index, endCol: 'purchaseDiameterAvg' });
                                  setIsSelectingLog(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingLog && logSelection) {
                                  setLogSelection(prev => prev ? ({ ...prev, endRow: index, endCol: 'purchaseDiameterAvg' }) : null);
                                }
                              }}
                            >
                              <Input
                                id={`log-purchaseDiameterAvg-${index}`}
                                type="number"
                                step="any"
                                value={item.purchaseDiameterAvg || (currentRt > 0 ? currentRt : "")}
                                placeholder=""
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseDiameterAvg', 'log', form.logItems.length, () => addLogRows(1))}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (text && (text.includes("\t") || text.includes("\n"))) {
                                    e.preventDefault();
                                    handlePasteLogData(index, 'purchaseDiameterAvg', text);
                                  }
                                }}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  const customRt = parseFloat(e.target.value) || 0;
                                  newLogItems[index].purchaseDiameterAvg = customRt;
                                  newLogItems[index].purchaseVolume = calculateLogVolume(newLogItems[index].purchaseLength, newLogItems[index].purchaseDiameter1, newLogItems[index].purchaseDiameter2, customRt);
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20"
                                title="Diameter Rata-rata (RT)"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                id={`log-purchaseVolume-${index}`}
                                type="number"
                                step="0.0001"
                                value={item.purchaseVolume || ""}
                                placeholder="0.0000"
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'purchaseVolume', 'log', form.logItems.length, () => addLogRows(1))}
                                onChange={(e) => {
                                  const newLogItems = [...form.logItems];
                                  newLogItems[index].purchaseVolume = parseFloat(e.target.value) || 0;
                                  setForm({ ...form, logItems: newLogItems });
                                }}
                                className="h-8 text-xs text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                              />
                            </td>
                            <td className="py-1 px-2 text-center">
                              {form.logItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, logItems: form.logItems.filter((_, i) => i !== index) });
                                  }}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                  title="Hapus Baris"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right">TOTAL KESELURUHAN:</td>
                        <td colSpan={4} className="py-2.5 px-2 text-center font-bold text-foreground">
                          {form.logItems.filter((li: any) => Number(li.purchaseLength || 0) > 0 || Number(li.purchaseDiameter1 || 0) > 0 || Number(li.purchaseDiameter2 || 0) > 0 || Number(li.purchaseVolume || 0) > 0 || (li.logNumber && li.logNumber.trim() !== '')).length} Batang Log Valid
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {form.logItems.reduce((sum: number, it: any) => sum + (Number(it.purchaseVolume) || 0), 0).toFixed(4)} m³
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <datalist id="species-datalist">
                  {speciesList.map((s: any) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addLogRows(1)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +1 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(5)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +5 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(10)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +10 Log
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => addLogRows(20)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> +20 Log
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Pembelian"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* MODAL TAMBAH SUPPLIER BARU */}
      <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Tambah Supplier / Sumber Kayu Baru</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSupplier} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-supplier-name">Nama Supplier / PT / CV *</Label>
              <Input
                id="new-supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="misal: PT Rimba Sejahtera, Bpk. Joko, dll..."
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Supplier baru akan otomatis tersimpan ke Master Data dan langsung terpilih di formulir ini.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSupplierModalOpen(false)}
                disabled={creatingSupplier}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={creatingSupplier || !newSupplierName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {creatingSupplier ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Supplier"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI TALLY IMPORT MODAL */}
      <AiTallyImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        workflowType={form.purchaseType === 'raw-log' ? 'RAW_LOG' : 'SAWN_TIMBER'}
        onDataParsed={handleAiDataParsed}
      />
    </div>
  )
}




