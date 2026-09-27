"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function PrintTrimmingTally({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/inventory/trimming/${id}`).then((res: any) => {
      setData(res.data)
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
          <h1 className="text-xl font-bold uppercase tracking-wider text-center">Trimming Tally</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Trim Code</td>
                  <td className="py-1 align-top font-bold">: {data.trimCode || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Status</td>
                  <td className="py-1 align-top">: {data.status || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Date</td>
                  <td className="py-1 align-top">: {data.createdAt ? new Date(data.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Raw Log No</td>
                  <td className="py-1 align-top font-bold">: {data.rawLog?.logNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Species</td>
                  <td className="py-1 align-top">: {data.rawLog?.species || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Barcode</td>
                  <td className="py-1 align-top">: {data.barcode || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Table */}
        <table className="w-full border-collapse border border-black mb-8 text-[12px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left w-1/4">Property</th>
              <th className="border border-black p-2 text-left">Original (Supplier)</th>
              <th className="border border-black p-2 text-left">Trimmed (Actual)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-50">Length (m)</td>
              <td className="border border-black p-2">{data.rawLog?.originalLength || "-"}</td>
              <td className="border border-black p-2 font-bold text-blue-800">{data.length || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">D1 (cm)</td>
              <td className="border border-black p-2">{data.rawLog?.purchaseDiameter1 || "-"}</td>
              <td className="border border-black p-2 bg-gray-100" rowSpan={4}><span className="text-gray-500 italic">Diameter: {data.diameter || "-"} cm</span></td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">D2 (cm)</td>
              <td className="border border-black p-2">{data.rawLog?.purchaseDiameter2 || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">D3 (cm)</td>
              <td className="border border-black p-2">{data.rawLog?.purchaseDiameter3 || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">D4 (cm)</td>
              <td className="border border-black p-2">{data.rawLog?.purchaseDiameter4 || "-"}</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td className="border border-black p-2 font-semibold bg-gray-50">Gross Volume (M3)</td>
              <td className="border border-black p-2">{data.rawLog?.grossVolume || data.rawLog?.purchaseVolume || "-"}</td>
              <td className="border border-black p-2 font-bold">{data.grossVolume || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-50">Gerowong / Hollow (M3)</td>
              <td className="border border-black p-2">{data.rawLog?.gerowong || "-"}</td>
              <td className="border border-black p-2 text-red-600">{data.hollowVolume ? `- ${data.hollowVolume}` : "-"}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-50">Trimming (M3)</td>
              <td className="border border-black p-2">{data.rawLog?.trimmingVolume || "-"}</td>
              <td className="border border-black p-2 text-red-600">{data.trimmingVolume ? `- ${data.trimmingVolume}` : "-"}</td>
            </tr>
            <tr className="bg-blue-50">
              <td className="border border-black p-2 font-semibold">Trimmed Net Volume (M3)</td>
              <td className="border border-black p-2">{data.rawLog?.netVolume || "-"}</td>
              <td className="border border-black p-2 font-bold text-blue-800">{data.netVolume || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="flex justify-between mt-16 pt-8 px-8">
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Operator</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Supervisor</p>
          </div>
        </div>
      </div>
    </>
  )
}