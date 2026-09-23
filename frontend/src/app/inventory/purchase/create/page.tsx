"use client";

import { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, PurchaseAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreatePurchasePage() {
  const router = useRouter();
  const [sources, setSources] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState({
    supplierId: "",
    warehouseId: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0 }]
  });

  useEffect(() => {
    MasterDataAPI.getSources().then((res: any) => setSources(res?.data || res || []));
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || []));
    InventoryAPI.getProducts().then((res: any) => setProducts(res?.data || res || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await PurchaseAPI.createPurchase(form);
      router.push("/inventory/purchase");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create purchase");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier (Timber Source)</Label>
              <Select value={form.supplierId} onValueChange={(val: any) => setForm({ ...form, supplierId: val || "" })}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>
                  {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "" })}>
                <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border p-4 rounded-md space-y-4">
              <h3 className="font-semibold">Items</h3>
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Product / Variant</Label>
                    <Select value={item.productId} onValueChange={(val: any) => {
                      const newItems = [...form.items];
                      newItems[index].productId = val || "";
                      setForm({ ...form, items: newItems });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => {
                      const newItems = [...form.items];
                      newItems[index].quantity = parseInt(e.target.value) || 0;
                      setForm({ ...form, items: newItems });
                    }} />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Unit Price</Label>
                    <Input type="number" min="0" value={item.unitPrice} onChange={(e) => {
                      const newItems = [...form.items];
                      newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                      setForm({ ...form, items: newItems });
                    }} />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => {
                    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                  }}>X</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1, unitPrice: 0 }] })}>
                Add Item
              </Button>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
