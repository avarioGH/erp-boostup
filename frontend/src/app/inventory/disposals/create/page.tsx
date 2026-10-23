'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { InventoryAPI, InventoryDisposalAPI } from '@/lib/api';
import { Trash2, Plus, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateDisposalPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState('Pemusnahan Ikan Rusak / Mati');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; reason: string }[]>([
    { productId: '', quantity: 1, reason: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      InventoryAPI.getWarehouses(),
      InventoryAPI.getProducts()
    ])
      .then(([whs, prods]) => {
        const whList = Array.isArray(whs) ? whs : whs?.data || [];
        setWarehouses(whList);
        setProducts(Array.isArray(prods) ? prods : prods?.data || []);

        const activeWarehouseJSON = localStorage.getItem("active_warehouse");
        if (activeWarehouseJSON && activeWarehouseJSON !== "null" && activeWarehouseJSON !== "undefined") {
          try {
            const activeWh = JSON.parse(activeWarehouseJSON);
            if (activeWh && activeWh.id) {
              setWarehouseId(activeWh.id);
            }
          } catch(e) {}
        } else if (whList.length > 0) {
          setWarehouseId(whList[0].id || whList[0]._id);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Gagal mengambil data master');
      });
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, reason: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error('Silakan pilih lokasi gudang!');
      return;
    }
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Silakan pilih minimal 1 produk ikan dengan jumlah valid!');
      return;
    }

    setLoading(true);
    try {
      // 1. Create disposal draft
      const res = await InventoryDisposalAPI.createDisposal({
        warehouseId,
        reason,
        notes,
        items: validItems
      });

      // 2. Submit for approval directly
      const createdId = res?.id || res?.data?.id;
      if (createdId) {
        await InventoryDisposalAPI.submitDisposal(createdId);
      }

      toast.success('Pengajuan pemusnahan berhasil dibuat (Status: PENDING)');
      router.push('/inventory/disposals');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal membuat pemusnahan: ' + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/inventory/disposals')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Input Pemusnahan Stok</h1>
          <p className="text-muted-foreground text-sm">Formulir pengeluaran stok ikan yang rusak/mati.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Formulir Pemusnahan (Disposal)</CardTitle>
          <CardDescription>
            Setelah disimpan, pemusnahan dapat disetujui untuk langsung memotong stok fisik dan menghitung HPP FIFO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Lokasi Gudang <span className="text-destructive">*</span></Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                >
                  <option value="">Pilih Gudang...</option>
                  {warehouses.map((w) => (
                    <option key={w.id || w._id} value={w.id || w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Alasan Pemusnahan <span className="text-destructive">*</span></Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Misal: Ikan Busuk / Mati / Susut"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Catatan / Keterangan Tambahan</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan bila ada..."
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Daftar Ikan yang Dimusnahkan</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Tambah Ikan
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-center bg-muted/30 p-2.5 rounded-lg border border-border">
                  <div className="flex-1 w-full">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      value={item.productId}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].productId = e.target.value;
                        setItems(newItems);
                      }}
                      required
                    >
                      <option value="">-- Pilih Produk Ikan --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.weight ? `(${p.weight}gr)` : ''} - {p.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Jumlah"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = parseFloat(e.target.value) || 0;
                        setItems(newItems);
                      }}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <Input
                      type="text"
                      placeholder="Keterangan per item"
                      value={item.reason}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].reason = e.target.value;
                        setItems(newItems);
                      }}
                      className="h-9 text-xs"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2 p-3 text-xs text-blue-600 bg-blue-50/60 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Biaya HPP (FIFO Cost) akan otomatis dialokasikan ke kerugian inventori saat pemusnahan disetujui (Approved).
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/inventory/disposals')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan & Ajukan Pemusnahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
