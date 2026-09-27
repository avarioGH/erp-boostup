"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { TimberAPI } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function PrintSawnTimberOutput({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    TimberAPI.getSawnOutput(id).then((res: any) => {
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

  // Calculate totals
  const totalPcs = data.items?.reduce((sum: number, item: any) => sum + (item.quantityPcs || 0), 0) || 0;
  const totalM3 = data.items?.reduce((sum: number, item: any) => sum + (item.volumeM3 || 0), 0) || 0;

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
          <h1 className="text-xl font-bold uppercase tracking-wider text-center">SAWMILL PRODUCTION OUTPUT</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Output Number</td>
                  <td className="py-1 align-top font-bold">: {data.bundleNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Date</td>
                  <td className="py-1 align-top">: {data.outputDate ? new Date(data.outputDate).toLocaleDateString("id-ID") : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Shift</td>
                  <td className="py-1 align-top">: {data.shift || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Warehouse</td>
                  <td className="py-1 align-top">: {data.location?.name || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Input Number</td>
                  <td className="py-1 align-top">: {data.inputLog?.inputNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Species</td>
                  <td className="py-1 align-top">: {data.inputLog?.species || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Batch</td>
                  <td className="py-1 align-top">: {data.batch || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Status</td>
                  <td className="py-1 align-top font-semibold uppercase">: {data.status || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Table */}
        <h2 className="font-bold text-[13px] uppercase mb-2 border-b border-black pb-1">Timber Outputs</h2>
        <table className="w-full border-collapse border border-black mb-6 text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center w-10">No</th>
              <th className="border border-black p-2 text-left">Grade</th>
              <th className="border border-black p-2 text-center">T (mm)</th>
              <th className="border border-black p-2 text-center">W (mm)</th>
              <th className="border border-black p-2 text-center">L (mm)</th>
              <th className="border border-black p-2 text-right">PCS</th>
              <th className="border border-black p-2 text-right">M3</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, i: number) => {
              const v = item.timberVariant;
              return (
                <tr key={item.id || i}>
                  <td className="border border-black p-2 text-center">{i + 1}</td>
                  <td className="border border-black p-2 font-medium">{item.grade || v?.grade || "-"}</td>
                  <td className="border border-black p-2 text-center">{item.thicknessMm || v?.thickness || "-"}</td>
                  <td className="border border-black p-2 text-center">{item.widthMm || v?.width || "-"}</td>
                  <td className="border border-black p-2 text-center">{item.lengthMm || v?.length || "-"}</td>
                  <td className="border border-black p-2 text-right">{item.quantityPcs || 0}</td>
                  <td className="border border-black p-2 text-right font-bold text-blue-800">{item.volumeM3 ? Number(item.volumeM3).toFixed(4) : "-"}</td>
                </tr>
              )
            })}
            {(!data.items || data.items.length === 0) && (
              <tr>
                <td colSpan={7} className="border border-black p-4 text-center italic">No output items recorded.</td>
              </tr>
            )}
          </tbody>
          {data.items && data.items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="border border-black p-2 text-right">TOTAL</td>
                <td className="border border-black p-2 text-right">{totalPcs}</td>
                <td className="border border-black p-2 text-right">{totalM3.toFixed(4)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Signatures */}
        <div className="flex justify-between mt-16 pt-8 px-8">
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Operator</p>
            <p className="text-[10px] text-gray-500">{data.operatorName || "_________________"}</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Warehouse Supervisor</p>
          </div>
        </div>
      </div>
    </>
  )
}
