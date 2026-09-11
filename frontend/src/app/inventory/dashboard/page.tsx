'use client';
import { useEffect, useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryDashboard() {
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 TimberAPI.getDashboardSummary().then((res: any) => {
 setData(res);
 setLoading(false);
 }).catch((e: any) => {
 console.error(e);
 setLoading(false);
 });
 }, []);

 if (loading) return <div className="p-8">Loading dashboard...</div>;
 if (!data) return <div className="p-8 text-red-500">Failed to load dashboard.</div>;

 return (
 <div className="p-8 space-y-8 min-h-screen bg-muted/30 dark:bg-transparent text-foreground ">
 <div className="flex items-center justify-between">
 <h1 className="text-3xl font-bold">Inventory Timber & Logs Dashboard</h1>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
 
 <Card className="border-l-4 border-l-blue-500">
 <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-blue-700 dark:text-blue-400">Log Masuk</CardTitle></CardHeader>
 <CardContent className="space-y-1 text-sm">
 <div className="flex justify-between"><span>Total Logs:</span> <span className="font-bold">{data.logMasuk?.totalLogs || 0}</span></div>
 <div className="flex justify-between"><span>Gross M3:</span> <span className="font-bold">{data.logMasuk?.grossM3?.toFixed(4) || '0.0000'}</span></div>
 <div className="flex justify-between text-blue-600 dark:text-blue-400"><span>Net M3:</span> <span className="font-bold">{data.logMasuk?.netM3?.toFixed(4) || '0.0000'}</span></div>
 </CardContent>
 </Card>

 <Card className="border-l-4 border-l-orange-500">
 <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-orange-700 dark:text-orange-400">Trimming</CardTitle></CardHeader>
 <CardContent className="space-y-1 text-sm">
 <div className="flex justify-between"><span>Raw Logs:</span> <span className="font-bold">{data.trimming?.rawLogs || 0}</span></div>
 <div className="flex justify-between"><span>Trimmed Pcs:</span> <span className="font-bold">{data.trimming?.trimmedPieces || 0}</span></div>
 <div className="flex justify-between text-orange-600 dark:text-orange-400"><span>Volume:</span> <span className="font-bold">{data.trimming?.volume?.toFixed(4) || '0.0000'}</span></div>
 </CardContent>
 </Card>

 <Card className="border-l-4 border-l-purple-500">
 <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-purple-700 dark:text-purple-400">Input Produksi</CardTitle></CardHeader>
 <CardContent className="space-y-1 text-sm">
 <div className="flex justify-between"><span>Total Logs:</span> <span className="font-bold">{data.inputProduksi?.totalLogs || 0}</span></div>
 <div className="flex justify-between text-purple-600 dark:text-purple-400"><span>Input Volume:</span> <span className="font-bold">{data.inputProduksi?.volume?.toFixed(4) || '0.0000'}</span></div>
 </CardContent>
 </Card>

 <Card className="border-l-4 border-l-green-500">
 <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-green-700 dark:text-green-400">Hasil Produksi</CardTitle></CardHeader>
 <CardContent className="space-y-1 text-sm">
 <div className="flex justify-between"><span>Total Bundles:</span> <span className="font-bold">{data.hasilProduksi?.totalBundles || 0}</span></div>
 <div className="flex justify-between"><span>Total PCS:</span> <span className="font-bold">{data.hasilProduksi?.totalPcs || 0}</span></div>
 <div className="flex justify-between text-green-600 dark:text-green-400"><span>Total M3:</span> <span className="font-bold">{data.hasilProduksi?.totalM3?.toFixed(4) || '0.0000'}</span></div>
 </CardContent>
 </Card>

 <Card className="border-l-4 border-l-slate-700 bg-slate-800 text-white">
 <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase text-slate-300">Current Stock</CardTitle></CardHeader>
 <CardContent className="space-y-1 text-sm">
 <div className="flex justify-between"><span>Current PCS:</span> <span className="font-bold">{data.stock?.currentPcs || 0}</span></div>
 <div className="flex justify-between text-slate-300"><span>Current M3:</span> <span className="font-bold">{data.stock?.currentM3?.toFixed(4) || '0.0000'}</span></div>
 </CardContent>
 </Card>
 
 </div>
 </div>
 );
}
