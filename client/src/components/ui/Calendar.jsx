import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

export default function Calendar({ schedules = [], appointments = [], donations = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0=Sun, 1=Mon, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Create empty cells for days before month starts
  const emptyCells = Array(firstDayOfWeek).fill(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getEventsForDay = (day) => {
    const daySchedules = schedules.filter((s) => isSameDay(new Date(s.date), day));
    const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.schedule?.date), day));
    const dayDonations = donations.filter((d) => d.donation_date && isSameDay(new Date(d.donation_date), day));

    return { schedules: daySchedules, appointments: dayAppointments, donations: dayDonations };
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Visit Schedule</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Appointments</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-gray-600">Donations</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyCells.map((_, idx) => (
          <div key={`empty-${idx}`} className="bg-white min-h-[100px]"></div>
        ))}

        {/* Days */}
        {days.map((day, idx) => {
          const events = getEventsForDay(day);
          const hasSchedule = events.schedules.length > 0;
          const hasAppointments = events.appointments.length > 0;
          const hasDonations = events.donations.length > 0;
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`bg-white min-h-[100px] p-2 ${
                !isSameMonth(day, currentMonth) ? 'opacity-40' : ''
              }`}
            >
              <div
                className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  today ? 'bg-primary-600 text-white' : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </div>

              {/* Event indicators */}
              <div className="space-y-1">
                {hasSchedule && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      {events.schedules.length} slot{events.schedules.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {hasAppointments && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      {events.appointments.length} appt{events.appointments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {hasDonations && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      {events.donations.length} donation{events.donations.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
