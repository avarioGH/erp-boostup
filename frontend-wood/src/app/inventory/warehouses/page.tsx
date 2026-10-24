"use client"
import { api } from "@/lib/api"
import { TablePagination } from "@/components/ui/table-pagination"

import { useState, useEffect } from"react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Plus, Edit2, Trash2 } from "lucide-react"

export default function WarehousesPage() {
 const [warehouses, setWarehouses] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
 const [loading, setLoading] = useState(true)
 const [showForm, setShowForm] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [formData, setFormData] = useState({ name:"", code:"", address:"" })

 const fetchWarehouses = async () => {
 try {
 setLoading(true)
 const token = localStorage.getItem("erp_token")
 const res = await api.get("/inventory/warehouses")
 setWarehouses(res.data)
 } catch (e) {
 console.error(e)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 fetchWarehouses()
 }, [])

 const filteredWarehouses = (Array.isArray(warehouses) ? warehouses : []).filter(w =>
    (w.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (w.code || "").toLowerCase().includes(search.toLowerCase()) ||
    (w.address || "").toLowerCase().includes(search.toLowerCase())
  )
  const paginatedWarehouses = filteredWarehouses.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSave = async (e: React.FormEvent) => {
 e.preventDefault()
 try {
 const token = localStorage.getItem("erp_token")
 const res = editingId 
    ? await api.put(`/inventory/warehouses/${editingId}`, formData)
    : await api.post("/inventory/warehouses", formData)
 if (res.status === 200 || res.status === 201) {
 resetForm()
 fetchWarehouses()
 }
 } catch (e) {
 console.error(e)
 }
 }

 const handleEdit = (w: any) => {
 setEditingId(w.id)
 setFormData({ name: w.name, code: w.code, address: w.address || "" })
 setShowForm(true)
 window.scrollTo({ top: 0, behavior: "smooth" })
 }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus gudang ini?")) {
      try {
        const res = await api.delete(`/inventory/warehouses/${id}`)
        if (res.status === 200 || res.status === 204) {
          alert("Gudang berhasil dihapus!")
        } else {
          alert("Gudang berhasil dihapus.")
        }
        fetchWarehouses()
      } catch(e: any) {
        console.error(e)
        const msg = e.response?.data?.message || e.message || "Gagal menghapus gudang. Pastikan gudang tidak memiliki transaksi atau stok aktif."
        alert("Gagal: " + msg)
      }
    }
  }

 const resetForm = () => {
 setShowForm(false)
 setEditingId(null)
 setFormData({ name:"", code:"", address:"" })
 }

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
 <div>
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Warehouses</h1>
 <p className="text-muted-foreground">Manage your storage locations.</p>
 </div>
 <Button onClick={() => { resetForm(); setShowForm(true); }}>
 <Plus className="mr-2 h-4 w-4" />
 Add Warehouse
 </Button>
 </div>

 {showForm && (
 <Card>
 <form onSubmit={handleSave}>
 <CardHeader>
 <CardTitle>{editingId ? "Edit Warehouse" : "New Warehouse"}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Warehouse Name</Label>
 <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
 </div>
 <div className="space-y-2">
 <Label>Warehouse Code</Label>
 <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="WH-01" required />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Address</Label>
 <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
 <Button type="submit">{editingId ? "Update" : "Save"}</Button>
 </div>
 </CardContent>
 </form>
 </Card>
 )}

 <Card>
 <CardHeader>
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
   <CardTitle>Warehouse List</CardTitle>
   <Input 
     placeholder="Cari gudang atau kode..." 
     className="max-w-xs h-9 text-xs" 
     value={search} 
     onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
   />
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
 ) : filteredWarehouses.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">No warehouses found.</p>
 ) : (
 <div className="border rounded-md overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead>
 <tr className="border-b bg-muted/50">
 <th className="p-3 text-left font-medium">Code</th>
 <th className="p-3 text-left font-medium">Name</th>
 <th className="p-3 text-left font-medium">Address</th>
 <th className="p-3 text-right font-medium">Actions</th>
 </tr>
 </thead>
 <tbody>
 {paginatedWarehouses.map((w) => (
 <tr key={w.id} className="border-b last:border-0 hover:bg-muted/50">
 <td className="p-3 font-medium">{w.code}</td>
 <td className="p-3">{w.name}</td>
 <td className="p-3 text-muted-foreground">{w.address || '-'}</td>
 <td className="p-3 text-right">
   <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}>
     <Edit2 className="h-4 w-4" />
   </Button>
   <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(w.id)}>
     <Trash2 className="h-4 w-4" />
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
