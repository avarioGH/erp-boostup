"use client";

import { useEffect, useState } from "react";
import { PurchaseAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, PackageOpen, FileText } from "lucide-react";

export default function PurchaseListPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PurchaseAPI.getPurchases().then((res: any) => {
      setPurchases(res?.data || res || []);
      setLoading(false);
    }).catch((err: any) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "CONFIRMED") return <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success-foreground border border-success/30">CONFIRMED</span>;
    if (s === "CANCELLED") return <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive border border-destructive/30">CANCELLED</span>;
    return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">DRAFT</span>;
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-primary" />
            Timber Purchases
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pembelian kayu dari supplier (Beli Masak).
          </p>
        </div>
        <Link href="/inventory/purchase/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto shadow-sm font-semibold tracking-wide">
            <Plus className="w-4 h-4 mr-2" />
            Create Purchase
          </Button>
        </Link>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">
          <Table className="w-full min-w-[600px]">
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground/80 h-11">Document Number</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Supplier</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Warehouse</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11">Status</TableHead>
                <TableHead className="font-semibold text-foreground/80 h-11 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">No purchases found</p>
                        <p className="text-sm">There are no purchase records matching your criteria.</p>
                      </div>
                      <Link href="/inventory/purchase/create" className="mt-2">
                        <Button variant="outline" size="sm">Create Purchase</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map(p => (
                  <TableRow key={p.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground/90">
                      {p.code || p.purchaseNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.supplier?.name || p.supplierId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.warehouse?.name || p.warehouseId}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(p.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/inventory/purchase/${p.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
