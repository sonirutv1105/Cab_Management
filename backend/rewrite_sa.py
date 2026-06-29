import os

super_admin_code = '''from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import random

from database.db import get_db
from models.all_models import SuperAdmin, Company, Subscription, User, Task, Tender, Announcement, Role, Permission
import secrets
from utils.security import create_access_token, verify_password, get_password_hash
from pydantic import BaseModel

super_admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

class LoginRequest(BaseModel):
    email: str
    password: str

class CompanyCreate(BaseModel):
    name: str
    company_type: str
    industry: str = None
    gst_number: str = None
    pan_number: str = None
    registration_number: str = None
    head_name: str = None
    head_email: str = None
    head_phone: str = None
    plan: str = "Basic"
    billing_cycle: str = "Monthly"

@super_admin_router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(SuperAdmin).filter(SuperAdmin.email == request.email).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if admin.hashed_password != request.password and not verify_password(request.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"sub": admin.email, "role": "super_admin"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": admin.name,
            "email": admin.email,
            "role": admin.role
        }
    }

@super_admin_router.post("/companies")
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    if company.head_email:
        existing_user = db.query(User).filter(User.email == company.head_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Company Head email is already registered")

    code = f"CMP-{random.randint(1000, 9999)}"
    
    new_company = Company(
        id=str(uuid.uuid4()),
        name=company.name,
        code=code,
        company_type=company.company_type,
        industry=company.industry,
        gst_number=company.gst_number,
        pan_number=company.pan_number,
        registration_number=company.registration_number,
        head_name=company.head_name,
        head_email=company.head_email,
        head_phone=company.head_phone,
        status="Active",
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_company)
    
    new_sub = Subscription(
        id=str(uuid.uuid4()),
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
            id=f"usr_{uuid.uuid4().hex[:8]}",
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
    
    db.commit()
    db.refresh(new_company)
    
    return {
        "company": new_company,
        "credentials": {
            "email": company.head_email,
            "password": generated_password
        }
    }

@super_admin_router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
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

@super_admin_router.get("/companies/{id}")
def get_company_by_id(id: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@super_admin_router.put("/companies/{id}/status")
def update_company_status(id: str, status_update: dict, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.status = status_update.get("status", company.status)
    db.commit()
    return {"message": "Status updated successfully", "status": company.status}

@super_admin_router.delete("/companies/{id}")
def delete_company(id: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()
    return {"message": "Company deleted"}

@super_admin_router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_companies = db.query(Company).count()
    active_companies = db.query(Company).filter(Company.status == "Active").count()
    trial_companies = db.query(Company).filter(Company.status == "Trial").count()
    suspended_companies = db.query(Company).filter(Company.status == "Suspended").count()
    
    subs = db.query(Subscription).all()
    revenue = sum([299 if s.plan_name == "Premium" else 99 if s.plan_name == "Standard" else 0 for s in subs])
    
    subscriptions_status = [
        {"name": "Active", "value": len([s for s in subs if s.status == "Active"])},
        {"name": "Expiring Soon", "value": len([s for s in subs if s.status == "Expiring"])},
        {"name": "Expired", "value": len([s for s in subs if s.status == "Expired"])}
    ]
    
    return {
        "kpis": [
            { "label": "Total Companies", "value": str(total_companies), "trend": "+5%", "isUp": True },
            { "label": "Active Companies", "value": str(active_companies), "trend": "+2%", "isUp": True },
            { "label": "Trial Companies", "value": str(trial_companies), "trend": "-1%", "isUp": False },
            { "label": "Suspended", "value": str(suspended_companies), "trend": "0%", "isUp": False },
            { "label": "Monthly Revenue", "value": f"${revenue}", "trend": "+12%", "isUp": True }
        ],
        "subscriptions_status": subscriptions_status,
        "recent_companies": get_companies(db)[:5]
    }

# --- USERS ---
class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "User"
    companyName: str = None
    department: str = None

@super_admin_router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@super_admin_router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User email already exists")
    
    generated_password = secrets.token_urlsafe(6)
    new_user = User(
        id=f"usr_{uuid.uuid4().hex[:8]}",
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
def update_user(id: str, user_update: UserCreate, db: Session = Depends(get_db)):
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
def update_user_status(id: str, status_update: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = status_update.get("status", user.status)
    db.commit()
    return user

@super_admin_router.delete("/users/{id}")
def delete_user(id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"message": "User deleted"}

# --- ROLES & PERMISSIONS ---
class RoleCreate(BaseModel):
    name: str
    description: str = None
    company_id: str = None

class PermissionUpdate(BaseModel):
    module: str
    action: str
    enabled: bool

@super_admin_router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

@super_admin_router.post("/roles")
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    new_role = Role(
        id=str(uuid.uuid4()),
        name=role.name,
        description=role.description,
        company_id=role.company_id
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@super_admin_router.put("/roles/{id}")
def update_role(id: str, role_update: RoleCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.name = role_update.name
    role.description = role_update.description
    db.commit()
    db.refresh(role)
    return role

@super_admin_router.delete("/roles/{id}")
def delete_role(id: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == id).first()
    if role:
        db.delete(role)
        db.commit()
    return {"message": "Role deleted"}

@super_admin_router.get("/roles/{id}/permissions")
def get_role_permissions(id: str, db: Session = Depends(get_db)):
    perms = db.query(Permission).filter(Permission.role_id == id).all()
    return perms

@super_admin_router.put("/roles/{id}/permissions")
def update_role_permissions(id: str, permissions: List[PermissionUpdate], db: Session = Depends(get_db)):
    # Delete existing
    db.query(Permission).filter(Permission.role_id == id).delete()
    # Insert new ones that are enabled
    new_perms = []
    for p in permissions:
        if p.enabled:
            perm = Permission(
                id=str(uuid.uuid4()),
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
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@super_admin_router.post("/tasks")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        id=str(uuid.uuid4()),
        **task.model_dump(),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@super_admin_router.put("/tasks/{id}")
def update_task(id: str, task_update: TaskCreate, db: Session = Depends(get_db)):
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
def update_task_status(id: str, status_update: dict, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status_update.get("status", task.status)
    db.commit()
    return task

@super_admin_router.delete("/tasks/{id}")
def delete_task(id: str, db: Session = Depends(get_db)):
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
def get_tenders(db: Session = Depends(get_db)):
    return db.query(Tender).all()

@super_admin_router.post("/tenders")
def create_tender(tender: TenderCreate, db: Session = Depends(get_db)):
    new_tender = Tender(
        id=str(uuid.uuid4()),
        **tender.model_dump(),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    return new_tender

@super_admin_router.put("/tenders/{id}")
def update_tender(id: str, tender_update: TenderCreate, db: Session = Depends(get_db)):
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
def update_tender_status(id: str, status_update: dict, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    tender.status = status_update.get("status", tender.status)
    db.commit()
    return tender

@super_admin_router.delete("/tenders/{id}")
def delete_tender(id: str, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == id).first()
    if tender:
        db.delete(tender)
        db.commit()
    return {"message": "Tender deleted"}

# --- ANNOUNCEMENTS ---
class AnnouncementCreate(BaseModel):
    title: str
    content: str = None
    type: str = "Info"
    status: str = "Active"

@super_admin_router.get("/announcements")
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).all()

@super_admin_router.post("/announcements")
def create_announcement(ann: AnnouncementCreate, db: Session = Depends(get_db)):
    new_ann = Announcement(
        id=str(uuid.uuid4()),
        **ann.model_dump(),
        date=datetime.now().strftime("%Y-%m-%d"),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return new_ann

@super_admin_router.delete("/announcements/{id}")
def delete_announcement(id: str, db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if ann:
        db.delete(ann)
        db.commit()
    return {"message": "Announcement deleted"}
'''

with open(r"d:\Cab_Management_system\backend\routes\super_admin.py", "w") as f:
    f.write(super_admin_code)

print("Updated super_admin.py")
