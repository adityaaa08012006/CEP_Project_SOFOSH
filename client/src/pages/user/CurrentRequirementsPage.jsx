import { useQuery } from '@tanstack/react-query';
import { donationItemApi } from '../../api';
import { LoadingSpinner, EmptyState } from '../../components/ui/Common';
import { Package, TrendingUp } from 'lucide-react';

export default function CurrentRequirementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['donation-items-active'],
    queryFn: () => donationItemApi.getAll({ active_only: 'true' }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const items = data?.items || [];

  const calculateProgress = (fulfilled, required) => {
    if (required === 0) return 0;
    return Math.min((fulfilled / required) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (fulfilled, required) => {
    const percentage = calculateProgress(fulfilled, required);
    if (percentage >= 100) {
      return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Fulfilled</span>;
    }
    return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">In Progress</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Current Requirements</h1>
        <p className="text-gray-500">View active donation needs and fulfillment status</p>
      </div>

      {items.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No Active Requirements" 
          description="There are currently no items needed." 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const progress = calculateProgress(item.fulfilled_qty, item.required_qty);
            const progressColor = getProgressColor(progress);

            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</p>
                  </div>
                  {getStatusBadge(item.fulfilled_qty, item.required_qty)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required:</span>
                    <span className="font-medium">{item.required_qty} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fulfilled:</span>
                    <span className="font-medium">{item.fulfilled_qty} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-primary-600">
                      {Math.max(0, item.required_qty - item.fulfilled_qty)} {item.unit}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {items.length > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold">Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fully Fulfilled</p>
              <p className="text-2xl font-bold text-green-600">
                {items.filter(i => i.fulfilled_qty >= i.required_qty).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {items.filter(i => {
                  const pct = calculateProgress(i.fulfilled_qty, i.required_qty);
                  return pct > 0 && pct < 100;
                }).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
