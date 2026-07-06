from fastapi import Security, HTTPException, Request
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
import time
from database.db import get_db
from models import all_models as models
from fastapi import Depends

API_KEY_NAME = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_integration_by_key(
    request: Request,
    api_key: str = Security(api_key_header),
    db: Session = Depends(get_db)
) -> models.Integration:
    if not api_key:
        # Log missing key
        log_api_request(db, request, None, 401, "Missing API Key")
        raise HTTPException(status_code=401, detail="Missing API Key")
        
    integration = db.query(models.Integration).filter(
        models.Integration.api_key == api_key,
        models.Integration.is_active == True
    ).first()
    
    if not integration:
        log_api_request(db, request, None, 403, "Invalid or Inactive API Key")
        raise HTTPException(status_code=403, detail="Invalid or Inactive API Key")
        
    # We could implement rate limiting here using Redis, 
    # but for now we rely on a simpler approach or external gateway
    # since we don't have Redis guaranteed.
    
    return integration

def log_api_request(
    db: Session, 
    request: Request, 
    integration: models.Integration | None,
    status_code: int,
    error_detail: str = None,
    start_time: float = None
):
    from datetime import datetime
    processing_time = time.time() - start_time if start_time else 0.0
    
    log = models.ApiLog(
        company_id=integration.company_id if integration else None,
        integration_id=integration.id if integration else None,
        endpoint=str(request.url.path),
        ip_address=request.client.host if request.client else "unknown",
        method=request.method,
        status_code=status_code,
        response=error_detail or "Success",
        processing_time=processing_time,
        validation_errors=error_detail if status_code >= 400 else None,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
