"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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
  LayoutDashboard,  Clock, Folder, Link as LinkIcon, History, AlertTriangle, PlayCircle, Filter, Tag, Hash, FileCode, CheckCircle, Database, PackageSearch, PenTool, Wrench, ShieldCheck, LifeBuoy, FileSearch, Zap, TrendingUp, Sparkles, Building2, Fingerprint, Receipt, UserCheck, ShieldAlert, Key, HelpCircle, Share2, Users, Box, Calculator, Settings, 
  ShoppingCart, BarChart3, Bot, LogOut, Hexagon
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
      { title: "Riwayat Transaksi", url: "/finance/history" },
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
      { title: "Daftar Pelanggan", url: "/customers/list" },
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
  { title: "Integrasi API", url: "/settings/integrations", icon: Share2, id: "settings" },
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
    <Sidebar className="border-r border-border bg-sidebar h-full">
      <SidebarHeader className="p-5 flex flex-row items-center gap-3">
        <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-sm">
          <Hexagon className="h-5 w-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">ERP Boostup</span>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-2 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3 px-2">Core Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.filter(item => {
                if (!item.id || user?.role === 'Owner') return true;
                return user?.accessible_modules?.includes(item.id);
              }).map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      className={`font-medium transition-colors duration-200 rounded-lg px-3 py-2.5 h-auto ${active ? 'bg-primary/10 text-primary dark:bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                      render={
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-[18px] w-[18px] ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-[14px] leading-none">{item.title}</span>
                          </div>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      }
                    />
                    {item.subItems && (
                      <SidebarMenuSub className="border-l border-border ml-[1.1rem] mt-1.5 mb-3 pl-3">
                        {item.subItems.map((subItem) => {
                          const subActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <Link href={subItem.url} className="w-full">
                                <SidebarMenuSubButton 
                                  isActive={subActive}
                                  className={`text-[13px] py-1.5 h-auto transition-colors rounded-md ${subActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                                >
                                  <span className="w-full flex justify-between items-center">
                                    {subItem.title}
                                    {subItem.badge && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </span>
                                </SidebarMenuSubButton>
                              </Link>
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
        
        <SidebarGroup className="mt-6 mb-4">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3 px-2">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {settings.filter(item => {
                if (!item.id || user?.role === 'Owner') return true;
                return user?.accessible_modules?.includes(item.id);
              }).map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      className={`font-medium transition-colors duration-200 rounded-lg px-3 py-2.5 h-auto ${active ? 'bg-primary/10 text-primary dark:bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                      render={
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className={`h-[18px] w-[18px] ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-[14px] leading-none">{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border p-4 bg-sidebar">
        <a href="/login" className="flex items-center gap-3 text-muted-foreground hover:text-destructive font-medium transition-colors w-full rounded-lg hover:bg-destructive/10 px-3 py-2" onClick={() => localStorage.removeItem("erp_token")}>
          <LogOut className="h-[18px] w-[18px]" />
          <span className="text-[14px]">Sign Out</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
