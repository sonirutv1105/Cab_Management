from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database.db import Base


from sqlalchemy.orm import relationship



class SuperAdmin(Base):
    __tablename__ = "super_admins"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="super_admin")
    created_at = Column(String(50))
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expiry = Column(String(50), nullable=True)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(150), unique=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=True)
    company_type = Column(String(50), nullable=True)
    industry = Column(String(100), nullable=True)
    gst_number = Column(String(100), nullable=True)
    pan_number = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    head_name = Column(String(100), nullable=True)
    head_email = Column(String(100), nullable=True)
    head_phone = Column(String(50), nullable=True)
    domain = Column(String(100), unique=True, index=True, nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(String(50))
    updated_at = Column(String(50))

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    plan_name = Column(String(100))
    start_date = Column(String(50))
    end_date = Column(String(50))
    status = Column(String(50), default="Active")

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint('company_id', 'name', name='uq_roles_company_id_name'),)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name = Column(String(100))
    description = Column(String(255))

class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint('role_id', 'module', 'action', name='uq_permissions_role_id_module_action'),)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    role_id = Column(Integer, ForeignKey('roles.id', ondelete='CASCADE'), index=True)
    module = Column(String(100))
    action = Column(String(100)) # e.g., create, read, update, delete

class User(Base):
    __tablename__ = "users"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    role = Column(String(50))
    avatar = Column(String(255), nullable=True)
    companyName = Column(String(100))
    department = Column(String(100), nullable=True)
    lastActive = Column(String(50), default="Just now")
    hashed_password = Column(String(255), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(String(50), nullable=True)
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expiry = Column(String(50), nullable=True)

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(100), index=True)
    otp = Column(String(6))
    created_at = Column(DateTime)
    expires_at = Column(DateTime)
    is_used = Column(Boolean, default=False)
    failed_attempts = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    verified_session_token = Column(String(255), nullable=True, index=True)

class Driver(Base):
    __tablename__ = "drivers"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100))
    phone = Column(String(20))
    licenseNumber = Column(String(50), unique=True)
    licenseExpiry = Column(String(50))
    vendorId = Column(Integer, ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)
    rating = Column(Float, default=5.0)
    status = Column(String(50), default="Active")
    complianceStatus = Column(String(50), default="Pending")
    assignedVehicleId = Column(Integer, ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True)
    is_draft = Column(Boolean, default=False)
    current_step = Column(Integer, default=1)
    completed_at = Column(String(50), nullable=True)
    # Document Verification Fields
    dlFile = Column(String(255), nullable=True)
    aadhaarNumber = Column(String(12), nullable=True)
    aadhaarFile = Column(String(255), nullable=True)
    panNumber = Column(String(10), nullable=True)
    panFile = Column(String(255), nullable=True)
    policeVerificationNumber = Column(String(50), nullable=True)
    policeVerificationExpiry = Column(String(50), nullable=True)
    policeVerificationFile = Column(String(255), nullable=True)
    medicalCertificateExpiry = Column(String(50), nullable=True)
    medicalCertificateFile = Column(String(255), nullable=True)
    driverPhotoFile = Column(String(255), nullable=True)
    
    # New Extended Details
    email = Column(String(100), nullable=True)
    firstName = Column(String(100), nullable=True)
    lastName = Column(String(100), nullable=True)
    fatherName = Column(String(100), nullable=True)
    birthDate = Column(String(50), nullable=True)
    pinCode = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    yearsOfExperience = Column(Integer, nullable=True)
    licenseIssueDate = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)

    # Self Car Fields
    vehicleAssignmentType = Column(String(50), nullable=True)
    selfVehicleNumber = Column(String(50), nullable=True)
    selfVehicleType = Column(String(50), nullable=True)
    selfRcNumber = Column(String(50), nullable=True)
    selfInsuranceExpiry = Column(String(50), nullable=True)
    selfVehicleModel = Column(String(100), nullable=True)
    selfVehicleColor = Column(String(50), nullable=True)

