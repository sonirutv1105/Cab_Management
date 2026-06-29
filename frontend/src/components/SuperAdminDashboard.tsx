import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  TrendingUp,
  PlusCircle,
  RefreshCw,
  Megaphone,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Ban
} from 'lucide-react';

const DEFAULT_KPI_DATA = [
  { label: 'Total Companies', value: '0', trend: '0%', isUp: true, icon: Building2, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/30' },
  { label: 'Active Companies', value: '0', trend: '0%', isUp: true, icon: CheckCircle2, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', borderClass: 'ring-1 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-900/10' },
  { label: 'Trial Companies', value: '0', trend: '0%', isUp: false, icon: Clock, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/30', borderClass: 'ring-1 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-900/10' },
  { label: 'Expired Subs', value: '0', trend: '0%', isUp: false, icon: AlertCircle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-900/30' },
  { label: 'Monthly Revenue', value: '₹0', trend: '0%', isUp: true, icon: CreditCard, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/30' },
  { label: 'Pending Renewals', value: '0', trend: '0%', isUp: true, icon: RefreshCw, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { label: 'Deactivated Companies', value: '0', trend: '0%', isUp: false, icon: Ban, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-900/30' }
];

import { api } from '../api/client';

export default function SuperAdminDashboard() {
  const isDark = false; // Note: We could hook into ThemeContext to make tooltips completely match, but standard recharts theming works.
  
  const [kpiData, setKpiData] = useState(DEFAULT_KPI_DATA);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [subscriptionStatusData, setSubscriptionStatusData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getSuperAdminStats();
        if (data.kpis && data.kpis.length > 0) {
          // Merge with default KPI data to keep icons and colors
          const updatedKpis = DEFAULT_KPI_DATA.map((kpi, idx) => {
            if (data.kpis[idx]) {
              return { ...kpi, value: data.kpis[idx].value, trend: data.kpis[idx].trend, isUp: data.kpis[idx].isUp };
            }
            return kpi;
          });
          setKpiData(updatedKpis);
        }
        if (data.revenue_data) setRevenueData(data.revenue_data);
        if (data.subscriptions_status) {
          setSubscriptionStatusData(data.subscriptions_status.map((s: any) => ({
            ...s,
            color: s.name === 'Active' ? '#10b981' : s.name === 'Expired' ? '#ef4444' : '#f59e0b'
          })));
        }
        if (data.recent_companies) setRecentCompanies(data.recent_companies);
        
        // Use recent companies as mock recent activities for now, or fetch from real audit logs if available in super admin
        setRecentActivities(data.recent_companies.map((c: any, i: number) => ({
          id: i, type: 'new', message: `Company registered: ${c.name}`, time: c.created
        })));
        
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6" id="superadmin-dashboard-view">
      
      {/* Hero Banner Section (matches DashboardView) */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center h-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Overview
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => { window.history.pushState({}, '', '/super-admin/announcements'); window.dispatchEvent(new Event('popstate')); }}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg shadow-md duration-150 flex items-center space-x-1.5"
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcement</span>
          </button>

          <button
            onClick={() => { window.history.pushState({}, '', '/super-admin/companies/add'); window.dispatchEvent(new Event('popstate')); }}
            className="px-4 py-2.5 bg-blue-600 border border-blue-400 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md duration-150 flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between ${kpi.borderClass || ''}`}>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">{kpi.label}</span>
                <span className={`text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1`}>{kpi.value}</span>
                <span className={`text-[10px] font-semibold mt-1 block flex items-center gap-1 ${kpi.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {kpi.trend} {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${kpi.bgClass} ${kpi.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analytics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700 gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Monthly Revenue Growth</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">SaaS subscription revenue over time</p>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-bold text-gray-500 dark:text-slate-400 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                <IndianRupee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Total Billed</span>
              </div>
            </div>

            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(148, 163, 184, 0.20)" : "rgba(148, 163, 184, 0.30)"} />
                  <XAxis dataKey="name" stroke={isDark ? "#475569" : "#CBD5E1"} tick={{fill: isDark ? "#CBD5E1" : "#475569", fontSize: 11}} tickLine={false} />
                  <YAxis stroke={isDark ? "#475569" : "#CBD5E1"} tick={{fill: isDark ? "#CBD5E1" : "#475569", fontSize: 11}} tickLine={false} tickFormatter={(val) => `₹${(val/1000).toLocaleString('en-IN')}k`} />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E5E7EB',
                      color: isDark ? '#F8FAFC' : '#111827',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#111827' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Companies */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Recent Companies</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Newly onboarded SaaS clients</p>
              </div>
              <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-widest font-extrabold border-b border-gray-100 dark:border-slate-700">
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Tier</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Reg. Date</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-xs">
                  {recentCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800/50">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-50">{company.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400">{company.head}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-slate-300">{company.plan}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 hidden sm:table-cell">{company.date}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          company.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          company.status === 'Trial' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {company.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="space-y-6">
          
          {/* Subscription Status Doughnut */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="pb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Subscription Distribution</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Companies grouped by subscription tiers</p>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionStatusData.length > 0 ? subscriptionStatusData : [{name: 'No Data', value: 1, color: '#ccc'}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(subscriptionStatusData.length > 0 ? subscriptionStatusData : [{name: 'No Data', value: 1, color: '#ccc'}]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-6 mt-4">
              {subscriptionStatusData.map((status, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></span>
                  <span className="text-gray-600 dark:text-slate-400">{status.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities Timeline */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="pb-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Recent Activities</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Live platform updates</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
                Live
              </span>
            </div>

            <div className="space-y-4 mt-2">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activity.type === 'new' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      activity.type === 'renew' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      activity.type === 'upgrade' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {activity.type === 'new' && <Building2 className="w-4 h-4" />}
                      {activity.type === 'renew' && <RefreshCw className="w-4 h-4" />}
                      {activity.type === 'upgrade' && <TrendingUp className="w-4 h-4" />}
                      {activity.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{activity.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center text-slate-500 py-4 text-sm">No recent activities found</div>
                )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
