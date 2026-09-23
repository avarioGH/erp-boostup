"use client";

import { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, ShipmentAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState({
    warehouseId: "",
    vehicleId: "",
    driverId: "",
    items: [{ productId: "", quantity: 1 }]
  });

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || []));
    MasterDataAPI.getVehicles().then((res: any) => setVehicles(res?.data || res || []));
    MasterDataAPI.getDrivers().then((res: any) => setDrivers(res?.data || res || []));
    InventoryAPI.getStocks().then((res: any) => setStocks(res?.data || res || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await ShipmentAPI.createShipment(form);
      router.push("/inventory/shipment");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create shipment");
    }
  };

  const getStockAmount = (productId: string) => {
    if (!productId) return 0;
    const stock = stocks.find(s => s.productId === productId && s.warehouseId === form.warehouseId);
    return stock ? stock.quantity : 0;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "" })}>
                <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={form.vehicleId} onValueChange={(val: any) => setForm({ ...form, vehicleId: val || "" })}>
                  <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.name || v.licensePlate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select value={form.driverId} onValueChange={(val: any) => setForm({ ...form, driverId: val || "" })}>
                  <SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border p-4 rounded-md space-y-4">
              <h3 className="font-semibold">Items</h3>
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Product (Available)</Label>
                    <Select value={item.productId} onValueChange={(val: any) => {
                      const newItems = [...form.items];
                      newItems[index].productId = val || "";
                      setForm({ ...form, items: newItems });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(stocks.filter(s => form.warehouseId ? s.warehouseId === form.warehouseId : true).map(s => s.productId))).map(pid => {
                          const s = stocks.find(st => st.productId === pid);
                          const avail = getStockAmount(pid);
                          return <SelectItem key={pid} value={pid}>{s?.product?.name || pid} (Stock: {avail})</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min="1" max={getStockAmount(item.productId)} value={item.quantity} onChange={(e) => {
                      const newItems = [...form.items];
                      newItems[index].quantity = parseInt(e.target.value) || 0;
                      setForm({ ...form, items: newItems });
                    }} />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => {
                    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                  }}>X</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1 }] })}>
                Add Item
              </Button>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={!form.warehouseId || form.items.length === 0}>Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
