import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, appointmentApi } from '../../api';
import { useScheduleRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, Modal, EmptyState } from '../../components/ui/Common';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [numVisitors, setNumVisitors] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [booking, setBooking] = useState(false);

  useScheduleRealtime();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleApi.getAll({ active_only: 'true' }).then((r) => r.data),
  });

  // Fetch confirmed appointments to display on calendar
  const { data: appointmentsData } = useQuery({
    queryKey: ['confirmed-appointments-calendar'],
    queryFn: () => appointmentApi.getAll({ status: 'confirmed' }).then((r) => r.data),
  });

  const handleBook = async () => {
    if (!selectedSchedule) return;
    setBooking(true);
    try {
      await appointmentApi.book({
        schedule_id: selectedSchedule.id,
        num_visitors: numVisitors,
        purpose: purpose || undefined,
      });
      toast.success('Appointment booked successfully! Awaiting admin approval.');
      setBookingModal(false);
      setSelectedSchedule(null);
      setNumVisitors(1);
      setPurpose('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const schedules = (data?.schedules || []).filter(
    (s) => !isBefore(new Date(s.date), startOfDay(new Date()))
  );

  const confirmedAppointments = (appointmentsData?.appointments || []).filter(
    (apt) => apt.date && !isBefore(new Date(apt.date), startOfDay(new Date()))
  );

  // Group by date
  const grouped = {};
  
  // Add schedules
  schedules.forEach((s) => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push({ type: 'schedule', data: s });
  });

  // Add confirmed appointments
  confirmedAppointments.forEach((apt) => {
    if (!grouped[apt.date]) grouped[apt.date] = [];
    grouped[apt.date].push({ type: 'appointment', data: apt });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visiting Schedules</h1>
        <p className="text-gray-500">Browse available time slots and book your visit</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Schedules Available"
          description="There are no upcoming visiting schedules at the moment. Please check back later."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([date, items]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, idx) => {
                  if (item.type === 'schedule') {
                    const slot = item.data;
                    const available = slot.max_capacity - slot.current_bookings;
                    const isFull = available <= 0;

                    return (
                      <div
                        key={`schedule-${slot.id}`}
                        className={`card cursor-pointer transition-all hover:shadow-md ${
                          isFull ? 'opacity-60' : 'hover:border-primary-300'
                        }`}
                        onClick={() => {
                          if (!isFull) {
                            setSelectedSchedule(slot);
                            setBookingModal(true);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 text-primary-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                          </div>
                          {isFull ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Full</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              {available} spots left
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{slot.current_bookings} / {slot.max_capacity} booked</span>
                        </div>
                        {!isFull && (
                          <button className="btn-primary w-full mt-4 text-sm">
                            Book This Slot
                          </button>
                        )}
                      </div>
                    );
                  } else {
                    // Display confirmed appointment
                    const apt = item.data;
                    return (
                      <div
                        key={`appointment-${apt.id}`}
                        className="card bg-blue-50 border-blue-200 !p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 text-blue-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{apt.start_time} - {apt.end_time}</span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Confirmed
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Users className="w-4 h-4" />
                            <span>{apt.num_visitors} visitor{apt.num_visitors > 1 ? 's' : ''}</span>
                          </div>
                          {apt.purpose && (
                            <p className="text-sm text-gray-600 line-clamp-2">{apt.purpose}</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={bookingModal} onClose={() => setBookingModal(false)} title="Book Appointment">
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="font-medium text-primary-800">
                {format(new Date(selectedSchedule.date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-primary-600">
                {selectedSchedule.start_time} - {selectedSchedule.end_time}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                {selectedSchedule.max_capacity - selectedSchedule.current_bookings} spots available
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Visitors</label>
              <input
                type="number"
                min="1"
                max={selectedSchedule.max_capacity - selectedSchedule.current_bookings}
                value={numVisitors}
                onChange={(e) => setNumVisitors(parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (optional)</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Reason for your visit..."
              />
            </div>

            <div className="flex space-x-3">
              <button onClick={handleBook} disabled={booking} className="btn-primary flex-1">
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button onClick={() => setBookingModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
