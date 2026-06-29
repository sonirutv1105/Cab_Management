import React, { useState, useEffect } from 'react';
import SuperAdminNavbar from './SuperAdminNavbar';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminCompanies from './SuperAdminCompanies';
import SuperAdminSubscriptions from './SuperAdminSubscriptions';
import SuperAdminAddCompany from './SuperAdminAddCompany';
import SuperAdminAnnouncements from './SuperAdminAnnouncements';
import SuperAdminUsers from './SuperAdminUsers';
import SuperAdminAuditLogs from './SuperAdminAuditLogs';
import SuperAdminSupport from './SuperAdminSupport';

export default function SuperAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const isAuth = localStorage.getItem('super_admin_auth');
    if (!isAuth) {
      window.location.href = '/';
    }

    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const renderModuleView = () => {
    switch (currentPath) {
      case '/super-admin/dashboard':
        return <SuperAdminDashboard />;
      case '/super-admin/companies':
        return <SuperAdminCompanies />;
      case '/super-admin/companies/add':
        return <SuperAdminAddCompany onBack={() => { window.history.back(); window.dispatchEvent(new Event('popstate')); }} />;
      case '/super-admin/announcements':
        return <SuperAdminAnnouncements />;
      case '/super-admin/tenders':
        return <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"><h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Tender Information</h1><p className="text-gray-500 dark:text-gray-400">View and manage system-wide tenders.</p></div>;
      case '/super-admin/tasks':
        return <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"><h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Task Manager</h1><p className="text-gray-500 dark:text-gray-400">Global task tracking and management.</p></div>;
      case '/super-admin/users':
        return <SuperAdminUsers />;
      case '/super-admin/audit-logs':
        return <SuperAdminAuditLogs />;
      case '/super-admin/notifications':
        return <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"><h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Global Notifications</h1><p className="text-gray-500 dark:text-gray-400">Broadcast and manage system-wide alerts.</p></div>;
      case '/super-admin/subscriptions':
        return <SuperAdminSubscriptions />;
      case '/super-admin/support':
        return <SuperAdminSupport />;
      default:
        return <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"><h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Module Not Found</h1><p className="text-gray-500 dark:text-gray-400">The requested module does not exist.</p></div>;
    }
  };

  if (currentPath === '/super-admin/companies/add') {
    return (
      <div className="min-h-screen font-sans antialiased bg-[#f8fafc] dark:bg-gray-900 text-gray-850 dark:text-gray-100">
        <SuperAdminAddCompany onBack={() => { window.history.back(); window.dispatchEvent(new Event('popstate')); }} />
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] dark:bg-gray-900 text-gray-850 dark:text-gray-100 min-h-screen font-sans antialiased selection:bg-purple-100 dark:selection:bg-purple-900" id="super-admin-layout">
      <SuperAdminSidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        currentPath={currentPath}
        navigate={navigate}
        isCollapsed={isCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        <SuperAdminNavbar 
          setMobileOpen={setMobileOpen} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
        
        <main className="p-4 md:p-6 lg:p-8 flex-1 space-y-6 overflow-y-auto dark:bg-gray-900">
          {renderModuleView()}
        </main>
      </div>
    </div>
  );
}
