"use client";

import { useEffect, useState } from "react";
import { ShipmentAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Truck, ArrowRight, Search, FileBox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function ShipmentListPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    ShipmentAPI.getShipments()
      .then((res: any) => {
        setShipments(res?.data || res || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = shipments.filter(s => 
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.warehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.vehicle?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-8 px-4 md:px-6 box-border">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Timber Shipments
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage outgoing deliveries and track shipment statuses.
          </p>
        </div>
        <Link href="/inventory/shipment/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-semibold h-10">
            <Plus className="w-4 h-4 mr-2" /> Create Shipment
          </Button>
        </Link>
      </div>

      <Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileBox className="w-4 h-4 text-primary" /> Delivery Records
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
              <Input 
                type="search" 
                placeholder="Search Code, Warehouse, or Vehicle..." 
                className="pl-9 bg-background h-10" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center">
              <Truck className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-base font-semibold text-foreground mb-1">No shipments found</h3>
              <p className="text-[13.5px] text-muted-foreground max-w-sm mb-6">Belum ada data pengiriman atau tidak ada yang cocok dengan pencarian Anda.</p>
              <Link href="/inventory/shipment/create">
                <Button variant="outline" className="font-semibold"><Plus className="w-4 h-4 mr-2" /> Buat Pengiriman Baru</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto w-full sm:max-w-none">
              <table className="min-w-[800px] md:min-w-full w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-4 px-6 text-left font-semibold text-muted-foreground h-11">Shipment Code</th>
                    <th className="p-4 px-6 text-left font-semibold text-muted-foreground h-11">Warehouse</th>
                    <th className="p-4 px-6 text-left font-semibold text-muted-foreground h-11">Vehicle / Driver</th>
                    <th className="p-4 px-6 text-center font-semibold text-muted-foreground h-11">Status</th>
                    <th className="p-4 px-6 text-center font-semibold text-muted-foreground h-11">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-6 font-semibold text-foreground/90">{s.code || "-"}</td>
                      <td className="py-3 px-6 font-medium text-muted-foreground">{s.warehouse?.name || s.warehouseId || "-"}</td>
                      <td className="py-3 px-6">
                        <div className="font-semibold text-foreground/80">{s.vehicle?.name || s.vehicle?.licensePlate || s.vehicleId || "-"}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">{s.driver?.name || s.driverId || "-"}</div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <Badge variant={s.status === 'CONFIRMED' ? 'default' : s.status === 'CANCELLED' ? 'destructive' : 'secondary'} className={s.status === 'CONFIRMED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                          {s.status || 'DRAFT'}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/inventory/shipment/${s.id}`)}
                          className="h-8 px-3 text-[12px] font-semibold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          View Detail <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
