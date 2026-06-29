import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

interface SuperAdminNavbarProps {
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (c: boolean) => void;
}

export default function SuperAdminNavbar({ setMobileOpen, isCollapsed, setIsCollapsed }: SuperAdminNavbarProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifPopoverOpen(false);
      }
    };

    if (notifPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifPopoverOpen]);

  const handleLogout = () => {
    localStorage.removeItem('super_admin_auth');
    window.location.href = '/';
  };

  const getModuleName = () => {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('companies')) return 'Companies';
    if (path.includes('subscriptions')) return 'Subscriptions';
    if (path.includes('support')) return 'Support Tickets';
    if (path.includes('announcements')) return 'Announcements';
    if (path.includes('users')) return 'User & Roles';
    if (path.includes('audit-logs')) return 'Audit Logs';
    return 'Super Admin';
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sm:px-8 shadow-sm dark:shadow-gray-950/30">
      {/* Mobile Toggle & Module Name & Universal Search Layout */}
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-slate-150 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 duration-150"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        <div className="hidden sm:flex items-center space-x-3 pr-4 border-r border-slate-200 dark:border-gray-700 leading-none shrink-0">
          <button
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            className="hidden md:flex p-1.5 -ml-1.5 rounded-md hover:bg-slate-150 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 duration-300 ease-in-out transition-all hover:scale-110"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 tracking-tight">
            {getModuleName()}
          </h2>
        </div>
      </div>

      {/* Right Navbar Controls */}
      <div className="flex items-center space-x-4">
        
        {/* Notifications (Mock) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 duration-150 border border-transparent shadow-sm"
          >
            <Bell className="w-5.5 h-5.5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1 rounded-full min-w-4.5 text-center leading-none py-0.5 shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {notifPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/40 border border-gray-200 dark:border-gray-700 py-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between px-4 pb-2.5 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">Alerts & Notifications</span>
                </div>
              </div>
              <div className="px-4 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {notifications.length > 0 ? (
                  notifications.map(n => <div key={n.id}>{n.title}</div>)
                ) : (
                  <span>No new notifications.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 duration-150 border border-transparent shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] bg-white border border-gray-200 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150 font-medium text-sm"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
