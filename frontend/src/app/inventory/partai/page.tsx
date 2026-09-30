"use client";
import React, { useEffect, useState } from "react";
import { PartaiAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function PartaiListPage() {
  const router = useRouter();
  const [partais, setPartais] = useState([]);
  
  useEffect(() => {
    PartaiAPI.getPartais().then((res: any) => {
      setPartais(res || []);
    });
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Partai (Project)</h1>
          <p className="text-sm text-gray-400">Kelola siklus produksi berdasarkan Partai/Project</p>
        </div>
        <Button onClick={() => router.push('/inventory/partai/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Partai Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Partai</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Partai</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partais.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.code}</TableCell>
                  <TableCell>{p.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(p.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/partai/${p.id}`)}>Detail</Button>
                  </TableCell>
                </TableRow>
              ))}
              {partais.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Belum ada partai.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
