"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Bell, Search, ChevronDown, MapPin, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeWarehouse, setActiveWarehouse] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    // Check local storage for user data
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("erp_user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          
          if (parsedUser.accessible_warehouses) {
            setWarehouses(parsedUser.accessible_warehouses)
            
            // Check if active warehouse is already in local storage
            const storedActive = localStorage.getItem("active_warehouse")
            if (storedActive && storedActive !== "null" && storedActive !== "undefined") {
              setActiveWarehouse(JSON.parse(storedActive))
            } else {
              // Default to Pusat (null warehouse)
              setActiveWarehouse(null)
              localStorage.setItem("active_warehouse", JSON.stringify(null))
            }
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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 shadow-sm z-10">
      <SidebarTrigger className="-ml-1 text-slate-500" />
      <Separator orientation="vertical" className="mx-2 h-4 bg-slate-200 dark:bg-slate-700" />
      
      {/* WAREHOUSE SELECTOR */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ml-2 mr-2 outline-none">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-1 rounded">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none mb-0.5">Lokasi Gudang</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
              {activeWarehouse?.name || "Pusat (Semua)"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold text-slate-900 dark:text-white">Pilih Lokasi Kerja</div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            id="warehouse-pusat"
            onClick={() => handleSelectWarehouse(null)}
            className={`cursor-pointer ${!activeWarehouse ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>Pusat (Semua Akses)</span>
              {!activeWarehouse && <Check className="w-4 h-4" />}
            </div>
          </DropdownMenuItem>
          
          {warehouses?.map((wh, idx) => (
            <DropdownMenuItem 
              id={`warehouse-${wh?.id || idx}`}
              key={wh?.id || idx} 
              onClick={() => handleSelectWarehouse(wh)}
              className={`cursor-pointer ${activeWarehouse?.id === wh?.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{wh?.name || "Unknown"}</span>
                {activeWarehouse?.id === wh?.id && <Check className="w-4 h-4" />}
              </div>
            </DropdownMenuItem>
          ))}
          
          {user?.role === "Owner" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                id="warehouse-manage"
                onClick={() => router.push("/settings/warehouse")}
                className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium"
              >
                + Kelola Gudang
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-1 items-center gap-4 px-2">
        <div className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e293b] px-3 text-slate-500 focus-within:bg-white dark:focus-within:bg-[#0f172a] focus-within:ring-1 focus-within:ring-primary transition-colors">
          <Search className="h-4 w-4" />
          <input 
            type="text" 
            placeholder="Cari modul, produk, pelanggan..." 
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#0f172a]"></span>
        </button>
        <div className="flex items-center gap-3 ml-2 cursor-pointer group">
          <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">AD</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors leading-none">{user?.name || "User"}</span>
            <span className="text-[10px] text-slate-500 leading-none">{user?.role || "Admin"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
