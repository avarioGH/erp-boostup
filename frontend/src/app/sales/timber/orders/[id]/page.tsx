"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function TimberOrderDetail({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales/timber-orders/${params.id}`);
      setOrder(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-slate-400" /></div>;
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded">{error}</div>;
  if (!order) return <div className="p-6">Order not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Details: {order.orderNumber}</h1>
        <Badge className="text-sm px-3 py-1">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Customer Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold text-slate-500 w-24 inline-block">Name:</span> {order.customer?.name}</p>
            <p><span className="font-semibold text-slate-500 w-24 inline-block">Code:</span> {order.customer?.code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Order Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold text-slate-500 w-24 inline-block">Date:</span> {new Date(order.orderDate).toLocaleDateString()}</p>
            <p><span className="font-semibold text-slate-500 w-24 inline-block">Partai:</span> {order.partai || "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items & Realization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left bg-slate-50">
                  <th className="p-3">Dimensions (T×W×L)</th>
                  <th className="p-3">Order Qty</th>
                  <th className="p-3">Order M³</th>
                  <th className="p-3">Realized Qty</th>
                  <th className="p-3">Realized M³</th>
                  <th className="p-3">Remaining Qty</th>
                  <th className="p-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => {
                  const remaining = item.orderQty - item.realizedQty;
                  const pct = Math.round((item.realizedQty / item.orderQty) * 100);
                  return (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{item.thicknessMm} × {item.widthMm} × {item.lengthMm}</td>
                      <td className="p-3">{item.orderQty} PCS</td>
                      <td className="p-3">{item.orderM3.toFixed(4)}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{item.realizedQty} PCS</td>
                      <td className="p-3 text-emerald-600">{item.realizedM3.toFixed(4)}</td>
                      <td className="p-3 text-amber-600 font-semibold">{remaining} PCS</td>
                      <td className="p-3">
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">{pct}% Fulfilled</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
