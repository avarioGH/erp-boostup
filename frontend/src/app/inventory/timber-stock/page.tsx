"use client"
import { useState, useEffect } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Package2 } from "lucide-react"

export default function TimberStockPage() {
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")

 useEffect(() => {
 TimberAPI.getTimberStock().then((res: any) => setData(res.items || [])).catch(console.error).finally(() => setLoading(false))
 }, [])

 const filtered = data.filter(item => item.timberVariant?.sku?.toLowerCase().includes(search.toLowerCase()))

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Finished Timber Stock</h1>
 <p className="text-muted-foreground mt-1">Real-time balances of sawn timber inventory.</p>
 </div>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 flex flex-row items-center justify-between">
 <CardTitle className="text-lg flex items-center gap-2"><Package2 className="w-5 h-5"/> Stock Balances</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search SKU..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left">SKU</th>
 <th className="p-4 px-6 text-left">Species</th>
 <th className="p-4 px-6 text-center">Grade</th>
 <th className="p-4 px-6 text-center">Size (T&times;W&times;L)</th>
 <th className="p-4 px-6 text-left">Location</th>
 <th className="p-4 px-6 text-right">Stock IN</th>
 <th className="p-4 px-6 text-right">Stock OUT</th>
 <th className="p-4 px-6 text-right bg-indigo-50/50 dark:bg-indigo-950/40">Current PCS</th>
 <th className="p-4 px-6 text-right bg-indigo-50/50 dark:bg-indigo-950/40">Current M&sup3;</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">No stock found</td></tr> :
 filtered.map(stock => (
 <tr key={stock.id} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4 px-6 font-medium text-emerald-700 dark:text-emerald-400">{stock.timberVariant?.sku}</td>
 <td className="p-4 px-6">{stock.timberVariant?.species}</td>
 <td className="p-4 px-6 text-center">{stock.timberVariant?.grade}</td>
 <td className="p-4 px-6 text-center">{stock.timberVariant?.thickness} &times; {stock.timberVariant?.width} &times; {stock.timberVariant?.length}</td>
 <td className="p-4 px-6 text-muted-foreground">{stock.location?.name}</td>
 <td className="p-4 px-6 text-right text-emerald-600 dark:text-emerald-500">+{stock.stockInPcs}</td>
 <td className="p-4 px-6 text-right text-red-600 dark:text-red-500">-{stock.stockOutPcs}</td>
 <td className="p-4 px-6 text-right font-bold bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300">{stock.currentPcs}</td>
 <td className="p-4 px-6 text-right font-bold bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">{stock.currentVolumeM3.toFixed(6)}</td>
 </tr>
 ))
 }
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
