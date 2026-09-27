"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { ProductionAPI } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function PrintProductionSheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    ProductionAPI.getProduction(id).then((res: any) => {
      setData(res?.data || res)
      setTimeout(() => window.print(), 800)
    }).catch((err: any) => {
      console.error(err)
      setError(true)
    })
  }, [id])

  if (error) {
    return <div className="p-12 text-center text-red-600 font-bold">Document unavailable. Error loading data.</div>
  }

  if (!data) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 1.5cm; }
        }
      `}} />
      <div id="print-section" className="max-w-[210mm] mx-auto bg-white text-black font-sans text-[12px] leading-relaxed">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider text-center">Sawmill Production Sheet</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Production No</td>
                  <td className="py-1 align-top">: {data.productionNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Batch Number</td>
                  <td className="py-1 align-top font-bold">: {data.batchNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Date</td>
                  <td className="py-1 align-top">: {data.productionDate ? new Date(data.productionDate).toLocaleDateString("id-ID") : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Shift</td>
                  <td className="py-1 align-top">: {data.shift || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Machine / Process</td>
                  <td className="py-1 align-top">: {data.processType || "SAWMILL"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Status</td>
                  <td className="py-1 align-top">: {data.status || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Details */}
        <h2 className="font-bold text-[13px] uppercase mb-2 border-b border-black pb-1">Input Logs</h2>
        <table className="w-full border-collapse border border-black mb-6 text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center w-12">No</th>
              <th className="border border-black p-2 text-left">Input Number</th>
            </tr>
          </thead>
          <tbody>
            {(data.inputLogs || []).map((item: any, i: number) => (
              <tr key={item.id || i}>
                <td className="border border-black p-2 text-center">{i + 1}</td>
                <td className="border border-black p-2 font-medium">{item.inputNumber || "-"}</td>
              </tr>
            ))}
            {(!data.inputLogs || data.inputLogs.length === 0) && (
              <tr>
                <td colSpan={2} className="border border-black p-4 text-center italic">No input logs attached.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Output Details */}
        <h2 className="font-bold text-[13px] uppercase mb-2 border-b border-black pb-1">Sawn Timber Output</h2>
        <table className="w-full border-collapse border border-black mb-6 text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center w-8">No</th>
              <th className="border border-black p-1 text-left">SKU</th>
              <th className="border border-black p-1 text-left">Species</th>
              <th className="border border-black p-1 text-left">Grade</th>
              <th className="border border-black p-1 text-center">T</th>
              <th className="border border-black p-1 text-center">W</th>
              <th className="border border-black p-1 text-center">L</th>
              <th className="border border-black p-1 text-left">Partai</th>
              <th className="border border-black p-1 text-right">PCS</th>
              <th className="border border-black p-1 text-right">M3</th>
            </tr>
          </thead>
          <tbody>
            {(data.outputs || []).map((out: any, i: number) => {
              const tv = out.timberVariant;
              return (
                <tr key={out.id || i}>
                  <td className="border border-black p-1 text-center">{i + 1}</td>
                  <td className="border border-black p-1 font-semibold">{tv?.sku || out.timberVariantId || "-"}</td>
                  <td className="border border-black p-1">{tv?.species || "-"}</td>
                  <td className="border border-black p-1">{tv?.grade || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.thickness || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.width || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.length || "-"}</td>
                  <td className="border border-black p-1">{data.batchNumber || "-"}</td>
                  <td className="border border-black p-1 text-right font-bold">{out.quantityPcs || "-"}</td>
                  <td className="border border-black p-1 text-right">{out.volumeM3 ? Number(out.volumeM3).toFixed(4) : "-"}</td>
                </tr>
              )
            })}
            {(!data.outputs || data.outputs.length === 0) && (
              <tr>
                <td colSpan={10} className="border border-black p-4 text-center italic">No outputs recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary Table */}
        <div className="w-64 ml-auto">
          <table className="w-full border-collapse border border-black text-[11px]">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">Total Input (M3)</td>
                <td className="border border-black p-2 text-right">{data.totalInputVolume ? Number(data.totalInputVolume).toFixed(4) : "-"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">Total Output (M3)</td>
                <td className="border border-black p-2 text-right">{data.totalOutputVolume ? Number(data.totalOutputVolume).toFixed(4) : "-"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-200">Rendement / Yield</td>
                <td className="border border-black p-2 text-right font-bold">{data.yieldPercentage ? Number(data.yieldPercentage).toFixed(2) + "%" : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-16 pt-8 px-8">
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Prepared By</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Checked By</p>
          </div>
        </div>
      </div>
    </>
  )
}