'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { DisposalAPI } from '@/lib/api';

export default function DisposalsPage() {
  const [disposals, setDisposals] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    DisposalAPI.list().then((data) => setDisposals(data)).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Disposals</h1>
        <Button onClick={() => router.push('/inventory/disposals/create')}>Create Disposal</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Disposal History</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Date</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disposals.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2">{d.date}</td>
                  <td className="py-2">{d.reason}</td>
                  <td className="py-2">{d.status}</td>
                  <td className="py-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/disposals/${d.id}`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {disposals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No disposals found</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
