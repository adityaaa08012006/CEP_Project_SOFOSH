import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Calendar, Gift, Package, User, LogOut, Menu, X, Shield, List,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import logo from '../../assets/sofosh.png';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/current-requirements', label: 'Current Needs', icon: List },
    { to: '/schedules', label: 'Schedules', icon: Calendar },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/donations', label: 'Donate', icon: Gift },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: Home },
    { to: '/admin/current-requirements', label: 'Current Needs', icon: List },
    { to: '/admin/schedules', label: 'Schedules', icon: Calendar },
    { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { to: '/admin/donations', label: 'Donations', icon: Gift },
    { to: '/admin/pdf-upload', label: 'Add Requirements', icon: Package },
    { to: '/admin/users', label: 'Users', icon: User },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center">
              <img src={logo} alt="SOFOSH" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <span className="hidden sm:flex items-center space-x-1 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </span>
            )}
            <div className="hidden md:flex items-center space-x-2">
              <Link to={isAdmin ? '/admin/profile' : '/profile'} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 p-2" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              to={isAdmin ? '/admin/profile' : '/profile'}
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
