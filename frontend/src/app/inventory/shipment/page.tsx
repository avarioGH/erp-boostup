"use client";

import { useEffect, useState } from "react";
import { ShipmentAPI } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ShipmentListPage() {
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    ShipmentAPI.getShipments().then((res: any) => {
      setShipments(res?.data || res || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Timber Shipments</h1>
        <Link href="/inventory/shipment/create">
          <Button>Create Shipment</Button>
        </Link>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Vehicle/Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.code}</TableCell>
                <TableCell>{s.warehouse?.name || s.warehouseId}</TableCell>
                <TableCell>{(s.vehicle?.name || s.vehicleId) + ' / ' + (s.driver?.name || s.driverId)}</TableCell>
                <TableCell>{s.status}</TableCell>
                <TableCell>
                  <Link href={`/inventory/shipment/${s.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {shipments.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center">No shipments found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
