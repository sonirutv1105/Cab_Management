/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '../context/CMSContext';
import { Driver, DriverDraft, Vehicle, User, Vendor, Trip, Booking } from '../types';
import { api, API_URL } from '../api/client';
import AddDriverForm from './drivers/AddDriverForm';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Contact,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  RefreshCcw,
  Upload
} from 'lucide-react';

export default function DriverManagementView() {
  const {
    drivers,
    driverDrafts,
    vendors,
    vehicles,
    addDriver,
    updateDriver,
    deleteDriver,
    addDriverDraft,
    updateDriverDraft,
    deleteDriverDraft,
    submitDriverDraft,
    currentUser
  } = useCMS();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'Active' | 'Draft'>('Active');

  // Search, Filters, Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [complianceFilter, setComplianceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<keyof Driver>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrv, setEditingDrv] = useState<Driver | DriverDraft | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showDraftResume, setShowDraftResume] = useState(false);
  const [activeDraft, setActiveDraft] = useState<DriverDraft | null>(null);

  // Form state
  const [formState, setFormState] = useState<Omit<Driver, 'id'>>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    vendorId: vendors.length > 0 ? vendors[0].id : undefined,
    rating: 5.0,
    status: 'Active',
    complianceStatus: 'Pending',
    assignedVehicleId: undefined,
    dlFile: '',
    aadhaarNumber: '',
    aadhaarFile: '',
    panNumber: '',
    panFile: '',
    policeVerificationNumber: '',
    policeVerificationExpiry: '',
              policeVerificationFile: '',
      medicalCertificateExpiry: '',
      medicalCertificateFile: '',
      driverPhotoFile: '',
      firstName: '',
      lastName: '',
      fatherName: '',
      birthDate: '',
      pinCode: '',
      state: '',
      city: '',
      yearsOfExperience: 0,
      licenseIssueDate: '',
      gender: 'Male',
      address: '',

  });

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isReadOnly = currentUser.role === 'government';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmClose) {
          setShowConfirmClose(false);
        } else if (modalOpen) {
          handleCloseAttempt();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, showConfirmClose, formState, editingDrv]);

  const handleAddDriverClick = async () => {
    try {
      const drafts = await api.getDriverDrafts();
      if (drafts.length > 0) {
        setActiveDraft(drafts[0]);
        setShowDraftResume(true);
      } else {
        openNewDriver();
      }
    } catch (e) {
      console.error(e);
      openNewDriver();
    }
  };

  const openNewDriver = () => {
    closeAndReset();
    setModalOpen(true);
  };

  const handleContinueDraft = () => {
    if (activeDraft) {
      setFormState({
        name: `${activeDraft.first_name || ''} ${activeDraft.last_name || ''}`.trim(),
        phone: activeDraft.mobile_number || '',
        email: activeDraft.email || '',
        licenseNumber: activeDraft.license_number?.startsWith('DRAFT_') ? '' : (activeDraft.license_number || ''),
        licenseExpiry: activeDraft.expiry_date || '',
        vendorId: activeDraft.vendor_id || (vendors.length > 0 ? vendors[0].id : undefined),
        rating: 5.0,
        status: 'Active',
        complianceStatus: 'Pending',
        assignedVehicleId: activeDraft.assigned_vehicle_id || undefined,
        dlFile: '',
        aadhaarNumber: activeDraft.aadhaarNumber || '',
        aadhaarFile: '',
        panNumber: activeDraft.panNumber || '',
        panFile: '',
        policeVerificationNumber: activeDraft.policeVerificationNumber || '',
        policeVerificationExpiry: activeDraft.policeVerificationExpiry || '',
        policeVerificationFile: '',
        medicalCertificateExpiry: activeDraft.medicalCertificateExpiry || '',
        medicalCertificateFile: '',
        driverPhotoFile: '',
        firstName: activeDraft.first_name || '',
        lastName: activeDraft.last_name || '',
        fatherName: activeDraft.father_name || '',
        birthDate: activeDraft.birth_date || '',
        pinCode: activeDraft.pin_code || '',
        state: activeDraft.state || '',
        city: activeDraft.city || '',
        yearsOfExperience: activeDraft.years_of_experience || 0,
        licenseIssueDate: activeDraft.issue_date || '',
        gender: activeDraft.gender || 'Male',
        address: activeDraft.address || '',
      });
      setCurrentStep(activeDraft.current_step || 1);
      setEditingDrv(activeDraft);
      setShowDraftResume(false);
      setModalOpen(true);
    }
  };

  const handleStartNewDriver = async () => {
    if (activeDraft) {
      try {
        await deleteDriverDraft(activeDraft.draft_id);
      } catch (e) {}
    }
    setShowDraftResume(false);
    openNewDriver();
  };

  const handleSort = (field: keyof Driver) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportMenuOpen(false);
    
    const payload = {
      title: "Driver Management Data",
      headers: ["ID", "Name", "Phone", "License", "License Expiry", "Vendor ID", "Rating", "Status", "Compliance Status", "Vehicle ID"],
      rows: displayList.map(d => [
        d.id,
        d.name,
        d.phone,
        d.licenseNumber,
        d.licenseExpiry,
        d.vendorId,
        d.rating,
        d.status,
        d.complianceStatus,
        d.assignedVehicleId || ''
      ])
    };

    try {
      let blob;
      let filename = `Drivers_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      if (format === 'pdf') {
        blob = await api.exportToPdf(payload);
      } else {
        blob = await api.exportToExcel(payload);
      }
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export data.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Driver) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const res = await api.uploadFile(e.target.files[0]);
        setFormState((prev) => ({ ...prev, [fieldName]: res.url }));
      } catch (err: any) {
        alert('File upload failed: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleSearchLicense = async () => {
    if (!formState.licenseNumber) {
      alert('Please enter a license number to search');
      return;
    }
    try {
      const res = await fetch(`/api/drivers/search/${formState.licenseNumber}`);
      if (res.ok) {
        const data = await res.json();
        setFormState(prev => ({
          ...prev,
          ...data,
          yearsOfExperience: data.yearsOfExperience || prev.yearsOfExperience,
        }));
        alert('Driver found and details populated!');
      } else {
        alert('Driver not found');
      }
    } catch (e) {
      alert('Search failed');
    }
  };

  const hasUnsavedChanges = () => {
    if (editingDrv && !(editingDrv as any).draft_id) {
      const existing = editingDrv as Driver;
      return (
        formState.firstName !== (existing.firstName || '') ||
        formState.lastName !== (existing.lastName || '') ||
        formState.phone !== existing.phone ||
        formState.email !== (existing.email || '') ||
        formState.licenseNumber !== existing.licenseNumber ||
        formState.licenseExpiry !== existing.licenseExpiry ||
        formState.vendorId !== existing.vendorId ||
        formState.assignedVehicleId !== (existing.assignedVehicleId || '') ||
        formState.status !== existing.status ||
        formState.complianceStatus !== existing.complianceStatus ||
        formState.rating !== existing.rating ||
        formState.dlFile !== (existing.dlFile || '') ||
        formState.aadhaarNumber !== (existing.aadhaarNumber || '') ||
        formState.aadhaarFile !== (existing.aadhaarFile || '') ||
        formState.panNumber !== (existing.panNumber || '') ||
        formState.panFile !== (existing.panFile || '') ||
        formState.policeVerificationNumber !== (existing.policeVerificationNumber || '') ||
        formState.policeVerificationExpiry !== (existing.policeVerificationExpiry || '') ||
        formState.policeVerificationFile !== (existing.policeVerificationFile || '') ||
        formState.medicalCertificateExpiry !== (existing.medicalCertificateExpiry || '') ||
        formState.medicalCertificateFile !== (existing.medicalCertificateFile || '') ||
        formState.driverPhotoFile !== (existing.driverPhotoFile || '')
      );
    }
    return (
      formState.firstName !== '' ||
      formState.lastName !== '' ||
      formState.phone !== '' ||
      formState.email !== '' ||
      formState.licenseNumber !== '' ||
      formState.licenseExpiry !== '' ||
      formState.assignedVehicleId !== '' ||
      formState.dlFile !== '' ||
      formState.aadhaarNumber !== '' ||
      formState.aadhaarFile !== '' ||
      formState.panNumber !== '' ||
      formState.panFile !== '' ||
      formState.policeVerificationNumber !== '' ||
      formState.policeVerificationExpiry !== '' ||
      formState.policeVerificationFile !== '' ||
      formState.medicalCertificateExpiry !== '' ||
      formState.medicalCertificateFile !== '' ||
      formState.driverPhotoFile !== ''
    );
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true);
    } else {
      closeAndReset();
    }
  };

  const validateStep1 = () => {
    if (!formState.firstName || !formState.lastName || !formState.phone || !formState.email || !formState.address || !formState.licenseNumber || !formState.licenseExpiry) {
      alert("Please fill all mandatory fields (First Name, Last Name, Phone, Email, Address, DL Number, Expiry).");
      return false;
    }

    if (vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car' && !formState.vendorId) {
      alert("Please select a Vendor.");
      return false;
    }
    
    // Email regex validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    if (!formState.dlFile || !formState.policeVerificationFile || !formState.driverPhotoFile) {
      alert("Driving License, Police Verification, and Driver Photo files are mandatory.");
      return false;
    }
    return true;
  };

  const changeStep = async (newStep: number) => {
    setCurrentStep(newStep);
    if (editingDrv && (editingDrv as any).draft_id) {
      try {
        await updateDriverDraft((editingDrv as any).draft_id, { current_step: newStep });
      } catch (e) {
        console.error("Failed to sync draft step", e);
      }
    }
  };

  const validateStep3 = () => {
    if (formState.vehicleAssignmentType === 'Self Car') {
      if (!formState.selfVehicleNumber || !formState.selfVehicleModel) {
        alert("Vehicle Number and Vehicle Name / Model are mandatory for Self Car drivers.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    changeStep(currentStep + 1);
  };

  const handleSaveDraft = async () => {
    try {
      const payload: any = {
        first_name: formState.firstName,
        last_name: formState.lastName,
        father_name: formState.fatherName,
        license_number: formState.licenseNumber,
        email: formState.email,
        mobile_number: formState.phone,
        gender: formState.gender,
        address: formState.address,
        state: formState.state,
        city: formState.city,
        pin_code: formState.pinCode,
        years_of_experience: formState.yearsOfExperience,
        issue_date: formState.licenseIssueDate,
        expiry_date: formState.licenseExpiry,
        assigned_vehicle_id: formState.assignedVehicleId || undefined,
        vendor_id: formState.vendorId || undefined,
        birth_date: formState.birthDate,
        current_step: currentStep,
        dlFile: formState.dlFile,
        aadhaarNumber: formState.aadhaarNumber,
        aadhaarFile: formState.aadhaarFile,
        panNumber: formState.panNumber,
        panFile: formState.panFile,
        policeVerificationNumber: formState.policeVerificationNumber,
        policeVerificationExpiry: formState.policeVerificationExpiry,
        policeVerificationFile: formState.policeVerificationFile,
        medicalCertificateExpiry: formState.medicalCertificateExpiry,
        medicalCertificateFile: formState.medicalCertificateFile,
        driverPhotoFile: formState.driverPhotoFile,
        vehicle_assignment_type: formState.vehicleAssignmentType,
        self_vehicle_number: formState.selfVehicleNumber,
        self_vehicle_type: formState.selfVehicleType,
        self_vehicle_model: formState.selfVehicleModel,
        self_vehicle_color: formState.selfVehicleColor
      };

      if (editingDrv && (editingDrv as any).draft_id) {
        await updateDriverDraft((editingDrv as any).draft_id, payload);
      } else if (!editingDrv) {
        const id = await addDriverDraft(payload);
        setEditingDrv({ ...payload, draft_id: id } as any);
      }
      alert("Draft saved successfully. You can continue later.");
      closeAndReset();
      setActiveTab('Draft');
    } catch (e: any) {
      console.error('Backend validation error on Draft Save:', e.response?.data || e);
      let errMsg = 'Failed to save draft.';
      if (e.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          const fieldErrors = e.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
          errMsg = `Validation Error:\n${fieldErrors}`;
        } else {
          errMsg = e.response.data.detail;
        }
      } else if (e.message) {
        errMsg = e.message;
      }
      alert(errMsg);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    try {
      if (editingDrv && (editingDrv as any).draft_id) {
         const payload: any = {
            first_name: formState.firstName,
            last_name: formState.lastName,
            father_name: formState.fatherName,
            license_number: formState.licenseNumber,
            email: formState.email,
            mobile_number: formState.phone,
            gender: formState.gender,
            address: formState.address,
            state: formState.state,
            city: formState.city,
            pin_code: formState.pinCode,
            years_of_experience: formState.yearsOfExperience,
            issue_date: formState.licenseIssueDate,
            expiry_date: formState.licenseExpiry,
            assigned_vehicle_id: formState.assignedVehicleId || undefined,
            vendor_id: formState.vendorId || undefined,
            birth_date: formState.birthDate,
            current_step: 5,
            dlFile: formState.dlFile,
            aadhaarNumber: formState.aadhaarNumber,
            aadhaarFile: formState.aadhaarFile,
            panNumber: formState.panNumber,
            panFile: formState.panFile,
            policeVerificationNumber: formState.policeVerificationNumber,
            policeVerificationExpiry: formState.policeVerificationExpiry,
            policeVerificationFile: formState.policeVerificationFile,
            medicalCertificateExpiry: formState.medicalCertificateExpiry,
            medicalCertificateFile: formState.medicalCertificateFile,
            driverPhotoFile: formState.driverPhotoFile
         };
         await updateDriverDraft((editingDrv as any).draft_id, payload);
         await submitDriverDraft((editingDrv as any).draft_id);
      } else if (editingDrv && !(editingDrv as any).draft_id) {
         const payload = { ...formState, name: `${formState.firstName} ${formState.lastName}`.trim(), current_step: 5 };
         await updateDriver({ ...payload, id: (editingDrv as Driver).id } as Driver);
      } else {
         const payload = { ...formState, name: `${formState.firstName} ${formState.lastName}`.trim(), current_step: 5 };
         await addDriver(payload as any);
      }
      closeAndReset();
      setActiveTab('Active');

    } catch (e: any) {
      console.error('Backend validation error on Driver Submit:', e.response?.data || e);
      let errMsg = 'Failed to save driver. Please check your inputs.';
      if (e.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          const fieldErrors = e.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
          errMsg = `Validation Error:\n${fieldErrors}`;
        } else {
          errMsg = e.response.data.detail;
        }
      } else if (e.message) {
        errMsg = e.message;
      }
      alert(errMsg);
    }
  };

  const closeAndReset = () => {
    setModalOpen(false);
    setEditingDrv(null);
    setCurrentStep(1);
    setFormState({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '',
      vendorId: vendors.length > 0 ? vendors[0].id : undefined,
      rating: 5.0,
      status: 'Active',
      complianceStatus: 'Pending',
      assignedVehicleId: undefined,
      dlFile: '',
      aadhaarNumber: '',
      aadhaarFile: '',
      panNumber: '',
      panFile: '',
      policeVerificationNumber: '',
      policeVerificationExpiry: '',
      policeVerificationFile: '',
      medicalCertificateExpiry: '',
      medicalCertificateFile: '',
      driverPhotoFile: ''
    });
  };

  const openEdit = (drv: Driver) => {
    setEditingDrv(drv);
    
    // If it's a Self Car, extract vehicle details from the vehicles array
    let svNumber = '';
    let svModel = '';
    let svType = '';
    let svColor = '';
    if ((drv as any).vehicleAssignmentType === 'Self Car' && drv.assignedVehicleId) {
        const assignedV = vehicles.find(v => v.id === drv.assignedVehicleId);
        if (assignedV) {
            svNumber = assignedV.plateNumber || '';
            svModel = assignedV.model || '';
            svType = assignedV.vehicleType || '';
            svColor = assignedV.color || '';
        }
    }

    setFormState({
      name: drv.name,
      phone: drv.phone,
      licenseNumber: drv.licenseNumber,
      licenseExpiry: drv.licenseExpiry,
      vendorId: drv.vendorId,
      rating: drv.rating,
      status: drv.status,
      complianceStatus: drv.complianceStatus,
      assignedVehicleId: drv.assignedVehicleId || undefined,
      dlFile: drv.dlFile || '',
      aadhaarNumber: drv.aadhaarNumber || '',
      aadhaarFile: drv.aadhaarFile || '',
      panNumber: drv.panNumber || '',
      panFile: drv.panFile || '',
      policeVerificationNumber: drv.policeVerificationNumber || '',
      policeVerificationExpiry: drv.policeVerificationExpiry || '',
              policeVerificationFile: drv.policeVerificationFile || '',
        medicalCertificateExpiry: drv.medicalCertificateExpiry || '',
        medicalCertificateFile: drv.medicalCertificateFile || '',
        driverPhotoFile: drv.driverPhotoFile || '',
        firstName: drv.firstName || '',
        lastName: drv.lastName || '',
        fatherName: drv.fatherName || '',
        birthDate: drv.birthDate || '',
        pinCode: drv.pinCode || '',
        state: drv.state || '',
        city: drv.city || '',
        yearsOfExperience: drv.yearsOfExperience || 0,
        licenseIssueDate: drv.licenseIssueDate || '',
        gender: drv.gender || 'Male',
        address: drv.address || '',
        vehicleAssignmentType: (drv as any).vehicleAssignmentType || 'Vendor Vehicle',
        selfVehicleNumber: svNumber,
        selfVehicleType: svType,
        selfVehicleModel: svModel,
        selfVehicleColor: svColor
    });
    setCurrentStep(1);
    setModalOpen(true);
  };

  const renderStatus = (file?: string, expiryDate?: string) => {
    if (!file) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-gray-700">Pending</span>;
    }
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-bold border border-orange-100"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Expired</span>;
    }
    if (formState.complianceStatus === 'Verified' || formState.complianceStatus === 'Compliant') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-100"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Verified</span>;
    }
    if (formState.complianceStatus === 'Rejected') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-bold border border-red-100"><XCircle className="w-3.5 h-3.5 mr-1" /> Rejected</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-bold border border-blue-100"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Uploaded</span>;
  };

  const handleViewDocument = async (e: React.MouseEvent, fileUrl: string) => {
    e.preventDefault();
    console.log("document", fileUrl);
    
    let absoluteUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
      absoluteUrl = `${API_URL.replace('/api', '')}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }
    console.log("documentUrl", absoluteUrl);

    try {
      const response = await fetch(absoluteUrl, { method: 'HEAD' });
      if (!response.ok) {
        alert("Document not found");
        return;
      }
      window.open(absoluteUrl, '_blank');
    } catch (err) {
      alert("Document not found");
    }
  };

  const renderFileControls = (fieldName: keyof Driver, fileUrl?: string) => {
    if (fileUrl) {
      return (
        <div className="flex items-center space-x-2">
          <button type="button" onClick={(e) => handleViewDocument(e, fileUrl)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded duration-150" title="View Document">
            <Eye className="w-4 h-4" />
          </button>
          <label className="p-1 cursor-pointer text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded duration-150" title="Replace Document">
            <RefreshCcw className="w-4 h-4" />
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, fieldName)} />
          </label>
          <button type="button" onClick={() => setFormState(prev => ({...prev, [fieldName]: ''}))} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded duration-150" title="Delete Document">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <label className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] font-bold duration-150 shadow-sm">
        <Upload className="w-3.5 h-3.5" />
        <span>Upload</span>
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, fieldName)} />
      </label>
    );
  };

  // Process data with Search/Filters/Sorting
  const processedDrivers = drivers
    .filter((drv) => {
      const matchesSearch =
        drv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drv.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drv.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'ALL' || drv.status === statusFilter;
      const matchesCompliance = complianceFilter === 'ALL' || drv.complianceStatus === complianceFilter;

      return matchesSearch && matchesStatus && matchesCompliance;
    })
    .sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const processedDrafts = driverDrafts
    .map(draft => ({
      ...draft,
      id: draft.draft_id,
      name: `${draft.first_name || ''} ${draft.last_name || ''}`.trim(),
      phone: draft.mobile_number || '',
      licenseNumber: draft.license_number || '',
      licenseExpiry: draft.expiry_date || '',
      vendorId: draft.vendor_id || undefined,
      rating: 5.0,
      status: 'Draft',
      complianceStatus: draft.verification_status || 'Pending',
      assignedVehicleId: draft.assigned_vehicle_id || undefined,
      firstName: draft.first_name || '',
      lastName: draft.last_name || '',
      fatherName: draft.father_name || '',
      birthDate: draft.birth_date || '',
      pinCode: draft.pin_code || '',
      yearsOfExperience: draft.years_of_experience || 0,
      licenseIssueDate: draft.issue_date || '',
      gender: draft.gender || 'Male',
      address: draft.address || ''
    } as any))
    .filter((drv) => {
      const matchesSearch =
        drv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (drv.licenseNumber && drv.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        drv.phone.includes(searchTerm);
      return matchesSearch;
    })
    .sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const displayList = activeTab === 'Active' ? processedDrivers : processedDrafts;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-6" id="driver-management-panel">
      {/* Search and control headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Contact className="w-5.5 h-5.5 text-blue-600" />
            <span>Driver Management</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Verify driver licenses, status, ratings, and assigned cabs.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('Active')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'Active' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Drivers List
          </button>
          <button
            onClick={() => setActiveTab('Draft')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center space-x-1 ${activeTab === 'Draft' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <span>Draft Drivers</span>
            {driverDrafts.length > 0 && (
              <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">
                {driverDrafts.length}
              </span>
            )}
          </button>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Drivers List</span>
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
                <button 
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Export PDF
                </button>
                <button 
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>

          {!isReadOnly && (
            <button
              onClick={handleAddDriverClick}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold duration-150 flex items-center space-x-1.5 shadow-sm"
              id="add-driver-trigger-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROL BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, DL number, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 speed-150"
            id="driver-search-input"
          />
        </div>

        {/* Status Filter (Only for Active Tab) */}
        {activeTab === 'Active' && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
              id="driver-status-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        )}

        {/* Compliance Filter (Only for Active Tab) */}
        {activeTab === 'Active' && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 shrink-0" />
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300"
              id="driver-compliance-filter"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE DATA TABLE */}
      <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Driver</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="p-3.5">License Details</th>
              <th className="p-3.5">Vendor</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700" onClick={() => handleSort('rating')}>
                <div className="flex items-center space-x-1">
                  <span>Rating</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="p-3.5">Assigned Vehicle</th>
              <th className="p-3.5 text-center">Verification Status</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-700 dark:text-gray-300">
            {displayList.map((drv) => {
              const currentVendor = vendors.find((v) => v.id === drv.vendorId);
              const currentVehicle = vehicles.find((v) => v.id === drv.assignedVehicleId);

              return (
                <tr key={drv.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/60 duration-150">
                  <td className="p-3.5">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{drv.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{drv.phone}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{drv.licenseNumber}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Expires: {drv.licenseExpiry}</div>
                  </td>
                  <td className="p-3.5 text-blue-600 font-semibold">
                    {currentVendor?.name || 'Apex Transit Partners'}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1 font-bold text-gray-900 dark:text-gray-100">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      <span>{drv.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    {currentVehicle ? (
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {currentVehicle.plateNumber} - {currentVehicle.make ? currentVehicle.make + ' ' : ''}{currentVehicle.model}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No vehicle assigned</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {drv.complianceStatus === 'Verified' || drv.complianceStatus === 'Compliant' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verified
                      </span>
                    ) : drv.complianceStatus === 'Pending' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-bold border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Pending
                      </span>
                    ) : drv.complianceStatus === 'Expired' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-bold border border-orange-100">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-bold border border-red-100">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {drv.status === 'Active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 font-bold">
                        Available
                      </span>
                    ) : drv.status === 'On Trip' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 font-bold animate-pulse">
                        On Trip
                      </span>
                    ) : drv.status === 'On Leave' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold">
                        On Leave
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 font-bold">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openEdit(drv)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 duration-150"
                        title="Edit properties"
                        disabled={isReadOnly}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove driver ${drv.name} from active databases?`)) {
                            if (activeTab === 'Draft') {
                              deleteDriverDraft(drv.id);
                            } else {
                              deleteDriver(drv.id);
                            }
                          }
                        }}
                        className={`p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded ${
                          isReadOnly ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        }`}
                        title="Delete record"
                        disabled={isReadOnly}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {displayList.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  No drivers found matching these filters.
                </td>
              </tr>

            )}
          </tbody>
        </table>
      </div>

      {/* DRAFT RESUME POPUP */}
      {showDraftResume && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Unfinished Draft</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You have an unfinished driver draft.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button onClick={handleStartNewDriver} className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 duration-150">
                Start New Driver
              </button>
              <button onClick={handleContinueDraft} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm duration-150">
                Continue Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-PAGE ADD DRIVER FORM */}
      {modalOpen && !showDraftResume && (
        <AddDriverForm
          onClose={closeAndReset}
          onSuccess={() => {
            closeAndReset();
            setActiveTab('Active');
          }}
          editingDrv={editingDrv}
          resumeDraft={activeDraft}
        />
      )}

      {/* UNSAVED CHANGES CONFIRMATION POPUP */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Unsaved changes will be lost. Are you sure you want to close?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  closeAndReset();
                }}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 duration-150"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 duration-150"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