class DriverDraft(Base):
    __tablename__ = "driver_drafts"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    draft_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    driver_code = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    father_name = Column(String(100), nullable=True)
    license_number = Column(String(50), unique=True, nullable=True)
    email = Column(String(100), nullable=True)
    birth_date = Column(String(50), nullable=True)
    mobile_number = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    pin_code = Column(String(20), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    assigned_vehicle_id = Column(Integer, ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True)
    vendor_id = Column(String(50), nullable=True)
    
    # Self Car Fields
    vehicle_assignment_type = Column(String(50), nullable=True)
    self_vehicle_number = Column(String(50), nullable=True)
    self_vehicle_type = Column(String(50), nullable=True)
    self_vehicle_model = Column(String(100), nullable=True)
    self_vehicle_color = Column(String(50), nullable=True)
    self_rc_number = Column(String(50), nullable=True)
    self_insurance_expiry = Column(String(50), nullable=True)
    
    verification_status = Column(String(50), default="Pending")
    draft_status = Column(String(50), default="Draft")
    current_step = Column(Integer, default=1)
    
    # Files
    dlFile = Column(String(255), nullable=True)
    aadhaarNumber = Column(String(12), nullable=True)
    aadhaarFile = Column(String(255), nullable=True)
    panNumber = Column(String(10), nullable=True)
    panFile = Column(String(255), nullable=True)
    policeVerificationNumber = Column(String(50), nullable=True)
    policeVerificationExpiry = Column(String(50), nullable=True)
    policeVerificationFile = Column(String(255), nullable=True)
    medicalCertificateExpiry = Column(String(50), nullable=True)
    medicalCertificateFile = Column(String(255), nullable=True)
    driverPhotoFile = Column(String(255), nullable=True)
    
    created_by = Column(String(100), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    plateNumber = Column(String(50), unique=True, index=True)
    model = Column(String(100))
    make = Column(String(100))
    seatingCapacity = Column(Integer)
    fuelType = Column(String(50))
    status = Column(String(50), default="Available")
    vendorId = Column(Integer, ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)
    insuranceExpiry = Column(String(50))
    lastServiceDate = Column(String(50))
    year = Column(Integer, nullable=True)
    color = Column(String(50), nullable=True)
    vehicleType = Column(String(50), nullable=True)
    contract = Column(String(100), nullable=True)
    assignedDriverId = Column(Integer, ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)

class Trip(Base):
    __tablename__ = "trips"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    driverId = Column(Integer, ForeignKey('drivers.id', ondelete='CASCADE'), nullable=True)
    vehicleId = Column(Integer, ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=True)
    startTime = Column(String(50))
    endTime = Column(String(50), nullable=True)
    status = Column(String(50), default="Scheduled")
    safetyVerified = Column(Boolean, default=False)
    vendorId = Column(Integer, ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)

class Vendor(Base):
    __tablename__ = "vendors"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100))
    vendorCode = Column(String(50), nullable=True)
    vendorType = Column(String(100), nullable=True)
    businessCategory = Column(String(100), nullable=True)
    panNumber = Column(String(50), nullable=True)
    contactName = Column(String(100))
    designation = Column(String(100), nullable=True)
    phone = Column(String(20))
    altPhone = Column(String(20), nullable=True)
    email = Column(String(100))
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    pinCode = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    gstNumber = Column(String(50), nullable=True)
    fleetSize = Column(Integer, nullable=False)
    vehicleTypes = Column(String(255), nullable=True)
    totalDrivers = Column(Integer, nullable=True)
    operatingCities = Column(String(255), nullable=True)
    serviceAvailability = Column(String(100), nullable=True)
    rating = Column(Float, default=5.0)
    slaCompliance = Column(Float, default=100.0)
    complianceRating = Column(Float, nullable=True)
    responseTime = Column(String(50), nullable=True)
    status = Column(String(50), default="Active")
    docGst = Column(String(255), nullable=True)
    docPan = Column(String(255), nullable=True)
    docRegistration = Column(String(255), nullable=True)
    docInsurance = Column(String(255), nullable=True)
    docAgreement = Column(String(255), nullable=True)
    docOther = Column(String(255), nullable=True)
    bankName = Column(String(100), nullable=True)
    accountHolder = Column(String(100), nullable=True)
    accountNumber = Column(String(100), nullable=True)
    ifscCode = Column(String(50), nullable=True)
    branchName = Column(String(100), nullable=True)
    upiId = Column(String(100), nullable=True)

