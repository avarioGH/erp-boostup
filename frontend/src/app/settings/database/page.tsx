"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { Loader2, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"

export default function SettingsDatabase() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetData = async () => {
    const confirmed = window.confirm(
      "PERHATIAN: Apakah Anda yakin ingin menghapus SEMUA data percobaan (Pembelian kayu, Stok kayu, Pergerakan stok, dan Hasil produksi)?\n\nData Master (Master Kayu, Gudang, Partai, Pengguna) TIDAK AKAN DIHAPUS."
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await api.get('/fix/reset-trial-data')
      setResult(res.data)
    } catch (err: any) {
      console.error("Error resetting trial data:", err)
      setError(err?.response?.data?.message || err?.message || "Gagal mereset data percobaan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Pemeliharaan & Reset Database</h1>
        <p className="text-muted-foreground">Kelola pembersihan data percobaan operasional dan pemeliharaan sistem.</p>
      </div>

      <Card className="border-destructive/30 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            <CardTitle>Reset Data Percobaan (Trial Data Purge)</CardTitle>
          </div>
          <CardDescription>
            Gunakan tombol ini untuk mengosongkan semua transaksi percobaan (Pembelian Sawn Timber & Log, Stok kayu aktif, Pergerakan stok/Stock card, dan Output produksi) agar Anda dapat mulai mengisi data riil dari nol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive dark:text-destructive-foreground">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Perlindungan Master Data</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Data master seperti <strong>Daftar Gudang, Master Species Kayu, Master Grade Kayu, Akun Pengguna, dan Partai</strong> tetap aman dan tidak akan dihapus. Hanya data transaksi operasional yang akan di-reset.
            </AlertDescription>
          </Alert>

          {result && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="font-semibold text-emerald-800 dark:text-emerald-200">Reset Berhasil!</AlertTitle>
              <AlertDescription className="text-sm mt-1">
                {result.message}
                {result.details && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-background/60 p-3 rounded-md border border-border">
                    <div>Data PO Dihapus: <strong>{result.details.deletedPurchases}</strong></div>
                    <div>Item PO Sawn: <strong>{result.details.deletedPurchaseItems}</strong></div>
                    <div>Item PO Log: <strong>{result.details.deletedPurchaseLogItems}</strong></div>
                    <div>Logistik/Pergerakan: <strong>{result.details.deletedMovements}</strong></div>
                    <div>Saldo Stok Di-reset: <strong>{result.details.resetStocks}</strong></div>
                    <div>Hasil Sawmill: <strong>{result.details.deletedSawnOutputs}</strong></div>
                    <div>Proses Chamber: <strong>{result.details.deletedProdProcesses}</strong></div>
                    <div>Transfer Stok: <strong>{result.details.deletedTransfers}</strong></div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Terjadi Kesalahan</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="pt-2">
            <Button
              variant="destructive"
              onClick={handleResetData}
              disabled={loading}
              className="gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sedang Membersihkan Data...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Hapus Semua Data Percobaan Sekarang
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
