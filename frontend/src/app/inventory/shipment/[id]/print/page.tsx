"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { ShipmentAPI } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function PrintShipmentDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    ShipmentAPI.getShipment(id).then((res: any) => {
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

  // Calculate totals natively from the backend models
  const totalPcs = (data.items || []).reduce((sum: number, i: any) => sum + (Number(i.quantityPcs) || 0), 0)
  const totalM3 = (data.items || []).reduce((sum: number, i: any) => sum + (Number(i.volumeM3) || 0), 0)

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
          <h1 className="text-xl font-bold uppercase tracking-wider text-center">SURAT JALAN / SHIPMENT</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Shipment No</td>
                  <td className="py-1 align-top font-bold">: {data.shipmentNumber || data.code || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Date</td>
                  <td className="py-1 align-top">: {data.shipmentDate ? new Date(data.shipmentDate).toLocaleDateString("id-ID") : (data.createdAt ? new Date(data.createdAt).toLocaleDateString("id-ID") : "-")}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Customer</td>
                  <td className="py-1 align-top">: {data.customer?.name || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Destination</td>
                  <td className="py-1 align-top">: {data.destinationName || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Address</td>
                  <td className="py-1 align-top">: {data.destinationAddress || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Warehouse</td>
                  <td className="py-1 align-top">: {data.warehouse?.name || data.warehouseId || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Vehicle</td>
                  <td className="py-1 align-top">: {data.vehicle?.name || data.vehicle?.licensePlate || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Plate Number</td>
                  <td className="py-1 align-top">: {data.vehicle?.licensePlate || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Driver</td>
                  <td className="py-1 align-top">: {data.driver?.name || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-[120px] align-top">Status</td>
                  <td className="py-1 align-top">: {data.status || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <h2 className="font-bold text-[13px] uppercase mb-2 border-b border-black pb-1">Timber Items</h2>
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
              <th className="border border-black p-1 text-left">Partai / Batch</th>
              <th className="border border-black p-1 text-right">PCS</th>
              <th className="border border-black p-1 text-right">M3</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((item: any, i: number) => {
              const tv = item.timberVariant;
              return (
                <tr key={item.id || i}>
                  <td className="border border-black p-1 text-center">{i + 1}</td>
                  <td className="border border-black p-1 font-semibold">{tv?.sku || "-"}</td>
                  <td className="border border-black p-1">{tv?.species || "-"}</td>
                  <td className="border border-black p-1">{tv?.grade || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.thickness || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.width || "-"}</td>
                  <td className="border border-black p-1 text-center">{tv?.length || "-"}</td>
                  <td className="border border-black p-1">{item.batch && item.batch !== "UNKNOWN" ? item.batch : "-"}</td>
                  <td className="border border-black p-1 text-right font-bold">{item.quantityPcs || 0}</td>
                  <td className="border border-black p-1 text-right">{item.volumeM3 ? Number(item.volumeM3).toFixed(4) : "-"}</td>
                </tr>
              )
            })}
            {(!data.items || data.items.length === 0) && (
              <tr>
                <td colSpan={10} className="border border-black p-4 text-center italic">No items found for this shipment.</td>
              </tr>
            )}
          </tbody>
          {data.items && data.items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={8} className="border border-black p-1 text-right">TOTAL</td>
                <td className="border border-black p-1 text-right">{totalPcs}</td>
                <td className="border border-black p-1 text-right">{totalM3.toFixed(4)}</td>
              </tr>
            </tfoot>
          )}
        </table>

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
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Driver / Receiver</p>
          </div>
        </div>
      </div>
    </>
  )
}