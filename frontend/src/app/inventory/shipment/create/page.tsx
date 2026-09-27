"use client";

import { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, ShipmentAPI, TimberSalesAPI, CRMAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Plus, Trash2, Truck, Box, Save, MapPin, UserSquare2, ShoppingCart } from "lucide-react";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [selectedSO, setSelectedSO] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    shipmentNumber: `SHP-${Date.now()}`,
    shipmentDate: new Date().toISOString().substring(0, 10),
    warehouseId: "",
    vehicleId: "",
    driverId: "",
    customerId: "",
    destinationName: "",
    destinationAddress: "",
    notes: "",
    salesOrderId: "none",
    items: []
  });

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || [])).catch(() => {});
    MasterDataAPI.getVehicles().then((res: any) => setVehicles(res?.data || res || [])).catch(() => {});
    MasterDataAPI.getDrivers().then((res: any) => setDrivers(res?.data || res || [])).catch(() => {});
    CRMAPI.getCustomers().then((res: any) => setCustomers(res?.data || res || [])).catch(() => {});
    TimberSalesAPI.getOrders({ status: 'CONFIRMED' }).then((res: any) => {
      setSalesOrders(res?.data || res || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.warehouseId) {
      InventoryAPI.getTimberStocks({ warehouseId: form.warehouseId }).then((res: any) => {
        setStocks(res || []);
      }).catch(() => {});
    }
  }, [form.warehouseId]);

  useEffect(() => {
    if (form.salesOrderId && form.salesOrderId !== "none") {
      TimberSalesAPI.getOrder(form.salesOrderId).then((res: any) => {
        setSelectedSO(res);
        if (res.customerId && !form.customerId) {
           setForm((f: any) => ({ ...f, customerId: res.customerId }));
        }
      }).catch(() => {});
    } else {
      setSelectedSO(null);
    }
  }, [form.salesOrderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const payload = {
        ...form,
        salesOrderId: form.salesOrderId === "none" ? undefined : form.salesOrderId
      };
      
      // Auto-calculate M3 before submit based on stock variant info
      payload.items = payload.items.map((it: any) => {
         const st = stocks.find(s => s.id === it.stockId);
         if (!st) throw new Error("Invalid stock selected");
         return {
           timberVariantId: st.timberVariantId,
           batch: st.batch,
           quantityPcs: Number(it.quantityPcs),
           volumeM3: st.timberVariant.volumePerPiece * Number(it.quantityPcs),
           salesOrderItemId: it.salesOrderItemId || undefined
         };
      });

      await ShipmentAPI.createShipment(payload);
      router.push("/inventory/shipment");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const getAvailablePcs = (stockId: string) => {
    const s = stocks.find(x => x.id === stockId);
    return s ? s.currentPcs : 0;
  };

  const renderSOItemsInfo = () => {
    if (!selectedSO) return null;
    return (
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2 mt-4 text-sm">
        <h4 className="font-semibold text-primary">Sales Order Needs:</h4>
        <div className="grid gap-2">
          {selectedSO.items.map((soi: any) => {
            const rem = soi.orderQty - soi.realizedQty;
            if (rem <= 0) return null;
            return (
              <div key={soi.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-border">
                <div>
                  <div className="font-medium text-foreground">{soi.timberVariant?.sku || 'Unknown'}</div>
                  <div className="text-muted-foreground text-xs">{soi.thickness}x{soi.width}x{soi.length} {soi.grade}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{rem} PCS Remaining</div>
                  <div className="text-muted-foreground text-xs">Ordered: {soi.orderQty} | Shipped: {soi.realizedQty}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-12 px-4 md:px-6 box-border">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Create Shipment / Fuso Loading
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dispatch timber stocks safely using FIFO or specific batches.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200 rounded-xl">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 <ShoppingCart className="w-4 h-4 text-primary" /> Sales & Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Fulfillment Type (Sales Order)</Label>
                  <Select value={form.salesOrderId} onValueChange={(val: any) => setForm({ ...form, salesOrderId: val, items: [] })}>
                    <SelectTrigger className="h-10 bg-background font-medium">
                      <SelectValue placeholder="Select Sales Order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Direct Shipment (No SO)</SelectItem>
                      {salesOrders.map(so => <SelectItem key={so.id} value={so.id}>{so.orderNumber}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Customer</Label>
                  <Select value={form.customerId} onValueChange={(val: any) => setForm({ ...form, customerId: val || "" })}>
                    <SelectTrigger className="h-10 bg-background font-medium">
                      <SelectValue placeholder="Select Customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {renderSOItemsInfo()}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Destination Name</Label>
                  <Input className="h-10 font-medium" value={form.destinationName} onChange={e => setForm({...form, destinationName: e.target.value})} placeholder="e.g. Gudang Surabaya" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Destination Address</Label>
                  <Input className="h-10 font-medium" value={form.destinationAddress} onChange={e => setForm({...form, destinationAddress: e.target.value})} placeholder="Full address" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> Shipment Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4">
              {!form.warehouseId && (
                <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                  <AlertDescription>Please select a Source Warehouse first to load available stocks.</AlertDescription>
                </Alert>
              )}
              {form.warehouseId && form.items.map((item: any, index: number) => {
                const avail = getAvailablePcs(item.stockId);
                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 border border-border/60 bg-muted/5 rounded-lg relative group">
                    <div className="w-full sm:flex-1 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Stock Batch & Variant</Label>
                      <Select value={item.stockId} onValueChange={(val: any) => {
                        const newItems = [...form.items];
                        newItems[index].stockId = val || "";
                        setForm({ ...form, items: newItems });
                      }}>
                        <SelectTrigger className="h-10 bg-background font-medium">
                          <SelectValue placeholder="Select stock batch..." />
                        </SelectTrigger>
                        <SelectContent>
                          {stocks.map((st: any) => (
                            <SelectItem key={st.id} value={st.id}>
                              [{st.batch}] {st.timberVariant?.sku} - {st.currentPcs} PCS
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {form.salesOrderId !== 'none' && selectedSO && (
                      <div className="w-full sm:w-48 space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">For SO Item</Label>
                        <Select value={item.salesOrderItemId} onValueChange={(val: any) => {
                          const newItems = [...form.items];
                          newItems[index].salesOrderItemId = val || "";
                          setForm({ ...form, items: newItems });
                        }}>
                          <SelectTrigger className="h-10 bg-background font-medium">
                            <SelectValue placeholder="Select SO item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedSO.items.map((soi: any) => (
                              <SelectItem key={soi.id} value={soi.id}>
                                {soi.timberVariant?.sku} (Rem: {soi.orderQty - soi.realizedQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="w-full sm:w-28 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Qty (PCS)</Label>
                      <Input 
                        type="number" min="1" max={avail || undefined}
                        className="h-10 bg-background font-semibold"
                        value={item.quantityPcs || ''} 
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[index].quantityPcs = e.target.value;
                          setForm({ ...form, items: newItems });
                        }} 
                      />
                    </div>
                    
                    <Button 
                      type="button" variant="ghost" size="icon"
                      className="absolute top-2 right-2 sm:static sm:h-10 sm:w-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== index) })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
              
              <Button 
                type="button" variant="outline" 
                className="w-full border-dashed border-2 font-semibold h-11 text-muted-foreground hover:text-foreground mt-4"
                disabled={!form.warehouseId}
                onClick={() => setForm({ ...form, items: [...form.items, { stockId: "", quantityPcs: 1, salesOrderItemId: "" }] })}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Shipment Line
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Shipment Number</Label>
                <Input value={form.shipmentNumber} onChange={e => setForm({...form, shipmentNumber: e.target.value})} className="h-10" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Date</Label>
                <Input type="date" value={form.shipmentDate} onChange={e => setForm({...form, shipmentDate: e.target.value})} className="h-10" required />
              </div>
              
              <div className="h-px w-full bg-border/50 my-2"></div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Source Warehouse</Label>
                <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "", items: [] })}>
                  <SelectTrigger className="h-10 bg-background font-medium">
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Transport Vehicle
                </Label>
                <Select value={form.vehicleId} onValueChange={(val: any) => setForm({ ...form, vehicleId: val || "" })}>
                  <SelectTrigger className="h-10 bg-background font-medium">
                    <SelectValue placeholder="Select vehicle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status).map(v => <SelectItem key={v.id} value={v.id}>{v.name || v.licensePlate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <UserSquare2 className="w-3.5 h-3.5" /> Driver
                </Label>
                <Select value={form.driverId} onValueChange={(val: any) => setForm({ ...form, driverId: val || "" })}>
                  <SelectTrigger className="h-10 bg-background font-medium">
                    <SelectValue placeholder="Select driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Notes</Label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" rows={3} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-semibold h-11" disabled={!form.warehouseId || form.items.length === 0 || loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Create Shipment
                </Button>
                <Button type="button" variant="outline" className="w-full h-11 font-medium" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
