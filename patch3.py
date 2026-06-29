import sys

# 1. APPEND SCHEMAS TO all_schemas.py
NEW_SCHEMAS = """

class ContractBuyerDetailBase(BaseModel):
    contractId: str
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
    id: str

class ContractBuyerDetailUpdate(ContractBuyerDetailBase):
    contractId: Optional[str] = None

class ContractBuyerDetailResponse(ContractBuyerDetailBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractClientDetailBase(BaseModel):
    contractId: str
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
    id: str

class ContractClientDetailUpdate(ContractClientDetailBase):
    contractId: Optional[str] = None

class ContractClientDetailResponse(ContractClientDetailBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractFinancialBase(BaseModel):
    contractId: str
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
    id: str

class ContractFinancialUpdate(ContractFinancialBase):
    contractId: Optional[str] = None

class ContractFinancialResponse(ContractFinancialBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractConsigneeDetailBase(BaseModel):
    contractId: str
    consigneeName: Optional[str] = None
    consigneeDesignation: Optional[str] = None
    consigneeContact: Optional[str] = None
    consigneeEmail: Optional[str] = None
    consigneeAddress: Optional[str] = None
    consigneeState: Optional[str] = None
    consigneePincode: Optional[str] = None

class ContractConsigneeDetailCreate(ContractConsigneeDetailBase):
    id: str

class ContractConsigneeDetailUpdate(ContractConsigneeDetailBase):
    contractId: Optional[str] = None

class ContractConsigneeDetailResponse(ContractConsigneeDetailBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractVehicleRequirementBase(BaseModel):
    contractId: str
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
    id: str

class ContractVehicleRequirementUpdate(ContractVehicleRequirementBase):
    contractId: Optional[str] = None

class ContractVehicleRequirementResponse(ContractVehicleRequirementBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractSlaComplianceBase(BaseModel):
    contractId: str
    slaDetails: Optional[str] = None
    penaltyClause: Optional[str] = None
    insuranceRequired: Optional[str] = None
    driverDocsRequired: Optional[str] = None
    policeVerification: Optional[bool] = False
    backgroundVerification: Optional[bool] = False
    escalationMatrix: Optional[str] = None
    specialInstructions: Optional[str] = None

class ContractSlaComplianceCreate(ContractSlaComplianceBase):
    id: str

class ContractSlaComplianceUpdate(ContractSlaComplianceBase):
    contractId: Optional[str] = None

class ContractSlaComplianceResponse(ContractSlaComplianceBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ContractRenewalTerminationBase(BaseModel):
    contractId: str
    autoRenewal: Optional[bool] = False
    reminderDays: Optional[int] = None
    renewalTerms: Optional[str] = None
    renewalStatus: Optional[str] = None
    terminationNotice: Optional[str] = None
    terminationClause: Optional[str] = None

class ContractRenewalTerminationCreate(ContractRenewalTerminationBase):
    id: str

class ContractRenewalTerminationUpdate(ContractRenewalTerminationBase):
    contractId: Optional[str] = None

class ContractRenewalTerminationResponse(ContractRenewalTerminationBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
"""

with open('backend/validations/all_schemas.py', 'a') as f:
    f.write(NEW_SCHEMAS)


# 2. APPEND ROUTERS TO all_routes.py
NEW_ROUTES = """
def generate_crud_routes(router, model, create_schema, update_schema, response_schema):
    @router.get("/", response_model=list[response_schema])
    def get_all(db: Session = Depends(get_db)):
        return db.query(model).all()

    @router.get("/{id}", response_model=response_schema)
    def get_by_id(id: str, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        return db_item

    @router.post("/", response_model=response_schema)
    def create_item(item: create_schema, db: Session = Depends(get_db)):
        db_item = model(**item.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.put("/{id}", response_model=response_schema)
    def update_item(id: str, payload: update_schema, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.delete("/{id}")
    def delete_item(id: str, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        db.delete(db_item)
        db.commit()
        return {"message": "Deleted successfully"}

# Initialize routers for new contract tables
contract_buyer_router = APIRouter(prefix="/api/contract-buyers", tags=["Contract Buyers"])
contract_client_router = APIRouter(prefix="/api/contract-clients", tags=["Contract Clients"])
contract_financial_router = APIRouter(prefix="/api/contract-financials", tags=["Contract Financials"])
contract_consignee_router = APIRouter(prefix="/api/contract-consignees", tags=["Contract Consignees"])
contract_vehicle_req_router = APIRouter(prefix="/api/contract-vehicle-reqs", tags=["Contract Vehicle Reqs"])
contract_sla_router = APIRouter(prefix="/api/contract-slas", tags=["Contract SLAs"])
contract_renewal_router = APIRouter(prefix="/api/contract-renewals", tags=["Contract Renewals"])

generate_crud_routes(contract_buyer_router, models.ContractBuyerDetail, schemas.ContractBuyerDetailCreate, schemas.ContractBuyerDetailUpdate, schemas.ContractBuyerDetailResponse)
generate_crud_routes(contract_client_router, models.ContractClientDetail, schemas.ContractClientDetailCreate, schemas.ContractClientDetailUpdate, schemas.ContractClientDetailResponse)
generate_crud_routes(contract_financial_router, models.ContractFinancial, schemas.ContractFinancialCreate, schemas.ContractFinancialUpdate, schemas.ContractFinancialResponse)
generate_crud_routes(contract_consignee_router, models.ContractConsigneeDetail, schemas.ContractConsigneeDetailCreate, schemas.ContractConsigneeDetailUpdate, schemas.ContractConsigneeDetailResponse)
generate_crud_routes(contract_vehicle_req_router, models.ContractVehicleRequirement, schemas.ContractVehicleRequirementCreate, schemas.ContractVehicleRequirementUpdate, schemas.ContractVehicleRequirementResponse)
generate_crud_routes(contract_sla_router, models.ContractSlaCompliance, schemas.ContractSlaComplianceCreate, schemas.ContractSlaComplianceUpdate, schemas.ContractSlaComplianceResponse)
generate_crud_routes(contract_renewal_router, models.ContractRenewalTermination, schemas.ContractRenewalTerminationCreate, schemas.ContractRenewalTerminationUpdate, schemas.ContractRenewalTerminationResponse)

# Export them for main.py (if needed, or main.py might need updating)
"""

with open('backend/routes/all_routes.py', 'a') as f:
    f.write(NEW_ROUTES)

# 3. APPEND EXPORTS TO main.py
import re
with open('backend/main.py', 'r') as f:
    main_content = f.read()

MAIN_PATCH = """
from routes.all_routes import contract_buyer_router, contract_client_router, contract_financial_router, contract_consignee_router, contract_vehicle_req_router, contract_sla_router, contract_renewal_router

app.include_router(contract_buyer_router)
app.include_router(contract_client_router)
app.include_router(contract_financial_router)
app.include_router(contract_consignee_router)
app.include_router(contract_vehicle_req_router)
app.include_router(contract_sla_router)
app.include_router(contract_renewal_router)
"""

if "contract_buyer_router" not in main_content:
    with open('backend/main.py', 'a') as f:
        f.write(MAIN_PATCH)

