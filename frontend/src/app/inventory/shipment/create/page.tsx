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
import { Loader2, ArrowLeft, Plus, Trash2, Truck, Box, Package2, Save, MapPin, UserSquare2 } from "lucide-react";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    warehouseId: "",
    vehicleId: "",
    driverId: "",
    items: [{ productId: "", quantity: 1 }]
  });

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || [])).catch(() => {});
    MasterDataAPI.getVehicles().then((res: any) => setVehicles(res?.data || res || [])).catch(() => {});
    MasterDataAPI.getDrivers().then((res: any) => setDrivers(res?.data || res || [])).catch(() => {});
    InventoryAPI.getStocks().then((res: any) => setStocks(res?.data || res || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await ShipmentAPI.createShipment(form);
      router.push("/inventory/shipment");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const getStockAmount = (productId: string) => {
    if (!productId) return 0;
    const stock = stocks.find(s => s.productId === productId && s.warehouseId === form.warehouseId);
    return stock ? stock.quantity : 0;
  };

  // Get unique products available in the selected warehouse
  const availableProducts = Array.from(new Set(stocks.filter(s => form.warehouseId ? s.warehouseId === form.warehouseId : true).map(s => s.productId)));

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-12 px-4 md:px-6 box-border">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Create Shipment
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new delivery shipment and assign stock items.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900/50 rounded-xl">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipment Items Card */}
            <Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" /> Shipment Items
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                {form.items.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/10">
                    <p className="text-sm text-muted-foreground">No items added to this shipment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.items.map((item, index) => {
                      const avail = getStockAmount(item.productId);
                      return (
                        <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 border border-border/60 bg-muted/5 rounded-lg relative group">
                          <div className="w-full sm:flex-1 space-y-2">
                            <Label className="text-[12px] uppercase text-muted-foreground font-bold tracking-wider">Product Variant</Label>
                            <Select value={item.productId} onValueChange={(val: any) => {
                              const newItems = [...form.items];
                              newItems[index].productId = val || "";
                              setForm({ ...form, items: newItems });
                            }}>
                              <SelectTrigger className="h-10 bg-background font-medium">
                                <SelectValue placeholder="Select timber product..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProducts.length === 0 ? (
                                  <SelectItem value="none" disabled>No stock available</SelectItem>
                                ) : (
                                  availableProducts.map(pid => {
                                    const s = stocks.find(st => st.productId === pid);
                                    const a = getStockAmount(pid);
                                    return <SelectItem key={pid} value={pid}>{s?.product?.name || pid} <span className="text-muted-foreground ml-1">({a} PCS available)</span></SelectItem>;
                                  })
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="w-full sm:w-32 space-y-2">
                            <Label className="text-[12px] uppercase text-muted-foreground font-bold tracking-wider">Qty (PCS)</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              max={avail > 0 ? avail : undefined}
                              className="h-10 bg-background font-semibold"
                              value={item.quantity} 
                              onChange={(e) => {
                                const newItems = [...form.items];
                                newItems[index].quantity = parseInt(e.target.value) || 0;
                                setForm({ ...form, items: newItems });
                              }} 
                            />
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="absolute top-2 right-2 sm:static sm:h-10 sm:w-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => {
                              setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 font-semibold h-11 text-muted-foreground hover:text-foreground"
                  onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1 }] })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Timber Variant
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Delivery Information Card */}
            <Card className="bg-card rounded-xl border border-border shadow-sm">
              <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[12px] uppercase text-muted-foreground font-bold tracking-wider">Source Warehouse</Label>
                  <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "" })}>
                    <SelectTrigger className="h-10 bg-background font-medium border-border/60">
                      <SelectValue placeholder="Select source warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-2 pb-2">
                  <div className="h-px w-full bg-border/50"></div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[12px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Transport Vehicle
                  </Label>
                  <Select value={form.vehicleId} onValueChange={(val: any) => setForm({ ...form, vehicleId: val || "" })}>
                    <SelectTrigger className="h-10 bg-background font-medium border-border/60">
                      <SelectValue placeholder="Select vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.name || v.licensePlate}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[12px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                    <UserSquare2 className="w-3.5 h-3.5" /> Driver
                  </Label>
                  <Select value={form.driverId} onValueChange={(val: any) => setForm({ ...form, driverId: val || "" })}>
                    <SelectTrigger className="h-10 bg-background font-medium border-border/60">
                      <SelectValue placeholder="Select assigned driver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Summary Actions */}
            <Card className="bg-card rounded-xl border border-border shadow-sm">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 font-semibold h-11"
                    disabled={!form.warehouseId || form.items.length === 0 || loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Create Shipment
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 font-medium"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
