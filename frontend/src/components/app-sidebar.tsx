"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, Users, Box, Calculator, Settings, 
  ShoppingCart, ShieldAlert, BarChart3, Bot, Receipt,
  Store, UserCheck, ArrowRightLeft, TrendingUp, TrendingDown
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { TranslationKey } from "@/i18n/dictionaries"

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  subItems?: { title: string; url: string; badge?: string }[];
  badge?: string;
  id?: string;
}

const items: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { 
    title: "Keuangan", 
    url: "/finance", 
    icon: Calculator,
    id: "finance",
    subItems: [
      { title: "Dashboard Keuangan", url: "/finance" },
      { title: "Kas & Bank", url: "/finance/cash" },
      { title: "Pemasukan", url: "/finance/cash-in" },
      { title: "Pengeluaran", url: "/finance/cash-out" },
      { title: "Transfer", url: "/finance/transfer" },
      { title: "Laporan Keuangan", url: "/finance/reports" }
    ]
  },
  { 
    title: "Inventaris", 
    url: "/inventory", 
    icon: Box,
    id: "inventory",
    subItems: [
      { title: "Produk", url: "/inventory/products" },
      { title: "Stok Masuk", url: "/inventory/stock-in" },
      { title: "Stok Keluar", url: "/inventory/stock-out" },
      { title: "Transfer Gudang", url: "/inventory/stock-transfer" },
      { title: "Riwayat Pergerakan", url: "/inventory/movements" },
      { title: "Penyesuaian Stok", url: "/inventory/stock-adjustment" },
      { title: "Laporan Stok", url: "/inventory/reports" }
    ]
  },
  { 
    title: "POS (Kasir)", 
    url: "/pos", 
    icon: ShoppingCart,
    id: "pos",
    subItems: [
      { title: "Kasir POS", url: "/pos/new-transaction" },
      { title: "Riwayat Penjualan", url: "/pos/order-history" },
      { title: "Shift & Kas", url: "/pos/shift" }
    ]
  },
  { 
    title: "Pelanggan", 
    url: "/customers", 
    icon: Users,
    id: "crm",
    subItems: [
      { title: "Pelanggan", url: "/customers/list" },
      { title: "Loyalty & Poin", url: "/customers/loyalty" },
      { title: "Voucher", url: "/customers/voucher" }
    ]
  },
  {
    title: "HR & Absensi",
    url: "/hr",
    icon: UserCheck,
    id: "hr",
    subItems: [
      { title: "Absensi", url: "/hr/attendance" },
      { title: "Pegawai", url: "/hr/employees" },
      { title: "Shift", url: "/hr/shift" }
    ]
  },
  { 
    title: "AI Assistant", 
    url: "/ai", 
    icon: Bot,
    badge: "Beta",
    subItems: [
      { title: "Chat AI", url: "/ai/chat" },
      { title: "Analisis Inventaris", url: "/ai/inventory-analysis" },
      { title: "Analisis Keuangan", url: "/ai/finance-analysis" },
      { title: "Prediksi", url: "/ai/prediction" }
    ]
  },
  { 
    title: "Laporan", 
    url: "/reports", 
    icon: BarChart3,
    id: "reports",
    subItems: [
      { title: "Penjualan", url: "/reports/sales" },
      { title: "Keuangan", url: "/reports/finance" },
      { title: "Inventaris", url: "/reports/inventory" },
      { title: "Karyawan", url: "/reports/employee" }
    ]
  },
]

const settings: MenuItem[] = [
  { title: "Pengguna & Role", url: "/settings/users", icon: UserCheck, id: "settings" },
  { title: "Pengaturan Sistem", url: "/settings/company", icon: Settings, id: "settings" },
  { title: "Audit Log", url: "/monitoring/audit-log", icon: ShieldAlert, id: "settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("erp_user")
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch(e) {}
      }
    }
  }, [])

  const isActive = (url: string) => {
    if (url === "/" && pathname !== "/") return false
    return pathname.startsWith(url)
  }

  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0F172A]">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
          A
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Avario ERP</span>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-4 mb-2 px-2">Core Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.filter(item => {
                if (!item.id || user?.role === 'Owner') return true;
                return user?.accessible_modules?.includes(item.id);
              }).map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      className={`font-medium transition-all duration-200 rounded-md px-3 py-2 h-auto ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                      render={
                        <a href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-4 w-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <span className="text-sm">{item.title}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </a>
                      }
                    />
                    {item.subItems && (
                      <SidebarMenuSub className="border-l-slate-200 dark:border-l-slate-800 ml-5 mt-1 mb-2">
                        {item.subItems.map((subItem) => {
                          const subActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <a href={subItem.url}>
                                <SidebarMenuSubButton 
                                  isActive={subActive}
                                  className={`text-sm py-1.5 h-auto transition-colors rounded-md ${subActive ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-transparent' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/30'}`}
                                >
                                  <span className="w-full flex justify-between items-center">
                                    {subItem.title}
                                    {subItem.badge && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </span>
                                </SidebarMenuSubButton>
                              </a>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 px-2">Pengaturan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {settings.filter(item => {
                if (!item.id || user?.role === 'Owner') return true;
                return user?.accessible_modules?.includes(item.id);
              }).map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      className={`font-medium transition-all duration-200 rounded-md px-3 py-2 h-auto ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                      render={
                        <a href={item.url} className="flex items-center gap-3">
                          <item.icon className={`h-4 w-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.title}</span>
                        </a>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-[#0F172A]">
        <a href="/login" className="flex items-center gap-3 text-slate-500 hover:text-rose-600 font-medium transition-colors" onClick={() => localStorage.removeItem("erp_token")}>
          <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800/80 rounded-md flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
          </div>
          <span className="text-sm">Keluar</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
