import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ClipboardList,
  Receipt,
  HelpCircle,
  Megaphone,
  Settings,
  Users,
  Key,
  ShieldCheck,
  ScrollText,
  Search,
  X,
  ShieldAlert
} from 'lucide-react';

interface SuperAdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentPath: string;
  navigate: (path: string) => void;
  isCollapsed?: boolean;
}

const SUPER_ADMIN_MODULES = [
  { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Companies', path: '/super-admin/companies', icon: Building2 },
  { name: 'Subscriptions', path: '/super-admin/subscriptions', icon: CreditCard },
  { name: 'User & Roles', path: '/super-admin/users', icon: Users },
  { name: 'Support Tickets', path: '/super-admin/support', icon: HelpCircle },
  { name: 'Announcements', path: '/super-admin/announcements', icon: Megaphone },
  { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: ScrollText },
];

export default function SuperAdminSidebar({ mobileOpen, setMobileOpen, currentPath, navigate, isCollapsed = false }: SuperAdminSidebarProps) {
  const { isDark } = useTheme();
  const [moduleSearch, setModuleSearch] = useState('');

  const filteredModules = SUPER_ADMIN_MODULES.filter((module) =>
    module.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const handleModuleClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full border-r shadow-xl transition-all duration-300 ease-in-out ${
      isDark ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'
    } ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Sidebar Header Brand */}
      <div 
        className={`h-16 flex items-center border-b transition-all duration-300 ease-in-out relative ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        } ${isCollapsed ? 'justify-center' : 'justify-start px-4'}`}
      >
        <div className="flex items-center overflow-hidden">
          <div className="text-blue-600 dark:text-blue-500 flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className={`leading-tight transition-all duration-300 ease-in-out origin-left overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4 ml-0' : 'max-w-[200px] opacity-100 translate-x-0 ml-3'}`}>
            <span className={`font-extrabold tracking-tight text-base block uppercase ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Super Admin</span>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>Platform Administrator</span>
          </div>
        </div>
      </div>

      {/* Module quick filter search (hides if collapsed) */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'h-0 opacity-0 border-transparent py-0' : 'h-[53px] px-4 py-3 border-b opacity-100'} ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-slate-50'
      }`}>
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
          const isActive = currentPath === module.path;
          const Icon = module.icon;
          return (
            <button
              key={module.path}
              onClick={() => handleModuleClick(module.path)}
              className={`w-full flex items-center py-2.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              } ${
                isActive
                  ? isDark ? 'bg-blue-900/20 text-blue-400 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? module.name : undefined}
            >
              {/* Active Menu Indicator (Blue Strip) */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-md shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
              
              <div className={`transition-all duration-300 ease-in-out ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-400' : 'text-gray-500')} ${isActive && !isCollapsed ? 'ml-1' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className={`text-left flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4 ml-0' : 'flex-1 opacity-100 translate-x-0 ml-3'}`}>
                  <span className="truncate">{module.name}</span>
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

      {/* User Session card */}
      <div className={`border-t transition-colors duration-200 ${isCollapsed ? 'p-3 flex justify-center' : 'p-4'} ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {isCollapsed ? (
          <div className={`w-9 h-9 rounded-full border shadow-sm flex items-center justify-center font-bold text-xs shrink-0 ${
            isDark ? 'border-gray-700 bg-gray-800 text-blue-400' : 'border-gray-200 bg-blue-100 text-blue-700'
          }`}>
            SA
          </div>
        ) : (
          <div className="flex items-center space-x-3">
             <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 object-cover ${
                isDark ? 'bg-gray-800 border-gray-700 text-blue-400' : 'bg-blue-100 border-gray-200 text-blue-700'
              }`}>
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>System Admin</p>
              <p className={`text-[10px] uppercase font-bold tracking-tight ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Owner
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

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
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </div>
      </aside>

      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}>
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
