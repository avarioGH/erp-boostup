'use client';
import { useEffect, useState } from 'react';
import { DashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InventoryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardAPI.getSummary()
      .then((res: any) => {
        setData(res || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const kpi = data?.kpi || { stock: 0, todayIn: 0, todayOut: 0 };
  const ledgerHealth = data?.ledgerHealth || 'BALANCED';
  const warehouseSummary = data?.warehouseSummary || [];
  const productionTrend = data?.productionTrend || [];
  const recentMovements = data?.recentMovements || [];

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-muted/30 dark:bg-transparent text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
        <div className={`px-4 py-2 rounded font-bold text-white ${ledgerHealth === 'BALANCED' ? 'bg-green-600' : 'bg-red-600'}`}>
          Ledger Health: {ledgerHealth}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase">Total Stock</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpi.stock}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase">Today In</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpi.todayIn}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase">Today Out</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpi.todayOut}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Warehouse Summary</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b"><th className="text-left py-2">Warehouse</th><th className="text-right py-2">Stock</th></tr>
              </thead>
              <tbody>
                {warehouseSummary.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-4 text-muted-foreground">No data</td></tr>
                ) : warehouseSummary.map((w: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{w.name}</td>
                    <td className="text-right py-2">{w.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Production Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            {productionTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Movements</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left py-2">Type</th><th className="text-right py-2">Quantity</th></tr>
            </thead>
            <tbody>
              {recentMovements.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No recent movements</td></tr>
              ) : recentMovements.map((m: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                  <td className="py-2">{m.type}</td>
                  <td className="text-right py-2">{m.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
