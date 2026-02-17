import { useQuery } from '@tanstack/react-query';
import { appointmentApi, donationApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointmentRealtime } from '../../hooks/useRealtime';
import { StatCard, StatusBadge, LoadingSpinner } from '../../components/ui/Common';
import { Calendar, Gift, Clock, CheckCircle, TrendingUp, Package } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in-slow">
      {/* Welcome Section */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-100 shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="p-4 bg-white rounded-2xl shadow-md">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name}! 👋</h1>
            <p className="text-gray-600 mt-1">Here's your activity overview</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-gray-600">Track your visits</span>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900">{pendingAppts.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Awaiting review</span>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Visits</p>
              <p className="text-3xl font-bold text-gray-900">{upcomingAppts.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Confirmed schedules</span>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Verified Donations</p>
              <p className="text-3xl font-bold text-gray-900">{totalDonated}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Thank you! 💝</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
            </div>
            <Link 
              to="/appointments" 
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-all"
            >
              View all →
            </Link>
          </div>
          
          {upcomingAppts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No upcoming appointments</p>
              <Link to="/appointments" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Book a visit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppts.slice(0, 5).map((appt) => (
                <div 
                  key={appt.id} 
                  className="flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-all duration-200 cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appt.schedule?.date ? format(new Date(appt.schedule.date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {appt.schedule?.start_time} - {appt.schedule?.end_time}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Donations */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Donations</h2>
            </div>
            <Link 
              to="/donations/my" 
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-all"
            >
              View all →
            </Link>
          </div>
          
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No donations yet</p>
              <Link to="/donations" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Make your first donation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 5).map((don) => (
                <div 
                  key={don.id} 
                  className="flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{don.item?.name || 'Item'}</p>
                      <p className="text-sm text-gray-500">{don.quantity} {don.item?.unit}</p>
                    </div>
                  </div>
                  <StatusBadge status={don.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-modern bg-gradient-to-br from-primary-500 to-accent-500 text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to make a difference?</h2>
        <p className="text-primary-50 mb-6">Take action and support our community</p>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/appointments" 
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book a Visit
          </Link>
          <Link 
            to="/donations" 
            className="inline-flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
          >
            <Gift className="w-5 h-5 mr-2" />
            Make a Donation
          </Link>
        </div>
      </div>
    </div>
  );
}
