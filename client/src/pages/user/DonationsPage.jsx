import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationItemApi, donationApi } from '../../api';
import { useDonationRealtime } from '../../hooks/useRealtime';
import { DONATION_CATEGORIES } from '@cep/shared';
import { LoadingSpinner, ProgressBar, EmptyState, Modal } from '../../components/ui/Common';
import { Gift, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DonationsPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [donateModal, setDonateModal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  useDonationRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['donation-items', categoryFilter],
    queryFn: () =>
      donationItemApi
        .getAll(categoryFilter !== 'all' ? { category_id: categoryFilter } : {})
        .then((r) => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['donation-categories'],
    queryFn: () => donationItemApi.getCategories().then((r) => r.data),
  });

  const donateMutation = useMutation({
    mutationFn: (payload) => donationApi.create(payload),
    onSuccess: () => {
      toast.success('Donation pledged successfully!');
      setDonateModal(null);
      setQuantity(1);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['donation-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || 'Failed to pledge donation'),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const items = (data?.items || []).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Needed Items</h1>
        <p className="text-gray-500">Browse items needed by the orphanage and make a donation</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Items Found"
          description={search ? 'No items match your search.' : 'No donation items are currently listed.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const fulfilled = item.fulfilled_qty || 0;
            const needed = item.quantity_needed;
            const pct = needed > 0 ? Math.round((fulfilled / needed) * 100) : 0;
            const remaining = Math.max(0, needed - fulfilled);

            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {item.donation_categories?.name || item.category?.name || 'Uncategorized'}
                  </span>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {fulfilled} / {needed} {item.unit}
                    </span>
                  </div>
                  <ProgressBar current={fulfilled} target={needed} />
                  {remaining > 0 ? (
                    <p className="text-xs text-amber-600">
                      Still needs {remaining} {item.unit}
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Fully fulfilled!</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setDonateModal(item);
                    setQuantity(1);
                  }}
                  className="btn-primary w-full text-sm"
                >
                  <Gift className="w-4 h-4 inline mr-1" />
                  Donate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Donate Modal */}
      <Modal
        isOpen={!!donateModal}
        onClose={() => setDonateModal(null)}
        title="Pledge Donation"
      >
        {donateModal && (
          <div className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="font-medium text-primary-800">{donateModal.name}</p>
              <p className="text-sm text-primary-600">
                Unit: {donateModal.unit} | Still needs:{' '}
                {Math.max(0, donateModal.quantity_needed - (donateModal.fulfilled_qty || 0))}{' '}
                {donateModal.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Any additional details..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  donateMutation.mutate({
                    item_id: donateModal.id,
                    quantity,
                    notes: notes || undefined,
                  })
                }
                disabled={donateMutation.isPending}
                className="btn-primary flex-1"
              >
                {donateMutation.isPending ? 'Pledging...' : 'Confirm Pledge'}
              </button>
              <button onClick={() => setDonateModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
