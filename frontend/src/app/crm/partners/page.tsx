"use client"
import { api, B2BApi } from"@/lib/api"
import { useState, useEffect } from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Edit, Trash2, Plus, Search, Filter, Phone, Mail, MapPin, Building2, ChevronLeft, ArrowRight, User } from"lucide-react"
import { Badge } from"@/components/ui/badge"
import { useRouter } from"next/navigation"
import { useDataTable } from"@/hooks/use-data-table"
import { PaginationControls } from"@/components/ui/pagination-controls"

export default function CustomersPage() {

 const [customers, setCustomers] = useState<any[]>([])
 const [activeWarehouse, setActiveWarehouse] = useState<any>(null)

 const [loading, setLoading] = useState(true)
 const [totalPages, setTotalPages] = useState(1)
 const { page, limit, search, status, inputValue, setInputValue, handlePageChange, handleStatusChange } = useDataTable({ defaultLimit: 12 })
 const router = useRouter()

 // Form states
 const [showForm, setShowForm] = useState(false)
 const [name, setName] = useState("")
 const [phone, setPhone] = useState("")
 const [email, setEmail] = useState("")
 const [address, setAddress] = useState("")
 const [editId, setEditId] = useState<string|null>(null)

 const fetchCustomers = async () => {
 try {
 setLoading(true)
 let url = `/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`;
 if (activeWarehouse && activeWarehouse.id && activeWarehouse.id !== 'ALL') {
   url += `&warehouse_id=${activeWarehouse.id}`;
 }
 const res = await api.get(url)
 setCustomers(res.data.data || res.data)
 setTotalPages(res.data.totalPages || 1)
 } catch (e) {
 console.error(e)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
   const handleWhChange = () => {
     const stored = localStorage.getItem('active_warehouse');
     if (stored) {
       const parsed = JSON.parse(stored);
       setActiveWarehouse(parsed.id === 'ALL' ? null : parsed);
     } else {
       setActiveWarehouse(null);
     }
   };
   handleWhChange();
   window.addEventListener('warehouse_changed', handleWhChange);
   return () => window.removeEventListener('warehouse_changed', handleWhChange);
 }, []);

 useEffect(() => {
 fetchCustomers()
 }, [page, limit, search, status, activeWarehouse])

 const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
         await api.put(`/customers/${editId}`, { name, phone, email, address });
      } else {
         await api.post("/customers", { name, phone, email, address });
      }
      setShowForm(false);
      setEditId(null);
      setName(""); setPhone(""); setEmail(""); setAddress("");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    }
  }
  
  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer");
    }
  }
  
  const openEdit = (e: any, c: any) => {
    e.stopPropagation();
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || ""); setAddress(c.address || "");
    setShowForm(true);
  }

  const filteredCustomers = [...customers].sort((a, b) => {
    const outA = a.totalOutstanding || 0;
    const outB = b.totalOutstanding || 0;
    if (outA > 0 || outB > 0) return outB - outA;
    return 0;
  });
return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Customer Master</h1>
 <p className="text-muted-foreground">Manage your client database and CRM relationships.</p>
 </div>
 <Button onClick={() => setShowForm(!showForm)} className="shadow-sm">
 <Plus className="mr-2 h-4 w-4" />
 New Customer
 </Button>
 </div>

 {showForm && (
 <Card className="border-primary/20 shadow-sm animate-in slide-in-from-top-4">
 <form onSubmit={handleSave}>
 <CardHeader className="bg-muted/20 border-b pb-4">
 <CardTitle className="text-[16px] font-semibold">{editId ? "Edit Customer" : "Create New Customer"}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Company / Customer Name *</Label>
 <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="PT ABC Indonesia" />
 </div>
 <div className="space-y-2">
 <Label>Phone Number</Label>
 <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 812..." />
 </div>
 <div className="space-y-2 md:col-span-2">
 <Label>Email Address</Label>
 <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@abc.com" />
 </div>
 </div>
 <div className="space-y-2 md:col-span-2">
 <Label>Alamat / Address</Label>
 <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Sudirman No. 1, Jakarta..." />
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
 <Button type="submit">{editId ? "Update Customer" : "Create Customer"}</Button>
 </div>
 </CardContent>
 </form>
 </Card>
 )}

 <Card className="shadow-sm">
 <CardHeader className="pb-4 border-b border-border/40">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-[16px] font-semibold">Customer Database</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input 
 type="search" 
 placeholder="Search customers..." 
 className="pl-8" 
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 />
 </div>
 <Button variant="outline" size="icon">
 <Filter className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="space-y-3">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse"></div>
 ))}
 </div>
 ) : filteredCustomers.length === 0 ? (
 <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted">
 <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
 <h3 className="font-medium text-lg">No customers found</h3>
 <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
 {inputValue ?"Try adjusting your search filters." :"Create your first customer to get started with CRM and Sales."}
 </p>
 </div>
 ) : (
 <>
 <div className="border rounded-md overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead>
 <tr className="border-b bg-muted/50">
 <th className="p-3 px-4 text-left font-medium text-muted-foreground">Code</th>
 <th className="p-3 px-4 text-left font-medium text-muted-foreground">Customer</th>
 <th className="p-3 px-4 text-left font-medium text-muted-foreground">Contact</th>
 <th className="p-3 px-4 text-left font-medium text-muted-foreground">Piutang</th>
 <th className="p-3 px-4 text-left font-medium text-muted-foreground">Status</th>
 <th className="p-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredCustomers.map((c) => (
 <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/crm/partners/${c.id}`)}>
 <td className="p-3 px-4 font-medium text-primary dark:text-primary">{c.code}</td>
 <td className="p-3 px-4 font-medium">{c.name}</td>
 <td className="p-3 px-4 text-muted-foreground">
 <div className="flex flex-col">
 <span>{c.email || '-'}</span>
 <span className="text-xs">{c.phone || '-'}</span>
 </div>
 </td>
 <td className="p-3 px-4">
   {(c.totalOutstanding || 0) > 0 ? (
     <span className="text-red-600 font-bold whitespace-nowrap bg-red-50 px-2 py-1 rounded">Rp {(c.totalOutstanding).toLocaleString('id-ID')}</span>
   ) : (
     <span className="text-muted-foreground text-sm">-</span>
   )}
 </td>
 <td className="p-3 px-4">
 <Badge variant="secondary" className="bg-emerald-100 text-primary hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-primary">Active</Badge>
 </td>
 <td className="p-3 px-4 text-right">
   <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
     <Button variant="ghost" size="sm" onClick={(e) => openEdit(e, c)} className="h-8 w-8 p-0">
       <Edit className="h-4 w-4 text-blue-500" />
     </Button>
     <Button variant="ghost" size="sm" onClick={(e) => handleDelete(e, c.id)} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
       <Trash2 className="h-4 w-4 text-red-500" />
     </Button>
     <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); router.push(`/crm/partners/${c.id}`); }}>
       View 360 <ArrowRight className="ml-1 h-3 w-3" />
     </Button>
   </div>
   </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
 <div className=""></div>
 </>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
