"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InventoryAPI } from "@/lib/api";
import { Plus, ArrowRight, ArrowLeftRight, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ChamberOperationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const warehouses = await InventoryAPI.getWarehouses();
      const chamberIds = warehouses.filter((w: any) => w.code.startsWith('CH-')).map((w: any) => w.id);
      
      const transfers = await InventoryAPI.getTransfers({ search });
      
      // Filter locally for now to ensure we capture both IN and OUT easily
      const chamberTransfers = transfers.items?.filter((t: any) => 
        chamberIds.includes(t.fromLocationId) || chamberIds.includes(t.toLocationId)
      ) || [];
      
      setData(chamberTransfers);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getOperationType = (t: any) => {
    const isFromChamber = t.fromLocation?.code?.startsWith('CH-');
    const isToChamber = t.toLocation?.code?.startsWith('CH-');
    if (isToChamber && !isFromChamber) return { label: 'CHAMBER IN', color: 'bg-emerald-100 text-emerald-800' };
    if (isFromChamber && !isToChamber) return { label: 'CHAMBER OUT', color: 'bg-amber-100 text-amber-800' };
    return { label: 'TRANSFER', color: 'bg-slate-100 text-slate-800' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chamber Operations</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage timber drying and kiln chamber physical movements.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/production/chamber/in')} className="bg-emerald-600 hover:bg-emerald-700">
            <ArrowRight className="w-4 h-4 mr-2" /> Chamber IN
          </Button>
          <Button onClick={() => router.push('/production/chamber/out')} className="bg-amber-600 hover:bg-amber-700 text-white">
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Chamber OUT
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transfer no..." 
                className="pl-9 h-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">No chamber operations found.</div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 px-4 text-left font-medium">Date</th>
                    <th className="p-3 px-4 text-left font-medium">Operation</th>
                    <th className="p-3 px-4 text-left font-medium">Transfer No</th>
                    <th className="p-3 px-4 text-left font-medium">From Location</th>
                    <th className="p-3 px-4 text-left font-medium">To Chamber / Location</th>
                    <th className="p-3 px-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t) => {
                    const op = getOperationType(t);
                    return (
                      <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push('/inventory/transfers/' + t.id)}>
                        <td className="p-3 px-4 whitespace-nowrap">{format(new Date(t.transferDate), 'dd MMM yyyy')}</td>
                        <td className="p-3 px-4"><Badge className={op.color} variant="secondary">{op.label}</Badge></td>
                        <td className="p-3 px-4 font-medium text-primary">{t.transferNumber}</td>
                        <td className="p-3 px-4">{t.fromLocation?.name}</td>
                        <td className="p-3 px-4">{t.toLocation?.name}</td>
                        <td className="p-3 px-4">
                          <Badge variant={t.status === 'POSTED' ? 'default' : t.status === 'CANCELLED' ? 'destructive' : 'outline'}>{t.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
