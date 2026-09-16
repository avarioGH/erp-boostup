'use client';
import { useEffect, useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface DashData {
  logMasuk: { totalLogs: number; grossM3: number; netM3: number };
  trimming: { rawLogs: number; trimmedPieces: number; volume: number };
  inputProduksi: { totalLogs: number; volume: number };
  hasilProduksi: { totalBundles: number; totalPCS: number; totalM3: number };
  currentStock: { currentPCS: number; currentM3: number };
}

const EMPTY: DashData = {
  logMasuk: { totalLogs: 0, grossM3: 0, netM3: 0 },
  trimming: { rawLogs: 0, trimmedPieces: 0, volume: 0 },
  inputProduksi: { totalLogs: 0, volume: 0 },
  hasilProduksi: { totalBundles: 0, totalPCS: 0, totalM3: 0 },
  currentStock: { currentPCS: 0, currentM3: 0 },
};

export default function InventoryDashboard() {
  const [data, setData] = useState<DashData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TimberAPI.getDashboardSummary()
      .then((res: any) => {
        // Check if the summary endpoint returned real data
        if (res && (res.logMasuk || res.trimming || res.inputProduksi)) {
          setData({
            logMasuk: res.logMasuk || EMPTY.logMasuk,
            trimming: res.trimming || EMPTY.trimming,
            inputProduksi: res.inputProduksi || EMPTY.inputProduksi,
            hasilProduksi: res.hasilProduksi || EMPTY.hasilProduksi,
            // Handle both field name variants (currentStock vs stock)
            currentStock: res.currentStock || res.stock || EMPTY.currentStock,
          });
        } else {
          // Fallback: load counts directly from individual APIs
          return Promise.allSettled([
            TimberAPI.getRawLogs({ take: 1 }),
            TimberAPI.getTrimmedLogs({ take: 1 }),
            TimberAPI.getInputLogs({ take: 1 }),
            TimberAPI.getSawnOutputs({ take: 1 }),
          ]).then(([raw, trim, input, sawn]) => {
            setData({
              logMasuk: {
                totalLogs: (raw.status === 'fulfilled' && raw.value?.total) || 0,
                grossM3: 0,
                netM3: 0,
              },
              trimming: {
                rawLogs: (trim.status === 'fulfilled' && trim.value?.total) || 0,
                trimmedPieces: (trim.status === 'fulfilled' && trim.value?.total) || 0,
                volume: 0,
              },
              inputProduksi: {
                totalLogs: (input.status === 'fulfilled' && input.value?.total) || 0,
                volume: 0,
              },
              hasilProduksi: {
                totalBundles: (sawn.status === 'fulfilled' && sawn.value?.total) || 0,
                totalPCS: 0,
                totalM3: 0,
              },
              currentStock: { currentPCS: 0, currentM3: 0 },
            });
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-muted/30 dark:bg-transparent text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold">Inventory Timber &amp; Logs Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-blue-700 dark:text-blue-400">Log Masuk</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Total Logs:</span> <span className="font-bold">{data.logMasuk.totalLogs}</span></div>
            <div className="flex justify-between"><span>Gross M3:</span> <span className="font-bold">{data.logMasuk.grossM3.toFixed(4)}</span></div>
            <div className="flex justify-between text-blue-600 dark:text-blue-400"><span>Net M3:</span> <span className="font-bold">{data.logMasuk.netM3.toFixed(4)}</span></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-orange-700 dark:text-orange-400">Trimming</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Raw Logs:</span> <span className="font-bold">{data.trimming.rawLogs}</span></div>
            <div className="flex justify-between"><span>Trimmed Pcs:</span> <span className="font-bold">{data.trimming.trimmedPieces}</span></div>
            <div className="flex justify-between text-orange-600 dark:text-orange-400"><span>Volume:</span> <span className="font-bold">{data.trimming.volume.toFixed(4)}</span></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-purple-700 dark:text-purple-400">Input Produksi</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Total Logs:</span> <span className="font-bold">{data.inputProduksi.totalLogs}</span></div>
            <div className="flex justify-between text-purple-600 dark:text-purple-400"><span>Input Volume:</span> <span className="font-bold">{data.inputProduksi.volume.toFixed(4)}</span></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-green-700 dark:text-green-400">Hasil Produksi</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Total Bundles:</span> <span className="font-bold">{data.hasilProduksi.totalBundles}</span></div>
            <div className="flex justify-between"><span>Total PCS:</span> <span className="font-bold">{data.hasilProduksi.totalPCS}</span></div>
            <div className="flex justify-between text-green-600 dark:text-green-400"><span>Total M3:</span> <span className="font-bold">{data.hasilProduksi.totalM3.toFixed(4)}</span></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-700 bg-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-slate-300">Current Stock</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Current PCS:</span> <span className="font-bold">{data.currentStock.currentPCS}</span></div>
            <div className="flex justify-between text-slate-300"><span>Current M3:</span> <span className="font-bold">{data.currentStock.currentM3.toFixed(4)}</span></div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
