"use client"
import { useState } from "react"
import { exportShipment } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, ArrowLeft } from "lucide-react"

export default function CreateExportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    containerNo: "",
    sealNo: "",
    vehicleNo: "",
    exportDate: new Date().toISOString().split('T')[0]
  })

  const [items, setItems] = useState([
    { groupName: "PAK LUCKY", productName: "", qtyKg: "", qtyMc: "", qtySak: "" }
  ])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        items: items.map(i => ({
          ...i,
          qtyKg: parseFloat(i.qtyKg) || 0,
          qtyMc: parseInt(i.qtyMc) || 0,
          qtySak: parseInt(i.qtySak) || 0
        }))
      }
      await exportShipment.create(payload)
      toast({ title: "Berhasil disimpan" })
      router.push("/sales/exports")
    } catch(err) {
      toast({ title: "Gagal menyimpan", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales/exports")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Input Daftar Barang Eksport</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Data Kontainer</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>No. CONTAINER</Label>
              <Input value={form.containerNo} onChange={e => setForm({...form, containerNo: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>No. SEAL</Label>
              <Input value={form.sealNo} onChange={e => setForm({...form, sealNo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>No. KENDARAAN</Label>
              <Input value={form.vehicleNo} onChange={e => setForm({...form, vehicleNo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={form.exportDate} onChange={e => setForm({...form, exportDate: e.target.value})} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Rincian Barang (Per Supplier/Grup)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { groupName: "", productName: "", qtyKg: "", qtyMc: "", qtySak: "" }])}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Grup (Supplier)</Label>
                  <Input placeholder="PAK LUCKY..." value={item.groupName} onChange={e => {
                    const newItems = [...items]; newItems[index].groupName = e.target.value; setItems(newItems);
                  }} required />
                </div>
                <div className="col-span-4 space-y-2">
                  <Label className="text-xs">Nama Barang</Label>
                  <Input placeholder="TGR HEADLESS..." value={item.productName} onChange={e => {
                    const newItems = [...items]; newItems[index].productName = e.target.value; setItems(newItems);
                  }} required />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Jumlah KG</Label>
                  <Input type="number" step="0.1" value={item.qtyKg} onChange={e => {
                    const newItems = [...items]; newItems[index].qtyKg = e.target.value; setItems(newItems);
                  }} />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label className="text-xs">MC</Label>
                  <Input type="number" value={item.qtyMc} onChange={e => {
                    const newItems = [...items]; newItems[index].qtyMc = e.target.value; setItems(newItems);
                  }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">SAK/KARUNG</Label>
                  <Input type="number" value={item.qtySak} onChange={e => {
                    const newItems = [...items]; newItems[index].qtySak = e.target.value; setItems(newItems);
                  }} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Menyimpan..." : "Simpan Dokumen"}
        </Button>
      </form>
    </div>
  )
}
