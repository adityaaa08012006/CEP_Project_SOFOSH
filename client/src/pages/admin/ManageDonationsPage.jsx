import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationApi } from '../../api';
import { useDonationRealtime } from '../../hooks/useRealtime';
import { DONATION_STATUS } from '@cep/shared';
import { LoadingSpinner, StatusBadge, EmptyState, Modal } from '../../components/ui/Common';
import { Gift, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManageDonationsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifyModal, setVerifyModal] = useState(null);
  const [receivedQty, setReceivedQty] = useState('');
  const queryClient = useQueryClient();

  useDonationRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-manage-donations', statusFilter],
    queryFn: () =>
      donationApi
        .getAll(statusFilter !== 'all' ? { status: statusFilter } : {})
        .then((r) => r.data),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, received_qty }) => donationApi.verify(id, { received_qty }),
    onSuccess: () => {
      toast.success('Donation verified and inventory updated');
      setVerifyModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-manage-donations'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to verify'),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const donations = data?.donations || [];
  const statuses = ['all', ...Object.values(DONATION_STATUS)];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Donation Approval</h1>
        <p className="text-gray-500">Verify and track incoming donations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {donations.length === 0 ? (
        <EmptyState icon={Gift} title="No Donations" description="No donations match the selected filter." />
      ) : (
        <div className="space-y-4">
          {donations.map((d) => (
            <div key={d.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">
                      {d.donation_items?.name || d.item?.name || 'Unknown Item'}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Donor: {d.profiles?.full_name || d.user?.full_name || 'Unknown'} |
                    Pledged: {d.quantity} {d.donation_items?.unit || d.item?.unit || ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    Pledged On: {format(new Date(d.created_at), 'MMM d, yyyy')}
                    {d.donation_date && (
                      <span className="ml-3 text-primary-600 font-medium">
                        • Expected: {format(new Date(d.donation_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </p>
                  {d.notes && <p className="text-sm text-gray-600">Notes: {d.notes}</p>}
                </div>

                {d.status === DONATION_STATUS.PLEDGED && (
                  <button
                    onClick={() => {
                      setVerifyModal(d);
                      setReceivedQty(d.quantity.toString());
                    }}
                    className="btn-success text-sm flex items-center space-x-1 self-end sm:self-center"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Receipt</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify Modal */}
      <Modal isOpen={!!verifyModal} onClose={() => setVerifyModal(null)} title="Verify Donation">
        {verifyModal && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800">{verifyModal.donation_items?.name || verifyModal.item?.name}</p>
              <p className="text-sm text-green-600">
                Pledged: {verifyModal.quantity} {verifyModal.donation_items?.unit || verifyModal.item?.unit || ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Quantity</label>
              <input
                type="number"
                min="1"
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Confirm the actual quantity received</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => verifyMut.mutate({ id: verifyModal.id, received_qty: parseInt(receivedQty) })}
                disabled={verifyMut.isPending}
                className="btn-success flex-1"
              >
                {verifyMut.isPending ? 'Verifying...' : 'Confirm Receipt'}
              </button>
              <button onClick={() => setVerifyModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
