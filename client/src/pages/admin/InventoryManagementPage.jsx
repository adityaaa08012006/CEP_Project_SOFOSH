import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { useInventoryRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, ProgressBar, EmptyState, Modal } from '../../components/ui/Common';
import { Package, Search, Edit2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function InventoryManagementPage() {
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editQty, setEditQty] = useState('');
  const queryClient = useQueryClient();

  useInventoryRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryApi.getAll().then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, current_qty }) => inventoryApi.update(id, { current_qty }),
    onSuccess: () => {
      toast.success('Inventory updated');
      setEditModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-report'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const inventory = (data?.inventory || []).filter((inv) =>
    (inv.donation_items?.name || inv.item?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requirements</h1>
          <p className="text-gray-500">View and adjust current stock levels</p>
        </div>
        <Link to="/admin/pdf-upload" className="btn-primary flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Upload PDF</span>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {inventory.length === 0 ? (
        <EmptyState icon={Package} title="No Inventory" description="No inventory records found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold">Item</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Current Qty</th>
                <th className="pb-3 font-semibold">Needed</th>
                <th className="pb-3 font-semibold min-w-[140px]">Progress</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((inv) => {
                const itemName = inv.donation_items?.name || inv.item?.name || 'Unknown';
                const catName = inv.donation_items?.donation_categories?.name || inv.item?.category?.name || '-';
                const needed = inv.donation_items?.quantity_needed || inv.item?.quantity_needed || 0;
                const unit = inv.donation_items?.unit || inv.item?.unit || '';

                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{itemName}</td>
                    <td className="py-3 text-gray-500">{catName}</td>
                    <td className="py-3">{inv.current_qty} {unit}</td>
                    <td className="py-3">{needed} {unit}</td>
                    <td className="py-3">
                      <ProgressBar current={inv.current_qty} target={needed} />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => { setEditModal(inv); setEditQty(inv.current_qty.toString()); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Qty Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Update Stock">
        {editModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Update current quantity for <strong>{editModal.donation_items?.name || editModal.item?.name}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <input
                type="number"
                min="0"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => updateMut.mutate({ id: editModal.id, current_qty: parseInt(editQty) })}
                disabled={updateMut.isPending}
                className="btn-primary flex-1"
              >
                {updateMut.isPending ? 'Saving...' : 'Update'}
              </button>
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
