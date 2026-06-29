import React, { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { Driver, DriverDraft, Vendor, Vehicle } from '../../types';
import { api } from '../../api/client';
import { Save, CheckCircle, FileText, ArrowLeft, ChevronRight, AlertCircle, Search } from 'lucide-react';

const STEPS = [
  { id: 'A', title: 'Basic Details', icon: '📄' },
  { id: 'B', title: 'Documents & Verification', icon: '📎' },
  { id: 'C', title: 'Vehicle Assignment', icon: '🚗' },
  { id: 'D', title: 'Availability & Status', icon: '📅' },
  { id: 'E', title: 'Review & Submit', icon: '✅' }
];

const checkFilled = (val: any) => val !== '' && val !== null && val !== undefined && val !== false;

const SECTION_FIELDS: Record<string, { required: string[], optional: string[] }> = {
  'A': { required: ['firstName', 'lastName', 'email', 'phone', 'fatherName', 'birthDate', 'gender', 'licenseExpiry', 'yearsOfExperience', 'address'], optional: ['licenseNumber', 'licenseIssueDate', 'vendorId', 'pinCode', 'state', 'city'] },
  'B': { required: ['dlFile', 'driverPhotoFile', 'policeVerificationFile'], optional: ['policeVerificationNumber', 'policeVerificationExpiry', 'aadhaarNumber', 'aadhaarFile', 'panNumber', 'panFile', 'medicalCertificateExpiry', 'medicalCertificateFile'] },
  'C': { required: [], optional: ['vehicleAssignmentType', 'assignedVehicleId', 'selfVehicleNumber', 'selfVehicleType', 'selfVehicleModel', 'selfVehicleColor'] },
  'D': { required: ['status', 'complianceStatus', 'rating'], optional: [] },
  'E': { required: [], optional: [] }
};

const getStepProgress = (stepId: string, formData: any): string => {
  if (stepId === 'E') return 'Not Started';

  const fields = SECTION_FIELDS[stepId];
  if (!fields) return 'Not Started';

  const filledRequired = fields.required.filter(f => checkFilled(formData[f])).length;
  const filledOptional = fields.optional.filter(f => checkFilled(formData[f])).length;

  const totalFields = fields.required.length + fields.optional.length;
  const filledFields = filledRequired + filledOptional;

  if (totalFields === 0) return 'Completed';
  if (filledFields === 0) return 'Not Started';

  if (fields.required.length > 0 && filledRequired === fields.required.length) {
    if (stepId === 'C' && formData.vehicleAssignmentType === 'Self Car') {
      if (!formData.selfVehicleNumber || !formData.selfVehicleModel) {
        return 'Pending';
      }
    }
    return 'Completed';
  }

  if (fields.required.length === 0 && filledFields > 0) {
    return 'Completed';
  }

  return 'Pending';
};

const InputField = ({ label, name, type = 'text', required = false, placeholder = '', fullWidth = false, disabled = false, min = undefined, max = undefined, step = undefined, helperText = '', formData, handleChange, handleBlur, errors, maxLength, suffixButton }: any) => {
  const hasError = !!errors[name];
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex space-x-2">
        <div className="relative flex-1">
          <input
            type={type}
            name={name}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            value={formData[name] || ''}
            onChange={handleChange}
            onBlur={(e) => handleBlur && handleBlur(name, e.target.value, required)}
            className={`w-full px-4 py-2 border ${hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 ${disabled ? 'opacity-60 bg-gray-50 dark:bg-slate-900 cursor-not-allowed' : ''}`}
          />
          {hasError && !suffixButton && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {suffixButton && (
          <div>{suffixButton}</div>
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

const SelectField = ({ label, name, options, required = false, fullWidth = false, placeholder = '', helperText = '', disabled = false, formData, handleChange, handleBlur, errors }: any) => {
  const hasError = !!errors[name];
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        required={required}
        disabled={disabled}
        value={formData[name] || ''}
        onChange={handleChange}
        onBlur={(e) => handleBlur && handleBlur(name, e.target.value, required)}
        className={`w-full border ${hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 outline-none transition-all ${disabled ? 'opacity-60 bg-gray-50 dark:bg-slate-900 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt: any) => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
      </select>
      {hasError ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

const FileUpload = ({ label, name, required = false, helperText = '', formData, errors, handleFileUpload }: any) => {
  const hasError = !!errors[name];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${hasError ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50 dark:bg-slate-800/50'} border-dashed rounded-xl transition-colors`}>
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
            {formData[name] ? `File uploaded` : 'PDF, JPG, PNG up to 10MB'}
          </p>
          {formData[name] && (
            <a href={formData[name]} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
              View Uploaded File
            </a>
          )}
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

interface AddDriverFormProps {
  onClose: () => void;
  onSuccess: () => void;
  resumeDraft?: DriverDraft | null;
  editingDrv?: Driver | DriverDraft | null;
}

export default function AddDriverForm({ onClose, onSuccess, resumeDraft, editingDrv }: AddDriverFormProps) {
  const { vendors, vehicles, addDriver, updateDriver, addDriverDraft, updateDriverDraft, submitDriverDraft, currentUser } = useCMS();
  const isReadOnly = currentUser.role === 'government';

  const [currentStep, setCurrentStep] = useState<string>('A');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const [formState, setFormState] = useState<any>({
    name: '', email: '', phone: '', licenseNumber: '', licenseExpiry: '', 
    vendorId: vendors.length > 0 ? vendors[0].id : undefined,
    rating: 5.0, status: 'Active', complianceStatus: 'Pending', assignedVehicleId: undefined,
    dlFile: '', aadhaarNumber: '', aadhaarFile: '', panNumber: '', panFile: '',
    policeVerificationNumber: '', policeVerificationExpiry: '', policeVerificationFile: '',
    medicalCertificateExpiry: '', medicalCertificateFile: '', driverPhotoFile: '',
    firstName: '', lastName: '', fatherName: '', birthDate: '', pinCode: '', state: '', city: '',
    yearsOfExperience: 0, licenseIssueDate: '', gender: 'Male', address: '',
    vehicleAssignmentType: 'Vendor Vehicle', selfVehicleNumber: '', selfVehicleType: '', selfVehicleModel: '', selfVehicleColor: ''
  });

  useEffect(() => {
    if (resumeDraft || editingDrv) {
      const draftOrExisting = (resumeDraft || editingDrv) as any;
      
      let svNumber = '';
      let svModel = '';
      let svType = '';
      let svColor = '';
      if (draftOrExisting.vehicleAssignmentType === 'Self Car' && draftOrExisting.assignedVehicleId) {
          const assignedV = vehicles.find(v => v.id === draftOrExisting.assignedVehicleId);
          if (assignedV) {
              svNumber = assignedV.plateNumber || '';
              svModel = assignedV.model || '';
              svType = assignedV.vehicleType || '';
              svColor = assignedV.color || '';
          }
      }

      setFormState({
        name: draftOrExisting.name || `${draftOrExisting.first_name || ''} ${draftOrExisting.last_name || ''}`.trim(),
        phone: draftOrExisting.phone || draftOrExisting.mobile_number || '',
        email: draftOrExisting.email || '',
        licenseNumber: (draftOrExisting.licenseNumber || draftOrExisting.license_number)?.startsWith('DRAFT_') ? '' : (draftOrExisting.licenseNumber || draftOrExisting.license_number || ''),
        licenseExpiry: draftOrExisting.licenseExpiry || draftOrExisting.expiry_date || '',
        vendorId: draftOrExisting.vendorId || draftOrExisting.vendor_id || (vendors.length > 0 ? vendors[0].id : undefined),
        rating: draftOrExisting.rating ?? 5.0,
        status: draftOrExisting.status || 'Active',
        complianceStatus: draftOrExisting.complianceStatus || draftOrExisting.verification_status || 'Pending',
        assignedVehicleId: draftOrExisting.assignedVehicleId || draftOrExisting.assigned_vehicle_id || undefined,
        dlFile: draftOrExisting.dlFile || '',
        aadhaarNumber: draftOrExisting.aadhaarNumber || '',
        aadhaarFile: draftOrExisting.aadhaarFile || '',
        panNumber: draftOrExisting.panNumber || '',
        panFile: draftOrExisting.panFile || '',
        policeVerificationNumber: draftOrExisting.policeVerificationNumber || '',
        policeVerificationExpiry: draftOrExisting.policeVerificationExpiry || '',
        policeVerificationFile: draftOrExisting.policeVerificationFile || '',
        medicalCertificateExpiry: draftOrExisting.medicalCertificateExpiry || '',
        medicalCertificateFile: draftOrExisting.medicalCertificateFile || '',
        driverPhotoFile: draftOrExisting.driverPhotoFile || '',
        firstName: draftOrExisting.firstName || draftOrExisting.first_name || '',
        lastName: draftOrExisting.lastName || draftOrExisting.last_name || '',
        fatherName: draftOrExisting.fatherName || draftOrExisting.father_name || '',
        birthDate: draftOrExisting.birthDate || draftOrExisting.birth_date || '',
        pinCode: draftOrExisting.pinCode || draftOrExisting.pin_code || '',
        state: draftOrExisting.state || '',
        city: draftOrExisting.city || '',
        yearsOfExperience: draftOrExisting.yearsOfExperience || draftOrExisting.years_of_experience || 0,
        licenseIssueDate: draftOrExisting.licenseIssueDate || draftOrExisting.issue_date || '',
        gender: draftOrExisting.gender || 'Male',
        address: draftOrExisting.address || '',
        vehicleAssignmentType: draftOrExisting.vehicleAssignmentType || draftOrExisting.vehicle_assignment_type || 'Vendor Vehicle',
        selfVehicleNumber: draftOrExisting.selfVehicleNumber || draftOrExisting.self_vehicle_number || svNumber,
        selfVehicleType: draftOrExisting.selfVehicleType || draftOrExisting.self_vehicle_type || svType,
        selfVehicleModel: draftOrExisting.selfVehicleModel || draftOrExisting.self_vehicle_model || svModel,
        selfVehicleColor: draftOrExisting.selfVehicleColor || draftOrExisting.self_vehicle_color || svColor
      });

      const currentStepNum = draftOrExisting.current_step || 1;
      const stepId = STEPS[currentStepNum - 1]?.id || 'A';
      setCurrentStep(stepId);
    }
  }, [resumeDraft, editingDrv, vehicles, vendors]);

  const validateField = (name: string, value: any, required: boolean): string | null => {
    if (required && !checkFilled(value)) return 'This field is required';
    if (!checkFilled(value)) return null;

    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (name === 'phone' && value.length !== 10) return 'Enter a valid 10-digit number';
    
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    let newValue: any = value;
    
    if (type === 'checkbox') newValue = (e.target as HTMLInputElement).checked;
    else if (name === 'phone') {
        const val = value.replace(/\D/g, '');
        if (val.length <= 10) newValue = val;
        else return;
    }
    else if (name === 'aadhaarNumber') {
        newValue = value.replace(/\D/g, '').substring(0, 12);
    }
    else if (name === 'panNumber') {
        newValue = value.toUpperCase().substring(0, 10);
    }
    
    setFormState((prev: any) => ({ ...prev, [name]: newValue }));

    const isReq = SECTION_FIELDS[currentStep]?.required.includes(name);
    const error = validateField(name, newValue, isReq);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, fieldName: string) => {
    let file: File | undefined;
    if (e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e && e.target && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }

    if (file) {
      try {
        const res = await api.uploadFile(file);
        setFormState((prev: any) => ({ ...prev, [fieldName]: res.url }));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      } catch (err: any) {
        setErrors(prev => ({ ...prev, [fieldName]: 'File upload failed' }));
      }
    }
  };

  const handleSearchLicense = async () => {
    if (!formState.licenseNumber) {
      setErrors(prev => ({ ...prev, licenseNumber: 'Please enter a license number to search' }));
      return;
    }
    try {
      const res = await fetch(`/api/drivers/search/${formState.licenseNumber}`);
      if (res.ok) {
        const data = await res.json();
        setFormState((prev: any) => ({
          ...prev,
          ...data,
          yearsOfExperience: data.yearsOfExperience || prev.yearsOfExperience,
        }));
        // Flash a quick success without native alert
        const btn = document.getElementById('search-dl-btn');
        if (btn) {
            const oldText = btn.innerText;
            btn.innerText = "Found!";
            setTimeout(() => { btn.innerText = oldText; }, 2000);
        }
      } else {
        setErrors(prev => ({ ...prev, licenseNumber: 'Driver not found' }));
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, licenseNumber: 'Search failed' }));
    }
  };

  const validateStep = (stepId: string) => {
    const fields = SECTION_FIELDS[stepId];
    if (!fields) return true;
    let isValid = true;
    const newErrors: Record<string, string> = {};

    fields.required.forEach(field => {
      const error = validateField(field, formState[field], true);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    if (stepId === 'A') {
      if (vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car' && !formState.vendorId) {
        newErrors['vendorId'] = 'Vendor is required';
        isValid = false;
      }
    }
    if (stepId === 'C') {
        if (formState.vehicleAssignmentType === 'Self Car') {
            if (!formState.selfVehicleNumber) {
                newErrors['selfVehicleNumber'] = 'This field is required';
                isValid = false;
            }
            if (!formState.selfVehicleModel) {
                newErrors['selfVehicleModel'] = 'This field is required';
                isValid = false;
            }
        }
    }

    setErrors(prev => {
        const nextErrors = { ...prev };
        [...fields.required, ...fields.optional].forEach(f => delete nextErrors[f]);
        return { ...nextErrors, ...newErrors };
    });

    return isValid;
  };

  const mapStepIdToNumber = (id: string) => STEPS.findIndex(s => s.id === id) + 1;

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload: any = {
        first_name: formState.firstName, last_name: formState.lastName, father_name: formState.fatherName,
        license_number: formState.licenseNumber, email: formState.email, mobile_number: formState.phone,
        gender: formState.gender, address: formState.address, state: formState.state, city: formState.city,
        pin_code: formState.pinCode, years_of_experience: formState.yearsOfExperience,
        issue_date: formState.licenseIssueDate, expiry_date: formState.licenseExpiry,
        assigned_vehicle_id: formState.assignedVehicleId || undefined, vendor_id: formState.vendorId || undefined,
        birth_date: formState.birthDate, current_step: mapStepIdToNumber(currentStep),
        dlFile: formState.dlFile, aadhaarNumber: formState.aadhaarNumber, aadhaarFile: formState.aadhaarFile,
        panNumber: formState.panNumber, panFile: formState.panFile, policeVerificationNumber: formState.policeVerificationNumber,
        policeVerificationExpiry: formState.policeVerificationExpiry, policeVerificationFile: formState.policeVerificationFile,
        medicalCertificateExpiry: formState.medicalCertificateExpiry, medicalCertificateFile: formState.medicalCertificateFile,
        driverPhotoFile: formState.driverPhotoFile, vehicle_assignment_type: formState.vehicleAssignmentType,
        self_vehicle_number: formState.selfVehicleNumber, self_vehicle_type: formState.selfVehicleType,
        self_vehicle_model: formState.selfVehicleModel, self_vehicle_color: formState.selfVehicleColor
      };

      const targetDrv = editingDrv || resumeDraft;

      if (targetDrv && (targetDrv as any).draft_id) {
        await updateDriverDraft((targetDrv as any).draft_id, payload);
      } else if (!targetDrv) {
        await addDriverDraft(payload);
      }
      onSuccess();
    } catch (e: any) {
      setErrors(prev => ({ ...prev, global: 'Failed to save draft.' }));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
        setTimeout(() => {
            const errorElement = document.querySelector('.text-red-500');
            if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
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

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    if (!validateStep(currentStep)) {
        setTimeout(() => {
            const errorElement = document.querySelector('.text-red-500');
            if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
    }

    setIsSubmitting(true);
    try {
      const targetDrv = editingDrv || resumeDraft;

      if (targetDrv && (targetDrv as any).draft_id) {
         const payload: any = {
            first_name: formState.firstName, last_name: formState.lastName, father_name: formState.fatherName,
            license_number: formState.licenseNumber, email: formState.email, mobile_number: formState.phone,
            gender: formState.gender, address: formState.address, state: formState.state, city: formState.city,
            pin_code: formState.pinCode, years_of_experience: formState.yearsOfExperience,
            issue_date: formState.licenseIssueDate, expiry_date: formState.licenseExpiry,
            assigned_vehicle_id: formState.assignedVehicleId || undefined, vendor_id: formState.vendorId || undefined,
            birth_date: formState.birthDate, current_step: 5,
            dlFile: formState.dlFile, aadhaarNumber: formState.aadhaarNumber, aadhaarFile: formState.aadhaarFile,
            panNumber: formState.panNumber, panFile: formState.panFile,
            policeVerificationNumber: formState.policeVerificationNumber, policeVerificationExpiry: formState.policeVerificationExpiry, policeVerificationFile: formState.policeVerificationFile,
            medicalCertificateExpiry: formState.medicalCertificateExpiry, medicalCertificateFile: formState.medicalCertificateFile,
            driverPhotoFile: formState.driverPhotoFile, vehicle_assignment_type: formState.vehicleAssignmentType,
            self_vehicle_number: formState.selfVehicleNumber, self_vehicle_type: formState.selfVehicleType,
            self_vehicle_model: formState.selfVehicleModel, self_vehicle_color: formState.selfVehicleColor
         };
         await updateDriverDraft((targetDrv as any).draft_id, payload);
         await submitDriverDraft((targetDrv as any).draft_id);
      } else if (targetDrv && !(targetDrv as any).draft_id) {
         const payload = { ...formState, name: `${formState.firstName} ${formState.lastName}`.trim(), current_step: 5 };
         await updateDriver({ ...payload, id: (targetDrv as Driver).id } as Driver);
      } else {
         const payload = { ...formState, name: `${formState.firstName} ${formState.lastName}`.trim(), current_step: 5 };
         await addDriver(payload as any);
      }
      onSuccess();
    } catch (e: any) {
      let errMsg = 'Failed to save driver.';
      if (e.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          errMsg = e.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
        } else {
          errMsg = e.response.data.detail;
        }
      } else if (e.message) {
        errMsg = e.message;
      }
      setErrors(prev => ({ ...prev, global: errMsg }));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col w-full h-full absolute inset-0 z-[100] overflow-hidden">
      {/* Page Header */}
      <div className="px-6 md:px-10 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm z-10 relative">
        <div>
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onClose}>Driver Management</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-gray-900 dark:text-white">{editingDrv ? 'Edit Driver' : 'Add New Driver'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{editingDrv ? 'Edit Driver' : 'Add New Driver'}</h1>
        </div>
        
        <button 
          type="button"
          onClick={onClose} 
          className="flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Drivers List
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
                const progStatus = getStepProgress(step.id, formState);
                
                let accessible = true;
                for (let i = 0; i < index; i++) {
                  if (getStepProgress(STEPS[i].id, formState) !== 'Completed') {
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
                      if (accessible) setCurrentStep(step.id); 
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
                        progStatus === 'Completed' || (step.id === 'E' && accessible) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        progStatus === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {progStatus === 'Completed' || (step.id === 'E' && accessible) ? '✅ Completed' : progStatus === 'Pending' ? '🟡 Pending' : '○ Not Started'}
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
              <p className="text-gray-500 dark:text-slate-400 mt-1">
                {currentStep === 'A' && 'Enter the fundamental details for the driver.'}
                {currentStep === 'B' && 'Upload necessary documents to verify identity and skills.'}
                {currentStep === 'C' && 'Assign a vehicle, cab, or register a personal self-driven vehicle.'}
                {currentStep === 'D' && 'Set availability and compliance status.'}
                {currentStep === 'E' && 'Review all details before finalizing the driver registration.'}
              </p>
            </div>

            {errors.global && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                <AlertCircle className="w-5 h-5 mr-2" />
                {errors.global}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 md:p-8">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                
                {/* STEP A: Basic Details */}
                {currentStep === 'A' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <InputField 
                        label="Driving License Number" 
                        name="licenseNumber" 
                        fullWidth 
                        errors={errors} 
                        formData={formState} 
                        handleChange={handleChange} 
                        handleBlur={handleBlur}
                        placeholder="DL-1420110012345" 
                        suffixButton={
                            <button 
                                type="button" 
                                id="search-dl-btn"
                                onClick={handleSearchLicense} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors h-full flex items-center"
                            >
                                <Search className="w-4 h-4 mr-2" /> Search
                            </button>
                        } 
                    />
                    <InputField label="First Name" name="firstName" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="First Name" />
                    <InputField label="Last Name" name="lastName" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="Last Name" />
                    <InputField label="Email Address" name="email" type="email" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="john.doe@example.com" />
                    <InputField label="Mobile Number" name="phone" type="tel" maxLength={10} required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="10 Digits" />
                    <InputField label="Father Name" name="fatherName" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="Father Name" />
                    <InputField label="Birth Date" name="birthDate" type="date" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <SelectField label="Gender" name="gender" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} options={['Male', 'Female', 'Other']} />
                    <InputField label="License Issue Date" name="licenseIssueDate" type="date" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <InputField label="License Expiry Date" name="licenseExpiry" type="date" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <InputField label="Years of Experience" name="yearsOfExperience" type="number" min="0" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    
                    <SelectField 
                        label="Vendor" 
                        name="vendorId" 
                        options={vendors.map(v => ({ value: v.id, label: v.name }))} 
                        errors={errors} 
                        formData={formState} 
                        handleChange={handleChange} 
                        handleBlur={handleBlur}
                        placeholder="Select Vendor" 
                        disabled={vendors.length === 0 || formState.vehicleAssignmentType === 'Self Car'} 
                        required={vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car'} 
                    />

                    <InputField label="Pin Code" name="pinCode" type="number" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="Pin Code" />
                    <InputField label="State" name="state" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="State" />
                    <InputField label="City" name="city" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="City" />
                    <InputField label="Full Address" name="address" fullWidth required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="Full Address" />
                  </div>
                )}

                {/* STEP B: Documents */}
                {currentStep === 'B' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FileUpload label="Driving License" name="dlFile" required errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    <FileUpload label="Driver Photo" name="driverPhotoFile" required errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    
                    <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Police Verification</h4>
                    </div>
                    <InputField label="PV Number" name="policeVerificationNumber" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="PV Number" />
                    <InputField label="Expiry Date" name="policeVerificationExpiry" type="date" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <div className="col-span-1 md:col-span-2">
                        <FileUpload label="Upload Police Verification" name="policeVerificationFile" required errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    </div>

                    <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Other Documents</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <InputField label="Aadhaar Number" name="aadhaarNumber" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="12 Digits" maxLength={12} />
                        <FileUpload label="Aadhaar File" name="aadhaarFile" errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    </div>

                    <div className="space-y-4">
                        <InputField label="PAN Number" name="panNumber" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="PAN Number" maxLength={10} />
                        <FileUpload label="PAN File" name="panFile" errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-4 mt-2">
                        <InputField label="Medical Certificate Expiry" name="medicalCertificateExpiry" type="date" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                        <FileUpload label="Medical Certificate" name="medicalCertificateFile" errors={errors} formData={formState} handleFileUpload={handleFileUpload} />
                    </div>
                  </div>
                )}

                {/* STEP C: Vehicle */}
                {currentStep === 'C' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <SelectField label="Assignment Type" name="vehicleAssignmentType" options={['Vendor Vehicle', 'Company Vehicle', 'Self Car']} errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />

                    {(!formState.vehicleAssignmentType || formState.vehicleAssignmentType === 'Vendor Vehicle' || formState.vehicleAssignmentType === 'Company Vehicle') && (
                        <SelectField label="Assign Vehicle/Cab" name="assignedVehicleId" options={vehicles.map(v => ({ value: v.id, label: `${v.plateNumber} - ${v.model}` }))} placeholder="No Vehicle Assigned" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    )}

                    {(formState.vehicleAssignmentType === 'Self Car') && (
                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-2 bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                            <h4 className="col-span-1 md:col-span-2 text-base font-bold text-gray-900 dark:text-white mb-2">Personal Vehicle Details</h4>
                            <InputField label="Vehicle Number" name="selfVehicleNumber" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="e.g., GJ01AB1234" />
                            <InputField label="Vehicle Name / Model" name="selfVehicleModel" required errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="e.g., Maruti Dzire" />
                            <SelectField label="Vehicle Type" name="selfVehicleType" options={['Sedan', 'SUV', 'Hatchback']} errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="Select Type" />
                            <InputField label="Vehicle Color (Optional)" name="selfVehicleColor" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} placeholder="e.g., White" />
                        </div>
                    )}
                  </div>
                )}

                {/* STEP D: Status */}
                {currentStep === 'D' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <SelectField label="Driver Status" name="status" options={[{value: 'Active', label: 'Available'}, {value: 'On Trip', label: 'On Duty'}, {value: 'On Leave', label: 'Off Duty / Leave'}, {value: 'Suspended', label: 'Suspended'}]} errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <SelectField label="Verification Status" name="complianceStatus" options={['Pending', 'Verified', 'Expired', 'Rejected']} errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                    <InputField label="Rating" name="rating" type="number" min="0" max="5" step="0.1" errors={errors} formData={formState} handleChange={handleChange} handleBlur={handleBlur} />
                  </div>
                )}

                {/* STEP E: Review */}
                {currentStep === 'E' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">Basic Details</h4>
                          <button type="button" onClick={() => setCurrentStep('A')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 text-sm">
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Name</span><span className="font-semibold text-gray-900 dark:text-white">{formState.firstName} {formState.lastName}</span></div>
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Phone</span><span className="font-semibold text-gray-900 dark:text-white">{formState.phone}</span></div>
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">License</span><span className="font-semibold text-gray-900 dark:text-white">{formState.licenseNumber}</span></div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">Documents</h4>
                          <button type="button" onClick={() => setCurrentStep('B')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 text-sm">
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">DL Uploaded</span><span className="font-semibold text-gray-900 dark:text-white">{formState.dlFile ? 'Yes' : 'No'}</span></div>
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Photo Uploaded</span><span className="font-semibold text-gray-900 dark:text-white">{formState.driverPhotoFile ? 'Yes' : 'No'}</span></div>
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Police Verif.</span><span className="font-semibold text-gray-900 dark:text-white">{formState.policeVerificationFile ? 'Yes' : 'No'}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">Vehicle & Status</h4>
                          <button type="button" onClick={() => setCurrentStep('C')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 text-sm">
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Status</span><span className="font-semibold text-gray-900 dark:text-white">{formState.status}</span></div>
                          <div><span className="text-gray-500 dark:text-slate-400 block mb-1">Compliance</span><span className="font-semibold text-gray-900 dark:text-white">{formState.complianceStatus}</span></div>
                          <div className="md:col-span-1"><span className="text-gray-500 dark:text-slate-400 block mb-1">Assigned Cab</span><span className="font-semibold text-gray-900 dark:text-white">{formState.vehicleAssignmentType === 'Self Car' ? `${formState.selfVehicleNumber} - ${formState.selfVehicleModel}` : (vehicles.find(v => v.id == formState.assignedVehicleId)?.plateNumber || 'None')}</span></div>
                        </div>
                      </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="h-20 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div>
          {currentStep !== 'A' && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Previous
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {(!editingDrv || (editingDrv as any).is_draft) && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
            </button>
          )}

          {currentStep !== 'E' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-gray-700 dark:text-slate-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Driver
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
