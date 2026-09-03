"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, BookOpen, AlertCircle } from "lucide-react"

export default function GeneralLedgerPage() {
  const [journals, setJournals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchJournals = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("erp_token")
      const res = await fetch("https://api.erp.boostup.id/gl/journals", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setJournals(data)
      } else {
        setError("Failed to fetch journal entries.")
      }
    } catch (e) {
      console.error(e)
      setError("Network error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals()
  }, [])

  const exportToCSV = () => {
    if (journals.length === 0) return

    // Define CSV headers
    let csvContent = "Date,Journal No,Reference Type,Reference ID,Account ID,Debit,Credit,Description\n"

    // Flatten journals and items into rows
    journals.forEach(journal => {
      const date = new Date(journal.journal_date).toLocaleDateString()
      if (journal.items && journal.items.length > 0) {
        journal.items.forEach((item: any) => {
          // Escape quotes and commas in description
          const desc = `"${(journal.description || "").replace(/"/g, '""')}"`
          const debit = item.debit || 0
          const credit = item.credit || 0
          
          csvContent += `${date},${journal.journal_no},${journal.reference_type},${journal.reference_id || ''},${item.account_id},${debit},${credit},${desc}\n`
        })
      } else {
        const desc = `"${(journal.description || "").replace(/"/g, '""')}"`
        csvContent += `${date},${journal.journal_no},${journal.reference_type},${journal.reference_id || ''},,0,0,${desc}\n`
      }
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `General_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount || 0)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            General Ledger
          </h1>
          <p className="text-muted-foreground mt-1">View all double-entry journal records automatically posted by the system.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={exportToCSV}
          disabled={loading || journals.length === 0}
          className="border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>All posted journals (auto-generated from other modules).</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12 text-muted-foreground animate-pulse">Loading general ledger...</div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-rose-500 gap-2">
              <AlertCircle className="w-8 h-8" />
              <span>{error}</span>
            </div>
          ) : journals.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No journal entries found. Make a transaction in Cash Management or Inventory to generate one.
            </div>
          ) : (
            <div className="space-y-6">
              {journals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(journal => (
                <div key={journal.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-muted/40 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b">
                    <div>
                      <div className="font-semibold text-sm">{journal.journal_no}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(journal.journal_date).toLocaleDateString()} • {journal.reference_type}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {journal.description || `Ref: ${journal.reference_id}`}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/10 text-xs">
                          <th className="p-3 text-left font-medium text-muted-foreground">Account ID</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Debit</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/20">
                        {journal.items && journal.items.length > 0 ? (
                          journal.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                              <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                {item.account_id}
                              </td>
                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                {Number(item.debit) > 0 ? formatCurrency(Number(item.debit)) : "-"}
                              </td>
                              <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                                {Number(item.credit) > 0 ? formatCurrency(Number(item.credit)) : "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-3 text-center text-muted-foreground italic">No items recorded</td>
                          </tr>
                        )}
                        {journal.items && journal.items.length > 0 && (
                          <tr className="bg-muted/20 font-semibold border-t-2">
                            <td className="p-3 text-right text-xs uppercase tracking-wider text-muted-foreground">Total</td>
                            <td className="p-3 text-right text-emerald-700 dark:text-emerald-500">
                              {formatCurrency(journal.items.reduce((sum: number, i: any) => sum + Number(i.debit || 0), 0))}
                            </td>
                            <td className="p-3 text-right text-rose-700 dark:text-rose-500">
                              {formatCurrency(journal.items.reduce((sum: number, i: any) => sum + Number(i.credit || 0), 0))}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {journals.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
              <div>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, journals.length)} to {Math.min(currentPage * itemsPerPage, journals.length)} of {journals.length} journals
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(journals.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(journals.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
