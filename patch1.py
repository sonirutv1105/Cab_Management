import sys
sys.path.append('backend')

with open('backend/routes/all_routes.py', 'r') as f:
    content = f.read()

import re

# We will replace create_contract, get_contracts, get_contract, update_contract, delete_contract

NEW_CONTRACT_ROUTES = """
# --- CONTRACT ROUTES ---
def _merge_contract_data(db, db_contract):
    if not db_contract: return None
    from models import all_models as models
    data = db_contract.__dict__.copy()
    data.pop('_sa_instance_state', None)
    
    buyer = db.query(models.ContractBuyerDetail).filter(models.ContractBuyerDetail.contractId == db_contract.id).first()
    if buyer:
        for k, v in buyer.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at']: data[k] = v
            
    client = db.query(models.ContractClientDetail).filter(models.ContractClientDetail.contractId == db_contract.id).first()
    if client:
        for k, v in client.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at', 'clientName', 'contactPerson', 'email', 'phone']: data[k] = v

    fin = db.query(models.ContractFinancial).filter(models.ContractFinancial.contractId == db_contract.id).first()
    if fin:
        for k, v in fin.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at', 'paymentMode', 'billingFrequency', 'paymentTerms']: data[k] = v

    consignee = db.query(models.ContractConsigneeDetail).filter(models.ContractConsigneeDetail.contractId == db_contract.id).first()
    if consignee:
        for k, v in consignee.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at']: data[k] = v

    veh = db.query(models.ContractVehicleRequirement).filter(models.ContractVehicleRequirement.contractId == db_contract.id).first()
    if veh:
        for k, v in veh.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at']: data[k] = v

    sla = db.query(models.ContractSlaCompliance).filter(models.ContractSlaCompliance.contractId == db_contract.id).first()
    if sla:
        for k, v in sla.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at']: data[k] = v

    ren = db.query(models.ContractRenewalTermination).filter(models.ContractRenewalTermination.contractId == db_contract.id).first()
    if ren:
        for k, v in ren.__dict__.items():
            if k not in ['id', 'contractId', '_sa_instance_state', 'created_at', 'updated_at', 'autoRenewal', 'reminderDays', 'renewalTerms', 'renewalStatus']: data[k] = v

    return data


@contract_router.get("/", response_model=list[schemas.ContractResponse])
def get_contracts(db: Session = Depends(get_db)):
    contracts = db.query(models.Contract).all()
    return [_merge_contract_data(db, c) for c in contracts]

@contract_router.post("/", response_model=schemas.ContractResponse)
def create_contract(contract: schemas.ContractCreate, db: Session = Depends(get_db)):
    import uuid
    core_fields = ["id", "contractNumber", "title", "type", "department", "description", "clientName", "contactPerson", "email", "phone", "startDate", "endDate", "durationMonths", "value", "currency", "paymentTerms", "billingFrequency", "securityDeposit", "taxInformation", "autoRenewal", "renewalDate", "reminderDays", "renewalTerms", "renewalStatus", "status", "createdAt", "updatedAt", "createdBy", "updatedBy"]
    contract_data = contract.model_dump()
    core_data = {k: contract_data[k] for k in core_fields if k in contract_data}
    db_item = models.Contract(**core_data)
    db.add(db_item)
    
    # 2. Add Buyer Details
    buyer = models.ContractBuyerDetail(
        id=f"cb_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        organisationType=contract.organisationType, ministry=contract.ministry,
        organisationName=contract.organisationName, buyerName=contract.buyerName,
        buyerDesignation=contract.buyerDesignation, buyerContact=contract.buyerContact,
        buyerEmail=contract.buyerEmail, buyerAddress=contract.buyerAddress,
        buyerState=contract.buyerState, buyerDivision=contract.buyerDivision,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(buyer)
    
    client = models.ContractClientDetail(
        id=f"cc_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        clientName=contract.clientName, clientGstin=contract.clientGstin,
        contactPerson=contract.contactPerson, clientDesignation=contract.clientDesignation,
        email=contract.email, phone=contract.phone, clientState=contract.clientState,
        clientPincode=contract.clientPincode, clientAddress=contract.clientAddress,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(client)
    
    fin = models.ContractFinancial(
        id=f"cf_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        monthlyBaseFare=contract.monthlyBaseFare, gstPercentage=contract.gstPercentage,
        gstAmount=contract.gstAmount, securityDeposit=contract.securityDeposit,
        ePbgPercentage=contract.ePbgPercentage, paymentMode=contract.paymentMode,
        billingFrequency=contract.billingFrequency, paymentTerms=contract.paymentTerms,
        invoiceRaisedTo=contract.invoiceRaisedTo, invoiceDueDate=contract.invoiceDueDate,
        latePaymentPenalty=contract.latePaymentPenalty, adminApproval=contract.adminApproval,
        financialApproval=contract.financialApproval, ifdConcurrence=contract.ifdConcurrence,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(fin)
    
    consignee = models.ContractConsigneeDetail(
        id=f"co_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        consigneeName=contract.consigneeName, consigneeDesignation=contract.consigneeDesignation,
        consigneeContact=contract.consigneeContact, consigneeEmail=contract.consigneeEmail,
        consigneeAddress=contract.consigneeAddress, consigneeState=contract.consigneeState,
        consigneePincode=contract.consigneePincode,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(consignee)
    
    veh = models.ContractVehicleRequirement(
        id=f"cv_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        vehicleType=contract.vehicleType, vehicleCategory=contract.vehicleCategory,
        carModels=contract.carModels, usageVariant=contract.usageVariant,
        numberOfVehicles=contract.numberOfVehicles, fuelType=contract.fuelType,
        acRequired=contract.acRequired, reportingLocation=contract.reportingLocation,
        dutyHours=contract.dutyHours, driverRequired=contract.driverRequired,
        gpsRequired=contract.gpsRequired, brandingRequired=contract.brandingRequired,
        vehicleAgeLimit=contract.vehicleAgeLimit, replacementClause=contract.replacementClause,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(veh)
    
    sla = models.ContractSlaCompliance(
        id=f"cs_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        slaDetails=contract.slaDetails, penaltyClause=contract.penaltyClause,
        insuranceRequired=contract.insuranceRequired, driverDocsRequired=contract.driverDocsRequired,
        policeVerification=contract.policeVerification, backgroundVerification=contract.backgroundVerification,
        escalationMatrix=contract.escalationMatrix, specialInstructions=contract.specialInstructions,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(sla)
    
    ren = models.ContractRenewalTermination(
        id=f"cr_{uuid.uuid4().hex[:8]}", contractId=contract.id,
        autoRenewal=contract.autoRenewal, reminderDays=contract.reminderDays,
        renewalTerms=contract.renewalTerms, renewalStatus=contract.renewalStatus,
        terminationNotice=contract.terminationNotice, terminationClause=contract.terminationClause,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(ren)
    
    db.commit()
    db.refresh(db_item)
    return _merge_contract_data(db, db_item)
"""

content = re.sub(r'# --- CONTRACT ROUTES ---.*?(?=@contract_router\.get\("/drafts/all")', NEW_CONTRACT_ROUTES, content, flags=re.DOTALL)

with open('backend/routes/all_routes.py', 'w') as f:
    f.write(content)
