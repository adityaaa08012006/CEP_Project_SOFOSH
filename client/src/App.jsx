import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, UserRoute, AdminRoute, PublicRoute } from './routes/Guards';
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import SchedulesPage from './pages/user/SchedulesPage';
import AppointmentsPage from './pages/user/AppointmentsPage';
import DonationsPage from './pages/user/DonationsPage';
import MyDonationsPage from './pages/user/MyDonationsPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSchedulesPage from './pages/admin/ManageSchedulesPage';
import ManageAppointmentsPage from './pages/admin/ManageAppointmentsPage';
import ManageDonationsPage from './pages/admin/ManageDonationsPage';
import InventoryManagementPage from './pages/admin/InventoryManagementPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import PdfUploadPage from './pages/admin/PdfUploadPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function RoleRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* User-only routes */}
            <Route element={<UserRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/donations" element={<DonationsPage />} />
                <Route path="/my-donations" element={<MyDonationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/schedules" element={<ManageSchedulesPage />} />
                <Route path="/admin/appointments" element={<ManageAppointmentsPage />} />
                <Route path="/admin/donations" element={<ManageDonationsPage />} />
                <Route path="/admin/inventory" element={<InventoryManagementPage />} />
                <Route path="/admin/users" element={<ManageUsersPage />} />
                <Route path="/admin/pdf-upload" element={<PdfUploadPage />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Smart root redirect based on role */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RoleRedirect />} />
            </Route>

            {/* 404 catch-all */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300">404</h1>
                    <p className="text-gray-500 mt-2">Page not found</p>
                    <a href="/dashboard" className="btn-primary inline-block mt-4">
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '8px', padding: '12px 16px' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
