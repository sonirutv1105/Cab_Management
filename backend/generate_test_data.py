import os
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
from database.db import SessionLocal
from models.all_models import (
    Company, Subscription, Role, Permission, User, Driver, Vehicle, Trip, Vendor, Booking,
    FuelLog, MaintenanceLog, ComplianceDoc, AppNotification, AuditLog,
    DriverDocument, Contract, ContractService
)
from utils.security import get_password_hash

fake = Faker()
Faker.seed(42)

def generate_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def random_date(start_days_ago, end_days_ahead):
    now = datetime.now()
    start_date = now - timedelta(days=start_days_ago)
    end_date = now + timedelta(days=end_days_ahead)
    random_dt = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
    return random_dt.strftime("%Y-%m-%dT%H:%M:%S")

def generate_test_data():
    db = SessionLocal()
    try:
        print("Starting data generation...")
        
        # 1. Companies
        print("Generating Companies...")
        companies = []
        company_types = ["Corporate", "Enterprise", "BPO", "IT Services"]
        industries = ["IT", "Logistics", "Manufacturing", "Healthcare"]
        for i in range(5):
            unique_suffix = uuid.uuid4().hex[:4]
            comp = Company(
                id=generate_id("cmp"),
                name=f"{fake.unique.company()} {unique_suffix}",
                code=f"CMP{fake.unique.random_number(digits=4)}{unique_suffix}",
                company_type=random.choice(company_types),
                industry=random.choice(industries),
                gst_number=f"{random.randint(10,99)}ABCDE{random.randint(1000,9999)}F{random.randint(1,9)}Z5{unique_suffix}",
                pan_number=f"ABCDE{random.randint(1000,9999)}F{unique_suffix}",
                registration_number=f"REG{random.randint(100000,999999)}{unique_suffix}",
                head_name=fake.name(),
                head_email=f"{unique_suffix}_{fake.company_email()}",
                head_phone=fake.phone_number()[:15],
                domain=f"{unique_suffix}-{fake.unique.domain_name()}",
                status="Active",
                created_at=random_date(365, 0),
                updated_at=datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            )
            db.add(comp)
            companies.append(comp)
        db.commit()

        # 2. Subscriptions & Roles
        print("Generating Subscriptions, Roles and Permissions...")
        roles_list = []
        for comp in companies:
            sub = Subscription(
                id=generate_id("sub"),
                company_id=comp.id,
                plan_name=random.choice(["Pro", "Enterprise", "Growth"]),
                start_date=comp.created_at,
                end_date=random_date(0, 365),
                status="Active"
            )
            db.add(sub)
            
            # Roles
            for role_name in ["company_head", "hr_manager", "employee", "transport_manager"]:
                role = Role(
                    id=generate_id("role"),
                    company_id=comp.id,
                    name=role_name.replace("_", " ").title(),
                    description=f"{role_name.replace('_', ' ').title()} role for {comp.name}"
                )
                db.add(role)
                roles_list.append((comp.id, role_name, role.id))
        db.commit()

        # 3. Vendors
        print("Generating Vendors...")
        vendors = []
        for i in range(15):
            comp_id = random.choice(companies).id
            vend = Vendor(
                id=generate_id("vnd"),
                company_id=comp_id,
                name=fake.company() + " Transport",
                contactName=fake.name(),
                phone=fake.phone_number()[:20],
                email=fake.email(),
                fleetSize=random.randint(5, 50),
                rating=round(random.uniform(3.5, 5.0), 1),
                slaCompliance=round(random.uniform(90.0, 100.0), 1),
                status=random.choice(["Active", "Active", "Inactive"])
            )
            db.add(vend)
            vendors.append(vend)
        db.commit()

        # 4. Users (Employees, HR, etc.)
        print("Generating Users (Employees/HR)...")
        users = []
        departments = ["Engineering", "Sales", "Marketing", "HR", "Operations"]
        for i in range(60):
            unique_suffix = uuid.uuid4().hex[:4]
            comp = random.choice(companies)
            role_choice = random.choice(["employee", "employee", "employee", "hr_manager"])
            user = User(
                id=generate_id("usr"),
                company_id=comp.id,
                name=fake.name(),
                email=f"{unique_suffix}_{fake.unique.email()}",
                role=role_choice,
                companyName=comp.name,
                department=random.choice(departments),
                hashed_password=get_password_hash("password123"),
                lastActive=random_date(10, 0)
            )
            db.add(user)
            users.append(user)
        db.commit()

        # 5. Vehicles
        print("Generating Vehicles...")
        vehicles = []
        vehicle_types = ["Sedan", "SUV", "Hatchback", "Bus", "Minivan"]
        makes = ["Toyota", "Honda", "Hyundai", "Maruti Suzuki", "Tata", "Mahindra"]
        for i in range(25):
            unique_suffix = uuid.uuid4().hex[:4]
            vend = random.choice(vendors)
            veh = Vehicle(
                id=generate_id("veh"),
                company_id=vend.company_id,
                plateNumber=f"{fake.lexify('??').upper()}{random.randint(10,99)}{fake.lexify('??').upper()}{random.randint(1000,9999)}{unique_suffix}",
                model=fake.word().capitalize(),
                make=random.choice(makes),
                seatingCapacity=random.choice([4, 6, 12, 20]),
                fuelType=random.choice(["Petrol", "Diesel", "EV", "CNG"]),
                status=random.choice(["Available", "Available", "In Trip", "Maintenance"]),
                vendorId=vend.id,
                insuranceExpiry=random_date(-30, 365),
                lastServiceDate=random_date(180, 0),
                year=random.randint(2018, 2024),
                color=fake.color_name(),
                vehicleType=random.choice(vehicle_types)
            )
            db.add(veh)
            vehicles.append(veh)
        db.commit()

        # 6. Drivers
        print("Generating Drivers...")
        drivers = []
        for i in range(35):
            unique_suffix = uuid.uuid4().hex[:4]
            vend = random.choice(vendors)
            assigned_veh = random.choice([v for v in vehicles if v.company_id == vend.company_id]) if random.random() > 0.3 else None
            driver = Driver(
                id=generate_id("drv"),
                company_id=vend.company_id,
                name=fake.name(),
                phone=fake.phone_number()[:20],
                licenseNumber=f"DL-{random.randint(10000000, 99999999)}{unique_suffix}",
                licenseExpiry=random_date(30, 1000),
                vendorId=vend.id,
                rating=round(random.uniform(3.5, 5.0), 1),
                status=random.choice(["Active", "Active", "On Leave", "Inactive"]),
                complianceStatus=random.choice(["Verified", "Pending", "Verified"]),
                assignedVehicleId=assigned_veh.id if assigned_veh else None,
                is_draft=False,
                current_step=5,
                completed_at=random_date(100, 0),
                firstName=fake.first_name(),
                lastName=fake.last_name(),
                fatherName=fake.first_name_male(),
                birthDate=random_date(18000, 7000), # 20-50 years ago
                pinCode=fake.postcode(),
                state=fake.state(),
                city=fake.city(),
                yearsOfExperience=random.randint(1, 20),
                licenseIssueDate=random_date(3600, 365),
                gender=random.choice(["Male", "Female", "Other"]),
                address=fake.address()
            )
            db.add(driver)
            drivers.append(driver)
            
            # Documents for Driver using raw SQL to avoid schema mismatch
            from sqlalchemy import text
            doc_id = generate_id("ddoc")
            now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            db.execute(text("""
                INSERT INTO driver_documents (id, company_id, driver_id, document_type, document_number, expiry_date, file_path, verification_status, created_at)
                VALUES (:id, :company_id, :driver_id, :document_type, :document_number, :expiry_date, :file_path, :verification_status, :created_at)
            """), {
                "id": doc_id,
                "company_id": driver.company_id,
                "driver_id": driver.id,
                "document_type": "Driving License",
                "document_number": driver.licenseNumber,
                "expiry_date": driver.licenseExpiry,
                "file_path": "/uploads/dl.pdf",
                "verification_status": "Verified",
                "created_at": now_str
            })
            
        db.commit()

        # 7. Trips & Bookings
        print("Generating Trips and Bookings...")
        trips = []
        trip_statuses = ["Completed", "Completed", "Scheduled", "In Progress", "Cancelled"]
        for i in range(120):
            comp = random.choice(companies)
            drv = random.choice([d for d in drivers if d.company_id == comp.id]) if random.random() > 0.1 else None
            veh = random.choice([v for v in vehicles if v.company_id == comp.id]) if random.random() > 0.1 else None
            t_status = random.choice(trip_statuses)
            trip = Trip(
                id=generate_id("trp"),
                company_id=comp.id,
                driverId=drv.id if drv else None,
                vehicleId=veh.id if veh else None,
                startTime=random_date(30, 5),
                endTime=random_date(30, -5) if t_status == "Completed" else None,
                status=t_status,
                safetyVerified=random.choice([True, False]),
                vendorId=drv.vendorId if drv else None
            )
            db.add(trip)
            trips.append(trip)
            
            # Booking for the trip
            b_status = "Approved" if t_status != "Cancelled" else "Cancelled"
            booking = Booking(
                id=generate_id("bkg"),
                company_id=comp.id,
                passengerName=fake.name(),
                bookingDate=random_date(60, 0),
                rideTime=trip.startTime,
                pickupPoint=fake.street_address(),
                dropPoint=fake.street_address(),
                purpose=random.choice(["Client Meeting", "Daily Commute", "Airport Transfer", "Site Visit"]),
                managerApproval=b_status,
                hrStatus=b_status,
                tripId=trip.id
            )
            db.add(booking)
            
        db.commit()

        # 8. Logs (Fuel, Maintenance, Compliance, Audit, Notifications)
        print("Generating Logs and Notifications...")
        for i in range(80):
            veh = random.choice(vehicles)
            fuel = FuelLog(
                id=generate_id("fuel"),
                company_id=veh.company_id,
                vehicleId=veh.id,
                date=random_date(90, 0),
                quantity=round(random.uniform(10.0, 50.0), 2),
                cost=round(random.uniform(1000.0, 5000.0), 2),
                odometerReading=round(random.uniform(10000.0, 50000.0), 1),
                energyType=veh.fuelType
            )
            db.add(fuel)
            
            maint = MaintenanceLog(
                id=generate_id("maint"),
                company_id=veh.company_id,
                vehicleId=veh.id,
                category=random.choice(["Routine Service", "Repair", "Tyre Replacement"]),
                description=fake.sentence(),
                cost=round(random.uniform(500.0, 15000.0), 2),
                vendorName=fake.company(),
                startDate=random_date(180, 0),
                endDate=random_date(175, 0),
                status=random.choice(["Completed", "Upcoming", "In Progress"])
            )
            db.add(maint)

        for i in range(100):
            comp = random.choice(companies)
            audit = AuditLog(
                id=generate_id("aud"),
                company_id=comp.id,
                timestamp=random_date(30, 0),
                userId=generate_id("usr"),
                userEmail=fake.email(),
                userRole="employee",
                action=random.choice(["Created Booking", "Updated Profile", "Logged In", "Cancelled Trip"]),
                module=random.choice(["Bookings", "Auth", "Trips", "Profile"]),
                details=fake.sentence(),
                ipAddress=fake.ipv4(),
                status="Success"
            )
            db.add(audit)
            
            notif = AppNotification(
                id=generate_id("notf"),
                company_id=comp.id,
                title=fake.catch_phrase(),
                message=fake.sentence(),
                category=random.choice(["Alert", "System", "Update"]),
                severity=random.choice(["Low", "Medium", "High"]),
                timestamp=random_date(10, 0),
                read=random.choice([True, False]),
                targetRole="All"
            )
            db.add(notif)
            
        db.commit()

        # 9. Contracts
        print("Generating Contracts...")
        for i in range(10):
            comp = random.choice(companies)
            contract = Contract(
                id=generate_id("ctr"),
                company_id=comp.id,
                contractNumber=f"CTR-{random.randint(10000,99999)}",
                title=f"{fake.company()} Transport Contract",
                type=random.choice(["Employee Transport", "Logistics", "Vehicle Lease"]),
                department=random.choice(["HR", "Admin", "Operations"]),
                description=fake.paragraph(),
                clientName=fake.company(),
                contactPerson=fake.name(),
                email=fake.email(),
                phone=fake.phone_number()[:20],
                startDate=random_date(100, 0),
                endDate=random_date(-10, 365),
                durationMonths=12,
                value=round(random.uniform(100000, 1000000), 2),
                currency="INR",
                paymentTerms="Net 30",
                billingFrequency="Monthly",
                securityDeposit=50000.0,
                taxInformation="GST Included",
                autoRenewal=True,
                status=random.choice(["Active", "Draft", "Expired"]),
                createdAt=datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                createdBy="System"
            )
            db.add(contract)
            
            cs = ContractService(
                id=generate_id("cts"),
                company_id=comp.id,
                contractId=contract.id,
                serviceType="Cab Rental",
                vehiclesCount=random.randint(5, 50),
                driversCount=random.randint(5, 50),
                locations="Mumbai, Pune",
                workingHours="24x7",
                slaDetails="95% uptime"
            )
            db.add(cs)
        db.commit()

        print("\n=== Data Generation Complete ===")
        print(f"Companies inserted: {len(companies)}")
        print(f"Vendors inserted: {len(vendors)}")
        print(f"Users inserted: {len(users)}")
        print(f"Vehicles inserted: {len(vehicles)}")
        print(f"Drivers inserted: {len(drivers)}")
        print(f"Trips inserted: {len(trips)}")
        
    except Exception as e:
        print(f"Error during data generation: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_test_data()
