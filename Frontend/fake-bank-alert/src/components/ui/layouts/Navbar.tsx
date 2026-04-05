import { Shield, Plus, LogOut, Menu, X, User, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, token, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!token && !!user;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-2 rounded-xl shadow-md">
              <Shield className="w-6 h-6 text-teal-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 leading-tight">FBA</span>
              <span className="text-[10px] text-slate-500 leading-tight -mt-0.5">Detector</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {/* Authenticated Links */}
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/alerts-history"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  History
                </Link>

                {/* Create Alert Button */}
                <Link
                  to="/create-alert"
                  className="p-2 ml-1 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                  title="Create Alert"
                >
                  <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                </Link>

                {/* User Dropdown Menu */}
                <div className="relative ml-3" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user?.name || user?.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Dashboard
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <div className="border-t border-slate-200 my-1"></div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Public Links */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Login
                </Link>
                <Link to="/register">
                  <Button className="ml-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {/* Authenticated Mobile Links */}
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/alerts-history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  History
                </Link>

                {/* Create Alert Button - Mobile */}
                <Link
                  to="/create-alert"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                  Create Alert
                </Link>

                {/* User Info Section - Mobile */}
                <div className="border-t border-slate-200 mt-4 pt-4">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {getUserInitials()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>

                  {/* Logout Button - Mobile */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Public Mobile Links */}
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}