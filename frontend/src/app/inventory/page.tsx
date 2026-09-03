"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Home, ArrowRightLeft, RefreshCcw, PackageSearch, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { InventoryAPI } from "@/lib/api"

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [stats, setStats] = useState({ products: 0, warehouses: 0, movements: 0, lowStock: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setIsError(false)
        const [products, warehouses, movements] = await Promise.all([
          InventoryAPI.getProducts().catch(() => []),
          InventoryAPI.getWarehouses().catch(() => []),
          InventoryAPI.getTransactions().catch(() => [])
        ])

        const lowStockCount = products.filter((p: any) => {
          const totalStock = p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0
          return totalStock < (p.minimum_stock || 20)
        }).length

        setStats({
          products: products.length || 0,
          warehouses: warehouses.length || 0,
          movements: movements.length || 0,
          lowStock: lowStockCount
        })
      } catch (e) {
        console.error(e)
        setIsError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Memuat Data Inventaris...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Inventaris</h2>
        <p className="text-muted-foreground max-w-md mb-8 text-sm">
          Terjadi kesalahan saat mengambil data dari server. Silakan coba lagi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Inventaris</h1>
        <p className="text-muted-foreground mt-1 text-sm">Ringkasan produk, cabang gudang, dan pergerakan stok Anda.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-primary/10 rounded-lg text-primary">
            <Box className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Total Produk</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{stats.products}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mt-1">
               <span className="text-muted-foreground text-xs font-medium">Item dalam katalog</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-warning/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-warning/10 rounded-lg text-warning">
            <Home className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Cabang Gudang</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{stats.warehouses}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mt-1">
               <span className="text-muted-foreground text-xs font-medium">Lokasi penyimpanan aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-success/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-success/10 rounded-lg text-success">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Pergerakan Stok</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{stats.movements}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mt-1">
               <span className="text-muted-foreground text-xs font-medium">Transaksi stok tercatat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-destructive/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-destructive/10 rounded-lg text-destructive">
            <PackageSearch className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Stok Menipis</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{stats.lowStock}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mt-1">
               <span className={`text-xs font-medium ${stats.lowStock > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                 {stats.lowStock > 0 ? 'Butuh restock segera' : 'Kapasitas aman'}
               </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