class Integration(Base):
    __tablename__ = "integrations"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    name = Column(String(150))
    api_key = Column(String(255), unique=True, index=True)
    api_secret = Column(String(255))
    webhook_secret = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    rate_limit = Column(Integer, default=1000)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

class ApiLog(Base):
    __tablename__ = "api_logs"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    integration_id = Column(Integer, ForeignKey('integrations.id', ondelete='CASCADE'), index=True, nullable=True)
    endpoint = Column(String(255))
    ip_address = Column(String(50))
    method = Column(String(10))
    status_code = Column(Integer)
    response = Column(Text, nullable=True)
    processing_time = Column(Float)
    validation_errors = Column(Text, nullable=True)
    created_at = Column(DateTime)

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint('company_id', 'external_booking_id', name='uq_booking_company_external_id'),)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    passengerName = Column(String(100))
    bookingDate = Column(String(50))
    rideTime = Column(String(50))
    pickupPoint = Column(String(150))
    dropPoint = Column(String(150))
    purpose = Column(String(200))
    managerApproval = Column(String(50), default="Pending")
    hrStatus = Column(String(50), default="Pending")
    tripId = Column(Integer, ForeignKey('trips.id', ondelete='SET NULL'), nullable=True)
    booking_source = Column(String(50), default="Manual")
    external_booking_id = Column(String(100), nullable=True, index=True)
    integration_id = Column(Integer, ForeignKey('integrations.id', ondelete='SET NULL'), nullable=True)
    api_received_at = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="Synced")
    raw_payload = Column(Text, nullable=True)

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    vehicleId = Column(Integer, ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=True)
    date = Column(String(50))
    quantity = Column(Float)
    cost = Column(Float)
    odometerReading = Column(Float)
    energyType = Column(String(50), default="Fuel")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    vehicleId = Column(Integer, ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=True)
    category = Column(String(50))
    description = Column(String(255))
    cost = Column(Float)
    vendorName = Column(String(100))
    startDate = Column(String(50))
    endDate = Column(String(50))
    status = Column(String(50), default="Upcoming")

class ComplianceDoc(Base):
    __tablename__ = "compliance_docs"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    entityId = Column(String(50))
    entityType = Column(String(50))
    documentType = Column(String(50))
    documentNumber = Column(String(100))
    expiryDate = Column(String(50))
    status = Column(String(50), default="Valid")

class AppNotification(Base):
    __tablename__ = "app_notifications"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(150))
    message = Column(String(500))
    category = Column(String(50))
    severity = Column(String(50))
    timestamp = Column(String(50))
    read = Column(Boolean, default=False)
    targetRole = Column(String(50), nullable=True)
    popup_dismissed = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(String(50))
    userId = Column(String(50))
    userEmail = Column(String(100))
    userRole = Column(String(50))
    action = Column(String(100))
    module = Column(String(50))
    details = Column(String(500))
    ipAddress = Column(String(50))
    status = Column(String(50), default="Success")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    category = Column(String(50))
    key = Column(String(100))
    value = Column(String(255))
    description = Column(String(255))

