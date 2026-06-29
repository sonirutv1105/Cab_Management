import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  Bell,
  Building2,
  CreditCard,
  Receipt,
  Settings,
  Megaphone,
  ClipboardList,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  description?: string;
  type?: string;
  category?: string;
  read: boolean;
  time?: string;
  date?: string;
  priority?: string;
}

interface SuperAdminNotificationsProps {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export default function SuperAdminNotifications({
  notifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
}: SuperAdminNotificationsProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          notif.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'Unread') matchesStatus = !notif.read;
    if (statusFilter === 'Read') matchesStatus = notif.read;

    let matchesCategory = true;
    if (categoryFilter !== 'All Categories') {
      matchesCategory = notif.category === categoryFilter;
    }

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Company': return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'Subscription': return <CreditCard className="w-5 h-5 text-indigo-500" />;
      case 'Tender': return <Receipt className="w-5 h-5 text-emerald-500" />;
      case 'System': return <Settings className="w-5 h-5 text-gray-500" />;
      case 'Announcement': return <Megaphone className="w-5 h-5 text-amber-500" />;
      case 'Task': return <ClipboardList className="w-5 h-5 text-violet-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-700 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'Medium': return 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'Low': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      default: return 'text-gray-700 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and manage platform alerts, system events, and updates.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
          <button 
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option>All Status</option>
              <option>Unread</option>
              <option>Read</option>
            </select>
          </div>
          <div className="relative flex-1 md:flex-none">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-48 pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option>All Categories</option>
              <option>System</option>
              <option>Subscription</option>
              <option>Company</option>
              <option>Tender</option>
              <option>Task</option>
              <option>Announcement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center justify-center">
              <Bell className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">No Notifications Found</p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">You're all caught up! There are no notifications matching your current filters.</p>
              {(searchTerm || statusFilter !== 'All Status' || categoryFilter !== 'All Categories') && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setCategoryFilter('All Categories'); }}
                  className="mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-5 flex gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ${
                !notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-1">
                <div className={`p-2.5 rounded-full ${
                  !notif.read ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {getCategoryIcon(notif.category)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-bold truncate ${
                        !notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {notif.description}
                    </p>
                  </div>
                  
                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {notif.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {notif.category}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityClasses(notif.priority)}`}>
                        {notif.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                  {!notif.read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark as Read</span>
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-auto sm:ml-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
