from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
import logging
import traceback
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import random
import pandas as pd
import io
from jose import jwt, JWTError
from config.settings import settings

from database.db import get_db
from models import all_models as models
from models.all_models import SuperAdmin, Company, Subscription, User, Task, Tender, Announcement, Role, Permission, AuditLog, AnnouncementRecipient
from validations import all_schemas as schemas
import secrets
from utils.security import create_access_token, verify_password, get_password_hash
from pydantic import BaseModel

super_admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/super-admin/login")

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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
    admin = db.query(SuperAdmin).filter(SuperAdmin.email == email).first()
    if not admin:
        raise credentials_exception
    return admin


class LoginRequest(BaseModel):
    email: str
    password: str

import re
from pydantic import BaseModel, model_validator

class CompanyCreate(BaseModel):
    name: str
    company_type: str
    industry: str = None
    gst_number: str = None
    pan_number: str = None
    registration_number: str = None
    pincode: str = None
    head_name: str = None
    head_email: str = None
    head_phone: str = None
    plan: str = "Basic"
    billing_cycle: str = "Monthly"

    @model_validator(mode='after')
    def validate_fields(self):
        if self.gst_number and not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", self.gst_number):
            raise ValueError('Invalid GST format (e.g., 22AAAAA0000A1Z5)')
        if self.pan_number and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", self.pan_number):
            raise ValueError('Invalid PAN format (e.g., ABCDE1234F)')
        if self.head_phone:
            if len(self.head_phone) != 10 or not re.match(r"^[6-9][0-9]{9}$", self.head_phone):
                raise ValueError('Invalid mobile number. Must be 10 digits and start with 6-9')
        if self.pincode and not re.match(r"^[0-9]{6}$", self.pincode):
            raise ValueError('Pincode must be exactly 6 digits')
        if self.head_email and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", self.head_email):
            raise ValueError('Invalid email format')
        return self

import json
from datetime import datetime

def log_auth_event(db: Session, request: Request, email: str, role: str, action: str, status: str, user_name: str = "Unknown", company_name: str = "CMS Enterprise"):
    client_ip = request.client.host if request.client else "Unknown IP"
    user_agent = request.headers.get("user-agent", "Unknown Device")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    details_json = json.dumps({
        "user_name": user_name,
        "company_name": company_name,
        "device": user_agent
    })

    audit = AuditLog(
        timestamp=timestamp,
        userId=email, # Using email as ID or we can just leave it as email
        userEmail=email,
        userRole=role,
        action=action,
        module="Authentication",
        details=details_json,
        ipAddress=client_ip,
        status=status,
        company_id=None
    )
    db.add(audit)
    db.commit()

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_type: Optional[str] = None
    industry: Optional[str] = None
    gst_number: Optional[str] = None
    registration_number: Optional[str] = None
    head_name: Optional[str] = None
    head_email: Optional[str] = None
    head_phone: Optional[str] = None

class PasswordReset(BaseModel):
    password: str

class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[str] = None

@super_admin_router.post("/login")
def login(request_body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(SuperAdmin).filter(SuperAdmin.email == request_body.email).first()
    if not admin:
        log_auth_event(db, request, request_body.email, "super_admin", "Failed Login", "Failed", "Unknown", "CMS Enterprise")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if admin.hashed_password != request_body.password and not verify_password(request_body.password, admin.hashed_password):
        log_auth_event(db, request, admin.email, "super_admin", "Failed Login", "Failed", admin.name, "CMS Enterprise")
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"sub": admin.email, "role": "super_admin"})
    log_auth_event(db, request, admin.email, "super_admin", "User Login", "Success", admin.name, "CMS Enterprise")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": "super_admin"
        }
    }

