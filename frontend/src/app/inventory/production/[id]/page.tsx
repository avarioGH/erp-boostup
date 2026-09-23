"use client"
import { useState, useEffect } from "react"
import { ProductionAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProductionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchProcess = () => {
    setLoading(true)
    ProductionAPI.getProcess(params.id as string)
      .then((res: any) => setData(res))
      .catch((err: any) => {
        toast({ title: "Error", description: err.response?.data?.message || "Failed to load process", variant: "destructive" })
        router.push('/inventory/production')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (params.id) fetchProcess()
  }, [params.id])

  const handleConfirm = async () => {
    setConfirming(true)
    setErrorMsg(null)
    try {
      await ProductionAPI.confirmProcess(params.id as string)
      toast({ title: "Berhasil", description: "Production Process berhasil dikonfirmasi" })
      setShowConfirmModal(false)
      fetchProcess()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal mengkonfirmasi process"
      const lowerMsg = msg.toLowerCase()
      if (lowerMsg.includes("consumed") || lowerMsg.includes("insufficient")) {
        setErrorMsg(msg)
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" })
      }
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (!data) return null

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/production')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Process: {data.processNumber}</h1>
            <p className="text-muted-foreground mt-1">Status: <Badge variant={data.status === "COMPLETED" ? "default" : (data.status === "DRAFT" ? "secondary" : "destructive")}>{data.status}</Badge></p>
          </div>
        </div>
        {data.status === "DRAFT" && (
          <Button onClick={() => setShowConfirmModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle className="w-4 h-4 mr-2" /> Confirm Production
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-[16px]">Process Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="font-semibold">{data.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="font-medium">{new Date(data.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Notes</span>
              <span>{data.notes || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-[16px]">Inputs (Consumed Stock)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {data.inputs && data.inputs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Timber Stock</th>
                    <th className="py-2 text-right">Quantity Consumed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inputs.map((inp: any) => (
                    <tr key={inp.id} className="border-b last:border-0">
                      <td className="py-2">{inp.timberStock?.bundleNumber || inp.timberStockId}</td>
                      <td className="py-2 text-right font-bold text-rose-600">-{inp.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No inputs found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-[16px]">Outputs (Produced / Waste)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {data.outputs && data.outputs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Product Variant</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Remarks</th>
                    <th className="py-2 text-right">Quantity Produced</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outputs.map((out: any) => (
                    <tr key={out.id} className="border-b last:border-0">
                      <td className="py-2">{out.variant?.name || out.variantId}</td>
                      <td className="py-2"><Badge variant={out.type === "PRODUCT" ? "default" : "secondary"}>{out.type}</Badge></td>
                      <td className="py-2">{out.remarks || '-'}</td>
                      <td className="py-2 text-right font-bold text-emerald-600">+{out.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No outputs found.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={(open) => {
        setShowConfirmModal(open)
        if (!open) setErrorMsg(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Production</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this production process? 
              <br/><br/>
              <strong>Warning:</strong> This will mutate inventory stocks. 
              Inputs will be deducted from TimberStock, and Outputs will be added as new items. This action cannot be undone easily.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowConfirmModal(false)
              setErrorMsg(null)
            }}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirming} className="bg-emerald-600 hover:bg-emerald-700">
              {confirming ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
              Confirm & Mutate Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
