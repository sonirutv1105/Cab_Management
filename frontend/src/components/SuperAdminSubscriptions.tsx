import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Wallet,
  Search,
  Filter,
  MoreVertical,
  RefreshCcw,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  XCircle,
  FileText,
  History,
  Calendar,
  Check
} from 'lucide-react';

import { api } from '../api/client';

// --- DUMMY DATA ---
const DEFAULT_KPI_DATA = [
  { label: 'Monthly Revenue', value: '₹0', trend: '0%', isUp: true, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { label: 'Active Subs', value: '0', trend: '0%', isUp: true, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { label: 'Trial Subs', value: '0', trend: '0%', isUp: false, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { label: 'Expired Subs', value: '0', trend: '0%', isUp: false, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  { label: 'Pending Renewals', value: '0', trend: '0d', isUp: true, icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { label: 'Total Revenue', value: '₹0', trend: 'YTD', isUp: true, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { label: 'Deactivated Companies', value: '0', trend: '0%', isUp: false, icon: Ban, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
];

export default function SuperAdminSubscriptions() {
  const [activeTab, setActiveTab] = useState('active');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const [kpiData, setKpiData] = React.useState(DEFAULT_KPI_DATA);
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = React.useState<any[]>([]);
  const [revenueByPlan, setRevenueByPlan] = React.useState<any[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getSuperAdminStats();
        if (data.kpis && data.kpis.length > 0) {
          const updatedKpis = [...DEFAULT_KPI_DATA];
          if (data.kpis[4]) updatedKpis[0] = { ...updatedKpis[0], value: data.kpis[4].value, trend: data.kpis[4].trend, isUp: data.kpis[4].isUp }; // Monthly Revenue
          if (data.kpis[1]) updatedKpis[1] = { ...updatedKpis[1], value: data.kpis[1].value, trend: data.kpis[1].trend, isUp: data.kpis[1].isUp }; // Active Subs
          if (data.kpis[2]) updatedKpis[2] = { ...updatedKpis[2], value: data.kpis[2].value, trend: data.kpis[2].trend, isUp: data.kpis[2].isUp }; // Trial Subs
          if (data.kpis[6]) updatedKpis[6] = { ...updatedKpis[6], value: data.kpis[6].value, trend: data.kpis[6].trend, isUp: data.kpis[6].isUp }; // Deactivated Companies
          // Can fill others similarly if API is expanded
          setKpiData(updatedKpis);
        }
        if (data.revenue_data) setRevenueData(data.revenue_data);
        
        // Convert subscription_status to plan distribution mock for now since API doesn't return plan types yet
        if (data.subscriptions_status) {
          setPlanDistribution(data.subscriptions_status);
        }
        
        // Just mock some base charts for empty state if API doesn't have it
        setRevenueByPlan([{name: 'Enterprise', value: 5000, fill: '#10b981'}, {name: 'Pro', value: 2000, fill: '#3b82f6'}]);
        setSubscriptions(data.recent_companies || []);
      } catch (err) {
        console.error("Error fetching stats", err);
      }
    };
    fetchStats();
  }, []);

  const toggleDropdown = (id: string) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor SaaS revenue and active subscriptions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className={`text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-full ${kpi.isUp ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-700 bg-rose-50 dark:bg-rose-900/30'}`}>
                  {kpi.trend}
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{kpi.value}</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-6 min-w-max px-1">
          {[
            { id: 'active', label: 'Active Subscriptions' },
            { id: 'trial', label: 'Trial' },
            { id: 'expired', label: 'Expired' },
            { id: 'history', label: 'Renewal History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search company or subscription ID..." 
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all"
          />
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <div className="relative min-w-[150px]">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
              <option value="">All Tiers</option>
              <option value="enterprise">Enterprise</option>
              <option value="professional">Professional</option>
              <option value="basic">Basic</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative min-w-[150px]">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
              <option value="">Any Expiry Date</option>
              <option value="7days">Next 7 Days</option>
              <option value="30days">Next 30 Days</option>
              <option value="expired">Already Expired</option>
            </select>
            <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {subscriptions.map((sub) => {
          const isExpired = sub.daysRemaining < 0;
          const isWarning = sub.daysRemaining >= 0 && sub.daysRemaining <= 15;
          
          return (
            <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col relative overflow-hidden group">
              
              {/* Top Color Bar indicating status */}
              <div className={`h-1.5 w-full ${isExpired ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />

              <div className="p-5 flex-1">
                {/* Header: Logo, Name & Actions */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800/50">
                      {sub.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{sub.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Head: {sub.headName}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => toggleDropdown(sub.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === sub.id && (
                      <div className="absolute right-0 top-10 mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2">
                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors font-medium">
                          <RefreshCcw className="w-4 h-4 text-emerald-500" /> Renew Subscription
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors font-medium">
                          <ArrowUpCircle className="w-4 h-4 text-blue-500" /> Upgrade Tier
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors">
                          <ArrowDownCircle className="w-4 h-4 text-gray-400" /> Downgrade Tier
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 transition-colors font-medium">
                          <Ban className="w-4 h-4" /> Suspend Subscription
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors font-medium">
                          <XCircle className="w-4 h-4" /> Cancel Subscription
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Plan Info */}
                <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Current Tier</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{sub.plan}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{sub.billingCycle === 'Monthly' ? 'Monthly Renewal' : 'Annual Renewal'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900 dark:text-white">{sub.amount}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        sub.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sub.paymentStatus === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {sub.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates & Renewal Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{sub.startDate} - {sub.endDate}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`font-bold flex items-center gap-1.5 ${isExpired ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isExpired ? `Expired ${Math.abs(sub.daysRemaining)} days ago` : `${sub.daysRemaining} days remaining`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Auto Renewal</span>
                    <span className={`font-medium flex items-center gap-1 ${sub.autoRenew ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      {sub.autoRenew ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5" />}
                      {sub.autoRenew ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {openDropdownId && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenDropdownId(null)}
        />
      )}

      {/* Bottom Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Monthly Revenue</h3>
            <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs py-1.5 px-3 text-gray-700 dark:text-gray-300 outline-none">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData.length ? revenueData : [{name: 'Jan', revenue: 0}]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${(val/1000).toLocaleString('en-IN')}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Subscription Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Breakdown of companies by subscription tiers.</p>
          
          <div className="h-[180px] w-full relative flex items-center justify-center flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution.length ? planDistribution : [{name: 'None', value: 1, color: '#ccc'}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {(planDistribution.length ? planDistribution : [{name: 'None', value: 1, color: '#ccc'}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900 dark:text-white">0</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {(planDistribution.length ? planDistribution : [{name: 'None', value: 1, color: '#ccc'}]).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
