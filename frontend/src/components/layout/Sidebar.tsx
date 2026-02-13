import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  path: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Activities', path: '/activities' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Statistics', path: '/statistics' },
    { name: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`${
        isOpen ? 'w-52' : 'w-12'
      } bg-white border-r border-gray-200 transition-all duration-200 flex flex-col flex-shrink-0`}
    >
      {/* Logo Section */}
      <div className="h-14 flex items-center border-b border-gray-200 px-3">
        {isOpen ? (
          <h1 className="text-lg font-bold text-blue-600">Talaria</h1>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="Expand sidebar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {isOpen && (
        <>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Collapse Button */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="ml-1">Collapse</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
