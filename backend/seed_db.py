import uuid
from database.db import SessionLocal
from models.all_models import (
    User, Vehicle, Driver, Vendor, SystemSetting,
    Contract, ContractService, ContractDocument, ContractNote,
    ContractPayment, ContractActivityLog
)
from utils.security import get_password_hash

def seed():
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(Vehicle).count() > 0:
        print("Database already seeded.")
        return

    print("Seeding database...")

    # Users
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            id="usr_admin",
            name="Admin User",
            email="admin@example.com",
            role="super_admin",
            companyName="CMS Enterprise",
            hashed_password=get_password_hash("password")
        )
        db.add(admin)

    # Vendors
    vendor1 = Vendor(
        id="vnd_1",
        name="Apex Fleet Solutions",
        contactName="John Smith",
        phone="555-0199",
        email="apex@fleet.com",
        fleetSize=5,
        rating=4.8,
        slaCompliance=98.5,
        status="Active"
    )
    vendor2 = Vendor(
        id="vnd_2",
        name="Swift Transits",
        contactName="Alice Cooper",
        phone="555-0188",
        email="swift@transits.com",
        fleetSize=3,
        rating=4.5,
        slaCompliance=94.2,
        status="Active"
    )
    db.add_all([vendor1, vendor2])

    # Vehicles
    v1 = Vehicle(
        id="vh_1",
        plateNumber="TX-882-EV",
        model="Model Y",
        make="Tesla",
        seatingCapacity=5,
        fuelType="Electric",
        status="Available",
        vendorId="vnd_1",
        insuranceExpiry="2027-12-31",
        lastServiceDate="2026-05-15",
        year=2024,
        color="White",
        vehicleType="SUV",
        contract="CON-1002"
    )
    v2 = Vehicle(
        id="vh_2",
        plateNumber="NY-991-CNG",
        model="Civic",
        make="Honda",
        seatingCapacity=5,
        fuelType="CNG",
        status="Available",
        vendorId="vnd_1",
        insuranceExpiry="2027-08-20",
        lastServiceDate="2026-04-10",
        year=2022,
        color="Blue",
        vehicleType="Sedan",
        contract="CON-1002"
    )
    v3 = Vehicle(
        id="vh_3",
        plateNumber="CA-551-DL",
        model="Sprinter",
        make="Mercedes",
        seatingCapacity=12,
        fuelType="Diesel",
        status="Available",
        vendorId="vnd_2",
        insuranceExpiry="2026-11-30",
        lastServiceDate="2026-06-01",
        year=2023,
        color="Silver",
        vehicleType="Van",
        contract="CON-1003"
    )
    db.add_all([v1, v2, v3])

    # Drivers
    d1 = Driver(
        id="drv_1",
        name="David Miller",
        phone="555-0210",
        licenseNumber="DL-992812",
        licenseExpiry="2029-04-15",
        vendorId="vnd_1",
        rating=4.9,
        status="Active",
        complianceStatus="Compliant",
        assignedVehicleId="vh_1"
    )
    d2 = Driver(
        id="drv_2",
        name="Sarah Jenkins",
        phone="555-0220",
        licenseNumber="DL-883719",
        licenseExpiry="2028-09-22",
        vendorId="vnd_1",
        rating=4.7,
        status="Active",
        complianceStatus="Compliant",
        assignedVehicleId="vh_2"
    )
    d3 = Driver(
        id="drv_3",
        name="Robert Chen",
        phone="555-0230",
        licenseNumber="DL-773615",
        licenseExpiry="2027-10-18",
        vendorId="vnd_2",
        rating=4.6,
        status="Active",
        complianceStatus="Pending",
        assignedVehicleId="vh_3"
    )
    db.add_all([d1, d2, d3])

    # System Settings
    settings = [
        SystemSetting(id="set_1", category="Trip", key="gracePeriodMinutes", value="15", description="Grace period in minutes before trip is flagged late"),
        SystemSetting(id="set_2", category="Safety", key="panicSirensEnabled", value="true", description="Enable or disable emergency panic sirens alert system"),
        SystemSetting(id="set_3", category="Fleet", key="systemName", value="CMS Enterprise", description="The display name of the Cab Management System")
    ]
    db.add_all(settings)

    # Contracts Seeding
    c1 = Contract(
        id="cnt_1",
        contractNumber="CON-1002",
        title="Apex Executive Transport SLA",
        type="Service Agreement",
        department="Logistics",
        description="Comprehensive daily commuter transit and executive shuttle services for Hitech Zone corporate headquarters.",
        clientName="Apex Fleet Solutions",
        contactPerson="John Smith",
        email="john.smith@apex.com",
        phone="555-0199",
        startDate="2026-01-01",
        endDate="2026-12-31",
        durationMonths=12,
        value=150000.0,
        currency="USD",
        paymentTerms="Net 30",
        billingFrequency="Monthly",
        securityDeposit=12500.0,
        taxInformation="VAT-99281-22",
        autoRenewal=True,
        renewalDate="2026-12-01",
        reminderDays=30,
        renewalTerms="Automatic 1-year renewal unless terminated in writing 30 days prior.",
        renewalStatus="Auto-Renew",
        status="Active",
        createdAt="2026-01-01T09:00:00Z",
        updatedAt="2026-01-01T09:00:00Z",
        createdBy="Admin User",
        updatedBy="Admin User"
    )
    c2 = Contract(
        id="cnt_2",
        contractNumber="CON-1003",
        title="Swift Transit Van Lease Agreement",
        type="Vehicle Lease",
        department="Operations",
        description="Leasing Mercedes Sprinter van for large group operations and employee pick-up rosters.",
        clientName="Swift Transits",
        contactPerson="Alice Cooper",
        email="alice.cooper@swift.com",
        phone="555-0188",
        startDate="2026-03-01",
        endDate="2026-08-31",
        durationMonths=6,
        value=36000.0,
        currency="USD",
        paymentTerms="Net 15",
        billingFrequency="Monthly",
        securityDeposit=3000.0,
        taxInformation="TAX-88371-10",
        autoRenewal=False,
        renewalDate=None,
        reminderDays=15,
        renewalTerms=None,
        renewalStatus="Manual Renewal",
        status="Active",
        createdAt="2026-03-01T10:00:00Z",
        updatedAt="2026-03-01T10:00:00Z",
        createdBy="Admin User",
        updatedBy="Admin User"
    )
    db.add_all([c1, c2])

    # Contract Services Seeding
    cs1 = ContractService(
        id="csv_1",
        contractId="cnt_1",
        serviceType="Corporate Shuttle Services",
        vehiclesCount=2,
        driversCount=2,
        locations="Hitech Zone, City Center, Airport Terminal 1",
        workingHours="08:00 - 20:00",
        slaDetails="95% SLA punctuality required. Vehicles must be clean and GPS tracking enabled."
    )
    cs2 = ContractService(
        id="csv_2",
        contractId="cnt_2",
        serviceType="Group Commute Transit",
        vehiclesCount=1,
        driversCount=1,
        locations="Downtown Hub, Outer Ring Road",
        workingHours="07:00 - 10:00, 17:00 - 20:00",
        slaDetails="90% punctuality. Mandatory weekly maintenance report sharing."
    )
    db.add_all([cs1, cs2])

    # Contract Notes Seeding
    cn1 = ContractNote(
        id="cnot_1",
        contractId="cnt_1",
        type="Internal",
        content="SLA punctuality metric is currently green at 98.5%. Highly reliable partner.",
        createdAt="2026-05-20T14:30:00Z",
        createdBy="Admin User"
    )
    db.add_all([cn1])

    # Contract Documents Seeding
    cd1 = ContractDocument(
        id="cdoc_1",
        contractId="cnt_1",
        title="Apex_Executive_SLA_Signed_2026.pdf",
        category="Signed Contract",
        fileUrl="/documents/Apex_Executive_SLA_Signed_2026.pdf",
        fileSize="1.8 MB",
        uploadedAt="2026-01-02T11:00:00Z",
        uploadedBy="Admin User",
        version="1.0"
    )
    db.add_all([cd1])

    # Contract Payments Seeding
    cp1 = ContractPayment(
        id="cpay_1",
        contractId="cnt_1",
        amount=12500.0,
        invoiceNumber="INV-2026-001",
        date="2026-02-01",
        status="Received"
    )
    cp2 = ContractPayment(
        id="cpay_2",
        contractId="cnt_1",
        amount=12500.0,
        invoiceNumber="INV-2026-002",
        date="2026-03-01",
        status="Received"
    )
    cp3 = ContractPayment(
        id="cpay_3",
        contractId="cnt_1",
        amount=12500.0,
        invoiceNumber="INV-2026-003",
        date="2026-04-01",
        status="Received"
    )
    db.add_all([cp1, cp2, cp3])

    # Contract Activity Logs Seeding
    cal1 = ContractActivityLog(
        id="cact_1",
        contractId="cnt_1",
        action="Created",
        userId="usr_admin",
        userName="Admin User",
        timestamp="2026-01-01T09:00:00Z",
        details="SLA draft initiated by super admin."
    )
    cal2 = ContractActivityLog(
        id="cact_2",
        contractId="cnt_1",
        action="Document Uploaded",
        userId="usr_admin",
        userName="Admin User",
        timestamp="2026-01-02T11:00:00Z",
        details="Uploaded signed SLA agreement document: Apex_Executive_SLA_Signed_2026.pdf"
    )
    db.add_all([cal1, cal2])

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()
