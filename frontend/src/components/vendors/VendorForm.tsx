import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AlertCircle, FileText, ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Vendor } from '../../types';
import toast from 'react-hot-toast';

const SECTION_FIELDS: Record<string, { required: string[], optional: string[] }> = {
  'A': { required: ['name'], optional: ['vendorCode', 'vendorType', 'businessCategory', 'panNumber', 'status', 'gstNumber'] },
  'B': { required: [], optional: ['fleetSize', 'vehicleTypes', 'totalDrivers', 'operatingCities', 'serviceAvailability'] },
  'C': { required: ['contactName', 'phone', 'email'], optional: ['designation', 'altPhone', 'website', 'address', 'city', 'state', 'country', 'pinCode'] },
  'D': { required: [], optional: ['docGst', 'docPan', 'docRegistration', 'docInsurance', 'docAgreement', 'docOther'] },
  'E': { required: [], optional: ['slaCompliance', 'complianceRating', 'responseTime'] },
  'F': { required: [], optional: ['bankName', 'accountHolder', 'accountNumber', 'ifscCode', 'branchName', 'upiId'] },
  'G': { required: [], optional: ['assignedVehicles'] },
  'H': { required: [], optional: [] }
};

const checkFilled = (val: any) => {
  if (Array.isArray(val)) return val.length > 0;
  return val !== '' && val !== null && val !== undefined && val !== false;
};

const getStepProgress = (stepId: string, formData: any): string => {
  const fields = SECTION_FIELDS[stepId];
  if (!fields) return 'Not Started';

  const filledRequired = fields.required.filter(f => checkFilled(formData[f])).length;
  const filledOptional = fields.optional.filter(f => checkFilled(formData[f])).length;

  const totalFields = fields.required.length + fields.optional.length;
  const filledFields = filledRequired + filledOptional;

  if (totalFields === 0) return 'Completed';
  if (filledFields === 0) return 'Not Started';

  if (fields.required.length > 0 && filledRequired === fields.required.length) {
    return 'Completed';
  }

  if (fields.required.length === 0 && filledFields > 0) {
    return 'Completed';
  }

  return 'Pending';
};

const WizardStep = ({ id, currentStep, children }: { id: string, currentStep: string, children: React.ReactNode }) => {
  if (currentStep !== id) return null;
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {children}
      </div>
    </div>
  );
};

export const STEPS = [
  { id: 'A', title: 'Vendor Information', icon: '🏢' },
  { id: 'B', title: 'Fleet Information', icon: '🚗' },
  { id: 'C', title: 'Contact Details', icon: '📞' },
  { id: 'D', title: 'Documents', icon: '📎' },
  { id: 'E', title: 'Compliance & SLA', icon: '✅' },
  { id: 'F', title: 'Bank Details', icon: '💳' },
  { id: 'G', title: 'Assign Vehicles', icon: '🚙' },
  { id: 'H', title: 'Review & Submit', icon: '👁️' }
];

