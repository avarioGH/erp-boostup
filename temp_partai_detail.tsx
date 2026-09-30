"use client";
import React, { useEffect, useState } from "react";
import { PartaiAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";

export default function PartaiDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const { id } = React.use(params as Promise<{ id: string }>);
  const [partai, setPartai] = useState<any>(null);

  useEffect(() => {
    if (id) {
      PartaiAPI.getPartai(id).then((res: any) => {
        setPartai(res);
      }).catch(console.error);
    }
  }, [id]);

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.purchases || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.purchaseNumber || p.code}</TableCell>
                      <TableCell>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell><Badge>{p.status || "DRAFT"}</Badge></TableCell>
                      <TableCell>{(p.items?.length || 0) + (p.logItems?.length || 0)}</TableCell>
                      <TableCell>{p.totalVolumeM3 || 0}</TableCell>
                    </TableRow>
                  ))}
                  {(!partai.purchases || partai.purchases.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada pembelian untuk partai ini.</TableCell></TableRow>
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
              <Button onClick={() => router.push(`/inventory/logs?partaiId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Kelola DUKB
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Log</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead>Panjang (m)</TableHead>
                    <TableHead>Volume (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.rawLogs || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.logNumber}</TableCell>
                      <TableCell>{r.species}</TableCell>
                      <TableCell>{r.purchaseLength}</TableCell>
                      <TableCell>{r.purchaseVolume}</TableCell>
                    </TableRow>
                  ))}
                  {(!partai.rawLogs || partai.rawLogs.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada raw log (DUKB) terdaftar.</TableCell></TableRow>
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
                    <TableHead>Volume Hasil (m³)</TableHead>
                    <TableHead>Sisa Gerowong</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.trimmedLogs || []).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.trimNumber || t.logNumber}</TableCell>
                      <TableCell>{t.rawLog?.logNumber || "-"}</TableCell>
                      <TableCell>{t.volumeM3 || t.trimVolume}</TableCell>
                      <TableCell>{t.gerowongVolume || 0}</TableCell>
                    </TableRow>
                  ))}
                  {(!partai.trimmedLogs || partai.trimmedLogs.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada proses trimming.</TableCell></TableRow>
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
                    <TableHead>Total Pcs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.inputLogs || []).map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.inputNumber}</TableCell>
                      <TableCell>{i.inputDate ? new Date(i.inputDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{i.species}</TableCell>
                      <TableCell>{i.totalPcs}</TableCell>
                    </TableRow>
                  ))}
                  {(!partai.inputLogs || partai.inputLogs.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada input log (WIP).</TableCell></TableRow>
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
                    <TableHead>Total Item</TableHead>
                    <TableHead>Total Volume (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.sawnOutputs || []).map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.outputDate ? new Date(o.outputDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>Shift {o.shift} {o.operatorName ? `(${o.operatorName})` : ""}</TableCell>
                      <TableCell>{o.items?.length || 0}</TableCell>
                      <TableCell>{o.totalVolumeM3 || 0}</TableCell>
                    </TableRow>
                  ))}
                  {(!partai.sawnOutputs || partai.sawnOutputs.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada output sawn timber.</TableCell></TableRow>
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

