/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCMS } from '../context/CMSContext';
import { useTheme } from '../hooks/useTheme';
import {
  Bell,
  Search,
  Menu,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  Clock,
  User,
  LogOut,
  Sparkles,
  ListFilter,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (c: boolean) => void;
}

export default function Navbar({ setMobileOpen, isCollapsed, setIsCollapsed }: NavbarProps) {
  const {
    currentUser,
    notifications,
    activePopupNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    activeModule,
    setActiveModule,
    logout
  } = useCMS();

  const { theme, toggleTheme, isDark } = useTheme();

  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const unreadNotifs = activePopupNotifications.filter((n) => !n.read);
  const unreadCount = unreadNotifs.length;



  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sm:px-8 shadow-sm dark:shadow-gray-950/30">
      {/* Mobile Toggle & Module Name & Universal Search Layout */}
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-slate-150 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 duration-150"
          id="mobile-sidebar-toggle-btn"
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 tracking-tight" id="navbar-module-title">
            {activeModule}
          </h2>
        </div>


      </div>


      {/* Right Navbar Controls */}
      <div className="flex items-center space-x-4">


        {/* NOTIFICATIONS POPOVER FEED */}
        <div className="relative">
          <button
            onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 duration-150 border border-gray-200 dark:border-gray-700 shadow-sm"
            id="navbar-notifications-btn"
          >
            <Bell className="w-5.5 h-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1 rounded-full min-w-4.5 text-center leading-none py-0.5 shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {notifPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/40 border border-gray-200 dark:border-gray-700 py-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 pb-2.5 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">Alerts & Notifications</span>
                    <span className="p-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-bold rounded">
                      {unreadCount} Total
                    </span>
                  </div>
                </div>
                
                {showClearConfirm ? (
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">Are you sure you want to clear all notifications?</span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          clearAllNotifications();
                          setShowClearConfirm(false);
                          setNotifPopoverOpen(false);
                        }}
                        className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30 rounded duration-150"
                    >
                      Mark All as Read
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-2 py-1 text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 rounded duration-150"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700 px-1">
                {activePopupNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    No active notifications.
                  </div>
                ) : (
                  activePopupNotifications.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markNotificationRead(item.id as string);
                        setActiveModule('Notifications');
                        setNotifPopoverOpen(false);
                      }}
                      className={`block p-3 hover:bg-slate-50 dark:hover:bg-gray-700 duration-150 text-left rounded-lg cursor-pointer ${
                        item.read ? 'opacity-70' : 'bg-slate-50/40 dark:bg-gray-700/40 border-l-2 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded ${
                            item.severity === 'Critical'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400'
                              : item.severity === 'Warning'
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400'
                              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400'
                          }`}
                        >
                          {item.category} • {item.severity}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                  onClick={() => {
                    setActiveModule('Notifications');
                    setNotifPopoverOpen(false);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 duration-150 border border-gray-200 dark:border-gray-700 shadow-sm"
          id="theme-toggle-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 theme-toggle-icon text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 theme-toggle-icon" />
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
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
