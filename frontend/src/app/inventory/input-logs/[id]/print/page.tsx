"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"

export default function PrintInputTally() {
 const params = useParams()
 const [data, setData] = useState<any>(null)

 useEffect(() => {
 api.get(`/inventory/input-logs/${params.id}`).then(res => {
 setData(res.data)
 setTimeout(() => window.print(), 500)
 })
 }, [params.id])

 if (!data) return <div className="p-12 text-center">Loading Print View...</div>

 return (
 <div className="p-8 max-w-4xl mx-auto bg-card text-black font-sans print:m-0 print:p-4">
 <div className="text-center mb-8 border-b-2 border-black pb-4">
 <h1 className="text-2xl font-bold uppercase">Input Tally</h1>
 <p className="text-sm">Date: {new Date(data.date || data.createdAt).toLocaleDateString()}</p>
 </div>
 
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div>
 <p><strong>Input Number:</strong> {data.inputNumber}</p>
 <p><strong>Machine:</strong> {data.machine}</p>
 <p><strong>Shift:</strong> {data.shift}</p>
 </div>
 <div>
 <p><strong>Partai:</strong> {data.partai}</p>
 <p><strong>Total Length:</strong> {data.totalLength} m</p>
 <p><strong>Total Net Volume:</strong> {data.totalNetVolume} M³</p>
 </div>
 </div>

 <table className="w-full border-collapse border border-black mb-8">
 <thead>
 <tr className="bg-gray-100">
 <th className="border border-black p-2 text-left">No</th>
 <th className="border border-black p-2 text-left">Trim Code</th>
 <th className="border border-black p-2 text-left">Length (m)</th>
 <th className="border border-black p-2 text-left">Net M³</th>
 </tr>
 </thead>
 <tbody>
 {data.items?.map((item: any, i: number) => (
 <tr key={item.id}>
 <td className="border border-black p-2">{i + 1}</td>
 <td className="border border-black p-2">{item.trimmedLog?.trimCode}</td>
 <td className="border border-black p-2">{item.trimmedLog?.length}</td>
 <td className="border border-black p-2">{item.trimmedLog?.netVolume}</td>
 </tr>
 ))}
 {(!data.items || data.items.length === 0) && (
 <tr>
 <td colSpan={4} className="border border-black p-4 text-center">No logs attached.</td>
 </tr>
 )}
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
