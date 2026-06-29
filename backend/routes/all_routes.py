from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import os
import shutil
import uuid
from database.db import get_db
from models import all_models as models
from validations import all_schemas as schemas
import re
import json

# Initialize routers
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])
vehicle_router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])
driver_router = APIRouter(prefix="/api/drivers", tags=["Drivers"])
driver_draft_router = APIRouter(prefix="/api/driver-drafts", tags=["Driver Drafts"])
booking_router = APIRouter(prefix="/api/bookings", tags=["Bookings"])
trip_router = APIRouter(prefix="/api/routes", tags=["Routes"])
contract_router = APIRouter(prefix="/api/contracts", tags=["Contracts"])
vendor_router = APIRouter(prefix="/api/vendors", tags=["Vendors"])
upload_router = APIRouter(prefix="/api/upload", tags=["Uploads"])
document_router = APIRouter(prefix="/api/documents", tags=["Driver Documents"])
export_router = APIRouter(prefix="/api/export", tags=["Exports"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
user_router = APIRouter(prefix="/api/users", tags=["Users"])
support_router = APIRouter(prefix="/api/support", tags=["Support Tickets"])

# get_dashboard_stats moved to bottom after get_current_user is defined

# --- UPLOAD ROUTES ---
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

@upload_router.post("/")
def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")
        
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "id": filename.split('.')[0],
        "url": f"/uploads/{filename}", 
        "filename": file.filename,
        "document_url": f"/uploads/{filename}",
        "file_path": filepath,
        "file_name": file.filename
    }

# --- EXPORT ROUTES ---
from pydantic import BaseModel
from typing import List, Any
from fastapi.responses import StreamingResponse
from utils.export_service import generate_pdf, generate_excel

class ExportRequest(BaseModel):
    title: str
    headers: List[str]
    rows: List[List[Any]]

@export_router.post("/pdf")
def export_pdf(req: ExportRequest):
    pdf_buffer = generate_pdf(req.title, req.headers, req.rows)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={req.title.replace(' ', '_')}.pdf"}
    )

@export_router.post("/excel")
def export_excel(req: ExportRequest):
    excel_buffer = generate_excel(req.title, req.headers, req.rows)
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={req.title.replace(' ', '_')}.xlsx"}
    )

# --- AUTHENTICATION ROUTES ---
from utils.security import verify_password, get_password_hash, create_access_token
import uuid
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from config.settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def validate_vendor_for_driver(db, company_id, vendor_id, vehicle_assignment_type):
    if vehicle_assignment_type == 'Self Car':
        return
    vendor_count = db.query(models.Vendor).filter(models.Vendor.company_id == company_id).count()
    if vendor_count > 0 and not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor is required")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    if user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins cannot access operational data.")
    return user

def get_user_permissions(db: Session, user: models.User):
    if not user.company_id:
        return []
    role = db.query(models.Role).filter(models.Role.company_id == user.company_id, models.Role.name == user.role).first()
    if not role:
        return []
    perms = db.query(models.Permission).filter(models.Permission.role_id == role.id).all()
    return [{"module": p.module, "action": p.action} for p in perms]

