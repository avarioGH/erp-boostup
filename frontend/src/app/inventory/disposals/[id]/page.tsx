'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { InventoryDisposalAPI } from '@/lib/api';
import { ArrowLeft, Printer, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DisposalDetailPage({ params }: { params: { id: string } }) {
  const [disposal, setDisposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDetail = () => {
    setLoading(true);
    InventoryDisposalAPI.getDisposal(params.id)
      .then((data: any) => setDisposal(data))
      .catch((err: any) => {
        console.error(err);
        toast.error('Gagal memuat detail pemusnahan');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const handleApprove = async () => {
    if (!confirm('Setujui pemusnahan ini? Stok ikan akan dipotong dari gudang.')) return;
    try {
      await InventoryDisposalAPI.approveDisposal(params.id);
      toast.success('Pemusnahan berhasil disetujui!');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal menyetujui: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Batalkan pengajuan pemusnahan ini?')) return;
    try {
      await InventoryDisposalAPI.cancelDisposal(params.id);
      toast.success('Pemusnahan berhasil dibatalkan');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal membatalkan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleReverse = async () => {
    if (!confirm('Reversal (kembalikan stok) pemusnahan ini? Stok ikan yang sudah dimusnahkan akan dimasukkan kembali ke inventori.')) return;
    try {
      await InventoryDisposalAPI.deleteDisposal(params.id);
      toast.success('Pemusnahan berhasil dikembalikan (Reversed)!');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal mengembalikan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground"><Loader2 className="animate-spin w-8 h-8 mx-auto mb-2" /> Memuat detail...</div>;
  if (!disposal) return <div className="p-8 text-center text-muted-foreground">Data pemusnahan tidak ditemukan.</div>;

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-4xl space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, nav, .sidebar { display: none !important; }
          .no-print { display: none !important; }
        }
      `}} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/inventory/disposals')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Detail Pemusnahan #{disposal.disposal_number || disposal.id.slice(-6)}
            </h1>
            <p className="text-muted-foreground text-sm">Dokumen Berita Acara Pemusnahan Inventori</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" /> Cetak
          </Button>
          {disposal.status === 'PENDING' && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4" /> Setujui
              </Button>
              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleCancel}>
                Batalkan
              </Button>
            </>
          )}
          {disposal.status === 'APPROVED' && (
            <Button variant="destructive" size="sm" onClick={handleReverse} className="gap-1.5">
              <RotateCcw className="w-4 h-4" /> Reversal (Kembalikan Stok)
            </Button>
          )}
        </div>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Informasi Pemusnahan</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Tanggal</p>
              <p className="font-semibold mt-0.5">
                {disposal.disposal_date ? new Date(disposal.disposal_date).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Gudang</p>
              <p className="font-semibold mt-0.5">{disposal.warehouse?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Status</p>
              <div className="mt-0.5">
                <Badge variant={disposal.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {disposal.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Dibuat Oleh</p>
              <p className="font-semibold mt-0.5">{disposal.creator?.name || 'Staff'}</p>
            </div>
            <div className="col-span-2 sm:col-span-4 border-t pt-3">
              <p className="text-xs text-muted-foreground uppercase">Alasan & Catatan</p>
              <p className="text-foreground mt-0.5">{disposal.reason || disposal.notes || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Daftar Barang Dimusnahkan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Nama Produk Ikan</th>
                <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {disposal.items?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="py-3 px-4 font-medium">
                    {item.product?.name || item.productId || 'Produk Ikan'}
                    {item.product?.code && <span className="text-xs text-muted-foreground block">{item.product.code}</span>}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-destructive">
                    -{item.qty || item.quantity}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {item.notes || '-'}
                  </td>
                </tr>
              ))}
              {!disposal.items?.length && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada item</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
