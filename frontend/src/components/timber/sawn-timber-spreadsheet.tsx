"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowDown, Copy, ClipboardPaste, RotateCcw } from "lucide-react";

export interface SawnTallyRow {
  id?: string;
  species?: string;
  grade?: string;
  thickness: number | string; // T (cm)
  width: number | string;     // L (cm)
  length: number | string;    // P (cm)
  pcs: number | string;       // PCS
  m3?: number | string;       // M3 (auto or manual)
  notes?: string;
  [key: string]: any;
}

interface SawnTimberSpreadsheetProps {
  initialRows?: SawnTallyRow[];
  onChange?: (rows: SawnTallyRow[]) => void;
  speciesList?: Array<{ id?: string; code?: string; name: string }>;
  defaultSpecies?: string;
  defaultGrade?: string;
  showSpecies?: boolean;
  showGrade?: boolean;
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
  showSpecies = true,
  showGrade = false,
  readOnly = false,
}: SawnTimberSpreadsheetProps) {
  // Ensure we always have at least 10 rows for clean Excel-like experience
  const createEmptyRow = useCallback((): SawnTallyRow => ({
    species: defaultSpecies,
    grade: defaultGrade,
    thickness: "",
    width: "",
    length: "",
    pcs: "",
    m3: 0,
    notes: "",
  }), [defaultSpecies, defaultGrade]);

  const [rows, setRows] = useState<SawnTallyRow[]>(() => {
    if (initialRows && initialRows.length > 0) {
      return initialRows.map(r => {
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
    return Array.from({ length: 8 }, () => createEmptyRow());
  });

  const [activeCell, setActiveCell] = useState<{ row: number; col: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync back to parent when rows change
  const notifyParent = useCallback((updated: SawnTallyRow[]) => {
    if (onChange) {
      onChange(updated);
    }
  }, [onChange]);

  // Update a specific cell
  const handleCellChange = (rowIndex: number, colKey: keyof SawnTallyRow, rawVal: string) => {
    setRows(prev => {
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
  const handleFillDown = (colKey: "thickness" | "width" | "length" | "pcs" | "species" | "grade", fromRow: number) => {
    setRows(prev => {
      if (fromRow < 0 || fromRow >= prev.length) return prev;
      const sourceVal = prev[fromRow][colKey];
      const next = prev.map((r, i) => {
        if (i <= fromRow) return r;
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
    colKey: "thickness" | "width" | "length" | "pcs"
  ) => {
    const colOrder: Array<"thickness" | "width" | "length" | "pcs"> = ["thickness", "width", "length", "pcs"];
    const currentColIdx = colOrder.indexOf(colKey);

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
      if (input.selectionStart === input.value.length && currentColIdx < colOrder.length - 1) {
        e.preventDefault();
        const nextCol = colOrder[currentColIdx + 1];
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
        const prevCol = colOrder[currentColIdx - 1];
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

    const colOrder: Array<"thickness" | "width" | "length" | "pcs"> = ["thickness", "width", "length", "pcs"];
    let startColIdx = colOrder.indexOf(startCol as any);
    if (startColIdx === -1) startColIdx = 0;

    setRows(prev => {
      const next = [...prev];
      const requiredRows = startRow + parsedData.length;
      while (next.length < requiredRows) {
        next.push(createEmptyRow());
      }

      parsedData.forEach((rowVals, rIdx) => {
        const targetRowIdx = startRow + rIdx;
        const targetRow = { ...next[targetRowIdx] };

        rowVals.forEach((val, cIdx) => {
          const colName = colOrder[startColIdx + cIdx];
          if (colName) {
            targetRow[colName] = val.trim();
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
      <div className="overflow-x-auto border rounded-lg shadow-sm bg-background">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/70 border-b border-border text-foreground font-bold">
              <th className="py-2 px-2 text-center w-12 border-r border-border/50 text-muted-foreground">
                No
              </th>
              {showSpecies && (
                <th className="py-2 px-2 text-left w-36 border-r border-border/50">
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
                <th className="py-2 px-2 text-center w-20 border-r border-border/50">
                  Grade
                </th>
              )}
              {/* T (Tebal cm) */}
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-amber-500/5">
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
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-blue-500/5">
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
              <th className="py-2 px-2 text-center w-28 border-r border-border/50 bg-purple-500/5">
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
              <th className="py-2 px-2 text-center w-24 border-r border-border/50 bg-emerald-500/5">
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
              {/* M3 (Auto) */}
              <th className="py-2 px-3 text-right w-32 border-r border-border/50 font-bold text-foreground">
                M³ (Volume)
              </th>
              {!readOnly && (
                <th className="py-2 px-1 text-center w-10"></th>
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
                  <td className="py-1 px-2 text-center text-muted-foreground font-mono font-medium border-r border-border/40 text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Species */}
                  {showSpecies && (
                    <td className="py-0.5 px-1 border-r border-border/40">
                      <input
                        list={`species-list-${idx}`}
                        disabled={readOnly}
                        className="h-8 w-full rounded border border-transparent hover:border-input focus:border-primary bg-transparent px-2 text-xs font-semibold focus:outline-none uppercase"
                        value={row.species || ""}
                        onFocus={() => setActiveCell({ row: idx, col: "species" })}
                        onChange={e => handleCellChange(idx, "species", e.target.value.toUpperCase())}
                        placeholder="MERBAU"
                      />
                      <datalist id={`species-list-${idx}`}>
                        {speciesList.map((s, sIdx) => (
                          <option key={s.id || sIdx} value={s.name} />
                        ))}
                      </datalist>
                    </td>
                  )}

                  {/* Grade */}
                  {showGrade && (
                    <td className="py-0.5 px-1 border-r border-border/40">
                      <input
                        disabled={readOnly}
                        className="h-8 w-full rounded border border-transparent hover:border-input focus:border-primary bg-transparent px-1 text-xs text-center font-bold uppercase focus:outline-none"
                        value={row.grade || "A"}
                        onFocus={() => setActiveCell({ row: idx, col: "grade" })}
                        onChange={e => handleCellChange(idx, "grade", e.target.value.toUpperCase())}
                      />
                    </td>
                  )}

                  {/* T (Tebal cm) */}
                  <td className="py-0.5 px-1 border-r border-border/40 bg-amber-500/[0.02]">
                    <Input
                      id={`tally-cell-${idx}-thickness`}
                      disabled={readOnly}
                      value={row.thickness ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "thickness" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "thickness")}
                      onPaste={e => handlePaste(e, idx, "thickness")}
                      onChange={e => handleCellChange(idx, "thickness", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-transparent"
                    />
                  </td>

                  {/* L (Lebar cm) */}
                  <td className="py-0.5 px-1 border-r border-border/40 bg-blue-500/[0.02]">
                    <Input
                      id={`tally-cell-${idx}-width`}
                      disabled={readOnly}
                      value={row.width ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "width" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "width")}
                      onPaste={e => handlePaste(e, idx, "width")}
                      onChange={e => handleCellChange(idx, "width", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent"
                    />
                  </td>

                  {/* P (Panjang cm) */}
                  <td className="py-0.5 px-1 border-r border-border/40 bg-purple-500/[0.02]">
                    <Input
                      id={`tally-cell-${idx}-length`}
                      disabled={readOnly}
                      value={row.length ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "length" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "length")}
                      onPaste={e => handlePaste(e, idx, "length")}
                      onChange={e => handleCellChange(idx, "length", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-semibold border-transparent hover:border-input focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-transparent"
                    />
                  </td>

                  {/* PCS */}
                  <td className="py-0.5 px-1 border-r border-border/40 bg-emerald-500/[0.02]">
                    <Input
                      id={`tally-cell-${idx}-pcs`}
                      disabled={readOnly}
                      value={row.pcs ?? ""}
                      onFocus={e => {
                        setActiveCell({ row: idx, col: "pcs" });
                        e.target.select();
                      }}
                      onKeyDown={e => handleKeyDown(e, idx, "pcs")}
                      onPaste={e => handlePaste(e, idx, "pcs")}
                      onChange={e => handleCellChange(idx, "pcs", e.target.value)}
                      placeholder="0"
                      className="h-7 text-xs text-center font-mono font-bold text-foreground border-transparent hover:border-input focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-transparent"
                    />
                  </td>

                  {/* M3 (Computed) */}
                  <td className="py-0.5 px-3 text-right font-mono font-bold text-foreground border-r border-border/40 bg-muted/20 text-xs">
                    {rowM3 > 0 ? rowM3.toFixed(4) : "-"}
                  </td>

                  {/* Row delete */}
                  {!readOnly && (
                    <td className="py-0.5 px-1 text-center">
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
                colSpan={showSpecies ? (showGrade ? 5 : 4) : (showGrade ? 4 : 3)}
                className="py-2.5 px-4 text-right tracking-wider uppercase text-xs text-muted-foreground font-semibold"
              >
                TOTAL FISIK TALLY:
              </td>
              <td className="py-2.5 px-2 text-center text-foreground font-bold font-mono text-sm bg-emerald-500/10">
                {totalPcs} Pcs
              </td>
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
    </div>
  );
}
