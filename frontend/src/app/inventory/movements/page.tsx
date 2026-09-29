"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, History } from "lucide-react"

export default function MovementsPage() {
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
   api.get('/inventory/movements')
     .then((res: any) => {
       const items = res.data?.items || res.data || [];
       setData(Array.isArray(items) ? items : []);
     })
     .catch(console.error)
     .finally(() => setLoading(false))
 }, [])

 const getBadgeType = (type: string, movType: string) => {
   if (type === 'POS_SALE' || movType === 'POS_SALE') return <Badge className="bg-emerald-100 text-emerald-800 border-none">Penjualan POS</Badge>
   if (type === 'DELIVERY' || movType === 'DELIVERY') return <Badge className="bg-blue-100 text-blue-800 border-none">Pengiriman Sales</Badge>
   if (type === 'IN' || movType === 'IN') return <Badge className="bg-indigo-100 text-indigo-800 border-none">Ikan Masuk</Badge>
   if (type === 'OUT' || movType === 'OUT') return <Badge className="bg-amber-100 text-amber-800 border-none">Stok Keluar</Badge>
   if (type === 'ADJUSTMENT' || movType === 'ADJUSTMENT_PLUS' || movType === 'ADJUSTMENT_MINUS') return <Badge className="bg-rose-100 text-rose-800 border-none">Penyesuaian Stok</Badge>
   if (type === 'TRANSFER' || movType === 'TRANSFER') return <Badge className="bg-purple-100 text-purple-800 border-none">Transfer Gudang</Badge>
   return <Badge variant="outline">{type || movType}</Badge>
 }

 return (
   <div className="space-y-6 pb-10">
     <div>
       <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Pergerakan Stok</h1>
       <p className="text-muted-foreground">Laporan riwayat keluar masuk stok (Stock Ledger) per produk ikan.</p>
     </div>

     <Card className="shadow-sm">
       <CardHeader className="pb-4 border-b border-border/40">
         <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
           <History className="w-5 h-5 text-primary" /> Riwayat Transaksi Stok
         </CardTitle>
       </CardHeader>
       <CardContent className="p-0">
         {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
         ) : (
           <div className="overflow-x-auto">
             <table className="min-w-[600px] md:min-w-full w-full text-sm">
               <thead className="bg-muted border-b border-border">
                 <tr>
                   <th className="p-4 px-6 text-left font-semibold text-muted-foreground tracking-wide">Tanggal</th>
                   <th className="p-4 px-6 text-left font-semibold text-muted-foreground tracking-wide">Produk Ikan</th>
                   <th className="p-4 px-6 text-left font-semibold text-muted-foreground tracking-wide">Tipe</th>
                   <th className="p-4 px-6 text-center font-semibold text-emerald-600 tracking-wide">Masuk</th>
                   <th className="p-4 px-6 text-center font-semibold text-rose-600 tracking-wide">Keluar</th>
                   <th className="p-4 px-6 text-right font-semibold text-muted-foreground tracking-wide">Saldo</th>
                   <th className="p-4 px-6 text-left font-semibold text-muted-foreground tracking-wide">User</th>
                 </tr>
               </thead>
               <tbody>
                 {data.length === 0 ? (
                   <tr><td colSpan={7} className="text-center p-12 text-muted-foreground">Tidak ada riwayat pergerakan stok.</td></tr>
                 ) : data.map((m, i) => {
                   const qtyIn = m.qty_in || 0;
                   const qtyOut = m.qty_out || 0;
                   const balance = m.balance_after || 0;
                   const productName = m.product?.name || 'Unknown Product';
                   const weight = m.product?.weight ?  (\gr) : '';

                   return (
                     <tr key={m.id || i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                       <td className="p-4 px-6 text-foreground font-medium">{new Date(m.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
                       <td className="p-4 px-6 font-medium text-foreground">{productName}<span className="text-muted-foreground text-xs">{weight}</span></td>
                       <td className="py-3.5 px-6 text-[13px]">{getBadgeType(m.transaction_type, m.movement_type)}</td>
                       <td className="p-4 px-6 text-center font-bold text-emerald-600">
                         {qtyIn > 0 ? +\ : '-'}
                       </td>
                       <td className="p-4 px-6 text-center font-bold text-rose-600">
                         {qtyOut > 0 ? -\ : '-'}
                       </td>
                       <td className="p-4 px-6 text-right font-bold text-foreground text-base">{balance}</td>
                       <td className="p-4 px-6 text-muted-foreground text-xs">{m.created_by?.slice(-5) || '-'}</td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
         )}
       </CardContent>
     </Card>
   </div>
 )
}
