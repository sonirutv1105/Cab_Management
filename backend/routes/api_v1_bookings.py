from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
import time

from database.db import get_db
from models import all_models as models
from utils.api_auth import get_integration_by_key, log_api_request
from services.booking_import_service import process_booking_import

api_v1_bookings_router = APIRouter(prefix="/api/v1/bookings", tags=["External Booking API"])

@api_v1_bookings_router.post("/import")
async def import_booking(
    request: Request,
    db: Session = Depends(get_db),
    integration: models.Integration = Depends(get_integration_by_key)
):
    start_time = time.time()
    try:
        raw_payload = await request.json()
    except Exception:
        log_api_request(db, request, integration, 400, "Invalid JSON payload", start_time)
        return {"status": "error", "message": "Invalid JSON payload"}

    success, message, data = process_booking_import(db, integration, raw_payload)
    
    if not success:
        status_code = 409 if message == "Duplicate Booking" else 400
        if message == "Internal Error":
            status_code = 500
            
        log_api_request(db, request, integration, status_code, f"{message}: {data}", start_time)
        return {"status": "error", "message": message, "errors": data}
        
    log_api_request(db, request, integration, 201, "Success", start_time)
    
    # Broadcast to websocket or SSE would happen here (Phase 8 Real-time Updates)
    # We will assume frontend polling or a later SSE implementation if required.
    
    return {"status": "success", "message": message, "data": data}

@api_v1_bookings_router.get("/status/{external_id}")
def check_booking_status(
    external_id: str,
    request: Request,
    db: Session = Depends(get_db),
    integration: models.Integration = Depends(get_integration_by_key)
):
    start_time = time.time()
    booking = db.query(models.Booking).filter(
        models.Booking.company_id == integration.company_id,
        models.Booking.external_booking_id == external_id
    ).first()
    
    if not booking:
        log_api_request(db, request, integration, 404, "Booking not found", start_time)
        return {"status": "error", "message": "Booking not found"}
        
    log_api_request(db, request, integration, 200, "Success", start_time)
    return {
        "status": "success",
        "data": {
            "external_id": external_id,
            "internal_id": booking.id,
            "manager_status": booking.managerApproval,
            "hr_status": booking.hrStatus,
            "sync_status": booking.sync_status
        }
    }

@api_v1_bookings_router.post("/cancel/{external_id}")
def cancel_booking(
    external_id: str,
    request: Request,
    db: Session = Depends(get_db),
    integration: models.Integration = Depends(get_integration_by_key)
):
    start_time = time.time()
    booking = db.query(models.Booking).filter(
        models.Booking.company_id == integration.company_id,
        models.Booking.external_booking_id == external_id
    ).first()
    
    if not booking:
        log_api_request(db, request, integration, 404, "Booking not found", start_time)
        return {"status": "error", "message": "Booking not found"}
        
    if booking.hrStatus == 'Allocated':
        log_api_request(db, request, integration, 400, "Cannot cancel allocated booking", start_time)
        return {"status": "error", "message": "Cannot cancel allocated booking"}
        
    booking.managerApproval = "Rejected"
    booking.hrStatus = "Rejected"
    booking.sync_status = "Cancelled by API"
    db.commit()
    
    log_api_request(db, request, integration, 200, "Success", start_time)
    return {"status": "success", "message": "Booking cancelled successfully"}
