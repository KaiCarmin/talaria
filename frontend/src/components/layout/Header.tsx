import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { athlete, logout } = useAuth();

  const handleSync = async () => {
    // TODO: Implement sync functionality in Phase 4
    console.log('Sync activities');
    alert('Sync functionality will be implemented in Phase 4');
  };

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
        title="Toggle menu"
      >
        ☰
      </button>

      {/* Center - Page title or search (can be extended later) */}
      <div className="flex-1 flex items-center justify-center lg:justify-start">
        <h2 className="text-lg font-semibold text-gray-800">
          {/* Page title will be dynamic in future */}
        </h2>
      </div>

      {/* Right side - User info and actions */}
      <div className="flex items-center space-x-4">
        {/* Sync Button */}
        <button
          onClick={handleSync}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
          title="Sync activities from Strava"
        >
          Sync
        </button>

        {/* User Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {athlete?.firstname?.[0]}{athlete?.lastname?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {athlete?.firstname} {athlete?.lastname}
              </p>
            </div>
            <span className="text-xs text-gray-500">▼</span>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {athlete?.firstname} {athlete?.lastname}
                </p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
