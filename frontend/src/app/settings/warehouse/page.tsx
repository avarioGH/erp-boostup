"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WarehouseSettings() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/inventory/warehouses")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground animate-pulse text-sm">Mengalihkan ke Lokasi Gudang...</p>
    </div>
  )
}
