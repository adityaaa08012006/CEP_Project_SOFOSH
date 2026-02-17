import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../api';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { APPOINTMENT_STATUS } from '@cep/shared';
import { LoadingSpinner, StatusBadge, EmptyState, Modal } from '../../components/ui/Common';
import { Calendar, Check, X, Ban, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManageAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState(null);
  const queryClient = useQueryClient();

  useAppointmentRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-manage-appointments', statusFilter],
    queryFn: () =>
      appointmentApi
        .getAll(statusFilter !== 'all' ? { status: statusFilter } : {})
        .then((r) => r.data),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => appointmentApi.updateStatus(id, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Appointment ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-manage-appointments'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      setCancelModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-manage-appointments'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || 'Failed to cancel'),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const appointments = data?.appointments || [];
  const statuses = ['all', ...Object.values(APPOINTMENT_STATUS)];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointment Approval</h1>
        <p className="text-gray-500">Review and manage visitor appointment requests</p>
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

      {appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No Appointments" description="No appointments match the selected filter." />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="font-semibold">
                      {apt.profiles?.full_name || apt.user?.full_name || 'Unknown User'}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    📅 {apt.date ? format(new Date(apt.date), 'MMM d, yyyy') : 
                        apt.visiting_schedules?.date ? format(new Date(apt.visiting_schedules.date), 'MMM d, yyyy') :
                        apt.schedule?.date ? format(new Date(apt.schedule.date), 'MMM d, yyyy') :
                        format(new Date(apt.created_at), 'MMM d, yyyy')}
                    {' '} ⏰ {apt.start_time || apt.visiting_schedules?.start_time || apt.schedule?.start_time || 'N/A'} -{' '}
                    {apt.end_time || apt.visiting_schedules?.end_time || apt.schedule?.end_time || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    👥 {apt.num_visitors} visitor(s) | 📧 {apt.profiles?.email || apt.user?.email || 'N/A'}
                  </p>
                  {apt.purpose && (
                    <p className="text-sm text-gray-600">Purpose: {apt.purpose}</p>
                  )}
                </div>

                <div className="flex space-x-2 self-end sm:self-center">
                  {apt.status === APPOINTMENT_STATUS.PENDING && (
                    <>
                      <button
                        onClick={() => updateStatusMut.mutate({ id: apt.id, status: APPOINTMENT_STATUS.APPROVED })}
                        disabled={updateStatusMut.isPending}
                        className="btn-success text-sm flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => updateStatusMut.mutate({ id: apt.id, status: APPOINTMENT_STATUS.REJECTED })}
                        disabled={updateStatusMut.isPending}
                        className="btn-danger text-sm flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {(apt.status === APPOINTMENT_STATUS.PENDING || apt.status === APPOINTMENT_STATUS.APPROVED) && (
                    <button
                      onClick={() => setCancelModal(apt)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Are you sure you want to cancel this appointment?</p>
              <p className="text-amber-600 mt-1">
                User: {cancelModal?.profiles?.full_name || cancelModal?.user?.full_name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => cancelMutation.mutate(cancelModal?.id)}
              disabled={cancelMutation.isPending}
              className="btn-danger flex-1"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
            <button onClick={() => setCancelModal(null)} className="btn-secondary flex-1">
              Keep It
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
