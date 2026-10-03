"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from '@/lib/api'
import { Plus, Trash2, Save, Users, Building, Calendar, ShoppingCart } from 'lucide-react'

export default function PurchaseFishForm() {
  const [partners, setPartners] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    partner_id: "",
    warehouse_id: "",
    date: new Date().toISOString().slice(0, 10),
    paid_amount: 0,
    payment_method: "TUNAI"
  })

  const [items, setItems] = useState<any[]>([{ product_id: "", qty: 1, unit_price: 0 }])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, wRes, prRes] = await Promise.all([
          api.get('/customers'), // using customers endpoint for partners
          api.get('/inventory/warehouses'),
          api.get('/inventory/products')
        ])
        setPartners(pRes.data?.data || pRes.data || [])
        setWarehouses(wRes.data || [])
        setProducts(prRes.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { product_id: "", qty: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0)), 0)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!formData.partner_id || !formData.warehouse_id) return alert("Pilih Nelayan & Gudang!")
    if (items.some(i => !i.product_id || i.qty <= 0)) return alert("Lengkapi data ikan!")

    setProcessing(true)
    try {
      await api.post('/inventory/fish-purchase/atomic', {
        ...formData,
        items
      })
      alert("Pembelian ikan berhasil! Stok & tagihan langsung terupdate otomatis.")
      // Reset form
      setFormData({ ...formData, paid_amount: 0 })
      setItems([{ product_id: "", qty: 1, unit_price: 0 }])
    } catch (err: any) {
      alert("Gagal: " + (err.response?.data?.message || err.message))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pembelian Ikan (Nelayan)</h1>
          <p className="text-muted-foreground">Catat pembelian ikan langsung dari nelayan (Stok & Utang otomatis masuk).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4"/> Nelayan / Mitra</Label>
              <select 
                className="w-full border p-2 rounded-md" 
                value={formData.partner_id} 
                onChange={e => setFormData({...formData, partner_id: e.target.value})}
                required
              >
                <option value="">-- Pilih Nelayan --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Building className="w-4 h-4"/> Gudang Penerimaan</Label>
              <select 
                className="w-full border p-2 rounded-md" 
                value={formData.warehouse_id} 
                onChange={e => setFormData({...formData, warehouse_id: e.target.value})}
                required
              >
                <option value="">-- Pilih Gudang --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Tanggal Pembelian</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Daftar Ikan yang Dibeli</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm" className="flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Baris</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Ikan (Produk)</TableHead>
                  <TableHead>Berat / Qty (Kg)</TableHead>
                  <TableHead>Harga Per Kg (Rp)</TableHead>
                  <TableHead>Subtotal (Rp)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <select 
                        className="w-full border p-2 rounded-md" 
                        value={item.product_id} 
                        onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Ikan --</option>
                        {products.map(pr => (
                          <option key={pr.id} value={pr.id}>{pr.name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0.1" step="0.1" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} required />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} required />
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      Rp {(parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Tagihan:</p>
                <p className="text-2xl font-bold text-emerald-600">Rp {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Pembayaran Langsung (Opsional)</CardTitle>
            <CardDescription>Isi jika Kakak langsung membayar / mencicil utang ke Nelayan saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nominal Dibayar (Rp)</Label>
              <Input type="number" min="0" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: parseFloat(e.target.value) || 0})} />
              {formData.paid_amount > 0 && formData.paid_amount < totalAmount && (
                <p className="text-xs text-amber-600 font-medium">Sisa utang Rp {(totalAmount - formData.paid_amount).toLocaleString()} akan masuk ke Saldo Mitra.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <select 
                className="w-full border p-2 rounded-md bg-white dark:bg-background" 
                value={formData.payment_method} 
                onChange={e => setFormData({...formData, payment_method: e.target.value})}
              >
                <option value="TUNAI">Tunai / Cash</option>
                <option value="TRANSFER">Transfer Bank</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">Batal</Button>
          <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {processing ? 'Menyimpan...' : 'Simpan Pembelian & Update Stok'}
          </Button>
        </div>
      </form>
    </div>
  )
}
