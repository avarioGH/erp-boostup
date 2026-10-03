const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/create/page.tsx', 'utf8');

const searchableSelectDef = `
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search } from "lucide-react"
import { useRef } from "react"

function SearchableSelect({ options, value, onChange, placeholder, disabled = false }: any) {
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

  const selectedOption = options?.find((o: any) => o.id === value || o._id === value)
  const displayValue = open ? search : (selectedOption ? (selectedOption.code ? \`\${selectedOption.code} - \${selectedOption.name}\` : selectedOption.name) : "")

  const filteredOptions = (options || []).filter((o: any) => 
    (o.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (o.code || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input 
          disabled={disabled}
          value={displayValue}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={selectedOption ? (selectedOption.code ? \`\${selectedOption.code} - \${selectedOption.name}\` : selectedOption.name) : (placeholder || "Pilih...")}
          className="w-full pr-8 cursor-pointer bg-accent/30"
          readOnly={!open}
        />
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
      
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border shadow-md rounded-md max-h-60 overflow-y-auto" style={{ display: 'block' }}>
          <div className="p-1 sticky top-0 bg-popover/90 backdrop-blur-sm border-b">
             <Input 
               autoFocus
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Cari..."
               className="h-8 text-sm"
             />
          </div>
          {(!filteredOptions || filteredOptions.length === 0) ? (
            <div className="p-3 text-sm text-center text-red-500 bg-red-100 font-bold border border-red-500">
              Tidak ditemukan!
            </div>
          ) : (
            filteredOptions.map((o: any, i: number) => (
              <div 
                key={o?.id || o?._id || i} 
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent text-foreground"
                style={{ minHeight: '36px', display: 'block', borderBottom: '1px solid #333' }}
                onClick={() => { onChange(o?.id || o?._id); setOpen(false); setSearch(""); }}
              >
                {o.code ? \`\${o.code} - \` : ''}{o.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
`;

// Insert the new imports and component at the top
content = content.replace('import { Plus, X, ArrowLeft } from "lucide-react"', searchableSelectDef);

// Replace the old Customer Select section
const oldCustomerHtml = `<div className="space-y-2">
              <Label>Pelanggan (Customer)</Label>
              <Select value={form.customer_id} onValueChange={(v: any) => setForm({...form, customer_id: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id || c._id} value={c.id || c._id}>
                      {c.code ? \`\${c.code} - \` : ''}{c.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>`;

const newCustomerHtml = `<div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <Label>Pelanggan (Customer)</Label>
                <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1"/> Baru</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nama Pelanggan</Label>
                        <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Masukkan nama..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Nomor HP / Telepon</Label>
                        <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="08xxx" />
                      </div>
                      <Button className="w-full" onClick={handleCreateCustomer} disabled={!newCustomer.name || isCreatingCustomer}>
                        {isCreatingCustomer ? "Menyimpan..." : "Simpan Pelanggan"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <SearchableSelect 
                options={customers} 
                value={form.customer_id} 
                onChange={(v: any) => setForm({...form, customer_id: v})} 
                placeholder="Pilih Pelanggan..." 
              />
            </div>`;

content = content.replace(oldCustomerHtml, newCustomerHtml);

// Inject state handlers for new customer
const stateInjectionPoint = 'const [loading, setLoading] = useState(false)';
const stateHandlers = `const [loading, setLoading] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" })

  const handleCreateCustomer = async () => {
    try {
      setIsCreatingCustomer(true)
      const res = await api.post('/customers', newCustomer)
      if (res.data) {
        toast({ title: "Pelanggan berhasil ditambahkan!" })
        setNewCustomerOpen(false)
        const activeWh = typeof window !== 'undefined' ? localStorage.getItem('active_warehouse') : '';
        // Refetch customers
        api.get('/customers?limit=1000').then(c => {
          setCustomers(c?.data?.data || c?.data || [])
          setForm(prev => ({...prev, customer_id: res.data.id || res.data._id}))
        })
        setNewCustomer({ name: "", phone: "" })
      }
    } catch (err: any) {
      toast({ title: "Gagal menambah pelanggan", description: err.response?.data?.message || err.message, variant: "destructive" })
    } finally {
      setIsCreatingCustomer(false)
    }
  }`;

content = content.replace(stateInjectionPoint, stateHandlers);

fs.writeFileSync('frontend/src/app/sales/orders/create/page.tsx', content);
