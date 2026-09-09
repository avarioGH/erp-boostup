'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatIDR as formatCurrency } from '@/lib/utils';
import { CheckCircle, Truck, FileText, CreditCard } from 'lucide-react';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPO();
  }, [id]);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/purchasing/orders/${id}`);
      setPo(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmPO = async () => {
    try {
      await api.post(`/purchasing/rfq/${id}/confirm`, {});
      fetchPO();
    } catch (err) {
      console.error(err);
      alert('Error confirming PO');
    }
  };

  const receiveGoods = async () => {
    try {
      // Mock full receipt for now. In reality, would be a form.
      const payload = {
        items: po.items.map((i: any) => ({
          productId: i.product_id,
          qty: i.qty - i.received_qty // Receive remaining
        })).filter((i:any) => i.qty > 0)
      };
      if (payload.items.length === 0) return alert('Nothing left to receive');
      await api.post(`/purchasing/orders/${id}/receive`, payload);
      fetchPO();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error receiving');
    }
  };

  const createBill = async () => {
    try {
      const payload = {
        items: po.items.map((i: any) => ({
          productId: i.product_id,
          qty: i.qty - (i.billed_qty || 0)
        })).filter((i:any) => i.qty > 0),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString()
      };
      if (payload.items.length === 0) return alert('Nothing left to bill');
      await api.post(`/purchasing/orders/${id}/bill`, payload);
      fetchPO();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error billing');
    }
  };

  const payBill = async (invoiceId: string, amount: number) => {
    try {
      await api.post(`/purchasing/invoices/${invoiceId}/pay`, { amount, method: 'BANK_TRANSFER' });
      fetchPO();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error paying');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!po) return <div className="p-8 text-center text-red-500">PO not found</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold">{po.order_number}</h1>
          <p className="text-gray-500">Supplier: {po.supplier?.name} | Date: {new Date(po.order_date).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold">{po.status}</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Receipt: {po.receipt_status}</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">Bill: {po.bill_status}</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Payment: {po.payment_status}</span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex gap-4">
        {po.status === 'DRAFT' && <button onClick={confirmPO} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm PO</button>}
        {po.status === 'CONFIRMED' && po.receipt_status !== 'RECEIVED' && <button onClick={receiveGoods} className="px-4 py-2 bg-blue-600 text-white rounded">Receive Full Remaining</button>}
        {po.status === 'CONFIRMED' && po.bill_status !== 'BILLED' && <button onClick={createBill} className="px-4 py-2 bg-purple-600 text-white rounded">Create Vendor Bill</button>}
      </div>

      <Tabs defaultValue="lines">
        <TabsList className="mb-4">
          <TabsTrigger value="lines">Order Lines</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="bills">Vendor Bills</TabsTrigger>
        </TabsList>
        
        {/* LINES */}
        <TabsContent value="lines">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Ordered</th>
                    <th className="p-4">Received</th>
                    <th className="p-4">Billed</th>
                    <th className="p-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((i: any) => (
                    <tr key={i.id} className="border-b">
                      <td className="p-4 font-medium">{i.product?.name}</td>
                      <td className="p-4">{formatCurrency(i.unit_price)}</td>
                      <td className="p-4 font-bold">{i.qty}</td>
                      <td className="p-4 text-blue-600">{i.received_qty}</td>
                      <td className="p-4 text-purple-600">{i.billed_qty || 0}</td>
                      <td className="p-4">{formatCurrency(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-4">
            <Card className="w-64">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(po.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RECEIPTS */}
        <TabsContent value="receipts">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Receipt #</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {po.receipts?.map((r: any) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-4 font-mono">{r.receipt_number}</td>
                      <td className="p-4">{new Date(r.receipt_date).toLocaleDateString()}</td>
                      <td className="p-4">{r.status}</td>
                    </tr>
                  ))}
                  {(!po.receipts || po.receipts.length === 0) && <tr><td colSpan={3} className="p-8 text-center text-gray-500">No receipts found.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLS */}
        <TabsContent value="bills">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Bill #</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Remaining</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {po.invoices?.map((inv: any) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-4 font-mono">{inv.invoice_number}</td>
                      <td className="p-4">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="p-4">{formatCurrency(inv.total)}</td>
                      <td className="p-4 text-green-600">{formatCurrency(inv.paid_amount)}</td>
                      <td className="p-4 text-red-600">{formatCurrency(inv.remaining_amount)}</td>
                      <td className="p-4">{inv.status}</td>
                      <td className="p-4">
                        {inv.remaining_amount > 0 && (
                          <button 
                            onClick={() => payBill(inv.id, inv.remaining_amount)}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                          >
                            Pay Full
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!po.invoices || po.invoices.length === 0) && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No vendor bills found.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
