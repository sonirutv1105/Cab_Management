import React, { useState } from 'react';
import { Landmark, Building2, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

export type ContractMainType = 'Government' | 'Corporate' | null;

interface ContractTypeSelectionProps {
  onNext: (type: ContractMainType) => void;
  onCancel: () => void;
}

export default function ContractTypeSelection({ onNext, onCancel }: ContractTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<ContractMainType>(null);

  const handleContinue = () => {
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onCancel}>Contract Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">Select Contract Type</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Add New Contract</h1>
        </div>
        
        <button 
          type="button"
          onClick={onCancel} 
          className="flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Select Contract Type</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg">Choose the type of contract you want to create.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Government Card */}
            <div 
              onClick={() => setSelectedType('Government')}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                selectedType === 'Government' 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10' 
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
              }`}
            >
              {selectedType === 'Government' && (
                <div className="absolute top-4 right-4 text-blue-500 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-6 h-6 fill-blue-100 dark:fill-blue-900" />
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                selectedType === 'Government' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                <Landmark className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Government Contract</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4 h-12">
                Government tenders, GeM, Departments, PSU
              </p>
            </div>

            {/* Corporate Card */}
            <div 
              onClick={() => setSelectedType('Corporate')}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                selectedType === 'Corporate' 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10' 
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
              }`}
            >
              {selectedType === 'Corporate' && (
                <div className="absolute top-4 right-4 text-blue-500 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-6 h-6 fill-blue-100 dark:fill-blue-900" />
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                selectedType === 'Corporate' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Corporate Contract</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4 h-12">
                Private Companies, Employee Transport, Fleet Services
              </p>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedType}
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all flex items-center shadow-sm ${
                selectedType
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                  : 'bg-gray-200 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
