'use client';
import { useEffect, useState } from 'react';
import { DashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, ArrowDownToLine, ArrowUpFromLine, Factory, LayoutDashboard, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

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

  if (loading) return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Dashboard...</span>
      </div>
    </div>
  );

  const kpi = data?.kpi || { stock: 0, stockM3: 0, todayIn: 0, todayInM3: 0, todayOut: 0, todayOutM3: 0, production: 0, productionM3: 0 };
  const ledgerHealth = data?.ledgerHealth || 'BALANCED';
  const warehouseSummary = data?.warehouseSummary || [];
  const recentMovements = data?.recentMovements || [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Inventory Dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Operational overview of your timber inventory, production, and logistics.
          </p>
        </div>
        
        {/* Ledger Health Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${ledgerHealth === 'BALANCED' ? 'bg-success/10 border-success/20 text-success-foreground' : 'bg-destructive/10 border-destructive/20 text-destructive'} shadow-sm`}>
          {ledgerHealth === 'BALANCED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Ledger Health: <span className="font-extrabold">{ledgerHealth}</span>
          </span>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Stock */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 md:px-5">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Total Stock
              <Package className="w-4 h-4 opacity-50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 space-y-1">
            <div className="text-xl md:text-3xl font-bold text-foreground">
              {Number(kpi.stock || 0).toLocaleString()} <span className="text-xs md:text-sm font-medium text-muted-foreground">PCS</span>
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              {Number(kpi.stockM3 || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} M3
            </div>
          </CardContent>
        </Card>

        {/* Today In */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 md:px-5">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Today Inflow
              <ArrowDownToLine className="w-4 h-4 text-primary opacity-70" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 space-y-1">
            <div className="text-xl md:text-3xl font-bold text-foreground">
              {Number(kpi.todayIn || 0).toLocaleString()} <span className="text-xs md:text-sm font-medium text-muted-foreground">PCS</span>
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              {Number(kpi.todayInM3 || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} M3
            </div>
          </CardContent>
        </Card>

        {/* Today Out */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 md:px-5">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Today Outflow
              <ArrowUpFromLine className="w-4 h-4 text-destructive opacity-70" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 space-y-1">
            <div className="text-xl md:text-3xl font-bold text-destructive">
              {Number(kpi.todayOut || 0).toLocaleString()} <span className="text-xs md:text-sm font-medium opacity-80">PCS</span>
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              {Number(kpi.todayOutM3 || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} M3
            </div>
          </CardContent>
        </Card>

        {/* Production Today */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 md:px-5">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Production Today
              <Factory className="w-4 h-4 text-success opacity-70" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 space-y-1">
            <div className="text-xl md:text-3xl font-bold text-success">
              {Number(kpi.production || 0).toLocaleString()} <span className="text-xs md:text-sm font-medium opacity-80">PCS</span>
            </div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              {Number(kpi.productionM3 || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} M3
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WAREHOUSE SUMMARY */}
        <Card className="lg:col-span-4 border border-border shadow-sm flex flex-col">
          <CardHeader className="px-5 pt-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold">Stock by Warehouse</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {warehouseSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground flex-1">
                <Package className="w-8 h-8 opacity-20 mb-2" />
                <span className="text-sm">No warehouse data</span>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {warehouseSummary.map((w: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-sm font-medium text-foreground/90">{w.name}</span>
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                      {Number(w.stock || 0).toLocaleString()} PCS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECENT MOVEMENTS */}
        <Card className="lg:col-span-8 border border-border shadow-sm flex flex-col">
          <CardHeader className="px-5 pt-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold">Recent Movements</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden flex-1">
            <div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 opacity-20" />
                          <span>No recent movements</span>
                        </div>
                      </td>
                    </tr>
                  ) : recentMovements.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground/80">
                        {m.date ? new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          (m.type || '').includes('IN') ? 'bg-success/15 text-success-foreground' : 
                          (m.type || '').includes('OUT') ? 'bg-destructive/15 text-destructive' : 
                          'bg-primary/15 text-primary'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-foreground">
                        {Number(m.qty || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
