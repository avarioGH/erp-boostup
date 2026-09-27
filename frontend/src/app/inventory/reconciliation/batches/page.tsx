"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function BatchAuditPage() {
  const [summary, setSummary] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCanonical, setSelectedCanonical] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [loadingDrillDown, setLoadingDrillDown] = useState(false);
  const [activeTab, setActiveTab] = useState('stockRecords');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resSummary = await api.get('/inventory/batch-data-quality');
      setSummary(resSummary.data);
      const resDetail = await api.get('/inventory/batch-data-quality/detail');
      setDetails(resDetail.data.findings || []);
    } catch (err: any) {
      console.error('Error loading audit data', err.message);
      setSummary({ auditStatus: 'DATA_UNAVAILABLE' });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (canonicalBatch: string) => {
    setSelectedCanonical(canonicalBatch);
    setLoadingDrillDown(true);
    try {
      const res = await api.get('/inventory/batch-data-quality/detail', { params: { canonicalBatch } });
      setDrillDownData(res.data);
      
      const firstAvailableTab = Object.keys(res.data).find(k => k.endsWith('Records') && res.data[k].length > 0) || 'stockRecords';
      setActiveTab(firstAvailableTab);
    } catch (err: any) {
      console.error('Error loading drill-down data', err);
    } finally {
      setLoadingDrillDown(false);
    }
  };

  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Badge variant="destructive">CRITICAL</Badge>;
      case 'HIGH': return <Badge variant="destructive" className="bg-red-500">HIGH</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="text-orange-500 border-orange-500">MEDIUM</Badge>;
      case 'LOW': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">LOW</Badge>;
      default: return <Badge variant="secondary">INFO</Badge>;
    }
  };

  const renderStatusIcon = (status: string) => {
    if (status === 'HEALTHY') return <CheckCircle className="text-green-500 w-8 h-8" />;
    if (status === 'WARNINGS') return <Info className="text-yellow-500 w-8 h-8" />;
    if (status === 'ANOMALIES') return <AlertTriangle className="text-red-500 w-8 h-8" />;
    return <XCircle className="text-gray-500 w-8 h-8" />;
  };

  if (loading) return <div className="p-8 text-center">Loading batch audit data...</div>;

  return (
    <div className="p-6 space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Batch Data Quality Audit</h1>
          <p className="text-muted-foreground">Read-only observability for batch canonicalization and stock identity.</p>
        </div>
        {summary && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
            {renderStatusIcon(summary.auditStatus)}
            <div>
              <p className="text-sm font-semibold uppercase">{summary.auditStatus}</p>
              <p className="text-xs text-muted-foreground">Overall Status</p>
            </div>
          </div>
        )}
      </div>

      
      {summary && summary.auditStatus !== 'DATA_UNAVAILABLE' && (
        <>
        <h2 className="text-lg font-bold mt-8 mb-4">Integrity Audit</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stock/Ledger Match</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{summary.stockLedgerMatchCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stock/Ledger Mismatch</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{summary.stockLedgerMismatchCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">No Ledger History</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-orange-500">{summary.noLedgerHistoryCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Shipment/Ledger Match</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{summary.shipmentLedgerMatchCount || 0}</p></CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Shipment w/o Ledger</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{summary.shipmentWithoutLedgerCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reservation Healthy</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{summary.reservationHealthyCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Over Reserved</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{summary.reservationOverCount || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Orphan Reservation</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-orange-500">{summary.reservationOrphanCount || 0}</p></CardContent>
          </Card>
        </div>
        </>
      )}

      {summary && summary.auditStatus !== 'DATA_UNAVAILABLE' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Audited</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary.totalAuditedRecords}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Normal</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{summary.normalCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Format Variants</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-yellow-600">{summary.formatVariantCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Identity Risks</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{summary.stockIdentityRiskCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cross-Workflow</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-blue-600">{summary.crossWorkflowFormatVariantCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">UNKNOWN</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-gray-600">{summary.unknownCount}</p></CardContent>
          </Card>
        </div>
      )}

      {summary?.auditStatus === 'DATA_UNAVAILABLE' && (
        <div className="p-8 bg-gray-50 border rounded text-center text-gray-500">
          Live production audit unavailable (Database connection error).
        </div>
      )}

      {details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Findings (Click row to inspect)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Canonical Batch</TableHead>
                  <TableHead>Exact Batches</TableHead>
                  <TableHead>Workflows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((row, i) => (
                  <TableRow key={i} onClick={() => handleRowClick(row.canonicalBatch)} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>{renderSeverityBadge(row.severity)}</TableCell>
                    <TableCell className="font-semibold text-xs">{row.category.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="font-mono">{row.canonicalBatch}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{row.exactBatches.join(', ')}</TableCell>
                    <TableCell>{row.workflows?.map((w: any) => w.workflow).join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Drawer Modal */}
      {selectedCanonical && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-3xl bg-white h-full shadow-xl overflow-y-auto border-l flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold">Inspect Batch: {selectedCanonical}</h2>
                <p className="text-sm text-gray-500">Read-only traceability drill-down</p>
              </div>
              <button onClick={() => setSelectedCanonical(null)} className="p-2 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 flex-grow flex flex-col gap-6">
              {loadingDrillDown ? (
                 <div className="text-center py-10 text-gray-500">Loading traceability source records...</div>
              ) : drillDownData ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 rounded bg-gray-50">
                       <p className="text-xs font-bold text-gray-500 mb-1">Batch Identity</p>
                       <p className="font-mono text-sm">Canonical: {drillDownData.canonicalBatch}</p>
                       <p className="font-mono text-sm text-gray-600">Exact representations: {drillDownData.workflows.flatMap((w:any)=>w.exactBatches).filter((v:any,i:any,a:any)=>a.indexOf(v)===i).join(', ')}</p>
                    </div>
                    <div className="border p-4 rounded bg-blue-50">
                       <p className="text-xs font-bold text-gray-500 mb-1">Finding</p>
                       <p className="font-semibold text-sm mb-1">{drillDownData.category.replace(/_/g, ' ')}</p>
                       <p className="text-xs text-gray-700">{drillDownData.explanation}</p>
                    </div>
                  </div>

                  <div className="border rounded overflow-hidden flex flex-col flex-grow">
                    <div className="flex bg-gray-100 overflow-x-auto border-b">
                      {Object.keys(drillDownData)
                        .filter(k => k.endsWith('Records') && drillDownData[k]?.length > 0)
                        .map(key => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`px-4 py-2 text-sm font-medium border-r whitespace-nowrap ${activeTab === key ? 'bg-white border-b-2 border-b-blue-600 text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          {key.replace('Records', '').toUpperCase()} ({drillDownData[key].length})
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-0 overflow-auto bg-white min-h-[300px]">
                       <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>Exact Batch</TableHead>
                             <TableHead>ID</TableHead>
                             <TableHead>Details</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {drillDownData[activeTab]?.map((r: any, idx: number) => (
                             <TableRow key={idx}>
                               <TableCell className="font-mono">{r.exactBatch}</TableCell>
                               <TableCell className="text-xs font-mono text-gray-500">{r.id}</TableCell>
                               <TableCell className="text-xs">
                                 {Object.entries(r).filter(([k]) => !['id', 'batch', 'exactBatch', 'canonicalBatch', 'location', 'timberVariant'].includes(k)).map(([k, v]) => (
                                   <div key={k}><span className="text-gray-500">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                                 ))}
                               </TableCell>
                             </TableRow>
                           ))}
                           {(!drillDownData[activeTab] || drillDownData[activeTab].length === 0) && (
                             <TableRow>
                               <TableCell colSpan={3} className="text-center py-6 text-gray-500">No records found for this workflow.</TableCell>
                             </TableRow>
                           )}
                         </TableBody>
                       </Table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-red-500">Failed to load data</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
