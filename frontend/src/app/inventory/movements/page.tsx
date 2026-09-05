"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function MovementsPage() {
  const [data, setData] = useState([])
  useEffect(() => {
    api.get('/inventory/movements').then(res => setData(res.data))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Stock Movements Ledger</h1>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-left">
            <thead>
              <tr><th>Date</th><th>Product</th><th>Type</th><th>In</th><th>Out</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {data.map((m: any) => (
                <tr key={m.id} className="border-t">
                  <td className="py-2">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td>{m.product?.name}</td>
                  <td>{m.movement_type}</td>
                  <td className="text-green-600">{m.qty_in > 0 ? m.qty_in : '-'}</td>
                  <td className="text-red-600">{m.qty_out > 0 ? m.qty_out : '-'}</td>
                  <td className="font-bold">{m.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
