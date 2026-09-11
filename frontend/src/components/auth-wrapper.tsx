"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
 const pathname = usePathname()
 const router = useRouter()
 const [mounted, setMounted] = useState(false)
 const [isAuthenticated, setIsAuthenticated] = useState(false)

 useEffect(() => {
 setMounted(true)
 const token = localStorage.getItem("erp_token")
 
 if (token) {
 setIsAuthenticated(true)
 if (pathname === "/login") {
 router.push("/")
 }
 } else {
 setIsAuthenticated(false)
 if (pathname !== "/login") {
 router.push("/login")
 }
 }
 }, [pathname, router])

 if (!mounted) return null

 // Jika halaman login, jangan tampilkan Sidebar dan Header
 if (pathname === "/login") {
 return <main className="flex-1">{children}</main>
 }

 // Jika belum login dan bukan di halaman login, jangan render children (sedang redirect)
 if (!isAuthenticated) return null

 return (
 <SidebarProvider>
 <AppSidebar />
 <div className="flex min-h-svh flex-1 flex-col overflow-hidden">
 <AppHeader />
 <main className="flex-1 overflow-auto bg-background p-6 md:p-8">
 <div className="mx-auto max-w-7xl">
 {children}
 </div>
 </main>
 </div>
 </SidebarProvider>
 )
}
