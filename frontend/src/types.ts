/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'super_admin' | 'company_head' | 'company_hr' | 'government';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  companyName: string;
  department?: string;
  lastActive: string;
  permissions?: { module: string; action: string }[];
}

export type ModuleType =
  | 'Dashboard'
  | 'Driver Management'
  | 'Vehicle Management'
  | 'Trip Management'
  | 'Vendor Management'
  | 'Booking Management'
  | 'Contract Management'
  | 'Live Tracking'
  | 'Fuel Management'
  | 'Maintenance Management'
  | 'Compliance Management'
  | 'Reports & Analytics'
  | 'Notifications'
  | 'Audit Logs'
  | 'User Management'
  | 'Support Tickets'
  | 'Integration Management'
  | 'Settings';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  vendorId: number;
  rating: number;
  status: 'Active' | 'On Trip' | 'On Leave' | 'Suspended';
  complianceStatus: 'Pending' | 'Verified' | 'Expired' | 'Rejected' | 'Compliant' | 'Non-Compliant' | string;
  assignedVehicleId?: number;
  dlFile?: string;
  aadhaarNumber?: string;
  aadhaarFile?: string;
  panNumber?: string;
  panFile?: string;
  policeVerificationNumber?: string;
  policeVerificationExpiry?: string;
  policeVerificationFile?: string;
  medicalCertificateExpiry?: string;
  medicalCertificateFile?: string;
  driverPhotoFile?: string;
  email?: string;
  
  // Extended Details
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  birthDate?: string;
  pinCode?: string;
  state?: string;
  city?: string;
  yearsOfExperience?: number;
  licenseIssueDate?: string;
  gender?: string;
  address?: string;
}

export interface DriverDraft {
  draft_id: number;
  driver_code?: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  license_number?: string;
  email?: string;
  birth_date?: string;
  mobile_number?: string;
  gender?: string;
  address?: string;
  state?: string;
  city?: string;
  pin_code?: string;
  years_of_experience?: number;
  issue_date?: string;
  expiry_date?: string;
  assigned_vehicle_id?: number;
  vendor_id?: number;
  verification_status?: string;
  draft_status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  
  // Mapping helpers for UI
  is_draft?: boolean;
  current_step?: number;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  model: string;
  make: string;
  seatingCapacity: number;
  fuelType: 'Electric' | 'CNG' | 'Diesel' | 'Petrol';
  status: 'Available' | 'On Trip' | 'Under Maintenance' | 'Inactive';
  vendorId: number;
  insuranceExpiry: string;
  lastServiceDate: string;
  year?: number;
  color?: string;
  vehicleType?: string;
  contract?: string;
  assignedDriverId?: number;
}

export interface Trip {
  id: number;
  driverId: number;
  vehicleId: number;
  startTime: string;
  endTime?: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  safetyVerified: boolean;
  vendorId: number;
}



export interface Vendor {
  id: number;
  name: string;
  vehicle_ids?: number[];
  vendorCode?: string;
  vendorType?: string;
  businessCategory?: string;
  panNumber?: string;
  contactName: string;
  designation?: string;
  phone: string;
  altPhone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  website?: string;
  gstNumber?: string;
  fleetSize: number;
  vehicleTypes?: string;
  totalDrivers?: number;
  operatingCities?: string;
  serviceAvailability?: string;
  rating: number;
  slaCompliance: number; // percentage
  complianceRating?: number;
  responseTime?: string;
  status: 'Active' | 'Under Audit' | 'Suspended';
  docGst?: string;
  docPan?: string;
  docRegistration?: string;
  docInsurance?: string;
  docAgreement?: string;
  docOther?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
}

export interface Booking {
  id: number;
  passengerName: string;
  bookingDate: string;
  rideTime: string;
  pickupPoint: string;
  dropPoint: string;
  purpose: string;
  managerApproval: 'Approved' | 'Pending' | 'Rejected';
  hrStatus: 'Approved' | 'Pending' | 'Rejected' | 'Allocated';
  tripId?: string;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  date: string;
  quantity: number; // Liters or kWh
  cost: number;
  odometerReading: number;
  energyType: 'Fuel' | 'Electric';
}

