import sys
sys.path.append('backend')
import re

with open('backend/routes/all_routes.py', 'r') as f:
    content = f.read()

NEW_ROUTES = """
@contract_router.get("/{id}", response_model=schemas.ContractResponse)
def get_contract(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Contract not found")
    return _merge_contract_data(db, db_item)

@contract_router.put("/{id}", response_model=schemas.ContractResponse)
def update_contract(id: str, payload: schemas.ContractUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    contract_data = payload.model_dump(exclude_unset=True)
    
    # 1. Update Core
    core_fields = ["contractNumber", "title", "type", "department", "description", "clientName", "contactPerson", "email", "phone", "startDate", "endDate", "durationMonths", "value", "currency", "paymentTerms", "billingFrequency", "securityDeposit", "taxInformation", "autoRenewal", "renewalDate", "reminderDays", "renewalTerms", "renewalStatus", "status", "updatedAt", "updatedBy"]
    for key, val in contract_data.items():
        if key in core_fields:
            setattr(db_item, key, val)
            
    # 2. Update Buyer
    buyer = db.query(models.ContractBuyerDetail).filter(models.ContractBuyerDetail.contractId == id).first()
    if buyer:
        for key in ["organisationType", "ministry", "organisationName", "buyerName", "buyerDesignation", "buyerContact", "buyerEmail", "buyerAddress", "buyerState", "buyerDivision"]:
            if key in contract_data: setattr(buyer, key, contract_data[key])
            
    # 3. Update Client
    client = db.query(models.ContractClientDetail).filter(models.ContractClientDetail.contractId == id).first()
    if client:
        for key in ["clientName", "clientGstin", "contactPerson", "clientDesignation", "email", "phone", "clientState", "clientPincode", "clientAddress"]:
            if key in contract_data: setattr(client, key, contract_data[key])
            
    # 4. Update Financial
    fin = db.query(models.ContractFinancial).filter(models.ContractFinancial.contractId == id).first()
    if fin:
        for key in ["monthlyBaseFare", "gstPercentage", "gstAmount", "securityDeposit", "ePbgPercentage", "paymentMode", "billingFrequency", "paymentTerms", "invoiceRaisedTo", "invoiceDueDate", "latePaymentPenalty", "adminApproval", "financialApproval", "ifdConcurrence"]:
            if key in contract_data: setattr(fin, key, contract_data[key])
            
    # 5. Update Consignee
    con = db.query(models.ContractConsigneeDetail).filter(models.ContractConsigneeDetail.contractId == id).first()
    if con:
        for key in ["consigneeName", "consigneeDesignation", "consigneeContact", "consigneeEmail", "consigneeAddress", "consigneeState", "consigneePincode"]:
            if key in contract_data: setattr(con, key, contract_data[key])
            
    # 6. Update Vehicle
    veh = db.query(models.ContractVehicleRequirement).filter(models.ContractVehicleRequirement.contractId == id).first()
    if veh:
        for key in ["vehicleType", "vehicleCategory", "carModels", "usageVariant", "numberOfVehicles", "fuelType", "acRequired", "reportingLocation", "dutyHours", "driverRequired", "gpsRequired", "brandingRequired", "vehicleAgeLimit", "replacementClause"]:
            if key in contract_data: setattr(veh, key, contract_data[key])
            
    # 7. Update SLA
    sla = db.query(models.ContractSlaCompliance).filter(models.ContractSlaCompliance.contractId == id).first()
    if sla:
        for key in ["slaDetails", "penaltyClause", "insuranceRequired", "driverDocsRequired", "policeVerification", "backgroundVerification", "escalationMatrix", "specialInstructions"]:
            if key in contract_data: setattr(sla, key, contract_data[key])
            
    # 8. Update Renewal
    ren = db.query(models.ContractRenewalTermination).filter(models.ContractRenewalTermination.contractId == id).first()
    if ren:
        for key in ["autoRenewal", "reminderDays", "renewalTerms", "renewalStatus", "terminationNotice", "terminationClause"]:
            if key in contract_data: setattr(ren, key, contract_data[key])

    db.commit()
    db.refresh(db_item)
    return _merge_contract_data(db, db_item)

@contract_router.delete("/{id}")
def delete_contract(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    db.query(models.ContractBuyerDetail).filter(models.ContractBuyerDetail.contractId == id).delete()
    db.query(models.ContractClientDetail).filter(models.ContractClientDetail.contractId == id).delete()
    db.query(models.ContractFinancial).filter(models.ContractFinancial.contractId == id).delete()
    db.query(models.ContractConsigneeDetail).filter(models.ContractConsigneeDetail.contractId == id).delete()
    db.query(models.ContractVehicleRequirement).filter(models.ContractVehicleRequirement.contractId == id).delete()
    db.query(models.ContractSlaCompliance).filter(models.ContractSlaCompliance.contractId == id).delete()
    db.query(models.ContractRenewalTermination).filter(models.ContractRenewalTermination.contractId == id).delete()
    
    db.delete(db_item)
    db.commit()
    return {"message": "Contract deleted"}
"""

content = re.sub(r'@contract_router\.get\("/\{id\}", response_model=schemas\.ContractResponse\).*?(?=\n\ncontract_service_router)', NEW_ROUTES, content, flags=re.DOTALL)

with open('backend/routes/all_routes.py', 'w') as f:
    f.write(content)