const InputField = ({ label, name, type = 'text', required = false, placeholder = '', fullWidth = false, autoCalc = false, disabled = false, min = undefined, helperText = '', prefix = '', formData, handleChange, handleBlur, errors = {} }: any) => {
  const hasError = !!errors[name];
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>} {autoCalc && <span className="text-xs text-gray-400 font-normal ml-1">(Auto Calc)</span>}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-slate-400 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          name={name}
          min={min}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={(formData as any)[name] || ''}
          onChange={handleChange}
          onBlur={(e) => handleBlur && handleBlur(name, e.target.value, required)}
          className={`w-full ${prefix ? 'pl-8' : 'px-4'} py-2 border ${hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 ${disabled ? 'opacity-60 bg-gray-50 dark:bg-slate-900 cursor-not-allowed' : ''}`}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {hasError ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

const SelectField = ({ label, name, options, required = false, fullWidth = false, placeholder = '', helperText = '', formData, handleChange, handleBlur, errors = {} }: any) => {
  const hasError = !!errors[name];
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        required={required}
        value={(formData as any)[name] || ''}
        onChange={handleChange}
        onBlur={(e) => handleBlur && handleBlur(name, e.target.value, required)}
        className={`w-full border ${hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 outline-none transition-all`}
      >
        <option value="" disabled>{placeholder || `Select ${label}`}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {hasError ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

const FileUpload = ({ label, name, required = false, helperText = '', formData, errors = {}, handleFileUpload }: any) => {
  const hasError = !!errors[name];

  const onDropHandler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileUpload(e, name);
  };

  return (
    <div className="col-span-1 md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${hasError ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50 dark:bg-slate-800/50'} border-dashed rounded-xl transition-colors`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropHandler}
      >
        <div className="space-y-1 text-center">
          <FileText className={`mx-auto h-8 w-8 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          <div className="flex text-sm text-gray-600 dark:text-slate-400 justify-center">
            <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
              <span>Upload a file</span>
              <input name={name} type="file" className="sr-only" onChange={(e) => handleFileUpload(e, name)} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            {(formData as any)[name] ? `Selected: ${(formData as any)[name]}` : 'PDF, DOCX, JPG up to 10MB'}
          </p>
        </div>
      </div>
      {hasError ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

interface VendorFormProps {
  onBack: () => void;
  onSuccess: (vendor: any) => void;
  initialData?: Partial<Vendor>;
}

export default function VendorForm({ onBack, onSuccess, initialData }: VendorFormProps) {
  const [currentStep, setCurrentStep] = useState<string>('A');
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const data = await api.getVehicles();
        setAvailableVehicles(data);
      } catch (e) {
        console.error('Failed to fetch vehicles for assignment', e);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<any>({
    name: '',
    vendorCode: `VEN-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    vendorType: '',
    businessCategory: '',
    panNumber: '',
    gstNumber: '',
    status: 'Active',
    fleetSize: '',
    vehicleTypes: '',
    totalDrivers: '',
    operatingCities: '',
    serviceAvailability: '',
    contactName: '',
    designation: '',
    email: '',
    phone: '',
    altPhone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    docGst: '',
    docPan: '',
    docRegistration: '',
    docInsurance: '',
    docAgreement: '',
    docOther: '',
    slaCompliance: '100',
    complianceRating: '',
    responseTime: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    upiId: '',
    assignedVehicles: [],
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = value ? value : '';
    }
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateField = (name: string, value: any, required: boolean) => {
    if (required && (!value || String(value).trim() === '')) return 'This field is required';
    if (name === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
    if ((name === 'phone' || name === 'altPhone') && value && !/^\+?\d{10,15}$/.test(value)) return 'Invalid phone number';
    return null;
  };

  const handleBlur = (name: string, value: any, required: boolean) => {
    const error = validateField(name, value, required);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement> | any, fieldName: string) => {
    let file: File | undefined;
    if (e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) file = e.dataTransfer.files[0];
    else if (e && e.target && e.target.files && e.target.files.length > 0) file = e.target.files[0];

    if (file) {
      setFormData((prev: any) => ({ ...prev, [fieldName]: file!.name }));
    }
  };

  const validateStep = (stepId: string) => {
    const fields = SECTION_FIELDS[stepId];
    if (!fields) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    [...fields.required].forEach(field => {
      const val = (formData as any)[field];
      const error = validateField(field, val, true);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(prev => {
      const nextErrors = { ...prev };
      [...fields.required].forEach(f => delete nextErrors[f]);
      return { ...nextErrors, ...newErrors };
    });

    return isValid;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields before proceeding.');
      return;
    }

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
        toast.error('Please complete all required fields.');
        return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Process numeric fields
    const payload = {
        ...formData,
        vehicle_ids: formData.assignedVehicles || [],
        fleetSize: (formData.assignedVehicles || []).length,
        totalDrivers: parseInt(formData.totalDrivers) || 0,
        slaCompliance: parseFloat(formData.slaCompliance) || 0,
        complianceRating: parseFloat(formData.complianceRating) || 0
    };

    try {
        await onSuccess(payload);
    } catch (error) {
        console.error("Failed to save vendor:", error);
        toast.error("Failed to save Vendor. Please check the form data.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onBack}>Vendor Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">{initialData?.id ? 'Edit Vendor' : 'Add New Vendor'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {initialData?.id ? `Edit ${initialData.name}` : 'Add New Vendor'}
          </h1>
        </div>
        
        <button 
          type="button"
          onClick={onBack} 
          className="flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Vendor List
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-0">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Form Sections</h3>
            <div className="space-y-1">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const progStatus = getStepProgress(step.id, formData);
                
                let accessible = true;
                for (let i = 0; i < index; i++) {
                  if (getStepProgress(STEPS[i].id, formData) !== 'Completed') {
                    accessible = false;
                    break;
                  }
                }

                // If editing, all steps should be accessible
                if (initialData?.id) accessible = true;

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!accessible}
                    onClick={() => { if (accessible) setCurrentStep(step.id); }}
                    className={`w-full text-left px-3 py-3 rounded-lg flex flex-col transition-all ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : accessible 
                          ? 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent cursor-pointer'
                          : 'opacity-50 cursor-not-allowed border border-transparent grayscale'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{accessible ? step.icon : '🔒'}</span>
                        <span className={`text-sm font-semibold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                          {step.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center pl-7">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                        progStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        progStatus === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {progStatus === 'Completed' ? '✅ Completed' : progStatus === 'Pending' ? '🟡 Pending' : '○ Not Started'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 custom-scrollbar bg-[#f8fafc] dark:bg-slate-900/50 pb-32">
          <div className="w-full">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3">{STEPS.find(s => s.id === currentStep)?.icon}</span>
                {STEPS.find(s => s.id === currentStep)?.title}
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-xl p-6 md:p-8">
              
              <WizardStep id="A" currentStep={currentStep}>
                <InputField label="Vendor Name" name="name" required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Vendor Code" name="vendorCode" disabled formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <SelectField label="Vendor Type" name="vendorType" options={['Individual', 'Company', 'Partnership', 'LLP']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Business Category" name="businessCategory" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="GST Number" name="gstNumber" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="PAN Number" name="panNumber" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <SelectField label="Status" name="status" options={['Active', 'Under Audit', 'Suspended']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="B" currentStep={currentStep}>
                <InputField label="Fleet Size" name="fleetSize" type="number" autoCalc disabled formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Vehicle Types Supported" name="vehicleTypes" placeholder="e.g. Sedan, SUV, Hatchback" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Total Drivers" name="totalDrivers" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Operating Cities" name="operatingCities" placeholder="e.g. Mumbai, Pune" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <SelectField label="Service Availability" name="serviceAvailability" options={['24x7', 'Business Hours', 'Night Shifts']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="C" currentStep={currentStep}>
                <InputField label="Contact Person" name="contactName" required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Designation" name="designation" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Email" name="email" type="email" required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Mobile Number" name="phone" required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Alternate Mobile" name="altPhone" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Website" name="website" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <div className="col-span-1 md:col-span-2">
                  <InputField label="Office Address" name="address" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                </div>
                <InputField label="City" name="city" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="State" name="state" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Country" name="country" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="PIN Code" name="pinCode" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="D" currentStep={currentStep}>
                <FileUpload label="GST Certificate" name="docGst" formData={formData} handleFileUpload={handleFileUpload} />
                <FileUpload label="PAN Card" name="docPan" formData={formData} handleFileUpload={handleFileUpload} />
                <FileUpload label="Company Registration" name="docRegistration" formData={formData} handleFileUpload={handleFileUpload} />
                <FileUpload label="Insurance" name="docInsurance" formData={formData} handleFileUpload={handleFileUpload} />
                <FileUpload label="Vendor Agreement" name="docAgreement" formData={formData} handleFileUpload={handleFileUpload} />
                <FileUpload label="Other Documents" name="docOther" formData={formData} handleFileUpload={handleFileUpload} />
              </WizardStep>

              <WizardStep id="E" currentStep={currentStep}>
                <InputField label="SLA Target %" name="slaCompliance" type="number" min="0" max="100" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Compliance Rating" name="complianceRating" type="number" min="0" max="5" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <SelectField label="Response Time" name="responseTime" options={['< 1 Hour', '1-4 Hours', '24 Hours', '48+ Hours']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="F" currentStep={currentStep}>
                <InputField label="Bank Name" name="bankName" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Account Holder Name" name="accountHolder" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Account Number" name="accountNumber" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="IFSC Code" name="ifscCode" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Branch Name" name="branchName" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="UPI ID (Optional)" name="upiId" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="G" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2">
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex justify-between items-center">
                      Assign Vehicles (Optional)
                      <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                        {formData.assignedVehicles?.length || 0} Selected
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      You can assign vehicles to this vendor now, or do it later. This is completely optional.
                    </p>
                    {loadingVehicles ? (
                      <div className="text-center py-8 text-gray-500">Loading vehicles...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {availableVehicles.filter(v => !v.vendorId || v.vendorId === initialData?.id).map(v => {
                          const isSelected = formData.assignedVehicles?.includes(v.id);
                          return (
                            <label key={v.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={isSelected}
                                onChange={(e) => {
                                  let newAssigned = [...(formData.assignedVehicles || [])];
                                  if (e.target.checked) {
                                    newAssigned.push(v.id);
                                  } else {
                                    newAssigned = newAssigned.filter((id: number) => id !== v.id);
                                  }
                                  setFormData({ ...formData, assignedVehicles: newAssigned });
                                }}
                              />
                              <div className="ml-3">
                                <div className="font-bold text-gray-900 dark:text-white">{v.plateNumber}</div>
                                <div className="text-xs text-gray-500">{v.model} • {v.vehicleType}</div>
                              </div>
                            </label>
                          );
                        })}
                        {availableVehicles.filter(v => !v.vendorId || v.vendorId === initialData?.id).length === 0 && (
                          <div className="col-span-2 text-center py-6 text-gray-500">
                            No available unassigned vehicles found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </WizardStep>

              <WizardStep id="H" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 flex flex-col items-center justify-center text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Submit</h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md">Please review the details below. Once submitted, the vendor will be added to the system.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center"><span className="mr-2">🏢</span> Vendor Information</h4>
                        <button onClick={() => setCurrentStep('A')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500 block mb-1">Vendor Name</span><span className="font-medium text-gray-900 dark:text-white">{formData.name || '—'}</span></div>
                        <div><span className="text-gray-500 block mb-1">Vendor Type</span><span className="font-medium text-gray-900 dark:text-white">{formData.vendorType || '—'}</span></div>
                        <div><span className="text-gray-500 block mb-1">GST Number</span><span className="font-medium text-gray-900 dark:text-white">{formData.gstNumber || '—'}</span></div>
                        <div><span className="text-gray-500 block mb-1">PAN Number</span><span className="font-medium text-gray-900 dark:text-white">{formData.panNumber || '—'}</span></div>
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center"><span className="mr-2">🚗</span> Fleet & Contact</h4>
                        <button onClick={() => setCurrentStep('B')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mb-6">
                          <div className="text-gray-500 dark:text-slate-400">Vendor Name</div>
                          <div className="font-medium text-gray-900 dark:text-slate-100 text-right">{formData.name || 'Not provided'}</div>
                          <div className="text-gray-500 dark:text-slate-400">Auto-Calculated Fleet Size</div>
                          <div className="font-medium text-gray-900 dark:text-slate-100 text-right">{formData.fleetSize || 0} Cabs</div>
                          <div className="text-gray-500 dark:text-slate-400">Contact</div>
                          <div className="font-medium text-gray-900 dark:text-slate-100 text-right">{formData.email || 'Not provided'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </WizardStep>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 px-6 md:px-10 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div>
          {STEPS.findIndex(s => s.id === currentStep) > 0 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-6 py-2.5 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Save Draft
          </button>
          {STEPS.findIndex(s => s.id === currentStep) < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save & Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vendor'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
