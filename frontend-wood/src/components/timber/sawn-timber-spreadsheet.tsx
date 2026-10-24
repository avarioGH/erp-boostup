"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowDown, Copy, ClipboardPaste, RotateCcw, Camera, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";


export interface SawnTallyRow {
  id?: string;
  species?: string;
  grade?: string;
  productType?: string; // BALOK, RENG, AFKIR_BS, AIR_DRY, FJL
  thickness: number | string; // T (cm)
  width: number | string;     // L (cm)
  length: number | string;    // P (cm)
  pcs: number | string;       // PCS
  m3?: number | string;       // M3 (auto or manual)
  notes?: string;
  [key: string]: any;
}

export const PRODUCT_TYPE_OPTIONS = [
  { value: "BALOK", label: "Balok (Main)" },
  { value: "RENG", label: "Reng / Papan" },
  { value: "AFKIR_BS", label: "BS / Afkir" },
  { value: "AIR_DRY", label: "Air Dry" },
  { value: "FJL", label: "FJL / Jasa" },
];

interface SawnTimberSpreadsheetProps {
  initialRows?: SawnTallyRow[];
  onChange?: (rows: SawnTallyRow[]) => void;
  speciesList?: Array<{ id?: string; code?: string; name: string }>;
  defaultSpecies?: string;
  defaultGrade?: string;
  defaultProductType?: string;
  showSpecies?: boolean;
  showGrade?: boolean;
  showProductType?: boolean;
  readOnly?: boolean;
}

/**
 * Standard wood volume calculation in m3:
 * (Tebal cm * Lebar cm * Panjang cm * PCS) / 1,000,000
 */
export function calcRowM3(t: number, w: number, p: number, pcs: number): number {
  if (t > 0 && w > 0 && p > 0 && pcs > 0) {
    return Number(((t * w * p * pcs) / 1000000).toFixed(4));
  }
  return 0;
}

