'use client';
import { useEffect, useState } from 'react';
import { B2BApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Eye } from 'lucide-react';

export default function InvoicesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await B2BApi.getInvoices({ page: 1, limit: 50 });
      setData(res?.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex p-8 justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Faktur Penjualan (Invoices)</h1>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Faktur</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Due Date</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Terbayar</th>
                <th className="p-4 text-right">Sisa</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-gray-500">Belum ada faktur.</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4">{item.invoice_number}</td>
                  <td className="p-4">{item.customer?.name || '-'}</td>
                  <td className="p-4">{new Date(item.due_date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-right">Rp {item.total?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right">Rp {item.paid_amount?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right font-medium">Rp {item.remaining_amount?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center">
                    {item.status === 'PAID' ? <Badge className="bg-green-500">Paid</Badge> : 
                     item.status === 'POSTED' ? <Badge className="bg-blue-500">Posted</Badge> : 
                     <Badge variant="secondary">Draft</Badge>}
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
