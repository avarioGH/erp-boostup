"use client"
import { useState, useEffect } from "react"
import { ReportsAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, Download } from "lucide-react"

export default function StockCardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])
  
  const [filters, setFilters] = useState({
    locationId: "",
    variantId: "",
    batch: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => {
      setWarehouses(Array.isArray(res) ? res : res.data || [])
    }).catch(console.error)
  }, [])

  const fetchData = async () => {
    if (!filters.locationId || !filters.variantId) {
      setError("Warehouse and Variant ID are required");
      return;
    }
    
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const queryParams: any = { 
        locationId: filters.locationId, 
        variantId: filters.variantId 
      }
      if (filters.batch) queryParams.batch = filters.batch;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;

      const res = await ReportsAPI.getStockCard(queryParams)
      setData(res)
    } catch (e: any) {
      console.error(e)
      setError(e?.response?.data?.message || e.message || "Failed to fetch stock card")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Stock Card (Ledger)</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-end bg-[#0f172a] p-4 rounded-lg border border-border">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Warehouse *</label>
          <select 
            className="bg-slate-900 text-white border border-border p-2 rounded h-10 min-w-[200px]"
            value={filters.locationId}
            onChange={(e) => setFilters({...filters, locationId: e.target.value})}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Variant ID *</label>
          <input 
            type="text" 
            placeholder="TimberVariant UUID" 
            className="bg-slate-900 text-white border border-border p-2 rounded h-10 w-[240px]"
            value={filters.variantId}
            onChange={(e) => setFilters({...filters, variantId: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Exact Batch</label>
          <input 
            type="text" 
            placeholder="e.g. UNKNOWN" 
            className="bg-slate-900 text-white border border-border p-2 rounded h-10"
            value={filters.batch}
            onChange={(e) => setFilters({...filters, batch: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Start Date</label>
          <input 
            type="date" 
            className="bg-slate-900 text-white border border-border p-2 rounded h-10"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">End Date</label>
          <input 
            type="date" 
            className="bg-slate-900 text-white border border-border p-2 rounded h-10"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
        </div>

        <button 
          onClick={fetchData}
          disabled={!filters.locationId || !filters.variantId || loading}
          className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded h-10 disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          View Ledger
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {!loading && data?.summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#0f172a] border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400 font-medium">Opening Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.summary.openingPcs.toLocaleString('id-ID')} PCS</div>
                <div className="text-sm text-slate-400">{data.summary.openingM3.toFixed(4)} M3</div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f172a] border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400 font-medium">Current Stock (Physical)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.summary.currentStockPcs.toLocaleString('id-ID')} PCS</div>
                <div className="text-sm text-slate-400">{data.summary.currentStockM3.toFixed(4)} M3</div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f172a] border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400 font-medium">Ledger Calculated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.summary.ledgerCalculatedPcs.toLocaleString('id-ID')} PCS</div>
                <div className="text-sm text-slate-400">{data.summary.ledgerCalculatedM3.toFixed(4)} M3</div>
              </CardContent>
            </Card>

            <Card className={"" + "bg-[#0f172a] border-border shadow-none " + (data.summary.reconciliationStatus === 'MISMATCH' ? 'ring-1 ring-red-500/50 bg-red-950/20' : '')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400 font-medium flex items-center justify-between">
                  Reconciliation
                  {data.summary.reconciliationStatus === 'MATCH' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {data.summary.reconciliationStatus === 'MISMATCH' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={"" + "text-xl font-bold " + (data.summary.reconciliationStatus === 'MATCH' ? 'text-emerald-500' : data.summary.reconciliationStatus === 'NOT_AVAILABLE' ? 'text-slate-500' : 'text-red-500')}>
                  {data.summary.reconciliationStatus}
                </div>
                {data.summary.reconciliationStatus === 'MISMATCH' && (
                  <div className="text-xs text-red-400 mt-1">
                    Diff: {data.summary.pcsDifference} PCS | {data.summary.m3Difference.toFixed(4)} M3
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm bg-[#0f172a] border-border text-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-900/50">
              <div>
                <CardTitle className="text-lg">Ledger Movements</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Warehouse: {data.summary.warehouseName} | Batch: {data.summary.batch} | SKU: {data.summary.variant?.sku}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full w-full text-sm">
                  <thead className="bg-slate-900 border-b border-border">
                    <tr>
                      <th className="p-4 px-6 text-left font-bold text-slate-300">Date/Time</th>
                      <th className="p-4 px-6 text-left font-bold text-slate-300">Reference</th>
                      <th className="p-4 px-6 text-left font-bold text-slate-300">Type</th>
                      <th className="p-4 px-6 text-left font-bold text-slate-300">Batch</th>
                      <th className="p-4 px-6 text-right font-bold text-emerald-400">IN (PCS/M3)</th>
                      <th className="p-4 px-6 text-right font-bold text-red-400">OUT (PCS/M3)</th>
                      <th className="p-4 px-6 text-right font-bold text-blue-400">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.movements?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-12 text-muted-foreground">
                          No movements found in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      data.movements.map((m: any) => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 px-6 text-slate-300 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString('id-ID', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 px-6 font-medium text-slate-200">
                            {m.referenceType}
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5" title={m.referenceId}>
                              {m.referenceId?.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <Badge variant="outline" className={
                              m.direction === 'IN' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                              'border-red-500/30 text-red-400 bg-red-500/10'
                            }>
                              {m.direction}
                            </Badge>
                          </td>
                          <td className="p-4 px-6 text-slate-400 font-mono text-xs">{m.batch}</td>
                          <td className="p-4 px-6 text-right font-medium text-emerald-400">
                            {m.inPcs > 0 ? (
                              <div className="flex flex-col">
                                <span>+{m.inPcs} PCS</span>
                                <span className="text-xs opacity-70">+{m.inM3.toFixed(4)}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-4 px-6 text-right font-medium text-red-400">
                            {m.outPcs > 0 ? (
                              <div className="flex flex-col">
                                <span>-{m.outPcs} PCS</span>
                                <span className="text-xs opacity-70">-{m.outM3.toFixed(4)}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-4 px-6 text-right font-bold text-blue-100">
                            <div className="flex flex-col">
                              <span>{m.runningPcs.toLocaleString('id-ID')} PCS</span>
                              <span className="text-xs font-normal text-blue-300/70">{m.runningM3.toFixed(4)} M3</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
