import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../api';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { APPOINTMENT_STATUS } from '@cep/shared';
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common';
import { Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManageAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
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
                    {format(new Date(apt.visiting_schedules?.date || apt.schedule?.date || apt.created_at), 'MMM d, yyyy')}{' '}
                    | {apt.visiting_schedules?.start_time || apt.schedule?.start_time} -{' '}
                    {apt.visiting_schedules?.end_time || apt.schedule?.end_time}
                  </p>
                  <p className="text-sm text-gray-500">
                    Visitors: {apt.num_visitors} | Email: {apt.profiles?.email || apt.user?.email || 'N/A'}
                  </p>
                  {apt.purpose && (
                    <p className="text-sm text-gray-600">Purpose: {apt.purpose}</p>
                  )}
                </div>

                {apt.status === APPOINTMENT_STATUS.PENDING && (
                  <div className="flex space-x-2 self-end sm:self-center">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
