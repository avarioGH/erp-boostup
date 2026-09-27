'use client';
import { useEffect, useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function YieldReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shift, setShift] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (shift) params.set('shift', shift);
    TimberAPI.getYieldReport(params.toString()).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan Rendemen Produksi</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end border rounded-lg p-4 bg-muted/20">
        <div>
          <p className="text-sm font-medium mb-1">Dari Tanggal</p>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Sampai Tanggal</p>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Shift</p>
          <Input type="text" placeholder="1 / 2 / ..." value={shift} onChange={e => setShift(e.target.value)} className="w-24" />
        </div>
        <Button onClick={fetchData} disabled={loading}>Tampilkan</Button>
      </div>

      {loading && <div className="text-muted-foreground py-8 text-center">Memuat data...</div>}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Input Net M³</p>
              <p className="text-2xl font-bold">{data.summary.totalInputM3.toFixed(4)}</p>
            </div>
            <div className="border p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Output M³</p>
              <p className="text-2xl font-bold">{data.summary.totalOutputM3.toFixed(4)}</p>
            </div>
            <div className="border p-4 rounded-lg bg-blue-50 text-blue-900 border-blue-200">
              <p className="text-sm font-medium">Overall Rendemen %</p>
              <p className="text-2xl font-bold">{data.summary.overallYield.toFixed(2)}%</p>
              <p className="text-xs text-blue-700 mt-1">Total Output / Total Input × 100</p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-card shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Output No.</TableHead>
                  <TableHead>Input No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Gudang</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Input Net (M³)</TableHead>
                  <TableHead className="text-right">Output (M³)</TableHead>
                  <TableHead className="text-right">Rendemen %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{row.outputNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{row.inputNumber}</TableCell>
                    <TableCell className="text-xs">{row.outputDate ? new Date(row.outputDate).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell>{row.shift}</TableCell>
                    <TableCell>{row.warehouse}</TableCell>
                    <TableCell>{row.species}</TableCell>
                    <TableCell className="text-xs">{row.batch}</TableCell>
                    <TableCell className="text-right font-medium">{row.inputM3.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-medium">{row.outputM3.toFixed(4)}</TableCell>
                    <TableCell className={`text-right font-bold ${row.yieldPercent >= 100 ? 'text-amber-600' : row.yieldPercent > 0 ? 'text-green-700' : 'text-muted-foreground'}`}>
                      {row.yieldPercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
                {data.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Tidak ada data rendemen untuk periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
