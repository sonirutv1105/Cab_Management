import React, { useState } from 'react';
import { useContracts } from '../../context/ContractContext';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { ContractType, ContractStatus } from '../../types';

interface CorporateContractFormProps {
  onBack: () => void;
  onSuccess: (id: string) => void;
  includeOnCall: boolean;
}

export default function CorporateContractForm({ onBack, onSuccess, includeOnCall }: CorporateContractFormProps) {
  const { addContract } = useContracts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    approvalDate: '', // Used as Contract Date
    startDate: '',
    endDate: '',
    reportingLocation: '',
    vehicleCategory: '',
    numberOfVehicles: 1,
    vendorName: '',
    vendorContact: '',
    driverName: '',
    driverContact: '',
    monthlyBaseFare: '',
    gstPercentage: '',
    paymentTerms: '',
    description: '', // Used as Remarks
    pickupLocation: '',
    dropLocation: '',
    reportingTime: '',
    rateType: '',
    estimatedAmount: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const contractId = `CORP-FIX-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const newContract = {
        ...formData,
        id: contractId,
        title: `Fixed Contract - ${formData.clientName}`,
        contractNumber: contractId,
        type: 'Corporate' as ContractType,
        status: 'Active' as ContractStatus,
        department: 'Corporate',
        value: Number(formData.monthlyBaseFare) || 0,
        monthlyBaseFare: Number(formData.monthlyBaseFare) || 0,
        gstPercentage: Number(formData.gstPercentage) || 0,
        numberOfVehicles: Number(formData.numberOfVehicles) || 1,
        currency: 'INR',
        billingFrequency: 'Monthly',
        securityDeposit: 0,
        
        // On Call Data
        ...(includeOnCall ? {
          pickupLocation: formData.pickupLocation,
          dropLocation: formData.dropLocation,
          reportingTime: formData.reportingTime,
          rateType: formData.rateType,
          estimatedAmount: Number(formData.estimatedAmount) || 0,
        } : {}),

        autoRenewal: false,
        reminderDays: 30,
        renewalStatus: 'Pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User',
        updatedBy: 'Current User',
      };
      
      await addContract(newContract as any);
      onSuccess(contractId);
    } catch (err) {
      console.error(err);
      alert('Failed to save contract');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center space-x-4">
          <button 
            type="button"
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Corporate Contract</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Fill in the details for the new corporate contract</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Company Name *</label>
                <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Contract Date *</label>
                <input required type="date" name="approvalDate" value={formData.approvalDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Contract Start Date *</label>
                <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Contract End Date *</label>
                <input required type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">
              Vehicle & Vendor Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Vehicle Delivery Location *</label>
                <input required type="text" name="reportingLocation" value={formData.reportingLocation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Vehicle Category *</label>
                <select required name="vehicleCategory" value={formData.vehicleCategory} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  <option value="">Select Category</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Number of Vehicles *</label>
                <input required type="number" min="1" name="numberOfVehicles" value={formData.numberOfVehicles} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div className="hidden md:block"></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Vendor Name *</label>
                <input required type="text" name="vendorName" value={formData.vendorName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Vendor Mobile Number *</label>
                <input required type="tel" name="vendorContact" value={formData.vendorContact} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Driver Name (Optional)</label>
                <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Driver Mobile Number (Optional)</label>
                <input type="tel" name="driverContact" value={formData.driverContact} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>

          {includeOnCall && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">
                On-Call Booking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Reporting Time *</label>
                  <input required type="time" name="reportingTime" value={formData.reportingTime} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Rate Type *</label>
                  <select required name="rateType" value={formData.rateType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    <option value="">Select Rate Type</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Per KM">Per KM</option>
                    <option value="Fixed Trip">Fixed Trip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Pickup Location *</label>
                  <input required type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Drop Location *</label>
                  <input required type="text" name="dropLocation" value={formData.dropLocation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Estimated Charges *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">₹</span>
                    <input required type="number" name="estimatedAmount" value={formData.estimatedAmount} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Monthly Billing Amount *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">₹</span>
                  <input required type="number" name="monthlyBaseFare" value={formData.monthlyBaseFare} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">GST (%) *</label>
                <input required type="number" name="gstPercentage" value={formData.gstPercentage} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Payment Terms *</label>
                <textarea required rows={3} name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Remarks / Description</label>
                <textarea rows={3} name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-10">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 mr-4 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
