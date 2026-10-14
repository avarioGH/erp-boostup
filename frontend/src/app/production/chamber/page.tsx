"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InventoryAPI, TimberAPI, ProductionAPI } from "@/lib/api";
import { 
  ArrowRight, 
  ArrowLeftRight, 
  Search, 
  Loader2, 
  Cuboid, 
  Plus, 
  Flame, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ChamberOperationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [kdProjects, setKdProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPcs: 0, totalM3: 0, inTodayPcs: 0, inTodayM3: 0, outTodayPcs: 0, outTodayM3: 0, totalBatches: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchKd, setSearchKd] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch transfers involving chambers
      const transfersRes = await TimberAPI.getTransfers({ 
        search, 
        fromLocationCodePrefix: "CH-", 
        toLocationCodePrefix: "CH-",
        take: 100
      }).catch(() => ({ items: [] }));
      const items = transfersRes?.items || [];
      setData(items);

      // 2. Fetch KD Production Batches (Project KD)
      const kdRes = await ProductionAPI.getProcesses({
        processType: "KD",
        take: 100,
      }).catch(() => ({ items: [] }));
      const kdList = Array.isArray(kdRes) ? kdRes : kdRes?.items || [];
      setKdProjects(kdList);

      // 3. Fetch total Chamber stock
      const stockRes = await TimberAPI.getTimberStock({ locationCodePrefix: "CH-", take: 1000 });
      const chamberStocks = stockRes.items || [];
      const totalPcs = chamberStocks.reduce((sum: number, s: any) => sum + (s.currentPcs || 0), 0);
      const totalM3 = chamberStocks.reduce((sum: number, s: any) => sum + (s.currentVolumeM3 || 0), 0);

      // 4. Calculate Today's IN/OUT
      const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const todayTransfers = (Array.isArray(items) ? items : []).filter((t: any) => t.transferDate?.startsWith(today) && t.status === "POSTED");
      
      let inPcs = 0, inM3 = 0, outPcs = 0, outM3 = 0;
      todayTransfers.forEach((t: any) => {
        const isToChamber = t.toLocation?.code?.startsWith("CH-");
        const isFromChamber = t.fromLocation?.code?.startsWith("CH-");
        
        t.items?.forEach((ti: any) => {
          if (isToChamber && !isFromChamber) {
            inPcs += ti.quantityPcs || 0;
            inM3 += ti.volumeM3 || 0;
          }
          if (isFromChamber && !isToChamber) {
            outPcs += ti.quantityPcs || 0;
            outM3 += ti.volumeM3 || 0;
          }
        });
      });

      setStats({ 
        totalPcs, 
        totalM3, 
        inTodayPcs: inPcs, 
        inTodayM3: inM3, 
        outTodayPcs: outPcs, 
        outTodayM3: outM3,
        totalBatches: kdList.length 
      });

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getOperationType = (t: any) => {
    const isFromChamber = t.fromLocation?.code?.startsWith("CH-");
    const isToChamber = t.toLocation?.code?.startsWith("CH-");
    if (isToChamber && !isFromChamber) return { label: "CHAMBER IN", color: "bg-emerald-100 text-emerald-800" };
    if (isFromChamber && !isToChamber) return { label: "CHAMBER OUT", color: "bg-amber-100 text-amber-800" };
    return { label: "TRANSFER", color: "bg-muted/50 text-foreground" };
  };

  const filteredKdProjects = kdProjects.filter((p: any) => 
    p.processNo?.toLowerCase().includes(searchKd.toLowerCase()) ||
    p.notes?.toLowerCase().includes(searchKd.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 px-4 md:px-6 max-w-[1400px] mx-auto box-border">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-500" />
            Chamber & Oven (KD)
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kelola Project / Batch pengeringan kayu (KD) dan pergerakan fisik chamber.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => router.push("/production/chamber/create")} 
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> + Add Project / Batch KD
          </Button>
          <Button variant="outline" onClick={() => router.push("/production/chamber/in")}>
            <ArrowRight className="w-4 h-4 mr-1.5" /> Transfer IN
          </Button>
          <Button variant="outline" onClick={() => router.push("/production/chamber/out")}>
            <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Transfer OUT
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Project KD</p>
              <Layers className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">{stats.totalBatches} Batch</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Project transformasi KD</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Chamber Stock</p>
              <Cuboid className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono">{stats.totalPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.totalM3.toFixed(4)} M³ di dalam chamber</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">In Hari Ini</p>
              <ArrowRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono">{stats.inTodayPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.inTodayM3.toFixed(4)} M³ masuk hari ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-semibold text-muted-foreground">Out Hari Ini</p>
              <ArrowLeftRight className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono">{stats.outTodayPcs} PCS</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.outTodayM3.toFixed(4)} M³ keluar hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* TABS MENU: 1. PROJECT / BATCH KD  |  2. RIWAYAT TRANSFER CHAMBER */}
      <Tabs defaultValue="kd-projects" className="space-y-4">
        <TabsList className="grid w-full sm:w-[420px] grid-cols-2">
          <TabsTrigger value="kd-projects" className="font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" /> Project / Batch KD
          </TabsTrigger>
          <TabsTrigger value="transfers" className="font-semibold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Mutasi Fisik Chamber
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DAFTAR PROJECT BATCH KD */}
        <TabsContent value="kd-projects" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-muted/10">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Daftar Project & Batch KD
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Cari No KD / Jasa KD..." 
                      className="pl-9 h-9 text-xs" 
                      value={searchKd}
                      onChange={(e) => setSearchKd(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => router.push("/production/chamber/create")} 
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : filteredKdProjects.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <Flame className="w-10 h-10 mx-auto text-amber-500/40" />
                  <p className="text-muted-foreground text-sm">Belum ada data project KD.</p>
                  <Button 
                    onClick={() => router.push("/production/chamber/create")}
                    variant="outline"
                    className="border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Buat Project / Batch KD Pertama
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[120px]">Tanggal</TableHead>
                        <TableHead className="w-[150px]">No. KD</TableHead>
                        <TableHead className="min-w-[180px]">Jasa KD / Catatan</TableHead>
                        <TableHead className="w-[110px] text-right">Bahan (Pcs)</TableHead>
                        <TableHead className="w-[110px] text-right">Bahan (m³)</TableHead>
                        <TableHead className="w-[110px] text-right">Hasil KD (Pcs)</TableHead>
                        <TableHead className="w-[110px] text-right">Hasil KD (m³)</TableHead>
                        <TableHead className="w-[100px] text-center">Status</TableHead>
                        <TableHead className="w-[80px] text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKdProjects.map((p) => {
                        const inPcs = (p.inputs || []).reduce((sum: number, i: any) => sum + (i.quantityPCS || 0), 0);
                        const outPcs = (p.outputs || []).reduce((sum: number, o: any) => sum + (o.quantityPCS || 0), 0);
                        const isConfirmed = p.status === "CONFIRMED";

                        return (
                          <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-xs whitespace-nowrap">
                              {p.processDate ? format(new Date(p.processDate), "dd MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-xs text-primary">
                              {p.processNo}
                            </TableCell>
                            <TableCell className="text-xs">
                              {p.notes || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-foreground">
                              {inPcs}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-blue-600 font-semibold">
                              {Number(p.inputVolumeM3 || 0).toFixed(4)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-foreground">
                              {outPcs}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-emerald-600 font-bold">
                              {Number(p.outputVolumeM3 || 0).toFixed(4)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={isConfirmed ? "default" : "outline"}
                                className={isConfirmed ? "bg-emerald-600 font-bold text-[11px]" : "text-amber-600 border-amber-500 font-bold text-[11px]"}
                              >
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`/production/chamber/batch/${p.id}`)}
                                className="h-7 px-2 text-xs text-primary hover:text-primary"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Buka
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RIWAYAT MUTASI TRANSFER IN / OUT */}
        <TabsContent value="transfers" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-muted/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold">Riwayat Mutasi Fisik Chamber</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search transfer no..." 
                    className="pl-9 h-9 text-xs" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : data.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">Tidak ada pergerakan transfer fisik chamber.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="p-3 px-4 text-left font-medium">Date</TableHead>
                        <TableHead className="p-3 px-4 text-left font-medium">Operation</TableHead>
                        <TableHead className="p-3 px-4 text-left font-medium">Transfer No</TableHead>
                        <TableHead className="p-3 px-4 text-left font-medium">From Location</TableHead>
                        <TableHead className="p-3 px-4 text-left font-medium">To Location</TableHead>
                        <TableHead className="p-3 px-4 text-right font-medium">Items</TableHead>
                        <TableHead className="p-3 px-4 text-right font-medium">Qty (PCS)</TableHead>
                        <TableHead className="p-3 px-4 text-left font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((t) => {
                        const op = getOperationType(t);
                        const totalQty = t.items?.reduce((s: number, i: any) => s + (i.quantityPcs || 0), 0) || 0;
                        return (
                          <TableRow 
                            key={t.id} 
                            className="hover:bg-muted/30 transition-colors cursor-pointer" 
                            onClick={() => router.push("/production/chamber/" + t.id)}
                          >
                            <TableCell className="p-3 px-4 whitespace-nowrap text-xs">{format(new Date(t.transferDate), "dd MMM yyyy")}</TableCell>
                            <TableCell className="p-3 px-4"><Badge className={op.color} variant="secondary">{op.label}</Badge></TableCell>
                            <TableCell className="p-3 px-4 font-medium text-primary text-xs">{t.transferNumber}</TableCell>
                            <TableCell className="p-3 px-4 text-xs">{t.fromLocation?.name}</TableCell>
                            <TableCell className="p-3 px-4 text-xs">{t.toLocation?.name}</TableCell>
                            <TableCell className="p-3 px-4 text-right text-xs">{t.items?.length || 0}</TableCell>
                            <TableCell className="p-3 px-4 text-right font-medium text-xs">{totalQty}</TableCell>
                            <TableCell className="p-3 px-4">
                              <Badge variant={t.status === "POSTED" ? "default" : t.status === "CANCELLED" ? "destructive" : "outline"}>{t.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
