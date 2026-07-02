from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.db import get_db
from models.all_models import (
    User, CorporateContract, CorporateContractVehicle, StateRateCard, Company,
    CorporateContractDocument, CorporateContractApproval, CorporateContractRenewal, CorporateContractHistory, CorporateContractClientDetail
)
from validations import all_schemas as schemas
from routes.all_routes import require_permission
from datetime import datetime

corporate_contract_router = APIRouter(prefix="/api/corporate-contracts", tags=["Corporate Contracts"])
rate_card_router = APIRouter(prefix="/api/rate-cards", tags=["Rate Cards"])

@rate_card_router.get("/{state}", response_model=List[schemas.StateRateCardResponse])
def get_rate_cards_by_state(state: str, db: Session = Depends(get_db)):
    cards = db.query(StateRateCard).filter(StateRateCard.state.ilike(state)).all()
    return cards

@corporate_contract_router.get("/", response_model=List[schemas.CorporateContractResponse])
def get_all_corporate_contracts(db: Session = Depends(get_db)):
    return db.query(CorporateContract).all()

@corporate_contract_router.post("/", response_model=schemas.CorporateContractResponse, status_code=status.HTTP_201_CREATED)
def create_corporate_contract(
    contract: schemas.CorporateContractCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(require_permission("contract_management", "create"))
):
    try:
        generated_contract_number = contract.contractNumber if contract.contractNumber else f"CORP-{int(datetime.utcnow().timestamp())}"
        new_contract = CorporateContract(
            contractNumber=generated_contract_number,
            contractName=contract.contractName,
            company=contract.company,
            branch=contract.branch,
            department=contract.department,
            clientContactPerson=contract.clientContactPerson,
            clientMobile=contract.clientMobile,
            clientEmail=contract.clientEmail,
            contractStatus=contract.contractStatus,
            priority=contract.priority,
            description=contract.description,
            startDate=contract.startDate,
            endDate=contract.endDate,
            renewalType=contract.renewalType,
            renewalReminder=contract.renewalReminder,
            isActive=contract.isActive,
            operatingState=contract.operatingState,
            operatingCity=contract.operatingCity,
            officeLocation=contract.officeLocation,
            serviceRadius=contract.serviceRadius,
            dedicatedVehicle=contract.dedicatedVehicle,
            employeePickupDrop=contract.employeePickupDrop,
            airportTransfer=contract.airportTransfer,
            localDuty=contract.localDuty,
            outstation=contract.outstation,
            onDemandBooking=contract.onDemandBooking,
            vipService=contract.vipService,
            support24x7=contract.support24x7,
            companyProvidesDriver=contract.companyProvidesDriver,
            dedicatedDriver=contract.dedicatedDriver,
            backupDriver=contract.backupDriver,
            driverRotation=contract.driverRotation,
            driverShiftTiming=contract.driverShiftTiming,
            driverUniformRequired=contract.driverUniformRequired,
            billingCycle=contract.billingCycle,
            invoiceGenerationDate=contract.invoiceGenerationDate,
            creditDays=contract.creditDays,
            gst=contract.gst,
            tds=contract.tds,
            penaltyRules=contract.penaltyRules,
            latePaymentRules=contract.latePaymentRules,
            contractClauses=contract.contractClauses,
            cancellationPolicy=contract.cancellationPolicy,
            penaltyClause=contract.penaltyClause,
            renewalClause=contract.renewalClause,
            notes=contract.notes,
            createdBy=contract.createdBy,
            reviewedBy=contract.reviewedBy,
            approvedBy=contract.approvedBy,
            approvalDate=contract.approvalDate,
            createdAt=contract.createdAt or datetime.utcnow().isoformat()
        )
        db.add(new_contract)
        db.flush()

        if contract.client_details:
            new_client_details = CorporateContractClientDetail(
                contract_id=new_contract.id,
                companyCode=contract.client_details.companyCode,
                gstNumber=contract.client_details.gstNumber,
                panNumber=contract.client_details.panNumber,
                billingAddress=contract.client_details.billingAddress,
                city=contract.client_details.city,
                state=contract.client_details.state,
                pincode=contract.client_details.pincode
            )
            db.add(new_client_details)

        db.commit()
        db.refresh(new_contract)

        for v in contract.vehicles:
            new_v = CorporateContractVehicle(
                contract_id=new_contract.id,
                vehicleType=v.vehicleType,
                vehicleCategory=v.vehicleCategory,
                fuelType=v.fuelType,
                transmission=v.transmission,
                quantity=v.quantity,
                monthlyKmIncluded=v.monthlyKmIncluded,
                dailyLimit=v.dailyLimit,
                extraKmCharge=v.extraKmCharge,
                minimumBillingHours=v.minimumBillingHours,
                nightCharges=v.nightCharges,
                driverAllowance=v.driverAllowance,
                waitingCharges=v.waitingCharges,
                parking=v.parking,
                toll=v.toll,
                remarks=v.remarks
            )
            db.add(new_v)
        
        db.commit()
        db.refresh(new_contract)
        return new_contract
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@corporate_contract_router.get("/{contract_id}", response_model=schemas.CorporateContractResponse)
def get_corporate_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(CorporateContract).filter(CorporateContract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Corporate Contract not found")
    return contract

@corporate_contract_router.put("/{contract_id}", response_model=schemas.CorporateContractResponse)
def update_corporate_contract(contract_id: int, contract_update: schemas.CorporateContractCreate, db: Session = Depends(get_db)):
    db_contract = db.query(CorporateContract).filter(CorporateContract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Corporate Contract not found")
    
    try:
        update_data = contract_update.model_dump(exclude_unset=True, exclude={"vehicles", "client_details"})
        for key, value in update_data.items():
            setattr(db_contract, key, value)
        
        if contract_update.client_details:
            if db_contract.client_details:
                for key, value in contract_update.client_details.model_dump(exclude_unset=True).items():
                    setattr(db_contract.client_details, key, value)
            else:
                new_client_details = CorporateContractClientDetail(
                    contract_id=db_contract.id,
                    **contract_update.client_details.model_dump()
                )
                db.add(new_client_details)
        
        db.query(CorporateContractVehicle).filter(CorporateContractVehicle.contract_id == db_contract.id).delete()
        for v in contract_update.vehicles:
            new_v = CorporateContractVehicle(
                contract_id=db_contract.id,
                **v.model_dump()
            )
            db.add(new_v)
            
        db.commit()
        db.refresh(db_contract)
        return db_contract
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@corporate_contract_router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_corporate_contract(contract_id: int, db: Session = Depends(get_db)):
    db_contract = db.query(CorporateContract).filter(CorporateContract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Corporate Contract not found")
    
    try:
        db.delete(db_contract)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Documents ───
@corporate_contract_router.get("/{contract_id}/documents", response_model=List[schemas.CorporateContractDocumentResponse])
def get_documents(contract_id: int, db: Session = Depends(get_db)):
    return db.query(CorporateContractDocument).filter(CorporateContractDocument.contract_id == contract_id).all()

@corporate_contract_router.post("/{contract_id}/documents", response_model=schemas.CorporateContractDocumentResponse)
def create_document(contract_id: int, doc: schemas.CorporateContractDocumentCreate, db: Session = Depends(get_db)):
    new_doc = CorporateContractDocument(**doc.dict(), contract_id=contract_id, created_at=datetime.utcnow().isoformat())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@corporate_contract_router.put("/documents/{doc_id}", response_model=schemas.CorporateContractDocumentResponse)
def update_document(doc_id: int, doc: schemas.CorporateContractDocumentCreate, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractDocument).filter(CorporateContractDocument.id == doc_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    for k, v in doc.dict(exclude_unset=True).items():
        setattr(existing, k, v)
    existing.updated_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(existing)
    return existing

@corporate_contract_router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractDocument).filter(CorporateContractDocument.id == doc_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(existing)
    db.commit()
    return {"detail": "Deleted successfully"}


# ─── Approvals ───
@corporate_contract_router.get("/{contract_id}/approvals", response_model=List[schemas.CorporateContractApprovalResponse])
def get_approvals(contract_id: int, db: Session = Depends(get_db)):
    return db.query(CorporateContractApproval).filter(CorporateContractApproval.contract_id == contract_id).all()

@corporate_contract_router.post("/{contract_id}/approvals", response_model=schemas.CorporateContractApprovalResponse)
def create_approval(contract_id: int, approval: schemas.CorporateContractApprovalCreate, db: Session = Depends(get_db)):
    new_approval = CorporateContractApproval(**approval.dict(), contract_id=contract_id, created_at=datetime.utcnow().isoformat())
    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)
    return new_approval

@corporate_contract_router.put("/approvals/{approval_id}", response_model=schemas.CorporateContractApprovalResponse)
def update_approval(approval_id: int, approval: schemas.CorporateContractApprovalCreate, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractApproval).filter(CorporateContractApproval.id == approval_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Approval not found")
    for k, v in approval.dict(exclude_unset=True).items():
        setattr(existing, k, v)
    existing.updated_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(existing)
    return existing

@corporate_contract_router.delete("/approvals/{approval_id}")
def delete_approval(approval_id: int, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractApproval).filter(CorporateContractApproval.id == approval_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Approval not found")
    db.delete(existing)
    db.commit()
    return {"detail": "Deleted successfully"}


# ─── Renewals ───
@corporate_contract_router.get("/{contract_id}/renewals", response_model=List[schemas.CorporateContractRenewalResponse])
def get_renewals(contract_id: int, db: Session = Depends(get_db)):
    return db.query(CorporateContractRenewal).filter(CorporateContractRenewal.contract_id == contract_id).all()

@corporate_contract_router.post("/{contract_id}/renewals", response_model=schemas.CorporateContractRenewalResponse)
def create_renewal(contract_id: int, renewal: schemas.CorporateContractRenewalCreate, db: Session = Depends(get_db)):
    new_renewal = CorporateContractRenewal(**renewal.dict(), contract_id=contract_id, created_at=datetime.utcnow().isoformat())
    db.add(new_renewal)
    db.commit()
    db.refresh(new_renewal)
    return new_renewal

@corporate_contract_router.put("/renewals/{renewal_id}", response_model=schemas.CorporateContractRenewalResponse)
def update_renewal(renewal_id: int, renewal: schemas.CorporateContractRenewalCreate, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractRenewal).filter(CorporateContractRenewal.id == renewal_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Renewal not found")
    for k, v in renewal.dict(exclude_unset=True).items():
        setattr(existing, k, v)
    existing.updated_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(existing)
    return existing

@corporate_contract_router.delete("/renewals/{renewal_id}")
def delete_renewal(renewal_id: int, db: Session = Depends(get_db)):
    existing = db.query(CorporateContractRenewal).filter(CorporateContractRenewal.id == renewal_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Renewal not found")
    db.delete(existing)
    db.commit()
    return {"detail": "Deleted successfully"}


# ─── History ───
@corporate_contract_router.get("/{contract_id}/history", response_model=List[schemas.CorporateContractHistoryResponse])
def get_history(contract_id: int, db: Session = Depends(get_db)):
    return db.query(CorporateContractHistory).filter(CorporateContractHistory.contract_id == contract_id).all()

@corporate_contract_router.post("/{contract_id}/history", response_model=schemas.CorporateContractHistoryResponse)
def create_history(contract_id: int, history: schemas.CorporateContractHistoryCreate, db: Session = Depends(get_db)):
    new_history = CorporateContractHistory(**history.dict(), contract_id=contract_id, created_at=datetime.utcnow().isoformat())
    db.add(new_history)
    db.commit()
    db.refresh(new_history)
    return new_history


# ─── Export ───
@corporate_contract_router.get("/export/csv")
def export_corporate_contracts(db: Session = Depends(get_db)):
    # Returns all corporate contracts for export purposes
    contracts = db.query(CorporateContract).all()
    # In a real scenario, this would generate CSV/Excel.
    # For now, just returning JSON which can be converted to CSV on frontend
    return contracts