# Contract Models
class Contract(Base):
    __tablename__ = "contracts"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractNumber = Column(String(100))
    title = Column(String(150))
    type = Column(String(50))
    department = Column(String(100))
    description = Column(String(500))
    clientName = Column(String(100))
    contactPerson = Column(String(100))
    email = Column(String(100))
    phone = Column(String(50))
    startDate = Column(String(50))
    endDate = Column(String(50))
    durationMonths = Column(Integer)
    value = Column(Float)
    currency = Column(String(20))
    paymentTerms = Column(String(100))
    billingFrequency = Column(String(50))
    securityDeposit = Column(Float)
    taxInformation = Column(String(100))
    autoRenewal = Column(Boolean)
    renewalDate = Column(String(50), nullable=True)
    reminderDays = Column(Integer)
    renewalTerms = Column(String(200), nullable=True)
    renewalStatus = Column(String(50))
    status = Column(String(50))
    createdAt = Column(String(50))
    updatedAt = Column(String(50))
    createdBy = Column(String(100))
    updatedBy = Column(String(100))

class ContractService(Base):
    __tablename__ = "contract_services"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)
    serviceType = Column(String(100))
    vehiclesCount = Column(Integer)
    driversCount = Column(Integer)
    locations = Column(String(255)) # Store as JSON or comma separated
    workingHours = Column(String(100))
    slaDetails = Column(String(255))

class ContractDocument(Base):
    __tablename__ = "contract_documents"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)
    title = Column(String(150))
    category = Column(String(50))
    fileUrl = Column(String(255))
    fileSize = Column(String(50))
    uploadedAt = Column(String(50))
    uploadedBy = Column(String(100))
    version = Column(String(50))

class ContractNote(Base):
    __tablename__ = "contract_notes"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)
    type = Column(String(50))
    content = Column(String(500))
    createdAt = Column(String(50))
    createdBy = Column(String(100))

class ContractPayment(Base):
    __tablename__ = "contract_payments"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)
    amount = Column(Float)
    invoiceNumber = Column(String(100))
    date = Column(String(50))
    status = Column(String(50))

class ContractActivityLog(Base):
    __tablename__ = "contract_activity_logs"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)
    action = Column(String(100))
    userId = Column(String(50))
    userName = Column(String(100))
    timestamp = Column(String(50))
    details = Column(String(255))
    previousValue = Column(String(255), nullable=True)
    newValue = Column(String(255), nullable=True)

class DriverDocument(Base):
    __tablename__ = "driver_documents"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    driver_id = Column(Integer, ForeignKey('drivers.id', ondelete='CASCADE'), index=True)
    document_type = Column(String(100))
    document_number = Column(String(100), nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(255))
    file_extension = Column(String(10), nullable=True)
    file_size = Column(Integer, nullable=True)
    verification_status = Column(String(50), default="Pending")
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(String(50), nullable=True)
    remarks = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(50))
    updated_at = Column(String(50))

from sqlalchemy.orm import relationship
from sqlalchemy import Text


class ContractDraft(Base):
    __tablename__ = "contract_drafts"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    draft_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True, nullable=True)
    current_section = Column(String(50), nullable=True)
    draft_status = Column(String(50), default="Draft")
    created_by = Column(String(100), nullable=True)
    created_at = Column(String(50))
    updated_at = Column(String(50))
    # UI helper fields
    title = Column(String(150), nullable=True)
    sectionStatus = Column(Text)
    completionPercentage = Column(Float, default=0.0)
    attachments = Column(Text, nullable=True)
    formData = Column(Text, nullable=True)

