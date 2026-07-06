import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database.db import SessionLocal
from models.all_models import Vehicle, MaintenanceLog
from services.all_services import maintenance_log_service
from validations.all_schemas import MaintenanceLogCreate, MaintenanceLogUpdate

db = SessionLocal()

# Create a test vehicle
v = Vehicle(plateNumber="TEST-SYNC-01", model="TestModel", status="Available")
db.add(v)
db.commit()
db.refresh(v)

print(f"Initial Vehicle Status: {v.status}")

# Create maintenance log (Scheduled)
ml_data = MaintenanceLogCreate(
    vehicleId=v.id,
    category="Repair",
    description="Test",
    cost=100.0,
    vendorName="Test Vendor",
    startDate="2026-07-03",
    endDate="2026-07-04",
    status="Scheduled"
)

ml = maintenance_log_service.create(db, ml_data, company_id=v.company_id)

db.refresh(v)
print(f"Vehicle Status after Scheduled Maintenance: {v.status}")
assert v.status == "Under Maintenance", "Status should be Under Maintenance"

# Update to completed
ml_update = MaintenanceLogUpdate(status="Completed")
maintenance_log_service.update(db, ml.id, ml_update, company_id=v.company_id)

db.refresh(v)
print(f"Vehicle Status after Completed Maintenance: {v.status}")
assert v.status == "Available", "Status should be Available"

# Cleanup
db.delete(ml)
db.delete(v)
db.commit()
print("Tests passed successfully!")
