import React, { useState, useEffect } from 'react';
import { useContracts } from '../context/ContractContext';
import { Contract } from '../types';
import ContractDashboard from './contracts/ContractDashboard';
import ContractList from './contracts/ContractList';
import AddContract from './contracts/AddContract';
import ContractDetails from './contracts/ContractDetails';

export default function ContractManagementView() {
  const { contracts, drafts } = useContracts();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'drafts' | 'details'>('dashboard');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  const [resumeId, setResumeId] = useState<string | undefined>(undefined);

  // Handle browser back/forward buttons and initial load
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const rid = searchParams.get('resume');

      if (window.location.pathname === '/contracts/new' || window.location.pathname === '/super-admin/contracts/new') {
        setIsCreatingContract(true);
        if (rid && rid !== '[object Object]') {
          setResumeId(rid);
        } else {
          setResumeId(undefined);
          if (rid === '[object Object]') {
             console.error("Invalid resume ID from URL ignored.");
          }
        }
      } else {
        setIsCreatingContract(false);
        setResumeId(undefined);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Check initial state
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleViewContract = (id: string) => {
    setSelectedContractId(id);
    setActiveTab('details');
  };

  const handleCreateContract = (id?: string) => {
    if (id !== undefined) {
      if (typeof id === 'object' || id === '[object Object]') {
        console.error('Contract ID must be primitive. Invalid ID detected:', id);
        throw new Error('Contract ID must be primitive. Invalid ID detected.');
      }
    }
    console.log('Contract ID:', id);
    console.log('Contract ID Type:', typeof id);
    
    setIsCreatingContract(true);
    setResumeId(id);
    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin/contracts/new' : '/contracts/new';
    const finalUrl = id ? `${basePath}?resume=${id}` : basePath;
    window.history.pushState(null, '', finalUrl);
  };

  const handleCloseCreate = () => {
    setIsCreatingContract(false);
    setResumeId(undefined);
    // Determine the base path based on whether we are in Super Admin or not
    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/';
    window.history.pushState(null, '', basePath);
    setActiveTab('list');
  };

  const handleCreateSuccess = (id: string) => {
    setIsCreatingContract(false);
    setResumeId(undefined);
    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/';
    window.history.pushState(null, '', basePath);
    setSelectedContractId(id);
    setActiveTab('list');
  };

  if (isCreatingContract) {
    return (
      <div className="w-full h-full flex flex-col">
        <AddContract 
          onClose={handleCloseCreate} 
          onSuccess={handleCreateSuccess} 
          resumeId={resumeId}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Header Tabs Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center space-x-1 bg-gray-100/80 dark:bg-slate-900/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-50 hover:bg-gray-200 dark:hover:bg-slate-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-50 hover:bg-gray-200 dark:hover:bg-slate-800'
            }`}
          >
            Contracts List
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
              activeTab === 'drafts'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-50 hover:bg-gray-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>Draft Contracts</span>
            {drafts.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'drafts' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                {drafts.length}
              </span>
            )}
          </button>
          {activeTab === 'details' && selectedContractId && (
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm"
            >
              Contract Details
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">
          Total Contracts: <span className="text-gray-900 dark:text-slate-50 font-bold">{contracts.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <ContractDashboard onNavigate={setActiveTab} />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="flex-1 h-full overflow-hidden">
            <ContractList 
              onView={handleViewContract} 
              onCreate={handleCreateContract} 
              viewMode="list"
            />
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="flex-1 h-full overflow-hidden">
            <ContractList 
              onView={handleViewContract} 
              onCreate={handleCreateContract} 
              viewMode="drafts"
            />
          </div>
        )}

        {activeTab === 'details' && selectedContractId && (
          <div className="flex-1 h-full overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-slate-900">
            <ContractDetails 
              contractId={selectedContractId} 
              onBack={() => setActiveTab('list')} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
