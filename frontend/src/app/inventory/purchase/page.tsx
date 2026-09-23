"use client";

import { useEffect, useState } from "react";
import { PurchaseAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PurchaseListPage() {
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    PurchaseAPI.getPurchases().then((res: any) => {
      setPurchases(res?.data || res || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Timber Purchases</h1>
        <Link href="/inventory/purchase/create">
          <Button>Create Purchase</Button>
        </Link>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.code}</TableCell>
                <TableCell>{p.supplier?.name || p.supplierId}</TableCell>
                <TableCell>{p.warehouse?.name || p.warehouseId}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>
                  <Link href={`/inventory/purchase/${p.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center">No purchases found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
