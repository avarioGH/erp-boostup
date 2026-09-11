"use client"
import { api, B2BApi } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Filter, Phone, Mail, MapPin, Building2, ChevronLeft, ArrowRight, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

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

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/crm/customers/${c.id}`)}>
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
                          View 360 <ArrowRight className="ml-1 h-3 w-3" />
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
