'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { DisposalAPI, InventoryDisposalAPI } from '@/lib/api';
import { Trash2, Plus, Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function DisposalsPage() {
  const [disposals, setDisposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = () => {
    setLoading(true);
    DisposalAPI.list()
      .then((data: any) => {
        setDisposals(Array.isArray(data) ? data : data?.items || []);
      })
      .catch((err: any) => {
        console.error(err);
        toast.error('Gagal memuat data pemusnahan');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Setujui dan proses pemusnahan ini? Stok ikan akan otomatis dikeluarkan dari sistem.')) return;
    try {
      await InventoryDisposalAPI.approveDisposal(id);
      toast.success('Pemusnahan berhasil disetujui & stok telah dipotong!');
      loadData();
    } catch (err: any) {
      toast.error('Gagal menyetujui: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Batalkan pengajuan pemusnahan ini?')) return;
    try {
      await InventoryDisposalAPI.cancelDisposal(id);
      toast.success('Pemusnahan berhasil dibatalkan');
      loadData();
    } catch (err: any) {
      toast.error('Gagal membatalkan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">APPROVED (SELESAI)</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium">PENDING (MENUNGGU PERSETUJUAN)</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="text-muted-foreground">BATAL</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 font-medium">DITOLAK</Badge>;
      case 'REVERSED':
        return <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/20 font-medium">DIKEMBALIKAN (REVERSED)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-destructive" /> Pemusnahan Stok Ikan (Disposal)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pencatatan barang rusak, busuk, mati, atau susut dengan alokasi HPP (FIFO) otomatis.
          </p>
        </div>
        <Button onClick={() => router.push('/inventory/disposals/create')} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Input Pemusnahan Baru
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Riwayat Pemusnahan Stok</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="py-3 px-4">Nomor / Tanggal</th>
                    <th className="py-3 px-4">Gudang</th>
                    <th className="py-3 px-4">Alasan Pemusnahan</th>
                    <th className="py-3 px-4">Rincian Ikan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {disposals.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{d.disposal_number || d.id.slice(-6)}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.disposal_date ? new Date(d.disposal_date).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {d.warehouse?.name || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {d.reason || d.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.items && d.items.length > 0 ? (
                          <div className="flex flex-col gap-1.5 max-w-[280px]">
                            {d.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex flex-col p-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs">
                                <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between gap-2">
                                  <span>{it.product?.name || 'Ikan'}</span>
                                  <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                                    {it.qty || it.quantity} kg
                                  </span>
                                </div>
                                {it.notes && (
                                  <span className="text-[11px] text-muted-foreground italic mt-0.5">
                                    Ket: {it.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(d.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {d.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                                onClick={(e) => handleApprove(d.id, e)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs"
                                onClick={(e) => handleCancel(d.id, e)}
                              >
                                Batalkan
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => router.push(`/inventory/disposals/${d.id}`)}
                          >
                            Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {disposals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        Belum ada riwayat pemusnahan stok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
