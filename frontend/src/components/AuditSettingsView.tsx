/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  Bell,
  Sliders,
  History,
  ShieldAlert,
  Download,
  Printer,
  Plus,
  Send,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Radio,
  Trash2,
  ListRestart
} from 'lucide-react';
import UserManagement from './UserManagement';

interface Props {
  subModule: 'reports' | 'notifications' | 'audit' | 'users' | 'settings';
}

export default function AuditSettingsView({ subModule }: Props) {
  const {
    auditLogs,
    notifications,
    currentUser,
    drivers,
    vehicles,
    addNotification,
    clearAllNotifications,
    systemSettings,
    updateSystemSettings
  } = useCMS();

  const isReadOnly = currentUser.role === 'government';

  // State configurations
  const [searchTerm, setSearchTerm] = useState('');

  // Notifications custom trigger
  const [notifState, setNotifState] = useState({
    title: '',
    message: '',
    targetRole: 'ALL'
  });

  // Settings state Knobs
  const [graceKnob, setGraceKnob] = useState(systemSettings.gracePeriodMinutes);
  const [systemKnob, setSystemKnob] = useState(systemSettings.systemName);
  const [sirenKnob, setSirenKnob] = useState(systemSettings.panicSirensEnabled);

  // Chart Data
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (subModule === 'reports') {
      const fetchReports = async () => {
        try {
          const { api } = await import('../api/client');
          const stats = await api.getDashboardStats();
          if (stats && stats.revenue_data) {
             // Map revenue_data to monthlyData format if needed, or just use as is
             // This is a placeholder since we don't have real fleet data in the backend yet
             setMonthlyData(stats.revenue_data.map((item: any) => ({
               name: item.name,
               electricTrips: Math.floor(item.revenue / 100),
               fuelTrips: Math.floor(item.revenue / 200),
               distance: item.revenue
             })));
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchReports();
    }
  }, [subModule]);

  const handleApplySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    updateSystemSettings({
      ...systemSettings,
      systemName: systemKnob,
      gracePeriodMinutes: graceKnob,
      panicSirensEnabled: sirenKnob
    });
    alert('System settings updated successfully.');
  };

  const handleBroadcastNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    addNotification({
      title: notifState.title,
      message: notifState.message,
      targetRole: notifState.targetRole as any
    });
    setNotifState({ title: '', message: '', targetRole: 'ALL' });
    alert('Broadcasted alert successfully.');
  };

  // EXPORTS
  const exportAudit = () => {
    const headers = 'Timestamp,User,Action,Target,IP Address\n';
    const rows = auditLogs
      .map((log) => `"${log.timestamp}","${log.actorName}","${log.action}","${log.targetContext}","${log.ipAddress}"`)
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'CMS_Audit_Logs.csv');
    a.click();
  };

  return (
    <div className="space-y-6" id="audit-settings-panel">
      {/* 1. REPORTS & ANALYTICS SUBMODULE */}
      {subModule === 'reports' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="reports-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Sliders className="w-5.5 h-5.5 text-blue-600" />
                <span>Reports & Analytics</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold font-medium">View fleet usage, distance traveled, charging metrics, and fuel expenses</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1 */}
            <div className="border border-gray-100 dark:border-gray-700 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-tight">Electric EV vs Petrol / Diesel Trips</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                    <YAxis fontSize={10} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="electricTrips" fill="#10b981" name="Electric EV Trips" />
                    <Bar dataKey="fuelTrips" fill="#64748b" name="Petrol/Diesel Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="border border-gray-100 dark:border-gray-700 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-tight">Total Distance Traveled (Km)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                    <YAxis fontSize={10} stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="distance" stroke="#2563eb" strokeWidth={3} name="Total Distance (Km)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BROADCAST NOTIFICATIONS PANEL */}
      {subModule === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="notifications-view">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Bell className="w-5.5 h-5.5 text-blue-600" />
              <span>Broadcast Alerts</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold font-medium">Send updates, weather warnings, and safety notifications to users</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create form */}
            <div className="border border-gray-100 dark:border-gray-700 p-4 rounded-xl space-y-4 lg:col-span-1">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-tight flex items-center space-x-1">
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>Create New Alert</span>
              </h4>

              <form onSubmit={handleBroadcastNotification} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-0.5">Message Title</label>
                  <input
                    type="text"
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    placeholder="e.g. Weather Warning"
                    value={notifState.title}
                    onChange={(e) => setNotifState({ ...notifState, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-0.5">Target Audience</label>
                  <select
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 font-bold text-slate-700 dark:text-gray-300"
                    value={notifState.targetRole}
                    onChange={(e) => setNotifState({ ...notifState, targetRole: e.target.value })}
                  >
                    <option value="ALL">All Users</option>
                    <option value="super_admin">Super Admins Only</option>
                    <option value="company_head">Corporate Heads Only</option>
                    <option value="company_hr">HR Staff Only</option>
                    <option value="government">Government Auditors Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-0.5">Body Message</label>
                  <textarea
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 h-24 text-gray-800 dark:text-gray-200 resize-none"
                    placeholder="Enter short warning text..."
                    value={notifState.message}
                    onChange={(e) => setNotifState({ ...notifState, message: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isReadOnly}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold duration-150 shadow-sm"
                >
                  Send Broadcast
                </button>
              </form>
            </div>

            {/* List notifications */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Alert History</span>
                <button
                  onClick={clearAllNotifications}
                  disabled={isReadOnly}
                  className="text-xs text-red-600 font-semibold hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Alerts</span>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{notif.title}</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 font-extrabold px-1 rounded">Target: {notif.targetRole}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-mono text-right">{notif.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECURITY AUDIT TRAILS */}
      {subModule === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="audit-logs-view">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <History className="w-5.5 h-5.5 text-blue-600" />
                <span>Security Audit Logs</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-semibold">Log of user activities and system actions</p>
            </div>

            <button
              onClick={exportAudit}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700 border-b text-gray-500 dark:text-gray-400 font-bold uppercase">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-gray-700 dark:text-gray-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-gray-700/40 duration-150">
                    <td className="p-3.5 font-mono text-gray-400 dark:text-gray-500">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-gray-950">{log.actorName}</td>
                    <td className="p-3.5 font-bold">
                      <span className="p-1 px-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm truncate text-gray-500 dark:text-gray-400" title={log.targetContext}>{log.targetContext}</td>
                    <td className="p-3.5 font-mono text-gray-400 dark:text-gray-500">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. USER ROLE MANAGEMENT */}
      {subModule === 'users' && (
        <UserManagement />
      )}

      {/* 5. SETTINGS MODULE */}
      {subModule === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="settings-view">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Sliders className="w-5.5 h-5.5 text-blue-600" />
              <span>System Settings</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold font-medium">Configure system grace periods, dashboard title, and panic alarms</p>
          </div>

          <form onSubmit={handleApplySettings} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Dashboard Title</label>
              <input
                type="text"
                className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                value={systemKnob}
                onChange={(e) => setSystemKnob(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 font-bold"
                  value={graceKnob}
                  onChange={(e) => setGraceKnob(parseInt(e.target.value) || 15)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Panic Button Alarm</label>
                <select
                  className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 font-bold"
                  value={sirenKnob ? 'YES' : 'NO'}
                  onChange={(e) => setSirenKnob(e.target.value === 'YES')}
                >
                  <option value="YES">Alarm Active</option>
                  <option value="NO">Silent Alert</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isReadOnly}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold duration-150 shadow-sm"
              id="submit-settings-knobs"
            >
              Save Settings
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
