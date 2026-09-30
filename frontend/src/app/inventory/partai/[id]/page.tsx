"use client";
import React, { useEffect, useState } from "react";
import { PartaiAPI, TimberAPI, PurchaseAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Eye, Edit, Trash2, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function PartaiDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = React.use(params as Promise<{ id: string }>);
  const [partai, setPartai] = useState<any>(null);

  const fetchPartai = () => {
    if (id) {
      PartaiAPI.getPartai(id).then((res: any) => {
        setPartai(res);
      }).catch(console.error);
    }
  };

  useEffect(() => {
    fetchPartai();
  }, [id]);

  
  const handleConfirmPurchase = async (purchaseId: string) => {
    try {
      await PurchaseAPI.confirmPurchase(purchaseId);
      toast({ title: "Success", description: "Purchase confirmed." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to confirm", variant: "destructive" });
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await PurchaseAPI.deletePurchase(purchaseId);
      toast({ title: "Success", description: "Purchase deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      await TimberAPI.deleteLog(logId);
      toast({ title: "Success", description: "Log deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteTrim = async (trimId: string) => {
    if (!confirm("Are you sure you want to delete this trim record?")) return;
    try {
      await TimberAPI.deleteTrimmingLog(trimId);
      toast({ title: "Success", description: "Trim deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteInput = async (inputId: string) => {
    if (!confirm("Are you sure you want to delete this input log?")) return;
    try {
      await TimberAPI.deleteInputLog(inputId);
      toast({ title: "Success", description: "Input log deleted." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    if (!confirm("Are you sure you want to delete this output?")) return;
    try {
      await TimberAPI.cancelSawnOutput(outputId);
      toast({ title: "Success", description: "Output deleted/cancelled." });
      fetchPartai();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  if (!partai) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/partai')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Partai: {partai.code}</h1>
            <p className="text-sm text-muted-foreground">{partai.name || "Tanpa Nama"}</p>
          </div>
        </div>
        <Badge variant={partai.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {partai.status}
        </Badge>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 mb-6">
          <TabsTrigger value="purchase">1. Purchase</TabsTrigger>
          <TabsTrigger value="rawlogs">2. DUKB (Raw Logs)</TabsTrigger>
          <TabsTrigger value="trimming">3. Trimming</TabsTrigger>
          <TabsTrigger value="input">4. Input (WIP)</TabsTrigger>
          <TabsTrigger value="output">5. Output (Sawn Timber)</TabsTrigger>
        </TabsList>

        {/* 1. PURCHASE LOGS */}
        <TabsContent value="purchase">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purchase Log / Sawn Timber</CardTitle>
                <CardDescription>Data pembelian awal bahan baku yang masuk ke partai ini.</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/purchase/create?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Add Purchase
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pembelian</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Item</TableHead>
                    <TableHead>Total Volume (m³)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.purchases || []).map((p: any) => (
                    <TableRow key={p.id} className="group hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/inventory/purchase/${p.id}`)}>
                      <TableCell className="font-medium">{p.purchaseNumber || p.code}</TableCell>
                      <TableCell>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={p.status === 'CONFIRMED' ? 'text-emerald-500 border-emerald-500 bg-emerald-500/10' : 'text-muted-foreground'}>{p.status || "DRAFT"}</Badge></TableCell>
                      <TableCell>{(p.items?.length || 0) + (p.logItems?.length || 0)}</TableCell>
                      <TableCell>{p.totalVolumeM3 || 0}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 ">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View" onClick={(e) => { e.stopPropagation(); router.push(`/inventory/purchase/${p.id}`) }}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit" onClick={(e) => { e.stopPropagation(); router.push(`/inventory/purchase/${p.id}/edit`) }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeletePurchase(p.id) }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!partai.purchases || partai.purchases.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada pembelian untuk partai ini.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DUKB (RAW LOGS) */}
        <TabsContent value="rawlogs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Ukur Kayu Bulat (DUKB)</CardTitle>
                <CardDescription>Daftar log mentah yang terdaftar dalam partai ini.</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/logs/create?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Tambah DUKB (Terima)
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Log</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead className="text-right">Panjang (m)</TableHead>
                    <TableHead className="text-right">Volume (m³)</TableHead>
                    <TableHead className="text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.rawLogs || []).map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/inventory/logs/${r.id}`)}>
                      <TableCell className="font-medium">{r.logNumber}</TableCell>
                      <TableCell>{r.species}</TableCell>
                      <TableCell className="text-right">{r.purchaseLength}</TableCell>
                      <TableCell className="text-right font-bold text-foreground/90">{r.purchaseVolume}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inventory/logs/${r.id}`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/inventory/logs/${r.id}/edit`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteLog(r.id) }} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!partai.rawLogs || partai.rawLogs.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada raw log (DUKB) terdaftar.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TRIMMING */}
        <TabsContent value="trimming">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trimming</CardTitle>
                <CardDescription>Proses pemotongan log (pangkal/ujung) sebelum masuk sawmill.</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/trimming?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Trim Logs
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Trim</TableHead>
                    <TableHead>No. Log Asal</TableHead>
                    <TableHead className="text-right">Volume Hasil (m³)</TableHead>
                    <TableHead className="text-right">Sisa Gerowong</TableHead>
                    <TableHead className="text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.trimmedLogs || []).map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/inventory/trimming/${t.id}`)}>
                      <TableCell className="font-medium">{t.trimNumber || t.logNumber}</TableCell>
                      <TableCell className="text-primary font-medium">{t.rawLog?.logNumber || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-foreground/90">{t.volumeM3 || t.trimVolume || 0}</TableCell>
                      <TableCell className="text-right">{t.gerowongVolume || 0}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inventory/trimming/${t.id}`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/inventory/trimming/${t.id}/edit`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTrim(t.id) }} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!partai.trimmedLogs || partai.trimmedLogs.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada proses trimming.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. INPUT LOGS */}
        <TabsContent value="input">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Input Logs (Sawmill WIP)</CardTitle>
                <CardDescription>Log yang siap untuk dimasukkan ke mesin gergaji (produksi).</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/input-logs/create?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Add Input Log
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Input</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead className="text-right">Total Pcs</TableHead>
                    <TableHead className="text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.inputLogs || []).map((i: any) => (
                    <TableRow key={i.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/inventory/input-logs/${i.id}`)}>
                      <TableCell className="font-medium">{i.inputNumber}</TableCell>
                      <TableCell>{i.inputDate ? new Date(i.inputDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell>{i.species}</TableCell>
                      <TableCell className="text-right">{i.totalPcs}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inventory/input-logs/${i.id}`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/inventory/input-logs/${i.id}/edit`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteInput(i.id) }} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!partai.inputLogs || partai.inputLogs.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada input log (WIP).</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. SAWN TIMBER OUTPUT */}
        <TabsContent value="output">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sawn Timber Output</CardTitle>
                <CardDescription>Hasil akhir gergajian (sawn timber) dari partai ini.</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/sawn-timber/output/create?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Add Output
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Output</TableHead>
                    <TableHead>Shift / Operator</TableHead>
                    <TableHead className="text-right">Total Item</TableHead>
                    <TableHead className="text-right">Total Volume (m³)</TableHead>
                    <TableHead className="text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.sawnOutputs || []).map((o: any) => (
                    <TableRow key={o.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/inventory/sawn-timber/output/${o.id}`)}>
                      <TableCell className="font-medium">{o.outputDate ? new Date(o.outputDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell>Shift {o.shift} {o.operatorName ? `(${o.operatorName})` : ""}</TableCell>
                      <TableCell className="text-right">{o.items?.length || 0}</TableCell>
                      <TableCell className="text-right font-bold text-foreground/90">{o.totalVolumeM3 || 0}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inventory/sawn-timber/output/${o.id}`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteOutput(o.id) }} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Output</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!partai.sawnOutputs || partai.sawnOutputs.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada output sawn timber.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
