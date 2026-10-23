'use client';

import React, { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { InventoryDisposalAPI } from '@/lib/api';
import { ArrowLeft, Printer, CheckCircle2, RotateCcw, Loader2, Edit3, Save, X, Ban } from 'lucide-react';
import { toast } from 'sonner';

export default function DisposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [disposal, setDisposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    InventoryDisposalAPI.getDisposal(id)
      .then((data: any) => {
        setDisposal(data);
        setEditReason(data.reason || '');
        setEditNotes(data.notes || '');
        setEditItems((data.items || []).map((it: any) => ({
          productId: it.product_id || it.productId,
          productName: it.product?.name || 'Produk Ikan',
          productCode: it.product?.code || '',
          quantity: it.qty || it.quantity,
          reason: it.notes || '',
        })));
      })
      .catch((err: any) => {
        console.error(err);
        toast.error('Gagal memuat detail pemusnahan');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm('Setujui pemusnahan ini? Stok ikan akan dipotong dari gudang.')) return;
    try {
      await InventoryDisposalAPI.approveDisposal(id);
      toast.success('Pemusnahan berhasil disetujui & stok telah disesuaikan!');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal menyetujui: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm('Batalkan pengajuan pemusnahan ini?')) return;
    try {
      await InventoryDisposalAPI.cancelDisposal(id);
      toast.success('Pemusnahan berhasil dibatalkan!');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal membatalkan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleReverse = async () => {
    if (!confirm('Reversal (kembalikan stok) pemusnahan ini? Stok ikan yang sudah dimusnahkan akan dimasukkan kembali ke inventori.')) return;
    try {
      await InventoryDisposalAPI.deleteDisposal(id);
      toast.success('Pemusnahan berhasil dikembalikan (Reversed)!');
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal mengembalikan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSaveEdit = async () => {
    if (!editReason.trim()) {
      toast.error('Alasan pemusnahan tidak boleh kosong');
      return;
    }
    setSubmittingEdit(true);
    try {
      await InventoryDisposalAPI.updateDisposal(id, {
        warehouseId: disposal.warehouse_id,
        reason: editReason,
        notes: editNotes,
        items: editItems.map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          reason: it.reason || ''
        }))
      });
      toast.success('Perubahan pemusnahan berhasil disimpan!');
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      toast.error('Gagal mengubah data: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSubmittingEdit(false);
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" /> Cetak
          </Button>

          {/* EDIT BUTTON for PENDING or DRAFT */}
          {(disposal.status === 'PENDING' || disposal.status === 'DRAFT') && !isEditing && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 text-blue-600" /> Edit Data
            </Button>
          )}

          {isEditing && (
            <>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" onClick={handleSaveEdit} disabled={submittingEdit}>
                <Save className="w-4 h-4" /> {submittingEdit ? 'Menyimpan...' : 'Simpan Edit'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-1" /> Batal Edit
              </Button>
            </>
          )}

          {disposal.status === 'PENDING' && !isEditing && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4" /> Setujui
              </Button>
              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5" onClick={handleCancel}>
                <Ban className="w-4 h-4" /> Batalkan
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
                <Badge variant={disposal.status === 'APPROVED' ? 'default' : (disposal.status === 'CANCELLED' ? 'secondary' : 'outline')}>
                  {disposal.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Dibuat Oleh</p>
              <p className="font-semibold mt-0.5">{disposal.creator?.name || 'Staff'}</p>
            </div>
            <div className="col-span-2 sm:col-span-4 border-t pt-3 space-y-2">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Alasan Pemusnahan</Label>
                    <Input 
                      value={editReason} 
                      onChange={e => setEditReason(e.target.value)} 
                      placeholder="Alasan pemusnahan..." 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Catatan Tambahan</Label>
                    <Input 
                      value={editNotes} 
                      onChange={e => setEditNotes(e.target.value)} 
                      placeholder="Catatan..." 
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground uppercase">Alasan & Catatan</p>
                  <p className="text-foreground mt-0.5 font-medium">{disposal.reason || '-'}</p>
                  {disposal.notes && <p className="text-xs text-muted-foreground mt-0.5">{disposal.notes}</p>}
                </>
              )}
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
                <th className="py-3 px-4 text-center">Jumlah (Qty/Kg)</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isEditing ? (
                editItems.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 font-medium">
                      <span>{item.productName}</span>
                      {item.productCode && <span className="text-xs text-muted-foreground block">{item.productCode}</span>}
                    </td>
                    <td className="py-3 px-4 text-center w-36">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="text-center font-bold"
                        value={item.quantity}
                        onChange={e => {
                          const updated = [...editItems];
                          updated[index].quantity = parseFloat(e.target.value) || 0;
                          setEditItems(updated);
                        }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        value={item.reason}
                        placeholder="Keterangan item (hilang, rusak, dll)..."
                        onChange={e => {
                          const updated = [...editItems];
                          updated[index].reason = e.target.value;
                          setEditItems(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                disposal.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-3 px-4 font-medium">
                      {item.product?.name || item.productId || 'Produk Ikan'}
                      {item.product?.code && <span className="text-xs text-muted-foreground block">{item.product.code}</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-destructive">
                      -{item.qty || item.quantity} kg
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
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
