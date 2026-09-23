"use client";

import { useEffect, useState } from "react";
import { ShipmentAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = () => {
    ShipmentAPI.getShipment(params.id).then((res: any) => {
      setShipment(res?.data || res);
    }).catch((err: any) => setError("Failed to load data"));
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

  if (!shipment) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Shipment Detail {shipment.code}</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500">Warehouse:</span> {shipment.warehouse?.name || shipment.warehouseId}</div>
          <div><span className="text-gray-500">Vehicle / Driver:</span> {(shipment.vehicle?.name || shipment.vehicleId)} / {(shipment.driver?.name || shipment.driverId)}</div>
          <div>
            <span className="text-gray-500">Status: </span>
            <Badge variant={shipment.status === 'CONFIRMED' ? 'default' : shipment.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
              {shipment.status || 'DRAFT'}
            </Badge>
          </div>
          <div className="flex gap-2">
            {(shipment.status === 'DRAFT' || !shipment.status) && (
              <>
                <Button onClick={handleConfirm} size="sm">Confirm</Button>
                <Button onClick={handleCancel} variant="destructive" size="sm">Cancel</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shipment.items || []).map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.product?.name || item.productId}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))}
              {(!shipment.items || shipment.items.length === 0) && (
                <TableRow><TableCell colSpan={2} className="text-center">No items.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
