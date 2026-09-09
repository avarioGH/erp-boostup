'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function MrpPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  
  const calculateMrp = async () => {
    setLoading(true);
    try {
      const res = await api.get(\/mrp/calculate\\);
      if (res.data && res.data.results) {
        setResults(res.data.results);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error(e);
      alert('Error calculating MRP');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Material Requirements Planning (MRP)</h1>
        <button 
          onClick={calculateMrp}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Run MRP'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Gross Req</th>
              <th className="px-4 py-3 text-right">Safety</th>
              <th className="px-4 py-3 text-right">Available</th>
              <th className="px-4 py-3 text-right">Incoming</th>
              <th className="px-4 py-3 text-right font-bold text-red-600">Net Req</th>
              <th className="px-4 py-3">Recommendation</th>
              <th className="px-4 py-3 text-right">Suggested Qty</th>
              <th className="px-4 py-3">Traceability</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.product_code} - {r.product_name}</td>
                <td className="px-4 py-3 text-right">{r.gross_requirement}</td>
                <td className="px-4 py-3 text-right">{r.safety_stock}</td>
                <td className="px-4 py-3 text-right">{r.available_stock}</td>
                <td className="px-4 py-3 text-right">{r.incoming_supply}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{r.net_requirement}</td>
                <td className="px-4 py-3">
                  <span className={\px-2 py-1 rounded text-xs font-semibold \\}>
                    {r.recommendation}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{r.suggested_quantity}</td>
                <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-xs" title={r.explanation}>
                  {r.explanation}
                </td>
              </tr>
            ))}
            {results.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Click 'Run MRP' to generate planning proposals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
