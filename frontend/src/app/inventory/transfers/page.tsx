"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

export default function TransfersPage() {
  const [data, setData] = useState([])
  useEffect(() => {
    api.get('/inventory/transactions').then(res => {
      setData(res.data.filter((t: any) => t.transaction_type === 'TRANSFER'))
    })
  }, [])

  const validate = async (id: string) => {
    await api.post(`/inventory/transfer/${id}/validate`)
    alert('Validated!')
    window.location.reload()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Warehouse Transfers</h1>
      <Card>
        <CardHeader><CardTitle>Transfers</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr><th>No</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {data.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">{t.transaction_no}</td>
                  <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                  <td>{t.status}</td>
                  <td>
                    {t.status === 'Draft' && <Button onClick={() => validate(t.id)}>Validate</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
