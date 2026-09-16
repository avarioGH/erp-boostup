'use client';
import { useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Network } from 'lucide-react';
import Link from 'next/link';

export default function TraceabilityReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    setLoading(true);
    try {
      const res = await TimberAPI.getTraceability(search);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/reports"><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4"/></Button></Link>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Network className="text-blue-500 w-8 h-8"/> Traceability</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Log Traceability Search</CardTitle>
          <CardDescription>Search by Raw Log No, Trim Code, Input No, or Sawn Bundle No to see its history.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <Input placeholder="Enter tracking code..." value={search} onChange={e => setSearch(e.target.value)} required />
            <Button type="submit" disabled={loading}><Search className="w-4 h-4 mr-2"/> Trace</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="p-4 text-center">Tracing...</div>}

      {data === null && !loading && search && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10"><CardContent className="p-6 text-red-600">No records found for that code.</CardContent></Card>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Trace Result: <span className="text-blue-600">{data.type}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