export interface MaintenanceLog {
  id: number;
  vehicleId: number;
  category: 'Scheduled' | 'Breakdown' | 'Compliance Fix' | 'Tire Change';
  description: string;
  cost: number;
  vendorName: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export interface ComplianceDoc {
  id: number;
  entityId: number; // vehicleId or driverId
  entityType: 'Vehicle' | 'Driver';
  documentType: 'Fitness Certificate' | 'PUC' | 'Insurance' | 'Commercial Permit' | 'Police Verification';
  documentNumber: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired';
}



export interface AppNotification {
  id: number;
  title: string;
  message: string;
  category: 'Safety' | 'Trip' | 'Driver' | 'Compliance' | 'System';
  severity: 'Info' | 'Warning' | 'Critical';
  timestamp: string;
  read: boolean;
  targetRole?: string;
  popup_dismissed?: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  userEmail: string;
  userRole: UserRole;
  action: string;
  module: ModuleType;
  details: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
}

export interface SystemSetting {
  id: number;
  category: 'Trip' | 'Safety' | 'Fleet' | 'Auth';
  key: string;
  value: string;
  description: string;
}

// Contract Management Types
export type ContractStatus = 'Draft' | 'Active' | 'Expired' | 'Terminated' | 'Pending Approval' | 'Under Review' | 'Renewal Pending' | 'Cancelled' | 'Closed';
export type ContractType = 'Service Agreement' | 'Vehicle Lease' | 'Vendor Contract' | 'Maintenance Contract' | 'Client Contract' | 'NDA' | 'Government' | 'Corporate' | 'GeM' | 'Tender' | 'Direct Agreement';
export type RenewalStatus = 'Auto-Renew' | 'Manual Renewal' | 'Not Renewing' | 'Renewed' | 'Pending';

export interface Contract {
  id: number;
  // A. Contract Information
  title: string;
  contractNumber: string;
  type: ContractType;
  bidNumber?: string;
  status: ContractStatus;
  category?: string;
  department: string;
  description: string;
  startDate: string;
  endDate: string;
  durationMonths: number;

  // B. Organisation & Buyer Details
  organisationType?: string;
  ministry?: string;
  organisationName?: string;
  buyerName?: string;
  buyerDesignation?: string;
  buyerContact?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerState?: string;
  buyerDivision?: string;

  // C. Client Information
  clientName: string;
  contactPerson: string;
  clientDesignation?: string;
  email: string;
  phone: string;
  clientAddress?: string;
  clientState?: string;
  clientPincode?: string;

  // D. Financial & Payment Information
  value: number; // Total Contract Value
  currency: string;
  monthlyBaseFare?: number;
  gstPercentage?: number;
  gstAmount?: number;
  securityDeposit: number;
  ePbgPercentage?: number;
  paymentMode?: string;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One-Time' | string;
  paymentTerms: string;
  invoiceRaisedTo?: string;
  invoiceDueDate?: string;
  latePaymentPenalty?: string;
  adminApproval?: string;
  financialApproval?: string;
  ifdConcurrence?: boolean;

  // E. Consignee Details
  consigneeName?: string;
  consigneeDesignation?: string;
  consigneeContact?: string;
  consigneeEmail?: string;
  consigneeAddress?: string;
  consigneeState?: string;
  consigneePincode?: string;

  // F. Vehicle Requirements
  vehicleType?: string;
  vehicleCategory?: string;
  carModels?: string;
  serviceType?: string;
  usageVariant?: string;
  numberOfVehicles?: number;
  fuelType?: string;
  acRequired?: boolean;
  reportingLocation?: string;
  dutyHours?: string;
  driverRequired?: boolean;
  gpsRequired?: boolean;
  brandingRequired?: boolean;
  vehicleAgeLimit?: number;
  replacementClause?: string;

  // G. SLA & Compliance
  slaDetails?: string;
  penaltyClause?: string;
  insuranceRequired?: string;
  driverDocsRequired?: string;
  policeVerification?: boolean;
  backgroundVerification?: boolean;
  escalationMatrix?: string;
  specialInstructions?: string;

