import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi, appointmentApi, donationApi } from '../../api';
import { useScheduleRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, EmptyState, Modal } from '../../components/ui/Common';
import CalendarView from '../../components/ui/Calendar';
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const emptyForm = { date: '', start_time: '', end_time: '', max_capacity: 10 };

export default function ManageSchedulesPage() {
  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState(null);
  const queryClient = useQueryClient();

  useScheduleRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: () => scheduleApi.getAll().then((r) => r.data),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => appointmentApi.getAll().then((r) => r.data),
  });

  const { data: donationsData } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => donationApi.getAll().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (payload) => scheduleApi.create(payload),
    onSuccess: () => {
      toast.success('Schedule created');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }) => scheduleApi.update(id, payload),
    onSuccess: () => {
      toast.success('Schedule updated');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => scheduleApi.delete(id),
    onSuccess: () => {
      toast.success('Schedule deleted');
      setDeleteModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  const closeForm = () => {
    setFormModal(false);
    setEditItem(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditItem(null);
    setFormModal(true);
  };

  const openEdit = (s) => {
    setForm({ date: s.date, start_time: s.start_time, end_time: s.end_time, max_capacity: s.max_capacity });
    setEditItem(s);
    setFormModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMut.mutate({ id: editItem.id, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const schedules = data?.schedules || [];
  const appointments = appointmentsData?.appointments || [];
  const donations = donationsData?.donations || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Schedules</h1>
        <p className="text-gray-500">Create and manage visiting time slots</p>
      </div>

      {/* Calendar View */}
      <CalendarView schedules={schedules} appointments={appointments} donations={donations} />

      {/* Schedule Details */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Schedule Details</h2>
        {schedules.length === 0 ? (
          <EmptyState icon={Calendar} title="No Schedules" description="Create your first visiting schedule." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold">Capacity</th>
                <th className="pb-3 font-semibold">Bookings</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{format(new Date(s.date), 'MMM d, yyyy')}</td>
                  <td className="py-3">{s.start_time} - {s.end_time}</td>
                  <td className="py-3">{s.max_capacity}</td>
                  <td className="py-3">
                    <span className={s.current_bookings >= s.max_capacity ? 'text-red-600 font-medium' : ''}>
                      {s.current_bookings} / {s.max_capacity}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal(s)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={formModal} onClose={closeForm} title={editItem ? 'Edit Schedule' : 'New Schedule'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
            <input
              type="number"
              min="1"
              value={form.max_capacity}
              onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 1 })}
              className="input-field"
              required
            />
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
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Schedule">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this schedule? Any associated appointments will be affected.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => deleteMut.mutate(deleteModal?.id)}
              disabled={deleteMut.isPending}
              className="btn-danger flex-1"
            >
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
