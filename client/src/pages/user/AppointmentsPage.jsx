import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../api';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { APPOINTMENT_STATUS } from '@cep/shared';
import { LoadingSpinner, StatusBadge, EmptyState, Modal } from '../../components/ui/Common';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState(null);
  const queryClient = useQueryClient();

  useAppointmentRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () =>
      appointmentApi
        .getAll(statusFilter !== 'all' ? { status: statusFilter } : {})
        .then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      setCancelModal(null);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <p className="text-gray-500">Track and manage your visiting appointments</p>
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
        <EmptyState
          icon={Calendar}
          title="No Appointments"
          description={
            statusFilter === 'all'
              ? "You haven't booked any appointments yet."
              : `No ${statusFilter} appointments found.`
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold">
                      {format(new Date(apt.visiting_schedules?.date || apt.schedule?.date || apt.created_at), 'MMMM d, yyyy')}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {apt.visiting_schedules?.start_time || apt.schedule?.start_time || 'N/A'} -{' '}
                        {apt.visiting_schedules?.end_time || apt.schedule?.end_time || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{apt.num_visitors} visitor(s)</span>
                    </div>
                  </div>

                  {apt.purpose && (
                    <p className="text-sm text-gray-600 ml-8">
                      <span className="font-medium">Purpose:</span> {apt.purpose}
                    </p>
                  )}
                </div>

                {apt.status === APPOINTMENT_STATUS.PENDING && (
                  <button
                    onClick={() => setCancelModal(apt)}
                    className="btn-danger text-sm self-end sm:self-center"
                  >
                    Cancel
                  </button>
                )}
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
          <div className="flex items-start space-x-3 text-amber-700 bg-amber-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
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
