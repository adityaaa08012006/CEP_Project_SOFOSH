import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../api';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { APPOINTMENT_STATUS } from '@cep/shared';
import { LoadingSpinner, StatusBadge, EmptyState, Modal } from '../../components/ui/Common';
import { Calendar, Clock, Users, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    num_visitors: 1,
    purpose: '',
  });
  const queryClient = useQueryClient();

  useAppointmentRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () =>
      appointmentApi
        .getAll(statusFilter !== 'all' ? { status: statusFilter } : {})
        .then((r) => r.data),
  });

  const bookMutation = useMutation({
    mutationFn: (data) => appointmentApi.book(data),
    onSuccess: () => {
      toast.success('Appointment request submitted! Awaiting admin approval.');
      setBookingModal(false);
      setBookingForm({
        date: '',
        start_time: '09:00',
        end_time: '10:00',
        num_visitors: 1,
        purpose: '',
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || 'Failed to book appointment'),
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

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!bookingForm.date) {
      toast.error('Please select a date');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (bookingForm.date < today) {
      toast.error('Cannot book a date in the past');
      return;
    }

    if (bookingForm.start_time >= bookingForm.end_time) {
      toast.error('End time must be after start time');
      return;
    }

    bookMutation.mutate(bookingForm);
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const appointments = data?.appointments || [];
  const statuses = ['all', ...Object.values(APPOINTMENT_STATUS)];

  return (
    <div className="space-y-6 animate-fade-in-slow">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-gray-500">Track and manage your visiting appointments</p>
        </div>
        <button
          onClick={() => setBookingModal(true)}
          className="btn-primary-enhanced flex items-center gap-2 !w-auto"
        >
          <Plus className="w-5 h-5" />
          Book a Visit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-primary-600 text-white shadow-md'
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
            <div key={apt.id} className="card-modern hover:shadow-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 flex-wrap">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">
                      {apt.date ? format(new Date(apt.date), 'MMMM d, yyyy') : 
                       apt.visiting_schedules?.date ? format(new Date(apt.visiting_schedules.date), 'MMMM d, yyyy') :
                       apt.schedule?.date ? format(new Date(apt.schedule.date), 'MMMM d, yyyy') :
                       format(new Date(apt.created_at), 'MMMM d, yyyy')}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {apt.start_time || apt.visiting_schedules?.start_time || apt.schedule?.start_time || 'N/A'} -{' '}
                        {apt.end_time || apt.visiting_schedules?.end_time || apt.schedule?.end_time || 'N/A'}
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

                {(apt.status === APPOINTMENT_STATUS.PENDING || apt.status === APPOINTMENT_STATUS.APPROVED) && (
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

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Book a Visit"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Visit Date <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="input-field-enhanced pl-11"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="time"
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  className="input-field-enhanced pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="time"
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  className="input-field-enhanced pl-11"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Number of Visitors <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="number"
                min="1"
                max="20"
                value={bookingForm.num_visitors}
                onChange={(e) => setBookingForm({ ...bookingForm, num_visitors: parseInt(e.target.value) })}
                className="input-field-enhanced pl-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Purpose of Visit <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>
            </label>
            <textarea
              value={bookingForm.purpose}
              onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
              className="input-field-enhanced min-h-[100px] resize-none"
              placeholder="Please describe the purpose of your visit..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your appointment request will be reviewed by an admin. You'll be notified once it's approved.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={bookMutation.isPending}
              className="btn-primary-enhanced flex-1"
            >
              {bookMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
            <button
              type="button"
              onClick={() => setBookingModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
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
