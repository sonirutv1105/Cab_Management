import React, { useState } from 'react';
import { useContracts } from '../../context/ContractContext';
import { 
  CheckCircle, Clock, Calendar, 
  IndianRupee, MapPin, Users, Download, Upload, Plus, Edit,
  Activity, MessageSquare, CreditCard, PlayCircle, StopCircle,
  RefreshCw, AlertCircle, ArrowLeft, FileText
} from 'lucide-react';

interface ContractDetailsProps {
  contractId: string;
  onBack: () => void;
}

export default function ContractDetails({ contractId, onBack }: ContractDetailsProps) {
  const { contracts, services, documents, notes, payments, activityLogs, changeContractStatus, isLoading, error } = useContracts();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-lg text-gray-600 dark:text-slate-400 font-medium">Loading contract details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">Error Loading Contract</h3>
        <p className="text-gray-600 dark:text-slate-400 text-center mb-6">{error}</p>
        <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-400 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const contract = contracts.find(c => c.id === contractId);
  
  if (!contract) return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
      <FileText className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">Contract not found</h3>
      <button onClick={onBack} className="mt-4 flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-400 hover:bg-gray-50">
        <ArrowLeft className="w-4 h-4" />
        <span>Go Back</span>
      </button>
    </div>
  );

  const contractServices = services.filter(s => s.contractId === contractId);
  const contractDocs = documents.filter(d => d.contractId === contractId);
  const contractNotes = notes.filter(n => n.contractId === contractId);
  const contractPayments = payments.filter(p => p.contractId === contractId);
  const contractLogs = activityLogs.filter(l => l.contractId === contractId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Formatting utilities
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Calculations
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const today = new Date();
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const daysPassed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysPassed);
  const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

  const totalPaid = contractPayments.filter(p => p.status === 'Received').reduce((acc, curr) => acc + curr.amount, 0);

  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-slate-50';
    if (status === 'Active') color = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 border';
    else if (status === 'Pending Approval') color = 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 border';
    else if (status === 'Expired') color = 'bg-rose-100 text-rose-800 border-rose-200 border';
    else if (status === 'Renewal Pending') color = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 border-indigo-200 border';

    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{status}</span>;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'info', label: 'Information', icon: FileText },
    { id: 'services', label: 'Services', icon: Users },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50 flex items-center space-x-3">
                {contract.title}
                <StatusBadge status={contract.status} />
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{contract.contractNumber} • {contract.clientName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center shadow-sm">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </button>
            {contract.status === 'Draft' || contract.status === 'Pending Approval' ? (
              <button 
                onClick={() => changeContractStatus(contract.id, 'Active')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm"
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Activate
              </button>
            ) : contract.status === 'Active' ? (
              <button 
                onClick={() => changeContractStatus(contract.id, 'Closed')}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center shadow-sm"
              >
                <StopCircle className="w-4 h-4 mr-2" /> Close Contract
              </button>
            ) : null}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' 
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-400 hover:border-gray-300 dark:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-900">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg"><IndianRupee className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Contract Value</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-50">{formatCurrency(contract.value)}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Amount Paid</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-50">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Days Remaining</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-50">{daysRemaining} days</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-lg"><Activity className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Progress</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-50">{progressPercent.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50 mb-4">Contract Timeline</h3>
              <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">
                <span>Start: {formatDate(contract.startDate)}</span>
                <span>End: {formatDate(contract.endDate)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${progressPercent > 90 ? 'bg-rose-500' : progressPercent > 75 ? 'bg-amber-50 dark:bg-amber-900/300' : 'bg-emerald-50 dark:bg-emerald-900/300'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
                {daysPassed} days elapsed out of {totalDays} total days ({contract.durationMonths} months)
              </p>
            </div>

            {/* Client Summary & Renewal Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50 mb-4">Client Information</h3>
                <dl className="space-y-3">
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Company</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.clientName}</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Contact</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.contactPerson}</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Email</dt><dd className="col-span-2 text-sm text-blue-600">{contract.email}</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Phone</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.phone}</dd></div>
                </dl>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50 mb-4">Renewal Details</h3>
                <dl className="space-y-3">
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Auto-Renewal</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.autoRenewal ? 'Enabled' : 'Disabled'}</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Renewal Date</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.renewalDate ? formatDate(contract.renewalDate) : 'N/A'}</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Reminder</dt><dd className="col-span-2 text-sm text-gray-900 dark:text-slate-50">{contract.reminderDays} days prior</dd></div>
                  <div className="grid grid-cols-3"><dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Status</dt><dd className="col-span-2 text-sm font-medium text-indigo-600">{contract.renewalStatus}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INFORMATION */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50 mb-6 border-b pb-2">Full Contract Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Contract Number</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.contractNumber}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Type</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.type}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Department</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.department}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Status</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.status}</span></div>
              
              <div className="col-span-2"><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Description</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.description}</span></div>
              
              <div className="col-span-2 border-t pt-4 mt-2"><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-4">Financial Terms</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Total Value</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{formatCurrency(contract.value)} {contract.currency}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Billing Frequency</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.billingFrequency}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Payment Terms</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.paymentTerms}</span></div>
              <div><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Security Deposit</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{formatCurrency(contract.securityDeposit)}</span></div>
              <div className="col-span-2"><span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Tax Information</span><span className="text-sm text-gray-900 dark:text-slate-50 mt-1">{contract.taxInformation}</span></div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES */}
        {activeTab === 'services' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50">Provisioned Services</h3>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 dark:bg-blue-900/40">
                <Plus className="w-4 h-4" /> <span>Add Service</span>
              </button>
            </div>
            
            {contractServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-10 text-center rounded-xl border border-gray-200 dark:border-slate-700">
                <p className="text-gray-500 dark:text-slate-400">No specific services defined for this contract yet.</p>
              </div>
            ) : (
              contractServices.map(service => (
                <div key={service.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-start mb-4 border-b pb-3">
                    <h4 className="text-md font-bold text-gray-900 dark:text-slate-50">{service.serviceType}</h4>
                    <span className="text-xs bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 px-2 py-1 rounded-md">{service.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 dark:text-slate-400 mr-2">Vehicles:</span><span className="font-medium text-gray-900 dark:text-slate-50">{service.vehiclesCount}</span></div>
                    <div><span className="text-gray-500 dark:text-slate-400 mr-2">Drivers:</span><span className="font-medium text-gray-900 dark:text-slate-50">{service.driversCount}</span></div>
                    <div><span className="text-gray-500 dark:text-slate-400 mr-2">Hours:</span><span className="font-medium text-gray-900 dark:text-slate-50">{service.workingHours}</span></div>
                    <div><span className="text-gray-500 dark:text-slate-400 mr-2">Locations:</span><span className="font-medium text-gray-900 dark:text-slate-50">{service.locations.join(', ')}</span></div>
                    <div className="col-span-2 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                      <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">SLA Details</span>
                      <span className="text-gray-800 dark:text-slate-50">{service.slaDetails}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50">Contract Documents</h3>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                <Upload className="w-4 h-4" /> <span>Upload Document</span>
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Document Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Version</th>
                  <th className="px-6 py-3 font-semibold">Uploaded</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {contractDocs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">No documents uploaded.</td></tr>
                ) : (
                  contractDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-400" /> {doc.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{doc.category}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">v{doc.version}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span>{formatDate(doc.uploadedAt)}</span>
                          <span className="text-xs">by {doc.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 dark:text-slate-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-50 mb-6">Activity History</h3>
            <div className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-3 space-y-8">
              {contractLogs.map((log, index) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-50 dark:bg-blue-900/300 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-50">{log.action}</h4>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{log.details}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">by {log.userName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OTHER TABS PLACEHOLDERS */}
        {['payments', 'notes'].includes(activeTab) && (
          <div className="bg-white dark:bg-slate-800 p-10 text-center rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <p className="text-gray-500 dark:text-slate-400 capitalize">{activeTab} section coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

