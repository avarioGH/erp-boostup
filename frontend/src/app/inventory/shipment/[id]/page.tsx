"use client";

import { useEffect, useState } from "react";
import { ShipmentAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, ArrowLeft, Loader2, CheckCircle2, XCircle, Truck, MapPin, UserSquare2, Package2, CalendarClock, Printer, ShoppingCart } from "lucide-react";

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    setActionLoading(true);
    setError("");
    try {
      await ShipmentAPI.confirmShipment(params.id);
      setConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Confirmation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError("");
    try {
      await ShipmentAPI.cancelShipment(params.id);
      setCancelOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Cancellation failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 md:p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!shipment && error) {
    return (
      <div className="p-8 md:p-24 flex flex-col items-center justify-center text-center">
        <Truck className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Shipment Not Found</h2>
        <Button onClick={() => router.push('/inventory/shipment')} variant="outline" className="h-10 px-6 font-semibold mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shipments
        </Button>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in pb-12 px-4 md:px-6 box-border">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory/shipment')} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {shipment.shipmentNumber || "Shipment Detail"}
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
              {shipment.shipmentDate ? new Date(shipment.shipmentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto gap-2">
            <Button variant="outline" onClick={() => window.open(`/inventory/shipment/${params.id}/print`, "_blank")} className="w-full sm:w-auto font-semibold h-10">
              <Printer className="w-4 h-4 mr-2" /> Surat Jalan
            </Button>
            {shipment.status === 'DRAFT' && (
              <Button onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 font-semibold h-10">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
              </Button>
            )}
            {shipment.status === 'CONFIRMED' && (
              <Button onClick={() => setCancelOpen(true)} variant="destructive" className="w-full sm:w-auto font-semibold h-10">
                <XCircle className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200 rounded-xl">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-1 flex flex-col gap-4 md:gap-6">
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 flex flex-col gap-4 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer</p>
                <p className="font-semibold text-foreground">{shipment.customer?.name || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Destination Name</p>
                <p className="font-semibold text-foreground">{shipment.destinationName || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Address</p>
                <p className="text-foreground">{shipment.destinationAddress || "-"}</p>
              </div>
              {shipment.salesOrder && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 mt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Linked Sales Order</p>
                  <p className="font-semibold text-primary">{shipment.salesOrder.orderNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" /> Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 flex flex-col gap-4 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Warehouse</p>
                <p className="font-semibold text-foreground">{shipment.warehouse?.name || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Vehicle</p>
                <p className="font-semibold text-foreground">{shipment.vehicle?.name || shipment.vehicle?.licensePlate || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Driver</p>
                <p className="font-semibold text-foreground">{shipment.driver?.name || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card rounded-xl border border-border shadow-sm md:col-span-2">
          <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex justify-between flex-row items-center">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package2 className="w-4 h-4 text-primary" /> Loaded Items
            </CardTitle>
            <div className="text-sm font-semibold text-primary">
              Total: {shipment.totalPcs || 0} PCS | {Number(shipment.totalVolumeM3 || 0).toFixed(4)} M3
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-4 text-left font-semibold text-muted-foreground">Variant SKU</th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">Dimensions & Grade</th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">Batch</th>
                    <th className="p-4 text-right font-semibold text-muted-foreground">Qty (PCS)</th>
                    <th className="p-4 text-right font-semibold text-muted-foreground">Volume (M3)</th>
                  </tr>
                </thead>
                <tbody>
                  {(shipment.items || []).map((item: any, i: number) => {
                    const tv = item.timberVariant || {};
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-4 font-semibold text-foreground">{tv.sku || '-'}</td>
                        <td className="p-4 text-muted-foreground">{tv.thickness}x{tv.width}x{tv.length} {tv.grade}</td>
                        <td className="p-4 font-medium text-foreground">{item.batch || '-'}</td>
                        <td className="p-4 text-right font-bold text-foreground">{item.quantityPcs}</td>
                        <td className="p-4 text-right font-medium text-foreground">{Number(item.volumeM3 || 0).toFixed(4)}</td>
                      </tr>
                    );
                  })}
                  {(!shipment.items || shipment.items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No items.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm and post this shipment?
              This action will deduct physical stock from {shipment.warehouse?.name} and consume Sales Order reservations (if linked).
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md mt-4 text-sm space-y-2">
             <div><strong>Shipment:</strong> {shipment.shipmentNumber}</div>
             <div><strong>Total:</strong> {shipment.totalPcs} PCS / {shipment.totalVolumeM3?.toFixed(4)} M3</div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
               {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this shipment?
              This will restore the deducted physical stock back to inventory and reverse Sales Order realizations/reservations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={actionLoading}>Close</Button>
            <Button onClick={handleCancel} disabled={actionLoading} variant="destructive">
               {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Proceed Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
