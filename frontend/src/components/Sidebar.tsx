/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCMS } from '../context/CMSContext';
import { useTheme } from '../hooks/useTheme';
import { ModuleType } from '../types';
import {
  LayoutDashboard,
  Contact,
  Car,
  MapPin,
  Clock,
  Briefcase,
  Ticket,
  Radio,
  Fuel,
  Wrench,
  ShieldCheck,
  FileText,
  FileSignature,
  BarChart3,
  Bell,
  History,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
}

export default function Sidebar({ mobileOpen, setMobileOpen, isCollapsed }: SidebarProps) {
  const { activeModule, setActiveModule, notifications, currentUser, hasPermission } = useCMS();
  const { isDark } = useTheme();
  const [moduleSearch, setModuleSearch] = useState('');

  // Unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Icons mapper matching all 20 modules exactly
  const getModuleIcon = (module: ModuleType) => {
    switch (module) {
      case 'Dashboard':
        return <LayoutDashboard className="w-5 h-5" />;
      case 'Driver Management':
        return <Contact className="w-5 h-5" />;
      case 'Vehicle Management':
        return <Car className="w-5 h-5" />;
      case 'Trip Management':
        return <MapPin className="w-5 h-5" />;
      case 'Vendor Management':
        return <Briefcase className="w-5 h-5" />;
      case 'Booking Management':
        return <Ticket className="w-5 h-5" />;
      case 'Live Tracking':
        return <Radio className="w-5 h-5 animate-pulse text-blue-500" />;
      case 'Fuel Management':
        return <Fuel className="w-5 h-5" />;
      case 'Maintenance Management':
        return <Wrench className="w-5 h-5" />;
      case 'Compliance Management':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Contract Management':
        return <FileSignature className="w-5 h-5" />;
      case 'Reports & Analytics':
        return <BarChart3 className="w-5 h-5" />;
      case 'Notifications':
        return (
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
        );
      case 'Audit Logs':
        return <History className="w-5 h-5" />;
      case 'User Management':
        return <ShieldAlert className="w-5 h-5" />;
      case 'Settings':
        return <Settings className="w-5 h-5" />;
      case 'Support Tickets':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  // Main 20 top level modules list
  const allModules: ModuleType[] = [
    'Dashboard',
    'Driver Management',
    'Vehicle Management',
    'Trip Management',
    'Vendor Management',
    'Booking Management',
    'Live Tracking',
    'Fuel Management',
    'Maintenance Management',
    'Compliance Management',
    'Contract Management',
    'Reports & Analytics',
    'Notifications',
    'Audit Logs',
    'User Management',
    'Support Tickets',
    'Settings'
  ];

  const modulePermissionKeys: Record<string, string> = {
    'Dashboard': 'dashboard',
    'Driver Management': 'driver_management',
    'Vehicle Management': 'vehicle_management',
    'Trip Management': 'trip_management',
    'Vendor Management': 'vendor_management',
    'Booking Management': 'booking_management',
    'Live Tracking': 'live_tracking',
    'Fuel Management': 'fuel_management',
    'Maintenance Management': 'maintenance_management',
    'Compliance Management': 'compliance_management',
    'Contract Management': 'contract_management',
    'Reports & Analytics': 'reports_analytics',
    'Notifications': 'notifications',
    'Audit Logs': 'audit_logs',
    'User Management': 'user_roles',
    'Support Tickets': 'support_tickets',
    'Settings': 'company_settings'
  };

  // Filter modules based on module sidebar search and permissions
  const filteredModules = allModules.filter((module) => {
    const permKey = modulePermissionKeys[module];
    const hasPerm = permKey ? hasPermission(permKey, 'view') : true;
    return module.toLowerCase().includes(moduleSearch.toLowerCase()) && hasPerm;
  });

  const handleModuleClick = (module: ModuleType) => {
    setActiveModule(module);
    setMobileOpen(false);
  };

  // Sidebar content
  const sidebarContent = (
    <div className={`flex flex-col h-full border-r shadow-xl transition-all duration-300 ease-in-out ${
      isDark ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'
    } ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Sidebar Header Brand */}
      <div 
        className={`py-5 flex items-center border-b transition-all duration-300 ease-in-out relative ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        } ${isCollapsed ? 'justify-center px-1' : 'justify-start px-4'}`}
      >
        <div className="flex items-center overflow-hidden">
          {/* Logo/Brand section */}
          <div className="text-blue-600 dark:text-blue-500 flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out">
            <Car className="w-8 h-8" />
          </div>
          <div className={`leading-tight transition-all duration-300 ease-in-out origin-left overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4 ml-0' : 'max-w-[200px] opacity-100 translate-x-0 ml-3'}`}>
            <span className={`font-extrabold tracking-tight text-base block uppercase ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Pulpit Cab</span>
          </div>
        </div>
      </div>

      {/* Module quick filter search (hides if collapsed) */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'h-0 opacity-0 border-transparent py-0' : 'h-[53px] px-4 py-3 border-b opacity-100'} ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-slate-50'
      }`} id="module-search-box">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search modules..."
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            className={`w-full text-xs pl-9 pr-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500 duration-150 transition-colors ${
              isDark 
                ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500 focus:bg-gray-800' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white'
            }`}
          />
        </div>
      </div>

      {/* Scrollable Nav Item List */}
      <div className={`flex-1 overflow-y-auto py-4 space-y-0.5 custom-scrollbar transition-all duration-300 ease-in-out ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {filteredModules.map((module) => {
          const isActive = activeModule === module;
          return (
            <button
              key={module}
              id={`sidebar-item-${module.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleModuleClick(module)}
              className={`w-full flex items-center py-2.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              } ${
                isActive
                  ? isDark ? 'bg-blue-900/20 text-blue-400 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? module : undefined}
            >
              {/* Active Menu Indicator (Blue Strip) */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-md shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
              
              <div className={`transition-all duration-300 ease-in-out ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-400' : 'text-gray-500')} ${isActive && !isCollapsed ? 'ml-1' : ''}`}>
                {getModuleIcon(module)}
              </div>
              
              <div className={`text-left flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4 ml-0' : 'flex-1 opacity-100 translate-x-0 ml-3'}`}>
                  <span className="truncate">{module}</span>
                  {module === 'Notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {unreadCount}
                    </span>
                  )}
                  {module === 'Live Tracking' && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                      isDark 
                        ? 'bg-green-900/60 text-green-300 border-green-500/30' 
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      LIVE
                    </span>
                  )}
              </div>
            </button>
          );
        })}

        {filteredModules.length === 0 && (
          <div className={`text-center py-6 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No modules matched search query
          </div>
        )}
      </div>

      {/* User Session card (compact/collapsed option) */}
      <div className={`p-4 border-t transition-colors duration-200 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`} id="sidebar-user-footer">
        {isCollapsed ? (
          <div className="flex justify-center">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={currentUser.name}
              className={`w-10 h-10 rounded-full border shadow-sm ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
              }`}
              title={`${currentUser.name} (${currentUser.role})`}
            />
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={currentUser.name}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs border shrink-0 object-cover ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{currentUser.name}</p>
              <p className={`text-[10px] uppercase font-bold tracking-tight ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full relative">
          <button
            onClick={() => setMobileOpen(false)}
            className={`absolute top-4 -right-12 rounded-r-md p-2 shadow-md md:hidden transition-colors ${
              isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
            }`}
            id="mobile-sidebar-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop Sidebar (Permanent Column) */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}>
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
