import { useQuery } from '@tanstack/react-query';
import { appointmentApi, donationApi, inventoryApi, userApi } from '../../api';
import { useAppointmentRealtime, useDonationRealtime, useInventoryRealtime } from '../../hooks/useRealtime';
import { LoadingSpinner, StatCard } from '../../components/ui/Common';
import { Users, Calendar, Gift, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { APPOINTMENT_STATUS, DONATION_STATUS } from '@cep/shared';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of orphanage operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} color="blue" />
        <StatCard
          icon={Clock}
          label="Pending Appointments"
          value={pendingAppointments.length}
          color="amber"
        />
        <StatCard
          icon={Gift}
          label="Pending Donations"
          value={pendingDonations.length}
          color="purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Items Needed"
          value={deficitItems.length}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <span>Today's Approved Visits</span>
          </h2>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-gray-500">No visits scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {apt.profiles?.full_name || apt.user?.full_name || 'Visitor'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {apt.visiting_schedules?.start_time || apt.schedule?.start_time} -{' '}
                      {apt.visiting_schedules?.end_time || apt.schedule?.end_time} | {apt.num_visitors} visitors
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Pending Actions</span>
          </h2>
          <div className="space-y-3">
            {pendingAppointments.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-amber-800">Appointment Requests</p>
                  <p className="text-xs text-amber-600">{pendingAppointments.length} awaiting approval</p>
                </div>
                <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                  {pendingAppointments.length}
                </span>
              </div>
            )}
            {pendingDonations.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-purple-800">Donations to Verify</p>
                  <p className="text-xs text-purple-600">{pendingDonations.length} pledges to confirm</p>
                </div>
                <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                  {pendingDonations.length}
                </span>
              </div>
            )}
            {deficitItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-red-800">Items Needed</p>
                  <p className="text-xs text-red-600">{deficitItems.length} items below needed quantity</p>
                </div>
                <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                  {deficitItems.length}
                </span>
              </div>
            )}
            {pendingAppointments.length === 0 && pendingDonations.length === 0 && deficitItems.length === 0 && (
              <p className="text-sm text-gray-500">All caught up! No pending actions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
