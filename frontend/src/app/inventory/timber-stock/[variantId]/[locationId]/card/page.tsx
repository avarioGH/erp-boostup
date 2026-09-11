'use client';
import { useEffect, useState } from 'react';
import { TimberAPI } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

export default function StockCardPage() {
 const { variantId, locationId } = useParams() as { variantId: string, locationId: string };
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 TimberAPI.getStockCard(variantId, locationId).then((res: any) => {
 setData(res);
 setLoading(false);
 });
 }, [variantId, locationId]);

 if (loading) return <div className="p-8">Loading stock card...</div>;
 if (!data || !data.stock) return <div className="p-8 text-red-500">Stock card not found</div>;

 const { stock, card } = data;

 return (
 <div className="p-8 space-y-6">
 <div className="flex justify-between items-start">
 <div>
 <h1 className="text-2xl font-bold mb-2">Stock Card</h1>
 <div className="text-gray-600">
 <p><strong>SKU:</strong> {stock.timberVariant.sku}</p>
 <p><strong>Product:</strong> {stock.timberVariant.product?.name || stock.timberVariant.species}</p>
 <p><strong>Size:</strong> {stock.timberVariant.thickness} × {stock.timberVariant.width} × {stock.timberVariant.length}</p>
 <p><strong>Location:</strong> {stock.location.name}</p>
 </div>
 </div>
 <Button variant="outline" onClick={() => window.print()}>Print Card</Button>
 </div>

 <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
 <Table>
 <TableHeader className="bg-muted/30">
 <TableRow>
 <TableHead>Date</TableHead>
 <TableHead>Reference</TableHead>
 <TableHead>Type</TableHead>
 <TableHead className="text-right text-green-700">IN (PCS)</TableHead>
 <TableHead className="text-right text-red-700">OUT (PCS)</TableHead>
 <TableHead className="text-right font-bold">BALANCE (PCS)</TableHead>
 <TableHead className="text-right font-bold">BALANCE (M³)</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {card.map((row: any, idx: number) => (
 <TableRow key={row.id || idx} className={row.reference === 'OPENING' ? 'bg-blue-50 font-medium' : ''}>
 <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
 <TableCell className="font-mono text-sm">{row.reference}</TableCell>
 <TableCell>{row.type}</TableCell>
 <TableCell className="text-right text-green-600">{row.in > 0 ? `+${row.in}` : '-'}</TableCell>
 <TableCell className="text-right text-red-600">{row.out > 0 ? `-${row.out}` : '-'}</TableCell>
 <TableCell className="text-right font-bold">{row.balancePcs}</TableCell>
 <TableCell className="text-right font-medium">{row.balanceM3.toFixed(4)}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}
