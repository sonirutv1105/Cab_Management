from sqlalchemy.orm import Session
from pydantic import BaseModel, ValidationError, Field
from typing import Optional
from datetime import datetime
import json
from models import all_models as models

class ExternalBookingPayload(BaseModel):
    external_booking_id: str = Field(..., description="Unique ID of the booking in the external system")
    passengerName: str
    bookingDate: str
    rideTime: str
    pickupPoint: str
    dropPoint: str
    purpose: Optional[str] = "Corporate Travel"
    source: Optional[str] = "API"

def process_booking_import(
    db: Session, 
    integration: models.Integration, 
    raw_payload: dict
) -> tuple[bool, str, dict]:
    """
    Returns (Success, Message, ResponseData/Errors)
    """
    try:
        # 1. Validation Layer
        validated_data = ExternalBookingPayload(**raw_payload)
    except ValidationError as e:
        return False, "Validation Error", e.errors()

    # 2. Duplicate Detection
    existing = db.query(models.Booking).filter(
        models.Booking.company_id == integration.company_id,
        models.Booking.external_booking_id == validated_data.external_booking_id
    ).first()
    
    if existing:
        return False, "Duplicate Booking", {"detail": f"Booking {validated_data.external_booking_id} already exists."}

    # 3. Create Booking
    new_booking = models.Booking(
        company_id=integration.company_id,
        passengerName=validated_data.passengerName,
        bookingDate=validated_data.bookingDate,
        rideTime=validated_data.rideTime,
        pickupPoint=validated_data.pickupPoint,
        dropPoint=validated_data.dropPoint,
        purpose=validated_data.purpose,
        managerApproval="Approved",  # Auto-approve API bookings by default
        hrStatus="Pending",          # Needs HR assignment
        booking_source=validated_data.source,
        external_booking_id=validated_data.external_booking_id,
        integration_id=integration.id,
        api_received_at=datetime.utcnow(),
        sync_status="Synced",
        raw_payload=json.dumps(raw_payload)
    )
    
    db.add(new_booking)
    try:
        db.commit()
        db.refresh(new_booking)
    except Exception as e:
        db.rollback()
        return False, "Internal Error", {"detail": str(e)}

    return True, "Booking imported successfully", {"booking_id": new_booking.id, "external_id": new_booking.external_booking_id}
