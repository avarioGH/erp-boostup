'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR as formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PurchasingAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/purchasing/analytics');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Procurement Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500">Open PO Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(data.open_po_value)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500">Unreceived PO Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(data.unreceived_po_value)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500">Outstanding AP (Vendor Payable)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(data.outstanding_ap)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Suppliers by Volume</CardTitle></CardHeader>
        <CardContent className="h-64">
           {data.top_suppliers && data.top_suppliers.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.top_suppliers}>
                 <XAxis dataKey="supplierId" />
                 <YAxis />
                 <Tooltip formatter={(value: number) => formatCurrency(value)} />
                 <Bar dataKey="total" fill="#4f46e5" radius={[4,4,0,0]} />
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="flex h-full items-center justify-center text-gray-500">No data available</div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
