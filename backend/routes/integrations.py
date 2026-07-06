from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import secrets

from database.db import get_db
from models import all_models as models
from routes.all_routes import get_current_user

integrations_router = APIRouter(prefix="/api/v1/integrations", tags=["Integrations"])

class IntegrationCreate(BaseModel):
    name: str

class IntegrationResponse(BaseModel):
    id: int
    name: str
    api_key: str
    api_secret: str
    webhook_secret: Optional[str] = None
    is_active: bool
    rate_limit: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@integrations_router.post("", response_model=IntegrationResponse)
def create_integration(
    payload: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Only company admins can manage integrations")
    
    # Check duplicate name
    existing = db.query(models.Integration).filter(
        models.Integration.company_id == current_user.company_id,
        models.Integration.name == payload.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Integration name already exists")
    
    api_key = f"ak_{secrets.token_hex(16)}"
    api_secret = f"sk_{secrets.token_hex(32)}"
    webhook_secret = f"wh_{secrets.token_hex(16)}"

    new_integration = models.Integration(
        company_id=current_user.company_id,
        name=payload.name,
        api_key=api_key,
        api_secret=api_secret,
        webhook_secret=webhook_secret,
        is_active=True,
        rate_limit=1000,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_integration)
    db.commit()
    db.refresh(new_integration)
    
    return new_integration

@integrations_router.get("", response_model=List[IntegrationResponse])
def get_integrations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    integrations = db.query(models.Integration).filter(
        models.Integration.company_id == current_user.company_id
    ).all()
    return integrations

@integrations_router.put("/{integration_id}/status")
def toggle_integration_status(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    integration = db.query(models.Integration).filter(
        models.Integration.id == integration_id,
        models.Integration.company_id == current_user.company_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    integration.is_active = not integration.is_active
    integration.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Integration {'activated' if integration.is_active else 'deactivated'} successfully"}

@integrations_router.get("/logs", response_model=List[Dict[str, Any]])
def get_api_logs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ['company_admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    logs = db.query(models.ApiLog).filter(
        models.ApiLog.company_id == current_user.company_id
    ).order_by(models.ApiLog.created_at.desc()).limit(100).all()
    
    return [
        {
            "id": log.id,
            "integration_id": log.integration_id,
            "endpoint": log.endpoint,
            "method": log.method,
            "status_code": log.status_code,
            "response": log.response,
            "processing_time": log.processing_time,
            "created_at": log.created_at
        } for log in logs
    ]

@integrations_router.post("/{integration_id}/regenerate", response_model=IntegrationResponse)
def regenerate_keys(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    integration = db.query(models.Integration).filter(
        models.Integration.id == integration_id,
        models.Integration.company_id == current_user.company_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    integration.api_key = f"ak_{secrets.token_hex(16)}"
    integration.api_secret = f"sk_{secrets.token_hex(32)}"
    integration.webhook_secret = f"wh_{secrets.token_hex(16)}"
    integration.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(integration)
    
    return integration

@integrations_router.get("/logs")
def get_integration_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    logs = db.query(models.ApiLog).filter(
        models.ApiLog.company_id == current_user.company_id
    ).order_by(models.ApiLog.created_at.desc()).limit(100).all()
    
    return logs
