import React from 'react';
import { useContracts } from '../../context/ContractContext';
import { useTheme } from '../../hooks/useTheme';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function ContractDashboard({ onNavigate }: { onNavigate: (tab: 'list') => void }) {
  const { contracts, isLoading, error } = useContracts();
  const { isDark } = useTheme();

  // KPI Calculations
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const displayTotalContracts = contracts.length;
  const displayActiveContracts = contracts.filter(c => c.status === 'Active').length;
  const displayExpiringSoon = contracts.filter(c => {
    if (!c.endDate) return false;
    const daysUntilExpiry = (new Date(c.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;
  const displayExpiredContracts = contracts.filter(c => c.status === 'Expired').length;
  const displayRenewalPending = contracts.filter(c => c.status === 'Renewal Pending').length;
  const displayTotalValue = contracts.reduce((acc, curr) => acc + curr.value, 0);

  // Formatting utils
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Formatting utils for charts
  const formatCompactCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  // Chart Data Calculations

  // 1. Contracts by Sector (using type)
  const sectorCounts = contracts.reduce((acc, curr) => {
    const sector = curr.type || 'Other';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorChartData = Object.keys(sectorCounts).map(key => ({
    name: key,
    value: sectorCounts[key]
  }));

  // 2. Contract Status Distribution
  const statusCounts = contracts.reduce((acc, curr) => {
    const status = curr.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  // 3. Most Used Vehicle Category
  const vehicleCategoryCounts = contracts.reduce((acc, curr) => {
    const category = curr.vehicleCategory || 'Not Specified';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vehicleCategoryData = Object.keys(vehicleCategoryCounts)
    .map(key => ({ name: key, count: vehicleCategoryCounts[key] }))
    .sort((a, b) => b.count - a.count);

  // 4. Revenue by Sector
  const revenueBySectorCounts = contracts.reduce((acc, curr) => {
    const sector = curr.type || 'Other';
    acc[sector] = (acc[sector] || 0) + (curr.value || 0);
    return acc;
  }, {} as Record<string, number>);

  const revenueBySectorData = Object.keys(revenueBySectorCounts).map(key => ({
    name: key,
    value: revenueBySectorCounts[key]
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  const SECTOR_COLORS: Record<string, string> = {
    'Government': '#3B82F6',
    'Corporate': '#8B5CF6',
    'PSU': '#06B6D4'
  };

  const STATUS_COLORS: Record<string, string> = {
    'Active': '#10B981',
    'Draft': '#3B82F6',
    'Renewal Pending': '#F59E0B',
    'Expired': '#EF4444'
  };

  const VEHICLE_COLORS: Record<string, string> = {
    'SUV': '#3B82F6',
    'Sedan': '#10B981',
    'MUV': '#8B5CF6',
    'Tempo Traveller': '#F59E0B',
    'Hatchback': '#06B6D4'
  };

  const REVENUE_SECTOR_COLORS: Record<string, string> = {
    'Government': '#1D4ED8',
    'Corporate': '#7C3AED',
    'PSU': '#0891B2'
  };

  // KPI Card Component
  const KPICard = ({ 
    title, value, icon: Icon, colorClass, onClick 
  }: any) => {

    const valString = String(value);
    let valueTextClass = "text-2xl";
    if (valString.length > 14) valueTextClass = "text-base";
    else if (valString.length > 11) valueTextClass = "text-lg";
    else if (valString.length > 8) valueTextClass = "text-xl";

    return (
      <div 
        onClick={onClick}
        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-center"
      >
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 line-clamp-2 break-words">{title}</p>
            <h3 className={`${valueTextClass} font-bold text-gray-900 dark:text-slate-50`} title={valString}>{value}</h3>
          </div>
          <div className={`p-3 rounded-lg flex-shrink-0 w-12 h-12 flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const ChartEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400">
      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
      <p>No Data Available</p>
    </div>
  );

  const ChartLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400">
      <RefreshCw className="w-8 h-8 mb-2 opacity-50 animate-spin" />
      <p>Loading Data...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <KPICard 
          title="Total Agreements" 
          value={displayTotalContracts} 
          icon={FileText} 
          colorClass="bg-blue-100 dark:bg-blue-900/40 text-blue-600" 
          onClick={() => onNavigate('list')}
        />
        <KPICard 
          title="Active Agreements" 
          value={displayActiveContracts} 
          icon={CheckCircle} 
          colorClass="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" 
          onClick={() => onNavigate('list')}
        />
        <KPICard 
          title="Expiring Soon" 
          value={displayExpiringSoon} 
          icon={AlertCircle} 
          colorClass="bg-amber-100 dark:bg-amber-900/40 text-amber-600" 
          onClick={() => onNavigate('list')}
        />
        <KPICard 
          title="Expired" 
          value={displayExpiredContracts} 
          icon={XCircle} 
          colorClass="bg-rose-100 text-rose-600" 
          onClick={() => onNavigate('list')}
        />
        <KPICard 
          title="Renewal Pending" 
          value={displayRenewalPending} 
          icon={RefreshCw} 
          colorClass="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" 
          onClick={() => onNavigate('list')}
        />
        <KPICard 
          title="Total Value" 
          value={formatCurrency(displayTotalValue)} 
          icon={Wallet} 
          colorClass="bg-violet-100 dark:bg-violet-900/40 text-violet-600" 
          onClick={() => onNavigate('list')}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-50 mb-4">Contracts by Sector</h3>
          <div className="h-72 relative flex items-center justify-center">
            {isLoading ? <ChartLoadingState /> : (error) ? <ChartEmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E5E7EB',
                      color: isDark ? '#F8FAFC' : '#111827',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#111827', fontWeight: 600, padding: 0 }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-50 mb-4">Contract Status Distribution</h3>
          <div className="h-72 relative flex items-center justify-center">
            {isLoading ? <ChartLoadingState /> : (error) ? <ChartEmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E5E7EB',
                      color: isDark ? '#F8FAFC' : '#111827',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#111827', fontWeight: 600, padding: 0 }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-50 mb-4">Most Used Vehicle Category</h3>
          <div className="h-72 flex items-center justify-center">
            {isLoading ? <ChartLoadingState /> : (error) ? <ChartEmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleCategoryData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#E5E7EB"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: isDark ? '#1E293B' : '#F3F4F6'}}
                    contentStyle={{
                      borderRadius: '8px', 
                      border: isDark ? '1px solid #334155' : 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      color: isDark ? '#F8FAFC' : '#111827'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {vehicleCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-50 mb-4">Revenue by Sector</h3>
          <div className="h-72 flex items-center justify-center">
            {isLoading ? <ChartLoadingState /> : (error) ? <ChartEmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySectorData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#E5E7EB"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    tickFormatter={formatCompactCurrency} 
                  />
                  <Tooltip 
                    cursor={{fill: isDark ? '#1E293B' : '#F3F4F6'}}
                    contentStyle={{
                      borderRadius: '8px', 
                      border: isDark ? '1px solid #334155' : 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      color: isDark ? '#F8FAFC' : '#111827'
                    }}
                    formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {revenueBySectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REVENUE_SECTOR_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

