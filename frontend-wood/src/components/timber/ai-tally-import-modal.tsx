"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AiAPI } from "@/lib/api";
import { Sparkles, UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiTallyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowType?: "RAW_LOG" | "SAWN_TIMBER";
  onDataParsed: (parsedRows: any[]) => void;
}

export function AiTallyImportModal({
  isOpen,
  onClose,
  workflowType = "RAW_LOG",
  onDataParsed,
}: AiTallyImportModalProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean preview URL when unmounted or changed
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle global paste event (e.g. user copied an image directly from WhatsApp / Snipping tool)
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelected(file);
            toast({
              title: "Gambar Terdeteksi",
              description: "Foto dari clipboard WhatsApp berhasil dimuat!",
            });
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [isOpen, toast]);

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    setParsedPreview(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleAnalyzeWithAi = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AiAPI.parseTallyDocument(selectedFile, workflowType);
      if (res && res.items && Array.isArray(res.items) && res.items.length > 0) {
        setParsedPreview(res.items);
        toast({
          title: "Berhasil Membaca Dokumen!",
          description: `AI berhasil mengekstrak ${res.items.length} baris data kayu.`,
        });
      } else {
        throw new Error("AI tidak menemukan baris data kayu yang valid pada dokumen ini.");
      }
    } catch (err: any) {
      console.error("AI Parse Error:", err);
      let msg = err.response?.data?.message || err.message || "";
      if (err.code === "ECONNABORTED" || msg.includes("timeout")) {
        msg = "Proses membaca foto memakan waktu terlalu lama. Pastikan koneksi internet stabil dan coba kembali dengan resolusi foto yang jelas.";
      } else if (!msg || msg.includes("Network Error") || msg.includes("500")) {
        msg = "Data tidak bisa dibaca oleh AI. Pastikan foto tabel kayu/nota tegak lurus, tulisan angka jelas, dan tidak buram.";
      }
      setErrorMsg(msg);
      toast({
        title: "Data Tidak Bisa Dibaca AI",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToTable = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    onDataParsed(parsedPreview);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setParsedPreview(null);
    setErrorMsg(null);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleResetModal(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>AI Auto-Fill: Input Data Massal by Foto / Dokumen</span>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  {workflowType === "RAW_LOG" ? "🪵 Raw Log (DUKB)" : "🌲 Sawn Timber"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Drag & drop foto dari supplier, pilih file dokumen, atau langsung tekan <strong>Ctrl + V</strong> (Paste) dari WhatsApp.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMsg && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-50 dark:bg-red-950/30 text-xs">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line font-medium">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* DROPZONE AREA */}
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="font-semibold text-sm text-foreground">
                Drag & drop foto / file tally di sini, atau <span className="text-primary underline">pilih file</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Mendukung foto nota, daftar fisik log dari WhatsApp, atau dokumen rekap supplier.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-full text-muted-foreground border">
                <span>💡 Tip: Bisa langsung tekan <strong>Ctrl + V</strong> untuk paste foto dari WhatsApp</span>
              </div>
            </div>
          ) : (
            /* PREVIEW OF UPLOADED IMAGE */
            <div className="border rounded-xl p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold truncate max-w-xs">{selectedFile?.name || "Foto dari Clipboard"}</span>
                  <span className="text-[11px] text-muted-foreground">({selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : ""})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetModal}
                  disabled={isLoading}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Ganti Foto
                </Button>
              </div>

              {selectedFile?.type.startsWith("image/") && (
                <div className="relative max-h-56 overflow-hidden rounded-lg bg-black/5 flex items-center justify-center border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview Dokumen" className="max-h-56 object-contain" />
                </div>
              )}

              {/* ACTION BUTTON TO RUN OCR + AI */}
              {!parsedPreview && (
                <Button
                  type="button"
                  onClick={handleAnalyzeWithAi}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 h-10 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Membaca & Mengekstrak Tabel Kayu dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Mulai Baca Data Kayu dengan AI</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* PARSED DATA PREVIEW TABLE */}
          {parsedPreview && (
            <div className="border rounded-xl overflow-hidden shadow-sm bg-card space-y-2 p-3 border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hasil Ekstraksi AI: {parsedPreview.length} Baris Kayu</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Siap Dimasukkan ke Tabel
                </Badge>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/80 sticky top-0 border-b">
                    <tr>
                      <th className="p-2 w-8 text-center">No</th>
                      {workflowType === "RAW_LOG" ? (
                        <>
                          <th className="p-2">No Log</th>
                          <th className="p-2">Spesies</th>
                          <th className="p-2 text-right">P (cm/m)</th>
                          <th className="p-2 text-right">D1 (cm)</th>
                          <th className="p-2 text-right">D2 (cm)</th>
                          <th className="p-2 text-right">RT</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2">Spesies</th>
                          <th className="p-2">Grade</th>
                          <th className="p-2 text-right">T (cm)</th>
                          <th className="p-2 text-right">L (cm)</th>
                          <th className="p-2 text-right">P (cm)</th>
                          <th className="p-2 text-right">Pcs</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                        {workflowType === "RAW_LOG" ? (
                          <>
                            <td className="p-2 font-mono font-medium">{row.logNumber || `LOG-${idx + 1}`}</td>
                            <td className="p-2">{row.species || "MERBAU"}</td>
                            <td className="p-2 text-right">{row.length}</td>
                            <td className="p-2 text-right">{row.d1}</td>
                            <td className="p-2 text-right">{row.d2}</td>
                            <td className="p-2 text-right">{row.rt || (row.d1 && row.d2 ? Math.round(((row.d1 + row.d2) / 2) * 10) / 10 : "-")}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{row.species || "MERBAU"}</td>
                            <td className="p-2">{row.grade || "A"}</td>
                            <td className="p-2 text-right">{row.thickness}</td>
                            <td className="p-2 text-right">{row.width}</td>
                            <td className="p-2 text-right">{row.length}</td>
                            <td className="p-2 text-right">{row.pcs}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => { handleResetModal(); onClose(); }}>
            Batal
          </Button>
          {parsedPreview && (
            <Button
              type="button"
              onClick={handleApplyToTable}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
            >
              Masukkan ke Tabel ({parsedPreview.length} Baris)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
