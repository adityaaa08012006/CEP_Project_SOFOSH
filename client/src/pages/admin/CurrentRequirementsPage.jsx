import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationItemApi } from '../../api';
import { LoadingSpinner, EmptyState } from '../../components/ui/Common';
import { Package, TrendingUp, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { UNITS, DONATION_CATEGORIES } from '@cep/shared';

export default function CurrentRequirementsPage() {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['donation-items-active'],
    queryFn: () => donationItemApi.getAll({ active_only: 'true' }).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => donationItemApi.update(id, data),
    onSuccess: () => {
      toast.success('Requirement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['donation-items-active'] });
      setEditingId(null);
      setEditForm({});
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => donationItemApi.delete(id),
    onSuccess: () => {
      toast.success('Requirement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['donation-items-active'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  const deleteAllMut = useMutation({
    mutationFn: async () => {
      const deletePromises = items.map(item => donationItemApi.delete(item.id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      toast.success('All requirements deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['donation-items-active'] });
    },
    onError: (err) => toast.error('Failed to delete all requirements'),
  });

  if (isLoading) return <LoadingSpinner />;

  const items = data?.items || [];

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      required_qty: item.required_qty,
      unit: item.unit,
      category_id: item.category_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id) => {
    updateMut.mutate({ id, data: editForm });
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMut.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirm(`Are you sure you want to delete all ${items.length} requirements? This cannot be undone.`)) {
      deleteAllMut.mutate();
    }
  };

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Current Requirements</h1>
          <p className="text-gray-500">View and manage active donation needs</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMut.isPending}
            className="btn-secondary text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            {deleteAllMut.isPending ? 'Deleting...' : 'Delete All'}
          </button>
        )}
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
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Edit Requirement</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={updateMut.isPending}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={updateMut.isPending}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input-field text-sm w-full mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">Required Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.required_qty}
                        onChange={(e) => setEditForm({ ...editForm, required_qty: parseFloat(e.target.value) })}
                        className="input-field text-sm w-full mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">Unit</label>
                      <select
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="input-field text-sm w-full mt-1"
                      >
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    <p className="text-xs text-gray-500">
                      Fulfilled: {item.fulfilled_qty} {item.unit}
                    </p>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.fulfilled_qty, item.required_qty)}
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleteMut.isPending}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                  </>
                )}
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
