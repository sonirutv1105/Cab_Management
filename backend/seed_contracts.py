import sys
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.all_models import (
    Contract, ContractBuyerDetail, ContractClientDetail, ContractFinancial, ContractConsigneeDetail,
    ContractVehicleRequirement, ContractSlaCompliance, ContractRenewalTermination,
    ContractDraft, ContractDocument, ContractNote, ContractPayment, ContractActivityLog
)
from database.db import SessionLocal

def clear_and_seed():
    db = SessionLocal()
    
    # Delete child records first
    models_to_clear = [
        ContractBuyerDetail, ContractClientDetail, ContractFinancial, ContractConsigneeDetail,
        ContractVehicleRequirement, ContractSlaCompliance, ContractRenewalTermination,
        ContractDraft, ContractDocument, ContractNote, ContractPayment, ContractActivityLog
    ]
    for model in models_to_clear:
        db.query(model).delete()
    
    # Delete parent records
    deleted_contracts_count = db.query(Contract).delete()
    
    db.commit()
    print(f"Deleted {deleted_contracts_count} contracts and all child records.")
    
    departments = ["Logistics", "Operations", "Transport", "Administration", "Procurement", "Fleet Management", "HR", "Finance", "Safety", "Compliance"]
    categories = ["Transport Services", "Employee Transportation", "Corporate Travel", "Fleet Leasing", "Vehicle Maintenance", "Airport Transfer", "Vendor Services", "Cab Operations", "Emergency Transport", "Long-Term Rental"]
    contract_types = ["Corporate", "Government", "Annual", "Project Based", "Vendor Agreement"]
    statuses = ["Active", "Pending", "Under Review", "Expiring Soon"]
    
    companies = ["TechCorp India", "Global Logistics Co", "Apex Solutions Ltd", "Zenith Technologies", "Pioneer Systems", "MegaCorp Services", "Horizon Ventures", "Quantum Enterprises", "Innovatech Solutions", "Summit Industries"]
    
    # Generate 10 contracts
    generated_numbers = []
    
    for i in range(10):
        c_id = f"cnt_{uuid.uuid4().hex[:8]}"
        c_num = f"CONT-2026-{1000 + i}"
        generated_numbers.append(c_num)
        
        dept = random.choice(departments)
        cat = random.choice(categories)
        ctype = random.choice(contract_types)
        status = random.choice(statuses)
        client = companies[i]
        
        start_date = datetime.now() - timedelta(days=random.randint(10, 100))
        end_date = start_date + timedelta(days=random.randint(180, 730))
        duration = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
        if duration <= 0: duration = 1
        
        val = round(random.uniform(500000, 5000000), 2)
        
        contract = Contract(
            id=c_id,
            contractNumber=c_num,
            title=f"{ctype} {cat} for {client}",
            type=ctype,
            department=dept,
            description=f"Comprehensive {cat.lower()} providing dedicated fleet and driver support for {dept} operations.",
            clientName=client,
            contactPerson=f"Manager {i+1}",
            email=f"contact{i+1}@{client.replace(' ', '').lower()}.com",
            phone=f"98765432{i:02d}",
            startDate=start_date.strftime("%Y-%m-%d"),
            endDate=end_date.strftime("%Y-%m-%d"),
            durationMonths=duration,
            value=val,
            currency="INR",
            paymentTerms="Net 30",
            billingFrequency="Monthly",
            securityDeposit=val * 0.1,
            taxInformation=f"GST-{10000+i}XYZ",
            autoRenewal=random.choice([True, False]),
            renewalDate=(end_date - timedelta(days=30)).strftime("%Y-%m-%d"),
            reminderDays=30,
            renewalTerms="Mutual agreement",
            renewalStatus="Pending",
            status=status,
            createdAt=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            updatedAt=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(contract)
        
        buyer = ContractBuyerDetail(
            id=f"cb_{uuid.uuid4().hex[:8]}", contractId=c_id,
            organisationType="Private Sector", ministry="Corporate Affairs",
            organisationName=client, buyerName=f"Director {i+1}",
            buyerDesignation="Managing Director", buyerContact=f"98765000{i:02d}",
            buyerEmail=f"director@{client.replace(' ', '').lower()}.com",
            buyerAddress=f"Tower {i+1}, Tech Park", buyerState="Maharashtra",
            buyerDivision="Operations"
        )
        db.add(buyer)
        
        client_detail = ContractClientDetail(
            id=f"cc_{uuid.uuid4().hex[:8]}", contractId=c_id,
            clientName=client, clientGstin=f"27XXXXXX{1000+i}Z",
            contactPerson=f"Manager {i+1}", clientDesignation="Procurement Head",
            email=f"contact{i+1}@{client.replace(' ', '').lower()}.com", phone=f"98765432{i:02d}",
            clientState="Maharashtra", clientPincode=f"4000{i:02d}", clientAddress=f"Level {i+1}, Business Center"
        )
        db.add(client_detail)
        
        fin = ContractFinancial(
            id=f"cf_{uuid.uuid4().hex[:8]}", contractId=c_id,
            monthlyBaseFare=val / duration, gstPercentage=18.0,
            gstAmount=(val / duration) * 0.18, securityDeposit=val * 0.1,
            ePbgPercentage=5.0, paymentMode="Bank Transfer",
            billingFrequency="Monthly", paymentTerms="Net 30",
            invoiceRaisedTo=client, invoiceDueDate="15",
            latePaymentPenalty="2% per month", adminApproval="Approved",
            financialApproval="Approved", ifdConcurrence=True
        )
        db.add(fin)
        
        consignee = ContractConsigneeDetail(
            id=f"co_{uuid.uuid4().hex[:8]}", contractId=c_id,
            consigneeName=f"Consignee {i+1}", consigneeDesignation="Site Manager",
            consigneeContact=f"98765400{i:02d}", consigneeEmail=f"site{i+1}@{client.replace(' ', '').lower()}.com",
            consigneeAddress=f"Warehouse {i+1}", consigneeState="Maharashtra",
            consigneePincode=f"4000{i:02d}"
        )
        db.add(consignee)
        
        veh = ContractVehicleRequirement(
            id=f"cv_{uuid.uuid4().hex[:8]}", contractId=c_id,
            vehicleType="Sedan", vehicleCategory="Premium",
            carModels="Honda City, Hyundai Verna", usageVariant="2500KM/Month",
            numberOfVehicles=random.randint(5, 50), fuelType="Petrol/CNG",
            acRequired=True, reportingLocation="Head Office",
            dutyHours="12 Hrs/Day", driverRequired=True,
            gpsRequired=True, brandingRequired=False,
            vehicleAgeLimit="Less than 3 years", replacementClause="Within 2 hours"
        )
        db.add(veh)
        
        sla = ContractSlaCompliance(
            id=f"cs_{uuid.uuid4().hex[:8]}", contractId=c_id,
            slaDetails="99% Uptime, On-time arrival", penaltyClause="1000 INR per delay",
            insuranceRequired="Comprehensive Commercial", driverDocsRequired="Police Verification, DL, Badge",
            policeVerification=True, backgroundVerification=True,
            escalationMatrix="Level 1: Supervisor, Level 2: Manager", specialInstructions="No smoking inside cab"
        )
        db.add(sla)
        
        ren = ContractRenewalTermination(
            id=f"cr_{uuid.uuid4().hex[:8]}", contractId=c_id,
            autoRenewal=True, reminderDays=60,
            renewalTerms="10% increment per annum", renewalStatus="Active",
            terminationNotice="30 Days", terminationClause="Breach of SLA or non-payment"
        )
        db.add(ren)
        
    db.commit()
    print("Seeded 10 contracts successfully.")
    print("Contract Numbers:", ", ".join(generated_numbers))

if __name__ == "__main__":
    clear_and_seed()