export function parseFlexibleNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  // Replace Indonesian comma with dot (e.g., "4,5" -> "4.5")
  const normalized = String(val).trim().replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export function SawnTimberSpreadsheet({
  initialRows = [],
  onChange,
  speciesList = [],
  defaultSpecies = "MERBAU",
  defaultGrade = "A",
  defaultProductType = "BALOK",
  showSpecies = true,
  showGrade = false,
  showProductType = false,
  readOnly = false,
}: SawnTimberSpreadsheetProps) {
  // Ensure we always have at least 10 rows for clean Excel-like experience
  const createEmptyRow = useCallback((): SawnTallyRow => ({
    species: defaultSpecies,
    grade: defaultGrade,
    productType: defaultProductType,
    thickness: "",
    width: "",
    length: "",
    pcs: "",
    m3: 0,
    notes: "",
  }), [defaultSpecies, defaultGrade, defaultProductType]);

  const [rows, setRows] = useState<SawnTallyRow[]>(() => {
    let result: SawnTallyRow[] = [];
    if (initialRows && initialRows.length > 0) {
      result = initialRows.map(r => {
        const t = parseFlexibleNumber(r.thickness);
        const w = parseFlexibleNumber(r.width);
        const p = parseFlexibleNumber(r.length);
        const pcs = parseFlexibleNumber(r.pcs);
        const m3 = r.m3 !== undefined && Number(r.m3) > 0 ? Number(r.m3) : calcRowM3(t, w, p, pcs);
        return {
          ...r,
          species: r.species || defaultSpecies,
          grade: r.grade || defaultGrade,
          m3,
        };
      });
    }
    while (result.length < 8) {
      result.push(createEmptyRow());
    }
    return result;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workflowType", "SAWN_TIMBER");

      const res = await api.post("/api/ai/parse-tally", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extractedItems = res.data?.items || [];
      if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
        alert("AI tidak mendeteksi baris ukuran kayu pada foto tersebut. Pastikan foto tegak dan jelas.");
        return;
      }

      setRows(prev => {
        const existingFilled = prev.filter(r => parseFlexibleNumber(r.pcs) > 0 || parseFlexibleNumber(r.thickness) > 0);
        const newRows: SawnTallyRow[] = extractedItems.map((it: any) => {
          const t = Number(it.thickness || 0);
          const w = Number(it.width || 0);
          const p = Number(it.length || 0);
          const pcs = Number(it.pcs || 1);
          return {
            species: it.species || defaultSpecies,
            grade: it.grade || defaultGrade,
            productType: defaultProductType,
            thickness: t > 0 ? t : "",
            width: w > 0 ? w : "",
            length: p > 0 ? p : "",
            pcs: pcs > 0 ? pcs : "",
            m3: calcRowM3(t, w, p, pcs),
            notes: it.notes || "Hasil Scan AI",
          };
        });

        const merged = [...existingFilled, ...newRows];
        while (merged.length < 8) merged.push(createEmptyRow());
        notifyParent(merged);
        return merged;
      });

      alert(`Berhasil mengekstrak ${extractedItems.length} baris ukuran kayu dari foto.`);
    } catch (err: any) {
      console.error("Scan AI Error:", err);
      alert(err?.response?.data?.message || err?.message || "Gagal memproses gambar dengan AI.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [activeCell, setActiveCell] = useState<{ row: number; col: string } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: string;
    endRow: number;
    endCol: string;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillDestinationRange, setFillDestinationRange] = useState<{
    startRow: number;
    startCol: string;
    endRow: number;
    endCol: string;
  } | null>(null);

  // Undo history
  const [history, setHistory] = useState<SawnTallyRow[][]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Column definitions in order
  const colOrder: Array<"species" | "grade" | "productType" | "thickness" | "width" | "length" | "pcs" | "m3"> = [
    ...(showSpecies ? (["species"] as const) : []),
    ...(showGrade ? (["grade"] as const) : []),
    "thickness",
    "width",
    "length",
    "pcs",
    ...(showProductType ? (["productType"] as const) : []),
    "m3",
  ];

  const getColIndex = useCallback((col: string) => {
    return colOrder.indexOf(col as any);
  }, [colOrder]);

  const saveToHistory = useCallback((currentRows: SawnTallyRow[]) => {
    setHistory(prev => [...prev.slice(-20), currentRows.map(r => ({ ...r }))]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setRows(previous);
    if (onChange) onChange(previous);
  }, [history, onChange]);

  // Sync back to parent when rows change
  const notifyParent = useCallback((updated: SawnTallyRow[]) => {
    if (onChange) {
      onChange(updated);
    }
  }, [onChange]);

  // Update a specific cell
  const handleCellChange = (rowIndex: number, colKey: keyof SawnTallyRow, rawVal: string) => {
    setRows(prev => {
      saveToHistory(prev);
      const next = [...prev];
      const target = { ...next[rowIndex] };

      target[colKey] = rawVal;

      // Auto compute M3 if dimension fields changed
      if (colKey === "thickness" || colKey === "width" || colKey === "length" || colKey === "pcs") {
        const t = parseFlexibleNumber(colKey === "thickness" ? rawVal : target.thickness);
        const w = parseFlexibleNumber(colKey === "width" ? rawVal : target.width);
        const p = parseFlexibleNumber(colKey === "length" ? rawVal : target.length);
        const pcs = parseFlexibleNumber(colKey === "pcs" ? rawVal : target.pcs);
        target.m3 = calcRowM3(t, w, p, pcs);
      }

      next[rowIndex] = target;
      notifyParent(next);
      return next;
    });
  };

  // Check if a cell is within a selection range
  const isCellSelected = (r: number, col: string) => {
    if (!selectionRange) return false;
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);
    const cIdx = getColIndex(col);
    const startCIdx = getColIndex(selectionRange.startCol);
    const endCIdx = getColIndex(selectionRange.endCol);
    const minCol = Math.min(startCIdx, endCIdx);
    const maxCol = Math.max(startCIdx, endCIdx);

    return r >= minRow && r <= maxRow && cIdx >= minCol && cIdx <= maxCol;
  };

  // Check if cell is in the fill destination preview range
  const isCellInFillPreview = (r: number, col: string) => {
    if (!isDraggingFill || !fillDestinationRange) return false;
    const minRow = Math.min(fillDestinationRange.startRow, fillDestinationRange.endRow);
    const maxRow = Math.max(fillDestinationRange.startRow, fillDestinationRange.endRow);
    const cIdx = getColIndex(col);
    const startCIdx = getColIndex(fillDestinationRange.startCol);
    const endCIdx = getColIndex(fillDestinationRange.endCol);
    const minCol = Math.min(startCIdx, endCIdx);
    const maxCol = Math.max(startCIdx, endCIdx);

    return r >= minRow && r <= maxRow && cIdx >= minCol && cIdx <= maxCol;
  };

  const isBottomRightOfSelection = (r: number, col: string) => {
    if (!selectionRange) return false;
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);
    const startCIdx = getColIndex(selectionRange.startCol);
    const endCIdx = getColIndex(selectionRange.endCol);
    const maxColIdx = Math.max(startCIdx, endCIdx);
    return r === maxRow && getColIndex(col) === maxColIdx;
  };

  const getCellSelectionClasses = (r: number, col: string) => {
    const selected = isCellSelected(r, col);
    const inPreview = isCellInFillPreview(r, col);
    const isActive = activeCell?.row === r && activeCell?.col === col;

    if (inPreview && !selected) {
      return "bg-blue-500/20 ring-1 ring-dashed ring-blue-500 transition-colors";
    }

    if (isActive) {
      return "ring-2 ring-primary ring-inset z-10 bg-primary/10";
    }

    if (selected) {
      return "bg-primary/15 ring-1 ring-primary/40 ring-inset";
    }

    return "";
  };

  // Mouse handlers for cell selection
  const handleCellMouseDown = (r: number, col: string, e: React.MouseEvent) => {
    // Only primary left button
    if (e.button !== 0) return;

    if (e.shiftKey && activeCell) {
      // Shift+Click: Extend selection
      setSelectionRange({
        startRow: activeCell.row,
        startCol: activeCell.col,
        endRow: r,
        endCol: col,
      });
      return;
    }

    // New selection start
    setActiveCell({ row: r, col });
    setSelectionRange({
      startRow: r,
      startCol: col,
      endRow: r,
      endCol: col,
    });
    setIsSelecting(true);
  };

  const handleCellMouseEnter = (r: number, col: string) => {
    if (isSelecting && selectionRange) {
      setSelectionRange(prev => (prev ? { ...prev, endRow: r, endCol: col } : null));
    } else if (isDraggingFillRef.current && selectionRangeRef.current) {
      // Update destination preview
      setFillDestinationRange({
        startRow: selectionRangeRef.current.startRow,
        startCol: selectionRangeRef.current.startCol,
        endRow: r,
        endCol: col,
      });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
    }
    if (isDraggingFill) {
      completeFill();
    }
  };

  // Refs to avoid stale closures in window event listeners
  const isDraggingFillRef = useRef(isDraggingFill);
  const selectionRangeRef = useRef(selectionRange);
  const fillDestinationRangeRef = useRef(fillDestinationRange);
  const rowsRef = useRef(rows);

  useEffect(() => {
    isDraggingFillRef.current = isDraggingFill;
    selectionRangeRef.current = selectionRange;
    fillDestinationRangeRef.current = fillDestinationRange;
    rowsRef.current = rows;
  }, [isDraggingFill, selectionRange, fillDestinationRange, rows]);

  // Fill handle pointer start with pointer capture
  const handleFillHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectionRange) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDraggingFill(true);
    setFillDestinationRange({ ...selectionRange });
  };

  const handleFillHandlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingFillRef.current || !selectionRangeRef.current) return;
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    const cellTd = elem?.closest("td[data-cell-row][data-cell-col]") as HTMLElement | null;
    if (cellTd) {
      const targetRow = parseInt(cellTd.getAttribute("data-cell-row") || "0", 10);
      const targetCol = cellTd.getAttribute("data-cell-col") || selectionRangeRef.current.startCol;
      setFillDestinationRange({
        startRow: selectionRangeRef.current.startRow,
        startCol: selectionRangeRef.current.startCol,
        endRow: targetRow,
        endCol: targetCol,
      });
    }
  };

  const handleFillHandlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingFillRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    completeFill();
  };

  // Complete drag fill operation (Pattern repeat / replicate)
  const completeFill = () => {
    const sel = selectionRangeRef.current;
    const dest = fillDestinationRangeRef.current;
    setIsDraggingFill(false);

    if (!sel || !dest) {
      setFillDestinationRange(null);
      return;
    }

    const srcMinRow = Math.min(sel.startRow, sel.endRow);
    const srcMaxRow = Math.max(sel.startRow, sel.endRow);
    const srcStartCIdx = getColIndex(sel.startCol);
    const srcEndCIdx = getColIndex(sel.endCol);
    const srcMinCol = Math.min(srcStartCIdx, srcEndCIdx);
    const srcMaxCol = Math.max(srcStartCIdx, srcEndCIdx);

    const destMinRow = Math.min(dest.startRow, dest.endRow);
    const destMaxRow = Math.max(dest.startRow, dest.endRow);
    const destStartCIdx = getColIndex(dest.startCol);
    const destEndCIdx = getColIndex(dest.endCol);
    const destMinCol = Math.min(destStartCIdx, destEndCIdx);
    const destMaxCol = Math.max(destStartCIdx, destEndCIdx);

    // If no extension happened, do nothing
    if (
      srcMinRow === destMinRow &&
      srcMaxRow === destMaxRow &&
      srcMinCol === destMinCol &&
      srcMaxCol === destMaxCol
    ) {
      setFillDestinationRange(null);
      return;
    }

    setRows(prev => {
      saveToHistory(prev);
      const next = [...prev];
      // Expand rows if destination extends beyond bottom
      while (next.length <= destMaxRow) {
        next.push(createEmptyRow());
      }

      const patternHeight = srcMaxRow - srcMinRow + 1;
      const patternWidth = srcMaxCol - srcMinCol + 1;

      // Fill cells in destination
      for (let r = destMinRow; r <= destMaxRow; r++) {
        const targetRow = { ...next[r] };

        for (let c = destMinCol; c <= destMaxCol; c++) {
          const colName = colOrder[c];
          // Do not overwrite read-only calculated columns like m3
          if (colName === "m3") continue;

          // Compute pattern source cell
          const srcRowOffset = (r - destMinRow) % patternHeight;
          const srcColOffset = (c - destMinCol) % patternWidth;
          const srcRowIdx = srcMinRow + srcRowOffset;
          const srcColName = colOrder[srcMinCol + srcColOffset];

          if (srcRowIdx < prev.length && srcColName) {
            const rawVal = prev[srcRowIdx][srcColName];
            (targetRow as any)[colName] = (rawVal !== undefined && rawVal !== null) ? rawVal : "";
          }
        }

        // Recalculate M3 for this row
        const t = parseFlexibleNumber(targetRow.thickness);
        const w = parseFlexibleNumber(targetRow.width);
        const p = parseFlexibleNumber(targetRow.length);
        const pcs = parseFlexibleNumber(targetRow.pcs);
        targetRow.m3 = calcRowM3(t, w, p, pcs);

        next[r] = targetRow;
      }

      notifyParent(next);
      return next;
    });

    // Update selection to match filled area
    setSelectionRange({
      startRow: destMinRow,
      startCol: colOrder[destMinCol],
      endRow: destMaxRow,
      endCol: colOrder[destMaxCol],
    });
    setFillDestinationRange(null);
  };

  // Global window listeners for mouse up & Escape to cancel fill
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingFillRef.current || !selectionRangeRef.current) return;
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const cellTd = elem?.closest("td[data-cell-row][data-cell-col]") as HTMLElement | null;
      if (cellTd) {
        const targetRow = parseInt(cellTd.getAttribute("data-cell-row") || "0", 10);
        const targetCol = cellTd.getAttribute("data-cell-col") || selectionRangeRef.current.startCol;
        setFillDestinationRange({
          startRow: selectionRangeRef.current.startRow,
          startCol: selectionRangeRef.current.startCol,
          endRow: targetRow,
          endCol: targetCol,
        });
      }
    };

    const handleGlobalPointerUp = () => {
      if (isSelecting) setIsSelecting(false);
      if (isDraggingFillRef.current) completeFill();
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDraggingFillRef.current) {
          setIsDraggingFill(false);
          setFillDestinationRange(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // Copy selected range
        const sel = selectionRangeRef.current;
        if (sel) {
          const minRow = Math.min(sel.startRow, sel.endRow);
          const maxRow = Math.max(sel.startRow, sel.endRow);
          const startCIdx = getColIndex(sel.startCol);
          const endCIdx = getColIndex(sel.endCol);
          const minCol = Math.min(startCIdx, endCIdx);
          const maxCol = Math.max(startCIdx, endCIdx);

          const curRows = rowsRef.current;
          const lines: string[] = [];
          for (let r = minRow; r <= maxRow; r++) {
            const rowVals: string[] = [];
            for (let c = minCol; c <= maxCol; c++) {
              const colName = colOrder[c];
              rowVals.push(String(curRows[r]?.[colName] ?? ""));
            }
            lines.push(rowVals.join("\t"));
          }
          navigator.clipboard?.writeText?.(lines.join("\n"));
        }
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("mouseup", handleGlobalPointerUp);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("mouseup", handleGlobalPointerUp);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isSelecting, colOrder, getColIndex, handleUndo]);

  // Render fill handle at bottom right of active/selected cell
  const renderFillHandle = (r: number, col: string) => {
    if (readOnly) return null;
    if (!isBottomRightOfSelection(r, col)) return null;

    return (
      <div
        data-testid="spreadsheet-fill-handle"
        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary border border-background cursor-crosshair z-30 hover:scale-125 transition-transform"
        onPointerDown={handleFillHandlePointerDown}
        onPointerMove={handleFillHandlePointerMove}
        onPointerUp={handleFillHandlePointerUp}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!selectionRangeRef.current) return;
          setIsDraggingFill(true);
          setFillDestinationRange({ ...selectionRangeRef.current });
        }}
      />
    );
  };

  // Add N rows
  const addRows = (count: number = 5) => {
    setRows(prev => {
      const next = [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
      notifyParent(next);
      return next;
    });
  };

  // Delete row
  const removeRow = (index: number) => {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== index);
      const safe = next.length > 0 ? next : [createEmptyRow()];
      notifyParent(safe);
      return safe;
    });
  };

  // Reset / Clear empty
  const clearEmptyRows = () => {
    setRows(prev => {
      const filtered = prev.filter(r => {
        const t = parseFlexibleNumber(r.thickness);
        const w = parseFlexibleNumber(r.width);
        const p = parseFlexibleNumber(r.length);
        const pcs = parseFlexibleNumber(r.pcs);
        return t > 0 || w > 0 || p > 0 || pcs > 0;
      });
      const safe = filtered.length > 0 ? filtered : [createEmptyRow()];
      notifyParent(safe);
      return safe;
    });
  };

  // Fill down column value from current cell to bottom
  const handleFillDown = (colKey: "thickness" | "width" | "length" | "pcs" | "species" | "grade" | "productType", fromRow?: number) => {
    setRows(prev => {
      const targetRowIdx = typeof fromRow === "number" && fromRow >= 0 && fromRow < prev.length ? fromRow : 0;
      const sourceVal = prev[targetRowIdx]?.[colKey];
      if (sourceVal === undefined || sourceVal === null || sourceVal === "") return prev;

      const next = prev.map((r, i) => {
        if (i < targetRowIdx) return r;
        const target = { ...r, [colKey]: sourceVal };
        const t = parseFlexibleNumber(target.thickness);
        const w = parseFlexibleNumber(target.width);
        const p = parseFlexibleNumber(target.length);
        const pcs = parseFlexibleNumber(target.pcs);
        target.m3 = calcRowM3(t, w, p, pcs);
        return target;
      });
      notifyParent(next);
      return next;
    });
  };

  // Keyboard navigation like Excel
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: "species" | "grade" | "productType" | "thickness" | "width" | "length" | "pcs"
  ) => {
    const navColOrder: Array<"species" | "grade" | "thickness" | "width" | "length" | "pcs" | "productType"> = [
      ...(showSpecies ? (["species"] as const) : []),
      ...(showGrade ? (["grade"] as const) : []),
      "thickness",
      "width",
      "length",
      "pcs",
      ...(showProductType ? (["productType"] as const) : []),
    ];
    const currentColIdx = navColOrder.indexOf(colKey);

    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow >= rows.length) {
        // Automatically add 5 more rows when reaching end
        setRows(prev => {
          const next = [...prev, ...Array.from({ length: 5 }, () => createEmptyRow())];
          notifyParent(next);
          return next;
        });
      }
      setTimeout(() => {
        const nextInput = document.getElementById(`tally-cell-${nextRow}-${colKey}`);
        if (nextInput) {
          nextInput.focus();
          (nextInput as HTMLInputElement).select?.();
        }
      }, 30);
    } else if (e.key === "ArrowDown") {
      const nextRow = rowIndex + 1;
      if (nextRow < rows.length) {
        e.preventDefault();
        const nextInput = document.getElementById(`tally-cell-${nextRow}-${colKey}`);
        if (nextInput) {
          nextInput.focus();
          (nextInput as HTMLInputElement).select?.();
        }
      }
    } else if (e.key === "ArrowUp") {
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        e.preventDefault();
        const prevInput = document.getElementById(`tally-cell-${prevRow}-${colKey}`);
        if (prevInput) {
          prevInput.focus();
          (prevInput as HTMLInputElement).select?.();
        }
      }
    } else if (e.key === "ArrowRight") {
      const input = e.currentTarget;
      // If cursor is at end of input text
      if (input.selectionStart === input.value.length && currentColIdx < navColOrder.length - 1) {
        e.preventDefault();
        const nextCol = navColOrder[currentColIdx + 1];
        const nextInput = document.getElementById(`tally-cell-${rowIndex}-${nextCol}`);
        if (nextInput) {
          nextInput.focus();
          (nextInput as HTMLInputElement).select?.();
        }
      }
    } else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      // If cursor is at start of input text
      if (input.selectionStart === 0 && currentColIdx > 0) {
        e.preventDefault();
        const prevCol = navColOrder[currentColIdx - 1];
        const prevInput = document.getElementById(`tally-cell-${rowIndex}-${prevCol}`);
        if (prevInput) {
          prevInput.focus();
          (prevInput as HTMLInputElement).select?.();
        }
      }
    }
  };

  // Support direct Multi-cell paste from Excel (Tab / Newline separated)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: string) => {
    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) {
      // Normal single paste
      return;
    }

    e.preventDefault();
    const pasteLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedData = pasteLines.map(line => line.split("\t"));

    const editableCols: Array<"species" | "grade" | "thickness" | "width" | "length" | "pcs" | "productType"> = [
      ...(showSpecies ? (["species"] as const) : []),
      ...(showGrade ? (["grade"] as const) : []),
      "thickness",
      "width",
      "length",
      "pcs",
      ...(showProductType ? (["productType"] as const) : []),
    ];

    let startColIdx = editableCols.indexOf(startCol as any);
    if (startColIdx === -1) {
      // Fallback: look in colOrder
      const cIdx = colOrder.indexOf(startCol as any);
      startColIdx = cIdx !== -1 ? Math.min(cIdx, editableCols.length - 1) : 0;
    }

    setRows(prev => {
      saveToHistory(prev);
      const next = [...prev];
      const requiredRows = startRow + parsedData.length;
      while (next.length < requiredRows) {
        next.push(createEmptyRow());
      }

      parsedData.forEach((rowVals, rIdx) => {
        const targetRowIdx = startRow + rIdx;
        const targetRow = { ...next[targetRowIdx] };

        rowVals.forEach((val, cIdx) => {
          const colName = editableCols[startColIdx + cIdx];
          if (colName) {
            const cleanVal = val.trim();
            targetRow[colName] = cleanVal;
          }
        });

        const t = parseFlexibleNumber(targetRow.thickness);
        const w = parseFlexibleNumber(targetRow.width);
        const p = parseFlexibleNumber(targetRow.length);
        const pcs = parseFlexibleNumber(targetRow.pcs);
        targetRow.m3 = calcRowM3(t, w, p, pcs);

        next[targetRowIdx] = targetRow;
      });

      notifyParent(next);
      return next;
    });
  };

  // Calculations for Footer Summary
  const validRows = rows.filter(r => {
    const pcs = parseFlexibleNumber(r.pcs);
    const t = parseFlexibleNumber(r.thickness);
    const w = parseFlexibleNumber(r.width);
    const p = parseFlexibleNumber(r.length);
    return pcs > 0 && (t > 0 || w > 0 || p > 0);
  });

  const totalPcs = validRows.reduce((sum, r) => sum + parseFlexibleNumber(r.pcs), 0);
  const totalM3 = validRows.reduce((sum, r) => {
    const m3Val = Number(r.m3 || 0);
    if (m3Val > 0) return sum + m3Val;
    const t = parseFlexibleNumber(r.thickness);
    const w = parseFlexibleNumber(r.width);
    const p = parseFlexibleNumber(r.length);
    const pcs = parseFlexibleNumber(r.pcs);
    return sum + calcRowM3(t, w, p, pcs);
  }, 0);

  return (
    <div className="space-y-2 w-full select-none" ref={containerRef}>
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <span>📊</span> Spreadsheet Tally Kayu (Excel Mode)
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground font-mono">
            {validRows.length} baris terisi
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleScanImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isScanning}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold"
              title="Foto lembar tally atau upload gambar untuk diisi otomatis oleh AI"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Membaca Foto...
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 mr-1" /> Scan Foto Tally (AI)
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRows(5)}
              className="h-7 text-xs bg-background"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" /> +5 Baris
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRows(10)}
              className="h-7 text-xs bg-background"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" /> +10 Baris
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearEmptyRows}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              title="Bersihkan baris kosong"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Bersihkan Kosong
            </Button>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div
        className="overflow-x-auto border rounded-lg shadow-sm bg-background relative"
        onMouseUp={handleMouseUp}
      >
        <table className="w-full text-xs border-collapse select-none">
          <thead>
            <tr className="bg-muted/70 border-b border-border text-foreground font-bold">
              <th className="py-2 px-2 text-center w-12 border-r border-border/50 text-muted-foreground select-none">
                No
              </th>
              {showSpecies && (
                <th className="py-2 px-2 text-left w-40 border-r border-border/50 select-none">
                  <div className="flex items-center justify-between">
                    <span>Jenis Kayu</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleFillDown("species", activeCell?.row ?? 0)}
                        title="Tarik nilai ini ke semua baris di bawah"
                        className="text-muted-foreground hover:text-primary p-0.5"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              )}
              {showGrade && (
                <th className="py-2 px-2 text-center w-20 border-r border-border/50 select-none">
                  Grade
                </th>
              )}
              {/* T (Tebal cm) */}
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-amber-500/5 select-none">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400">T (cm)</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleFillDown("thickness", activeCell?.row ?? 0)}
                      title="Tarik nilai T ke semua baris di bawah (Copy Down)"
                      className="text-muted-foreground hover:text-amber-600 p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/50"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </th>
              {/* L (Lebar cm) */}
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-blue-500/5 select-none">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-blue-700 dark:text-blue-400">L (cm)</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleFillDown("width", activeCell?.row ?? 0)}
                      title="Tarik nilai L ke semua baris di bawah (Copy Down)"
                      className="text-muted-foreground hover:text-blue-600 p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/50"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </th>
              {/* P (Panjang cm) */}
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-purple-500/5 select-none">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-purple-700 dark:text-purple-400">P (cm)</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleFillDown("length", activeCell?.row ?? 0)}
                      title="Tarik nilai P ke semua baris di bawah (Copy Down)"
                      className="text-muted-foreground hover:text-purple-600 p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-950/50"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </th>
              {/* PCS */}
              <th className="py-2 px-2 text-center w-24 border-r border-border/50 bg-emerald-500/5 select-none">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">PCS</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleFillDown("pcs", activeCell?.row ?? 0)}
                      title="Tarik nilai PCS ke semua baris di bawah (Copy Down)"
                      className="text-muted-foreground hover:text-emerald-600 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </th>
              {/* Kategori / Product Type (Optional) */}
              {showProductType && (
                <th className="py-2 px-2 text-left w-36 border-r border-border/50 select-none">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-bold text-foreground">Kategori</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleFillDown("productType", activeCell?.row ?? 0)}
                        title="Tarik nilai Kategori ke semua baris di bawah (Copy Down)"
                        className="text-muted-foreground hover:text-primary p-0.5 rounded hover:bg-muted"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              )}
              {/* M3 (Auto) */}
              <th className="py-2 px-3 text-right w-32 border-r border-border/50 font-bold text-foreground select-none">
                M³ (Volume)
              </th>
              {!readOnly && (
                <th className="py-2 px-1 text-center w-10 select-none"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, idx) => {
              const rowM3 = Number(row.m3 || 0);
              const isFilled = parseFlexibleNumber(row.pcs) > 0 || parseFlexibleNumber(row.thickness) > 0;

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isFilled ? "bg-background" : "bg-muted/10"
                  } hover:bg-muted/30`}
                >
                  {/* Row index */}
                  <td className="py-1 px-2 text-center text-muted-foreground font-mono font-medium border-r border-border/40 text-[11px] select-none">
                    {idx + 1}
                  </td>

                  {/* Species */}
                  {showSpecies && (
                    <td
                      data-cell-row={idx}
                      data-cell-col="species"
                      className={`py-0.5 px-1 border-r border-border/40 relative select-none ${getCellSelectionClasses(idx, "species")}`}
                      onMouseDown={(e) => handleCellMouseDown(idx, "species", e)}
                      onMouseEnter={() => handleCellMouseEnter(idx, "species")}
                    >
                      <Select
                        value={row.species || defaultSpecies}
                        disabled={readOnly}
                        onValueChange={(val) => {
                          handleCellChange(idx, "species", val || "");
                        }}
                      >
                        <SelectTrigger
                          id={`tally-cell-${idx}-species`}
                          className="h-8 w-full border border-transparent hover:border-input focus:border-primary bg-transparent px-2 text-xs font-semibold focus:outline-none uppercase justify-between shadow-none"
                          onFocus={() => {
                            setActiveCell({ row: idx, col: "species" });
                            setSelectionRange({ startRow: idx, startCol: "species", endRow: idx, endCol: "species" });
                          }}
                          onKeyDown={(e) => handleKeyDown(e as any, idx, "species")}
                        >
                          <SelectValue placeholder="Pilih Spesies">
                            {row.species || defaultSpecies}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent searchable={true} className="min-w-[180px]">
                          {speciesList.map((s, sIdx) => {
                            const val = (s.name || s.code || "").toUpperCase();
                            return (
                              <SelectItem key={s.id || sIdx} value={val}>
                                {s.name || s.code}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {renderFillHandle(idx, "species")}
                    </td>
                  )}

                  {/* Grade */}
                  {showGrade && (
                    <td
                      data-cell-row={idx}
                      data-cell-col="grade"
                      className={`py-0.5 px-1 border-r border-border/40 relative select-none ${getCellSelectionClasses(idx, "grade")}`}
                      onMouseDown={(e) => handleCellMouseDown(idx, "grade", e)}
                      onMouseEnter={() => handleCellMouseEnter(idx, "grade")}
                    >
                      <input
                        id={`tally-cell-${idx}-grade`}
                        disabled={readOnly}
                        className="h-8 w-full rounded border border-transparent hover:border-input focus:border-primary bg-transparent px-1 text-xs text-center font-bold uppercase focus:outline-none"
                        value={row.grade || "A"}
                        onFocus={() => {
                          setActiveCell({ row: idx, col: "grade" });
                          setSelectionRange({ startRow: idx, startCol: "grade", endRow: idx, endCol: "grade" });
                        }}
                        onKeyDown={e => handleKeyDown(e, idx, "grade")}
                        onChange={e => handleCellChange(idx, "grade", e.target.value.toUpperCase())}
                      />
                      {renderFillHandle(idx, "grade")}
                    </td>
                  )}

                  {/* T (Tebal cm) */}
                  <td
                    data-cell-row={idx}
                    data-cell-col="thickness"
                    className={`py-0.5 px-1 border-r border-border/40 bg-amber-500/[0.02] relative select-none ${getCellSelectionClasses(idx, "thickness")}`}
                    onMouseDown={(e) => handleCellMouseDown(idx, "thickness", e)}
                    onMouseEnter={() => handleCellMouseEnter(idx, "thickness")}
                  >
                    <Input
                      id={`tally-cell-${idx}-thickness`}
                      disabled={readOnly}
                      value={row.thickness ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "thickness" });
                        setSelectionRange({ startRow: idx, startCol: "thickness", endRow: idx, endCol: "thickness" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "thickness")}
                      onPaste={e => handlePaste(e, idx, "thickness")}
                      onChange={e => handleCellChange(idx, "thickness", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-transparent"
                    />
                    {renderFillHandle(idx, "thickness")}
                  </td>

                  {/* L (Lebar cm) */}
                  <td
                    data-cell-row={idx}
                    data-cell-col="width"
                    className={`py-0.5 px-1 border-r border-border/40 bg-blue-500/[0.02] relative select-none ${getCellSelectionClasses(idx, "width")}`}
                    onMouseDown={(e) => handleCellMouseDown(idx, "width", e)}
                    onMouseEnter={() => handleCellMouseEnter(idx, "width")}
                  >
                    <Input
                      id={`tally-cell-${idx}-width`}
                      disabled={readOnly}
                      value={row.width ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "width" });
                        setSelectionRange({ startRow: idx, startCol: "width", endRow: idx, endCol: "width" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "width")}
                      onPaste={e => handlePaste(e, idx, "width")}
                      onChange={e => handleCellChange(idx, "width", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent"
                    />
                    {renderFillHandle(idx, "width")}
                  </td>

                  {/* P (Panjang cm) */}
                  <td
                    data-cell-row={idx}
                    data-cell-col="length"
                    className={`py-0.5 px-1 border-r border-border/40 bg-purple-500/[0.02] relative select-none ${getCellSelectionClasses(idx, "length")}`}
                    onMouseDown={(e) => handleCellMouseDown(idx, "length", e)}
                    onMouseEnter={() => handleCellMouseEnter(idx, "length")}
                  >
                    <Input
                      id={`tally-cell-${idx}-length`}
                      disabled={readOnly}
                      value={row.length ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "length" });
                        setSelectionRange({ startRow: idx, startCol: "length", endRow: idx, endCol: "length" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "length")}
                      onPaste={e => handlePaste(e, idx, "length")}
                      onChange={e => handleCellChange(idx, "length", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-transparent"
                    />
                    {renderFillHandle(idx, "length")}
                  </td>

                  {/* PCS */}
                  <td
                    data-cell-row={idx}
                    data-cell-col="pcs"
                    className={`py-0.5 px-1 border-r border-border/40 bg-emerald-500/[0.02] relative select-none ${getCellSelectionClasses(idx, "pcs")}`}
                    onMouseDown={(e) => handleCellMouseDown(idx, "pcs", e)}
                    onMouseEnter={() => handleCellMouseEnter(idx, "pcs")}
                  >
                    <Input
                      id={`tally-cell-${idx}-pcs`}
                      disabled={readOnly}
                      value={row.pcs ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "pcs" });
                        setSelectionRange({ startRow: idx, startCol: "pcs", endRow: idx, endCol: "pcs" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "pcs")}
                      onPaste={e => handlePaste(e, idx, "pcs")}
                      onChange={e => handleCellChange(idx, "pcs", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-bold text-foreground border-transparent hover:border-input focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-transparent"
                    />
                    {renderFillHandle(idx, "pcs")}
                  </td>

                  {/* Kategori / Product Type (Optional) */}
                  {showProductType && (
                    <td
                      data-cell-row={idx}
                      data-cell-col="productType"
                      className={`py-0.5 px-1 border-r border-border/40 relative select-none ${getCellSelectionClasses(idx, "productType")}`}
                      onMouseDown={(e) => handleCellMouseDown(idx, "productType", e)}
                      onMouseEnter={() => handleCellMouseEnter(idx, "productType")}
                    >
                      <select
                        id={`tally-cell-${idx}-productType`}
                        disabled={readOnly}
                        value={row.productType || defaultProductType}
                        className="h-7 w-full rounded border border-transparent hover:border-input focus:border-primary bg-transparent px-1.5 text-xs font-semibold focus:outline-none"
                        onFocus={() => {
                          setActiveCell({ row: idx, col: "productType" });
                          setSelectionRange({ startRow: idx, startCol: "productType", endRow: idx, endCol: "productType" });
                        }}
                        onChange={(e) => handleCellChange(idx, "productType", e.target.value)}
                      >
                        {PRODUCT_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {renderFillHandle(idx, "productType")}
                    </td>
                  )}

                  {/* M3 (Computed) */}
                  <td
                    data-cell-row={idx}
                    data-cell-col="m3"
                    className={`py-0.5 px-3 text-right font-mono font-bold text-foreground border-r border-border/40 bg-muted/20 text-xs relative select-none ${getCellSelectionClasses(idx, "m3")}`}
                    onMouseDown={(e) => handleCellMouseDown(idx, "m3", e)}
                    onMouseEnter={() => handleCellMouseEnter(idx, "m3")}
                  >
                    {rowM3 > 0 ? rowM3.toFixed(4) : "-"}
                    {renderFillHandle(idx, "m3")}
                  </td>

                  {/* Row delete */}
                  {!readOnly && (
                    <td className="py-0.5 px-1 text-center select-none">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="text-muted-foreground/40 hover:text-destructive p-1 rounded transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/60 font-bold border-t-2 border-border text-foreground">
            <tr>
              <td
                colSpan={
                  1 + // No
                  (showSpecies ? 1 : 0) +
                  (showGrade ? 1 : 0) +
                  3 // T, L, P
                }
                className="py-2.5 px-4 text-right tracking-wider uppercase text-xs text-muted-foreground font-semibold"
              >
                TOTAL FISIK TALLY:
              </td>
              <td className="py-2.5 px-2 text-center text-foreground font-bold font-mono text-sm bg-emerald-500/10">
                {totalPcs} Pcs
              </td>
              {showProductType && <td className="bg-emerald-500/10"></td>}
              <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm bg-emerald-500/10">
                {totalM3.toFixed(4)} m³
              </td>
              {!readOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Helpful keyboard hints */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-1 pt-1 gap-2">
        <div className="flex items-center gap-3">
          <span>
            ⌨️ <strong>Enter</strong>: Turun baris ke bawah
          </span>
          <span>
            ↕️ <strong>Panah Atas/Bawah</strong>: Pindah baris
          </span>
          <span>
            ↔️ <strong>Panah Kiri/Kanan</strong>: Pindah kolom
          </span>
          <span>
            📋 <strong>Ctrl + V</strong>: Paste langsung multi-baris dari Excel
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>💡 Gunakan tanda panah</span>
          <ArrowDown className="w-3 h-3 inline text-primary" />
          <span>di judul kolom untuk menyalin angka ke semua baris bawah.</span>
        </div>
      </div>

      <datalist id="sawn-spreadsheet-species-list">
        {speciesList.map((s, sIdx) => (
          <option key={s.id || sIdx} value={s.name || s.code} />
        ))}
      </datalist>
    </div>
  );
}
