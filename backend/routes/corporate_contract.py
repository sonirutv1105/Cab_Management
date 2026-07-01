from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.db import get_db
from models.all_models import User, CorporateContract, CorporateContractVehicle, StateRateCard
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
def get_all_corporate_contracts(
    db: Session = Depends(get_db),
    # current_user: User = Depends(require_permission("contract_management", "view"))
):
    contracts = db.query(CorporateContract).all()
    return contracts

@corporate_contract_router.post("/", response_model=schemas.CorporateContractResponse, status_code=status.HTTP_201_CREATED)
def create_corporate_contract(
    contract: schemas.CorporateContractCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(require_permission("contract_management", "create"))
):
    try:
        new_contract = CorporateContract(
            contractNumber=contract.contractNumber,
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
