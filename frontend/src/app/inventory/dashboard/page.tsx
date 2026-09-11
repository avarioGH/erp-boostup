'use client';
import { useEffect, useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InventoryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TimberAPI.getDashboardSummary().then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard.</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Finished M??</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.finishedTimber.totalM3.toFixed(4)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Finished PCS</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.finishedTimber.totalPcs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active SKUs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.finishedTimber.activeSkus}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Warehouse Locations</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.finishedTimber.locationsCount}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Raw Material</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span>Raw Logs Count:</span> <span className="font-medium">{data.rawMaterial.rawLogsCount}</span></div>
            <div className="flex justify-between"><span>Raw Logs Net M??:</span> <span className="font-medium">{data.rawMaterial.rawLogNetM3.toFixed(4)}</span></div>
            <div className="flex justify-between"><span>Trimmed Logs:</span> <span className="font-medium">{data.rawMaterial.trimmedLogsCount}</span></div>
            <div className="flex justify-between"><span>WIP / Input Net M??:</span> <span className="font-medium">{data.rawMaterial.inputLogNetM3.toFixed(4)}</span></div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader><CardTitle>Movements (Today)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span>Stock IN (PCS):</span> <span className="font-medium text-green-600">{data.movements.todayIn}</span></div>
            <div className="flex justify-between"><span>Stock OUT (PCS):</span> <span className="font-medium text-red-600">{data.movements.todayOut}</span></div>
            <div className="flex justify-between"><span>Adjustments:</span> <span className="font-medium">{data.movements.todayAdj}</span></div>
            <div className="flex justify-between"><span>Transfers:</span> <span className="font-medium">{data.movements.todayTrf}</span></div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-800">Health Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-red-900">
            <div className="flex justify-between"><span>Low Stock SKUs:</span> <span className="font-bold">{data.stockAlerts.lowStockCount}</span></div>
            <div className="flex justify-between"><span>Zero Stock SKUs:</span> <span className="font-bold">{data.stockAlerts.zeroStockCount}</span></div>
            <div className="flex justify-between"><span>Negative Stock Anomalies:</span> <span className="font-bold">{data.stockAlerts.negativeStockCount}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Production Outputs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentActivity.outputs.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.bundleNumber}</TableCell>
                  <TableCell>{new Date(o.outputDate).toLocaleDateString()}</TableCell>
                  <TableCell>{o.location?.name}</TableCell>
                  <TableCell>{o.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

