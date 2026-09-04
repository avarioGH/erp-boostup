'use client';
import { useEffect, useState } from 'react';
import { B2BApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Eye } from 'lucide-react';

export default function QuotationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await B2BApi.getQuotations({ page: 1, limit: 50 });
      setData(res?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'SENT': return <Badge variant="outline" className="text-blue-500">Sent</Badge>;
      case 'CONFIRMED': return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="flex p-8 justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Penawaran (Quotations)</h1>
        <Button><Plus className="w-4 h-4 mr-2" /> Penawaran Baru</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Nomor</th>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Tanggal</th>
                  <th className="p-4 text-right font-medium">Total</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-gray-500">Belum ada penawaran.</td></tr>
                ) : data.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">{item.quotation_number}</td>
                    <td className="p-4">{item.customer?.name || '-'}</td>
                    <td className="p-4">{new Date(item.quotation_date).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-right">Rp {item.total_amount?.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="p-4 text-center flex justify-center">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
