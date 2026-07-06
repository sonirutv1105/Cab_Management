import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database.db import engine

def migrate():
    print("Starting migration...")
    with engine.connect() as conn:
        # Check if columns exist
        result = conn.execute(text("SHOW COLUMNS FROM bookings")).fetchall()
        columns = [row[0] for row in result]

        queries = []
        if 'booking_source' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN booking_source VARCHAR(50) DEFAULT 'Manual'")
        if 'external_booking_id' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN external_booking_id VARCHAR(100) NULL")
        if 'integration_id' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN integration_id INT NULL")
        if 'api_received_at' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN api_received_at DATETIME NULL")
        if 'sync_status' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN sync_status VARCHAR(50) DEFAULT 'Manual'")
        if 'raw_payload' not in columns:
            queries.append("ALTER TABLE bookings ADD COLUMN raw_payload TEXT NULL")

        for q in queries:
            print(f"Executing: {q}")
            conn.execute(text(q))
            
        # Add foreign key separately if needed
        # We can add a unique index if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE bookings ADD CONSTRAINT uq_company_external_booking UNIQUE (company_id, external_booking_id)"))
            print("Added unique constraint.")
        except Exception as e:
            print(f"Unique constraint might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE bookings ADD CONSTRAINT fk_bookings_integration_id FOREIGN KEY (integration_id) REFERENCES integrations(id)"))
            print("Added foreign key constraint.")
        except Exception as e:
            print(f"Foreign key constraint might already exist: {e}")

        conn.commit()
    print("Migration finished!")

if __name__ == "__main__":
    migrate()
