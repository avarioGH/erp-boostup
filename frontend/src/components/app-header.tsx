"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Bell, Search, ChevronDown, MapPin, Check, Command } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export function AppHeader() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeWarehouse, setActiveWarehouse] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    // Fetch live warehouses
    api.get('/inventory/warehouses').then(res => {
      if (res.data) setWarehouses(res.data)
    }).catch(err => console.error("Error fetching warehouses", err))

    // Check local storage for user data
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("erp_user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          
          // Check if active warehouse is already in local storage
          const storedActive = localStorage.getItem("active_warehouse")
          if (storedActive && storedActive !== "null" && storedActive !== "undefined") {
            setActiveWarehouse(JSON.parse(storedActive))
          } else {
            // Default to Pusat (null warehouse)
            setActiveWarehouse(null)
            localStorage.setItem("active_warehouse", JSON.stringify(null))
          }
        } catch (e) {
          console.error("Error parsing user data", e)
        }
      }
    }
  }, [])

  const handleSelectWarehouse = (wh: any) => {
    setActiveWarehouse(wh)
    localStorage.setItem("active_warehouse", JSON.stringify(wh))
    window.location.reload() // Reload to fetch data contextually
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 z-10 transition-colors">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mx-1 h-5 bg-border" />
      
      {/* WAREHOUSE SELECTOR */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 px-3 py-1.5 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="bg-primary/10 text-primary p-1 rounded-md">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Lokasi Gudang</span>
            <span className="text-[13px] font-semibold text-foreground leading-none truncate max-w-[140px]">
              {activeWarehouse?.name || "Pusat (Semua)"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1">
          <div className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilih Lokasi Kerja</div>
          <DropdownMenuSeparator className="mx-1" />
          
          <DropdownMenuItem 
            id="warehouse-pusat"
            onClick={() => handleSelectWarehouse(null)}
            className={`cursor-pointer my-0.5 rounded-md px-3 py-2 ${!activeWarehouse ? 'bg-primary/10 text-primary' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-sm">Pusat (Semua Akses)</span>
              {!activeWarehouse && <Check className="w-4 h-4" />}
            </div>
          </DropdownMenuItem>
          
          {warehouses?.map((wh, idx) => (
            <DropdownMenuItem 
              id={`warehouse-${wh?.id || idx}`}
              key={wh?.id || idx} 
              onClick={() => handleSelectWarehouse(wh)}
              className={`cursor-pointer my-0.5 rounded-md px-3 py-2 ${activeWarehouse?.id === wh?.id ? 'bg-primary/10 text-primary' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{wh?.name || "Unknown"}</span>
                {activeWarehouse?.id === wh?.id && <Check className="w-4 h-4" />}
              </div>
            </DropdownMenuItem>
          ))}
          
          {user?.role === "Owner" && (
            <>
              <DropdownMenuSeparator className="mx-1 mt-1" />
              <DropdownMenuItem 
                id="warehouse-manage"
                onClick={() => router.push("/settings/warehouse")}
                className="cursor-pointer text-primary font-medium focus:text-primary focus:bg-primary/10 my-0.5 rounded-md px-3 py-2"
              >
                + Kelola Gudang
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-1 items-center gap-4 px-2 lg:px-6">
        <div className="flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all shadow-sm">
          <Search className="h-[15px] w-[15px] opacity-70" />
          <input 
            type="text" 
            placeholder="Cari menu, pelanggan, atau transaksi... (Ctrl+K)" 
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
          />
          <div className="hidden sm:flex items-center gap-1 opacity-60">
            <Command className="h-3 w-3" />
            <span className="text-[10px] font-medium tracking-widest">K</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <ThemeToggle />
        <button className="relative text-muted-foreground hover:text-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-destructive border-[1.5px] border-background"></span>
        </button>
        <Separator orientation="vertical" className="hidden md:block h-5 bg-border mx-1" />
        <div className="flex items-center gap-3 cursor-pointer group hover:bg-accent py-1 px-2 rounded-md transition-colors">
          <Avatar className="h-8 w-8 border border-border shadow-sm">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">US</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start justify-center">
            <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{user?.name || "Administrator"}</span>
            <span className="text-[11px] text-muted-foreground font-medium leading-tight">{user?.role || "Owner"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
