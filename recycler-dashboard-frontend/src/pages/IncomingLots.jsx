import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';

export default function IncomingLots() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed

  useEffect(() => {
    fetch('http://localhost:5000/api/lots')
      .then(res => res.json())
      .then(data => {
        setLots(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredLots = lots.filter(lot => filter === 'all' ? true : lot.status === filter);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading lots...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incoming Lots</h1>
          <p className="text-gray-500 mt-1">Manage pooled materials ready for handover from scrap dealers.</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 outline-none focus:border-green-500 shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Lots</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dealer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (kg)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Value (₹)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLots.map((lot) => (
              <tr key={lot._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.lotId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lot.dealerName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lot.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lot.status === 'confirmed' ? (
                    <span>
                      <span className="line-through text-gray-400 mr-2">{lot.declaredWeight}</span>
                      <span className="font-bold text-gray-900">{lot.verifiedWeight}</span>
                    </span>
                  ) : (
                    <span>{lot.declaredWeight} (Declared)</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{lot.estimatedValue}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lot.status === 'confirmed' ? (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>
                  ) : (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLots.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lots found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no incoming lots matching the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
