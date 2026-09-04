'use client';
import { useEffect, useState } from 'react';
import { B2BApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';

export default function DeliveriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDeliveries(); }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await B2BApi.getDeliveries({ page: 1, limit: 50 });
      setData(res?.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex p-8 justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pengiriman (Deliveries)</h1>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Nomor</th>
                <th className="p-4 text-left">SO Ref</th>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-gray-500">Belum ada pengiriman.</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4">{item.delivery_number}</td>
                  <td className="p-4">{item.sales_order?.order_number || '-'}</td>
                  <td className="p-4">{new Date(item.delivery_date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-center">
                    {item.status === 'DONE' ? <Badge className="bg-green-500">Done</Badge> : <Badge variant="secondary">Waiting</Badge>}
                  </td>
                  <td className="p-4 text-center"><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
