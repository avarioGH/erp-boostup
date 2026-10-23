"use client"
import { api } from "@/lib/api"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Activity, ShieldCheck, User } from "lucide-react"

export default function LoginPage() {
  const [loginType, setLoginType] = useState<"owner" | "staff">("owner")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await api.post("/auth/login", { username, password })
      const data = res.data

      if (res.status !== 200 && res.status !== 201) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("erp_token", data.access_token)
      localStorage.setItem("erp_user", JSON.stringify(data.user))

      // Arahkan ke dashboard
      window.location.href = "/"
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Gagal masuk. Periksa kembali username dan password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto bg-primary h-12 w-12 rounded-xl flex items-center justify-center mb-2 shadow-sm">
            <Activity className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tatalora Fish ERP</h1>
          <p className="text-sm text-muted-foreground">
            SaaS Solusi Manajemen Perikanan & Cold Storage
          </p>
        </div>

        <Card className="border shadow-md">
          {/* Tab Selector: Masuk Owner / Masuk Akun Pegawai (Admin) */}
          <div className="grid grid-cols-2 p-1.5 m-3 mb-0 bg-muted rounded-lg border">
            <button
              type="button"
              onClick={() => { setLoginType("owner"); setError(""); }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                loginType === "owner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Akun Owner
            </button>
            <button
              type="button"
              onClick={() => { setLoginType("staff"); setError(""); }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                loginType === "staff"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Masuk Pegawai / Admin
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-lg">
                {loginType === "owner" ? "Login Owner Bisnis" : "Login Akun Pegawai (Admin)"}
              </CardTitle>
              <CardDescription className="text-xs">
                {loginType === "owner"
                  ? "Akses penuh ke seluruh kontrol gudang, keuangan, & manajemen staf."
                  : "Akses terbatas sesuai hak modul (inventori/kasir) yang diberikan Owner."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20 font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold">
                  {loginType === "owner" ? "Username Owner" : "Username Pegawai / Admin"}
                </Label>
                <Input
                  id="username"
                  placeholder={loginType === "owner" ? "e.g. ikan" : "e.g. staf_gudang"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-card font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Lupa password?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-card"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-5">
              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? "Memproses..." : loginType === "owner" ? "Masuk Sebagai Owner" : "Masuk dengan Akun Pegawai"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="px-8 text-center text-xs text-muted-foreground">
          Tatalora Fish ERP Multi-Tenant SaaS Cloud Platform
        </p>
      </div>
    </div>
  )
}