class ContractBuyerDetail(Base):
    __tablename__ = "contract_buyer_details"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    organisationType = Column(String(100), nullable=True)
    ministry = Column(String(100), nullable=True)
    organisationName = Column(String(150), nullable=True)
    buyerName = Column(String(100), nullable=True)
    buyerDesignation = Column(String(100), nullable=True)
    buyerContact = Column(String(50), nullable=True)
    buyerEmail = Column(String(100), nullable=True)
    buyerAddress = Column(String(255), nullable=True)
    buyerState = Column(String(100), nullable=True)
    buyerDivision = Column(String(100), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractClientDetail(Base):
    __tablename__ = "contract_client_details"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    clientName = Column(String(150), nullable=True)
    clientGstin = Column(String(50), nullable=True)
    contactPerson = Column(String(100), nullable=True)
    clientDesignation = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    clientState = Column(String(100), nullable=True)
    clientPincode = Column(String(20), nullable=True)
    clientAddress = Column(String(255), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractFinancial(Base):
    __tablename__ = "contract_financials"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    monthlyBaseFare = Column(Float, nullable=True)
    gstPercentage = Column(Float, nullable=True)
    gstAmount = Column(Float, nullable=True)
    securityDeposit = Column(Float, nullable=True)
    ePbgPercentage = Column(Float, nullable=True)
    paymentMode = Column(String(50), nullable=True)
    billingFrequency = Column(String(50), nullable=True)
    paymentTerms = Column(String(100), nullable=True)
    invoiceRaisedTo = Column(String(150), nullable=True)
    invoiceDueDate = Column(String(50), nullable=True)
    latePaymentPenalty = Column(String(150), nullable=True)
    adminApproval = Column(String(100), nullable=True)
    financialApproval = Column(String(100), nullable=True)
    ifdConcurrence = Column(Boolean, default=False)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractConsigneeDetail(Base):
    __tablename__ = "contract_consignee_details"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    consigneeName = Column(String(150), nullable=True)
    consigneeDesignation = Column(String(100), nullable=True)
    consigneeContact = Column(String(50), nullable=True)
    consigneeEmail = Column(String(100), nullable=True)
    consigneeAddress = Column(String(255), nullable=True)
    consigneeState = Column(String(100), nullable=True)
    consigneePincode = Column(String(20), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractVehicleRequirement(Base):
    __tablename__ = "contract_vehicle_requirements"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    vehicleType = Column(String(100), nullable=True)
    vehicleCategory = Column(String(100), nullable=True)
    carModels = Column(String(255), nullable=True)
    usageVariant = Column(String(100), nullable=True)
    numberOfVehicles = Column(Integer, default=1)
    fuelType = Column(String(50), nullable=True)
    acRequired = Column(Boolean, default=False)
    reportingLocation = Column(String(255), nullable=True)
    dutyHours = Column(String(100), nullable=True)
    driverRequired = Column(Boolean, default=False)
    gpsRequired = Column(Boolean, default=False)
    brandingRequired = Column(Boolean, default=False)
    vehicleAgeLimit = Column(String(50), nullable=True)
    replacementClause = Column(String(255), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractSlaCompliance(Base):
    __tablename__ = "contract_sla_compliance"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    slaDetails = Column(String(500), nullable=True)
    penaltyClause = Column(String(255), nullable=True)
    insuranceRequired = Column(String(255), nullable=True)
    driverDocsRequired = Column(String(255), nullable=True)
    policeVerification = Column(Boolean, default=False)
    backgroundVerification = Column(Boolean, default=False)
    escalationMatrix = Column(String(255), nullable=True)
    specialInstructions = Column(String(500), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class ContractRenewalTermination(Base):
    __tablename__ = "contract_renewal_termination"
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractId = Column(Integer, ForeignKey('contracts.id', ondelete='CASCADE'), index=True)
    autoRenewal = Column(Boolean, default=False)
    reminderDays = Column(Integer, nullable=True)
    renewalTerms = Column(String(500), nullable=True)
    renewalStatus = Column(String(50), nullable=True)
    terminationNotice = Column(String(100), nullable=True)
    terminationClause = Column(String(500), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    title = Column(String(200))
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")
    priority = Column(String(50), default="Medium")
    assigned_to = Column(String(100), nullable=True)
    due_date = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    attachments = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class Tender(Base):
    __tablename__ = "tenders"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    title = Column(String(200))
    category = Column(String(100), nullable=True)
    status = Column(String(50), default="Open")
    tender_number = Column(String(100), nullable=True)
    client_name = Column(String(150), nullable=True)
    department = Column(String(100), nullable=True)
    tender_value = Column(Float, nullable=True)
    publish_date = Column(String(50), nullable=True)
    opening_date = Column(String(50), nullable=True)
    closing_date = Column(String(50), nullable=True)
    deadline = Column(String(50), nullable=True)
    assigned_manager = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(200))
    message = Column(Text, nullable=True)
    priority = Column(String(50), default="Normal") # Normal, Important, Critical
    audience_type = Column(String(50), default="All Companies") # All Companies, Selected Companies
    recipient_type = Column(String(50), default="Both") # Company Head, Company HR, Both
    created_by = Column(String(100), nullable=True)
    scheduled_at = Column(String(50), nullable=True)
    expires_at = Column(String(50), nullable=True)
    status = Column(String(50), default="Active") # Active, Inactive, Draft, Published, Archived
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class AnnouncementRecipient(Base):
    __tablename__ = "announcement_recipients"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    announcement_id = Column(Integer, ForeignKey('announcements.id', ondelete='CASCADE'), index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(String(50), nullable=True)
    delivered_at = Column(String(50), nullable=True)
    created_at = Column(String(50), nullable=True)

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), index=True)
    subject = Column(String(200))
    category = Column(String(100))
    priority = Column(String(50)) # Low, Medium, High, Critical
    status = Column(String(50), default="Open") # Open, In Progress, Waiting for Customer, Resolved, Closed
    created_at = Column(String(50))
    updated_at = Column(String(50))
    created_by_id = Column(Integer)
    created_by_name = Column(String(100))
    created_by_role = Column(String(50))

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id', ondelete='CASCADE'), index=True)
    sender_id = Column(Integer)
    sender_name = Column(String(100))
    sender_role = Column(String(50))
    message = Column(Text)
    created_at = Column(String(50))

class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    message_id = Column(Integer, ForeignKey('ticket_messages.id', ondelete='CASCADE'), index=True, nullable=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id', ondelete='CASCADE'), index=True)
    file_name = Column(String(200))
    file_path = Column(String(500))
    file_type = Column(String(50))
    created_at = Column(String(50))

# --- CORPORATE CONTRACT MODELS ---
class StateRateCard(Base):
    __tablename__ = "state_rate_cards"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    state = Column(String(100), index=True)
    vehicleCategory = Column(String(100)) # e.g. Sedan, SUV, Innova
    fuelType = Column(String(50))
    monthlyPackageRate = Column(Float, default=0.0)
    perKmRate = Column(Float, default=0.0)
    perHourRate = Column(Float, default=0.0)
    airportRate = Column(Float, default=0.0)
    localRate = Column(Float, default=0.0)
    outstationRate = Column(Float, default=0.0)

class CorporateContract(Base):
    __tablename__ = "corporate_contracts"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contractNumber = Column(String(100), index=True)
    contractName = Column(String(150))
    company = Column(String(150))
    branch = Column(String(100))
    department = Column(String(100))
    clientContactPerson = Column(String(100))
    clientMobile = Column(String(50))
    clientEmail = Column(String(100))
    contractStatus = Column(String(50))
    priority = Column(String(50))
    description = Column(String(500))

    startDate = Column(String(50))
    endDate = Column(String(50))
    renewalType = Column(String(100))
    renewalReminder = Column(Integer)
    isActive = Column(Boolean, default=True)

    operatingState = Column(String(100))
    operatingCity = Column(String(100))
    officeLocation = Column(String(200))
    serviceRadius = Column(Integer)

    # Service Configuration
    dedicatedVehicle = Column(Boolean, default=False)
    employeePickupDrop = Column(Boolean, default=False)
    airportTransfer = Column(Boolean, default=False)
    localDuty = Column(Boolean, default=False)
    outstation = Column(Boolean, default=False)
    onDemandBooking = Column(Boolean, default=False)
    vipService = Column(Boolean, default=False)
    support24x7 = Column(Boolean, default=False)

    # Driver Configuration
    companyProvidesDriver = Column(Boolean, default=True)
    dedicatedDriver = Column(Boolean, default=False)
    backupDriver = Column(Boolean, default=False)
    driverRotation = Column(String(50))
    driverShiftTiming = Column(String(50))
    driverUniformRequired = Column(Boolean, default=False)

    # Billing Configuration
    billingCycle = Column(String(50))
    invoiceGenerationDate = Column(Integer)
    creditDays = Column(Integer)
    gst = Column(Float)
    tds = Column(Float)
    penaltyRules = Column(String(500))
    latePaymentRules = Column(String(500))

    # Terms & Approvals
    contractClauses = Column(String(1000))
    cancellationPolicy = Column(String(500))
    penaltyClause = Column(String(500))
    renewalClause = Column(String(500))
    notes = Column(String(1000))

    createdBy = Column(String(100))
    reviewedBy = Column(String(100))
    approvedBy = Column(String(100))
    approvalDate = Column(String(50))
    createdAt = Column(String(50))

    # Relationship
    vehicles = relationship("CorporateContractVehicle", back_populates="contract", cascade="all, delete-orphan")
    client_details = relationship("CorporateContractClientDetail", back_populates="contract", uselist=False, cascade="all, delete-orphan")
    documents = relationship("CorporateContractDocument", back_populates="contract", cascade="all, delete-orphan")
    approvals = relationship("CorporateContractApproval", back_populates="contract", cascade="all, delete-orphan")
    renewals = relationship("CorporateContractRenewal", back_populates="contract", cascade="all, delete-orphan")
    history = relationship("CorporateContractHistory", back_populates="contract", cascade="all, delete-orphan")

class CorporateContractClientDetail(Base):
    __tablename__ = "corporate_contract_client_details"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"), index=True, unique=True)
    companyCode = Column(String(50))
    gstNumber = Column(String(50))
    panNumber = Column(String(50))
    billingAddress = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(20))
    
    contract = relationship("CorporateContract", back_populates="client_details")

class CorporateContractVehicle(Base):
    __tablename__ = "corporate_contract_vehicles"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"))
    vehicleType = Column(String(100))
    vehicleCategory = Column(String(100))
    fuelType = Column(String(50))
    transmission = Column(String(50))
    quantity = Column(Integer)
    monthlyKmIncluded = Column(Integer)
    dailyLimit = Column(Integer)
    extraKmCharge = Column(Float)
    minimumBillingHours = Column(Integer)
    nightCharges = Column(Float)
    driverAllowance = Column(Float)
    waitingCharges = Column(Float)
    parking = Column(String(50))
    toll = Column(String(50))
    remarks = Column(String(500))
    
    contract = relationship("CorporateContract", back_populates="vehicles")

class CorporateContractDocument(Base):
    __tablename__ = "corporate_contract_documents"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"), index=True)
    document_type = Column(String(100))
    file_url = Column(String(500))
    uploaded_by = Column(String(100))
    created_at = Column(String(50))
    updated_at = Column(String(50))

    contract = relationship("CorporateContract", back_populates="documents")

class CorporateContractApproval(Base):
    __tablename__ = "corporate_contract_approvals"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"), index=True)
    step = Column(String(100))
    status = Column(String(50))
    approver_id = Column(String(100))
    comments = Column(String(1000))
    created_at = Column(String(50))
    updated_at = Column(String(50))

    contract = relationship("CorporateContract", back_populates="approvals")

class CorporateContractRenewal(Base):
    __tablename__ = "corporate_contract_renewals"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"), index=True)
    renewal_date = Column(String(50))
    previous_end_date = Column(String(50))
    new_end_date = Column(String(50))
    terms = Column(String(1000))
    status = Column(String(50))
    created_at = Column(String(50))
    updated_at = Column(String(50))

    contract = relationship("CorporateContract", back_populates="renewals")

class CorporateContractHistory(Base):
    __tablename__ = "corporate_contract_history"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    contract_id = Column(Integer, ForeignKey("corporate_contracts.id", ondelete="CASCADE"), index=True)
    modified_by = Column(String(100))
    action = Column(String(100))
    previous_state = Column(String(2000))
    new_state = Column(String(2000))
    created_at = Column(String(50))
    updated_at = Column(String(50))

    contract = relationship("CorporateContract", back_populates="history")
