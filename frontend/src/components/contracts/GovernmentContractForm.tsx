import React, { useState, useEffect } from 'react';
import { useContracts } from '../../context/ContractContext';
import { ContractType, ContractStatus, RenewalStatus } from '../../types';
import { Save, X, ChevronDown, ChevronUp, CheckCircle, FileText, ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { stripUnsafeData } from '../../utils/sanitizer';


const SECTION_FIELDS: Record<string, { required: string[], optional: string[] }> = {
  'A': { required: ['title', 'contractNumber', 'type', 'status', 'startDate', 'endDate', 'category', 'department'], optional: ['bidNumber', 'description'] },
  'B': { required: ['organisationName', 'buyerEmail', 'buyerContact'], optional: ['organisationType', 'ministry', 'buyerName', 'buyerDesignation', 'buyerAddress', 'buyerState', 'buyerDivision'] },
  'C': { required: ['clientName', 'contactPerson', 'email', 'phone', 'clientAddress'], optional: ['clientGstin', 'clientDesignation', 'clientState', 'clientPincode'] },
  'D': { required: ['value', 'paymentTerms'], optional: ['currency', 'monthlyBaseFare', 'gstPercentage', 'securityDeposit', 'ePbgPercentage', 'paymentMode', 'billingFrequency', 'invoiceRaisedTo', 'invoiceDueDate', 'latePaymentPenalty', 'adminApproval', 'financialApproval', 'ifdConcurrence'] },
  'E': { required: ['consigneeName', 'consigneeAddress', 'consigneeState'], optional: ['consigneeDesignation', 'consigneeContact', 'consigneeEmail', 'consigneePincode'] },
  'F': { required: ['vehicleType', 'serviceType', 'numberOfVehicles'], optional: ['vehicleCategory', 'carModels', 'usageVariant', 'fuelType', 'vehicleAgeLimit', 'reportingLocation', 'dutyHours', 'replacementClause', 'acRequired', 'driverRequired', 'gpsRequired', 'brandingRequired'] },
  'G': { required: [], optional: ['slaDetails', 'penaltyClause', 'insuranceRequired', 'driverDocsRequired', 'escalationMatrix', 'specialInstructions', 'policeVerification', 'backgroundVerification'] },
  'H': { required: [], optional: ['autoRenewal', 'reminderDays', 'renewalTerms', 'terminationNotice', 'terminationClause'] },
  'I': { required: [], optional: ['contractPdfUrl', 'scopeOfWorkUrl', 'certificatesUrl', 'slaDocsUrl', 'supportingDocsUrl'] },
};

const checkFilled = (val: any) => val !== '' && val !== null && val !== undefined && val !== false;

export const sanitizePayload = (payload: any): { cleanPayload: any, invalidFields: string[] } => {
  const invalidFields: string[] = [];
  const cleanPayload = stripUnsafeData(payload);

  // Validate cleanPayload doesn't fail JSON.stringify
  try {
    JSON.stringify(cleanPayload);
  } catch (err: any) {
    console.error("Sanitization final JSON.stringify failed", err);
    return { cleanPayload: {}, invalidFields: ['Critical Circular Reference Detected'] };
  }

  return { cleanPayload, invalidFields };
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

const calculateOverallProgress = (formData: any): number => {
  let totalRequired = 0;
  let completedRequired = 0;

  Object.values(SECTION_FIELDS).forEach(fields => {
    totalRequired += fields.required.length;
    completedRequired += fields.required.filter(f => checkFilled(formData[f])).length;
  });

  if (totalRequired === 0) return 0;
  return Math.round((completedRequired / totalRequired) * 100);
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
  { id: 'B', title: 'Organisation & Buyer Details', icon: '🏢' },
  { id: 'C', title: 'Client Information', icon: '👤' },
  { id: 'D', title: 'Financial & Payment', icon: '💰' },
  { id: 'E', title: 'Consignee Details', icon: '📍' },
  { id: 'F', title: 'Vehicle Requirements', icon: '🚗' },
  { id: 'G', title: 'SLA & Compliance', icon: '🛡️' },
  { id: 'H', title: 'Renewal & Termination', icon: '🔄' },
  { id: 'I', title: 'Documents & Attachments', icon: '📎' }
];

const InputField = ({ label, name, type = 'text', required = false, placeholder = '', fullWidth = false, autoCalc = false, disabled = false, min = undefined, helperText = '', prefix = '', formData, handleChange, handleBlur, errors }: any) => {
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

const SelectField = ({ label, name, options, required = false, fullWidth = false, placeholder = '', helperText = '', formData, handleChange, handleBlur, errors }: any) => {
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

const FileUpload = ({ label, name, required = false, helperText = '', formData, errors, handleFileUpload }: any) => {
  const hasError = !!errors[name];

  const onDropHandler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileUpload(e, name);
  };

  return (
    <div>
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

interface GovernmentContractFormProps {
  onClose: () => void;
  onSuccess: (id: string) => void;
  resumeId?: string;
}

export default function GovernmentContractForm({ onClose, onSuccess, resumeId }: GovernmentContractFormProps) {
  const { addContract, updateContract, saveDraft, drafts } = useContracts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('A');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);


  const [formData, setFormData] = useState({
    title: '',
    contractNumber: '',
    type: 'Corporate' as ContractType,
    bidNumber: '',
    status: 'Draft' as ContractStatus,
    category: '',
    department: 'Logistics',
    description: '',
    startDate: '',
    endDate: '',
    durationMonths: 0,

    organisationType: '',
    ministry: '',
    organisationName: '',
    buyerName: '',
    buyerDesignation: '',
    buyerContact: '',
    buyerEmail: '',
    buyerAddress: '',
    buyerState: '',
    buyerDivision: '',

    clientName: '',
    contactPerson: '',
    clientDesignation: '',
    email: '',
    phone: '',
    clientAddress: '',
    clientState: '',
    clientPincode: '',
    clientGstin: '',

    value: '',
    currency: 'INR',
    monthlyBaseFare: '',
    gstPercentage: '',
    gstAmount: 0,
    securityDeposit: '',
    ePbgPercentage: '',
    paymentMode: '',
    billingFrequency: 'Monthly',
    paymentTerms: '',
    invoiceRaisedTo: '',
    invoiceDueDate: '',
    latePaymentPenalty: '',
    adminApproval: '',
    financialApproval: '',
    ifdConcurrence: false,

    consigneeName: '',
    consigneeDesignation: '',
    consigneeContact: '',
    consigneeEmail: '',
    consigneeAddress: '',
    consigneeState: '',
    consigneePincode: '',

    vehicleType: '',
    vehicleCategory: '',
    carModels: '',
    serviceType: '',
    usageVariant: '',
    numberOfVehicles: 1,
    fuelType: '',
    acRequired: false,
    reportingLocation: '',
    dutyHours: '',
    driverRequired: false,
    gpsRequired: false,
    brandingRequired: false,
    vehicleAgeLimit: '',
    replacementClause: '',

    slaDetails: '',
    penaltyClause: '',
    insuranceRequired: '',
    driverDocsRequired: '',
    policeVerification: false,
    backgroundVerification: false,
    escalationMatrix: '',
    specialInstructions: '',

    autoRenewal: false,
    reminderDays: 30,
    renewalTerms: '',
    renewalStatus: 'Pending' as RenewalStatus,
    terminationNotice: '30 Days',
    terminationClause: '',

    contractPdfUrl: '',
    scopeOfWorkUrl: '',
    certificatesUrl: '',
    slaDocsUrl: '',
    supportingDocsUrl: '',
    documentVersion: '1.0'
  });


  const [internalContractId, setInternalContractId] = useState<string>(resumeId || `CNT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
  const { contracts } = useContracts();

  // Resume logic
  useEffect(() => {
    if (resumeId) {
      const draft = drafts.find((d: any) => d.id.toString() === resumeId.toString());
      if (draft) {
        try {
          const parsedFormData = JSON.parse(draft.formData);
          setFormData(prev => ({ ...prev, ...parsedFormData }));
          if (draft.activeSection) setCurrentStep(draft.activeSection);
        } catch (e) {
          console.error("Failed to parse draft form data", e);
        }
      } else {
        const existing = contracts.find((c: any) => c.id.toString() === resumeId.toString());
        if (existing) {
          setFormData(prev => ({ ...prev, ...existing }));
        }
      }
    }
  }, [resumeId, contracts, drafts]);

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave().catch(err => console.error("[Draft AutoSave] Background auto-save failed:", err));
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  const handleAutoSave = async () => {
    console.log('[Draft AutoSave] Initiating save. Current formData:', formData);
    // Generate sectionStatus payload
    const sectionStatus: Record<string, string> = {};
    STEPS.forEach(s => {
      sectionStatus[s.id] = getStepProgress(s.id, formData);
    });

    const { cleanPayload, invalidFields } = sanitizePayload(formData);
    console.log('[Draft AutoSave] Sanitized cleanPayload:', cleanPayload);

    
    if (invalidFields.length > 0) {
      console.warn("[Draft AutoSave] Invalid fields detected, skipping autosave:", invalidFields);
      return;
    }

    console.log('Before stringify:', cleanPayload);
    console.dir(cleanPayload);
    console.log('Contract ID:', internalContractId);
    console.log('Contract ID Type:', typeof internalContractId);

    const draftData = {
      id: internalContractId,
      title: formData.title || 'Untitled Draft',
      formData: JSON.stringify(cleanPayload),
      sectionStatus: JSON.stringify(sectionStatus),
      activeSection: currentStep,
      completionPercentage: calculateOverallProgress(formData),
      attachments: JSON.stringify({
        contractPdfUrl: cleanPayload.contractPdfUrl,
        scopeOfWorkUrl: cleanPayload.scopeOfWorkUrl,
        certificatesUrl: cleanPayload.certificatesUrl,
        slaDocsUrl: cleanPayload.slaDocsUrl,
        supportingDocsUrl: cleanPayload.supportingDocsUrl
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('[Draft Save] Saving draft data payload (before API):', draftData);
        const savedDraft = await saveDraft(draftData);
        if (savedDraft) {
          setInternalContractId(savedDraft.id.toString());
        }
    console.log('[Draft Save] Draft saved successfully:', draftData.id);
  };
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      let months = (end.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += end.getMonth();
      const days = end.getDate() - start.getDate();
      if (days > 15) months += 1;
      setFormData(prev => ({ ...prev, durationMonths: Math.max(0, months) }));
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    const base = Number(formData.monthlyBaseFare);
    const gst = Number(formData.gstPercentage);
    if (!isNaN(base) && !isNaN(gst) && base >= 0 && gst >= 0) {
      const gstAmount = (base * gst) / 100;
      setFormData(prev => ({ ...prev, gstAmount: gstAmount }));
    }
  }, [formData.monthlyBaseFare, formData.gstPercentage]);

  const formatPhoneNumber = (val: string) => {
    // Simple mask for +91 98765 43210
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    let match;
    if (cleaned.length <= 10) {
       return cleaned;
    } else if (cleaned.length <= 12) {
       match = cleaned.match(/^(\d{2})(\d{5})(\d{0,5})$/);
       if (match) return `+${match[1]} ${match[2]} ${match[3]}`.trim();
    }
    return val;
  };

  const validateField = (name: string, value: any, required: boolean): string | null => {
    if (required && !checkFilled(value)) return 'This field is required';
    if (!checkFilled(value)) return null;

    if (name === 'title' && (value.length < 3 || value.length > 200)) return 'Title must be 3-200 characters';
    if ((name === 'buyerEmail' || name === 'email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if ((name === 'buyerContact' || name === 'phone') && !/^\+?[\d\s]+$/.test(value)) return 'Enter a valid numeric contact';
    if (name === 'clientGstin' && value.length !== 15) return 'GSTIN must be exactly 15 characters';
    if (name === 'consigneePincode' && !/^\d{6}$/.test(String(value))) return 'Pincode must be 6 digits';
    if ((name === 'value' || name === 'numberOfVehicles') && Number(value) <= 0) return 'Must be greater than 0';
    if ((name === 'gstPercentage' || name === 'ePbgPercentage') && (Number(value) < 0 || Number(value) > 100)) return 'Must be between 0 and 100';
    
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, required } = e.target as any;
    let newValue: any = value;
    
    if (type === 'checkbox') newValue = (e.target as HTMLInputElement).checked;
    else if (name === 'buyerContact' || name === 'phone' || name === 'consigneeContact') newValue = formatPhoneNumber(value);
    else if (name === 'clientGstin') newValue = value.toUpperCase().slice(0, 15);

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    const error = validateField(name, newValue, required);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      
      if (name === 'endDate' && formData.startDate && new Date(newValue) <= new Date(formData.startDate)) newErrors['endDate'] = 'End Date must be after Start Date';
      if (name === 'startDate' && formData.endDate && new Date(formData.endDate) <= new Date(newValue)) newErrors['endDate'] = 'End Date must be after Start Date';
      
      return newErrors;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement> | any, fieldName: string) => {
    let file: File | undefined;
    
    // Safely extract the file from either a DropEvent or ChangeEvent
    if (e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e && e.target && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [fieldName]: 'File size must be under 10MB' }));
        return;
      }
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Only PDF, DOC, or DOCX allowed' }));
        return;
      }
      const fileName = file.name || 'uploaded_document';
      setFormData(prev => ({ ...prev, [fieldName]: fileName }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateStep = (stepId: string) => {
    const fields = SECTION_FIELDS[stepId];
    if (!fields) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    [...fields.required, ...fields.optional].forEach(field => {
      const isReq = fields.required.includes(field);
      const val = (formData as any)[field];
      const error = validateField(field, val, isReq);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    if (stepId === 'A' && formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors['endDate'] = 'End Date must be after Start Date';
      isValid = false;
    }
    if (stepId === 'H' && formData.renewalDate && formData.startDate && new Date(formData.renewalDate) <= new Date(formData.startDate)) {
      newErrors['renewalDate'] = 'Renewal Date must be after Start Date';
      isValid = false;
    }

    setErrors(prev => {
      const nextErrors = { ...prev };
      [...fields.required, ...fields.optional].forEach(f => delete nextErrors[f]);
      return { ...nextErrors, ...newErrors };
    });

    return isValid;
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

  const handleSubmit = async (e: React.FormEvent, status: ContractStatus) => {
    e.preventDefault();
    console.log('[Submit Flow] Submit button clicked. Status:', status);
    console.log('[Submit Flow] Initial formData before processing:', formData);
    
    if (status === 'Draft') {
      setIsSavingDraft(true);
      try {
        await handleAutoSave();
        alert('Draft saved successfully.');
        onSuccess(internalContractId);
      } catch (err) {
        console.error('Failed to save draft', err);
        alert('Failed to save draft. Please try again.');
      } finally {
        setIsSavingDraft(false);
      }
      return;
    }

    let allValid = true;
    for (const step of STEPS) {
      if (!validateStep(step.id)) {
        allValid = false;
        setCurrentStep(step.id);
        alert('Please complete all mandatory sections before submitting.');
        setTimeout(() => {
          const errorElement = document.querySelector('.text-red-500');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        break;
      }
    }

    if (!allValid) return;
    
    console.log('[Submit Flow] Validation passed');
    setFormError(null);
    setIsSubmitting(true);
    console.log('[Submit Flow] Documents payload:', {
      contractPdfUrl: formData.contractPdfUrl,
      scopeOfWorkUrl: formData.scopeOfWorkUrl,
      certificatesUrl: formData.certificatesUrl,
      slaDocsUrl: formData.slaDocsUrl,
      supportingDocsUrl: formData.supportingDocsUrl
    });

    const payloadToSanitize = {
      ...formData,
      taxInformation: (formData as any).taxInformation || ''
    };
    console.log('[Submit Flow] Payload before sanitize:', payloadToSanitize);

    const { cleanPayload, invalidFields } = sanitizePayload(payloadToSanitize);

    if (invalidFields.length > 0) {
      console.error("Invalid fields detected:", invalidFields.join(', '));
      setFormError(`Submit Failed: Invalid data in fields: ${invalidFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    console.log('[Submit Flow] Cleaned and Safe Payload:', cleanPayload);
    
    const contractDataToSave = {
      ...cleanPayload,
      id: internalContractId,
      status: status,
      value: Number(cleanPayload.value) || 0,
      monthlyBaseFare: Number(cleanPayload.monthlyBaseFare) || 0,
      gstPercentage: Number(cleanPayload.gstPercentage) || 0,
      securityDeposit: Number(cleanPayload.securityDeposit) || 0,
      ePbgPercentage: Number(cleanPayload.ePbgPercentage) || 0,
      approvalDate: status === 'Active' ? new Date().toISOString() : undefined,
    };
      
    console.log('Contract ID:', internalContractId);
    console.log('Contract ID Type:', typeof internalContractId);
    console.log('Entered Contract Number:', formData.contractNumber);
    console.log('Payload Contract Number:', contractDataToSave.contractNumber);
    console.log('Entire Payload:', contractDataToSave);
    console.log('[Submit Flow] Final Payload before API save:', contractDataToSave);

    try {
      const existing = contracts.find((c: any) => c.id === internalContractId);
      if (existing) {
        await updateContract(contractDataToSave as any);
        console.log('[Submit Flow] Database response: Successfully updated existing contract');
      } else {
        await addContract({
          ...contractDataToSave,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Current User',
          updatedBy: 'Current User',
        } as any);
        console.log('[Submit Flow] Database response: Successfully created new contract');
      }
      
      console.log('[Submit Flow] API response: Success');
      setFormSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(internalContractId);
      }, 1000);
      
    } catch (err: any) {
      console.error("[Submit Flow] Contract save failed:", err);
      setIsSubmitting(false);
      if (err.response && err.response.status === 409) {
        alert('Failed to submit: A contract with this Contract Number already exists.');
        setErrors(prev => ({ ...prev, contractNumber: 'Contract Number already exists' }));
      } else if (err.response && err.response.status === 422) {
        alert('Validation Error: Please check the entered data.');
      } else {
        let errorMessage = err.message || 'Unable to create contract. A server error occurred.';
        setFormError(errorMessage);
        alert('An unexpected error occurred while saving.');
      }
    }
  };


  const handleNext = () => {
    if (!validateStep(currentStep)) {
      alert('Please complete all required fields before proceeding.');
      setTimeout(() => {
        const errorElement = document.querySelector('.text-red-500');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    handleAutoSave();
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    handleAutoSave();
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };
  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onClose}>Contract Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">Add New Contract</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Add New Contract</h1>
        </div>
        
        <button 
          type="button"
          onClick={onClose} 
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
                
                // A step is accessible if all previous steps are completed
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
                    onClick={() => { 
                      if (accessible) {
                        handleAutoSave(); setCurrentStep(step.id); 
                      }
                    }}
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
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Please fill in the required details below.</p>
            </div>
            
            {formError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Error Saving Contract</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formError}</p>
                </div>
              </div>
            )}
            
            {formSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Contract created successfully! Redirecting...</p>
              </div>
            )}

        <form id="contract-form" className="max-w-5xl mx-auto space-y-3">
          
          <WizardStep id="A" currentStep={currentStep}>
            <InputField label="Contract Title" name="title" required placeholder="e.g. RITES Limited Employee Transportation Contract 2026" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Contract Number" name="contractNumber" required placeholder="e.g. GEMC-511687754346762 or CON-1001" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Contract Type" name="type" required options={['Government', 'Corporate', 'GeM', 'Tender', 'Direct Agreement']} placeholder="Select contract type" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Bid / RA Number" name="bidNumber" placeholder="e.g. GEM/2026/B/4937380" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Contract Status" name="status" required options={['Draft', 'Active', 'Pending Approval', 'Expired', 'Terminated']} formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Category" name="category" placeholder="e.g. Transport Services" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Department" name="department" placeholder="e.g. Logistics, Operations, Administration" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Start Date" name="startDate" type="date" required helperText="Select contract commencement date" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="End Date" name="endDate" type="date" required helperText="Select contract expiry date" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Duration (Months)" name="durationMonths" type="number" disabled autoCalc formData={formData} handleChange={handleChange} errors={errors} />
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} placeholder="Enter a brief description of the contract..." onChange={handleChange} rows={3} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"></textarea>
            </div>
          </WizardStep>

          <WizardStep id="B" currentStep={currentStep}>
            <SelectField label="Organisation Type" name="organisationType" options={['Central Govt', 'State Govt', 'PSU', 'Private Enterprise', 'NGO']} placeholder="Select org type" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Ministry / Department" name="ministry" placeholder="e.g. Ministry of Railways" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Organisation Name" name="organisationName" required placeholder="e.g. Ministry of Railways, RITES Limited" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Buyer Name" name="buyerName" placeholder="e.g. Rajesh Kumar" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Buyer Designation" name="buyerDesignation" placeholder="e.g. Procurement Officer" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Buyer Contact Number" name="buyerContact" type="tel" placeholder="e.g. +91 9876543210" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Buyer Email" name="buyerEmail" type="email" placeholder="e.g. rajesh.kumar@rites.com" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Division / Department" name="buyerDivision" placeholder="e.g. West Zone Division" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Buyer Address" name="buyerAddress" placeholder="e.g. RITES Bhavan, Sector 29" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="State" name="buyerState" placeholder="e.g. Haryana" formData={formData} handleChange={handleChange} errors={errors} />
          </WizardStep>

          <WizardStep id="C" currentStep={currentStep}>
            <InputField label="Client Name" name="clientName" required placeholder="e.g. Central PSU, ABC Corporation" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="GSTIN" name="clientGstin" placeholder="e.g. 24AAMCP0448G1ZH" helperText="15-character GST Identification Number" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Contact Person" name="contactPerson" placeholder="e.g. Amit Sharma" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Designation" name="clientDesignation" placeholder="e.g. Site Manager" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Email" name="email" type="email" placeholder="e.g. name@company.com" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Phone Number" name="phone" type="tel" placeholder="e.g. +91 98765 43210" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="State" name="clientState" placeholder="e.g. Gujarat" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Pincode" name="clientPincode" placeholder="e.g. 380001" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Address" name="clientAddress" placeholder="e.g. Navrangpura, Ahmedabad" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
          </WizardStep>

          <WizardStep id="D" currentStep={currentStep}>
            <InputField label="Total Contract Value" name="value" type="number" required placeholder="e.g. 657432" prefix="₹" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Currency" name="currency" options={['INR', 'USD', 'EUR', 'GBP']} formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Monthly Base Fare" name="monthlyBaseFare" type="number" placeholder="e.g. 54786" prefix="₹" helperText="Base fare per month" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="GST Percentage (%)" name="gstPercentage" type="number" placeholder="e.g. 5" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="GST Amount" name="gstAmount" type="number" disabled autoCalc prefix="₹" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Security Deposit" name="securityDeposit" type="number" placeholder="e.g. 50000" prefix="₹" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="ePBG Percentage (%)" name="ePbgPercentage" type="number" placeholder="e.g. 10" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Payment Mode" name="paymentMode" options={['Bank Transfer', 'Cheque', 'UPI', 'Cash']} placeholder="Select payment mode" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Billing Frequency" name="billingFrequency" options={['Monthly', 'Quarterly', 'Annually', 'One-Time']} formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Payment Terms" name="paymentTerms" placeholder="e.g. Net 30, Net 45, Advance Payment" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Invoice Raised To" name="invoiceRaisedTo" placeholder="e.g. Accounts Payable Department" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Invoice Due Date" name="invoiceDueDate" type="date" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Late Payment Penalty" name="latePaymentPenalty" placeholder="e.g. 1.5% per month" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Admin Approval Ref" name="adminApproval" placeholder="e.g. ADM/2026/09" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Financial Approval Ref" name="financialApproval" placeholder="e.g. FIN/2026/44" formData={formData} handleChange={handleChange} errors={errors} />
            <Toggle label="IFD Concurrence required?" name="ifdConcurrence" formData={formData} handleChange={handleChange} />
          </WizardStep>

          <WizardStep id="E" currentStep={currentStep}>
            <InputField label="Consignee Name" name="consigneeName" placeholder="e.g. RITES Project Office" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Designation" name="consigneeDesignation" placeholder="e.g. Transport Supervisor" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Contact Number" name="consigneeContact" type="tel" placeholder="e.g. +91 98765 43210" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Email" name="consigneeEmail" type="email" placeholder="e.g. office@rites.com" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="State" name="consigneeState" placeholder="e.g. Gujarat" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Pincode" name="consigneePincode" placeholder="e.g. 396445" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Address" name="consigneeAddress" placeholder="e.g. Navsari, Gujarat" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
          </WizardStep>

          <WizardStep id="F" currentStep={currentStep}>
            <SelectField label="Vehicle Type" name="vehicleType" required options={['Sedan', 'SUV', 'Hatchback', 'Bus', 'Tempo Traveller']} placeholder="e.g. SUV" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Vehicle Category" name="vehicleCategory" options={['Economy', 'Premium', 'Luxury', 'Commercial']} placeholder="Select category" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Car Options / Models" name="carModels" placeholder="e.g. Ertiga / Bolero / TUV300" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Service Type" name="serviceType" required options={['Local Monthly', 'Outstation', 'Airport Transfer', 'Daily Rental']} placeholder="e.g. Outstation, Local, Airport Transfer" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Usage Variant" name="usageVariant" placeholder="e.g. 3000 km × 364 hrs" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Number of Vehicles" name="numberOfVehicles" type="number" required min="1" placeholder="e.g. 5" formData={formData} handleChange={handleChange} errors={errors} />
            <SelectField label="Fuel Type" name="fuelType" options={['Diesel', 'Petrol', 'CNG', 'EV']} placeholder="Select fuel type" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Vehicle Age Limit (Years)" name="vehicleAgeLimit" type="number" placeholder="e.g. 3" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Reporting Location" name="reportingLocation" placeholder="e.g. Ahmedabad Railway Station" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Duty Hours" name="dutyHours" placeholder="e.g. 12 Hours per Day" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Replacement Vehicle Clause" name="replacementClause" placeholder="e.g. Replacement within 2 hours of breakdown" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle label="Air Conditioning Required" name="acRequired" formData={formData} handleChange={handleChange} />
              <Toggle label="Driver Requirement" name="driverRequired" formData={formData} handleChange={handleChange} />
              <Toggle label="GPS Required" name="gpsRequired" formData={formData} handleChange={handleChange} />
              <Toggle label="Vehicle Branding Required" name="brandingRequired" formData={formData} handleChange={handleChange} />
            </div>
          </WizardStep>

          <WizardStep id="G" currentStep={currentStep}>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Service Level Agreement Details</label>
              <textarea name="slaDetails" value={formData.slaDetails} onChange={handleChange} rows={2} placeholder="e.g. Vehicle must report 15 mins before scheduled time." className="w-full border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"></textarea>
            </div>
            <InputField label="Penalty for Non-Compliance" name="penaltyClause" placeholder="e.g. ₹500 per day for late reporting" fullWidth formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Insurance Requirement" name="insuranceRequired" placeholder="e.g. Comprehensive Vehicle Insurance" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Driver Documents Required" name="driverDocsRequired" placeholder="e.g. Valid Commercial DL, Aadhar, Badge" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Escalation Matrix" name="escalationMatrix" placeholder="e.g. Level 1: Site Manager, Level 2: Regional Head" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Special Instructions" name="specialInstructions" placeholder="Enter any additional terms, requirements, or notes" formData={formData} handleChange={handleChange} errors={errors} />
            <Toggle label="Police Verification Required" name="policeVerification" formData={formData} handleChange={handleChange} />
            <Toggle label="Background Verification Required" name="backgroundVerification" formData={formData} handleChange={handleChange} />
          </WizardStep>

          <WizardStep id="H" currentStep={currentStep}>
            <Toggle label="Enable Auto-Renewal" name="autoRenewal" formData={formData} handleChange={handleChange} />
            <InputField label="Renewal Reminder (Days Before)" name="reminderDays" type="number" placeholder="e.g. 30" formData={formData} handleChange={handleChange} errors={errors} />
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Renewal Terms / Notes</label>
              <textarea name="renewalTerms" value={formData.renewalTerms} onChange={handleChange} rows={2} placeholder="e.g. 5% price escalation on renewal" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"></textarea>
            </div>
            <SelectField label="Termination Notice Period" name="terminationNotice" options={['30 Days', '60 Days', '90 Days', 'Immediate']} placeholder="Select notice period" formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Termination Clause" name="terminationClause" placeholder="e.g. Breach of SLA allows immediate termination" formData={formData} handleChange={handleChange} errors={errors} />
          </WizardStep>

          <WizardStep id="I" currentStep={currentStep}>
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* TODO: Re-enable document validation when real document upload workflow is implemented. */}
              <div className="col-span-1 sm:col-span-2 text-sm text-gray-500 dark:text-slate-400 mb-2 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                Documents can be uploaded later. All document fields are currently optional for development purposes.
              </div>
              <FileUpload label="Upload Contract PDF" name="contractPdfUrl" helperText="Supported formats: PDF, DOC, DOCX (Maximum 10 MB)" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              <FileUpload label="Upload Scope of Work" name="scopeOfWorkUrl" helperText="PDF or Word Document" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              <FileUpload label="Upload Certificates" name="certificatesUrl" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              <FileUpload label="Upload SLA Documents" name="slaDocsUrl" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              <div className="col-span-1 sm:col-span-2">
                <FileUpload label="Upload Supporting Documents" name="supportingDocsUrl" formData={formData} handleFileUpload={handleFileUpload} errors={errors} />
              </div>
            </div>
            <InputField label="Document Version" name="documentVersion" disabled formData={formData} handleChange={handleChange} errors={errors} />
            <InputField label="Upload Date" name="uploadDate" disabled autoCalc placeholder={new Date().toLocaleDateString()} formData={formData} handleChange={handleChange} errors={errors} />
          </WizardStep>

          

        </form>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
        <div>
          <button 
            type="button" 
            onClick={handlePrevious}
            disabled={currentStep === 'A' || isSubmitting}
            className="px-5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition-colors disabled:opacity-50 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Previous
          </button>
        </div>
        <div className="flex space-x-3">
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, 'Draft')}
            disabled={isSubmitting || isSavingDraft}
            className="px-5 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50"
          >
            {isSavingDraft ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-slate-300 mr-1.5"></div>Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" />Save Draft</>
            )}
          </button>
          
          {currentStep === 'I' ? (
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'Pending Approval')}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 font-semibold flex items-center shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>Saving Contract...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-1.5" />Submit Contract</>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-semibold flex items-center shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50"
            >
              Save & Next
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
