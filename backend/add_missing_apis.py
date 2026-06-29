import os

routes_content = """

# --- MISSING EXISTING ROUTES ---
from services.all_services import (
    shift_service, fuel_log_service, maintenance_log_service, compliance_doc_service,
    app_document_service, app_notification_service, system_setting_service,
    contract_service_service, contract_document_service, contract_note_service,
    contract_payment_service, audit_log_service, contract_activity_log_service
)

@vehicle_router.get("/{id}", response_model=schemas.VehicleResponse)
def get_vehicle(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Vehicle).filter(models.Vehicle.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@vehicle_router.put("/{id}", response_model=schemas.VehicleResponse)
def update_vehicle(id: str, payload: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Vehicle).filter(models.Vehicle.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@booking_router.get("/{id}", response_model=schemas.BookingResponse)
def get_booking(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Booking).filter(models.Booking.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@booking_router.put("/{id}", response_model=schemas.BookingResponse)
def update_booking(id: str, payload: schemas.BookingUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Booking).filter(models.Booking.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@trip_router.get("/{id}", response_model=schemas.TripResponse)
def get_trip(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Trip).filter(models.Trip.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@trip_router.put("/{id}", response_model=schemas.TripResponse)
def update_trip(id: str, payload: schemas.TripUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Trip).filter(models.Trip.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@contract_router.get("/{id}", response_model=schemas.ContractResponse)
def get_contract(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@contract_router.put("/{id}", response_model=schemas.ContractResponse)
def update_contract(id: str, payload: schemas.ContractUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@vendor_router.get("/{id}", response_model=schemas.VendorResponse)
def get_vendor(id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@vendor_router.put("/{id}", response_model=schemas.VendorResponse)
def update_vendor(id: str, payload: schemas.VendorUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- NEW MODULES ---
shift_router = APIRouter(prefix="/api/shifts", tags=["Shifts"])
fuel_log_router = APIRouter(prefix="/api/fuel-logs", tags=["Fuel Logs"])
maintenance_log_router = APIRouter(prefix="/api/maintenance-logs", tags=["Maintenance Logs"])
compliance_doc_router = APIRouter(prefix="/api/compliance-docs", tags=["Compliance Docs"])
app_document_router = APIRouter(prefix="/api/documents", tags=["Documents"])
app_notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
system_setting_router = APIRouter(prefix="/api/settings", tags=["Settings"])
contract_service_router = APIRouter(prefix="/api/contract-services", tags=["Contract Services"])
contract_document_router = APIRouter(prefix="/api/contract-documents", tags=["Contract Documents"])
contract_note_router = APIRouter(prefix="/api/contract-notes", tags=["Contract Notes"])
contract_payment_router = APIRouter(prefix="/api/contract-payments", tags=["Contract Payments"])
audit_log_router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])
contract_activity_log_router = APIRouter(prefix="/api/contract-activity", tags=["Contract Activity Logs"])

NEW_ROUTERS = [
    (shift_router, shift_service, schemas.ShiftCreate, schemas.ShiftUpdate, schemas.ShiftResponse),
    (fuel_log_router, fuel_log_service, schemas.FuelLogCreate, schemas.FuelLogUpdate, schemas.FuelLogResponse),
    (maintenance_log_router, maintenance_log_service, schemas.MaintenanceLogCreate, schemas.MaintenanceLogUpdate, schemas.MaintenanceLogResponse),
    (compliance_doc_router, compliance_doc_service, schemas.ComplianceDocCreate, schemas.ComplianceDocUpdate, schemas.ComplianceDocResponse),
    (app_document_router, app_document_service, schemas.AppDocumentCreate, schemas.AppDocumentUpdate, schemas.AppDocumentResponse),
    (app_notification_router, app_notification_service, schemas.AppNotificationCreate, schemas.AppNotificationUpdate, schemas.AppNotificationResponse),
    (system_setting_router, system_setting_service, schemas.SystemSettingCreate, schemas.SystemSettingUpdate, schemas.SystemSettingResponse),
    (contract_service_router, contract_service_service, schemas.ContractServiceCreate, schemas.ContractServiceUpdate, schemas.ContractServiceResponse),
    (contract_document_router, contract_document_service, schemas.ContractDocumentCreate, schemas.ContractDocumentUpdate, schemas.ContractDocumentResponse),
    (contract_note_router, contract_note_service, schemas.ContractNoteCreate, schemas.ContractNoteUpdate, schemas.ContractNoteResponse),
    (contract_payment_router, contract_payment_service, schemas.ContractPaymentCreate, schemas.ContractPaymentUpdate, schemas.ContractPaymentResponse)
]

def make_crud_routes(router, service, create_schema, update_schema, response_schema):
    @router.get("/", response_model=list[response_schema])
    def get_all(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
        return service.get_multi(db, skip=skip, limit=limit)

    @router.get("/{id}", response_model=response_schema)
    def get_one(id: str, db: Session = Depends(get_db)):
        return service.get(db, id)

    @router.post("/", response_model=response_schema)
    def create_one(payload: create_schema, db: Session = Depends(get_db)):
        return service.create(db, payload)

    @router.put("/{id}", response_model=response_schema)
    def update_one(id: str, payload: update_schema, db: Session = Depends(get_db)):
        return service.update(db, id, payload)

    @router.delete("/{id}")
    def delete_one(id: str, db: Session = Depends(get_db)):
        service.delete(db, id)
        return {"message": "Deleted"}

for r, s, c_s, u_s, r_s in NEW_ROUTERS:
    make_crud_routes(r, s, c_s, u_s, r_s)

# Read Only Modules
READ_ONLY_ROUTERS = [
    (audit_log_router, audit_log_service, schemas.AuditLogCreate, schemas.AuditLogResponse),
    (contract_activity_log_router, contract_activity_log_service, schemas.ContractActivityLogCreate, schemas.ContractActivityLogResponse)
]

def make_read_routes(router, service, create_schema, response_schema):
    @router.get("/", response_model=list[response_schema])
    def get_all(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
        return service.get_multi(db, skip=skip, limit=limit)

    @router.get("/{id}", response_model=response_schema)
    def get_one(id: str, db: Session = Depends(get_db)):
        return service.get(db, id)

    @router.post("/", response_model=response_schema)
    def create_one(payload: create_schema, db: Session = Depends(get_db)):
        return service.create(db, payload)

for r, s, c_s, r_s in READ_ONLY_ROUTERS:
    make_read_routes(r, s, c_s, r_s)
"""

with open(r'd:\Cab_Management_system\backend\routes\all_routes.py', 'a') as f:
    f.write(routes_content)

print("Routes successfully appended.")
