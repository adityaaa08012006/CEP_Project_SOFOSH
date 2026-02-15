import { useQuery } from '@tanstack/react-query';
import { donationApi } from '../../api';
import { useDonationRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common';
import { Gift, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function MyDonationsPage() {
  useDonationRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationApi.getAll().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const donations = data?.donations || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Donations</h1>
        <p className="text-gray-500">Track the status of your donation pledges</p>
      </div>

      {donations.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No Donations Yet"
          description="You haven't made any donation pledges yet. Browse needed items to get started!"
        />
      ) : (
        <div className="space-y-4">
          {donations.map((d) => (
            <div key={d.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold">
                      {d.donation_items?.name || d.item?.name || 'Unknown Item'}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                    <span>
                      Quantity: {d.quantity} {d.donation_items?.unit || d.item?.unit || ''}
                    </span>
                    <span>Pledged: {format(new Date(d.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {d.notes && (
                    <p className="text-sm text-gray-600 ml-8">Notes: {d.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
