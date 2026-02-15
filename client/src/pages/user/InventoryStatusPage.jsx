import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { useInventoryRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, ProgressBar, EmptyState } from '../../components/ui/Common';
import { Package, Search, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function InventoryStatusPage() {
  const [search, setSearch] = useState('');

  useInventoryRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => inventoryApi.getReport().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const report = (data?.report || []).filter((item) =>
    item.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = report.length;
  const fullyMet = report.filter((r) => r.fulfillment_pct >= 100).length;
  const deficit = report.filter((r) => r.status === 'deficit').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requirements</h1>
        <p className="text-gray-500">Real-time view of orphanage needs and fulfillment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{totalItems}</p>
          <p className="text-sm text-gray-500">Total Items</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{fullyMet}</p>
          <p className="text-sm text-gray-500">Fully Fulfilled</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{deficit}</p>
          <p className="text-sm text-gray-500">Still Needed</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {report.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Inventory Data"
          description="No inventory records found."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold text-gray-700">Item</th>
                <th className="pb-3 font-semibold text-gray-700">Category</th>
                <th className="pb-3 font-semibold text-gray-700">Needed</th>
                <th className="pb-3 font-semibold text-gray-700">In Stock</th>
                <th className="pb-3 font-semibold text-gray-700 min-w-[150px]">Progress</th>
                <th className="pb-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{item.item_name}</td>
                  <td className="py-3 text-gray-500">{item.category_name}</td>
                  <td className="py-3">
                    {item.quantity_needed} {item.unit}
                  </td>
                  <td className="py-3">
                    {item.current_qty} {item.unit}
                  </td>
                  <td className="py-3">
                    <ProgressBar current={item.current_qty} target={item.quantity_needed} />
                  </td>
                  <td className="py-3">
                    {item.status === 'surplus' ? (
                      <span className="badge-success">Surplus</span>
                    ) : item.status === 'met' ? (
                      <span className="badge-success">Met</span>
                    ) : (
                      <span className="badge-warning">Deficit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
