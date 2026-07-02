from pydantic import BaseModel, ConfigDict, model_validator, Field
from typing import Optional, List, Any, Dict, Union
import re

class UserBase(BaseModel):
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    companyName: str
    department: Optional[str] = None
    lastActive: str = "Just now"
    status: Optional[str] = "Active"
    created_at: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    companyName: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None

class UserResponse(UserBase):
    id: int
    permissions: Optional[List[dict]] = None
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    password: str

class DriverBase(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    licenseNumber: Optional[str] = None
    licenseExpiry: Optional[str] = None
    vendorId: Optional[int] = None
    rating: float = 5.0
    status: str = "Active"
    complianceStatus: str = "Pending"
    assignedVehicleId: Optional[int] = None
    dlFile: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    aadhaarFile: Optional[str] = None
    panNumber: Optional[str] = None
    panFile: Optional[str] = None
    policeVerificationNumber: Optional[str] = None
    policeVerificationExpiry: Optional[str] = None
    policeVerificationFile: Optional[str] = None
    medicalCertificateExpiry: Optional[str] = None
    medicalCertificateFile: Optional[str] = None
    driverPhotoFile: Optional[str] = None
    is_draft: bool = False
    current_step: int = 1
    completed_at: Optional[str] = None
    
    # Extended Details
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    fatherName: Optional[str] = None
    birthDate: Optional[str] = None
    pinCode: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    licenseIssueDate: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    
    # Self Car Fields
    vehicleAssignmentType: Optional[str] = None
    selfVehicleNumber: Optional[str] = None
    selfVehicleType: Optional[str] = None
    selfRcNumber: Optional[str] = None
    selfInsuranceExpiry: Optional[str] = None
    
    @model_validator(mode='after')
    def validate_phone(self):
        if self.phone and not re.match(r"^\d{10}$", self.phone):
            raise ValueError('Mobile number must contain exactly 10 digits.')
        return self

class DriverCreate(DriverBase):
    pass

class DriverResponse(DriverBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    licenseNumber: Optional[str] = None
    licenseExpiry: Optional[str] = None
    vendorId: Optional[int] = None
    rating: Optional[float] = None
    status: Optional[str] = None
    complianceStatus: Optional[str] = None
    assignedVehicleId: Optional[int] = None
    dlFile: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    aadhaarFile: Optional[str] = None
    panNumber: Optional[str] = None
    panFile: Optional[str] = None
    policeVerificationNumber: Optional[str] = None
    policeVerificationExpiry: Optional[str] = None
    policeVerificationFile: Optional[str] = None
    medicalCertificateExpiry: Optional[str] = None
    medicalCertificateFile: Optional[str] = None
    driverPhotoFile: Optional[str] = None
    is_draft: Optional[bool] = None
    current_step: Optional[int] = None
    completed_at: Optional[str] = None
    
    # Extended Details
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    fatherName: Optional[str] = None
    birthDate: Optional[str] = None
    pinCode: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    licenseIssueDate: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    
    # Self Car Fields
    vehicleAssignmentType: Optional[str] = None
    selfVehicleNumber: Optional[str] = None
    selfVehicleType: Optional[str] = None
    selfVehicleModel: Optional[str] = None
    selfVehicleColor: Optional[str] = None
    selfRcNumber: Optional[str] = None
    selfInsuranceExpiry: Optional[str] = None

class DriverDraftBase(BaseModel):
    driver_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    father_name: Optional[str] = None
    license_number: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None
    mobile_number: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pin_code: Optional[str] = None
    years_of_experience: Optional[int] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    assigned_vehicle_id: Optional[int] = None
    vendor_id: Optional[int] = None
    verification_status: Optional[str] = "Pending"
    draft_status: Optional[str] = "Draft"
    current_step: Optional[int] = 1
    
    dlFile: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    aadhaarFile: Optional[str] = None
    panNumber: Optional[str] = None
    panFile: Optional[str] = None
    policeVerificationNumber: Optional[str] = None
    policeVerificationExpiry: Optional[str] = None
    policeVerificationFile: Optional[str] = None
    medicalCertificateExpiry: Optional[str] = None
    medicalCertificateFile: Optional[str] = None
    driverPhotoFile: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    # Self Car Fields
    vehicle_assignment_type: Optional[str] = None
    self_vehicle_number: Optional[str] = None
    self_vehicle_type: Optional[str] = None
    self_vehicle_model: Optional[str] = None
    self_vehicle_color: Optional[str] = None
    self_rc_number: Optional[str] = None
    self_insurance_expiry: Optional[str] = None
    
    @model_validator(mode='after')
    def validate_mobile(self):
        if self.mobile_number and not re.match(r"^\d{10}$", self.mobile_number):
            raise ValueError('Mobile number must contain exactly 10 digits.')
        return self

class DriverDraftCreate(DriverDraftBase):
    pass

class DriverDraftUpdate(DriverDraftBase):
    pass

class DriverDraftResponse(DriverDraftBase):
    draft_id: int
    model_config = ConfigDict(from_attributes=True)

class VehicleBase(BaseModel):
    plateNumber: str
    model: str
    make: str
    seatingCapacity: int
    fuelType: str
    status: str = "Available"
    vendorId: int
    insuranceExpiry: str
    lastServiceDate: str
    year: Optional[int] = None
    color: Optional[str] = None
    vehicleType: Optional[str] = None
    contract: Optional[str] = None
    assignedDriverId: Optional[int] = None
    
    @model_validator(mode='after')
    def validate_year(self):
        if self.year is not None and not re.match(r"^\d{4}$", str(self.year)):
            raise ValueError('Year must contain exactly 4 digits.')
        return self

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TripBase(BaseModel):
    driverId: int
    vehicleId: int
    startTime: str
    endTime: Optional[str] = None
    status: str = "Scheduled"
    safetyVerified: bool = False
    vendorId: int

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class VendorBase(BaseModel):
    name: str
    contactName: str
    phone: str
    email: str
    fleetSize: int = Field(..., gt=0)
    rating: float = 5.0
    slaCompliance: float = 100.0
    status: str = "Active"

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BookingBase(BaseModel):
    passengerName: str
    bookingDate: str
    rideTime: str
    pickupPoint: str
    dropPoint: str
    purpose: str
    managerApproval: str = "Pending"
    hrStatus: str = "Pending"
    tripId: Optional[int] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractBase(BaseModel):
    contractNumber: Optional[str] = None
    title: Optional[str] = None
    type: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    clientName: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    durationMonths: Optional[int] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    paymentTerms: Optional[str] = None
    billingFrequency: Optional[str] = None
    securityDeposit: Optional[float] = None
    taxInformation: Optional[str] = None
    autoRenewal: Optional[bool] = False
    renewalDate: Optional[str] = None
    reminderDays: Optional[int] = None
    renewalTerms: Optional[str] = None
    renewalStatus: Optional[str] = None
    status: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    createdBy: Optional[str] = None
    updatedBy: Optional[str] = None
    
    # Contract Buyer Details
    organisationType: Optional[str] = None
    ministry: Optional[str] = None
    organisationName: Optional[str] = None
    buyerName: Optional[str] = None
    buyerDesignation: Optional[str] = None
    buyerContact: Optional[str] = None
    buyerEmail: Optional[str] = None
    buyerAddress: Optional[str] = None
    buyerState: Optional[str] = None
    buyerDivision: Optional[str] = None

    # Contract Client Details extension
    clientGstin: Optional[str] = None
    clientDesignation: Optional[str] = None
    clientState: Optional[str] = None
    clientPincode: Optional[str] = None
    clientAddress: Optional[str] = None

    # Contract Financials
    monthlyBaseFare: Optional[float] = None
    gstPercentage: Optional[float] = None
    gstAmount: Optional[float] = None
    ePbgPercentage: Optional[float] = None
    paymentMode: Optional[str] = None
    invoiceRaisedTo: Optional[str] = None
    invoiceDueDate: Optional[str] = None
    latePaymentPenalty: Optional[str] = None
    adminApproval: Optional[str] = None
    financialApproval: Optional[str] = None
    ifdConcurrence: Optional[bool] = False

    # Contract Consignee Details
    consigneeName: Optional[str] = None
    consigneeDesignation: Optional[str] = None
    consigneeContact: Optional[str] = None
    consigneeEmail: Optional[str] = None
    consigneeAddress: Optional[str] = None
    consigneeState: Optional[str] = None
    consigneePincode: Optional[str] = None

    # Contract Vehicle Requirements
    vehicleType: Optional[str] = None
    vehicleCategory: Optional[str] = None
    carModels: Optional[str] = None
    usageVariant: Optional[str] = None
    numberOfVehicles: Optional[int] = 1
    fuelType: Optional[str] = None
    acRequired: Optional[bool] = False
    reportingLocation: Optional[str] = None
    dutyHours: Optional[str] = None
    driverRequired: Optional[bool] = False
    gpsRequired: Optional[bool] = False
    brandingRequired: Optional[bool] = False
    vehicleAgeLimit: Optional[str] = None
    replacementClause: Optional[str] = None

    # Contract SLA Compliance
    slaDetails: Optional[str] = None
    penaltyClause: Optional[str] = None
    insuranceRequired: Optional[str] = None
    driverDocsRequired: Optional[str] = None
    policeVerification: Optional[bool] = False
    backgroundVerification: Optional[bool] = False
    escalationMatrix: Optional[str] = None
    specialInstructions: Optional[str] = None

    # Contract Renewal Termination
    terminationNotice: Optional[str] = None
    terminationClause: Optional[str] = None
    
    # Related nested arrays (for create, update, and response)
    services: Optional[List[Dict[str, Any]]] = []
    documents: Optional[List[Dict[str, Any]]] = []
    notes: Optional[List[Dict[str, Any]]] = []
    payments: Optional[List[Dict[str, Any]]] = []

class ContractCreate(ContractBase):

    @model_validator(mode='after')
    def validate_contract(self):
        if not self.title or len(self.title) < 3 or len(self.title) > 200:
            raise ValueError('Title must be between 3 and 200 characters')
        if not self.contractNumber:
            raise ValueError('Contract Number is required')
        if not self.type:
            raise ValueError('Contract Type is required')
        if not self.status:
            raise ValueError('Contract Status is required')
        if not self.department:
            raise ValueError('Department is required')
        if not self.startDate:
            raise ValueError('Start Date is required')
        if not self.endDate:
            raise ValueError('End Date is required')
        if self.startDate and self.endDate and self.endDate <= self.startDate:
            raise ValueError('End Date must be after Start Date')
            
        if not self.organisationName:
            raise ValueError('Organisation Name is required')
        if self.buyerEmail and not re.match(r"[^@]+@[^@]+\.[^@]+", self.buyerEmail):
            raise ValueError('Buyer Email is invalid')
        if self.buyerContact and not re.match(r"^\+?[\d\s]+$", self.buyerContact):
            raise ValueError('Buyer Contact must be numeric')
            
        if not self.clientName:
            raise ValueError('Client Name is required')
        if not self.contactPerson:
            raise ValueError('Contact Person is required')
        if self.email and not re.match(r"[^@]+@[^@]+\.[^@]+", self.email):
            raise ValueError('Client Email is invalid')
        if not self.phone or not re.match(r"^\+?[\d\s]+$", self.phone):
            raise ValueError('Client Phone is required and must be numeric')
        if not self.clientAddress:
            raise ValueError('Client Address is required')
            
        if self.value is None or self.value <= 0:
            raise ValueError('Contract Value must be greater than 0')
        if not self.paymentTerms:
            raise ValueError('Payment Terms is required')
            
        if not self.consigneeName:
            raise ValueError('Consignee Name is required')
        if not self.consigneeAddress:
            raise ValueError('Consignee Address is required')
        if not self.consigneeState:
            raise ValueError('Consignee State is required')
        if self.consigneePincode and not re.match(r"^\d{6}$", str(self.consigneePincode)):
            raise ValueError('Consignee Pincode must be 6 digits')
            
        if not self.vehicleType:
            raise ValueError('Vehicle Type is required')
        if self.numberOfVehicles is None or self.numberOfVehicles <= 0:
            raise ValueError('Quantity must be greater than 0')
            
        if self.gstPercentage is not None and not (0 <= self.gstPercentage <= 100):
            raise ValueError('GST Percentage must be between 0 and 100')
        if self.ePbgPercentage is not None and not (0 <= self.ePbgPercentage <= 100):
            raise ValueError('ePBG Percentage must be between 0 and 100')
            
        if self.renewalDate and self.startDate and self.renewalDate <= self.startDate:
            raise ValueError('Renewal Date must be after Start Date')
        
        if self.clientGstin and len(self.clientGstin) != 15:
            raise ValueError('GSTIN must be exactly 15 characters')
            
        return self

class ContractResponse(ContractBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class VehicleUpdate(BaseModel):
    plateNumber: Optional[str] = None
    model: Optional[str] = None
    make: Optional[str] = None
    seatingCapacity: Optional[int] = None
    fuelType: Optional[str] = None
    status: Optional[str] = None
    vendorId: Optional[int] = None
    insuranceExpiry: Optional[str] = None
    lastServiceDate: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    vehicleType: Optional[str] = None
    contract: Optional[str] = None
    assignedDriverId: Optional[int] = None

class TripUpdate(BaseModel):
    driverId: Optional[int] = None
    vehicleId: Optional[int] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    status: Optional[str] = None
    safetyVerified: Optional[bool] = None
    vendorId: Optional[int] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contactName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fleetSize: Optional[int] = Field(None, gt=0)
    rating: Optional[float] = None
    slaCompliance: Optional[float] = None
    status: Optional[str] = None

class BookingUpdate(BaseModel):
    passengerName: Optional[str] = None
    bookingDate: Optional[str] = None
    rideTime: Optional[str] = None
    pickupPoint: Optional[str] = None
    dropPoint: Optional[str] = None
    purpose: Optional[str] = None
    managerApproval: Optional[str] = None
    hrStatus: Optional[str] = None
    tripId: Optional[int] = None

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    clientName: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    durationMonths: Optional[int] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    paymentTerms: Optional[str] = None
    billingFrequency: Optional[str] = None
    securityDeposit: Optional[float] = None
    taxInformation: Optional[str] = None
    autoRenewal: Optional[bool] = None
    renewalDate: Optional[str] = None
    reminderDays: Optional[int] = None
    renewalTerms: Optional[str] = None
    renewalStatus: Optional[str] = None
    status: Optional[str] = None
    updatedAt: Optional[str] = None
    updatedBy: Optional[str] = None

    services: Optional[List[Dict[str, Any]]] = []
    documents: Optional[List[Dict[str, Any]]] = []
    notes: Optional[List[Dict[str, Any]]] = []
    payments: Optional[List[Dict[str, Any]]] = []

# New Schemas
class FuelLogBase(BaseModel):
    vehicleId: int
    date: str
    quantity: float
    cost: float
    odometerReading: float
    energyType: str = "Fuel"

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class FuelLogUpdate(BaseModel):
    vehicleId: Optional[int] = None
    date: Optional[str] = None
    quantity: Optional[float] = None
    cost: Optional[float] = None
    odometerReading: Optional[float] = None
    energyType: Optional[str] = None

class MaintenanceLogBase(BaseModel):
    vehicleId: int
    category: str
    description: str
    cost: float
    vendorName: str
    startDate: str
    endDate: str
    status: str = "Upcoming"

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MaintenanceLogUpdate(BaseModel):
    vehicleId: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    vendorName: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    status: Optional[str] = None

class ComplianceDocBase(BaseModel):
    entityId: int
    entityType: str
    documentType: str
    documentNumber: str
    expiryDate: str
    status: str = "Valid"

class ComplianceDocCreate(ComplianceDocBase):
    pass

class ComplianceDocResponse(ComplianceDocBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ComplianceDocUpdate(BaseModel):
    entityId: Optional[int] = None
    entityType: Optional[str] = None
    documentType: Optional[str] = None
    documentNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    status: Optional[str] = None

class AppNotificationBase(BaseModel):
    title: str
    message: str
    category: str
    severity: str
    timestamp: str
    read: bool = False
    targetRole: Optional[str] = None

class AppNotificationCreate(AppNotificationBase):
    pass

class AppNotificationResponse(AppNotificationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AppNotificationUpdate(BaseModel):
    read: Optional[bool] = None

class AuditLogBase(BaseModel):
    timestamp: str
    userId: Optional[str] = None
    userEmail: str
    userRole: str
    action: str
    module: str
    details: Optional[str] = None
    ipAddress: Optional[str] = None
    status: str = "Success"

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SystemSettingBase(BaseModel):
    category: str
    key: str
    value: str
    description: str

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingResponse(SystemSettingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SystemSettingUpdate(BaseModel):
    category: Optional[str] = None
    key: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None

class ContractServiceBase(BaseModel):
    contractId: Optional[int] = None
    serviceType: str
    vehiclesCount: int
    driversCount: Optional[int] = None
    locations: Optional[str] = None
    workingHours: Optional[str] = None
    slaDetails: Optional[str] = None

class ContractServiceCreate(ContractServiceBase):
    pass

class ContractServiceResponse(ContractServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractServiceUpdate(BaseModel):
    contractId: Optional[int] = None
    serviceType: Optional[str] = None
    vehiclesCount: Optional[int] = None
    driversCount: Optional[int] = None
    locations: Optional[str] = None
    workingHours: Optional[str] = None
    slaDetails: Optional[str] = None

class ContractDocumentBase(BaseModel):
    contractId: int
    title: str
    category: str
    fileUrl: str
    fileSize: str
    uploadedAt: str
    uploadedBy: str
    version: str

class ContractDocumentCreate(ContractDocumentBase):
    pass

class ContractDocumentResponse(ContractDocumentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractDocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None

class ContractNoteBase(BaseModel):
    contractId: int
    type: str
    content: str
    createdAt: str
    createdBy: str

class ContractNoteCreate(ContractNoteBase):
    pass

class ContractNoteResponse(ContractNoteBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractNoteUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[str] = None

class ContractPaymentBase(BaseModel):
    contractId: int
    amount: float
    invoiceNumber: str
    date: str
    status: str

class ContractPaymentCreate(ContractPaymentBase):
    pass

class ContractPaymentResponse(ContractPaymentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    invoiceNumber: Optional[str] = None
    date: Optional[str] = None
    status: Optional[str] = None

class ContractActivityLogBase(BaseModel):
    contractId: int
    action: str
    userId: int
    userName: str
    timestamp: str
    details: str
    previousValue: Optional[str] = None
    newValue: Optional[str] = None

class ContractActivityLogCreate(ContractActivityLogBase):
    pass

class ContractActivityLogResponse(ContractActivityLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DriverDocumentBase(BaseModel):
    driver_id: int
    document_type: str
    document_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    file_name: Optional[str] = None
    file_path: str
    file_extension: Optional[str] = None
    file_size: Optional[int] = None
    verification_status: str = "Pending"
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str

class DriverDocumentCreate(DriverDocumentBase):
    pass

class DriverDocumentResponse(DriverDocumentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DriverDocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_extension: Optional[str] = None
    file_size: Optional[int] = None
    verification_status: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = None
    updated_at: Optional[str] = None
class ContractDraftBase(BaseModel):
    id: Optional[Union[int, str]] = None
    title: Optional[str] = None
    formData: str
    sectionStatus: str
    activeSection: Optional[str] = None
    completionPercentage: float = 0.0
    attachments: Optional[str] = None
    createdAt: str
    updatedAt: str

class ContractDraftCreate(ContractDraftBase):
    pass

class ContractDraftResponse(ContractDraftBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractDraftUpdate(BaseModel):
    title: Optional[str] = None
    formData: Optional[str] = None
    sectionStatus: Optional[str] = None
    activeSection: Optional[str] = None
    completionPercentage: Optional[float] = None
    attachments: Optional[str] = None
    updatedAt: Optional[str] = None


class ContractBuyerDetailBase(BaseModel):
    contractId: int
    organisationType: Optional[str] = None
    ministry: Optional[str] = None
    organisationName: Optional[str] = None
    buyerName: Optional[str] = None
    buyerDesignation: Optional[str] = None
    buyerContact: Optional[str] = None
    buyerEmail: Optional[str] = None
    buyerAddress: Optional[str] = None
    buyerState: Optional[str] = None
    buyerDivision: Optional[str] = None

class ContractBuyerDetailCreate(ContractBuyerDetailBase):
    pass

class ContractBuyerDetailUpdate(ContractBuyerDetailBase):
    contractId: Optional[int] = None

class ContractBuyerDetailResponse(ContractBuyerDetailBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractClientDetailBase(BaseModel):
    contractId: int
    clientName: Optional[str] = None
    clientGstin: Optional[str] = None
    contactPerson: Optional[str] = None
    clientDesignation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    clientState: Optional[str] = None
    clientPincode: Optional[str] = None
    clientAddress: Optional[str] = None

class ContractClientDetailCreate(ContractClientDetailBase):
    pass

class ContractClientDetailUpdate(ContractClientDetailBase):
    contractId: Optional[int] = None

class ContractClientDetailResponse(ContractClientDetailBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractFinancialBase(BaseModel):
    contractId: int
    monthlyBaseFare: Optional[float] = None
    gstPercentage: Optional[float] = None
    gstAmount: Optional[float] = None
    securityDeposit: Optional[float] = None
    ePbgPercentage: Optional[float] = None
    paymentMode: Optional[str] = None
    billingFrequency: Optional[str] = None
    paymentTerms: Optional[str] = None
    invoiceRaisedTo: Optional[str] = None
    invoiceDueDate: Optional[str] = None
    latePaymentPenalty: Optional[str] = None
    adminApproval: Optional[str] = None
    financialApproval: Optional[str] = None
    ifdConcurrence: Optional[bool] = False

class ContractFinancialCreate(ContractFinancialBase):
    pass

class ContractFinancialUpdate(ContractFinancialBase):
    contractId: Optional[int] = None

class ContractFinancialResponse(ContractFinancialBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractConsigneeDetailBase(BaseModel):
    contractId: int
    consigneeName: Optional[str] = None
    consigneeDesignation: Optional[str] = None
    consigneeContact: Optional[str] = None
    consigneeEmail: Optional[str] = None
    consigneeAddress: Optional[str] = None
    consigneeState: Optional[str] = None
    consigneePincode: Optional[str] = None

class ContractConsigneeDetailCreate(ContractConsigneeDetailBase):
    pass

class ContractConsigneeDetailUpdate(ContractConsigneeDetailBase):
    contractId: Optional[int] = None

class ContractConsigneeDetailResponse(ContractConsigneeDetailBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractVehicleRequirementBase(BaseModel):
    contractId: int
    vehicleType: Optional[str] = None
    vehicleCategory: Optional[str] = None
    carModels: Optional[str] = None
    usageVariant: Optional[str] = None
    numberOfVehicles: Optional[int] = 1
    fuelType: Optional[str] = None
    acRequired: Optional[bool] = False
    reportingLocation: Optional[str] = None
    dutyHours: Optional[str] = None
    driverRequired: Optional[bool] = False
    gpsRequired: Optional[bool] = False
    brandingRequired: Optional[bool] = False
    vehicleAgeLimit: Optional[str] = None
    replacementClause: Optional[str] = None

class ContractVehicleRequirementCreate(ContractVehicleRequirementBase):
    pass

class ContractVehicleRequirementUpdate(ContractVehicleRequirementBase):
    contractId: Optional[int] = None

class ContractVehicleRequirementResponse(ContractVehicleRequirementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractSlaComplianceBase(BaseModel):
    contractId: int
    slaDetails: Optional[str] = None
    penaltyClause: Optional[str] = None
    insuranceRequired: Optional[str] = None
    driverDocsRequired: Optional[str] = None
    policeVerification: Optional[bool] = False
    backgroundVerification: Optional[bool] = False
    escalationMatrix: Optional[str] = None
    specialInstructions: Optional[str] = None

class ContractSlaComplianceCreate(ContractSlaComplianceBase):
    pass

class ContractSlaComplianceUpdate(ContractSlaComplianceBase):
    contractId: Optional[int] = None

class ContractSlaComplianceResponse(ContractSlaComplianceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContractRenewalTerminationBase(BaseModel):
    contractId: int
    autoRenewal: Optional[bool] = False
    reminderDays: Optional[int] = None
    renewalTerms: Optional[str] = None
    renewalStatus: Optional[str] = None
    terminationNotice: Optional[str] = None
    terminationClause: Optional[str] = None

class ContractRenewalTerminationCreate(ContractRenewalTerminationBase):
    pass

class ContractRenewalTerminationUpdate(ContractRenewalTerminationBase):
    contractId: Optional[int] = None

class ContractRenewalTerminationResponse(ContractRenewalTerminationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)



# --- ANNOUNCEMENTS ---
from typing import List

class AnnouncementBase(BaseModel):
    title: str
    message: Optional[str] = None
    priority: str = 'Normal'
    audience_type: str = 'All Companies'
    recipient_type: str = 'Both'
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None
    status: str = 'Active'

class AnnouncementCreate(AnnouncementBase):
    selected_companies: Optional[List[int]] = None

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AnnouncementRecipientResponse(BaseModel):
    id: int
    announcement_id: int
    company_id: int
    user_id: int
    is_read: bool
    read_at: Optional[str] = None
    delivered_at: Optional[str] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: int
    is_read: bool
    read_at: Optional[str] = None
    created_at: Optional[str] = None
    announcement: AnnouncementResponse

    model_config = ConfigDict(from_attributes=True)

class TicketAttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: str

class TicketAttachmentResponse(TicketAttachmentBase):
    id: int
    message_id: Optional[int] = None
    ticket_id: int
    created_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TicketMessageBase(BaseModel):
    message: str

class TicketMessageCreate(TicketMessageBase):
    pass

class TicketMessageResponse(TicketMessageBase):
    id: int
    ticket_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    created_at: Optional[str] = None
    attachments: List[TicketAttachmentResponse] = []
    model_config = ConfigDict(from_attributes=True)

class SupportTicketBase(BaseModel):
    subject: str
    category: str
    priority: str
    
class SupportTicketCreate(SupportTicketBase):
    message: str

class SupportTicketResponse(SupportTicketBase):
    id: int
    ticket_id: str
    company_id: int
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    created_by_id: int
    created_by_name: str
    created_by_role: str
    messages: List[TicketMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None

# --- CORPORATE CONTRACT SCHEMAS ---

class StateRateCardBase(BaseModel):
    state: str
    vehicleCategory: str
    fuelType: Optional[str] = None
    monthlyPackageRate: float = 0.0
    perKmRate: float = 0.0
    perHourRate: float = 0.0
    airportRate: float = 0.0
    localRate: float = 0.0
    outstationRate: float = 0.0

class StateRateCardCreate(StateRateCardBase):
    pass

class StateRateCardResponse(StateRateCardBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractVehicleBase(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_strings_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k, v in data.items():
                if v == "":
                    data[k] = None
        return data

    vehicleType: Optional[str] = None
    vehicleCategory: Optional[str] = None
    fuelType: Optional[str] = None
    transmission: Optional[str] = None
    quantity: Optional[int] = 0
    monthlyKmIncluded: Optional[int] = 0
    dailyLimit: Optional[int] = 0
    extraKmCharge: Optional[float] = 0.0
    minimumBillingHours: Optional[int] = 0
    nightCharges: Optional[float] = 0.0
    driverAllowance: Optional[float] = 0.0
    waitingCharges: Optional[float] = 0.0
    parking: Optional[str] = None
    toll: Optional[str] = None
    remarks: Optional[str] = None

class CorporateContractVehicleCreate(CorporateContractVehicleBase):
    pass

class CorporateContractVehicleResponse(CorporateContractVehicleBase):
    id: int
    contract_id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractBase(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_strings_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k, v in data.items():
                if v == "":
                    data[k] = None
        return data

    contractNumber: Optional[str] = None
    contractName: Optional[str] = None
    company: Optional[str] = None
    branch: Optional[str] = None
    department: Optional[str] = None
    clientContactPerson: Optional[str] = None
    clientMobile: Optional[str] = None
    clientEmail: Optional[str] = None
    contractStatus: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None

    startDate: Optional[str] = None
    endDate: Optional[str] = None
    renewalType: Optional[str] = None
    renewalReminder: Optional[int] = 0
    isActive: bool = True

    operatingState: Optional[str] = None
    operatingCity: Optional[str] = None
    officeLocation: Optional[str] = None
    serviceRadius: Optional[int] = 0

    dedicatedVehicle: bool = False
    employeePickupDrop: bool = False
    airportTransfer: bool = False
    localDuty: bool = False
    outstation: bool = False
    onDemandBooking: bool = False
    vipService: bool = False
    support24x7: bool = False

    companyProvidesDriver: bool = True
    dedicatedDriver: bool = False
    backupDriver: bool = False
    driverRotation: Optional[str] = None
    driverShiftTiming: Optional[str] = None
    driverUniformRequired: bool = False

    billingCycle: Optional[str] = None
    invoiceGenerationDate: Optional[int] = 0
    creditDays: Optional[int] = 0
    gst: Optional[float] = 0.0
    tds: Optional[float] = 0.0
    penaltyRules: Optional[str] = None
    latePaymentRules: Optional[str] = None

    contractClauses: Optional[str] = None
    cancellationPolicy: Optional[str] = None
    penaltyClause: Optional[str] = None
    renewalClause: Optional[str] = None
    notes: Optional[str] = None

    createdBy: Optional[str] = None
    reviewedBy: Optional[str] = None
    approvedBy: Optional[str] = None
    approvalDate: Optional[str] = None
    createdAt: Optional[str] = None


class CorporateContractClientDetailBase(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_strings_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k, v in data.items():
                if v == "":
                    data[k] = None
        return data

    companyCode: Optional[str] = None
    gstNumber: Optional[str] = None
    panNumber: Optional[str] = None
    billingAddress: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class CorporateContractClientDetailCreate(CorporateContractClientDetailBase):
    pass

class CorporateContractClientDetailResponse(CorporateContractClientDetailBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractCreate(CorporateContractBase):
    vehicles: List[CorporateContractVehicleCreate] = []
    client_details: Optional[CorporateContractClientDetailCreate] = None

class CorporateContractResponse(CorporateContractBase):
    id: int
    vehicles: List[CorporateContractVehicleResponse] = []
    client_details: Optional[CorporateContractClientDetailResponse] = None
    model_config = ConfigDict(from_attributes=True)

class CorporateContractUpdate(BaseModel):
    # For now, simplistic update if needed
    pass

class CorporateContractDocumentBase(BaseModel):
    document_type: Optional[str] = None
    file_url: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CorporateContractDocumentCreate(CorporateContractDocumentBase):
    pass

class CorporateContractDocumentResponse(CorporateContractDocumentBase):
    id: int
    contract_id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractApprovalBase(BaseModel):
    step: Optional[str] = None
    status: Optional[str] = None
    approver_id: Optional[str] = None
    comments: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CorporateContractApprovalCreate(CorporateContractApprovalBase):
    pass

class CorporateContractApprovalResponse(CorporateContractApprovalBase):
    id: int
    contract_id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractRenewalBase(BaseModel):
    renewal_date: Optional[str] = None
    previous_end_date: Optional[str] = None
    new_end_date: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CorporateContractRenewalCreate(CorporateContractRenewalBase):
    pass

class CorporateContractRenewalResponse(CorporateContractRenewalBase):
    id: int
    contract_id: int
    model_config = ConfigDict(from_attributes=True)

class CorporateContractHistoryBase(BaseModel):
    modified_by: Optional[str] = None
    action: Optional[str] = None
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CorporateContractHistoryCreate(CorporateContractHistoryBase):
    pass

class CorporateContractHistoryResponse(CorporateContractHistoryBase):
    id: int
    contract_id: int
    model_config = ConfigDict(from_attributes=True)
