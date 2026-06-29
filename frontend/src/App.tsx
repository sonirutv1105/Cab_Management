/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CMSProvider, useCMS } from './context/CMSContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import DriverManagementView from './components/DriverManagementView';
import VehicleManagementView from './components/VehicleManagementView';
import BookingManagementView from './components/BookingManagementView';
import LiveTrackingView from './components/LiveTrackingView';
import TripManagementView from './components/TripManagementView';
import FinanceOperationsView from './components/FinanceOperationsView';
import ComplianceDocumentsView from './components/ComplianceDocumentsView';
import AuditSettingsView from './components/AuditSettingsView';
import ContractManagementView from './components/ContractManagementView';
import SupportTicketsView from './components/SupportTicketsView';
import LoginPage from './components/LoginPage';
import SuperAdminLayout from './components/SuperAdminLayout';
import { ContractProvider } from './context/ContractContext';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { activeModule, systemSettings, hasPermission } = useCMS();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderActiveModule = () => {
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

    const permKey = modulePermissionKeys[activeModule];
    if (permKey && !hasPermission(permKey, 'view')) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">You do not have permission to view this module.</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Driver Management':
        return <DriverManagementView />;
      case 'Vehicle Management':
        return <VehicleManagementView />;
      case 'Booking Management':
        return <BookingManagementView />;
      case 'Live Tracking':
        return <LiveTrackingView />;
      case 'Trip Management':
        return <TripManagementView />;
      case 'Fuel Management':
        return <FinanceOperationsView subModule="fuel" />;
      case 'Maintenance Management':
        return <FinanceOperationsView subModule="maintenance" />;
      case 'Vendor Management':
        return <ComplianceDocumentsView activeSection="vendors" />;
      case 'Compliance Management':
        return <ComplianceDocumentsView activeSection="compliance" />;
      case 'Reports & Analytics':
        return <AuditSettingsView subModule="reports" />;
      case 'Notifications':
        return <AuditSettingsView subModule="notifications" />;
      case 'Audit Logs':
        return <AuditSettingsView subModule="audit" />;
      case 'User Management':
        return <AuditSettingsView subModule="users" />;
      case 'Support Tickets':
        return <SupportTicketsView />;
      case 'Contract Management':
        return <ContractManagementView />;
      case 'Settings':
        return <AuditSettingsView subModule="settings" />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex bg-[#f8fafc] dark:bg-gray-900 text-gray-850 dark:text-gray-100 min-h-screen font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900" id="main-application-layout">
      {/* 1. COMPREHENSIVE RESPONSIVE SIDEBAR */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isCollapsed={isCollapsed} />

      {/* 2. MAIN HUB INTERFACE */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* NAVIGATIONS UTILITIES HEADER */}
        <Navbar setMobileOpen={setMobileOpen} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* COMPARTMENTAL MODULE VIEWPORTS */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 space-y-6 overflow-y-auto dark:bg-gray-900">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}
function AppWrapper() {
  const { isAuthenticated, isInitializing } = useCMS();
  
  if (isInitializing) {
    return null; // Prevent login flash during session restore
  }

  if (window.location.pathname.startsWith('/super-admin')) {
    return <SuperAdminLayout />;
  }
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <AppContent />;
}

export default function App() {
  return (
    <ThemeProvider>
      <CMSProvider>
        <ContractProvider>
          <AppWrapper />
          <Toaster position="top-right" />
        </ContractProvider>
      </CMSProvider>
    </ThemeProvider>
  );
}

