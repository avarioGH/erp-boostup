"use client";

import { useEffect, useState } from "react";
import { PurchaseAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [purchase, setPurchase] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = () => {
    PurchaseAPI.getPurchase(params.id).then((res: any) => {
      setPurchase(res?.data || res);
    }).catch((err: any) => setError("Failed to load data"));
  };

  const handleConfirm = async () => {
    if (!confirm("Are you sure you want to confirm this purchase?")) return;
    try {
      await PurchaseAPI.confirmPurchase(params.id);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Confirmation failed");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this purchase?")) return;
    try {
      await PurchaseAPI.cancelPurchase(params.id);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Cancellation failed");
    }
  };

  if (!purchase) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Detail {purchase.code}</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500">Supplier:</span> {purchase.supplier?.name || purchase.supplierId}</div>
          <div><span className="text-gray-500">Warehouse:</span> {purchase.warehouse?.name || purchase.warehouseId}</div>
          <div>
            <span className="text-gray-500">Status: </span>
            <Badge variant={purchase.status === 'CONFIRMED' ? 'default' : purchase.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
              {purchase.status || 'DRAFT'}
            </Badge>
          </div>
          <div className="flex gap-2">
            {(purchase.status === 'DRAFT' || !purchase.status) && (
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
          <CardTitle>Sawn Timber Items (Beli Masak)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Supplier Declaration (T×W×L)</TableHead>
                <TableHead>PCS</TableHead>
                <TableHead>M&sup3;</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Partai</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(purchase.items || []).map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-semibold">{item.timberVariant?.sku || item.timberVariantId}</div>
                    <div className="text-xs text-muted-foreground">{item.timberVariant?.species} &bull; {item.timberVariant?.grade}</div>
                  </TableCell>
                  <TableCell>
                    {item.purchaseThickness && item.purchaseWidth && item.purchaseLength 
                      ? <div className="font-medium text-amber-700 dark:text-amber-500">{item.purchaseThickness} &times; {item.purchaseWidth} &times; {item.purchaseLength}</div>
                      : <div className="text-muted-foreground italic">-</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Canonical: {item.timberVariant?.thickness} &times; {item.timberVariant?.width} &times; {item.timberVariant?.length}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{item.quantityPcs?.toLocaleString()}</TableCell>
                  <TableCell className="text-primary font-bold">{item.volumeM3?.toFixed(4)}</TableCell>
                  <TableCell>{item.unitPrice ? `Rp ${item.unitPrice.toLocaleString()}` : "-"}</TableCell>
                  <TableCell>
                    {item.batch && item.batch !== "UNKNOWN" ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{item.batch}</Badge>
                    ) : (
                      <Badge variant="secondary">UNKNOWN</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic text-sm">{item.notes || "-"}</TableCell>
                </TableRow>
              ))}
              {(!purchase.items || purchase.items.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-4">No items recorded.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PHASE 26.1: PURCHASE LOGS SECTION */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Purchase Logs (Raw Logs)</CardTitle>
          <Button onClick={() => router.push(`/inventory/purchase/${params.id}/logs/create`)} size="sm">
            Add Purchase Log
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log Number</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Diameter (1/2/3/4)</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Receiving Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(purchase.logItems || []).map((log: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{log.logNumber}</TableCell>
                  <TableCell>{log.species}</TableCell>
                  <TableCell>{log.purchaseLength}</TableCell>
                  <TableCell>{log.purchaseDiameter1}/{log.purchaseDiameter2}/{log.purchaseDiameter3}/{log.purchaseDiameter4}</TableCell>
                  <TableCell>{log.purchaseVolume}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === "RECEIVED" ? "default" : "secondary"}>
                      {log.status === "RECEIVED" ? "Received" : "Not Received"}
                      </Badge>
                      {log.status !== "RECEIVED" && (
                        <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/logs/receive?purchaseId=${params.id}&itemId=${log.id}`)}>
                          Receive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!purchase.logItems || purchase.logItems.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No purchase logs recorded.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


