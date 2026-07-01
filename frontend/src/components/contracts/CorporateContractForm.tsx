import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, FileText, ArrowLeft, ChevronRight, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { CorporateContractVehicle } from '../../types';

const SECTION_FIELDS: Record<string, { required: string[], optional: string[] }> = {
  'A': { required: ['contractName'], optional: ['priority', 'description'] },
  'B': { required: ['company'], optional: ['branch', 'gst', 'billingAddress'] },
  'C': { required: [], optional: ['clientContactPerson', 'clientMobile', 'clientEmail'] },
  'D': { required: ['operatingState'], optional: ['operatingCity', 'officeLocation', 'serviceRadius'] },
  'E': { required: [], optional: [] }, // Vehicles
  'F': { required: [], optional: [] }, // Pricing
  'G': { required: [], optional: ['dedicatedVehicle', 'airportTransfer', 'employeePickupDrop', 'localDuty', 'outstation', 'support24x7', 'vipService'] },
  'H': { required: [], optional: ['companyProvidesDriver', 'dedicatedDriver', 'backupDriver'] },
  'I': { required: [], optional: ['billingCycle', 'invoiceGenerationDate', 'creditDays', 'gstPercent', 'tdsPercent'] },
  'J': { required: [], optional: ['documents'] },
  'K': { required: [], optional: ['contractClauses', 'cancellationPolicy', 'penaltyClause', 'renewalClause'] },
  'L': { required: [], optional: [] }  // Review
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
  { id: 'A', title: 'Contract Information', icon: '📄' },
  { id: 'B', title: 'Company & Branch', icon: '🏢' },
  { id: 'C', title: 'Client Information', icon: '👤' },
  { id: 'D', title: 'Service Locations', icon: '📍' },
  { id: 'E', title: 'Vehicle Configuration', icon: '🚗' },
  { id: 'F', title: 'Pricing & Rate Card', icon: '💰' },
  { id: 'G', title: 'Service Configuration', icon: '🛠️' },
  { id: 'H', title: 'Driver Configuration', icon: '👨‍✈️' },
  { id: 'I', title: 'Billing & Payment', icon: '💳' },
  { id: 'J', title: 'Documents', icon: '📎' },
  { id: 'K', title: 'Terms & Conditions', icon: '⚖️' },
  { id: 'L', title: 'Review & Save', icon: '✅' }
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

const Toggle = ({ label, name, formData, handleChange }: { label: string, name: string, formData: any, handleChange: any }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/30 dark:bg-slate-800/50">
    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name={name} checked={(formData as any)[name] || false} onChange={handleChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

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
            {(formData as any)[name] ? `Selected: ${(formData as any)[name]}` : 'PDF, DOCX up to 10MB'}
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

const INITIAL_VEHICLE: CorporateContractVehicle = {
  vehicleType: '',
  vehicleCategory: '',
  fuelType: '',
  transmission: 'Manual',
  quantity: 1,
  monthlyKmIncluded: 0,
  dailyLimit: 0,
  extraKmCharge: 0,
  minimumBillingHours: 0,
  nightCharges: 0,
  driverAllowance: 0,
  waitingCharges: 0,
  parking: 'Client Scope',
  toll: 'Client Scope',
  remarks: ''
};

const MOCK_COMPANIES = {
  'Acme Corp': { gst: '27AADCB2230M1Z2', branch: 'Mumbai Head Office', address: 'Bandra Kurla Complex, Mumbai', contact: 'John Doe', email: 'john@acme.com', phone: '9876543210' },
  'Globex Inc': { gst: '24AAACC1206D1Z1', branch: 'Ahmedabad IT Park', address: 'SG Highway, Ahmedabad', contact: 'Jane Smith', email: 'jane@globex.com', phone: '9988776655' }
};

const MOCK_RATE_CARDS: any = {
  'Gujarat': { Sedan: { base: 12, night: 150, driver: 300 }, SUV: { base: 15, night: 200, driver: 400 }, Innova: { base: 18, night: 250, driver: 500 } },
  'Maharashtra': { Sedan: { base: 14, night: 200, driver: 400 }, SUV: { base: 18, night: 250, driver: 500 }, Innova: { base: 20, night: 300, driver: 600 } }
};

interface CorporateContractFormProps {
  onBack: () => void;
  onSuccess: (id: string) => void;
}

export default function CorporateContractForm({ onBack, onSuccess }: CorporateContractFormProps) {
  const [currentStep, setCurrentStep] = useState<string>('A');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateCards, setRateCards] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    contractNumber: `CORP-${Date.now()}`,
    contractName: '',
    priority: 'Normal',
    description: '',
    company: '',
    branch: '',
    gst: '',
    billingAddress: '',
    clientContactPerson: '',
    clientMobile: '',
    clientEmail: '',
    operatingState: '',
    operatingCity: '',
    officeLocation: '',
    serviceRadius: '',
    vehicles: [{ ...INITIAL_VEHICLE }],
    dedicatedVehicle: false,
    airportTransfer: false,
    employeePickupDrop: false,
    localDuty: false,
    outstation: false,
    support24x7: false,
    vipService: false,
    companyProvidesDriver: false,
    dedicatedDriver: false,
    backupDriver: false,
    billingCycle: 'Monthly',
    invoiceGenerationDate: '',
    creditDays: '',
    gstPercent: '',
    tdsPercent: '',
    contractClauses: '',
    cancellationPolicy: '',
    penaltyClause: '',
    renewalClause: '',
    documents: ''
  });

  useEffect(() => {
    if (formData.operatingState) {
      const mockData = MOCK_RATE_CARDS[formData.operatingState] || null;
      setRateCards(mockData);

      if (mockData) {
        setFormData((prev: any) => ({
          ...prev,
          vehicles: prev.vehicles.map((v: any) => {
            if (v.vehicleCategory && mockData[v.vehicleCategory]) {
              return {
                ...v,
                extraKmCharge: mockData[v.vehicleCategory].base,
                nightCharges: mockData[v.vehicleCategory].night,
                driverAllowance: mockData[v.vehicleCategory].driver
              };
            }
            return v;
          })
        }));
      }
    } else {
      setRateCards(null);
    }
  }, [formData.operatingState]);


  const validateField = (name: string, value: any, required: boolean): string | null => {
    if (required && !checkFilled(value)) return 'This field is required';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, required } = e.target as any;
    let newValue: any = value;
    
    if (type === 'checkbox') newValue = (e.target as HTMLInputElement).checked;

    if (name === 'company') {
      const details = (MOCK_COMPANIES as any)[newValue];
      setFormData((prev: any) => ({
        ...prev,
        [name]: newValue,
        ...(details ? {
          gst: details.gst,
          branch: details.branch,
          billingAddress: details.address,
          clientContactPerson: details.contact,
          clientEmail: details.email,
          clientMobile: details.phone
        } : {
          gst: '', branch: '', billingAddress: '', clientContactPerson: '', clientEmail: '', clientMobile: ''
        })
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: newValue }));
    }

    const error = validateField(name, newValue, required);
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
      alert('Please complete all required fields before proceeding.');
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

  const handleDummySubmit = () => {
    alert("Dummy Corporate Contract Saved Successfully!");
    onBack();
  };


  const updateVehicle = (index: number, field: string, value: any) => {
    const newV = [...formData.vehicles];
    newV[index][field] = value;
    
    // Auto populate rate card
    if (field === 'vehicleCategory' && rateCards && rateCards[value]) {
       newV[index].extraKmCharge = rateCards[value].base;
       newV[index].nightCharges = rateCards[value].night;
       newV[index].driverAllowance = rateCards[value].driver;
    }
    
    setFormData((prev: any) => ({ ...prev, vehicles: newV }));
  };

  const addVehicle = () => {
    setFormData((prev: any) => ({ ...prev, vehicles: [...prev.vehicles, { ...INITIAL_VEHICLE }] }));
  };

  const removeVehicle = (index: number) => {
    setFormData((prev: any) => ({ ...prev, vehicles: prev.vehicles.filter((_: any, i: number) => i !== index) }));
  };


  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onBack}>Contract Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">Add New Corporate Contract</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Add New Corporate Contract</h1>
        </div>
        
        <button 
          type="button"
          onClick={onBack} 
          className="flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Contracts List
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
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#f8fafc] dark:bg-slate-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3">{STEPS.find(s => s.id === currentStep)?.icon}</span>
                {STEPS.find(s => s.id === currentStep)?.title}
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-xl p-6 md:p-8 mb-24">
              
              <WizardStep id="A" currentStep={currentStep}>
                <InputField label="Contract Number (Auto)" name="contractNumber" formData={formData} disabled />
                <InputField label="Contract Name" name="contractName" required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <SelectField label="Priority" name="priority" options={['Normal', 'High', 'Urgent']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Description" name="description" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="B" currentStep={currentStep}>
                <SelectField label="Select Company" name="company" options={Object.keys(MOCK_COMPANIES)} required formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Branch" name="branch" disabled={!formData.company} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="GST Number" name="gst" disabled={!formData.company} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Billing Address" name="billingAddress" fullWidth disabled={!formData.company} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="C" currentStep={currentStep}>
                <InputField label="Contact Person" name="clientContactPerson" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Contact Phone" name="clientMobile" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Contact Email" name="clientEmail" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="D" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-2 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">Selecting a state automatically maps the correct State Rate Card for pricing logic in the later steps.</p>
                </div>
                <SelectField label="Operating State" name="operatingState" required options={['Gujarat', 'Maharashtra']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Operating City" name="operatingCity" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Office Location" name="officeLocation" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Service Radius (KM)" name="serviceRadius" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="E" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Vehicle Fleet Config</h3>
                    <button onClick={addVehicle} type="button" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      <Plus className="w-4 h-4"/> Add Vehicle Row
                    </button>
                  </div>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Vehicle Category</th>
                          <th className="px-4 py-3 font-semibold">Quantity</th>
                          <th className="px-4 py-3 font-semibold">Monthly KM</th>
                          <th className="px-4 py-3 font-semibold">Min Hours</th>
                          <th className="px-4 py-3 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.vehicles.map((v: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <select className="w-32 bg-white border border-gray-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500" value={v.vehicleCategory} onChange={(e) => updateVehicle(i, 'vehicleCategory', e.target.value)}>
                                <option value="">Select</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="Innova">Innova</option>
                              </select>
                            </td>
                            <td className="px-4 py-2"><input type="number" className="w-20 bg-white border border-gray-300 rounded-md p-1.5" value={v.quantity} onChange={(e) => updateVehicle(i, 'quantity', Number(e.target.value))}/></td>
                            <td className="px-4 py-2"><input type="number" className="w-24 bg-white border border-gray-300 rounded-md p-1.5" value={v.monthlyKmIncluded} onChange={(e) => updateVehicle(i, 'monthlyKmIncluded', Number(e.target.value))}/></td>
                            <td className="px-4 py-2"><input type="number" className="w-24 bg-white border border-gray-300 rounded-md p-1.5" value={v.minimumBillingHours} onChange={(e) => updateVehicle(i, 'minimumBillingHours', Number(e.target.value))}/></td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => removeVehicle(i)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </WizardStep>

              <WizardStep id="F" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl mb-4">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">State Rate Card Engine</h3>
                      <p className="text-xs text-gray-600">Pricing mapped to: <span className="font-bold text-blue-700">{formData.operatingState || 'No State'}</span></p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {formData.vehicles.map((v: any, i: number) => {
                      const matchedRate = rateCards && v.vehicleCategory ? rateCards[v.vehicleCategory] : null;
                      return (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{v.vehicleCategory || 'Unassigned'}</p>
                            <p className="text-xs text-gray-500">Qty: {v.quantity}</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Extra KM</p>
                              <p className="font-bold text-gray-900 flex items-center justify-end gap-1">₹ {v.extraKmCharge} {matchedRate && matchedRate.base === v.extraKmCharge && <CheckCircle2 className="w-3 h-3 text-green-500"/>}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Night Chg</p>
                              <p className="font-bold text-gray-900 flex items-center justify-end gap-1">₹ {v.nightCharges} {matchedRate && matchedRate.night === v.nightCharges && <CheckCircle2 className="w-3 h-3 text-green-500"/>}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Driver Allow</p>
                              <p className="font-bold text-gray-900 flex items-center justify-end gap-1">₹ {v.driverAllowance} {matchedRate && matchedRate.driver === v.driverAllowance && <CheckCircle2 className="w-3 h-3 text-green-500"/>}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </WizardStep>

              <WizardStep id="G" currentStep={currentStep}>
                <Toggle label="Dedicated Vehicle" name="dedicatedVehicle" formData={formData} handleChange={handleChange} />
                <Toggle label="Airport Transfer" name="airportTransfer" formData={formData} handleChange={handleChange} />
                <Toggle label="Employee Pickup/Drop" name="employeePickupDrop" formData={formData} handleChange={handleChange} />
                <Toggle label="Local Duty" name="localDuty" formData={formData} handleChange={handleChange} />
                <Toggle label="Outstation" name="outstation" formData={formData} handleChange={handleChange} />
                <Toggle label="24x7 Support" name="support24x7" formData={formData} handleChange={handleChange} />
                <Toggle label="VIP Service" name="vipService" formData={formData} handleChange={handleChange} />
              </WizardStep>

              <WizardStep id="H" currentStep={currentStep}>
                <Toggle label="Company Provides Driver" name="companyProvidesDriver" formData={formData} handleChange={handleChange} />
                <Toggle label="Dedicated Driver Required" name="dedicatedDriver" formData={formData} handleChange={handleChange} />
                <Toggle label="Backup Driver Required" name="backupDriver" formData={formData} handleChange={handleChange} />
              </WizardStep>

              <WizardStep id="I" currentStep={currentStep}>
                <SelectField label="Billing Cycle" name="billingCycle" options={['Monthly', 'Quarterly', 'Yearly']} formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Invoice Generation Day" name="invoiceGenerationDate" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Credit Days" name="creditDays" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="GST (%)" name="gstPercent" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="TDS (%)" name="tdsPercent" type="number" formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="J" currentStep={currentStep}>
                <FileUpload label="Upload Documents (Agreement, PO, Rate Cards)" name="documents" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              </WizardStep>

              <WizardStep id="K" currentStep={currentStep}>
                <InputField label="Contract Clauses" name="contractClauses" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Cancellation Policy" name="cancellationPolicy" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Penalty Clause" name="penaltyClause" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                <InputField label="Renewal Clause" name="renewalClause" fullWidth formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
              </WizardStep>

              <WizardStep id="L" currentStep={currentStep}>
                <div className="col-span-1 md:col-span-2">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-700">
                      <h2 className="text-2xl font-bold">{formData.contractName || 'Unnamed Contract'}</h2>
                      <p className="text-gray-400 mt-1">{formData.contractNumber}</p>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div><p className="text-xs text-gray-500 uppercase font-semibold">Company</p><p className="font-bold text-lg">{formData.company || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase font-semibold">State</p><p className="font-bold text-lg">{formData.operatingState || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase font-semibold">Billing Cycle</p><p className="font-bold text-lg">{formData.billingCycle || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase font-semibold">Total Vehicles</p><p className="font-bold text-lg">{formData.vehicles.length}</p></div>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 items-center text-emerald-800">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                    <p className="font-medium text-sm">All configurations validated successfully. Ready for submission.</p>
                  </div>
                </div>
              </WizardStep>

            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 md:px-10 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 'A'}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${currentStep === 'A' ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'}`}
        >
          Previous
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => alert('Draft saved (Dummy)')}
            className="px-6 py-2.5 bg-white border border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
          {currentStep === STEPS[STEPS.length - 1].id ? (
            <button
              type="button"
              onClick={handleDummySubmit}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 dark:shadow-none flex items-center"
            >
              Submit Contract
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm flex items-center"
            >
              Save & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
