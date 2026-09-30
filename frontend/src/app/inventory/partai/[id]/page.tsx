"use client";
import React, { useEffect, useState } from "react";
import { PartaiAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/partai')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Partai: {partai.code}</h1>
            <p className="text-sm text-gray-400">{partai.name || "Tanpa Nama"}</p>
          </div>
        </div>
        <Badge>{partai.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PURCHASE LOGS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>1. Purchase & Raw Logs</CardTitle>
            <Button size="sm" onClick={() => router.push(`/inventory/purchase/create?partaiId=${id}`)}>
              <Plus className="w-3 h-3 mr-1" /> Add Purchase
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partai.purchases || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.purchaseNumber || p.code}</TableCell>
                    <TableCell>{p.supplierId || "-"}</TableCell>
                    <TableCell>{p.items?.length || p.logItems?.length || 0}</TableCell>
                  </TableRow>
                ))}
                {(!partai.purchases || partai.purchases.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Belum ada pembelian untuk partai ini.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* TRIMMING */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>2. Trimming</CardTitle>
            <Button size="sm" onClick={() => router.push(`/inventory/trimming?partaiId=${id}`)}>
              <Plus className="w-3 h-3 mr-1" /> Trim Logs
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trim Number</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partai.trimmedLogs || []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.trimNumber || t.logNumber}</TableCell>
                    <TableCell>{t.volumeM3 || t.trimVolume}</TableCell>
                  </TableRow>
                ))}
                {(!partai.trimmedLogs || partai.trimmedLogs.length === 0) && (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-500">Belum ada proses trimming.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* INPUT LOGS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>3. Input Logs (Sawmill WIP)</CardTitle>
            <Button size="sm" onClick={() => router.push(`/inventory/input-logs/create?partaiId=${id}`)}>
              <Plus className="w-3 h-3 mr-1" /> Add Input Log
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Input</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Total Pcs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partai.inputLogs || []).map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.inputNumber}</TableCell>
                    <TableCell>{i.species}</TableCell>
                    <TableCell>{i.totalPcs}</TableCell>
                  </TableRow>
                ))}
                {(!partai.inputLogs || partai.inputLogs.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Belum ada input log.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SAWN TIMBER OUTPUT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>4. Sawn Timber Output</CardTitle>
            <Button size="sm" onClick={() => router.push(`/inventory/sawn-timber/output/create?partaiId=${id}`)}>
              <Plus className="w-3 h-3 mr-1" /> Add Output
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partai.sawnOutputs || []).map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell>{new Date(o.outputDate).toLocaleDateString()}</TableCell>
                    <TableCell>{o.items?.[0]?.grade || "-"}</TableCell>
                    <TableCell>{o.totalVolumeM3 || 0}</TableCell>
                  </TableRow>
                ))}
                {(!partai.sawnOutputs || partai.sawnOutputs.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Belum ada output sawn timber.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
