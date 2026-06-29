import os
from sqlalchemy import create_engine, text

# Load env or use defaults
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "cab_management"

url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
engine = create_engine(url)

with engine.connect() as conn:
    # Add to drivers table
    try:
        conn.execute(text("ALTER TABLE drivers ADD COLUMN vehicleAssignmentType VARCHAR(50);"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN selfVehicleNumber VARCHAR(50);"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN selfVehicleType VARCHAR(50);"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN selfRcNumber VARCHAR(50);"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN selfInsuranceExpiry VARCHAR(50);"))
        print("Added columns to drivers table")
    except Exception as e:
        print(f"Error drivers: {e}")

    # Add to driver_drafts table
    try:
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN vehicle_assignment_type VARCHAR(50);"))
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN self_vehicle_number VARCHAR(50);"))
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN self_vehicle_type VARCHAR(50);"))
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN self_rc_number VARCHAR(50);"))
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN self_insurance_expiry VARCHAR(50);"))
        print("Added columns to driver_drafts table")
    except Exception as e:
        print(f"Error driver_drafts: {e}")

    conn.commit()

print("Migration completed.")
