"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, ArrowDown } from "lucide-react"

export default function TraceabilityPage() {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search) return
    setLoading(true)
    setError("")
    setResult(null)
    
    try {
      const res = await api.get(`/inventory/reports/traceability?search=${encodeURIComponent(search)}`)
      if (res.data) {
        setResult(res.data)
      } else {
        setError("No traceability timeline found for this identifier.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to search traceability")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 p-8 dark">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Log Traceability</h2>
        <p className="text-muted-foreground text-slate-400">Search by Bundle, Input Number, Trim Code, or Raw Log.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter Bundle, Log Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700"
              />
            </div>
            <Button type="submit" disabled={loading || !search} className="bg-indigo-600 hover:bg-indigo-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Track
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Traceability Timeline</h3>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">SAWN TIMBER OUTPUT</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div>Bundle: <strong className="text-white">{result.bundleNumber}</strong></div>
                <div>Volume: <strong className="text-white">{result.totalM3} M³</strong></div>
                <div>Date: {new Date(result.createdAt).toLocaleDateString()}</div>
                <div>Status: {result.status}</div>
              </div>
            </CardContent>
          </Card>

          {result.inputLog && (
            <>
              <div className="flex justify-center"><ArrowDown className="text-slate-600" /></div>
              <Card className="bg-slate-900 border-slate-800 ml-8 border-l-4 border-l-indigo-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-400">INPUT LOG</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>Input Number: <strong className="text-white">{result.inputLog.inputNumber}</strong></div>
                    <div>Partai: <strong className="text-white">{result.inputLog.partai}</strong></div>
                    <div>Machine: {result.inputLog.machine}</div>
                    <div>Net Volume: {result.inputLog.totalNetVolume} M³</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {result.inputLog?.items?.map((item: any, i: number) => item.trimmedLog && (
            <div key={i}>
              <div className="flex justify-center ml-8"><ArrowDown className="text-slate-600" /></div>
              <Card className="bg-slate-900 border-slate-800 ml-16 border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-400">RAW LOG SOURCE (DUKB)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>Log Number: <strong className="text-white">{item.trimmedLog.rawLog?.logNumber}</strong></div>
                    <div>Trim Code: <strong className="text-white">{item.trimmedLog.trimCode}</strong></div>
                    <div>Species: {item.trimmedLog.rawLog?.species}</div>
                    <div>Net M³: {item.trimmedLog.netVolume}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
