"use client";
import { useEffect, useState } from "react";
import { PurchasingAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, FileText, ClipboardList, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PurchasingDashboard() {
  const [metrics, setMetrics] = useState({
    pr: 0,
    rfq: 0,
    poOpen: 0,
    poCompleted: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const [reqs, orders] = await Promise.all([
          PurchasingAPI.getRequests(),
          PurchasingAPI.getOrders()
        ]);
        const prList = reqs?.data || [];
        const poList = orders?.data || [];
        setMetrics({
          pr: prList.filter((p:any) => p.status === 'SUBMITTED' || p.status === 'DRAFT').length,
          rfq: poList.filter((o:any) => o.status === 'DRAFT').length,
          poOpen: poList.filter((o:any) => o.status === 'CONFIRMED' && o.receipt_status !== 'RECEIVED').length,
          poCompleted: poList.filter((o:any) => o.status === 'CONFIRMED' && o.receipt_status === 'RECEIVED').length,
        });
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Purchasing Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/purchasing/requests">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pr}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchasing/rfqs">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active RFQs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.rfq}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchasing/orders">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open POs</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.poOpen}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchasing/orders">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed POs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.poCompleted}</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
