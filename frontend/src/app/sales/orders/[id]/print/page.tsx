"use client"
import { useEffect, useState } from "react"
import { B2BApi } from "@/lib/api"
import { useParams } from "next/navigation"

export default function SOPrintPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      B2BApi.getOrder(params.id as string).then(setData).catch(console.error)
    }
  }, [params.id])

  if (!data) return <div className="p-8">Memuat dokumen...</div>

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Hide on print */}
      <div className="print:hidden p-4 bg-gray-100 flex justify-between items-center border-b">
        <div>
          <h1 className="font-bold">Surat Jalan / Invoice SO</h1>
          <p className="text-sm text-gray-600">Tekan tombol cetak untuk print</p>
        </div>
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
          Cetak Dokumen
        </button>
      </div>

      {/* A4 Printable Area */}
      <div className="w-[210mm] min-h-[297mm] mx-auto p-[15mm] bg-white">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Surat Jalan / Invoice</h1>
          <p className="text-sm mt-1">Nomor: {data.order_number}</p>
        </div>

        <div className="flex justify-between mb-8 text-sm">
          <div className="w-1/2 pr-4 border-r">
            <h3 className="font-bold mb-2">Informasi Pengirim</h3>
            <p><strong>Perusahaan:</strong> {data.company?.name || 'Perusahaan Anda'}</p>
            <p><strong>Tanggal:</strong> {new Date(data.order_date).toLocaleDateString('id-ID')}</p>
            <p><strong>Metode Pembayaran:</strong> {data.payment_method}</p>
          </div>
          <div className="w-1/2 pl-4">
            <h3 className="font-bold mb-2">Kepada (Penerima)</h3>
            <p className="font-semibold text-lg">{data.customer?.name || '-'}</p>
            <p>{data.customer?.address || '-'}</p>
            <p>Telp: {data.customer?.phone || '-'}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-black">
              <th className="py-2 px-3 text-left">No</th>
              <th className="py-2 px-3 text-left">Nama Barang</th>
              <th className="py-2 px-3 text-right">Qty</th>
              <th className="py-2 px-3 text-right">Harga Satuan</th>
              <th className="py-2 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 border-b-2 border-black">
            {data.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-3 px-3">{i + 1}</td>
                <td className="py-3 px-3 font-medium">{item.product?.name || '-'}</td>
                <td className="py-3 px-3 text-right">{item.qty}</td>
                <td className="py-3 px-3 text-right">Rp {(item.unit_price || 0).toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 text-right">Rp {(item.subtotal || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-3 px-3 text-right font-bold">TOTAL KESELURUHAN</td>
              <td className="py-3 px-3 text-right font-bold text-lg">Rp {(data.total_amount || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8">
          <p className="text-sm font-bold mb-1">Catatan Tambahan:</p>
          <p className="text-sm border p-3 rounded bg-gray-50">{data.notes || '-'}</p>
        </div>

        <div className="flex justify-between mt-16 text-sm text-center">
          <div className="w-1/3">
            <p className="mb-16">Penerima,</p>
            <p className="font-bold underline">( ........................ )</p>
          </div>
          <div className="w-1/3">
            <p className="mb-16">Pengirim,</p>
            <p className="font-bold underline">( ........................ )</p>
          </div>
          <div className="w-1/3">
            <p className="mb-16">Hormat Kami,</p>
            <p className="font-bold underline">{data.company?.name || 'Manajemen'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
