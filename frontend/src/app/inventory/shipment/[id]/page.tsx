"use client";

import { useEffect, useState } from "react";
import { ShipmentAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Loader2, CheckCircle2, XCircle, Truck, MapPin, UserSquare2, Package2, CalendarClock , Printer } from "lucide-react";

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = () => {
    setLoading(true);
    ShipmentAPI.getShipment(params.id).then((res: any) => {
      setShipment(res?.data || res);
      setLoading(false);
    }).catch((err: any) => {
      setError("Failed to load shipment data");
      setLoading(false);
    });
  };

  const handleConfirm = async () => {
    if (!confirm("Are you sure you want to confirm this shipment?")) return;
    setError("");
    try {
      await ShipmentAPI.confirmShipment(params.id);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Confirmation failed");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    setError("");
    try {
      await ShipmentAPI.cancelShipment(params.id);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Cancellation failed");
    }
  };

  if (loading) {
    return <div className="p-8 md:p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!shipment && error) {
    return (
      <div className="p-8 md:p-24 flex flex-col items-center justify-center text-center animate-in fade-in">
        <Truck className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Shipment Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-6 text-[15px]">Data pengiriman tidak ditemukan atau terjadi kesalahan server.</p>
        <Button onClick={() => router.push('/inventory/shipment')} variant="outline" className="h-10 px-6 font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shipments
        </Button>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-12 px-4 md:px-6 box-border">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/shipment')} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {shipment.code || "Shipment Detail"}
              </h1>
              <Badge 
                variant={shipment.status === 'CONFIRMED' ? 'default' : shipment.status === 'CANCELLED' ? 'destructive' : 'secondary'} 
                className={`text-[11px] font-bold tracking-wider uppercase ${shipment.status === 'CONFIRMED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                {shipment.status || 'DRAFT'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <CalendarClock className="w-4 h-4" /> 
              {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto gap-2">
            <Button variant="outline" onClick={() => window.open(`/inventory/shipment/${params.id}/print`, "_blank")} className="w-full sm:w-auto shadow-sm font-semibold h-10">
              <Printer className="w-4 h-4 mr-2" /> Print Delivery
            </Button>
            {(shipment.status === 'DRAFT' || !shipment.status) && (
            <>
              <Button onClick={handleConfirm} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 font-semibold h-10">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
              </Button>
              <Button onClick={handleCancel} variant="destructive" className="w-full sm:w-auto font-semibold h-10">
                <XCircle className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900/50 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Delivery Info */}
        <Card className="bg-card rounded-xl border border-border shadow-sm md:col-span-1">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Source Warehouse</p>
              <p className="font-semibold text-foreground/90">{shipment.warehouse?.name || shipment.warehouseId || "-"}</p>
            </div>
            <div className="h-px w-full bg-border/50"></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Transport Vehicle</p>
              <p className="font-semibold text-foreground/90">{shipment.vehicle?.name || shipment.vehicle?.licensePlate || shipment.vehicleId || "-"}</p>
            </div>
            <div className="h-px w-full bg-border/50"></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5"><UserSquare2 className="w-3.5 h-3.5" /> Driver</p>
              <p className="font-semibold text-foreground/90">{shipment.driver?.name || shipment.driverId || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="bg-card rounded-xl border border-border shadow-sm md:col-span-2">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package2 className="w-4 h-4 text-primary" /> Shipment Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full sm:max-w-none">
              <table className="min-w-[600px] md:min-w-full w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-4 px-6 text-left font-semibold text-muted-foreground h-11">Timber Product</th>
                    <th className="p-4 px-6 text-right font-semibold text-muted-foreground h-11">Quantity (PCS)</th>
                  </tr>
                </thead>
                <tbody>
                  {(shipment.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-6 font-semibold text-foreground/90">
                        {item.product?.name || item.product?.sku || item.productId || "-"}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-foreground">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                  {(!shipment.items || shipment.items.length === 0) && (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-muted-foreground text-sm">
                        No items found for this shipment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



