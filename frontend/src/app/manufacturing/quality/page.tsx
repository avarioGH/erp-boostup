'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

export default function QualityDashboard() {
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing/quality/checks');
      setChecks(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const pending = checks.filter(c => c.status === 'PENDING').length;
  const passed = checks.filter(c => c.status === 'PASSED').length;
  const failed = checks.filter(c => c.status === 'FAILED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quality Control</h1>
          <p className="text-gray-500">Manage inspections, defects, and dispositions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Checks</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Passed Inspections</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Inspections</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checks.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Log</CardTitle>
          <CardDescription>Recent quality checks and results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Source (MO / WO)</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Inspected Qty</th>
                  <th className="px-4 py-2">Accepted</th>
                  <th className="px-4 py-2">Rejected</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{c.id.substring(0,8)}</td>
                    <td className="px-4 py-2 font-medium">{c.product?.name}</td>
                    <td className="px-4 py-2">
                      {c.manufacturing_order?.order_number || 'N/A'}
                      {c.work_order && \ / \\}
                    </td>
                    <td className="px-4 py-2">
                      <span className={\px-2 py-1 rounded text-xs font-semibold \\}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{c.inspected_quantity}</td>
                    <td className="px-4 py-2 text-green-600">{c.accepted_quantity}</td>
                    <td className="px-4 py-2 text-red-600">{c.rejected_quantity}</td>
                    <td className="px-4 py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {checks.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No quality checks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
