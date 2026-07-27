"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, MapPin, Search } from "lucide-react"
import { InventoryAPI } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function WarehouseSettings() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Form states
  const [selectedWh, setSelectedWh] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", location: "" })
  const [searchQuery, setSearchQuery] = useState("")

  const checkAuth = () => {
    const storedUser = localStorage.getItem("erp_user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      if (parsedUser.role !== "Owner") {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const data = await InventoryAPI.getWarehouses()
      setWarehouses(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
    fetchWarehouses()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await InventoryAPI.createWarehouse(formData)
      setIsAddOpen(false)
      setFormData({ name: "", location: "" })
      fetchWarehouses()
    } catch (e) {
      alert("Gagal menambahkan gudang")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWh) return
    try {
      await InventoryAPI.updateWarehouse(selectedWh.id, formData)
      setIsEditOpen(false)
      setSelectedWh(null)
      fetchWarehouses()
    } catch (e) {
      alert("Gagal mengupdate gudang")
    }
  }

  const handleDelete = async () => {
    if (!selectedWh) return
    try {
      await InventoryAPI.deleteWarehouse(selectedWh.id)
      setIsDeleteOpen(false)
      setSelectedWh(null)
      fetchWarehouses()
    } catch (e) {
      alert("Gagal menghapus gudang")
    }
  }

  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (wh.location && wh.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (user?.role !== "Owner") return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Pengaturan Gudang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola lokasi gudang dan cabang Anda (Khusus Owner).</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
              <Plus className="w-4 h-4" /> Tambah Gudang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Tambah Gudang Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail gudang cabang baru Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Gudang / Cabang <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Misal: Cabang Jakarta Selatan" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lokasi / Alamat</Label>
                  <Input 
                    placeholder="Misal: Jl. Sudirman No. 12" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Gudang</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama gudang..." 
              className="pl-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Nama Gudang / Cabang</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Lokasi / Alamat</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      Memuat data gudang...
                    </TableCell>
                  </TableRow>
                ) : filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      Tidak ada gudang yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((wh) => (
                    <TableRow key={wh.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {wh.name}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {wh.location || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => {
                              setSelectedWh(wh)
                              setFormData({ name: wh.name, location: wh.location || "" })
                              setIsEditOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setSelectedWh(wh)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Gudang</DialogTitle>
              <DialogDescription>
                Ubah informasi gudang cabang ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Gudang / Cabang <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Misal: Cabang Jakarta Selatan" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Lokasi / Alamat</Label>
                <Input 
                  placeholder="Misal: Jl. Sudirman No. 12" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Gudang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus gudang <b>{selectedWh?.name}</b>? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi stok produk di lokasi ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
