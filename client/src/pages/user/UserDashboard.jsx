import { useQuery } from '@tanstack/react-query';
import { appointmentApi, donationApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { StatCard, StatusBadge, LoadingSpinner } from '../../components/ui/Common';
import { Calendar, Gift, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import logo from '../../assets/sofosh.png';

export default function UserDashboard() {
  const { user } = useAuth();
  useAppointmentRealtime();

  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentApi.getAll().then((r) => r.data),
  });

  const { data: donData, isLoading: donLoading } = useQuery({
    queryKey: ['donations'],
    queryFn: () => donationApi.getAll().then((r) => r.data),
  });

  if (apptLoading || donLoading) return <LoadingSpinner className="py-20" />;

  const appointments = apptData?.appointments || [];
  const donations = donData?.donations || [];

  const upcomingAppts = appointments.filter(
    (a) => a.status === 'approved' && a.schedule?.date >= new Date().toISOString().split('T')[0]
  );
  const pendingAppts = appointments.filter((a) => a.status === 'pending');
  const totalDonated = donations.filter((d) => d.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="h-16 w-auto" />
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name}!</h1>
          <p className="text-gray-500">Here's an overview of your activity</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Appointments" value={appointments.length} color="primary" />
        <StatCard icon={Clock} label="Pending Approval" value={pendingAppts.length} color="orange" />
        <StatCard icon={CheckCircle} label="Upcoming Visits" value={upcomingAppts.length} color="green" />
        <StatCard icon={Gift} label="Donations Verified" value={totalDonated} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {upcomingAppts.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppts.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{appt.schedule?.date ? format(new Date(appt.schedule.date), 'MMM d, yyyy') : 'N/A'}</p>
                    <p className="text-sm text-gray-500">{appt.schedule?.start_time} - {appt.schedule?.end_time}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Donations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Donations</h2>
            <Link to="/donations/my" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">No donations yet</p>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 5).map((don) => (
                <div key={don.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{don.item?.name || 'Item'}</p>
                    <p className="text-sm text-gray-500">{don.quantity} {don.item?.unit}</p>
                  </div>
                  <StatusBadge status={don.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/schedules" className="btn-primary">Book a Visit</Link>
          <Link to="/donations" className="btn-success">Make a Donation</Link>
        </div>
      </div>
    </div>
  );
}
