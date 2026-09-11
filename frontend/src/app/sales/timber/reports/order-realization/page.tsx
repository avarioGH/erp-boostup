"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function OrderRealizationReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      // Calls the dedicated realization reporting endpoint (mimicking monitor update 2)
      const res = await api.get("/sales/timber-orders/reports/realization");
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      // Set to empty on error so it renders the empty state gracefully
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Order vs Realization Report</h1>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700">
          Print Report
        </button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th colSpan={2} className="border border-slate-300 p-2 text-center">ORDER INFO</th>
                    <th colSpan={3} className="border border-slate-300 p-2 text-center">DIMENSIONS</th>
                    <th colSpan={2} className="border border-slate-300 p-2 text-center bg-blue-50">ORDER</th>
                    <th colSpan={2} className="border border-slate-300 p-2 text-center bg-emerald-50">REALISASI</th>
                    <th colSpan={2} className="border border-slate-300 p-2 text-center bg-amber-50">SISA</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="border border-slate-300 p-2">Customer</th>
                    <th className="border border-slate-300 p-2">Order No</th>
                    <th className="border border-slate-300 p-2">Tbl</th>
                    <th className="border border-slate-300 p-2">Lbr</th>
                    <th className="border border-slate-300 p-2">Pjg</th>
                    <th className="border border-slate-300 p-2 bg-blue-50">Qty</th>
                    <th className="border border-slate-300 p-2 bg-blue-50">M3</th>
                    <th className="border border-slate-300 p-2 bg-emerald-50">Qty</th>
                    <th className="border border-slate-300 p-2 bg-emerald-50">M3</th>
                    <th className="border border-slate-300 p-2 bg-amber-50">Qty</th>
                    <th className="border border-slate-300 p-2 bg-amber-50">M3</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center p-8 text-slate-500">
                        No realization data available.
                      </td>
                    </tr>
                  ) : (
                    data.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2">{row.customerName}</td>
                        <td className="border border-slate-300 p-2">{row.orderNumber}</td>
                        <td className="border border-slate-300 p-2 text-right">{row.thicknessMm}</td>
                        <td className="border border-slate-300 p-2 text-right">{row.widthMm}</td>
                        <td className="border border-slate-300 p-2 text-right">{row.lengthMm}</td>
                        
                        <td className="border border-slate-300 p-2 text-right font-medium">{row.orderQty}</td>
                        <td className="border border-slate-300 p-2 text-right">{row.orderM3.toFixed(4)}</td>
                        
                        <td className="border border-slate-300 p-2 text-right text-emerald-700 font-medium">{row.realizedQty}</td>
                        <td className="border border-slate-300 p-2 text-right text-emerald-700">{row.realizedM3.toFixed(4)}</td>
                        
                        <td className="border border-slate-300 p-2 text-right text-amber-700 font-medium">{row.orderQty - row.realizedQty}</td>
                        <td className="border border-slate-300 p-2 text-right text-amber-700">{(row.orderM3 - row.realizedM3).toFixed(4)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
