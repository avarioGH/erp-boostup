"use client"
import { useState, useEffect, useRef } from "react"
import { exportShipment, api, B2BApi, InventoryAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, ArrowLeft, Trash2, Search } from "lucide-react"

// Searchable Dropdown for Real Customers from DB
function CustomerSelect({ customers, value, onChange, placeholder = "Pilih Customer..." }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = customers.find((c: any) => c.name === value || c.id === value)
  const displayValue = open ? search : (selected ? `${selected.name}${selected.phone ? ` (${selected.phone})` : ''}` : value || '')

  const filtered = customers.filter((c: any) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative">
        <Input
          value={displayValue}
          autoComplete="off"
          name={`cust_select_${Math.random()}`}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={placeholder}
          className="w-full pr-8 cursor-pointer bg-background"
        />
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border shadow-lg rounded-md max-h-60 overflow-y-auto">
          <div className="p-1.5 sticky top-0 bg-popover border-b">
            <Input
              autoFocus
              autoComplete="off"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama customer / no hp..."
              className="h-8 text-sm"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-center text-muted-foreground">
              {search ? (
                <div>
                  <p>Customer tidak ditemukan.</p>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-primary p-0 mt-1"
                    onClick={() => { onChange(search); setOpen(false); }}
                  >
                    Gunakan &quot;{search}&quot; sebagai nama baru
                  </Button>
                </div>
              ) : "Belum ada data customer"}
            </div>
          ) : (
            filtered.map((c: any) => (
              <div
                key={c.id}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent flex flex-col border-b last:border-b-0"
                onClick={() => { onChange(c.name); setOpen(false); setSearch(""); }}
              >
                <span className="font-medium text-foreground">{c.name}</span>
                {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Searchable Dropdown for Products with Real Stock
function ProductSelect({ products, value, onChange, placeholder = "Pilih Produk / Ikan..." }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = products.find((p: any) => p.name === value || p.id === value)
  const displayValue = open ? search : (selected ? selected.name : value || '')

  const filtered = products.filter((p: any) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative">
        <Input
          value={displayValue}
          autoComplete="off"
          name={`prod_select_${Math.random()}`}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={placeholder}
          className="w-full pr-8 cursor-pointer bg-background"
        />
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border shadow-lg rounded-md max-h-60 overflow-y-auto">
          <div className="p-1.5 sticky top-0 bg-popover border-b">
            <Input
              autoFocus
              autoComplete="off"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ikan / kode produk..."
              className="h-8 text-sm"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-center text-muted-foreground">
              {search ? (
                <div>
                  <p>Produk tidak ditemukan.</p>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-primary p-0 mt-1"
                    onClick={() => { onChange(search); setOpen(false); }}
                  >
                    Gunakan &quot;{search}&quot;
                  </Button>
                </div>
              ) : "Belum ada produk"}
            </div>
          ) : (
            filtered.map((p: any) => {
              const totalStock = (p.warehouse_stocks || []).reduce((sum: number, s: any) => sum + (Number(s.current_stock) || 0), 0)
              return (
                <div
                  key={p.id}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent flex items-center justify-between border-b last:border-b-0"
                  onClick={() => { onChange(p.name); setOpen(false); setSearch(""); }}
                >
                  <div>
                    <span className="font-medium text-foreground">{p.name}</span>
                    {p.code && <span className="ml-2 text-xs text-muted-foreground">({p.code})</span>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono">
                    Stok: {totalStock} kg
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function CreateExportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    containerNo: "",
    sealNo: "",
    vehicleNo: "",
    exportDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  })

  // DB Data
  const [dbCustomers, setDbCustomers] = useState<any[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])
  const [dbOrders, setDbOrders] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=200').then((res: any) => {
        const list = res?.data?.data || res?.data || res || []
        setDbCustomers(Array.isArray(list) ? list : [])
      }).catch(()=> {}),
      InventoryAPI.getProducts().then((res: any) => {
        const list = res?.data || res || []
        setDbProducts(Array.isArray(list) ? list : [])
      }).catch(()=> {}),
      B2BApi.getOrders({ limit: 100 }).then((res: any) => {
        const list = res?.data || []
        setDbOrders(Array.isArray(list) ? list.filter((o:any) => o.order_number?.startsWith('SO')) : [])
      }).catch(()=> {})
    ])
  }, [])

  const handleSelectOrder = async (gIdx: number, orderId: string) => {
    if (!orderId) return;
    try {
      const order = await B2BApi.getOrder(orderId);
      const newGroups = [...groups];
      newGroups[gIdx].groupName = order.customer?.name || "Customer";
      
      const newItems = (order.items || []).map((i: any) => ({
        productName: i.product?.name || "Item",
        qtyKg: i.qty.toString(),
        qtyMc: "",
        qtySak: ""
      }));
      
      if (newItems.length > 0) {
        newGroups[gIdx].items = newItems;
      }
      setGroups(newGroups);
    } catch(e) {}
  }

  // Grouped state
  const [groups, setGroups] = useState([
    { groupName: "", items: [{ productName: "", qtyKg: "", qtyMc: "", qtySak: "" }] }
  ])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const flatItems: any[] = [];
      groups.forEach(g => {
        g.items.forEach(i => {
          if (i.productName || i.qtyKg || i.qtyMc || i.qtySak) {
            flatItems.push({
              groupName: g.groupName || "-",
              productName: i.productName,
              qtyKg: parseFloat(i.qtyKg) || 0,
              qtyMc: parseInt(i.qtyMc) || 0,
              qtySak: parseInt(i.qtySak) || 0
            })
          }
        })
      })

      if (flatItems.length === 0) {
        toast({ title: "Masukkan minimal 1 barang", variant: "destructive" })
        setLoading(false)
        return
      }

      const payload = {
        ...form,
        items: flatItems
      }
      await exportShipment.create(payload)
      toast({ title: "Data eksport berhasil disimpan!" })
      router.push("/sales/exports")
    } catch(err) {
      toast({ title: "Gagal menyimpan data eksport", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const addGroup = () => {
    setGroups([...groups, { groupName: "", items: [{ productName: "", qtyKg: "", qtyMc: "", qtySak: "" }] }])
  }

  const removeGroup = (groupIndex: number) => {
    if (groups.length === 1) return;
    const newGroups = [...groups];
    newGroups.splice(groupIndex, 1);
    setGroups(newGroups);
  }

  const addItem = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items.push({ productName: "", qtyKg: "", qtyMc: "", qtySak: "" });
    setGroups(newGroups);
  }

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...groups];
    if (newGroups[groupIndex].items.length === 1) return;
    newGroups[groupIndex].items.splice(itemIndex, 1);
    setGroups(newGroups);
  }

  const updateGroupName = (groupIndex: number, val: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex].groupName = val;
    setGroups(newGroups);
  }

  const updateItem = (groupIndex: number, itemIndex: number, field: string, val: string) => {
    const newGroups = [...groups] as any;
    newGroups[groupIndex].items[itemIndex][field] = val;
    setGroups(newGroups);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales/exports")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Input Daftar Barang Eksport</h1>
          <p className="text-muted-foreground text-sm">Pencatatan pengiriman kontainer ekspor ikan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informasi Kontainer</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>No Kontainer</Label>
              <Input 
                value={form.containerNo} 
                onChange={e => setForm({...form, containerNo: e.target.value})} 
                placeholder="misal: TGHU 123456-7"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>No Segel / Seal</Label>
              <Input 
                value={form.sealNo} 
                onChange={e => setForm({...form, sealNo: e.target.value})} 
                placeholder="misal: SL-88392"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>No Polisi Kendaraan</Label>
              <Input 
                value={form.vehicleNo} 
                onChange={e => setForm({...form, vehicleNo: e.target.value})} 
                placeholder="misal: B 9123 UZ"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input 
                type="date" 
                value={form.exportDate} 
                onChange={e => setForm({...form, exportDate: e.target.value})} 
                required 
              />
            </div>
          </CardContent>
        </Card>

        {groups.map((group, gIdx) => (
          <Card key={gIdx} className="border-2 border-muted overflow-visible">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/20 pb-4 border-b gap-4">
              <div className="flex-1 w-full max-w-md space-y-1">
                <Label className="text-sm font-semibold">Grup (Supplier) / Pemilik Barang</Label>
                <CustomerSelect
                  customers={dbCustomers}
                  value={group.groupName}
                  onChange={(val: string) => updateGroupName(gIdx, val)}
                  placeholder="Pilih Customer resmi..."
                />
              </div>
              <div className="flex-1 w-full max-w-md space-y-1">
                <Label className="text-sm font-semibold text-blue-600">Atau Muat dari Transaksi (SO)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => {
                    handleSelectOrder(gIdx, e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">-- Pilih Sales Order --</option>
                  {dbOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>
              {groups.length > 1 && (
                <Button type="button" variant="ghost" className="text-destructive mt-4 sm:mt-0" onClick={() => removeGroup(gIdx)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus Grup
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {group.items.map((item, iIdx) => (
                <div key={iIdx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-1 flex justify-center pb-2">
                    <span className="text-muted-foreground font-medium text-sm">{iIdx + 1}.</span>
                  </div>
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Nama Barang / Ikan</Label>
                    <ProductSelect
                      products={dbProducts}
                      value={item.productName}
                      onChange={(val: string) => updateItem(gIdx, iIdx, 'productName', val)}
                      placeholder="Pilih Ikan dari Stok..."
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Jumlah KG</Label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={item.qtyKg} 
                      placeholder="0.0"
                      onChange={e => updateItem(gIdx, iIdx, 'qtyKg', e.target.value)} 
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">MC</Label>
                    <Input 
                      type="number" 
                      value={item.qtyMc} 
                      placeholder="0"
                      onChange={e => updateItem(gIdx, iIdx, 'qtyMc', e.target.value)} 
                    />
                  </div>
                  <div className="col-span-2 space-y-1 relative">
                    <Label className="text-xs">SAK / KARUNG</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={item.qtySak} 
                        placeholder="0"
                        onChange={e => updateItem(gIdx, iIdx, 'qtySak', e.target.value)} 
                      />
                      {group.items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => removeItem(gIdx, iIdx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(gIdx)}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Barang di Grup Ini
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button type="button" variant="secondary" onClick={addGroup} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Tambah Grup Supplier Lain
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Menyimpan..." : "Simpan Data Eksport"}
          </Button>
        </div>
      </form>
    </div>
  )
}
