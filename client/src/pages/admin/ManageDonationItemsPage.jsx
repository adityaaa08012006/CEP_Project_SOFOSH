import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationItemApi } from '../../api';
import { useDonationRealtime } from '../../hooks/useRealtime';
import { UNITS } from '@cep/shared';
import { LoadingSpinner, EmptyState, Modal } from '../../components/ui/Common';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', category_id: '', quantity_needed: 1, unit: 'pieces' };

export default function ManageDonationItemsPage() {
  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState(null);
  const queryClient = useQueryClient();

  useDonationRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donation-items'],
    queryFn: () => donationItemApi.getAll().then((r) => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['donation-categories'],
    queryFn: () => donationItemApi.getCategories().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (payload) => donationItemApi.create(payload),
    onSuccess: () => { toast.success('Item created'); closeForm(); queryClient.invalidateQueries({ queryKey: ['admin-donation-items'] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }) => donationItemApi.update(id, payload),
    onSuccess: () => { toast.success('Item updated'); closeForm(); queryClient.invalidateQueries({ queryKey: ['admin-donation-items'] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => donationItemApi.delete(id),
    onSuccess: () => { toast.success('Item deleted'); setDeleteModal(null); queryClient.invalidateQueries({ queryKey: ['admin-donation-items'] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  const closeForm = () => { setFormModal(false); setEditItem(null); setForm(emptyForm); };

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setFormModal(true); };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      quantity_needed: item.quantity_needed,
      unit: item.unit,
    });
    setEditItem(item);
    setFormModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, quantity_needed: parseInt(form.quantity_needed) };
    if (editItem) updateMut.mutate({ id: editItem.id, ...payload });
    else createMut.mutate(payload);
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const items = data?.items || [];
  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Donation Items</h1>
          <p className="text-gray-500">Add, edit, or remove needed items</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4 inline mr-1" /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="No Items" description="Add donation items for donors to contribute to." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Needed</th>
                <th className="pb-3 font-semibold">Fulfilled</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3 text-gray-500">{item.donation_categories?.name || item.category?.name || '-'}</td>
                  <td className="py-3">{item.quantity_needed} {item.unit}</td>
                  <td className="py-3">{item.fulfilled_qty || 0} {item.unit}</td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={formModal} onClose={closeForm} title={editItem ? 'Edit Item' : 'New Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field" required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Needed</label>
              <input type="number" min="1" value={form.quantity_needed} onChange={(e) => setForm({ ...form, quantity_needed: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
              {createMut.isPending || updateMut.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Item">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This may affect linked donations and inventory.
          </p>
          <div className="flex space-x-3">
            <button onClick={() => deleteMut.mutate(deleteModal?.id)} disabled={deleteMut.isPending} className="btn-danger flex-1">
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