@super_admin_router.post("/companies")
def create_company(company: CompanyCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db), request: Request = None):
    if company.head_email:
        existing_user = db.query(User).filter(User.email == company.head_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Company Head email is already registered")

    last_company = db.query(Company).order_by(Company.id.desc()).first()
    new_code_num = 1001 if not last_company else (last_company.id + 1000)
    new_code = f"CMP-{new_code_num}"

    new_company = Company(
        name=company.name,
        code=new_code,
        company_type=company.company_type,
        industry=company.industry,
        gst_number=company.gst_number,
        pan_number=company.pan_number,
        registration_number=company.registration_number,
        pincode=company.pincode,
        head_name=company.head_name,
        head_email=company.head_email,
        head_phone=company.head_phone,
        status="Active",
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_company)
    db.flush()
    
    new_sub = Subscription(
        company_id=new_company.id,
        plan_name=company.plan,
        start_date=datetime.now().strftime("%Y-%m-%d"),
        end_date="2027-12-31",
        status="Active"
    )
    db.add(new_sub)
    
    generated_password = None
    if company.head_email:
        generated_password = secrets.token_urlsafe(6)
        new_user = User(
            company_id=new_company.id,
            name=company.head_name or "Company Head",
            email=company.head_email,
            role="COMPANY_HEAD",
            companyName=company.name,
            hashed_password=get_password_hash(generated_password),
            status="Active",
            created_at=datetime.now().strftime("%Y-%m-%d")
        )
        db.add(new_user)
        log_auth_event(db, request, new_user.email, new_user.role, "Account Created", "Success", new_user.name, new_company.name)
    
    # Seed Roles and Permissions
    head_role = Role(company_id=new_company.id, name="COMPANY_HEAD", description="Company Administrator")
    hr_role = Role(company_id=new_company.id, name="COMPANY_HR", description="Company HR")
    db.add(head_role)
    db.add(hr_role)
    db.flush()

    modules = [
        "dashboard", "driver_management", "vehicle_management", "trip_management", 
        "vendor_management", "booking_management", "live_tracking", "fuel_management", 
        "maintenance_management", "compliance_management", "contract_management", 
        "reports_analytics", "notifications", "support_tickets", "audit_logs", 
        "company_settings", "user_roles"
    ]
    actions = ["view", "create", "update", "delete", "export", "import", "approve"]

    permissions = []
    for role_obj in [head_role, hr_role]:
        for mod in modules:
            for act in actions:
                permissions.append(Permission(role_id=role_obj.id, module=mod, action=act))
    db.bulk_save_objects(permissions)

    db.commit()
    db.refresh(new_company)
    
    return {
        "company": new_company,
        "credentials": {
            "email": company.head_email,
            "password": generated_password
        }
    }

@super_admin_router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_admin: SuperAdmin = Depends(get_current_admin)):
    log_auth_event(db, request, current_admin.email, "super_admin", "User Logout", "Success", current_admin.name, "CMS Enterprise")
    return {"message": "Logged out successfully"}

@super_admin_router.get("/companies")
def get_companies(search: Optional[str] = None, status_filter: Optional[str] = None, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(Company)
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%") | Company.head_email.ilike(f"%{search}%") | Company.id.cast(str).ilike(f"%{search}%"))
    if status_filter and status_filter != "All":
        query = query.filter(Company.status.ilike(status_filter))
    
    companies = query.all()
    result = []
    for c in companies:
        sub = db.query(Subscription).filter(Subscription.company_id == c.id).first()
        result.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "logo": c.name[0].upper() if c.name else "C",
            "headName": c.head_name or "Unknown",
            "email": c.head_email or "No Email",
            "phone": c.head_phone or "No Phone",
            "plan": sub.plan_name if sub else "No Plan",
            "expiry": sub.end_date if sub else "-",
            "status": c.status,
            "created": c.created_at,
            "lastLogin": "-"
        })
    return result

