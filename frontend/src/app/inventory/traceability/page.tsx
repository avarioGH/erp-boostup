'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function LogTraceability() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Log Traceability</h1>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Search Lifecycle</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <Input placeholder="Enter Raw Log, Trim Code, Input Number, or Bundle SKU..." className="max-w-md" />
          <Button><Search className="w-4 h-4 mr-2" /> Trace</Button>
        </CardContent>
      </Card>
      
      <div className="border rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[40vh] bg-slate-50/50">
        <Search className="w-12 h-12 mb-4 text-slate-300" />
        <h3 className="text-lg font-medium mb-2">No Trace Data</h3>
        <p>Enter a tracking number above to trace the complete lifecycle of a timber product.</p>
        
        <div className="flex items-center justify-center gap-4 mt-8 opacity-50">
          <div className="px-4 py-2 bg-white border rounded">Raw Log</div>
          <span>?</span>
          <div className="px-4 py-2 bg-white border rounded">Trimmed Log</div>
          <span>?</span>
          <div className="px-4 py-2 bg-white border rounded">Input Log (WIP)</div>
          <span>?</span>
          <div className="px-4 py-2 bg-white border rounded">Sawn Output</div>
          <span>?</span>
          <div className="px-4 py-2 bg-white border rounded">Stock</div>
        </div>
      </div>
    </div>
  );
}
