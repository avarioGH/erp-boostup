"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { OpnameAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Save, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function OpnameDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [opname, setOpname] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (id) fetchOpname()
  }, [id])

  const fetchOpname = async () => {
    try {
      setLoading(true)
      const res = await OpnameAPI.getById(id as string)
      setOpname(res)
      setItems(res.items || [])
    } catch (err) {
      toast({ title: "Error", description: "Failed to load opname details", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handlePhysicalChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    const numValue = parseFloat(value) || 0
    newItems[index] = { ...newItems[index], [field]: value === "" ? "" : numValue }
    
    // Recalculate variances
    const sysQty = newItems[index].systemQuantityPcs || 0
    const physQty = newItems[index].physicalQuantityPcs || 0
    newItems[index].varianceQuantityPcs = physQty - sysQty

    const sysVol = newItems[index].systemVolumeM3 || 0
    const physVol = newItems[index].physicalVolumeM3 || 0
    newItems[index].varianceVolumeM3 = physVol - sysVol

    setItems(newItems)
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      const updates = items.map(item => ({
        id: item.id,
        productId: item.productId,
        physicalQuantityPcs: item.physicalQuantityPcs || 0,
        physicalVolumeM3: item.physicalVolumeM3 || 0,
      }))
      await OpnameAPI.updateCounts(id as string, updates)
      toast({ title: "Progress Saved", description: "Your count has been saved." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save progress", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await OpnameAPI.confirm(id as string)
      toast({ title: "Opname Confirmed", description: "The opname has been successfully confirmed." })
      fetchOpname()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to confirm opname", variant: "destructive" })
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>

  if (!opname) return <div className="p-12 text-center text-muted-foreground">Opname not found.</div>

  const isConfirmed = opname.status === 'CONFIRMED'

  return (
    <div className="space-y-6 pb-10">
      <Link href="/inventory/stock-opname" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Opname List
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Count Sheet {opname.opnameNumber || opname.id.slice(0,8)}</h1>
          <p className="text-muted-foreground mt-1">
            Warehouse: <span className="font-semibold text-foreground">{opname.warehouse?.name || '-'}</span> | 
            Status: <Badge variant={isConfirmed ? "default" : "secondary"} className="ml-2">{opname.status}</Badge>
          </p>
        </div>
        {!isConfirmed && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveProgress} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Progress
            </Button>
            <Button onClick={handleConfirm} disabled={confirming} className="bg-purple-600 hover:bg-purple-700">
              {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Opname
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-[16px]">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-right text-muted-foreground">Sys Qty (Pcs)</th>
                  <th className="p-3 text-right text-muted-foreground">Sys Vol (M3)</th>
                  <th className="p-3 text-right font-semibold text-primary">Phys Qty (Pcs)</th>
                  <th className="p-3 text-right font-semibold text-primary">Phys Vol (M3)</th>
                  <th className="p-3 text-right">Var Qty</th>
                  <th className="p-3 text-right">Var Vol</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No items in this warehouse.</td></tr>
                ) : items.map((item, index) => {
                  const varQty = item.varianceQuantityPcs || 0
                  const varVol = item.varianceVolumeM3 || 0
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{item.product?.name || item.productId}</td>
                      <td className="p-3 text-right">{item.systemQuantityPcs || 0}</td>
                      <td className="p-3 text-right">{(item.systemVolumeM3 || 0).toFixed(4)}</td>
                      <td className="p-3 text-right">
                        <Input 
                          type="number" 
                          value={item.physicalQuantityPcs === "" ? "" : item.physicalQuantityPcs || 0}
                          onChange={(e) => handlePhysicalChange(index, 'physicalQuantityPcs', e.target.value)}
                          className="w-24 ml-auto text-right"
                          disabled={isConfirmed}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Input 
                          type="number" step="0.0001"
                          value={item.physicalVolumeM3 === "" ? "" : item.physicalVolumeM3 || 0}
                          onChange={(e) => handlePhysicalChange(index, 'physicalVolumeM3', e.target.value)}
                          className="w-28 ml-auto text-right"
                          disabled={isConfirmed}
                        />
                      </td>
                      <td className={`p-3 text-right font-medium ${varQty < 0 ? 'text-red-500' : varQty > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {varQty > 0 ? '+' : ''}{varQty}
                      </td>
                      <td className={`p-3 text-right font-medium ${varVol < 0 ? 'text-red-500' : varVol > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {varVol > 0 ? '+' : ''}{varVol.toFixed(4)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
