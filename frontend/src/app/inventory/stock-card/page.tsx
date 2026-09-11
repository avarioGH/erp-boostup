'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StockCardSelection() {
  const router = useRouter();
  const [variantId, setVariantId] = useState('');
  const [locationId, setLocationId] = useState('');

  const handleView = () => {
    if (variantId && locationId) {
      router.push(`/inventory/timber-stock/${variantId}/${locationId}/card`);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Card Report</h1>
      </div>
      
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Select Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Timber Product (SKU / Variant)</label>
            <Select onValueChange={(v: any) => setVariantId((v as string) || "")}>
              <SelectTrigger><SelectValue placeholder="Select Product..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Meranti 4x20x400</SelectItem>
                <SelectItem value="v2">Kamper 5x10x200</SelectItem>
                <SelectItem value="v3">Bengkirai 3x15x300</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Location / Warehouse</label>
            <Select onValueChange={(v: any) => setLocationId((v as string) || "")}>
              <SelectTrigger><SelectValue placeholder="Select Location..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="loc1">Gudang Utama (A)</SelectItem>
                <SelectItem value="loc2">Gudang Log (B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleView} disabled={!variantId || !locationId} className="w-full">
            View Stock Card
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


