'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CRMAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { formatCurrency } from '@/lib/utils';
import { User, Activity, FileText, ShoppingCart, Truck, CreditCard, CheckCircle, AlertTriangle, ArrowLeft, Building2, MapPin, Phone, Mail, FileClock, Navigation } from 'lucide-react';
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import Link from 'next/link';

export default function Customer360Page() {
 const params = useParams();
 const router = useRouter();
 const customerId = params.id as string;
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 const fetchC360 = async () => {
 try {
 setLoading(true);
 setError(null);
 const res = await CRMAPI.getCustomer360(customerId);
 setData(res);
 } catch (err: any) {
 console.error(err);
 setError(err.message || 'Failed to load customer data.');
 } finally {
 setLoading(false);
 }
 };
 fetchC360();
 }, [customerId]);

 if (loading) return (
 <div className="p-8 space-y-4 animate-pulse">
 <div className="h-20 bg-muted/50 rounded-lg"></div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="h-24 bg-muted/50 rounded-lg"></div><div className="h-24 bg-muted/50 rounded-lg"></div><div className="h-24 bg-muted/50 rounded-lg"></div><div className="h-24 bg-muted/50 rounded-lg"></div></div>
 <div className="h-64 bg-muted/50 rounded-lg"></div>
 </div>
 );
 if (error) return (
 <div className="p-8 text-center border border-red-100 bg-red-50 text-red-600 rounded-lg m-6">
 <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
 <p className="font-semibold">{error}</p>
 <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
 </div>
 );
 if (!data?.profile) return <div className="p-8 text-center text-red-500">Customer not found.</div>;

 const { profile, sales, finance, crm, timeline } = data;

 // Enhance timeline with unified data if backend timeline is incomplete
 let unifiedTimeline = [...(timeline || [])];
 
 // Create a composed chronological feed
 const feed = unifiedTimeline.map((t: any) => ({
 id: t.ref,
 type: t.type,
 date: new Date(t.date),
 title: t.type === 'ORDER' ? `Sales Order Created` : t.type === 'INVOICE' ? 'Invoice Posted' : 'Opportunity Created'
 })).sort((a, b) => b.date.getTime() - a.date.getTime());

 // Add more from actual arrays if not in timeline
 const allEvents = [
 ...crm.activities.map((a:any) => ({ id: a.id, type: 'ACTIVITY', date: new Date(a.created_at), title: `Activity: ${a.title} (${a.type})` })),
 ...sales.quotations.map((q:any) => ({ id: q.id, type: 'QUOTATION', date: new Date(q.created_at), title: `Quotation ${q.quotation_number} created` })),
 ...sales.deliveries.map((d:any) => ({ id: d.id, type: 'DELIVERY', date: new Date(d.created_at), title: `Delivery ${d.delivery_number} processed` })),
 ...finance.payments.map((p:any) => ({ id: p.id, type: 'PAYMENT', date: new Date(p.created_at), title: `Payment received: ${formatCurrency(p.amount)}` })),
 ...feed
 ].sort((a, b) => b.date.getTime() - a.date.getTime());

 return (
 <div className="space-y-6 pb-12 animate-in fade-in duration-300">
 {/* Action Bar */}
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <button onClick={() => router.push('/crm/customers')} className="flex items-center hover:text-foreground transition-colors">
 <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
 </button>
 </div>

 {/* Customer Header */}
 <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-card p-6 rounded-lg shadow-sm border">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-2xl font-bold">{profile.name}</h1>
 <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400">Active</Badge>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
 <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {profile.code}</div>
 <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone || '-'}</div>
 <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profile.email || '-'}</div>
 <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {profile.address || 'No address provided'}</div>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 md:justify-end">
 <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" /> New Quotation</Button>
 <Button variant="default" size="sm"><Activity className="w-4 h-4 mr-2" /> Log Activity</Button>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <Card className="shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced (LTV)</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{formatCurrency(sales.totalSales || 0)}</div>
 </CardContent>
 </Card>
 <Card className="shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{sales.orderCount}</div>
 </CardContent>
 </Card>
 <Card className="shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding AR</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-destructive">{formatCurrency(finance.outstandingAmount || 0)}</div>
 </CardContent>
 </Card>
 <Card className="shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Active Opportunities</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-primary">{crm.opportunities.length}</div>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs defaultValue="overview" className="w-full">
 <div className="overflow-x-auto pb-2">
 <TabsList className="bg-card border w-max md:w-full justify-start md:justify-center">
 <TabsTrigger value="overview">Overview & Timeline</TabsTrigger>
 <TabsTrigger value="crm">CRM</TabsTrigger>
 <TabsTrigger value="sales">Sales & Quotations</TabsTrigger>
 <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
 <TabsTrigger value="finance">Finance</TabsTrigger>
 </TabsList>
 </div>
 
 {/* OVERVIEW */}
 <TabsContent value="overview" className="space-y-6 mt-4">
 <Card className="shadow-sm">
 <CardHeader><CardTitle className="text-lg">Unified Timeline</CardTitle></CardHeader>
 <CardContent>
 <div className="space-y-6 relative border-l-2 border-muted ml-3">
 {allEvents.slice(0, 50).map((event: any, i: number) => (
 <div key={`${event.id}-${i}`} className="mb-6 ml-6 group">
 <span className="absolute flex items-center justify-center w-8 h-8 bg-background rounded-full -left-4 ring-4 ring-muted/30 group-hover:ring-primary/20 transition-all">
 {event.type === 'INVOICE' || event.type === 'PAYMENT' ? <CreditCard className="w-4 h-4 text-emerald-600" /> :
 event.type === 'DELIVERY' ? <Truck className="w-4 h-4 text-orange-600" /> :
 event.type === 'ORDER' || event.type === 'QUOTATION' ? <ShoppingCart className="w-4 h-4 text-blue-600" /> :
 event.type === 'ACTIVITY' ? <Activity className="w-4 h-4 text-indigo-600" /> :
 <FileClock className="w-4 h-4 text-purple-600" />}
 </span>
 <div className="p-3 bg-muted/20 border rounded-md">
 <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
 {event.title}
 <Badge variant="outline" className="text-xs font-normal">{event.type}</Badge>
 </h3>
 <time className="block mt-1 text-xs text-muted-foreground">
 {event.date.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
 </time>
 </div>
 </div>
 ))}
 {allEvents.length === 0 && (
 <div className="text-muted-foreground ml-6 py-4 flex items-center gap-2">
 <FileClock className="h-4 w-4" /> No timeline events found.
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 {/* CRM */}
 <TabsContent value="crm" className="space-y-4 mt-4">
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Opportunities</CardTitle>
 <Link href="/crm/opportunities"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Title</th>
 <th className="px-4 py-3 font-medium">Stage</th>
 <th className="px-4 py-3 font-medium">Expected Value</th>
 <th className="px-4 py-3 font-medium">Close Date</th>
 </tr>
 </thead>
 <tbody>
 {crm.opportunities.map((o: any) => (
 <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-medium">{o.title}</td>
 <td className="px-4 py-3"><Badge variant="outline">{o.stage}</Badge></td>
 <td className="px-4 py-3">{formatCurrency(o.expected_value)}</td>
 <td className="px-4 py-3">{o.expected_close_date ? new Date(o.expected_close_date).toLocaleDateString() : '-'}</td>
 </tr>
 ))}
 {crm.opportunities.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No opportunities found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Activities</CardTitle>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Type</th>
 <th className="px-4 py-3 font-medium">Title</th>
 <th className="px-4 py-3 font-medium">Status</th>
 <th className="px-4 py-3 font-medium">Due Date</th>
 </tr>
 </thead>
 <tbody>
 {crm.activities.map((act: any) => (
 <tr key={act.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3"><Badge variant="secondary">{act.type}</Badge></td>
 <td className="px-4 py-3">{act.title}</td>
 <td className="px-4 py-3">{act.status}</td>
 <td className="px-4 py-3">{act.due_date ? new Date(act.due_date).toLocaleDateString() : '-'}</td>
 </tr>
 ))}
 {crm.activities.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No activities found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* SALES & QUOTATIONS */}
 <TabsContent value="sales" className="space-y-4 mt-4">
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Quotations</CardTitle>
 <Link href="/sales/quotations"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Quotation #</th>
 <th className="px-4 py-3 font-medium">Date</th>
 <th className="px-4 py-3 font-medium">Status</th>
 <th className="px-4 py-3 font-medium text-right">Total</th>
 </tr>
 </thead>
 <tbody>
 {sales.quotations.map((q: any) => (
 <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-mono text-xs">{q.quotation_number}</td>
 <td className="px-4 py-3">{new Date(q.quotation_date || q.created_at).toLocaleDateString()}</td>
 <td className="px-4 py-3"><Badge variant="outline">{q.status}</Badge></td>
 <td className="px-4 py-3 text-right">{formatCurrency(q.total_amount)}</td>
 </tr>
 ))}
 {sales.quotations.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No quotations found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Sales Orders</CardTitle>
 <Link href="/sales/orders"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Order #</th>
 <th className="px-4 py-3 font-medium">Date</th>
 <th className="px-4 py-3 font-medium">Status</th>
 <th className="px-4 py-3 font-medium text-right">Total</th>
 </tr>
 </thead>
 <tbody>
 {sales.orders.map((so: any) => (
 <tr key={so.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-mono text-xs">{so.order_number}</td>
 <td className="px-4 py-3">{new Date(so.order_date || so.created_at).toLocaleDateString()}</td>
 <td className="px-4 py-3"><Badge variant="outline">{so.status}</Badge></td>
 <td className="px-4 py-3 text-right">{formatCurrency(so.total_amount)}</td>
 </tr>
 ))}
 {sales.orders.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sales orders found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* DELIVERIES */}
 <TabsContent value="deliveries" className="mt-4">
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Deliveries</CardTitle>
 <Link href="/sales/deliveries"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Delivery #</th>
 <th className="px-4 py-3 font-medium">Date</th>
 <th className="px-4 py-3 font-medium">Status</th>
 </tr>
 </thead>
 <tbody>
 {sales.deliveries.map((d: any) => (
 <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-mono text-xs">{d.delivery_number}</td>
 <td className="px-4 py-3">{new Date(d.delivery_date || d.created_at).toLocaleDateString()}</td>
 <td className="px-4 py-3"><Badge variant="outline">{d.status}</Badge></td>
 </tr>
 ))}
 {sales.deliveries.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No deliveries found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* FINANCE */}
 <TabsContent value="finance" className="space-y-4 mt-4">
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Invoices</CardTitle>
 <Link href="/finance/invoices"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Invoice #</th>
 <th className="px-4 py-3 font-medium">Date</th>
 <th className="px-4 py-3 font-medium">Status</th>
 <th className="px-4 py-3 font-medium text-right">Total</th>
 <th className="px-4 py-3 font-medium text-right">Remaining</th>
 </tr>
 </thead>
 <tbody>
 {finance.invoices.map((inv: any) => (
 <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
 <td className="px-4 py-3">{new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}</td>
 <td className="px-4 py-3"><Badge variant="outline">{inv.status}</Badge></td>
 <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
 <td className="px-4 py-3 text-right text-destructive font-medium">{formatCurrency(inv.remaining_amount)}</td>
 </tr>
 ))}
 {finance.invoices.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No invoices found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>
 
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Payments Received</CardTitle>
 <Link href="/finance/payments"><Button variant="outline" size="sm">Manage <Navigation className="w-3 h-3 ml-1" /></Button></Link>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="px-4 py-3 font-medium">Payment #</th>
 <th className="px-4 py-3 font-medium">Date</th>
 <th className="px-4 py-3 font-medium">Method</th>
 <th className="px-4 py-3 font-medium text-right">Amount</th>
 </tr>
 </thead>
 <tbody>
 {finance.payments.map((p: any) => (
 <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="px-4 py-3 font-mono text-xs">{p.payment_number}</td>
 <td className="px-4 py-3">{new Date(p.payment_date || p.created_at).toLocaleDateString()}</td>
 <td className="px-4 py-3"><Badge variant="outline">{p.method}</Badge></td>
 <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(p.amount)}</td>
 </tr>
 ))}
 {finance.payments.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No payments found.</td></tr>}
 </tbody>
 </table>
 </CardContent>
 </Card>
 </TabsContent>

 </Tabs>
 </div>
 );
}
