"use client"
import { useState, useEffect, useCallback } from "react"
import { ReportsAPI, ExportAPI, MasterDataAPI, PartaiAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, ShieldCheck, HelpCircle, AlertTriangle, XCircle, Search, Filter } from "lucide-react"

export default function TraceabilityDashboard() {
  const [activeTab, setActiveTab] = useState<"AUDIT" | "RECONCILIATION_PREVIEW">("AUDIT")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Audit table state
  const [auditData, setAuditData] = useState<any>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  // Reconciliation preview state
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Filter options
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [partais, setPartais] = useState<any[]>([])

  // Active filters
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedVariant, setSelectedVariant] = useState("")
  const [selectedPartai, setSelectedPartai] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [selectedClassification, setSelectedClassification] = useState("ALL")
  const [selectedRefType, setSelectedRefType] = useState("")
  const [selectedDateFrom, setSelectedDateFrom] = useState("")
  const [selectedDateTo, setSelectedDateTo] = useState("")

  useEffect(() => {
    ReportsAPI.getTraceability().then((res: any) => {
      setData(res || {})
    }).catch(console.error).finally(() => setLoading(false))

    // Load master data filters
    Promise.all([
      MasterDataAPI.getLocations().catch(() => []),
      MasterDataAPI.getTimberVariants().catch(() => []),
      PartaiAPI.getPartais().catch(() => []),
    ]).then(([locs, vars, pts]) => {
      setWarehouses(Array.isArray(locs) ? locs : locs?.data || [])
      setVariants(Array.isArray(vars) ? vars : vars?.data || [])
      setPartais(Array.isArray(pts) ? pts : pts?.data || [])
    })
  }, [])

  const loadAuditReport = useCallback(() => {
    setAuditLoading(true)
    ReportsAPI.getTraceabilityAudit({
      page,
      limit,
      warehouseId: selectedWarehouse || undefined,
      timberVariantId: selectedVariant || undefined,
      partaiId: selectedPartai || undefined,
      batch: selectedBatch.trim() || undefined,
      classification: selectedClassification !== "ALL" ? selectedClassification : undefined,
      referenceType: selectedRefType || undefined,
      dateFrom: selectedDateFrom || undefined,
      dateTo: selectedDateTo || undefined,
    })
      .then((res: any) => {
        setAuditData(res)
      })
      .catch(console.error)
      .finally(() => setAuditLoading(false))
  }, [
    page,
    limit,
    selectedWarehouse,
    selectedVariant,
    selectedPartai,
    selectedBatch,
    selectedClassification,
    selectedRefType,
    selectedDateFrom,
    selectedDateTo,
  ])

  useEffect(() => {
    loadAuditReport()
  }, [loadAuditReport])

  const loadReconciliationPreview = useCallback(() => {
    setPreviewLoading(true)
    ReportsAPI.getTraceabilityReconciliationPreview({
      warehouseId: selectedWarehouse || undefined,
      timberVariantId: selectedVariant || undefined,
      partaiId: selectedPartai || undefined,
    })
      .then((res: any) => {
        setPreviewData(res)
      })
      .catch(console.error)
      .finally(() => setPreviewLoading(false))
  }, [selectedWarehouse, selectedVariant, selectedPartai])

  useEffect(() => {
    if (activeTab === "RECONCILIATION_PREVIEW") {
      loadReconciliationPreview()
    }
  }, [activeTab, loadReconciliationPreview])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadAuditReport()
    if (activeTab === "RECONCILIATION_PREVIEW") {
      loadReconciliationPreview()
    }
  }

  const handleResetFilters = () => {
    setSelectedWarehouse("")
    setSelectedVariant("")
    setSelectedPartai("")
    setSelectedBatch("")
    setSelectedClassification("ALL")
    setSelectedRefType("")
    setSelectedDateFrom("")
    setSelectedDateTo("")
    setPage(1)
  }

  const getBadgeClass = (classification: string) => {
    switch (classification) {
      case "VERIFIED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      case "AMBIGUOUS":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30"
      case "INCONSISTENT":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30"
      case "UNKNOWN":
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30"
    }
  }

  const getBadgeIcon = (classification: string) => {
    switch (classification) {
      case "VERIFIED":
        return <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
      case "AMBIGUOUS":
        return <HelpCircle className="w-3.5 h-3.5 mr-1 inline" />
      case "INCONSISTENT":
        return <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
      case "UNKNOWN":
      default:
        return <XCircle className="w-3.5 h-3.5 mr-1 inline" />
    }
  }

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Traceability & Audit Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative read-only batch traceability audit and operational summary.
          </p>
        </div>
        <button 
          onClick={() => {
            window.open(ExportAPI.exportTraceability(''), '_blank');
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition"
        >
          Export XLSX
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-md flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold mb-1">Audit Policy Note</h4>
          <p className="text-sm opacity-90">
            Stock records and historical movements are classified based on verified upstream document lineages (Partai, Sawn Output, KD Process, Purchase, Shipment).
            Physical current stock balances and historical ledger movements are tallied independently to avoid double-counting.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#0f172a] border-border text-white">
            <CardHeader>
              <CardTitle>Production Yield Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Output:</span>
                  <span className="font-medium">{data?.production?.totalOutput || 0} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Input Vol:</span>
                  <span className="font-medium">{data?.production?.totalInputVol || 0} m³</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground">Avg Yield:</span>
                  <span className="font-bold text-primary">{data?.production?.avgYield || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-border text-white">
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders:</span>
                  <span className="font-medium">{data?.purchases?.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Received:</span>
                  <span className="font-medium">{data?.purchases?.itemsReceived || 0} pcs</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground">Pending Receipts:</span>
                  <span className="font-bold text-amber-500">{data?.purchases?.pendingReceipts || 0} pcs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-border text-white">
            <CardHeader>
              <CardTitle>Shipment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Shipments:</span>
                  <span className="font-medium">{data?.shipments?.totalShipments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Shipped:</span>
                  <span className="font-medium">{data?.shipments?.itemsShipped || 0} pcs</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground">Pending Deliveries:</span>
                  <span className="font-bold text-amber-500">{data?.shipments?.pendingDeliveries || 0} pcs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Traceability Audit Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-4 rounded-lg bg-[#0f172a] border border-border">
          <span className="text-xs text-muted-foreground block uppercase font-semibold">Total Movements</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {auditData?.summary?.totalMovements ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">Recorded movements</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-emerald-500/20">
          <span className="text-xs text-emerald-400 block uppercase font-semibold">Verified</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">
            {auditData?.summary?.verifiedCount ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">Document proven</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-amber-500/20">
          <span className="text-xs text-amber-400 block uppercase font-semibold">Ambiguous</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            {auditData?.summary?.ambiguousCount ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">Incomplete lineage</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-500/20">
          <span className="text-xs text-slate-400 block uppercase font-semibold">Unknown</span>
          <span className="text-xl font-bold text-slate-300 mt-1 block">
            {auditData?.summary?.unknownCount ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">Legacy / unbatched</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-rose-500/20">
          <span className="text-xs text-rose-400 block uppercase font-semibold">Inconsistent</span>
          <span className="text-xl font-bold text-rose-400 mt-1 block">
            {auditData?.summary?.inconsistentCount ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">Batch mismatch</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-cyan-500/20">
          <span className="text-xs text-cyan-400 block uppercase font-semibold">Physical Stock</span>
          <span className="text-lg font-bold text-cyan-300 mt-1 block truncate">
            {auditData?.summary?.currentStockPcs != null
              ? `${auditData.summary.currentStockPcs} pcs`
              : "-"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {auditData?.summary?.currentStockM3 != null
              ? `${auditData.summary.currentStockM3} m³`
              : "-"}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-[#0f172a] border-border text-white">
        <CardHeader className="py-3 px-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Audit Filter Options</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Warehouse / Location</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.code || w.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Timber Variant</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              >
                <option value="">All Variants</option>
                {variants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.species} {v.thickness}x{v.width}x{v.length}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Partai</label>
              <select
                value={selectedPartai}
                onChange={(e) => setSelectedPartai(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              >
                <option value="">All Partais</option>
                {partais.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.code} {p.name ? `(${p.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Batch Identifier</label>
              <input
                type="text"
                placeholder="Search batch..."
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Classification</label>
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              >
                <option value="ALL">All Classifications</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="AMBIGUOUS">AMBIGUOUS</option>
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="INCONSISTENT">INCONSISTENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Reference Type</label>
              <select
                value={selectedRefType}
                onChange={(e) => setSelectedRefType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
              >
                <option value="">All Types</option>
                <option value="PRODUCTION_OUTPUT">PRODUCTION_OUTPUT (Sawmill)</option>
                <option value="PRODUCTION_PROCESS_OUTPUT">PRODUCTION_PROCESS_OUTPUT (KD)</option>
                <option value="PRODUCTION_PROCESS_INPUT">PRODUCTION_PROCESS_INPUT</option>
                <option value="TIMBER_PURCHASE">TIMBER_PURCHASE</option>
                <option value="TIMBER_SHIPMENT">TIMBER_SHIPMENT</option>
                <option value="TRANSFER_IN">TRANSFER_IN</option>
                <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                <option value="ADJUSTMENT_IN">ADJUSTMENT_IN</option>
                <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDateFrom}
                  onChange={(e) => setSelectedDateFrom(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="date"
                  value={selectedDateTo}
                  onChange={(e) => setSelectedDateTo(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-medium flex items-center gap-1.5 h-8 transition"
              >
                <Search className="w-3.5 h-3.5" />
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium h-8 transition"
              >
                Reset
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tab Switcher */}
      <div className="flex border-b border-border/60 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("AUDIT")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "AUDIT"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-slate-200"
          }`}
        >
          Traceability Audit Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RECONCILIATION_PREVIEW")}
          className={`pb-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition ${
            activeTab === "RECONCILIATION_PREVIEW"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Legacy Reconciliation Dry-Run Preview
        </button>
      </div>

      {activeTab === "AUDIT" ? (
        /* Traceability Audit Table */
        <Card className="bg-[#0f172a] border-border text-white overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Traceability Audit Records</CardTitle>
            <span className="text-xs text-muted-foreground">
              Showing {auditData?.data?.length || 0} of {auditData?.pagination?.totalRecords || 0} records
            </span>
          </CardHeader>
          <CardContent className="p-0">
          {auditLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
          ) : !auditData?.data || auditData.data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No stock movements found matching the specified filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 border-b border-border/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Timber Variant</th>
                    <th className="py-2.5 px-3">Movement Batch</th>
                    <th className="py-2.5 px-3">Ref Type & Doc No</th>
                    <th className="py-2.5 px-3 text-right">PCS</th>
                    <th className="py-2.5 px-3 text-right">M³</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Evidence Lineage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {auditData.data.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {row.date ? new Date(row.date).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {row.warehouse?.name || row.warehouse?.code || "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-white block">{row.variant?.sku || "-"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.variant?.species} {row.variant?.grade} ({row.variant?.thickness}x{row.variant?.width}x{row.variant?.length})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">
                        {row.batch}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="block font-medium text-slate-300">{row.referenceType}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.sourceDocNo ? `Doc: ${row.sourceDocNo}` : row.referenceId ? `ID: ${row.referenceId}` : "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span className={row.type === "OUT" ? "text-rose-400" : "text-emerald-400"}>
                          {row.type === "OUT" ? `-${row.quantityPcs}` : `+${row.quantityPcs}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                        {row.volumeM3?.toFixed(4) || "0.0000"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeClass(
                            row.classification,
                          )}`}
                        >
                          {getBadgeIcon(row.classification)}
                          {row.classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate" title={row.evidence}>
                        {row.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {auditData?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs">
              <span className="text-muted-foreground">
                Page {auditData.pagination.page} of {auditData.pagination.totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= auditData.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      ) : (
        /* Legacy Reconciliation Dry-Run Preview Table */
        <Card className="bg-[#0f172a] border-border text-white overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Dry-Run Reconciliation Preview (Read-Only Simulation)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Eligible VERIFIED records simulated for identity reallocation from UNKNOWN to Target Partai. Net physical balance delta must equal 0.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Eligible: {previewData?.summary?.eligibleCount ?? 0}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Rejected: {previewData?.summary?.ineligibleCount ?? 0}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {previewLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
              </div>
            ) : !previewData?.proposals || previewData.proposals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No records found in scope for reconciliation evaluation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 border-b border-border/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Warehouse & Variant</th>
                      <th className="py-2.5 px-3">Source Bucket (UNKNOWN)</th>
                      <th className="py-2.5 px-3">Target Bucket</th>
                      <th className="py-2.5 px-3 text-right">Reallocated PCS</th>
                      <th className="py-2.5 px-3 text-right">Reallocated M³</th>
                      <th className="py-2.5 px-3 text-center">Net Balance Delta</th>
                      <th className="py-2.5 px-3">Evidence / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {previewData.proposals.map((prop: any, idx: number) => {
                      const r = prop.proposedReallocation
                      return (
                        <tr key={prop.movementId || idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {prop.eligible ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                ELIGIBLE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                REJECTED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-white block">
                              {r?.warehouseName || "-"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {r?.variantSku || "-"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {r?.sourceBucket ? (
                              <div>
                                <span className="font-mono text-slate-300 block">
                                  Bal: {r.sourceBucket.beforePcs} pcs ({r.sourceBucket.beforeM3} m³)
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  After: {r.sourceBucket.afterPcs} pcs ({r.sourceBucket.afterM3} m³)
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {r?.targetBucket ? (
                              <div>
                                <span className="font-mono font-medium text-emerald-300 block">
                                  {r.targetBatch}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {r.targetBucket.beforePcs} → {r.targetBucket.afterPcs} pcs
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-white">
                            {r ? r.reallocatedPcs : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                            {r ? r.reallocatedVolumeM3.toFixed(4) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {r?.netPhysicalDelta?.isBalanced ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                Δ 0 pcs / 0 m³
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                MISMATCH
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate" title={prop.rejectionReason || prop.evidence}>
                            {prop.rejectionReason ? (
                              <span className="text-rose-400 font-medium">{prop.rejectionReason}</span>
                            ) : (
                              prop.evidence
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
