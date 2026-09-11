"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"

export default function PrintTrimmingTally() {
 const params = useParams()
 const [data, setData] = useState<any>(null)

 useEffect(() => {
 api.get(`/inventory/trimming/${params.id}`).then(res => {
 setData(res.data)
 setTimeout(() => window.print(), 500)
 })
 }, [params.id])

 if (!data) return <div className="p-12 text-center">Loading Print View...</div>

 return (
 <div className="p-8 max-w-4xl mx-auto bg-card text-black font-sans print:m-0 print:p-4">
 <div className="text-center mb-8 border-b-2 border-black pb-4">
 <h1 className="text-2xl font-bold uppercase">Trimming Tally</h1>
 <p className="text-sm">Date: {new Date(data.createdAt).toLocaleDateString()}</p>
 </div>
 
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div>
 <p><strong>Raw Log Number:</strong> {data.rawLog?.logNumber}</p>
 <p><strong>Species:</strong> {data.rawLog?.species}</p>
 <p><strong>Original Length:</strong> {data.rawLog?.originalLength} m</p>
 </div>
 <div>
 <p><strong>Trim Code:</strong> {data.trimCode}</p>
 <p><strong>Length:</strong> {data.length} m</p>
 <p><strong>Net Volume:</strong> {data.netVolume} M³</p>
 </div>
 </div>

 <table className="w-full border-collapse border border-black mb-8">
 <thead>
 <tr className="bg-gray-100">
 <th className="border border-black p-2 text-left">Property</th>
 <th className="border border-black p-2 text-left">Value</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td className="border border-black p-2">Status</td>
 <td className="border border-black p-2">{data.status}</td>
 </tr>
 <tr>
 <td className="border border-black p-2">Barcode</td>
 <td className="border border-black p-2">{data.barcode || '-'}</td>
 </tr>
 </tbody>
 </table>

 <div className="flex justify-between mt-16 pt-8">
 <div className="text-center w-48">
 <hr className="border-black mb-2" />
 <p>Operator</p>
 </div>
 <div className="text-center w-48">
 <hr className="border-black mb-2" />
 <p>Supervisor</p>
 </div>
 </div>
 </div>
 )
}
