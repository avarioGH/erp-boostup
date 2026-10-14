"use client"

import { useState, useEffect } from "react"
import { MasterDataAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Loader2, Cog, Flame, CheckCircle, Clock, DollarSign, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const PROCESS_CATEGORIES = [
  { value: "DRYING", label: "Drying (Pengeringan / Kiln Dry KD)" },
  { value: "PLANING", label: "Planing & Molding (Serut, Profil, S4S, E4E)" },
  { value: "SAWING", label: "Sawing & Resawing (Gesek / Pembelahan)" },
  { value: "ASSEMBLY", label: "Assembly / Lamination (Finger Joint, Laminasi)" },
  { value: "FINISHING", label: "Finishing (Amplas, Sanding, Cat/Coating)" },
  { value: "PRESERVATION", label: "Preservation (Vakum Obat, Anti-Rayap, Treatment)" },
  { value: "PACKING", label: "Packing & Bundling (Pengikatan & Strapping)" },
  { value: "OTHER", label: "Proses Lainnya" },
]

export default function ProcessingMasterPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({
    code: "",
    name: "",
    category: "DRYING",
    description: "",
    estimatedDurationHours: 0,
    costPerHour: 0,
    isActive: true,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await MasterDataAPI.getProcessingTypes()
      if (res) setData(Array.isArray(res) ? res : res.data || [])
    } catch (e) {
      console.error("Failed to load processing types", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.name) {
      alert("Kode dan Nama Proses wajib diisi!")
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await MasterDataAPI.updateProcessingType(editingId, formData)
      } else {
        await MasterDataAPI.createProcessingType(formData)
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      console.error(e)
      alert(e?.response?.data?.message || e?.message || "Gagal menyimpan data proses.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: any) => {
    setFormData({
      code: item.code || "",
      name: item.name || "",
      category: item.category || "DRYING",
      description: item.description || "",
      estimatedDurationHours: item.estimatedDurationHours || 0,
      costPerHour: item.costPerHour || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
    })
    setEditingId(item.id)
    setModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus proses "${name}"?`)) {
      try {
        await MasterDataAPI.deleteProcessingType(id)
        fetchData()
      } catch (e: any) {
        console.error(e)
        alert(e?.response?.data?.message || e?.message || "Gagal menghapus data proses.")
      }
    }
  }

  const openNew = () => {
    setFormData({
      code: "",
      name: "",
      category: "PLANING",
      description: "",
      estimatedDurationHours: 8,
      costPerHour: 0,
      isActive: true,
    })
    setEditingId(null)
    setModalOpen(true)
  }

  const filteredData = (Array.isArray(data) ? data : []).filter((item) => {
    const matchSearch =
      (item.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase())

    const matchCat = categoryFilter === "ALL" || item.category === categoryFilter
    return matchSearch && matchCat
  })

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cog className="w-6 h-6 text-primary" /> Master Data Proses Kayu (Processing)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola daftar jenis pemrosesan produksi kayu seperti Oven (KD), Molding, Resaw, Serut S4S, dan Finishing.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Proses Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Jenis Proses</p>
              <h3 className="text-lg font-bold">{data.length} Proses</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pengeringan (KD/Oven)</p>
              <h3 className="text-lg font-bold">{data.filter(d => d.category === "DRYING" || d.code === "KD").length} Standar</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status Aktif</p>
              <h3 className="text-lg font-bold">{data.filter(d => d.isActive).length} Aktif</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cog className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Molding & Profiling</p>
              <h3 className="text-lg font-bold">{data.filter(d => d.category === "PLANING" || d.code?.includes("MOLD")).length} Standar</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cog className="w-4 h-4 text-primary" /> Daftar Jenis Pemrosesan
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[220px] bg-background">
                  <SelectValue placeholder="Kategori Proses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {PROCESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
                <Input
                  placeholder="Cari kode, nama, deskripsi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[120px] font-semibold">Kode Proses</TableHead>
                    <TableHead className="font-semibold">Nama Proses</TableHead>
                    <TableHead className="font-semibold">Kategori</TableHead>
                    <TableHead className="font-semibold">Deskripsi & Standar</TableHead>
                    <TableHead className="text-center font-semibold">Est. Waktu</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Tidak ada data proses yang sesuai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono font-bold text-primary">
                          {item.code}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[11px] bg-muted/40">
                            {item.category || "PROCESSING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium">
                          {item.estimatedDurationHours ? `${item.estimatedDurationHours} Jam` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] border-emerald-500/20">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px]">
                              Nonaktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(item)}
                              title="Edit Proses"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Hapus Proses"
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="text-xs font-medium px-2">
                  Halaman {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form Tambah / Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5 text-primary" />
              {editingId ? "Edit Jenis Pemrosesan" : "Tambah Jenis Pemrosesan Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi parameter dan standar proses kayu (misal: KD, Molding, Resawing, S4S).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proc-code" className="text-xs font-semibold">Kode Proses *</Label>
                <Input
                  id="proc-code"
                  placeholder="Contoh: KD, MOLD"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proc-cat" className="text-xs font-semibold">Kategori Proses</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger id="proc-cat">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-name" className="text-xs font-semibold">Nama Proses *</Label>
              <Input
                id="proc-name"
                placeholder="Contoh: Kiln Dry (Oven), Molding 4 Sisi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proc-hours" className="text-xs font-semibold">Estimasi Durasi (Jam)</Label>
                <Input
                  id="proc-hours"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Contoh: 168 (7 hari)"
                  value={formData.estimatedDurationHours || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedDurationHours: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proc-cost" className="text-xs font-semibold">Biaya Operasional / Jam</Label>
                <Input
                  id="proc-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.costPerHour || ""}
                  onChange={(e) => setFormData({ ...formData, costPerHour: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-desc" className="text-xs font-semibold">Keterangan / SOP Singkat</Label>
              <Textarea
                id="proc-desc"
                placeholder="Tuliskan catatan proses atau standar kualitas..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="proc-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="proc-active" className="text-xs font-medium cursor-pointer">
                Status Aktif (Tersedia untuk dipilih pada modul Produksi)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Proses"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
