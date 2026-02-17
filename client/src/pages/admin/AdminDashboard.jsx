import { useQuery } from '@tanstack/react-query';
import { appointmentApi, donationApi, inventoryApi, userApi } from '../../api';
import { useAppointmentRealtime, useDonationRealtime, useInventoryRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner } from '../../components/ui/Common';
import { Users, Calendar, Gift, Package, AlertCircle, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { APPOINTMENT_STATUS, DONATION_STATUS } from '@cep/shared';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  useAppointmentRealtime();
  useDonationRealtime();
  useInventoryRealtime();

  const { data: appointmentsData, isLoading: l1 } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => appointmentApi.getAll().then((r) => r.data),
  });

  const { data: donationsData, isLoading: l2 } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => donationApi.getAll().then((r) => r.data),
  });

  const { data: inventoryData, isLoading: l3 } = useQuery({
    queryKey: ['admin-inventory-report'],
    queryFn: () => inventoryApi.getReport().then((r) => r.data),
  });

  const { data: usersData, isLoading: l4 } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userApi.getAll().then((r) => r.data),
  });

  if (l1 || l2 || l3 || l4) return <LoadingSpinner className="py-20" />;

  const appointments = appointmentsData?.appointments || [];
  const donations = donationsData?.donations || [];
  const report = inventoryData?.report || [];
  const users = usersData?.users || [];

  const pendingAppointments = appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING);
  const pendingDonations = donations.filter((d) => d.status === DONATION_STATUS.PLEDGED);
  const deficitItems = report.filter((r) => r.status === 'deficit');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(
    (a) =>
      (a.visiting_schedules?.date || a.schedule?.date) === todayStr &&
      a.status === APPOINTMENT_STATUS.APPROVED
  );

  const totalPendingActions = pendingAppointments.length + pendingDonations.length + deficitItems.length;

  return (
    <div className="space-y-8 animate-fade-in-slow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage orphanage operations</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
          <Activity className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">System Status</p>
            <p className="font-semibold text-gray-900">All Systems Active</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-gray-600">Active community</span>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300 border-l-4 border-amber-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{pendingAppointments.length}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/appointments" className="text-sm text-amber-600 hover:underline font-medium">
              Review now →
            </Link>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300 border-l-4 border-purple-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Donations</p>
              <p className="text-3xl font-bold text-gray-900">{pendingDonations.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/donations" className="text-sm text-purple-600 hover:underline font-medium">
              Verify now →
            </Link>
          </div>
        </div>

        <div className="card-modern group hover:shadow-lg transition-all duration-300 border-l-4 border-red-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Items Needed</p>
              <p className="text-3xl font-bold text-gray-900">{deficitItems.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/inventory" className="text-sm text-red-600 hover:underline font-medium">
              View inventory →
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {totalPendingActions > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Action Required</h3>
              <p className="text-gray-600 mt-1">
                You have <span className="font-semibold">{totalPendingActions}</span> pending action{totalPendingActions !== 1 ? 's' : ''} that require your attention.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Today's Approved Visits</h2>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {todayAppointments.length}
            </span>
          </div>
          
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No visits scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div 
                  key={apt.id} 
                  className="flex items-center justify-between p-4 bg-green-50/50 hover:bg-green-50 rounded-xl border border-green-200 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {apt.profiles?.full_name || apt.user?.full_name || 'Visitor'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {apt.visiting_schedules?.start_time || apt.schedule?.start_time} -{' '}
                        {apt.visiting_schedules?.end_time || apt.schedule?.end_time} • {apt.num_visitors} visitor{apt.num_visitors !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Actions</h2>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
              {totalPendingActions}
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingAppointments.length > 0 && (
              <Link 
                to="/admin/appointments"
                className="flex items-center justify-between p-4 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Appointment Requests</p>
                    <p className="text-sm text-gray-600">{pendingAppointments.length} awaiting approval</p>
                  </div>
                </div>
                <span className="text-amber-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
            
            {pendingDonations.length > 0 && (
              <Link 
                to="/admin/donations"
                className="flex items-center justify-between p-4 bg-purple-50/50 hover:bg-purple-50 rounded-xl border border-purple-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Donations to Verify</p>
                    <p className="text-sm text-gray-600">{pendingDonations.length} pledge{pendingDonations.length !== 1 ? 's' : ''} to confirm</p>
                  </div>
                </div>
                <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
            
            {deficitItems.length > 0 && (
              <Link 
                to="/admin/inventory"
                className="flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-50 rounded-xl border border-red-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Package className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Items Needed</p>
                    <p className="text-sm text-gray-600">{deficitItems.length} item{deficitItems.length !== 1 ? 's' : ''} below needed quantity</p>
                  </div>
                </div>
                <span className="text-red-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
            
            {totalPendingActions === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-500 font-medium">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No pending actions at the moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
