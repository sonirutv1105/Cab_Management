import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ArrowLeft, PlusCircle, MinusCircle } from 'lucide-react';

interface CorporateTypeSelectionProps {
  onNext: (includeOnCall: boolean) => void;
  onBack: () => void;
}

export default function CorporateTypeSelection({ onNext, onBack }: CorporateTypeSelectionProps) {
  const [includeOnCall, setIncludeOnCall] = useState<boolean | null>(null);

  const handleContinue = () => {
    if (includeOnCall !== null) {
      onNext(includeOnCall);
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onBack}>Contract Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">Additional Requirements</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Add New Contract</h1>
        </div>
        
        <button 
          type="button"
          onClick={onBack} 
          className="flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Will this contract include On-Call Booking?</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg">Select 'Yes' if you need to capture ad-hoc booking details along with standard corporate contract terms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {/* Yes Card */}
            <div 
              onClick={() => setIncludeOnCall(true)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center ${
                includeOnCall === true 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10' 
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
              }`}
            >
              {includeOnCall === true && (
                <div className="absolute top-3 right-3 text-blue-500 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-5 h-5 fill-blue-100 dark:fill-blue-900" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 transition-colors ${
                includeOnCall === true ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Yes</h3>
            </div>

            {/* No Card */}
            <div 
              onClick={() => setIncludeOnCall(false)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center ${
                includeOnCall === false 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10' 
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
              }`}
            >
              {includeOnCall === false && (
                <div className="absolute top-3 right-3 text-blue-500 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-5 h-5 fill-blue-100 dark:fill-blue-900" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 transition-colors ${
                includeOnCall === false ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                <MinusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No</h3>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={includeOnCall === null}
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all flex items-center shadow-sm ${
                includeOnCall !== null
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