def require_permission(module: str, action: str):
    def dependency(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        perms = get_user_permissions(db, current_user)
        has_perm = any(p["module"] == module and p["action"] == action for p in perms)
        if not has_perm:
            raise HTTPException(status_code=403, detail="Access Denied")
        return current_user
    return dependency

import json
from datetime import datetime

def log_auth_event(db: Session, request: Request, email: str, role: str, action: str, status: str, user_name: str = "Unknown", company_name: str = "Unknown", company_id: int = None):
    client_ip = request.client.host if request.client else "Unknown IP"
    user_agent = request.headers.get("user-agent", "Unknown Device")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    details_json = json.dumps({
        "user_name": user_name,
        "company_name": company_name,
        "device": user_agent
    })

    audit = models.AuditLog(
        timestamp=timestamp,
        userId=email,
        userEmail=email,
        userRole=role,
        action=action,
        module="Authentication",
        details=details_json,
        ipAddress=client_ip,
        status=status,
        company_id=company_id
    )
    db.add(audit)
    db.commit()

@auth_router.post("/login")
def login(credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    # Auto-seed initial company admin if no users exist
    if db.query(models.User).count() == 0:
        admin_user = models.User(
            name="Admin User",
            email="admin@example.com",
            role="admin",
            companyName="CMS Enterprise",
            hashed_password=get_password_hash("password")
        )
        db.add(admin_user)
        db.commit()

    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        log_auth_event(db, request, credentials.email, "Unknown", "Failed Login", "Failed")
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if user.company_id:
        company = db.query(models.Company).filter(models.Company.id == user.company_id).first()
        if company and company.status == "Inactive":
            log_auth_event(db, request, user.email, user.role, "Failed Login", "Failed", user.name, company.name, company.id)
            raise HTTPException(status_code=403, detail="Your company account has been deactivated.")
    
    token = create_access_token(data={"sub": user.email})
    
    company_name = "Unknown"
    if user.company_id:
        company = db.query(models.Company).filter(models.Company.id == user.company_id).first()
        if company: company_name = company.name
        
    log_auth_event(db, request, user.email, user.role, "User Login", "Success", user.name, company_name, user.company_id)
    
    perms = get_user_permissions(db, user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id,
            "companyName": user.companyName,
            "avatar": user.avatar,
            "department": user.department,
            "lastActive": user.lastActive,
            "permissions": perms
        }
    }

@auth_router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company_name = "Unknown"
    if current_user.company_id:
        company = db.query(models.Company).filter(models.Company.id == current_user.company_id).first()
        if company: company_name = company.name
    
    log_auth_event(db, request, current_user.email, current_user.role, "User Logout", "Success", current_user.name, company_name, current_user.company_id)
    return {"message": "Logged out successfully"}

@auth_router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    perms = get_user_permissions(db, current_user)
    user_dict = {c.name: getattr(current_user, c.name) for c in current_user.__table__.columns}
    user_dict["permissions"] = perms
    return user_dict

@auth_router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@auth_router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.model_dump(exclude={"password"}))
    db_user.hashed_password = "hashed_pass" # use security utils in real scenario
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- VEHICLE ROUTES ---
@vehicle_router.get("/")
def get_vehicles(current_user: models.User = Depends(require_permission("vehicle_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.Vehicle).filter(models.Vehicle.company_id == current_user.company_id).all()

@vehicle_router.post("/")
def create_vehicle(vehicle: schemas.VehicleCreate, current_user: models.User = Depends(require_permission("vehicle_management", "create")), db: Session = Depends(get_db)):
    vehicle_dict = vehicle.model_dump()
    vehicle_dict['company_id'] = current_user.company_id
    db_item = models.Vehicle(**vehicle_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@vehicle_router.delete("/{id}")
def delete_vehicle(id: int, current_user: models.User = Depends(require_permission("vehicle_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vehicle).filter(models.Vehicle.id == id, models.Vehicle.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}

# --- DRIVER ROUTES ---
@driver_router.get("/")
def get_drivers(current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.Driver).filter(models.Driver.is_draft == False, models.Driver.company_id == current_user.company_id).all()



@driver_router.get("/{id}", response_model=schemas.DriverResponse)
def get_driver(id: int, current_user: models.User = Depends(require_permission("vehicle_management", "create")), db: Session = Depends(get_db)):
    db_item = db.query(models.Driver).filter(models.Driver.id == id, models.Driver.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Driver not found")
    return db_item

def compute_driver_status(driver_dict: dict) -> str:
    # Admin rejected explicitly?
    if driver_dict.get('complianceStatus') == 'Rejected':
        return 'Rejected'
    
    # Check mandatory files/fields
    if not driver_dict.get('dlFile') or not driver_dict.get('licenseNumber') or not driver_dict.get('licenseExpiry'):
        return 'Pending'
    if not driver_dict.get('policeVerificationFile') or not driver_dict.get('policeVerificationNumber') or not driver_dict.get('policeVerificationExpiry'):
        return 'Pending'
    if not driver_dict.get('driverPhotoFile'):
        return 'Pending'
        
    # Check expiries
    today_str = datetime.now().strftime("%Y-%m-%d")
    if driver_dict.get('licenseExpiry') and driver_dict.get('licenseExpiry') < today_str:
        return 'Expired'
    if driver_dict.get('policeVerificationExpiry') and driver_dict.get('policeVerificationExpiry') < today_str:
        return 'Expired'
    if driver_dict.get('medicalCertificateExpiry') and driver_dict.get('medicalCertificateExpiry') < today_str:
        return 'Expired'
        
    return 'Verified'


@driver_router.get("/search/{license_number}", response_model=schemas.DriverResponse)
def search_driver_by_license(license_number: str, current_user: models.User = Depends(require_permission("vehicle_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Driver).filter(models.Driver.licenseNumber == license_number, models.Driver.company_id == current_user.company_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Driver not found")
    return db_item

@driver_router.post("/")
def create_driver(driver: schemas.DriverCreate, current_user: models.User = Depends(require_permission("driver_management", "create")), db: Session = Depends(get_db)):
    driver_dict = driver.model_dump()
    driver_dict['company_id'] = current_user.company_id
    validate_vendor_for_driver(db, current_user.company_id, driver_dict.get('vendorId'), driver_dict.get('vehicleAssignmentType'))
    if not driver_dict.get('name') and driver_dict.get('firstName') and driver_dict.get('lastName'):
        driver_dict['name'] = f"{driver_dict['firstName']} {driver_dict['lastName']}"
    
    # Process Self Car vehicle creation
    if driver_dict.get('vehicleAssignmentType') == 'Self Car':
        self_num = driver_dict.pop('selfVehicleNumber', None)
        self_type = driver_dict.pop('selfVehicleType', None)
        self_model = driver_dict.pop('selfVehicleModel', None)
        self_color = driver_dict.pop('selfVehicleColor', None)
        
        if not driver_dict.get('assignedVehicleId') and (self_num or self_model):
            import uuid
            new_v_id = None  # let DB auto increment
            new_v = models.Vehicle(
                id=new_v_id,
                plateNumber=self_num,
                model=self_model,
                vehicleType=self_type,
                color=self_color,
                status="Assigned",
                assignedDriverId=driver_dict.get('id'),
                company_id=current_user.company_id
            )
            db.add(new_v)
            driver_dict['assignedVehicleId'] = new_v_id
    
    # Remove extra self car fields if present
    driver_dict.pop('selfVehicleNumber', None)
    driver_dict.pop('selfVehicleType', None)
    driver_dict.pop('selfVehicleModel', None)
    driver_dict.pop('selfVehicleColor', None)
    driver_dict.pop('selfRcNumber', None)
    driver_dict.pop('selfInsuranceExpiry', None)
    
    driver_dict['complianceStatus'] = compute_driver_status(driver_dict)
    
    db_item = models.Driver(**driver_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Fix assignedDriverId if driver id was generated by db
    if 'assignedVehicleId' in driver_dict and driver_dict['assignedVehicleId']:
        v_item = db.query(models.Vehicle).filter(models.Vehicle.id == driver_dict['assignedVehicleId']).first()
        if v_item and v_item.assignedDriverId != db_item.id:
            v_item.assignedDriverId = db_item.id
            db.commit()
            
    return db_item

@driver_router.put("/{id}", response_model=schemas.DriverResponse)
def update_driver(id: int, driver: schemas.DriverUpdate, current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Driver).filter(models.Driver.id == id, models.Driver.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = driver.model_dump(exclude_unset=True)
    new_vendor_id = update_data.get('vendorId', db_item.vendorId)
    # The driver model stores vehicleAssignmentType as a dynamic property or JSON in some implementations, but in schemas it's passed.
    # We can check update_data or fallback to None (which means it's not a Self Car or it wasn't updated).
    new_assignment_type = update_data.get('vehicleAssignmentType', getattr(db_item, 'vehicleAssignmentType', None))
    validate_vendor_for_driver(db, current_user.company_id, new_vendor_id, new_assignment_type)
    
    # Compute name if firstName or lastName are being updated and we don't have an explicit name passed
    if 'name' not in update_data:
        new_first = update_data.get('firstName', db_item.firstName)
        new_last = update_data.get('lastName', db_item.lastName)
        if new_first and new_last:
            update_data['name'] = f"{new_first} {new_last}"

    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    # Recompute status based on updated db_item
    current_dict = {c.name: getattr(db_item, c.name) for c in db_item.__table__.columns}
    db_item.complianceStatus = compute_driver_status(current_dict)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@driver_router.delete("/{id}")
def delete_driver(id: int, current_user: models.User = Depends(require_permission("driver_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Driver).filter(models.Driver.id == id, models.Driver.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}

# --- DRIVER DOCUMENTS ROUTES ---
def validate_document_data(doc_type, doc_number, file_path):
    if file_path:
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")
            
    if doc_type == "Aadhaar Card" and doc_number:
        if not re.match(r'^\d{12}$', doc_number):
            raise HTTPException(status_code=400, detail="Aadhaar must be exactly 12 digits")
    elif doc_type == "PAN Card" and doc_number:
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', doc_number):
            raise HTTPException(status_code=400, detail="Invalid PAN Card format")

def recompute_driver_compliance_status(db: Session, driver_id: str):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver: return
    
    docs = db.query(models.DriverDocument).filter(models.DriverDocument.driver_id == driver_id, models.DriverDocument.is_active == True).all()
    doc_map = {d.document_type: d for d in docs}
    
    mandatory = ["Driving License", "Driver Photo", "Police Verification"]
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    status = "Verified"
    
    # 1. Check if any doc is explicitly rejected
    if any(d.verification_status == "Rejected" for d in docs):
        status = "Rejected"
    else:
        # 2. Check mandatory documents presence
        for req in mandatory:
            if req not in doc_map:
                status = "Pending"
                break
        
        if status != "Pending":
            # 3. Check expiry for all documents
            for doc in docs:
                if doc.verification_status == "Expired":
                    status = "Expired"
                    break
                if doc.expiry_date and doc.expiry_date < today_str:
                    status = "Expired"
                    doc.verification_status = "Expired"
                    break
            
            # 4. If all docs present, not rejected, not expired, check if they are all verified
            if status not in ["Pending", "Expired", "Rejected"]:
                for req in mandatory:
                    if doc_map[req].verification_status != "Verified":
                        status = "Pending"
                        break

    driver.complianceStatus = status
    db.commit()
    db.refresh(driver)

@driver_router.post("/{driver_id}/documents", response_model=schemas.DriverDocumentResponse)
def add_driver_document(
    driver_id: str,
    document_type: str = Form(...),
    document_number: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_permission("driver_management", "create")),
    db: Session = Depends(get_db)
):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver: raise HTTPException(status_code=404, detail="Driver not found")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")
        
    validate_document_data(document_type, document_number, file.filename)
    
    # Ensure directory exists
    safe_type = document_type.replace(" ", "_").lower()
    save_dir = os.path.join("uploads", "drivers", safe_type)
    os.makedirs(save_dir, exist_ok=True)
    
    filename = f"{driver_id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(save_dir, filename)
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url_path = f"/uploads/drivers/{safe_type}/{filename}"
    
    # Store in DB
    db_item = models.DriverDocument(
        driver_id=driver_id,
        document_type=document_type,
        document_number=document_number,
        issue_date=issue_date,
        expiry_date=expiry_date,
        file_name=file.filename,
        file_path=url_path,
        file_extension=ext,
        file_size=file_size,
        verification_status="Pending",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        company_id=current_user.company_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    recompute_driver_compliance_status(db, driver_id)
    return db_item

@driver_router.get("/{driver_id}/documents", response_model=list[schemas.DriverDocumentResponse])
def get_driver_documents(driver_id: str, current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.DriverDocument).filter(models.DriverDocument.driver_id == driver_id, models.DriverDocument.is_active == True, models.DriverDocument.company_id == current_user.company_id).all()

@document_router.get("/expiring", response_model=list[schemas.DriverDocumentResponse])
def get_expiring_documents(current_user: models.User = Depends(require_permission("driver_management", "update")), db: Session = Depends(get_db)):
    today = datetime.now()
    all_docs = db.query(models.DriverDocument).filter(models.DriverDocument.is_active == True, models.DriverDocument.company_id == current_user.company_id).all()
    expiring = []
    for doc in all_docs:
        if doc.expiry_date:
            try:
                exp_dt = datetime.strptime(doc.expiry_date, "%Y-%m-%d")
                days_left = (exp_dt - today).days
                if 0 <= days_left <= 30:
                    expiring.append(doc)
            except:
                pass
    return expiring

@document_router.get("/expired", response_model=list[schemas.DriverDocumentResponse])
def get_expired_documents(current_user: models.User = Depends(require_permission("driver_management", "delete")), db: Session = Depends(get_db)):
    today_str = datetime.now().strftime("%Y-%m-%d")
    return db.query(models.DriverDocument).filter(
        models.DriverDocument.is_active == True,
        models.DriverDocument.expiry_date < today_str,
        models.DriverDocument.company_id == current_user.company_id
    ).all()

@document_router.get("/{document_id}", response_model=schemas.DriverDocumentResponse)
def get_document(document_id: str, current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDocument).filter(models.DriverDocument.id == document_id, models.DriverDocument.is_active == True, models.DriverDocument.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Document not found")
    return db_item

@document_router.put("/{document_id}", response_model=schemas.DriverDocumentResponse)
def update_document(
    document_id: str, 
    document_type: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(require_permission("driver_management", "update")),
    db: Session = Depends(get_db)
):
    db_item = db.query(models.DriverDocument).filter(models.DriverDocument.id == document_id, models.DriverDocument.is_active == True, models.DriverDocument.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Document not found")
    
    if document_type is not None: db_item.document_type = document_type
    if document_number is not None: db_item.document_number = document_number
    if issue_date is not None: db_item.issue_date = issue_date
    if expiry_date is not None: db_item.expiry_date = expiry_date
    
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        safe_type = db_item.document_type.replace(" ", "_").lower()
        save_dir = os.path.join("uploads", "drivers", safe_type)
        os.makedirs(save_dir, exist_ok=True)
        
        filename = f"{db_item.driver_id}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(save_dir, filename)
        
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        db_item.file_name = file.filename
        db_item.file_path = f"/uploads/drivers/{safe_type}/{filename}"
        db_item.file_extension = ext
        db_item.file_size = file_size
        db_item.verification_status = "Pending"

    validate_document_data(db_item.document_type, db_item.document_number, db_item.file_name)
    
    db_item.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(db_item)
    
    recompute_driver_compliance_status(db, db_item.driver_id)
    return db_item

@document_router.delete("/{document_id}")
def delete_document(document_id: str, current_user: models.User = Depends(require_permission("driver_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDocument).filter(models.DriverDocument.id == document_id, models.DriverDocument.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Document not found")
    driver_id = db_item.driver_id
    db_item.is_active = False
    db.commit()
    
    recompute_driver_compliance_status(db, driver_id)
    return {"message": "Deleted"}

@document_router.post("/{document_id}/verify", response_model=schemas.DriverDocumentResponse)
def verify_document(document_id: str, current_user: models.User = Depends(require_permission("driver_management", "create")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDocument).filter(models.DriverDocument.id == document_id, models.DriverDocument.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Document not found")
    
    db_item.verification_status = "Verified"
    db_item.verified_by = "SystemAdmin"
    db_item.verified_at = datetime.now().isoformat()
    db_item.updated_at = datetime.now().isoformat()
    
    db.commit()
    db.refresh(db_item)
    
    recompute_driver_compliance_status(db, db_item.driver_id)
    return db_item

@document_router.post("/{document_id}/reject", response_model=schemas.DriverDocumentResponse)
def reject_document(document_id: str, remarks: str = Form(...), current_user: models.User = Depends(require_permission("driver_management", "create")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDocument).filter(models.DriverDocument.id == document_id, models.DriverDocument.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Document not found")
    
    db_item.verification_status = "Rejected"
    db_item.remarks = remarks
    db_item.verified_by = "SystemAdmin"
    db_item.verified_at = datetime.now().isoformat()
    db_item.updated_at = datetime.now().isoformat()
    
    db.commit()
    db.refresh(db_item)
    
    recompute_driver_compliance_status(db, db_item.driver_id)
    return db_item

# --- BOOKING ROUTES ---
@booking_router.get("/", response_model=list[schemas.BookingResponse])
def get_bookings(current_user: models.User = Depends(require_permission("booking_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.Booking).filter(models.Booking.company_id == current_user.company_id).all()

@booking_router.post("/", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, current_user: models.User = Depends(require_permission("booking_management", "create")), db: Session = Depends(get_db)):
    booking_dict = booking.model_dump()
    booking_dict['company_id'] = current_user.company_id
    db_item = models.Booking(**booking_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@booking_router.delete("/{id}")
def delete_booking(id: int, current_user: models.User = Depends(require_permission("booking_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Booking).filter(models.Booking.id == id, models.Booking.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}

# --- TRIP ROUTES ---
@trip_router.get("/", response_model=list[schemas.TripResponse])
def get_trips(current_user: models.User = Depends(require_permission("trip_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.company_id == current_user.company_id).all()

@trip_router.post("/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, current_user: models.User = Depends(require_permission("trip_management", "create")), db: Session = Depends(get_db)):
    trip_dict = trip.model_dump()
    trip_dict['company_id'] = current_user.company_id
    db_item = models.Trip(**trip_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@trip_router.delete("/{id}")
def delete_trip(id: int, current_user: models.User = Depends(require_permission("trip_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Trip).filter(models.Trip.id == id, models.Trip.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}


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


from typing import Optional
import logging

logger = logging.getLogger(__name__)

@contract_router.get("/", response_model=list[schemas.ContractResponse])
def get_contracts(
    search: Optional[str] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    department: Optional[str] = None,
    current_user: models.User = Depends(require_permission("contract_management", "view")),
    db: Session = Depends(get_db)
):
    from sqlalchemy import or_
    query = db.query(models.Contract).filter(models.Contract.company_id == current_user.company_id)
    if search:
        query = query.filter(
            or_(
                models.Contract.contractNumber.ilike(f"%{search}%"),
                models.Contract.title.ilike(f"%{search}%"),
                models.Contract.clientName.ilike(f"%{search}%")
            )
        )
    if status and status != 'All':
        query = query.filter(models.Contract.status == status)
    if type and type != 'All Types':
        query = query.filter(models.Contract.type == type)
    if department and department != 'All Departments':
        query = query.filter(models.Contract.department == department)
        
    contracts = query.all()
    return [_merge_contract_data(db, c) for c in contracts]

@contract_router.post("/", response_model=schemas.ContractResponse)
def create_contract(contract: schemas.ContractCreate, current_user: models.User = Depends(require_permission("contract_management", "create")), db: Session = Depends(get_db)):
    from fastapi import HTTPException
    
    # 6. Normalize the contract number before duplicate check
    raw_number = contract.contractNumber or ""
    normalized_number = raw_number.strip().upper()
    
    print(f"Request JSON: {contract.model_dump()}")
    print(f"Contract Number Received: {raw_number}")
    print(f"Normalized Contract Number: {normalized_number}")
    
    # Check if a contract exists with the exact normalized number
    # Also ignore duplicate check if we're somehow updating (though this is POST)
    existing_contracts = db.query(models.Contract).filter(models.Contract.company_id == current_user.company_id).all()
    existing = next((c for c in existing_contracts if (c.contractNumber or "").strip().upper() == normalized_number), None)
    
    if existing:
        print(f"Existing Duplicate Found: ID={existing.id}, ContractNumber={existing.contractNumber}")
        raise HTTPException(status_code=409, detail="Duplicate Contract Number")
        
    import uuid
    core_fields = ["id", "contractNumber", "title", "type", "department", "description", "clientName", "contactPerson", "email", "phone", "startDate", "endDate", "durationMonths", "value", "currency", "paymentTerms", "billingFrequency", "securityDeposit", "taxInformation", "autoRenewal", "renewalDate", "reminderDays", "renewalTerms", "renewalStatus", "status", "createdAt", "updatedAt", "createdBy", "updatedBy"]
    contract_data = contract.model_dump()
    core_data = {k: contract_data[k] for k in core_fields if k in contract_data}
    core_data['company_id'] = current_user.company_id
    db_item = models.Contract(**core_data)
    db.add(db_item)
    
    # 2. Add Buyer Details
    buyer = models.ContractBuyerDetail(
        contractId=contract.id,
        organisationType=contract.organisationType, ministry=contract.ministry,
        organisationName=contract.organisationName, buyerName=contract.buyerName,
        buyerDesignation=contract.buyerDesignation, buyerContact=contract.buyerContact,
        buyerEmail=contract.buyerEmail, buyerAddress=contract.buyerAddress,
        buyerState=contract.buyerState, buyerDivision=contract.buyerDivision,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(buyer)
    
    client = models.ContractClientDetail(
        contractId=contract.id,
        clientName=contract.clientName, clientGstin=contract.clientGstin,
        contactPerson=contract.contactPerson, clientDesignation=contract.clientDesignation,
        email=contract.email, phone=contract.phone, clientState=contract.clientState,
        clientPincode=contract.clientPincode, clientAddress=contract.clientAddress,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(client)
    
    fin = models.ContractFinancial(
        contractId=contract.id,
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
        contractId=contract.id,
        consigneeName=contract.consigneeName, consigneeDesignation=contract.consigneeDesignation,
        consigneeContact=contract.consigneeContact, consigneeEmail=contract.consigneeEmail,
        consigneeAddress=contract.consigneeAddress, consigneeState=contract.consigneeState,
        consigneePincode=contract.consigneePincode,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(consignee)
    
    veh = models.ContractVehicleRequirement(
        contractId=contract.id,
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
        contractId=contract.id,
        slaDetails=contract.slaDetails, penaltyClause=contract.penaltyClause,
        insuranceRequired=contract.insuranceRequired, driverDocsRequired=contract.driverDocsRequired,
        policeVerification=contract.policeVerification, backgroundVerification=contract.backgroundVerification,
        escalationMatrix=contract.escalationMatrix, specialInstructions=contract.specialInstructions,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(sla)
    
    ren = models.ContractRenewalTermination(
        contractId=contract.id,
        autoRenewal=contract.autoRenewal, reminderDays=contract.reminderDays,
        renewalTerms=contract.renewalTerms, renewalStatus=contract.renewalStatus,
        terminationNotice=contract.terminationNotice, terminationClause=contract.terminationClause,
        created_at=contract.createdAt, updated_at=contract.updatedAt
    )
    db.add(ren)
    
    db.commit()
    db.refresh(db_item)
    return _merge_contract_data(db, db_item)
@contract_router.get("/drafts/all", response_model=list[schemas.ContractDraftResponse])
def get_drafts(current_user: models.User = Depends(require_permission("contract_management", "view")), db: Session = Depends(get_db)):
    drafts = db.query(models.ContractDraft).filter(models.ContractDraft.company_id == current_user.company_id).all()
    results = []
    for d in drafts:
        # Reconstruct formData by querying _merge_contract_data
        db_contract = db.query(models.Contract).filter(models.Contract.id == d.contract_id).first()
        if db_contract:
            merged = _merge_contract_data(db, db_contract)
            formData = json.dumps(merged)
        else:
            formData = "{}"
        
        results.append({
            "id": d.draft_id,
            "title": d.title,
            "formData": formData,
            "sectionStatus": d.sectionStatus or "{}",
            "activeSection": d.current_section or "",
            "completionPercentage": d.completionPercentage or 0.0,
            "attachments": d.attachments or "[]",
            "createdAt": d.created_at,
            "updatedAt": d.updated_at
        })
    return results

@contract_router.get("/drafts/{id}", response_model=schemas.ContractDraftResponse)
def get_draft(id: int, current_user: models.User = Depends(require_permission("contract_management", "view")), db: Session = Depends(get_db)):
    d = db.query(models.ContractDraft).filter(models.ContractDraft.draft_id == id, models.ContractDraft.company_id == current_user.company_id).first()
    if not d: raise HTTPException(status_code=404, detail="Draft not found")
    
    db_contract = db.query(models.Contract).filter(models.Contract.id == d.contract_id).first()
    if db_contract:
        merged = _merge_contract_data(db, db_contract)
        formData = json.dumps(merged)
    else:
        formData = "{}"
        
    return {
        "id": d.draft_id,
        "title": d.title,
        "formData": formData,
        "sectionStatus": d.sectionStatus or "{}",
        "activeSection": d.current_section or "",
        "completionPercentage": d.completionPercentage or 0.0,
        "attachments": d.attachments or "[]",
        "createdAt": d.created_at,
        "updatedAt": d.updated_at
    }

def _upsert_relational_draft(db, parsed_data, contract_id):
    """Upsert draft data into 14 relational tables.
    
    Critical: The frontend sends empty strings ('') for unfilled fields.
    MySQL rejects '' for Float/Integer/Boolean columns, so we must
    sanitize values before insertion by inspecting column types.
    """
    from sqlalchemy import inspect as sa_inspect, Float, Integer, Boolean
    
    tables_map = {
        models.Contract: ["contractNumber", "title", "type", "department", "description", "clientName", "contactPerson", "email", "phone", "startDate", "endDate", "durationMonths", "value", "currency", "paymentTerms", "billingFrequency", "securityDeposit", "taxInformation", "autoRenewal", "renewalDate", "reminderDays", "renewalTerms", "renewalStatus", "status", "createdAt", "updatedAt", "createdBy", "updatedBy"],
        models.ContractBuyerDetail: ["organisationType", "ministry", "organisationName", "buyerName", "buyerDesignation", "buyerContact", "buyerEmail", "buyerAddress", "buyerState", "buyerDivision"],
        models.ContractClientDetail: ["clientName", "clientGstin", "contactPerson", "clientDesignation", "email", "phone", "clientState", "clientPincode", "clientAddress"],
        models.ContractFinancial: ["monthlyBaseFare", "gstPercentage", "gstAmount", "securityDeposit", "ePbgPercentage", "paymentMode", "billingFrequency", "paymentTerms", "invoiceRaisedTo", "invoiceDueDate", "latePaymentPenalty", "adminApproval", "financialApproval", "ifdConcurrence"],
        models.ContractConsigneeDetail: ["consigneeName", "consigneeDesignation", "consigneeContact", "consigneeEmail", "consigneeAddress", "consigneeState", "consigneePincode"],
        models.ContractVehicleRequirement: ["vehicleType", "vehicleCategory", "carModels", "usageVariant", "numberOfVehicles", "fuelType", "acRequired", "reportingLocation", "dutyHours", "driverRequired", "gpsRequired", "brandingRequired", "vehicleAgeLimit", "replacementClause"],
        models.ContractSlaCompliance: ["slaDetails", "penaltyClause", "insuranceRequired", "driverDocsRequired", "policeVerification", "backgroundVerification", "escalationMatrix", "specialInstructions"],
        models.ContractRenewalTermination: ["autoRenewal", "reminderDays", "renewalTerms", "renewalStatus", "terminationNotice", "terminationClause"]
    }
    
    for ModelClass, fields in tables_map.items():
        # Build a column-type lookup for this model
        mapper = sa_inspect(ModelClass)
        col_types = {}
        for col in mapper.columns:
            col_types[col.key] = type(col.type)
        
        db_item = db.query(ModelClass).filter(getattr(ModelClass, "id" if ModelClass == models.Contract else "contractId") == contract_id).first()
        if not db_item:
            db_item = ModelClass(id=contract_id) if ModelClass == models.Contract else ModelClass()
            if ModelClass != models.Contract:
                db_item.contractId = contract_id
            db.add(db_item)
            
        for f in fields:
            if f in parsed_data:
                val = parsed_data[f]
                col_type = col_types.get(f)
                
                # Sanitize: empty string -> None for numeric/boolean columns
                if val == '' or val is None:
                    if col_type in (Float, Integer, Boolean):
                        val = None
                
                setattr(db_item, f, val)
                
    db.commit()

@contract_router.post("/drafts", response_model=schemas.ContractDraftResponse)
def create_draft(draft: schemas.ContractDraftCreate, current_user: models.User = Depends(require_permission("contract_management", "create")), db: Session = Depends(get_db)):
    try:
        parsed_data = json.loads(draft.formData)
        contract_id = draft.id # use draft.id as contract_id for simplicity
        
        db_item = db.query(models.ContractDraft).filter(models.ContractDraft.draft_id == draft.id).first()
        if not db_item:
            db_item = models.ContractDraft(
                draft_id=draft.id,
                contract_id=contract_id,
                current_section=draft.activeSection,
                draft_status="Draft",
                created_by="System",
                created_at=draft.createdAt,
                updated_at=draft.updatedAt,
                title=draft.title,
                sectionStatus=draft.sectionStatus,
                completionPercentage=draft.completionPercentage,
                attachments=draft.attachments,
                company_id=current_user.company_id
            )
            db.add(db_item)
        else:
            db_item.current_section = draft.activeSection
            db_item.updated_at = draft.updatedAt
            db_item.title = draft.title
            db_item.sectionStatus = draft.sectionStatus
            db_item.completionPercentage = draft.completionPercentage
            db_item.attachments = draft.attachments
            
        db.commit()
        return get_draft(draft.id, current_user, db)
    except Exception as e:
        import traceback
        with open("debug_draft.txt", "w") as f:
            f.write(traceback.format_exc())
        raise e

@contract_router.put("/drafts/{id}", response_model=schemas.ContractDraftResponse)
def update_draft(id: int, draft: schemas.ContractDraftUpdate, current_user: models.User = Depends(require_permission("contract_management", "update")), db: Session = Depends(get_db)):
    # Handled identically to POST because it's a full upsert
    parsed_data = json.loads(draft.formData)
    parsed_data['status'] = 'Draft'  # Drafts must always remain Draft status
    
    db_item = db.query(models.ContractDraft).filter(models.ContractDraft.draft_id == id, models.ContractDraft.company_id == current_user.company_id).first()
    if db_item:
        db_item.current_section = draft.activeSection
        db_item.updated_at = draft.updatedAt
        if hasattr(draft, 'title') and draft.title: db_item.title = draft.title
        db_item.sectionStatus = draft.sectionStatus
        db_item.completionPercentage = draft.completionPercentage
        db_item.attachments = draft.attachments
        db.commit()
        
    return get_draft(id, db)

@contract_router.delete("/drafts/{id}")
def delete_draft(id: int, current_user: models.User = Depends(require_permission("contract_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.ContractDraft).filter(models.ContractDraft.draft_id == id, models.ContractDraft.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Draft not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Draft deleted"}
@contract_router.delete("/{id}")
def delete_contract(id: int, current_user: models.User = Depends(require_permission("contract_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id, models.Contract.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}

# --- VENDOR ROUTES ---
@vendor_router.get("/", response_model=list[schemas.VendorResponse])
def get_vendors(current_user: models.User = Depends(require_permission("vendor_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.Vendor).filter(models.Vendor.company_id == current_user.company_id).all()

@vendor_router.post("/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, current_user: models.User = Depends(require_permission("vendor_management", "create")), db: Session = Depends(get_db)):
    vendor_dict = vendor.model_dump()
    vendor_dict['company_id'] = current_user.company_id
    db_item = models.Vendor(**vendor_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@vendor_router.delete("/{id}")
def delete_vendor(id: int, current_user: models.User = Depends(require_permission("vendor_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vendor).filter(models.Vendor.id == id, models.Vendor.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}


# --- MISSING EXISTING ROUTES ---
from services.all_services import (
    fuel_log_service, maintenance_log_service, compliance_doc_service,
    app_notification_service, system_setting_service,
    contract_service_service, contract_document_service, contract_note_service,
    contract_payment_service, audit_log_service, contract_activity_log_service
)

@vehicle_router.get("/{id}", response_model=schemas.VehicleResponse)
def get_vehicle(id: int, current_user: models.User = Depends(require_permission("vehicle_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vehicle).filter(models.Vehicle.id == id, models.Vehicle.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@vehicle_router.put("/{id}", response_model=schemas.VehicleResponse)
def update_vehicle(id: int, payload: schemas.VehicleUpdate, current_user: models.User = Depends(require_permission("vehicle_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vehicle).filter(models.Vehicle.id == id, models.Vehicle.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@booking_router.get("/{id}", response_model=schemas.BookingResponse)
def get_booking(id: int, current_user: models.User = Depends(require_permission("booking_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Booking).filter(models.Booking.id == id, models.Booking.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@booking_router.put("/{id}", response_model=schemas.BookingResponse)
def update_booking(id: int, payload: schemas.BookingUpdate, current_user: models.User = Depends(require_permission("booking_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Booking).filter(models.Booking.id == id, models.Booking.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@trip_router.get("/{id}", response_model=schemas.TripResponse)
def get_trip(id: int, current_user: models.User = Depends(require_permission("trip_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Trip).filter(models.Trip.id == id, models.Trip.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@driver_router.put("/{id}", response_model=schemas.DriverResponse)
def update_driver(id: int, payload: schemas.DriverUpdate, current_user: models.User = Depends(require_permission("driver_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Driver).filter(models.Driver.id == id, models.Driver.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    
    if payload.licenseNumber and payload.licenseNumber.strip():
        existing = db.query(models.Driver).filter(
            models.Driver.licenseNumber == payload.licenseNumber, 
            models.Driver.id != id,
            models.Driver.is_draft == False,
            models.Driver.company_id == current_user.company_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="License number already exists")
            
    payload_dict = payload.model_dump(exclude_unset=True)
    
    # Process Self Car vehicle update
    if payload_dict.get('vehicleAssignmentType') == 'Self Car' or db_item.vehicleAssignmentType == 'Self Car':
        self_num = payload_dict.pop('selfVehicleNumber', None)
        self_type = payload_dict.pop('selfVehicleType', None)
        self_model = payload_dict.pop('selfVehicleModel', None)
        self_color = payload_dict.pop('selfVehicleColor', None)
        
        assigned_v_id = payload_dict.get('assignedVehicleId', db_item.assignedVehicleId)
        
        # If no vehicle assigned yet, create one
        if not assigned_v_id and (self_num or self_model):
            import uuid
            new_v_id = None  # let DB auto increment
            new_v = models.Vehicle(
                id=new_v_id,
                plateNumber=self_num,
                model=self_model,
                vehicleType=self_type,
                color=self_color,
                status="Assigned",
                assignedDriverId=id
            )
            db.add(new_v)
            payload_dict['assignedVehicleId'] = new_v_id
        elif assigned_v_id:
            # Update existing vehicle
            existing_v = db.query(models.Vehicle).filter(models.Vehicle.id == assigned_v_id, models.Vehicle.company_id == current_user.company_id).first()
            if existing_v:
                if self_num is not None: existing_v.plateNumber = self_num
                if self_model is not None: existing_v.model = self_model
                if self_type is not None: existing_v.vehicleType = self_type
                if self_color is not None: existing_v.color = self_color

    # Remove the self fields so they don't break Driver schema mapping
    payload_dict.pop('selfVehicleNumber', None)
    payload_dict.pop('selfVehicleType', None)
    payload_dict.pop('selfVehicleModel', None)
    payload_dict.pop('selfVehicleColor', None)
    payload_dict.pop('selfRcNumber', None)
    payload_dict.pop('selfInsuranceExpiry', None)
            
    for key, value in payload_dict.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@trip_router.put("/{id}", response_model=schemas.TripResponse)
def update_trip(id: int, payload: schemas.TripUpdate, current_user: models.User = Depends(require_permission("trip_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Trip).filter(models.Trip.id == id, models.Trip.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@contract_router.get("/{id}", response_model=schemas.ContractResponse)
def get_contract(id: int, current_user: models.User = Depends(require_permission("contract_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id, models.Contract.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    return _merge_contract_data(db, db_item)

@contract_router.put("/{id}", response_model=schemas.ContractResponse)
def update_contract(id: int, payload: schemas.ContractUpdate, current_user: models.User = Depends(require_permission("contract_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Contract).filter(models.Contract.id == id, models.Contract.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    
    # 9. Verify editing mode duplicate check (exclude self)
    raw_number = payload.contractNumber or ""
    if raw_number:
        normalized_number = raw_number.strip().upper()
        existing_contracts = db.query(models.Contract).filter(models.Contract.company_id == current_user.company_id).all()
        duplicate = next((c for c in existing_contracts if (c.contractNumber or "").strip().upper() == normalized_number and c.id != id), None)
        if duplicate:
            print(f"Existing Duplicate Found on Update: ID={duplicate.id}, ContractNumber={duplicate.contractNumber}")
            raise HTTPException(status_code=409, detail="Duplicate Contract Number")
    
    # Use the same upsert logic as drafts to update all 14 tables
    parsed_data = payload.model_dump(exclude_unset=True)
    _upsert_relational_draft(db, parsed_data, id)
    
    db_item = db.query(models.Contract).filter(models.Contract.id == id, models.Contract.company_id == current_user.company_id).first()
    return _merge_contract_data(db, db_item)

@vendor_router.get("/{id}", response_model=schemas.VendorResponse)
def get_vendor(id: int, current_user: models.User = Depends(require_permission("vendor_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vendor).filter(models.Vendor.id == id, models.Vendor.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    return db_item

@vendor_router.put("/{id}", response_model=schemas.VendorResponse)
def update_vendor(id: int, payload: schemas.VendorUpdate, current_user: models.User = Depends(require_permission("vendor_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.Vendor).filter(models.Vendor.id == id, models.Vendor.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- NEW MODULES ---
fuel_log_router = APIRouter(prefix="/api/fuel-logs", tags=["Fuel Logs"])
maintenance_log_router = APIRouter(prefix="/api/maintenance-logs", tags=["Maintenance Logs"])
compliance_doc_router = APIRouter(prefix="/api/compliance-docs", tags=["Compliance Docs"])
app_notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
system_setting_router = APIRouter(prefix="/api/settings", tags=["Settings"])
contract_service_router = APIRouter(prefix="/api/contract-services", tags=["Contract Services"])
contract_document_router = APIRouter(prefix="/api/contract-documents", tags=["Contract Documents"])
contract_note_router = APIRouter(prefix="/api/contract-notes", tags=["Contract Notes"])
contract_payment_router = APIRouter(prefix="/api/contract-payments", tags=["Contract Payments"])
audit_log_router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])
contract_activity_log_router = APIRouter(prefix="/api/contract-activity", tags=["Contract Activity Logs"])

NEW_ROUTERS = [
    (fuel_log_router, fuel_log_service, schemas.FuelLogCreate, schemas.FuelLogUpdate, schemas.FuelLogResponse, "fuel_management"),
    (maintenance_log_router, maintenance_log_service, schemas.MaintenanceLogCreate, schemas.MaintenanceLogUpdate, schemas.MaintenanceLogResponse, "maintenance_management"),
    (compliance_doc_router, compliance_doc_service, schemas.ComplianceDocCreate, schemas.ComplianceDocUpdate, schemas.ComplianceDocResponse, "compliance_management"),
    (app_notification_router, app_notification_service, schemas.AppNotificationCreate, schemas.AppNotificationUpdate, schemas.AppNotificationResponse, "notifications"),
    (system_setting_router, system_setting_service, schemas.SystemSettingCreate, schemas.SystemSettingUpdate, schemas.SystemSettingResponse, "company_settings"),
    (contract_service_router, contract_service_service, schemas.ContractServiceCreate, schemas.ContractServiceUpdate, schemas.ContractServiceResponse, "contract_management"),
    (contract_document_router, contract_document_service, schemas.ContractDocumentCreate, schemas.ContractDocumentUpdate, schemas.ContractDocumentResponse, "contract_management"),
    (contract_note_router, contract_note_service, schemas.ContractNoteCreate, schemas.ContractNoteUpdate, schemas.ContractNoteResponse, "contract_management"),
    (contract_payment_router, contract_payment_service, schemas.ContractPaymentCreate, schemas.ContractPaymentUpdate, schemas.ContractPaymentResponse, "contract_management")
]

def make_crud_routes(router, service, create_schema, update_schema, response_schema, module_name: str):
    @router.get("/", response_model=list[response_schema])
    def get_all(current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
        return service.get_multi(db, skip=skip, limit=limit, company_id=current_user.company_id)

    @router.get("/{id}", response_model=response_schema)
    def get_one(id: int, current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db)):
        return service.get(db, id, company_id=current_user.company_id)

    @router.post("/", response_model=response_schema)
    def create_one(payload: create_schema, current_user: models.User = Depends(require_permission(module_name, "create")), db: Session = Depends(get_db)):
        return service.create(db, payload, company_id=current_user.company_id)

    @router.put("/{id}", response_model=response_schema)
    def update_one(id: int, payload: update_schema, current_user: models.User = Depends(require_permission(module_name, "update")), db: Session = Depends(get_db)):
        return service.update(db, id, payload, company_id=current_user.company_id)

    @router.delete("/{id}")
    def delete_one(id: int, current_user: models.User = Depends(require_permission(module_name, "delete")), db: Session = Depends(get_db)):
        service.delete(db, id, company_id=current_user.company_id)
        return {"message": "Deleted"}

for r, s, c_s, u_s, r_s, mod_name in NEW_ROUTERS:
    make_crud_routes(r, s, c_s, u_s, r_s, mod_name)

# Read Only Modules
READ_ONLY_ROUTERS = [
    (audit_log_router, audit_log_service, schemas.AuditLogCreate, schemas.AuditLogResponse, "audit_logs"),
    (contract_activity_log_router, contract_activity_log_service, schemas.ContractActivityLogCreate, schemas.ContractActivityLogResponse, "contract_management")
]

def make_read_routes(router, service, create_schema, response_schema, module_name: str):
    @router.get("/", response_model=list[response_schema])
    def get_all(current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
        return service.get_multi(db, skip=skip, limit=limit, company_id=current_user.company_id)

    @router.get("/{id}", response_model=response_schema)
    def get_one(id: int, current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db)):
        return service.get(db, id, company_id=current_user.company_id)

    @router.post("/", response_model=response_schema)
    def create_one(payload: create_schema, current_user: models.User = Depends(require_permission(module_name, "create")), db: Session = Depends(get_db)):
        return service.create(db, payload, company_id=current_user.company_id)

for r, s, c_s, r_s, mod_name in READ_ONLY_ROUTERS:
    make_read_routes(r, s, c_s, r_s, mod_name)

def generate_crud_routes(router, model, create_schema, update_schema, response_schema, module_name: str):
    @router.get("/", response_model=list[response_schema])
    def get_all(current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db)):
        return db.query(model).filter(model.company_id == current_user.company_id).all()

    @router.get("/{id}", response_model=response_schema)
    def get_by_id(id: int, current_user: models.User = Depends(require_permission(module_name, "view")), db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id, model.company_id == current_user.company_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        return db_item

    @router.post("/", response_model=response_schema)
    def create_item(item: create_schema, current_user: models.User = Depends(require_permission(module_name, "create")), db: Session = Depends(get_db)):
        item_dict = item.model_dump()
        item_dict['company_id'] = current_user.company_id
        db_item = model(**item_dict)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.put("/{id}", response_model=response_schema)
    def update_item(id: int, payload: update_schema, current_user: models.User = Depends(require_permission(module_name, "update")), db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id, model.company_id == current_user.company_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    @router.delete("/{id}")
    def delete_item(id: int, current_user: models.User = Depends(require_permission(module_name, "delete")), db: Session = Depends(get_db)):
        db_item = db.query(model).filter(model.id == id, model.company_id == current_user.company_id).first()
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

generate_crud_routes(contract_buyer_router, models.ContractBuyerDetail, schemas.ContractBuyerDetailCreate, schemas.ContractBuyerDetailUpdate, schemas.ContractBuyerDetailResponse, "contract_management")
generate_crud_routes(contract_client_router, models.ContractClientDetail, schemas.ContractClientDetailCreate, schemas.ContractClientDetailUpdate, schemas.ContractClientDetailResponse, "contract_management")
generate_crud_routes(contract_financial_router, models.ContractFinancial, schemas.ContractFinancialCreate, schemas.ContractFinancialUpdate, schemas.ContractFinancialResponse, "contract_management")
generate_crud_routes(contract_consignee_router, models.ContractConsigneeDetail, schemas.ContractConsigneeDetailCreate, schemas.ContractConsigneeDetailUpdate, schemas.ContractConsigneeDetailResponse, "contract_management")
generate_crud_routes(contract_vehicle_req_router, models.ContractVehicleRequirement, schemas.ContractVehicleRequirementCreate, schemas.ContractVehicleRequirementUpdate, schemas.ContractVehicleRequirementResponse, "contract_management")
generate_crud_routes(contract_sla_router, models.ContractSlaCompliance, schemas.ContractSlaComplianceCreate, schemas.ContractSlaComplianceUpdate, schemas.ContractSlaComplianceResponse, "contract_management")
# --- DRIVER DRAFTS ROUTES ---
@driver_draft_router.get("/", response_model=list[schemas.DriverDraftResponse])
def get_driver_drafts(current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    return db.query(models.DriverDraft).filter(models.DriverDraft.company_id == current_user.company_id).all()

@driver_draft_router.get("/{id}", response_model=schemas.DriverDraftResponse)
def get_driver_draft(id: int, current_user: models.User = Depends(require_permission("driver_management", "view")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDraft).filter(models.DriverDraft.draft_id == id, models.DriverDraft.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Draft not found")
    return db_item

@driver_draft_router.post("/", response_model=schemas.DriverDraftResponse)
def create_driver_draft(draft: schemas.DriverDraftCreate, current_user: models.User = Depends(require_permission("driver_management", "create")), db: Session = Depends(get_db)):
    draft_dict = draft.model_dump()
    if not draft_dict.get('license_number') or draft_dict['license_number'].strip() == "":
        draft_dict['license_number'] = f"DRAFT_{draft.draft_id}"
    draft_dict['company_id'] = current_user.company_id
    db_item = models.DriverDraft(**draft_dict)
    db.add(db_item)
    try:
        db.commit()
        db.refresh(db_item)
    except Exception as e:
        db.rollback()
        existing = db.query(models.DriverDraft).filter(models.DriverDraft.draft_id == draft.draft_id, models.DriverDraft.company_id == current_user.company_id).first()
        if existing:
            for key, value in draft_dict.items():
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        raise e
    return db_item

@driver_draft_router.put("/{id}", response_model=schemas.DriverDraftResponse)
def update_driver_draft(id: int, draft: schemas.DriverDraftUpdate, current_user: models.User = Depends(require_permission("driver_management", "update")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDraft).filter(models.DriverDraft.draft_id == id, models.DriverDraft.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Draft not found")
    
    update_data = draft.model_dump(exclude_unset=True)
    if 'license_number' in update_data and (not update_data['license_number'] or update_data['license_number'].strip() == ""):
        update_data['license_number'] = f"DRAFT_{id}"
        
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@driver_draft_router.delete("/{id}")
def delete_driver_draft(id: int, current_user: models.User = Depends(require_permission("driver_management", "delete")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDraft).filter(models.DriverDraft.draft_id == id, models.DriverDraft.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Draft not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Draft Deleted"}

@driver_draft_router.post("/{id}/convert", response_model=schemas.DriverResponse)
def convert_driver_draft(id: int, current_user: models.User = Depends(require_permission("driver_management", "create")), db: Session = Depends(get_db)):
    db_item = db.query(models.DriverDraft).filter(models.DriverDraft.draft_id == id, models.DriverDraft.company_id == current_user.company_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Draft not found")
    
    import uuid
    driver_id = None  # let DB auto increment
    
    validate_vendor_for_driver(db, current_user.company_id, db_item.vendor_id, db_item.vehicle_assignment_type)
    
    # Map draft fields to Driver model
    driver_dict = {
        "id": driver_id,
        "firstName": db_item.first_name,
        "lastName": db_item.last_name,
        "fatherName": db_item.father_name,
        "name": f"{db_item.first_name or ''} {db_item.last_name or ''}".strip(),
        "licenseNumber": db_item.license_number if db_item.license_number and not db_item.license_number.startswith("DRAFT_") else f"LIC_{driver_id[:8]}",
        "birthDate": db_item.birth_date,
        "phone": db_item.mobile_number,
        "gender": db_item.gender,
        "address": db_item.address,
        "state": db_item.state,
        "city": db_item.city,
        "pinCode": db_item.pin_code,
        "yearsOfExperience": db_item.years_of_experience,
        "licenseIssueDate": db_item.issue_date,
        "licenseExpiry": db_item.expiry_date,
        "vendorId": db_item.vendor_id,
        "vehicleAssignmentType": db_item.vehicle_assignment_type,
        "is_draft": False,
        "current_step": 5,
        "completed_at": datetime.now().isoformat(),
        # Fix Data Loss: Map Document Files
        "dlFile": db_item.dlFile,
        "aadhaarNumber": db_item.aadhaarNumber,
        "aadhaarFile": db_item.aadhaarFile,
        "panNumber": db_item.panNumber,
        "panFile": db_item.panFile,
        "policeVerificationNumber": db_item.policeVerificationNumber,
        "policeVerificationExpiry": db_item.policeVerificationExpiry,
        "policeVerificationFile": db_item.policeVerificationFile,
        "medicalCertificateExpiry": db_item.medicalCertificateExpiry,
        "medicalCertificateFile": db_item.medicalCertificateFile,
        "driverPhotoFile": db_item.driverPhotoFile
    }

    # Process Self Car Vehicle creation
    assigned_vehicle_id = db_item.assigned_vehicle_id
    if db_item.vehicle_assignment_type == 'Self Car':
        new_vehicle_id = str(uuid.uuid4())
        new_vehicle = models.Vehicle(
            id=new_vehicle_id,
            plateNumber=db_item.self_vehicle_number,
            model=db_item.self_vehicle_model,
            vehicleType=db_item.self_vehicle_type,
            color=db_item.self_vehicle_color,
            status="Assigned",
            assignedDriverId=driver_id,
            company_id=current_user.company_id
        )
        db.add(new_vehicle)
        assigned_vehicle_id = new_vehicle_id
        
    driver_dict["assignedVehicleId"] = assigned_vehicle_id


    
    driver_dict['complianceStatus'] = compute_driver_status(driver_dict)
    driver_dict['company_id'] = current_user.company_id
    
    new_driver = models.Driver(**driver_dict)
    db.add(new_driver)
    
    # Delete the draft
    db.delete(db_item)
        
    db.commit()
    db.refresh(new_driver)
    return new_driver

# Export them for main.py (if needed, or main.py might need updating)

# --- USERS ROUTES ---
from utils.security import get_password_hash
import string
import random

@user_router.get("/", response_model=List[schemas.UserResponse])
def get_users(current_user: models.User = Depends(require_permission("user_roles", "view")), db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.company_id == current_user.company_id).all()

@user_router.get("/{id}", response_model=schemas.UserResponse)
def get_user(id: int, current_user: models.User = Depends(require_permission("user_roles", "view")), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id, models.User.company_id == current_user.company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, current_user: models.User = Depends(require_permission("user_roles", "create")), db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        name=user.name,
        email=user.email,
        role=user.role,
        avatar=user.avatar,
        companyName=user.companyName,
        department=user.department,
        status="Active",
        hashed_password=hashed_password,
        created_at=datetime.now().isoformat(),
        company_id=current_user.company_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@user_router.put("/{id}", response_model=schemas.UserResponse)
def update_user(id: int, user: schemas.UserUpdate, current_user: models.User = Depends(require_permission("user_roles", "update")), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id, models.User.company_id == current_user.company_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.name is not None:
        db_user.name = user.name
    if user.email is not None:
        db_user.email = user.email
    if user.role is not None:
        db_user.role = user.role
    if user.companyName is not None:
        db_user.companyName = user.companyName
    if user.department is not None:
        db_user.department = user.department
        
    db.commit()
    db.refresh(db_user)
    return db_user

@user_router.patch("/{id}/status")
def update_user_status(id: int, status: str, current_user: models.User = Depends(require_permission("user_roles", "update")), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id, models.User.company_id == current_user.company_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.status = status
    db.commit()
    return {"message": f"User status updated to {status}"}

@user_router.delete("/{id}")
def delete_user(id: int, current_user: models.User = Depends(require_permission("user_roles", "delete")), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id, models.User.company_id == current_user.company_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

@user_router.post("/{id}/reset-password")
def reset_user_password(id: int, request: Request, current_user: models.User = Depends(require_permission("user_roles", "update")), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id, models.User.company_id == current_user.company_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Generate random 8-char password
    characters = string.ascii_letters + string.digits
    new_password = ''.join(random.choice(characters) for i in range(8))
    
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    company_name = "Unknown"
    company = db.query(models.Company).filter(models.Company.id == db_user.company_id).first()
    if company: company_name = company.name
    
    log_auth_event(db, request, db_user.email, db_user.role, "Password Reset", "Success", db_user.name, company_name, db_user.company_id)
    
    return {"message": "Password reset successfully", "new_password": new_password}


company_announcement_router = APIRouter(prefix='/api/company', tags=['Company Announcements & Notifications'])

from models.all_models import Announcement, AnnouncementRecipient
from datetime import datetime

@company_announcement_router.get('/notifications', response_model=list[schemas.NotificationResponse])
def get_company_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(require_permission("notifications", "view"))):
    recipients = db.query(AnnouncementRecipient).filter(
        AnnouncementRecipient.user_id == current_user.id
    ).order_by(AnnouncementRecipient.id.desc()).all()
    
    results = []
    for r in recipients:
        ann = db.query(Announcement).filter(Announcement.id == r.announcement_id).first()
        if ann:
            results.append({
                'id': r.id,
                'is_read': r.is_read,
                'read_at': r.read_at,
                'created_at': r.created_at,
                'announcement': ann
            })
    return results

@company_announcement_router.patch('/notifications/{id}/read')
def mark_notification_read(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission("notifications", "update"))):
    rec = db.query(AnnouncementRecipient).filter(
        AnnouncementRecipient.id == id,
        AnnouncementRecipient.user_id == current_user.id
    ).first()
    
    if not rec:
        return JSONResponse(status_code=404, content={'detail': 'Notification not found'})
        
    rec.is_read = True
    rec.read_at = datetime.now().isoformat()
    db.commit()
    return {'success': True}

@company_announcement_router.get('/announcements', response_model=list[schemas.AnnouncementResponse])
def get_company_announcements(db: Session = Depends(get_db), current_user: models.User = Depends(require_permission("notifications", "view"))):
    recipients = db.query(AnnouncementRecipient).filter(
        AnnouncementRecipient.user_id == current_user.id
    ).all()
    
    ann_ids = [r.announcement_id for r in recipients]
    anns = db.query(Announcement).filter(Announcement.id.in_(ann_ids)).order_by(Announcement.id.desc()).all()
    return anns

@dashboard_router.get("/stats")
def get_dashboard_stats(current_user: models.User = Depends(require_permission("dashboard", "view")), db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.company_id == current_user.company_id).count()
    drivers = db.query(models.Driver).filter(models.Driver.company_id == current_user.company_id).count()
    trips = db.query(models.Trip).filter(models.Trip.company_id == current_user.company_id).count()
    completed_trips = db.query(models.Trip).filter(models.Trip.status == 'Completed', models.Trip.company_id == current_user.company_id).count()
    
    # Calculate revenue vs expenses dynamically
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month_index = datetime.now().month - 1
    
    financialChartData = []
    # For demonstration, generate 6 months of data
    for i in range(max(0, current_month_index - 5), current_month_index + 1):
        month_name = months[i]
        financialChartData.append({
            "name": month_name,
            "revenue": vehicles * 1200 + (completed_trips * 10),
            "expenses": vehicles * 400
        })

    fuelTypeDistribution = [
        {"name": "Diesel", "value": db.query(models.Vehicle).filter(models.Vehicle.fuelType == 'Diesel', models.Vehicle.company_id == current_user.company_id).count()},
        {"name": "Petrol", "value": db.query(models.Vehicle).filter(models.Vehicle.fuelType == 'Petrol', models.Vehicle.company_id == current_user.company_id).count()},
        {"name": "EV", "value": db.query(models.Vehicle).filter(models.Vehicle.fuelType == 'EV', models.Vehicle.company_id == current_user.company_id).count()},
        {"name": "CNG", "value": db.query(models.Vehicle).filter(models.Vehicle.fuelType == 'CNG', models.Vehicle.company_id == current_user.company_id).count()}
    ]

    recentActivities = []
    audit_logs = db.query(models.AuditLog).filter(models.AuditLog.company_id == current_user.company_id).order_by(models.AuditLog.id.desc()).limit(5).all()
    for log in audit_logs:
        recentActivities.append({
            "id": log.id,
            "action": log.action,
            "module": log.module,
            "timestamp": log.timestamp,
            "user": log.userEmail
        })

    return {
        "kpis": {
            "totalVehicles": vehicles,
            "totalDrivers": drivers,
            "totalTrips": trips,
            "monthlyUsageKm": completed_trips * 24.5
        },
        "financialChartData": financialChartData,
        "fuelTypeDistribution": fuelTypeDistribution,
        "recentActivities": recentActivities
    }

# --- SUPPORT TICKETS (COMPANY) ---
@support_router.post("/tickets", response_model=schemas.SupportTicketResponse)
def create_ticket(ticket: schemas.SupportTicketCreate, current_user: models.User = Depends(require_permission("support_tickets", "create")), db: Session = Depends(get_db)):
    ticket_count = db.query(models.SupportTicket).count() + 1
    new_ticket = models.SupportTicket(
        ticket_id=f"TKT-{datetime.now().year}-{str(ticket_count).zfill(6)}",
        company_id=current_user.company_id,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status="Open",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        created_by_id=current_user.id,
        created_by_name=f"{current_user.firstName} {current_user.lastName}",
        created_by_role=current_user.role
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Add initial message
    if ticket.message:
        new_msg = models.TicketMessage(
            ticket_id=new_ticket.id,
            sender_id=current_user.id,
            sender_name=f"{current_user.firstName} {current_user.lastName}",
            sender_role=current_user.role,
            message=ticket.message,
            created_at=datetime.now().isoformat()
        )
        db.add(new_msg)
        db.commit()
    
    # Notify Super Admin
    admin_notif = models.AppNotification(
        company_id=current_user.company_id,
        title="New Support Ticket",
        message=f"Company {current_user.company_id} opened {new_ticket.ticket_id}: {new_ticket.subject}",
        category="Support",
        severity="Medium",
        timestamp=datetime.now().isoformat(),
        targetRole="Super Admin"
    )
    db.add(admin_notif)
    
    audit_log = models.AuditLog(
        company_id=current_user.company_id,
        timestamp=datetime.now().isoformat(),
        userId=str(current_user.id),
        userEmail=current_user.email,
        userRole=current_user.role,
        action="Created Support Ticket",
        module="Support",
        details=f"Created {new_ticket.ticket_id}",
        ipAddress="127.0.0.1"
    )
    db.add(audit_log)
    db.commit()
    db.refresh(new_ticket)
    
    messages = db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id == new_ticket.id).all()
    setattr(new_ticket, "messages", messages)
    
    return new_ticket

@support_router.get("/tickets", response_model=list[schemas.SupportTicketResponse])
def get_company_tickets(current_user: models.User = Depends(require_permission("support_tickets", "view")), db: Session = Depends(get_db)):
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.company_id == current_user.company_id).order_by(models.SupportTicket.id.desc()).all()
    for t in tickets:
        setattr(t, "messages", [])
    return tickets

@support_router.get("/tickets/{id}", response_model=schemas.SupportTicketResponse)
def get_ticket(id: int, current_user: models.User = Depends(require_permission("support_tickets", "view")), db: Session = Depends(get_db)):
    ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == id, models.SupportTicket.company_id == current_user.company_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    messages = db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id == ticket.id).order_by(models.TicketMessage.id.asc()).all()
    for msg in messages:
        attachments = db.query(models.TicketAttachment).filter(models.TicketAttachment.message_id == msg.id).all()
        setattr(msg, "attachments", attachments)
    setattr(ticket, "messages", messages)
    
    return ticket

@support_router.post("/tickets/{id}/reply", response_model=schemas.TicketMessageResponse)
def reply_ticket(id: int, reply: schemas.TicketMessageCreate, current_user: models.User = Depends(require_permission("support_tickets", "create")), db: Session = Depends(get_db)):
    ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == id, models.SupportTicket.company_id == current_user.company_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    msg = models.TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_name=f"{current_user.firstName} {current_user.lastName}",
        sender_role=current_user.role,
        message=reply.message,
        created_at=datetime.now().isoformat()
    )
    db.add(msg)
    
    ticket.updated_at = datetime.now().isoformat()
    ticket.status = "Waiting for Support"
    
    admin_notif = models.AppNotification(
        company_id=current_user.company_id,
        title="New Ticket Reply",
        message=f"New reply from customer on {ticket.ticket_id}",
        category="Support",
        severity="Low",
        timestamp=datetime.now().isoformat(),
        targetRole="Super Admin"
    )
    db.add(admin_notif)
    
    db.commit()
    db.refresh(msg)
    setattr(msg, "attachments", [])
    return msg

