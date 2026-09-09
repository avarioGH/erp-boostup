'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/utils';
import { User, Activity, FileText, ShoppingCart, Truck, CreditCard, Clock, CheckCircle } from 'lucide-react';

export default function Customer360Page() {
  const params = useParams();
  const customerId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchC360 = async () => {
      try {
        const res = await api.get('/crm/customers/' + params.id + '/360');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchC360();
  }, [customerId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Customer 360...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Customer not found or error loading data.</div>;

  const { customer, summary, timeline, opportunities, salesOrders, invoices, payments, quotations, deliveries } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-gray-500">{customer.company_name} | {customer.email} | {customer.phone}</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{customer.level}</span>
           <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Active</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(summary.total_invoiced || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Outstanding AR</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.outstanding || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Open Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.open_pipeline || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="sales">Sales & Quotations</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
               <CardHeader><CardTitle>Customer Health</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Win Rate</span>
                   <span className="font-semibold">{summary.win_rate !== null ? summary.win_rate.toFixed(1) + '%' : 'N/A'}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Weighted Pipeline</span>
                   <span className="font-semibold">{formatCurrency(summary.weighted_pipeline)}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Last Order Date</span>
                   <span className="font-semibold">{summary.last_order ? new Date(summary.last_order).toLocaleDateString() : 'N/A'}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Last Payment Date</span>
                   <span className="font-semibold">{summary.last_payment ? new Date(summary.last_payment).toLocaleDateString() : 'N/A'}</span>
                 </div>
                 <div className="flex justify-between pb-2">
                   <span className="text-gray-500">Profitability</span>
                   <span className="font-semibold text-gray-400">{summary.profitability}</span>
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader><CardTitle>Overdue Activities</CardTitle></CardHeader>
               <CardContent>
                 {data.activities?.overdue?.length > 0 ? (
                    <ul className="space-y-3">
                      {data.activities.overdue.map((act: any) => (
                         <li key={act.id} className="text-sm p-3 bg-red-50 border border-red-100 rounded">
                           <strong className="block text-red-700">{act.title}</strong>
                           <span className="text-red-600">Due: {new Date(act.due_date).toLocaleDateString()}</span>
                         </li>
                      ))}
                    </ul>
                 ) : (
                    <div className="text-gray-500 text-sm">No overdue activities.</div>
                 )}
               </CardContent>
             </Card>
           </div>
        </TabsContent>

        {/* OPPORTUNITIES */}
        <TabsContent value="opportunities">
           <Card>
             <CardHeader><CardTitle>Opportunities</CardTitle></CardHeader>
             <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Stage</th>
                      <th className="px-4 py-2">Value</th>
                      <th className="px-4 py-2">Probability</th>
                      <th className="px-4 py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((o: any) => (
                      <tr key={o.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{o.title}</td>
                        <td className="px-4 py-2">{o.stage}</td>
                        <td className="px-4 py-2">{formatCurrency(o.expected_value)}</td>
                        <td className="px-4 py-2">{o.probability}%</td>
                        <td className="px-4 py-2 text-xs">{o.lead?.lead_code || 'Manual'}</td>
                      </tr>
                    ))}
                    {opportunities.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No opportunities found.</td></tr>
                    )}
                  </tbody>
                </table>
             </CardContent>
           </Card>
        </TabsContent>

        {/* SALES & QUOTATIONS */}
        <TabsContent value="sales" className="space-y-6">
           <Card>
             <CardHeader><CardTitle>Sales Orders</CardTitle></CardHeader>
             <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Order #</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesOrders.map((so: any) => (
                      <tr key={so.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{so.order_number}</td>
                        <td className="px-4 py-2">{new Date(so.order_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{so.status}</td>
                        <td className="px-4 py-2">{formatCurrency(so.total_amount)}</td>
                      </tr>
                    ))}
                    {salesOrders.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center">No sales orders.</td></tr>}
                  </tbody>
                </table>
             </CardContent>
           </Card>
           
           <Card>
             <CardHeader><CardTitle>Deliveries</CardTitle></CardHeader>
             <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Delivery #</th>
                      <th className="px-4 py-2">Sales Order</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d: any) => (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{d.delivery_number}</td>
                        <td className="px-4 py-2 text-xs">{d.sales_order?.order_number}</td>
                        <td className="px-4 py-2">{new Date(d.delivery_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{d.status}</td>
                      </tr>
                    ))}
                    {deliveries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center">No deliveries.</td></tr>}
                  </tbody>
                </table>
             </CardContent>
           </Card>
        </TabsContent>

        {/* FINANCE */}
        <TabsContent value="finance" className="space-y-6">
           <Card>
             <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
             <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Invoice #</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Paid</th>
                      <th className="px-4 py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="px-4 py-2">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{inv.status}</td>
                        <td className="px-4 py-2">{formatCurrency(inv.total)}</td>
                        <td className="px-4 py-2 text-green-600">{formatCurrency(inv.paid_amount)}</td>
                        <td className="px-4 py-2 text-red-600">{formatCurrency(inv.remaining_amount)}</td>
                      </tr>
                    ))}
                    {invoices.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center">No invoices.</td></tr>}
                  </tbody>
                </table>
             </CardContent>
           </Card>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline">
           <Card>
             <CardHeader><CardTitle>Recent Activity (Top 50)</CardTitle></CardHeader>
             <CardContent>
                <div className="space-y-6 relative border-l border-gray-200 ml-3">
                  {timeline.map((event: any, i: number) => (
                     <div key={i} className="mb-6 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                           {event.type === 'INVOICE' || event.type === 'PAYMENT' ? <CreditCard className="w-3 h-3 text-blue-800" /> :
                            event.type === 'DELIVERY' ? <Truck className="w-3 h-3 text-blue-800" /> :
                            event.type === 'SALES_ORDER' || event.type === 'QUOTATION' ? <ShoppingCart className="w-3 h-3 text-blue-800" /> :
                            <FileText className="w-3 h-3 text-blue-800" />}
                        </span>
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">{event.title}</h3>
                        <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                          {new Date(event.date).toLocaleString()}
                        </time>
                     </div>
                  ))}
                  {timeline.length === 0 && <div className="text-gray-500 ml-6">No recent events.</div>}
                </div>
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
