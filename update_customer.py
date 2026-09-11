import os

file_path = "frontend/src/app/crm/customers/page.tsx"

new_code = """\"use client\"
import { api, B2BApi } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Filter, Phone, Mail, MapPin, Building2, ChevronLeft, ArrowRight, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  
  // Detail View State (Customer 360)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [customerQuotations, setCustomerQuotations] = useState<any[]>([])
  const [loading360, setLoading360] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get("/customers")
      setCustomers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/customers", { name, phone, email })
      if (res.status === 200 || res.status === 201) {
        setShowForm(false)
        setName("")
        setPhone("")
        setEmail("")
        fetchCustomers()
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  const viewCustomer360 = async (customer: any) => {
    setSelectedCustomer(customer)
    setLoading360(true)
    try {
      // Attempt to fetch related sales documents
      // Depending on backend support, this might return empty or error if no filter support
      const [ordersRes, quotationsRes] = await Promise.all([
        B2BApi.getOrders({ customerId: customer.id }).catch(() => ({ data: [] })),
        B2BApi.getQuotations({ customerId: customer.id }).catch(() => ({ data: [] }))
      ])
      
      // Some APIs might return array directly or wrapped in data
      setCustomerOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : (Array.isArray(ordersRes) ? ordersRes : []))
      setCustomerQuotations(Array.isArray(quotationsRes?.data) ? quotationsRes.data : (Array.isArray(quotationsRes) ? quotationsRes : []))
    } catch(e) {
      console.error("Failed to load customer 360 data", e)
    } finally {
      setLoading360(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (selectedCustomer) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedCustomer(null)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{selectedCustomer.name}</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">Active</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" /> {selectedCustomer.code}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Primary Contact</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.address || "No address provided."}</p>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t flex flex-col gap-2">
                <Button variant="outline" className="w-full">Edit Details</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Customer 360 Workspace</CardTitle>
              <CardDescription>Sales, CRM, and Financial history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sales">Sales & Orders</TabsTrigger>
                  <TabsTrigger value="crm">CRM & Activities</TabsTrigger>
                  <TabsTrigger value="finance">Finance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border shadow-none bg-slate-50 dark:bg-slate-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{loading360 ? "..." : customerOrders.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="border shadow-none bg-slate-50 dark:bg-slate-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Quotations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{loading360 ? "..." : customerQuotations.length}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Recent Sales Orders</h3>
                    {loading360 ? (
                      <p className="text-sm text-muted-foreground">Loading orders...</p>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground text-sm">
                        No sales orders found for this customer.
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left p-3 font-medium">Order #</th>
                              <th className="text-left p-3 font-medium">Date</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-right p-3 font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrders.slice(0, 5).map((o, i) => (
                              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="p-3 font-medium">{o.order_number || o.id}</td>
                                <td className="p-3 text-muted-foreground">{new Date(o.createdAt || o.order_date).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <Badge variant="outline">{o.status}</Badge>
                                </td>
                                <td className="p-3 text-right">Rp {Number(o.total_amount || 0).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="crm" className="mt-4">
                  <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground text-sm">
                    <p className="mb-2 font-medium">No open CRM opportunities.</p>
                    <Button variant="outline" size="sm">Create Opportunity</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="finance" className="mt-4">
                  <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground text-sm">
                    <p className="mb-2 font-medium">No outstanding invoices.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Master</h1>
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
              <CardTitle className="text-lg">Create New Customer</CardTitle>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Create Customer</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg">Customer Database</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search customers..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                {searchTerm ? "Try adjusting your search filters." : "Create your first customer to get started with CRM and Sales."}
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 px-4 text-left font-medium text-muted-foreground">Code</th>
                    <th className="p-3 px-4 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="p-3 px-4 text-left font-medium text-muted-foreground">Contact</th>
                    <th className="p-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewCustomer360(c)}>
                      <td className="p-3 px-4 font-medium text-indigo-600 dark:text-indigo-400">{c.code}</td>
                      <td className="p-3 px-4 font-medium">{c.name}</td>
                      <td className="p-3 px-4 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{c.email || '-'}</span>
                          <span className="text-xs">{c.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3 px-4">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400">Active</Badge>
                      </td>
                      <td className="p-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_code)

print("Updated Customer 360")
