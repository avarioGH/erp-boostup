const fs = require('fs');
fs.mkdirSync('frontend/src/app/finance/expense', { recursive: true });

const content = `"use client";
import { useState, useEffect } from "react";
import { ExpenseAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ExpensePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ExpenseAPI.getClaims().then((res: any) => {
      setData(res || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Claims</h1>
          <p className="text-muted-foreground mt-1">Manage employee expense claims.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> New Claim</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Claims</CardTitle>
          <CardDescription>View all expense claims.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex p-8 justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-left">Purpose</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center">No expense claims found.</td></tr>
                  ) : data.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 font-medium">{item.employee?.first_name} {item.employee?.last_name}</td>
                      <td className="p-4">{item.purpose}</td>
                      <td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">Rp {Number(item.total_amount || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={item.status === 'DRAFT' ? 'outline' : item.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={\`/approvals?ref=\${item.id}\`}>
                          <Button variant="ghost" size="sm">View <ArrowRight className="w-4 h-4 ml-1" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync('frontend/src/app/finance/expense/page.tsx', content);
console.log('Created /finance/expense/page.tsx');
