"use client"
import { useState, useEffect } from "react"
import { ReportsAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export default function StockCardPage() {
  const [data, setData] = useState<{openingBalance: number, movements: any[]}>({ openingBalance: 0, movements: [] })
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  
  const [filters, setFilters] = useState({
    warehouseId: "",
    variant: "",
  })

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => {
      setWarehouses(Array.isArray(res) ? res : res.data || [])
    }).catch(console.error)
  }, [])

  const fetchData = async () => {
    if (!filters.warehouseId || !filters.variant) return;
    
    setLoading(true)
    try {
      const res = await ReportsAPI.getStockCard(filters)
      setData(res || { openingBalance: 0, movements: [] })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Stock Card</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          className="bg-[#0f172a] text-white border border-border p-2 rounded"
          value={filters.warehouseId}
          onChange={(e) => setFilters({...filters, warehouseId: e.target.value})}
        >
          <option value="">Select Warehouse</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        
        <input 
          type="text" 
          placeholder="Variant SKU..." 
          className="bg-[#0f172a] text-white border border-border p-2 rounded"
          value={filters.variant}
          onChange={(e) => setFilters({...filters, variant: e.target.value})}
        />

        <button 
          onClick={fetchData}
          disabled={!filters.warehouseId || !filters.variant || loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          Fetch Stock Card
        </button>
      </div>

      {data.movements.length > 0 && (
        <Card className="shadow-sm bg-[#0f172a] border-border text-white mb-4 p-4">
          <h2 className="text-xl font-semibold mb-2">Opening Balance: {data.openingBalance}</h2>
        </Card>
      )}

      <Card className="shadow-sm bg-[#0f172a] border-border text-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] md:min-w-full w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="p-4 px-6 text-left font-bold">Date</th>
                    <th className="p-4 px-6 text-left font-bold">Document Ref</th>
                    <th className="p-4 px-6 text-left font-bold">Type</th>
                    <th className="p-4 px-6 text-center font-bold">In</th>
                    <th className="p-4 px-6 text-center font-bold">Out</th>
                    <th className="p-4 px-6 text-right font-bold">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">Select a warehouse and variant to view stock card.</td></tr>
                  ) : (() => {
                    let runningBalance = data.openingBalance || 0;
                    return data.movements.map((m, i) => {
                      const isIn = m.type === 'IN' || (m.type === 'ADJ' && m.quantityPcs > 0);
                      const isOut = m.type === 'OUT' || (m.type === 'ADJ' && m.quantityPcs < 0);
                      const qty = Math.abs(m.quantityPcs || m.quantity || 0);
                      
                      if (isIn) runningBalance += qty;
                      if (isOut) runningBalance -= qty;

                      return (
                        <tr key={m.id || i} className="border-b border-border/50 hover:bg-slate-800/20">
                          <td className="p-4 px-6 text-slate-300">{new Date(m.date || m.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
                          <td className="p-4 px-6 font-medium text-slate-200">{m.documentRef || m.reference || '-'}</td>
                          <td className="py-3.5 px-6 text-[13px]"><Badge variant="outline">{m.type || m.referenceType}</Badge></td>
                          <td className="p-4 px-6 text-center text-primary font-medium">{isIn ? qty : '-'}</td>
                          <td className="p-4 px-6 text-center text-red-400 font-medium">{isOut ? qty : '-'}</td>
                          <td className="p-4 px-6 text-right font-bold text-slate-200">{runningBalance}</td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