  // H. Renewal & Termination
  autoRenewal: boolean;
  reminderDays: number;
  renewalTerms?: string;
  renewalStatus: RenewalStatus;
  terminationNotice?: string;
  terminationClause?: string;

  // I. Documents & Attachments
  contractPdfUrl?: string;
  scopeOfWorkUrl?: string;

  // Corporate Specific Fields
  vendorName?: string;
  vendorContact?: string;
  driverName?: string;
  driverContact?: string;
  rateType?: string;
  estimatedAmount?: number;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  reportingTime?: string;

  
  // J. Audit Information
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  approvalDate?: string;
}

export interface ContractService {
  id: number;
  contractId: number;
  serviceType: string;
  vehiclesCount: number;
  driversCount: number;
  locations: string[];
  workingHours: string;
  slaDetails: string;
}

export interface ContractDocument {
  id: number;
  contractId: number;
  title: string;
  category: 'Signed Contract' | 'Work Order' | 'Supporting Document' | 'Amendment';
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  version: string;
}

export interface ContractNote {
  id: number;
  contractId: number;
  type: 'Internal' | 'Customer';
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface ContractPayment {
  id: number;
  contractId: number;
  amount: number;
  invoiceNumber: string;
  date: string;
  status: 'Received' | 'Pending' | 'Overdue';
}

export interface ContractActivityLog {
  id: number;
  contractId: number;
  action: 'Created' | 'Edited' | 'Status Changed' | 'Document Uploaded' | 'Note Added' | 'Payment Logged' | 'Deleted';
  userId: number;
  userName: string;
  timestamp: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface ContractDraft {
  id: number;
  title: string | null;
  formData: string; // JSON string
  sectionStatus: string; // JSON string
  activeSection: string | null;
  completionPercentage: number;
  attachments: string; // JSON string
  createdAt: string;
  updatedAt: string;
}


// Corporate Contract Types
export interface StateRateCard {
  id: number;
  state: string;
  vehicleCategory: string;
  fuelType?: string;
  monthlyPackageRate: number;
  perKmRate: number;
  perHourRate: number;
  airportRate: number;
  localRate: number;
  outstationRate: number;
}

export interface CorporateContractVehicle {
  id?: number;
  contract_id?: number;
  vehicleType?: string;
  vehicleCategory?: string;
  fuelType?: string;
  transmission?: string;
  quantity: number;
  monthlyKmIncluded: number;
  dailyLimit: number;
  extraKmCharge: number;
  minimumBillingHours: number;
  nightCharges: number;
  driverAllowance: number;
  waitingCharges: number;
  parking?: string;
  toll?: string;
  remarks?: string;
}

export interface CorporateContract {
  id?: number;
  contractNumber?: string;
  contractName?: string;
  company?: string;
  branch?: string;
  department?: string;
  clientContactPerson?: string;
  clientMobile?: string;
  clientEmail?: string;
  contractStatus?: string;
  priority?: string;
  description?: string;

  startDate?: string;
  endDate?: string;
  renewalType?: string;
  renewalReminder: number;
  isActive: boolean;

  operatingState?: string;
  operatingCity?: string;
  officeLocation?: string;
  serviceRadius: number;

  dedicatedVehicle: boolean;
  employeePickupDrop: boolean;
  airportTransfer: boolean;
  localDuty: boolean;
  outstation: boolean;
  onDemandBooking: boolean;
  vipService: boolean;
  support24x7: boolean;

  companyProvidesDriver: boolean;
  dedicatedDriver: boolean;
  backupDriver: boolean;
  driverRotation?: string;
  driverShiftTiming?: string;
  driverUniformRequired: boolean;

  billingCycle?: string;
  invoiceGenerationDate: number;
  creditDays: number;
  gst: number;
  tds: number;
  penaltyRules?: string;
  latePaymentRules?: string;

  contractClauses?: string;
  cancellationPolicy?: string;
  penaltyClause?: string;
  renewalClause?: string;
  notes?: string;

  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  createdAt?: string;

  vehicles: CorporateContractVehicle[];
}