@super_admin_router.post("/companies/import/preview")
async def import_preview(file: UploadFile = File(...), current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Invalid file format")
            
        rows = []
        for index, row in df.iterrows():
            row_data = row.to_dict()
            # Basic validation
            errors = []
            if pd.isna(row_data.get('Company Name')) or not str(row_data.get('Company Name')).strip():
                errors.append("Company Name is required")
            if pd.isna(row_data.get('Company Email')) or not str(row_data.get('Company Email')).strip():
                errors.append("Company Email is required")
            else:
                email = str(row_data.get('Company Email')).strip()
                if db.query(User).filter(User.email == email).first():
                    errors.append("Email already exists")
                    
            name = str(row_data.get('Company Name', '')).strip()
            if name and db.query(Company).filter(Company.name == name).first():
                errors.append("Company Name already exists")
                
            rows.append({
                "data": row_data,
                "isValid": len(errors) == 0,
                "errors": errors
            })
            
        return {"rows": rows}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@super_admin_router.post("/companies/import/confirm")
def import_confirm(payload: List[Dict[str, Any]], current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        count = 0
        for item in payload:
            row = item.get("data", {})
            last_company = db.query(Company).order_by(Company.id.desc()).first()
            new_code_num = 1001 if not last_company else (last_company.id + 1000)
            new_code = f"CMP-{new_code_num}"
            
            new_company = Company(
                name=str(row.get('Company Name', '')).strip(),
                code=new_code,
                company_type=str(row.get('Company Type', 'Private')).strip(),
                industry=str(row.get('Industry', '')).strip(),
                gst_number=str(row.get('GST Number', '')).strip(),
                registration_number=str(row.get('Registration Number', '')).strip(),
                head_name=str(row.get('Company Head Name', '')).strip(),
                head_email=str(row.get('Company Email', '')).strip(),
                head_phone=str(row.get('Phone Number', '')).strip(),
                status=str(row.get('Status', 'Active')).strip(),
                created_at=datetime.now().strftime("%Y-%m-%d")
            )
            db.add(new_company)
            db.flush() # To get company id
            
            new_sub = Subscription(
                company_id=new_company.id,
                plan_name=str(row.get('Subscription', 'Basic')).strip(),
                start_date=datetime.now().strftime("%Y-%m-%d"),
                end_date="2027-12-31",
                status="Active"
            )
            db.add(new_sub)
            
            if new_company.head_email:
                generated_password = secrets.token_urlsafe(6)
                new_user = User(
                    company_id=new_company.id,
                    name=new_company.head_name or "Company Head",
                    email=new_company.head_email,
                    role="COMPANY_HEAD",
                    companyName=new_company.name,
                    hashed_password=get_password_hash(generated_password),
                    status="Active",
                    created_at=datetime.now().strftime("%Y-%m-%d")
                )
                db.add(new_user)
            
            count += 1
            
        db.commit()
        return {"message": f"Successfully imported {count} companies"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@super_admin_router.get("/companies/export")
def export_companies(format: str = "csv", search: str = "", status_filter: str = "All", current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(Company)
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%") | Company.head_email.ilike(f"%{search}%"))
    if status_filter != "All":
        query = query.filter(Company.status == status_filter)
        
    companies = query.all()
    
    data = []
    for c in companies:
        sub = db.query(Subscription).filter(Subscription.company_id == c.id).first()
        data.append({
            "Company ID": c.id,
            "Company Name": c.name,
            "Company Head": c.head_name,
            "Email": c.head_email,
            "Phone": c.head_phone,
            "Subscription": sub.plan_name if sub else "No Plan",
            "Status": c.status,
            "Created Date": c.created_at,
            "Last Login": "-"
        })
        
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    
    if format == "xlsx":
        df.to_excel(stream, index=False, engine='openpyxl')
        stream.seek(0)
        return StreamingResponse(
            stream, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=companies.xlsx"}
        )
    else:
        df.to_csv(stream, index=False)
        stream.seek(0)
        return StreamingResponse(
            stream, 
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=companies.csv"}
        )

@super_admin_router.get("/companies/{id}")
def get_company_by_id(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    sub = db.query(Subscription).filter(Subscription.company_id == company.id).first()
    
    return {
        "company": company,
        "subscription": sub
    }

@super_admin_router.put("/companies/{id}")
def update_company(id: int, payload: CompanyUpdate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(company, key, value)
            
    # Also update the user if head info changed
    head_user = db.query(User).filter(User.company_id == id, User.role == "COMPANY_HEAD").first()
    if head_user:
        if payload.head_name: head_user.name = payload.head_name
        if payload.head_email: head_user.email = payload.head_email
        if payload.name: head_user.companyName = payload.name

    db.commit()
    db.refresh(company)
    return company

@super_admin_router.put("/companies/{id}/reset-password")
def reset_company_password(id: int, payload: PasswordReset, request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    logger = logging.getLogger("reset_password")
    logger.setLevel(logging.INFO)
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        with open("error_log.txt", "a") as f: f.write(f"403: No valid auth header\n")
        logger.error("exact reason why HTTP 403 is returned: No valid Authorization header.")
        return JSONResponse(status_code=403, content={"success": False, "message": "Unauthorized.", "errorCode": "UNAUTHORIZED"})
        
    token = auth_header.split(" ")[1]
    try:
        token_payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.ALGORITHM], 
            options={"verify_exp": False}
        )
        logger.info(f"decoded JWT payload: {token_payload}")
        
        email = token_payload.get("sub")
        role = token_payload.get("role")
        
        current_user = db.query(SuperAdmin).filter(SuperAdmin.email == email).first()
        if not current_user:
            logger.error(f"exact reason why HTTP 403 is returned: Super Admin {email} not found in database.")
            return JSONResponse(status_code=403, content={"success": False, "message": "Super Admin not found.", "errorCode": "FORBIDDEN"})
            
        logger.info(f"current_user.id: {current_user.id}")
        logger.info(f"current_user.role: {current_user.role}")
        
        if role != "super_admin" or current_user.role != "super_admin":
            logger.error(f"exact reason why HTTP 403 is returned: Role mismatch. Expected super_admin, got {role} / {current_user.role}.")
            with open("error_log.txt", "a") as f: f.write(f"403_DEBUG: Role mismatch. role={role}, db_role={current_user.role}\n")
            return JSONResponse(status_code=403, content={"success": False, "message": "Only Super Admin can perform this action.", "errorCode": "FORBIDDEN"})
            
    except jwt.ExpiredSignatureError as e:
        logger.error(f"exact reason why HTTP 403 is returned: Token Expired {str(e)}")
        with open("error_log.txt", "a") as f: f.write(f"403_DEBUG: Token expired: {str(e)}\n")
        return JSONResponse(status_code=403, content={"success": False, "message": "Token expired.", "errorCode": "TOKEN_EXPIRED"})
    except JWTError as e:
        logger.error(f"exact reason why HTTP 403 is returned: JWT Error: {str(e)}")
        with open("error_log.txt", "a") as f: f.write(f"403_DEBUG: JWT Error: {str(e)}\n")
        return JSONResponse(status_code=403, content={"success": False, "message": "Invalid token.", "errorCode": "INVALID_TOKEN"})

    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        return JSONResponse(status_code=404, content={"success": False, "message": "Company not found.", "errorCode": "COMPANY_NOT_FOUND"})

    try:
        # Match user by company_id OR email (for older records where company_id was None)
        head_user = db.query(User).filter(
            ((User.company_id == id) | (User.email == company.head_email)),
            User.role == "COMPANY_HEAD"
        ).first()
        
        if not head_user:
            return JSONResponse(status_code=404, content={"success": False, "message": "Company Admin not found.", "errorCode": "COMPANY_ADMIN_NOT_FOUND"})
            
        logger.info(f"Payload: {{'password': '***'}}, Company ID: {id}, User ID: {head_user.id}, SQL: UPDATE users SET hashed_password = ? WHERE id = ?")
        
        head_user.hashed_password = get_password_hash(payload.password)
        
        new_audit = AuditLog(
            action=f"Reset password for company head ({head_user.email})",
            module="Companies",
            company_id=id,
            userEmail=token_payload.get("sub", "System"),
            userRole="super_admin",
            timestamp=datetime.now().isoformat()
        )
        db.add(new_audit)
        db.commit()
        db.refresh(head_user)
        
        log_auth_event(db, request, head_user.email, "COMPANY_HEAD", "Password Reset", "Success", head_user.name, company.name)
        
        logger.info(f"Password update result: SUCCESS for User ID: {head_user.id}, API response: {{'success': True, 'message': 'Password reset successfully'}}")
        
        return JSONResponse(status_code=200, content={"success": True, "message": "Password reset successfully"})
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Exception: {error_msg}\nStack trace: {stack_trace}")
        with open("error_log.txt", "a") as f: f.write(f"500: Exception: {error_msg}\n{stack_trace}\n")
        return JSONResponse(status_code=500, content={"success": False, "message": "Password update failed.", "errorCode": "PASSWORD_UPDATE_FAILED"})

@super_admin_router.put("/companies/{id}/subscription")
def update_subscription(id: int, payload: SubscriptionUpdate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.company_id == id).first()
    if not sub:
        # Create one if missing for some reason
        sub = Subscription(company_id=id, plan_name="Basic", start_date=datetime.now().strftime("%Y-%m-%d"), end_date="2027-12-31", status="Active")
        db.add(sub)
        
    if payload.plan_name: sub.plan_name = payload.plan_name
    if payload.status: sub.status = payload.status
    if payload.end_date: sub.end_date = payload.end_date
    
    db.commit()
    db.refresh(sub)
    return sub

@super_admin_router.put("/companies/{id}/status")
def update_company_status(id: int, status_update: dict, request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    user_email = "System"
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
            user_email = payload.get("sub", "System")
        except JWTError:
            pass

    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    old_status = company.status
    new_status = status_update.get("status", old_status)
    
    company.status = new_status
    
    # Create Audit Log
    if old_status != new_status:
        audit = AuditLog(
            company_id=company.id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            userId="superadmin",
            userEmail=user_email,
            userRole="Super Admin",
            action="Company Status Changed",
            module="Companies",
            details=f"Changed status from {old_status} to {new_status}"
        )
        db.add(audit)
        
    db.commit()
    return {"message": "Status updated successfully", "status": company.status}

@super_admin_router.get("/audit-logs")
def get_audit_logs(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.module == "Authentication").order_by(AuditLog.id.desc()).all()
    results = []
    for log in logs:
        details = {}
        if log.details:
            try:
                details = json.loads(log.details)
            except:
                pass
        
        results.append({
            "id": log.id,
            "userName": details.get("user_name", log.userId),
            "email": log.userEmail,
            "role": log.userRole,
            "companyName": details.get("company_name", "Unknown"),
            "eventType": log.action,
            "ipAddress": log.ipAddress,
            "device": details.get("device", "Unknown"),
            "status": log.status,
            "timestamp": log.timestamp
        })
    return results

def format_inr(number):
    s = str(int(number))
    res = s[-3:]
    s = s[:-3]
    while s:
        res = s[-2:] + "," + res
        s = s[:-2]
    return res

@super_admin_router.get("/dashboard-stats")
def get_dashboard_stats(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    import datetime
    from collections import defaultdict
    
    today = datetime.datetime.today()
    current_month_str = today.strftime("%Y-%m")
    
    def get_trend(current, total):
        if total == 0: return "0%"
        perc = (current / total) * 100
        return f"+{int(perc)}%"

    companies = db.query(Company).all()
    total_companies = len(companies)
    active_companies = len([c for c in companies if c.status == "Active"])
    trial_companies = len([c for c in companies if c.status == "Trial"])
    suspended_companies = len([c for c in companies if c.status == "Suspended"])
    deactivated_companies = len([c for c in companies if c.status in ["Inactive", "Deactivated"]])
    
    new_companies_this_month = len([c for c in companies if c.created_at and c.created_at.startswith(current_month_str)])
    
    subs = db.query(Subscription).all()
    revenue = sum([299 if s.plan_name == "Premium" else 99 if s.plan_name == "Standard" else 0 for s in subs])
    
    monthly_rev = defaultdict(int)
    for s in subs:
        if s.start_date:
            try:
                dt = datetime.datetime.strptime(s.start_date, "%Y-%m-%d")
                month_name = dt.strftime("%b")
                amt = 299 if s.plan_name == "Premium" else 99 if s.plan_name == "Standard" else 0
                monthly_rev[month_name] += amt
            except ValueError:
                pass
    
    revenue_data = []
    for i in range(5, -1, -1):
        month_idx = (today.month - i - 1) % 12 + 1
        month_name = datetime.date(2000, month_idx, 1).strftime('%b')
        revenue_data.append({"name": month_name, "revenue": monthly_rev.get(month_name, 0)})
        
    this_month_rev = revenue_data[-1]["revenue"]
    last_month_rev = revenue_data[-2]["revenue"] if len(revenue_data) > 1 else 0
    if last_month_rev == 0:
        rev_trend = "+100%" if this_month_rev > 0 else "0%"
        rev_up = True
    else:
        diff = ((this_month_rev - last_month_rev) / last_month_rev) * 100
        rev_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        rev_up = diff >= 0

    pending_renewals = len([s for s in subs if s.status == "Expiring"])
    
    subscriptions_status = [
        {"name": "Active", "value": len([s for s in subs if s.status == "Active"])},
        {"name": "Expiring Soon", "value": pending_renewals},
        {"name": "Expired", "value": len([s for s in subs if s.status == "Expired"])}
    ]
    
    return {
        "kpis": [
            { "label": "Total Companies", "value": str(total_companies), "trend": get_trend(new_companies_this_month, total_companies), "isUp": True },
            { "label": "Active Companies", "value": str(active_companies), "trend": get_trend(active_companies, total_companies), "isUp": True },
            { "label": "Trial Companies", "value": str(trial_companies), "trend": get_trend(trial_companies, total_companies), "isUp": True },
            { "label": "Suspended", "value": str(suspended_companies), "trend": "0%", "isUp": False },
            { "label": "Monthly Revenue", "value": f"₹{format_inr(revenue)}", "trend": rev_trend, "isUp": rev_up },
            { "label": "Pending Renewals", "value": str(pending_renewals), "trend": "0%", "isUp": True },
            { "label": "Deactivated Companies", "value": str(deactivated_companies), "trend": "0%", "isUp": False }
        ],
        "subscriptions_status": subscriptions_status,
        "recent_companies": get_companies(db=db)[:5],
        "revenue_data": revenue_data
    }

# --- USERS ---
class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "User"
    companyName: str = None
    department: str = None

@super_admin_router.get("/users")
def get_users(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

@super_admin_router.post("/users")
def create_user(user: UserCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User email already exists")
    
    generated_password = secrets.token_urlsafe(6)
    new_user = User(
        **user.model_dump(),
        hashed_password=get_password_hash(generated_password),
        status="Active",
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"user": new_user, "password": generated_password}

@super_admin_router.put("/users/{id}")
def update_user(id: int, user_update: UserCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = user_update.name
    user.email = user_update.email
    user.role = user_update.role
    user.companyName = user_update.companyName
    user.department = user_update.department
    db.commit()
    db.refresh(user)
    return user

@super_admin_router.put("/users/{id}/status")
def update_user_status(id: int, status_update: dict, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = status_update.get("status", user.status)
    db.commit()
    return user

@super_admin_router.delete("/users/{id}")
def delete_user(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"message": "User deleted"}

# --- ROLES & PERMISSIONS ---
class RoleCreate(BaseModel):
    name: str
    description: str = None
    company_id: int = None

class PermissionUpdate(BaseModel):
    module: str
    action: str
    enabled: bool

@super_admin_router.get("/roles")
def get_roles(company_id: Optional[int] = None, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(Role)
    if company_id:
        query = query.filter(Role.company_id == company_id)
    return query.all()

@super_admin_router.post("/roles")
def create_role(role: RoleCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_role = Role(
        name=role.name,
        description=role.description,
        company_id=role.company_id
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@super_admin_router.put("/roles/{id}")
def update_role(id: int, role_update: RoleCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.name = role_update.name
    role.description = role_update.description
    db.commit()
    db.refresh(role)
    return role

@super_admin_router.delete("/roles/{id}")
def delete_role(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == id).first()
    if role:
        db.delete(role)
        db.commit()
    return {"message": "Role deleted"}

@super_admin_router.get("/roles/{id}/permissions")
def get_role_permissions(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    perms = db.query(Permission).filter(Permission.role_id == id).all()
    return perms

@super_admin_router.put("/roles/{id}/permissions")
def update_role_permissions(id: int, permissions: List[PermissionUpdate], current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Delete existing
    db.query(Permission).filter(Permission.role_id == id).delete()
    # Insert new ones that are enabled
    new_perms = []
    for p in permissions:
        if p.enabled:
            perm = Permission(
                role_id=id,
                module=p.module,
                action=p.action
            )
            new_perms.append(perm)
    
    db.bulk_save_objects(new_perms)
    db.commit()
    return {"message": "Permissions updated"}

# --- TASKS ---
class TaskCreate(BaseModel):
    title: str
    description: str = None
    status: str = "Pending"
    priority: str = "Medium"
    assigned_to: str = None
    due_date: str = None
    comments: str = None
    attachments: str = None

@super_admin_router.get("/tasks")
def get_tasks(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Task).all()

@super_admin_router.post("/tasks")
def create_task(task: TaskCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_task = Task(
        **task.model_dump(),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@super_admin_router.put("/tasks/{id}")
def update_task(id: int, task_update: TaskCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task_update.model_dump().items():
        setattr(task, key, value)
        
    task.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(task)
    return task

@super_admin_router.put("/tasks/{id}/status")
def update_task_status(id: int, status_update: dict, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status_update.get("status", task.status)
    db.commit()
    return task

@super_admin_router.delete("/tasks/{id}")
def delete_task(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"message": "Task deleted"}

# --- TENDERS ---
class TenderCreate(BaseModel):
    title: str
    category: str = None
    status: str = "Open"
    tender_number: str = None
    client_name: str = None
    department: str = None
    tender_value: float = None
    publish_date: str = None
    opening_date: str = None
    closing_date: str = None
    deadline: str = None
    assigned_manager: str = None
    remarks: str = None
    documents: str = None
    description: str = None

@super_admin_router.get("/tenders")
def get_tenders(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Tender).all()

@super_admin_router.post("/tenders")
def create_tender(tender: TenderCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_tender = Tender(
        **tender.model_dump(),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    return new_tender

@super_admin_router.put("/tenders/{id}")
def update_tender(id: int, tender_update: TenderCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    for key, value in tender_update.model_dump().items():
        setattr(tender, key, value)
        
    tender.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(tender)
    return tender

@super_admin_router.put("/tenders/{id}/status")
def update_tender_status(id: int, status_update: dict, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    tender.status = status_update.get("status", tender.status)
    db.commit()
    return tender

@super_admin_router.delete("/tenders/{id}")
def delete_tender(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == id).first()
    if tender:
        db.delete(tender)
        db.commit()
    return {"message": "Tender deleted"}

# --- ANNOUNCEMENTS ---

@super_admin_router.get("/announcements")
def get_announcements(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    anns = db.query(Announcement).order_by(Announcement.id.desc()).all()
    results = []
    for a in anns:
        total = db.query(AnnouncementRecipient).filter(AnnouncementRecipient.announcement_id == a.id).count()
        read = db.query(AnnouncementRecipient).filter(AnnouncementRecipient.announcement_id == a.id, AnnouncementRecipient.is_read == True).count()
        results.append({
            **{c.name: getattr(a, c.name) for c in a.__table__.columns},
            'stats': {'total': total, 'read': read, 'unread': total - read}
        })
    return results

@super_admin_router.post("/announcements")
def create_announcement(ann: schemas.AnnouncementCreate, request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    created_by_user = "System"
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            token_payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
            created_by_user = token_payload.get("sub", "System")
        except Exception:
            pass

    now_str = datetime.now().isoformat()
    new_ann = Announcement(
        title=ann.title,
        message=ann.message,
        priority=ann.priority,
        audience_type=ann.audience_type,
        recipient_type=ann.recipient_type,
        created_by=created_by_user,
        scheduled_at=ann.scheduled_at,
        expires_at=ann.expires_at,
        status=ann.status,
        created_at=now_str,
        updated_at=now_str
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    
    if new_ann.status == 'Published':
        _publish_announcement(new_ann, ann.selected_companies, db)

    return {"success": True, "announcement_id": new_ann.id, "message": "Announcement created"}

@super_admin_router.post("/announcements/{id}/publish")
def publish_announcement(id: int, request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        return JSONResponse(status_code=404, content={"success": False, "message": "Announcement not found"})
    
    if ann.status == 'Published':
        return JSONResponse(status_code=400, content={"success": False, "message": "Already published"})
        
    ann.status = 'Published'
    db.commit()
    
    _publish_announcement(ann, [], db)
    return {"success": True, "message": "Announcement published successfully"}

@super_admin_router.delete("/announcements/{id}")
def delete_announcement(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if ann:
        db.delete(ann)
        db.commit()
    return {"message": "Announcement deleted"}

def _publish_announcement(ann: Announcement, selected_companies: list, db: Session):
    query = db.query(User)
    
    if ann.audience_type == 'Selected Companies' and selected_companies:
        query = query.filter(User.company_id.in_(selected_companies))
        
    if ann.recipient_type == 'Company Head':
        query = query.filter(User.role == 'COMPANY_HEAD')
    elif ann.recipient_type == 'Company HR':
        query = query.filter(User.role == 'COMPANY_HR')
    elif ann.recipient_type == 'Both':
        query = query.filter(User.role.in_(['COMPANY_HEAD', 'COMPANY_HR']))
        
    matching_users = query.all()
    
    now_str = datetime.now().isoformat()
    recipients = []
    for u in matching_users:
        if u.company_id:
            rec = AnnouncementRecipient(
                announcement_id=ann.id,
                company_id=u.company_id,
                user_id=u.id,
                is_read=False,
                delivered_at=now_str,
                created_at=now_str
            )
            recipients.append(rec)
            
        if recipients:
            db.add_all(recipients)
            db.commit()

# --- SUPPORT TICKETS (SUPER ADMIN) ---
@super_admin_router.get("/support/tickets", response_model=list[schemas.SupportTicketResponse])
def get_all_tickets(current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.id.desc()).all()
    for t in tickets:
        setattr(t, "messages", [])
    return tickets

@super_admin_router.get("/support/tickets/{id}", response_model=schemas.SupportTicketResponse)
def get_admin_ticket(id: int, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    messages = db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id == ticket.id).order_by(models.TicketMessage.id.asc()).all()
    for msg in messages:
        attachments = db.query(models.TicketAttachment).filter(models.TicketAttachment.message_id == msg.id).all()
        setattr(msg, "attachments", attachments)
    setattr(ticket, "messages", messages)
    
    return ticket

@super_admin_router.patch("/support/tickets/{id}", response_model=schemas.SupportTicketResponse)
def update_ticket(id: int, update: schemas.SupportTicketUpdate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    old_status = ticket.status
    old_priority = ticket.priority
    
    if update.status:
        ticket.status = update.status
    if update.priority:
        ticket.priority = update.priority
        
    ticket.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(ticket)
    
    action_details = []
    if old_status != ticket.status:
        action_details.append(f"Status: {old_status} -> {ticket.status}")
        # Notify Company
        user_notif = models.AppNotification(
            company_id=ticket.company_id,
            title="Ticket Status Updated",
            message=f"Your ticket {ticket.ticket_id} is now {ticket.status}",
            category="Support",
            severity="Info",
            timestamp=datetime.now().isoformat(),
            targetRole=ticket.created_by_role
        )
        db.add(user_notif)
        
    if old_priority != ticket.priority:
        action_details.append(f"Priority: {old_priority} -> {ticket.priority}")
        
    if action_details:
        audit_log = models.AuditLog(
            company_id=ticket.company_id,
            timestamp=datetime.now().isoformat(),
            userId=str(current_admin.id),
            userEmail=current_admin.email,
            userRole="Super Admin",
            action="Updated Support Ticket",
            module="Support",
            details=f"Updated {ticket.ticket_id}. " + ", ".join(action_details),
            ipAddress="127.0.0.1"
        )
        db.add(audit_log)
        db.commit()
        
    messages = db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id == ticket.id).all()
    setattr(ticket, "messages", messages)
    
    return ticket

@super_admin_router.post("/support/tickets/{id}/reply", response_model=schemas.TicketMessageResponse)
def admin_reply_ticket(id: int, reply: schemas.TicketMessageCreate, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    msg = models.TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        sender_name=f"{current_admin.firstName} {current_admin.lastName}",
        sender_role="Super Admin",
        message=reply.message,
        created_at=datetime.now().isoformat()
    )
    db.add(msg)
    
    ticket.updated_at = datetime.now().isoformat()
    ticket.status = "Waiting for Customer"
    
    user_notif = models.AppNotification(
        company_id=ticket.company_id,
        title="New Ticket Reply",
        message=f"Super Admin replied to {ticket.ticket_id}",
        category="Support",
        severity="Info",
        timestamp=datetime.now().isoformat(),
        targetRole=ticket.created_by_role
    )
    db.add(user_notif)
    
    db.commit()
    db.refresh(msg)
    setattr(msg, "attachments", [])
    return msg

DEFAULT_MATRIX_MODULES = [
    'dashboard', 'driver_management', 'vehicle_management', 'trip_management', 
    'vendor_management', 'booking_management', 'live_tracking', 'fuel_management', 
    'maintenance_management', 'compliance_management', 'contract_management', 
    'reports_analytics', 'notifications', 'support_tickets', 'audit_logs', 
    'company_settings', 'user_roles'
]
DEFAULT_MATRIX_ACTIONS = ['view', 'create', 'update', 'delete', 'import', 'export']

def build_full_matrix(db_perms):
    existing_map = {(p.module, p.action): True for p in db_perms}
    full_matrix = []
    for m in DEFAULT_MATRIX_MODULES:
        for a in DEFAULT_MATRIX_ACTIONS:
            full_matrix.append({
                "module": m,
                "action": a,
                "enabled": existing_map.get((m, a), False)
            })
    return full_matrix

@super_admin_router.get("/matrix-permissions")
def get_matrix_permissions(company_id: int, role_name: str, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        role = db.query(Role).filter(Role.company_id == company_id, Role.name == role_name).first()
        is_new_role = False
        if not role:
            role = Role(name=role_name, description=f"{role_name.replace('_', ' ').title()} Role", company_id=company_id)
            db.add(role)
            db.commit()
            db.refresh(role)
            is_new_role = True

        if is_new_role:
            new_perms = []
            for m in DEFAULT_MATRIX_MODULES:
                for a in DEFAULT_MATRIX_ACTIONS:
                    new_perms.append(Permission(role_id=role.id, module=m, action=a))
            if new_perms:
                db.bulk_save_objects(new_perms)
                db.commit()
            
        perms = db.query(Permission).filter(Permission.role_id == role.id).all()
        return build_full_matrix(perms)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@super_admin_router.put("/matrix-permissions")
def update_matrix_permissions(company_id: int, role_name: str, permissions: List[PermissionUpdate], request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        role = db.query(Role).filter(Role.company_id == company_id, Role.name == role_name).first()
        if not role:
            role = Role(name=role_name, description=f"{role_name.replace('_', ' ').title()} Role", company_id=company_id)
            db.add(role)
            db.flush()
            log_auth_event(db, request, current_admin.email, "super_admin", f"Created Auto-Role: {role_name} for Company {company_id}", "Success", current_admin.name, "CMS Enterprise")

        existing_perms = db.query(Permission).filter(Permission.role_id == role.id).all()
        existing_map = {(p.module, p.action): p for p in existing_perms}

        seen = set()
        for p in permissions:
            key = (p.module, p.action)
            if key in seen:
                continue
            seen.add(key)

            if key in existing_map:
                if not p.enabled:
                    db.delete(existing_map[key])
            else:
                if p.enabled:
                    db.add(Permission(role_id=role.id, module=p.module, action=p.action))

        db.commit()
        log_auth_event(db, request, current_admin.email, "super_admin", f"Updated Matrix Permissions for {role_name} (Company {company_id})", "Success", current_admin.name, "CMS Enterprise")
        
        updated_perms = db.query(Permission).filter(Permission.role_id == role.id).all()
        return build_full_matrix(updated_perms)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
