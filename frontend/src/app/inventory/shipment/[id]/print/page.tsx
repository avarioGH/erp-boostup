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

  // Calculate totals
  const totalPcs = (data.items || []).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0)

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
          <h1 className="text-xl font-bold uppercase tracking-wider text-center">Fuso Loading / Shipment Document</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Shipment No</td>
                  <td className="py-1 align-top font-bold">: {data.code || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Date</td>
                  <td className="py-1 align-top">: {data.createdAt ? new Date(data.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Status</td>
                  <td className="py-1 align-top">: {data.status || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Warehouse</td>
                  <td className="py-1 align-top">: {data.warehouse?.name || data.warehouseId || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Vehicle</td>
                  <td className="py-1 align-top">: {data.vehicle?.name || data.vehicle?.licensePlate || data.vehicleId || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Driver</td>
                  <td className="py-1 align-top">: {data.driver?.name || data.driverId || "-"}</td>
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
              <th className="border border-black p-2 text-center w-12">No</th>
              <th className="border border-black p-2 text-left">Timber Variant / SKU</th>
              <th className="border border-black p-2 text-right">Quantity (PCS)</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((item: any, i: number) => (
              <tr key={item.id || i}>
                <td className="border border-black p-2 text-center">{i + 1}</td>
                <td className="border border-black p-2">{item.product?.name || item.product?.sku || item.productId || "-"}</td>
                <td className="border border-black p-2 text-right">{item.quantity}</td>
              </tr>
            ))}
            {(!data.items || data.items.length === 0) && (
              <tr>
                <td colSpan={3} className="border border-black p-4 text-center italic">No items found for this shipment.</td>
              </tr>
            )}
          </tbody>
          {data.items && data.items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={2} className="border border-black p-2 text-right">TOTAL PCS</td>
                <td className="border border-black p-2 text-right">{totalPcs}</td>
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
            <p className="font-semibold text-[11px]">Driver</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16"></div>
            <hr className="border-black mb-1" />
            <p className="font-semibold text-[11px]">Authorized By</p>
          </div>
        </div>
      </div>
    </>
  )
}

